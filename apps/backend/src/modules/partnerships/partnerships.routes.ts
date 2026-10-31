import { Router, Response, NextFunction } from 'express';
import { PartnershipRequestModel } from './partnerships.model';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';

export const partnershipsRouter = Router();

partnershipsRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { organizationName, partnershipType, proposalSummary, targetIndustries } = req.body;

    const record = await PartnershipRequestModel.create({
      userId: req.user.userId,
      organizationName,
      partnershipType,
      proposalSummary,
      targetIndustries: targetIndustries || [],
      status: 'SUBMITTED'
    });

    res.status(201).json({
      success: true,
      message: 'Partnership requirement submitted. FIC will review for matching business tie-ups.',
      data: record
    });
  } catch (error) {
    next(error);
  }
});

partnershipsRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const records = await PartnershipRequestModel.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
});
