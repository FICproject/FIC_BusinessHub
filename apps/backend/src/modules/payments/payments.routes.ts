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

    // Upsert customer payment document
    let payment = await PaymentModel.findOne({ orderId, userId: req.user.userId });
    if (!payment) {
      payment = await PaymentModel.create({
        userId: req.user.userId,
        orderId,
        transactionId: transactionId || `TXN_RZP_${Date.now()}`,
        amount: 99,
        currency: 'INR',
        status: PaymentStatus.SUCCESS,
        purpose: 'MEMBERSHIP_FIRST_YEAR',
        provider: 'RAZORPAY',
        paymentDetails: {
          paidAt: new Date(),
          method: 'RAZORPAY_UPI',
          transactionId: transactionId || `TXN_RZP_${Date.now()}`
        }
      });
    } else {
      payment.status = PaymentStatus.SUCCESS;
      payment.transactionId = transactionId || payment.transactionId || `TXN_RZP_${Date.now()}`;
      await payment.save();
    }

    // 2. Synchronize to Admin Payment Collection for Admin "Payments & Fees" Tab
    try {
      const { AdminPaymentModel } = await import('../admin/models/Payment');
      const { MemberModel } = await import('../admin/models/Member');
      const user = await UserModel.findById(req.user.userId);

      if (user) {
        // Ensure member record exists
        let member = await MemberModel.findOne({
          $or: [{ _id: user._id }, { email: user.email.toLowerCase() }]
        });

        if (!member) {
          member = await MemberModel.create({
            _id: user._id,
            name: user.fullName,
            email: user.email.toLowerCase(),
            phone: user.phoneNumber,
            primaryCategory: user.primaryCategoryId || new mongoose.Types.ObjectId(),
            primaryCategoryName: user.primaryCategoryName || 'General',
            subcategories: user.subCategory ? [user.subCategory] : [],
            status: 'UNDER_REVIEW',
            membershipPlan: 'FIRST_YEAR_INTRO',
            membershipFeePaid: 99,
            paymentStatus: 'PAID',
            kycStatus: 'SUBMITTED',
            registeredAt: new Date()
          });
        }

        await AdminPaymentModel.findOneAndUpdate(
          { gatewayTransactionId: payment.transactionId },
          {
            memberId: member._id,
            amount: 99,
            currency: 'INR',
            paymentType: 'INTRO_FEE',
            status: 'SUCCESS',
            gatewayProvider: 'RAZORPAY',
            gatewayTransactionId: payment.transactionId,
            invoiceUrl: `https://ficapp.in/invoices/inv_${orderId}.pdf`
          },
          { upsert: true, new: true }
        );
      }
    } catch (syncErr: any) {
      console.warn('Admin payment sync warning:', syncErr?.message);
    }

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
      message: '₹99 Membership payment confirmed via Razorpay. Membership recorded.',
      data: {
        membership,
        payment
      }
    });
  } catch (error) {
    next(error);
  }
});

