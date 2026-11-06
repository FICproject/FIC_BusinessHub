import { Router, Response, NextFunction } from 'express';
import { PaymentModel } from './payments.model';
import { MembershipModel } from '../membership/membership.model';
import { UserModel } from '../users/users.model';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import { MembershipStatus, PaymentStatus } from '@fic/shared-types';

export const paymentsRouter = Router();

// Create Membership Payment Order (₹99 First-Year)
paymentsRouter.post('/membership/order', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const amount = 99; // ₹99 introductory pricing as per blueprint
    const orderId = `ORD_FIC_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const payment = await PaymentModel.create({
      userId: req.user.userId,
      orderId,
      amount,
      currency: 'INR',
      status: PaymentStatus.INITIATED,
      purpose: 'MEMBERSHIP_FIRST_YEAR',
      provider: 'MOCK_GATEWAY'
    });

    res.status(200).json({
      success: true,
      message: 'Payment order generated successfully.',
      data: {
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        purpose: payment.purpose
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verify & Confirm Payment (Instant activation for membership)
paymentsRouter.post('/membership/confirm', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const { orderId, transactionId } = req.body;

    if (!orderId) {
      throw new AppError('Order ID is required.', 400);
    }

    const payment = await PaymentModel.findOne({ orderId, userId: req.user.userId });
    if (!payment) {
      throw new AppError('Payment order not found.', 404);
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      throw new AppError('Payment has already been processed and activated.', 400);
    }

    // In production, reject unverified mock confirmation
    if (process.env.NODE_ENV === 'production' && payment.provider === 'MOCK_GATEWAY') {
      throw new AppError('Direct client confirmation is disabled in production. Payments must be verified via gateway webhook or signature.', 403);
    }

    // Mark payment as success
    payment.status = PaymentStatus.SUCCESS;
    payment.transactionId = transactionId || `TXN_${Date.now()}`;
    await payment.save();

    // Create / activate membership for 1 year
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    const membership = await MembershipModel.create({
      userId: req.user.userId,
      status: MembershipStatus.ACTIVE,
      planType: 'FIRST_YEAR_INTRO',
      amount: payment.amount,
      startDate,
      endDate,
      paymentId: payment._id
    });

    // Update user record
    await UserModel.findByIdAndUpdate(req.user.userId, {
      isMembershipActive: true,
      activeMembershipId: membership._id
    });

    res.status(200).json({
      success: true,
      message: '₹99 Membership payment confirmed. Membership activated for 1 Year.',
      data: {
        membership,
        payment
      }
    });
  } catch (error) {
    next(error);
  }
});

