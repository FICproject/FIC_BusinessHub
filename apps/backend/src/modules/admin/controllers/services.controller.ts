import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { ServiceListingModel } from '../models/ServiceListing';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';

const router = Router();

// Helper: Synchronize administrative service changes into the public marketplace collection (servicelistings)
async function syncToPublicListing(adminDoc: any) {
  try {
    const { ServiceListingModel: PublicListingModel } = await import('../../services/services.model');
    const { UserModel } = await import('../../users/users.model');
    const { CategoryModel } = await import('../../categories/categories.model');

    // 1. Resolve Provider User ID
    let resolvedProviderId = adminDoc.providerId;
    if ((!resolvedProviderId || !mongoose.isValidObjectId(resolvedProviderId)) && adminDoc.providerEmail) {
      const user = await UserModel.findOne({ email: adminDoc.providerEmail.toLowerCase() }).select('_id primaryCategoryId');
      if (user) {
        resolvedProviderId = user._id;
      }
    }

    // 2. Resolve Category ID
    let resolvedCategoryId = adminDoc.categoryId;
    if (!resolvedCategoryId || !mongoose.isValidObjectId(resolvedCategoryId)) {
      if (adminDoc.categorySlug || adminDoc.categoryName) {
        const cat = await CategoryModel.findOne({
          $or: [
            { slug: adminDoc.categorySlug },
            { name: adminDoc.categoryName }
          ]
        }).select('_id');
        if (cat) resolvedCategoryId = cat._id;
      }
      if (!resolvedCategoryId && resolvedProviderId) {
        const user = await UserModel.findById(resolvedProviderId).select('primaryCategoryId');
        if (user?.primaryCategoryId) resolvedCategoryId = user.primaryCategoryId;
      }
      if (!resolvedCategoryId) {
        const defaultCat = await CategoryModel.findOne({}).select('_id');
        resolvedCategoryId = defaultCat?._id;
      }
    }

    const isApproved = adminDoc.status === 'APPROVED';
    const isDraft = adminDoc.status === 'DRAFT';
    const isDeleted = adminDoc.status === 'DELETED' || adminDoc.status === 'ARCHIVED';

    const updatePayload: Record<string, any> = {
      title: adminDoc.title,
      description: adminDoc.description,
      shortDescription: adminDoc.description ? adminDoc.description.substring(0, 140) : adminDoc.title,
      categoryName: adminDoc.categoryName || 'Business & Entrepreneurship',
      categorySlug: adminDoc.categorySlug || 'business-entrepreneurship',
      subcategoryName: adminDoc.subcategoryName || '',
      servicesOffered: adminDoc.servicesOffered || [],
      skills: adminDoc.skills || [],
      tags: adminDoc.tags || [],
      coverageArea: adminDoc.coverageArea || 'Pan India',
      deliveryMode: adminDoc.deliveryMode || 'ONLINE',
      status: adminDoc.status,
      // Only APPROVED listings are active in the marketplace. DRAFT, DELETED, or REJECTED are strictly inactive.
      isActive: isApproved && !isDraft && !isDeleted,
      adminFeedback: adminDoc.rejectionReason || undefined,
      updatedAt: new Date()
    };

    if (resolvedProviderId && mongoose.isValidObjectId(resolvedProviderId)) {
      updatePayload.providerId = new mongoose.Types.ObjectId(resolvedProviderId);
    }
    if (resolvedCategoryId && mongoose.isValidObjectId(resolvedCategoryId)) {
      updatePayload.categoryId = new mongoose.Types.ObjectId(resolvedCategoryId);
    }
    if (adminDoc.subcategoryId && mongoose.isValidObjectId(adminDoc.subcategoryId)) {
      updatePayload.subcategoryId = new mongoose.Types.ObjectId(adminDoc.subcategoryId);
    }

    await PublicListingModel.findByIdAndUpdate(
      adminDoc._id,
      { $set: updatePayload },
      { upsert: true }
    );
  } catch (syncErr) {
    console.warn('syncToPublicListing warning:', syncErr);
  }
}

// GET /api/admin/services - List service listings with admin moderation data
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, categoryId } = req.query;
    const filter: any = {
      status: { $nin: ['DELETED', 'ARCHIVED'] }
    };
    if (status && status !== 'ALL') {
      filter.status = status;
    }
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

    const cleanQuery = id && id.length === 24 ? { _id: id } : { title, providerEmail };

    const payload: any = {
      title,
      description,
      categoryName: categoryName || 'Business & Entrepreneurship',
      categorySlug,
      subcategoryName,
      providerPrivateName: providerPrivateName || 'FIC Member',
      providerEmail: providerEmail ? providerEmail.toLowerCase() : 'member@ficapp.in',
      pricingEstimate: pricingEstimate || 'Custom Quote',
      servicesOffered: servicesOffered || [],
      skills: skills || [],
      tags: tags || [],
      coverageArea: coverageArea || 'Pan India',
      deliveryMode: deliveryMode || 'ONLINE',
      status: status || 'PENDING_APPROVAL'
    };

    if (categoryId && mongoose.isValidObjectId(categoryId)) payload.categoryId = categoryId;
    if (providerId && mongoose.isValidObjectId(providerId)) payload.providerId = providerId;
    if (subcategoryId && mongoose.isValidObjectId(subcategoryId)) payload.subcategoryId = subcategoryId;

    const updated = await ServiceListingModel.findOneAndUpdate(
      cleanQuery,
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Synchronize to public marketplace collection
    if (updated) {
      await syncToPublicListing(updated);
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/services/member-sync - Fetch live moderation statuses for a specific member's services
router.get('/member-sync', async (req, res) => {
  try {
    const { email, providerId } = req.query;
    // Exclude DELETED and ARCHIVED records so they do not resurrect in the member's UI
    const filter: any = {
      status: { $nin: ['DELETED', 'ARCHIVED'] }
    };
    if (email) filter.providerEmail = (email as string).toLowerCase();
    if (providerId && mongoose.isValidObjectId(providerId)) filter.providerId = providerId;

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
    await syncToPublicListing(listing);

    await logAdminAction(req, `SERVICE_LISTING_${status}`, 'ServiceListing', id, { rejectionReason });
    res.json({ success: true, message: `Service listing status updated to ${status}`, data: listing });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/services/:id - Delete a service listing from both admin and public collections
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteFilter: any = mongoose.isValidObjectId(id)
      ? { _id: new mongoose.Types.ObjectId(id) }
      : { $or: [{ _id: id }, { title: id }] };

    // 1. Mark DELETED in Admin collection
    const adminDoc = await ServiceListingModel.findOneAndUpdate(
      deleteFilter,
      { $set: { status: 'DELETED', isActive: false, updatedAt: new Date() } },
      { new: true }
    );

    if (adminDoc) {
      await syncToPublicListing(adminDoc);
    } else {
      // If not found in admin collection, mark directly in public collection
      const { ServiceListingModel: PublicListingModel } = await import('../../services/services.model');
      await PublicListingModel.findOneAndUpdate(deleteFilter, {
        $set: { status: 'DELETED', isActive: false, updatedAt: new Date() }
      });
    }

    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
