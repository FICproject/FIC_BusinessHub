import { verifyBankAccountDetails } from './bank-verification.service';
import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  MemberWalletModel,
  WalletTransactionModel,
  WalletFundingModel,
  WalletWithdrawalModel,
  MemberBankAccountModel
} from './wallet.model';
import { UserModel } from '../users/users.model';
import { authenticate, requireActiveVerifiedMember, requireRoles, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import {
  WalletStatus,
  WalletTransactionType,
  WalletTransactionStatus,
  WithdrawalStatus,
  UserRole
} from '@fic/shared-types';

export const walletRouter = Router();

// Helper to ensure wallet exists for user
export const getOrCreateWallet = async (userId: string | mongoose.Types.ObjectId) => {
  let wallet = await MemberWalletModel.findOne({ userId });
  if (!wallet) {
    wallet = await MemberWalletModel.create({
      userId,
      currency: 'INR',
      totalBalance: 0,
      availableBalance: 0,
      pendingBalance: 0,
      restrictedBalance: 0,
      withdrawalEligibleBalance: 0,
      membershipEligibleBalance: 0,
      totalAdded: 0,
      totalWithdrawn: 0,
      totalReferralEarnings: 0,
      totalRenewalSpent: 0,
      status: WalletStatus.ACTIVE
    });
  }

  // Ensure withdrawalEligibleBalance is strictly synchronized with (availableBalance - restrictedBalance)
  const calculatedWithdrawable = Math.max(0, (wallet.availableBalance || 0) - (wallet.restrictedBalance || 0));
  if (wallet.withdrawalEligibleBalance !== calculatedWithdrawable) {
    wallet.withdrawalEligibleBalance = calculatedWithdrawable;
    await wallet.save();
  }

  return wallet;
};

// 1. GET /api/v1/wallet - Current authenticated member's wallet overview
walletRouter.get('/', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const wallet = await getOrCreateWallet(req.user.userId);
    res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/v1/wallet/transactions - List transactions with optional type/status filters
walletRouter.get('/transactions', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { type, status, limit = 50 } = req.query;
    const filter: any = { userId: req.user.userId };

    if (type && type !== 'ALL') filter.transactionType = type;
    if (status && status !== 'ALL') filter.status = status;

    const transactions = await WalletTransactionModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
});

// 3. POST /api/v1/wallet/add-funds - Strictly requires verified Razorpay payment signature
walletRouter.post('/add-funds', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentMethod } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError(
        'Direct unverified wallet top-up is disabled. Complete Razorpay checkout via /api/v1/payments/create-order and /api/v1/payments/verify.',
        400,
        'RAZORPAY_VERIFICATION_REQUIRED'
      );
    }

    const { verifyCheckoutPaymentForUser } = await import('../payments/payments.service');
    const verified = await verifyCheckoutPaymentForUser({
      userId: req.user.userId,
      razorpayOrderId: String(razorpay_order_id),
      razorpayPaymentId: String(razorpay_payment_id),
      razorpaySignature: String(razorpay_signature),
      paymentMethod: paymentMethod ? String(paymentMethod) : undefined
    });

    const wallet = await getOrCreateWallet(req.user.userId);

    res.status(200).json({
      success: true,
      message: `₹${verified.payment.amount.toLocaleString('en-IN')} added to your FIC Wallet successfully.`,
      data: {
        wallet,
        payment: verified.payment
      }
    });
  } catch (error) {
    next(error);
  }
});

// 4. POST /api/v1/wallet/withdraw - Request withdrawal to verified bank account
walletRouter.post('/withdraw', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { amount } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount < 500) {
      throw new AppError('Minimum withdrawal amount is ₹500.', 400);
    }

    const wallet = await getOrCreateWallet(req.user.userId);

    const withdrawable = Math.max(0, (wallet.availableBalance || 0) - (wallet.restrictedBalance || 0));
    if (withdrawable < numericAmount) {
      throw new AppError(
        `Insufficient withdrawable balance. You have ₹${withdrawable.toLocaleString('en-IN')} available for withdrawal.`,
        400
      );
    }

    // Verify bank account exists
    const bankAccount = await MemberBankAccountModel.findOne({
      userId: req.user.userId,
      verificationStatus: 'VERIFIED'
    });

    if (!bankAccount) {
      throw new AppError(
        'Please link and verify your bank account before requesting a withdrawal.',
        400
      );
    }

    // Atomically reserve funds (deduct from available and withdrawable, put into pending)
    wallet.availableBalance -= numericAmount;
    wallet.pendingBalance += numericAmount;
    wallet.totalWithdrawn = (wallet.totalWithdrawn || 0) + numericAmount;
    wallet.withdrawalEligibleBalance = Math.max(0, (wallet.availableBalance || 0) - (wallet.restrictedBalance || 0));
    await wallet.save();

    const withdrawalId = `WDR_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const withdrawal = await WalletWithdrawalModel.create({
      withdrawalId,
      userId: req.user.userId,
      walletId: wallet._id,
      amount: numericAmount,
      fee: 0,
      netAmount: numericAmount,
      bankAccountReference: `${bankAccount.bankName} (${bankAccount.accountNumberMasked})`,
      status: WithdrawalStatus.REQUESTED
    });

    // Create transaction ledger record in PENDING status
    const transaction = await WalletTransactionModel.create({
      transactionId: `TXN_WD_${Date.now()}`,
      walletId: wallet._id,
      userId: req.user.userId,
      transactionType: WalletTransactionType.WITHDRAWAL,
      direction: 'DEBIT',
      amount: numericAmount,
      currency: 'INR',
      description: `Withdrawal request to ${bankAccount.bankName} (${bankAccount.accountNumberMasked})`,
      status: WalletTransactionStatus.PENDING,
      balanceAfter: wallet.availableBalance,
      sourceReferenceId: withdrawalId
    });

    res.status(200).json({
      success: true,
      message: `Withdrawal request for ₹${numericAmount.toLocaleString('en-IN')} submitted. Under review by FIC Accounts Desk.`,
      data: {
        withdrawal,
        transaction,
        wallet
      }
    });
  } catch (error) {
    next(error);
  }
});

// 5. GET /api/v1/wallet/bank-accounts - Get user's bank accounts
walletRouter.get('/bank-accounts', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const accounts = await MemberBankAccountModel.find({ userId: req.user.userId });
    res.status(200).json({
      success: true,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
});

// 6. POST /api/v1/wallet/bank-accounts - Add or update bank account with verification layer
walletRouter.post('/bank-accounts', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { accountHolderName, bankName, accountNumber, confirmAccountNumber, ifscCode, accountType = 'SAVINGS' } = req.body;

    const verification = await verifyBankAccountDetails({
      accountHolderName,
      bankName,
      accountNumber,
      confirmAccountNumber,
      ifscCode
    });

    if (!verification.isValid) {
      throw new AppError(verification.message, 400);
    }

    const bankAccount = await MemberBankAccountModel.findOneAndUpdate(
      { userId: req.user.userId },
      {
        userId: req.user.userId,
        accountHolderName: accountHolderName.trim(),
        bankName: verification.bankName,
        accountNumberMasked: verification.accountNumberMasked,
        ifscCode: verification.ifscCode,
        accountType,
        verificationStatus: verification.status,
        verifiedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Bank account verified and linked successfully.',
      data: bankAccount
    });
  } catch (error) {
    next(error);
  }
});

// 7. Admin: GET /api/v1/wallet/admin/wallets - List member wallets for admin monitoring
walletRouter.get('/admin/wallets', authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const wallets = await MemberWalletModel.find().populate('userId', 'fullName email phoneNumber primaryCategory');
    const withdrawals = await WalletWithdrawalModel.find().populate('userId', 'fullName email');
    res.status(200).json({
      success: true,
      data: {
        wallets,
        withdrawals
      }
    });
  } catch (error) {
    next(error);
  }
});

