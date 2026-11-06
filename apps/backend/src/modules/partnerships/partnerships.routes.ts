import { Router, Response, NextFunction } from 'express';
import { PartnershipRequestModel } from './partnerships.model';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';

export const partnershipsRouter = Router();

// Retiring independent partnership creation to enforce FIC intermediary business model
partnershipsRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    res.status(410).json({
      success: false,
      message:
        'Independent direct partnership creation is retired. All commercial introductions, distributor vetting, and vendor requirements are coordinated exclusively through FIC Intermediary Governance in the Marketplace.'
    });
  } catch (error) {
    next(error);
  }
});

// Read-only historical audit reference for existing submissions
partnershipsRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const records = await PartnershipRequestModel.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
});

