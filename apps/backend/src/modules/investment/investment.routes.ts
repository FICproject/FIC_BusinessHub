import { Router, Response, NextFunction } from 'express';
import { InvestmentProfileModel } from './investment.model';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';

export const investmentRouter = Router();

// Submit private investment or funding interest (Strictly confidential)
investmentRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { profileType, sectors, amountRange, stagePreference, pitchSummary } = req.body;

    const record = await InvestmentProfileModel.create({
      userId: req.user.userId,
      profileType,
      sectors: sectors || [],
      amountRange,
      stagePreference,
      pitchSummary,
      isConfidential: true,
      status: 'SUBMITTED'
    });

    res.status(201).json({
      success: true,
      message: 'Investment/Funding interest recorded securely. Handled under FIC strict confidentiality.',
      data: record
    });
  } catch (error) {
    next(error);
  }
});

investmentRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const records = await InvestmentProfileModel.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
});

