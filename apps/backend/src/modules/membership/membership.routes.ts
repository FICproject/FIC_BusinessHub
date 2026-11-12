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

// GET /api/v1/membership/renewal-quote - Quote renewal fee vs available wallet balance
membershipRouter.get('/renewal-quote', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { getOrCreateWallet } = await import('../wallet/wallet.routes');
    const wallet = await getOrCreateWallet(req.user.userId);
    const renewalFee = 5999;
    const availableBalance = wallet.availableBalance || 0;
    const isSufficient = availableBalance >= renewalFee;
    const shortfall = isSufficient ? 0 : renewalFee - availableBalance;

    res.status(200).json({
      success: true,
      data: {
        planName: 'Annual Renewal Plan (Year 2+)',
        renewalFee,
        currency: 'INR',
        validityDays: 365,
        availableWalletBalance: availableBalance,
        isSufficient,
        shortfall
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/membership/renew-with-wallet - Atomically deduct renewal from wallet & extend membership
membershipRouter.post('/renew-with-wallet', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { getOrCreateWallet } = await import('../wallet/wallet.routes');
    const { WalletTransactionModel } = await import('../wallet/wallet.model');
    const { WalletTransactionType, WalletTransactionStatus } = await import('@fic/shared-types');

    const wallet = await getOrCreateWallet(req.user.userId);
    const renewalFee = 5999;

    if (wallet.availableBalance < renewalFee) {
      const shortfall = renewalFee - wallet.availableBalance;
      throw new AppError(
        `Insufficient wallet balance. Renewal requires ₹5,999. Shortfall is ₹${shortfall.toLocaleString('en-IN')}. Please add funds to complete renewal.`,
        400
      );
    }

    // Atomically deduct renewal fee from wallet
    const balanceAfter = wallet.availableBalance - renewalFee;
    wallet.availableBalance -= renewalFee;
    wallet.totalBalance -= renewalFee;
    wallet.withdrawalEligibleBalance = Math.max(0, wallet.withdrawalEligibleBalance - renewalFee);
    wallet.membershipEligibleBalance = Math.max(0, wallet.membershipEligibleBalance - renewalFee);
    wallet.totalRenewalSpent += renewalFee;
    await wallet.save();

    // Create immutable ledger transaction
    const transactionId = `TXN_RNW_${Date.now()}`;
    const transaction = await WalletTransactionModel.create({
      transactionId,
      walletId: wallet._id,
      userId: req.user.userId,
      transactionType: WalletTransactionType.MEMBERSHIP_RENEWAL,
      direction: 'DEBIT',
      amount: renewalFee,
      currency: 'INR',
      description: 'Annual Membership Renewal (Year 2+) via FIC Wallet',
      status: WalletTransactionStatus.COMPLETED,
      balanceAfter,
      sourceReferenceId: `RNW_MEM_${Date.now()}`
    });

    // Compute new membership end date (+365 days from now or current end date)
    const existingMembership = await MembershipModel.findOne({ userId: req.user.userId }).sort({ createdAt: -1 });
    let newStartDate = new Date();
    let newEndDate = new Date();
    if (existingMembership && existingMembership.endDate && new Date(existingMembership.endDate) > new Date()) {
      newStartDate = new Date(existingMembership.endDate);
      newEndDate = new Date(existingMembership.endDate);
      newEndDate.setDate(newEndDate.getDate() + 365);
    } else {
      newEndDate.setDate(newEndDate.getDate() + 365);
    }

    const renewedMembership = await MembershipModel.create({
      userId: req.user.userId,
      status: MembershipStatus.ACTIVE,
      planType: 'ANNUAL_RENEWAL',
      amount: renewalFee,
      startDate: newStartDate,
      endDate: newEndDate,
      paymentId: transaction._id
    });

    await UserModel.findByIdAndUpdate(req.user.userId, {
      isMembershipActive: true,
      activeMembershipId: renewedMembership._id
    });

    res.status(200).json({
      success: true,
      message: 'Membership renewed successfully for 365 days using FIC Wallet balance.',
      data: {
        membership: renewedMembership,
        wallet,
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
});

