import { Router, Response, NextFunction } from 'express';
import { authenticate, requireActiveVerifiedMember, requireRoles, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { ServiceListingModel } from './services.model';
import { CategoryModel } from '../categories/categories.model';
import { UserModel } from '../users/users.model';
import { ServiceListingStatus, UserRole } from '@fic/shared-types';

export const servicesRouter = Router();

// 1. Get all services created by the authenticated member
servicesRouter.get('/my', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const services = await ServiceListingModel.find({ providerId: userId, isActive: true })
      .sort({ updatedAt: -1 })
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .lean();

    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    next(error);
  }
});

// 2. Create a new service listing (Member action)
servicesRouter.post('/', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const {
      categoryId,
      subcategoryId,
      categoryName,
      categorySlug,
      subcategoryName,
      title,
      shortDescription,
      description,
      servicesOffered,
      skills,
      tags,
      targetCustomers,
      coverageArea,
      deliveryMode,
      portfolioUrl,
      supportingDocument,
      submitNow
    } = req.body;

    const userDoc = await UserModel.findById(userId);
    if (!userDoc) {
      res.status(404).json({ success: false, message: 'Member profile not found' });
      return;
    }

    // Derive authoritative category & subcategory from member registration profile
    const registeredCategoryName = userDoc.primaryCategoryName || 'Business & Entrepreneurship';
    const registeredSubcategoryName = userDoc.primarySubcategoryName || userDoc.subCategory || '';

    // Backend validation: Reject any attempt to submit a different sector or subcategory
    if (categoryName && categoryName !== registeredCategoryName) {
      res.status(400).json({
        success: false,
        message: `Primary sector is locked to your registered category (${registeredCategoryName}). You cannot submit services under a different category.`
      });
      return;
    }
    if (subcategoryName && subcategoryName !== registeredSubcategoryName) {
      res.status(400).json({
        success: false,
        message: `Subcategory is locked to your registered specialization (${registeredSubcategoryName}). You cannot submit services under a different subcategory.`
      });
      return;
    }

    let resolvedCategoryId = userDoc.primaryCategoryId;
    let resolvedCategorySlug = 'business-entrepreneurship';
    if (resolvedCategoryId) {
      const catDoc = await CategoryModel.findById(resolvedCategoryId);
      if (catDoc) {
        resolvedCategorySlug = catDoc.slug;
      }
    } else {
      const catDoc = await CategoryModel.findOne({ name: registeredCategoryName });
      if (catDoc) {
        resolvedCategoryId = catDoc._id as any;
        resolvedCategorySlug = catDoc.slug;
      }
    }

    const newService = await ServiceListingModel.create({
      providerId: userId,
      categoryId: resolvedCategoryId,
      subcategoryId,
      categoryName: registeredCategoryName,
      categorySlug: resolvedCategorySlug,
      subcategoryName: registeredSubcategoryName,
      title,
      shortDescription: shortDescription || (description ? description.substring(0, 150) : title),
      description: description || title,
      servicesOffered: servicesOffered || [],
      skills: skills || [],
      tags: tags || [],
      targetCustomers: targetCustomers || [],
      coverageArea: coverageArea || 'Pan India',
      deliveryMode: deliveryMode || 'ONLINE',
      portfolioUrl,
      supportingDocument,
      status: submitNow ? ServiceListingStatus.PENDING_APPROVAL : ServiceListingStatus.DRAFT,
      isActive: true
    });

    // Also synchronize into Admin ServiceListing collection so it immediately appears in Admin Service Moderation Desk & KPI
    try {
      const { ServiceListingModel: AdminServiceListingModel } = await import('../admin/models/ServiceListing');
      const { UserModel } = await import('../users/users.model');
      const user = await UserModel.findById(userId);
      await AdminServiceListingModel.findOneAndUpdate(
        { _id: newService._id },
        {
          $set: {
            _id: newService._id,
            title,
            description,
            categoryId: resolvedCategoryId || undefined,
            categoryName: registeredCategoryName,
            categorySlug: resolvedCategorySlug,
            subcategoryId: subcategoryId || undefined,
            subcategoryName: registeredSubcategoryName,
            providerId: userId,
            providerPrivateName: user?.fullName || 'FIC Member',
            providerEmail: user?.email || '',
            pricingEstimate: 'Custom Quote',
            servicesOffered: servicesOffered || [],
            skills: skills || [],
            tags: tags || [],
            coverageArea: coverageArea || 'Pan India',
            deliveryMode: deliveryMode || 'ONLINE',
            status: submitNow ? 'PENDING_APPROVAL' : 'DRAFT'
          }
        },
        { upsert: true, new: true }
      );
    } catch (syncErr) {
      console.warn('Admin service sync error:', syncErr);
    }

    res.status(201).json({
      success: true,
      message: submitNow
        ? 'Service created and submitted for FIC review.'
        : 'Service saved as draft.',
      data: newService
    });
  } catch (error) {
    next(error);
  }
});

// 3. Get single service details
servicesRouter.get('/:id', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const service = await ServiceListingModel.findById(id)
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .lean();

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
});

// 4. Update service listing
servicesRouter.put('/:id', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    let service = await ServiceListingModel.findOne({ _id: id, providerId: userId });
    if (!service) {
      service = await ServiceListingModel.findById(id);
      if (service && service.providerId && service.providerId.toString() !== userId) {
        res.status(403).json({ success: false, message: 'Unauthorized to delete this service' });
        return;
      }
    }
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    // Backend validation: Category and Subcategory are locked to member registration details
    if (req.body.categoryName && req.body.categoryName !== service.categoryName) {
      res.status(400).json({
        success: false,
        message: 'Primary sector cannot be modified. It is locked to your registered profile category.'
      });
      return;
    }
    if (req.body.subcategoryName && req.body.subcategoryName !== service.subcategoryName) {
      res.status(400).json({
        success: false,
        message: 'Subcategory cannot be modified. It is locked to your registered profile specialization.'
      });
      return;
    }

    const updatableFields = [
      'title',
      'shortDescription',
      'description',
      'servicesOffered',
      'skills',
      'tags',
      'targetCustomers',
      'coverageArea',
      'deliveryMode',
      'portfolioUrl',
      'supportingDocument'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (service as any)[field] = req.body[field];
      }
    });

    // If previously rejected, allow re-submitting
    if (req.body.submitNow) {
      service.status = ServiceListingStatus.PENDING_APPROVAL;
    }

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    next(error);
  }
});

// 5. Submit service for FIC approval
servicesRouter.post('/:id/submit', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const service = await ServiceListingModel.findOne({ _id: id, providerId: userId });
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found or unauthorized' });
      return;
    }

    service.status = ServiceListingStatus.PENDING_APPROVAL;
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service successfully submitted for FIC Admin review.',
      data: service
    });
  } catch (error) {
    next(error);
  }
});

// 6. Approve service (FIC Reviewer / Admin action)
servicesRouter.post('/:id/approve', authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const service = await ServiceListingModel.findById(id);

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    service.status = ServiceListingStatus.APPROVED;
    service.adminFeedback = undefined;
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service approved and published to Universal Marketplace.',
      data: service
    });
  } catch (error) {
    next(error);
  }
});

// 7. Reject service with feedback (FIC Reviewer / Admin action)
servicesRouter.post('/:id/reject', authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const service = await ServiceListingModel.findById(id);

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    service.status = ServiceListingStatus.REJECTED;
    service.adminFeedback = reason || 'Please provide more details regarding your capabilities and scope.';
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service marked as requiring revision.',
      data: service
    });
  } catch (error) {
    next(error);
  }
});

// 8. Delete / Deactivate service
servicesRouter.delete('/:id', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const service = await ServiceListingModel.findOne({ _id: id, providerId: userId });
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found or unauthorized' });
      return;
    }

    service.isActive = false;
    service.status = 'DELETED' as any;
    await service.save();

    // Mirror deletion to Admin ServiceListing
    try {
      const { ServiceListingModel: AdminServiceListingModel } = await import('../admin/models/ServiceListing');
      await AdminServiceListingModel.findByIdAndUpdate(id, {
        status: 'DELETED',
        isActive: false
      });
    } catch {}

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// 9. Provider Incoming Service Requests (dispatched by FIC Admin Desk / Members)
servicesRouter.get('/requests/incoming', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const { FicRequestModel } = await import('../admin/models/FicRequest');
    const { MemberModel } = await import('../admin/models/Member');

    const myServices = await ServiceListingModel.find({ providerId: userId }).select('_id title categoryName').lean();
    const myServiceIds = myServices.map((s: any) => s._id);

    const member = await MemberModel.findOne({
      $or: [{ _id: userId }, { email: req.user?.email }]
    });

    const targetProviderOr = [
      { targetProviderId: userId },
      ...(member ? [{ targetProviderId: member._id }] : []),
      { targetServiceId: { $in: myServiceIds } }
    ];

    const ficRequests = await FicRequestModel.find({ $or: targetProviderOr })
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('requesterId', 'name email phone primaryCategoryName')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = ficRequests.map((r: any) => {
      const responseStatus = r.providerResponse || 'PENDING';
      return {
        id: r._id.toString(),
        _id: r._id.toString(),
        title: r.title,
        description: r.description,
        requirementNotes: r.description,
        serviceTitle: (r.targetServiceId as any)?.title || r.title,
        serviceCategory: (r.targetServiceId as any)?.categoryName || 'Marketplace Capability',
        requesterName: r.requesterName || (r.requesterId as any)?.name || 'Confidential FIC Member',
        requesterCategory: r.requesterCategory || (r.requesterId as any)?.primaryCategoryName || 'FIC Member',
        status: responseStatus,
        providerResponse: responseStatus,
        providerResponseAt: r.providerResponseAt,
        adminStatus: r.status,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
        createdAt: r.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
});

// 10. Provider Decision: Accept or Decline service request
servicesRouter.patch('/requests/:id/respond', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { decision, reason } = req.body;

    if (!decision || !['ACCEPTED', 'DECLINED'].includes(decision)) {
      res.status(400).json({ success: false, message: 'Valid decision ("ACCEPTED" or "DECLINED") is required.' });
      return;
    }

    const { FicRequestModel } = await import('../admin/models/FicRequest');
    const { MemberModel } = await import('../admin/models/Member');
    const { notifyAdmins } = await import('../notifications/notifications.service');

    const member = await MemberModel.findOne({ $or: [{ _id: userId }, { email: req.user?.email }] });
    const ficReq = await FicRequestModel.findById(id).populate('targetServiceId');
    if (!ficReq) {
      res.status(404).json({ success: false, message: 'Service request not found.' });
      return;
    }

    ficReq.providerResponse = decision;
    ficReq.providerResponseAt = new Date();

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const providerName = member?.name || req.user?.email || 'Assigned Provider';
    ficReq.internalNotes.push(
      `[${timestamp} by ${providerName}]: Provider responded with ${decision}.${reason ? ` Reason: ${reason}` : ''}`
    );

    if (decision === 'ACCEPTED') {
      ficReq.status = 'IN_PROGRESS';
    } else {
      ficReq.status = 'UNDER_REVIEW';
    }

    await ficReq.save();

    try {
      await notifyAdmins({
        eventType: 'PROVIDER_RESPONDED',
        title: `Provider ${decision}: ${ficReq.title}`,
        message: `Provider ${providerName} has ${decision} the service assignment for "${ficReq.title}".`,
        link: '/requests',
        priority: 'MEDIUM'
      });
    } catch {}

    res.status(200).json({
      success: true,
      message: `Service request has been successfully ${decision.toLowerCase()}.`,
      data: {
        id: ficReq._id.toString(),
        providerResponse: ficReq.providerResponse,
        status: ficReq.status
      }
    });
  } catch (error) {
    next(error);
  }
});
