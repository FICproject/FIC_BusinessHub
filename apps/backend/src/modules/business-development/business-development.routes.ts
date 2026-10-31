import { Router, Response, NextFunction } from 'express';
import { BusinessDevRequestModel } from './business-development.model';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';

export const businessDevRouter = Router();

businessDevRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { businessName, supportType, currentChallenges, expectedOutcomes } = req.body;

    const request = await BusinessDevRequestModel.create({
      userId: req.user.userId,
      businessName,
      supportType,
      currentChallenges,
      expectedOutcomes,
      status: 'SUBMITTED'
    });

    res.status(201).json({
      success: true,
      message: 'Business development request submitted. FIC will assign a specialist.',
      data: request
    });
  } catch (error) {
    next(error);
  }
});

businessDevRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const requests = await BusinessDevRequestModel.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
});

