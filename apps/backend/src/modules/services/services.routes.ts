import { Router, Response, NextFunction } from 'express';
import { authenticate, requireRoles, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { ServiceListingModel } from './services.model';
import { ServiceListingStatus, UserRole } from '@fic/shared-types';

export const servicesRouter = Router();

// 1. Get all services created by the authenticated member
servicesRouter.get('/my', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
servicesRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    const newService = await ServiceListingModel.create({
      providerId: userId,
      categoryId,
      subcategoryId,
      categoryName,
      categorySlug,
      subcategoryName,
      title,
      shortDescription: shortDescription || description.substring(0, 150),
      description,
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
servicesRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
servicesRouter.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const service = await ServiceListingModel.findOne({ _id: id, providerId: userId });
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found or unauthorized' });
      return;
    }

    const updatableFields = [
      'title',
      'shortDescription',
      'description',
      'categoryId',
      'subcategoryId',
      'categoryName',
      'categorySlug',
      'subcategoryName',
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
servicesRouter.post('/:id/submit', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
servicesRouter.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const service = await ServiceListingModel.findOne({ _id: id, providerId: userId });
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found or unauthorized' });
      return;
    }

    service.isActive = false;
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});
