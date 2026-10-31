import { Router, Response, NextFunction } from 'express';
import { ServiceRequestModel } from './connections.model';
import { ServiceListingModel } from '../services/services.model';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import { ServiceRequestStatus } from '@fic/shared-types';

export const connectionsRouter = Router();

// Member submits a service request routed to FIC
connectionsRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { serviceId, requirementNotes } = req.body;

    if (!serviceId || !requirementNotes) {
      throw new AppError('Service ID and requirement notes are required.', 400);
    }

    const service = await ServiceListingModel.findById(serviceId);
    if (!service) {
      throw new AppError('Service listing not found.', 404);
    }

    const request = await ServiceRequestModel.create({
      serviceId,
      requesterId: req.user.userId,
      providerId: service.providerId,
      requirementNotes,
      status: ServiceRequestStatus.SUBMITTED,
      ficNotes: 'Request received. Assigned to FIC Coordinator for requirement validation.'
    });

    res.status(201).json({
      success: true,
      message: 'Your service request has been received by FIC. Our coordinator will review and contact you shortly.',
      data: request
    });
  } catch (error) {
    next(error);
  }
});

// Member views all their submitted requests
connectionsRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const requests = await ServiceRequestModel.find({ requesterId: req.user.userId })
      .populate('serviceId', 'title categoryId pricingType')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
});
