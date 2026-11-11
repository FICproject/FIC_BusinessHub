import { Router, Response } from 'express';
import { ServiceListingModel } from '../models/ServiceListing';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';

const router = Router();

// GET /api/admin/services - List service listings with admin moderation data
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, categoryId } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (categoryId) filter.categoryId = categoryId;

    const listings = await ServiceListingModel.find(filter)
      .populate('providerId', 'name email phone status')
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    // Format fields so Admin UI displays cleanly even if populated or direct
    const formatted = listings.map((item: any) => ({
      ...item,
      id: item._id.toString(),
      providerPrivateName: item.providerPrivateName || item.providerId?.name || 'FIC Member',
      providerEmail: item.providerEmail || item.providerId?.email || 'N/A',
      categoryName: item.categoryName || item.categoryId?.name || 'General Sector'
    }));

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/services/sync - Synchronize service submissions directly into database
router.post('/sync', async (req, res) => {
  try {
    const {
      _id,
      id,
      title,
      description,
      categoryId,
      categoryName,
      categorySlug,
      subcategoryId,
      subcategoryName,
      providerId,
      providerPrivateName,
      providerEmail,
      pricingEstimate,
      servicesOffered,
      skills,
      tags,
      coverageArea,
      deliveryMode,
      status
    } = req.body;

    if (!title || !description) {
      res.status(400).json({ success: false, error: 'Title and description are required' });
      return;
    }

    const query = id ? { $or: [{ _id: id.length === 24 ? id : undefined }, { title, providerEmail }] } : { title, providerEmail };
    // Remove undefined fields in query
    const cleanQuery = id && id.length === 24 ? { _id: id } : { title, providerEmail };

    const payload: any = {
      title,
      description,
      categoryName: categoryName || 'Business & Entrepreneurship',
      categorySlug,
      subcategoryName,
      providerPrivateName: providerPrivateName || 'FIC Member',
      providerEmail: providerEmail || 'member@ficapp.in',
      pricingEstimate: pricingEstimate || 'Custom Quote',
      servicesOffered: servicesOffered || [],
      skills: skills || [],
      tags: tags || [],
      coverageArea: coverageArea || 'Pan India',
      deliveryMode: deliveryMode || 'ONLINE',
      status: status || 'PENDING_APPROVAL'
    };

    if (categoryId && categoryId.length === 24) payload.categoryId = categoryId;
    if (providerId && providerId.length === 24) payload.providerId = providerId;

    const updated = await ServiceListingModel.findOneAndUpdate(
      cleanQuery,
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/services/member-sync - Fetch live moderation statuses for a specific member's services
router.get('/member-sync', async (req, res) => {
  try {
    const { email, providerId } = req.query;
    const filter: any = {};
    if (email) filter.providerEmail = (email as string).toLowerCase();
    if (providerId) filter.providerId = providerId;

    if (!email && !providerId) {
      res.status(400).json({ success: false, error: 'Email or providerId required' });
      return;
    }

    const services = await ServiceListingModel.find(filter).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: services });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/services/:id/moderate - Approve or Reject listing
router.patch('/:id/moderate', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // 'APPROVED' | 'REJECTED' | 'SUSPENDED'

    const listing = await ServiceListingModel.findById(id);
    if (!listing) {
      res.status(404).json({ success: false, error: 'Service listing not found' });
      return;
    }

    listing.status = status;
    if (status === 'APPROVED') {
      listing.approvedAt = new Date();
      listing.rejectionReason = undefined;
    } else {
      listing.rejectionReason = rejectionReason;
    }
    await listing.save();

    // Mirror approval or status change to public marketplace collection (servicelistings)
    try {
      const { ServiceListingModel: PublicListingModel } = await import('../../services/services.model');
      await PublicListingModel.findByIdAndUpdate(
        listing._id,
        {
          $set: {
            title: listing.title,
            description: listing.description,
            shortDescription: listing.description?.substring(0, 140) || '',
            categoryName: listing.categoryName,
            categorySlug: listing.categorySlug,
            subcategoryName: listing.subcategoryName,
            servicesOffered: listing.servicesOffered || [],
            skills: listing.skills || [],
            tags: listing.tags || [],
            coverageArea: listing.coverageArea || 'Pan India',
            deliveryMode: listing.deliveryMode || 'IN_PERSON',
            status: status === 'APPROVED' ? 'APPROVED' : (status === 'REJECTED' ? 'REJECTED' : 'DRAFT'),
            isActive: status === 'APPROVED',
            adminFeedback: rejectionReason || undefined,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    } catch (syncPublicErr) {
      console.warn('Public marketplace service sync notice:', syncPublicErr);
    }

    await logAdminAction(req, `SERVICE_LISTING_${status}`, 'ServiceListing', id, { rejectionReason });
    res.json({ success: true, message: `Service listing status updated to ${status}`, data: listing });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

