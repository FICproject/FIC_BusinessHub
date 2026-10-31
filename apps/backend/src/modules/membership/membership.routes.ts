import { Router, Request, Response, NextFunction } from 'express';
import { MembershipModel } from './membership.model';
import { PaymentModel } from '../payments/payments.model';
import { UserModel } from '../users/users.model';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import { MembershipStatus, PaymentStatus } from '@fic/shared-types';

export const membershipRouter = Router();

// Membership Pricing details (Blueprint Section 2.4: 1st Year ₹99, 2nd Year ₹5,999)
membershipRouter.get('/plans', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      firstYearOffer: {
        fee: 99,
        currency: 'INR',
        billingPeriod: '1 Year',
        label: 'First-Year Introductory Membership Offer',
        description: 'Exclusive 1st year fee of ₹99. Transparent annual access to the entire FIC ecosystem.'
      },
      renewalPlan: {
        fee: 5999,
        currency: 'INR',
        billingPeriod: '1 Year',
        label: 'Annual Renewal Plan',
        description: 'Standard membership fee from second year onwards.'
      }
    }
  });
});

// Check user membership status
membershipRouter.get('/status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const membership = await MembershipModel.findOne({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: membership || { status: MembershipStatus.INACTIVE }
    });
  } catch (error) {
    next(error);
  }
});

