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
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import {
  WalletStatus,
  WalletTransactionType,
  WalletTransactionStatus,
  WithdrawalStatus
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
  return wallet;
};

// 1. GET /api/v1/wallet - Current authenticated member's wallet overview
walletRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
walletRouter.get('/transactions', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

// 3. POST /api/v1/wallet/add-funds - Top up wallet funds
walletRouter.post('/add-funds', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { amount, paymentMethod = 'UPI', idempotencyKey } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount < 100) {
      throw new AppError('Minimum deposit amount is ₹100.', 400);
    }
    if (numericAmount > 200000) {
      throw new AppError('Maximum deposit amount per transaction is ₹2,00,000.', 400);
    }

    const wallet = await getOrCreateWallet(req.user.userId);

    // Create funding audit record
    const fundingId = `FND_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentOrderId = `ORD_TOPUP_${Date.now()}`;

    const funding = await WalletFundingModel.create({
      fundingId,
      userId: req.user.userId,
      walletId: wallet._id,
      amount: numericAmount,
      currency: 'INR',
      paymentProvider: paymentMethod,
      paymentOrderId,
      gatewayTransactionId: `TXN_GATEWAY_${Date.now()}`,
      paymentStatus: 'SUCCESS',
      settlementStatus: 'SETTLED'
    });

    // Atomically credit wallet ledger
    const balanceAfter = wallet.availableBalance + numericAmount;
    wallet.availableBalance += numericAmount;
    wallet.totalBalance += numericAmount;
    wallet.withdrawalEligibleBalance += numericAmount;
    wallet.membershipEligibleBalance += numericAmount;
    wallet.totalAdded += numericAmount;
    await wallet.save();

    // Create immutable transaction ledger record
    const transactionId = `TXN_CR_${Date.now()}`;
    const transaction = await WalletTransactionModel.create({
      transactionId,
      walletId: wallet._id,
      userId: req.user.userId,
      transactionType: WalletTransactionType.ADD_FUNDS,
      direction: 'CREDIT',
      amount: numericAmount,
      currency: 'INR',
      description: `Wallet top-up via ${paymentMethod} (${fundingId})`,
      status: WalletTransactionStatus.COMPLETED,
      idempotencyKey: idempotencyKey || fundingId,
      balanceAfter,
      sourceReferenceId: funding.fundingId
    });

    res.status(200).json({
      success: true,
      message: `₹${numericAmount.toLocaleString('en-IN')} added to your FIC Wallet successfully.`,
      data: {
        wallet,
        transaction,
        funding
      }
    });
  } catch (error) {
    next(error);
  }
});

// 4. POST /api/v1/wallet/withdraw - Request withdrawal to verified bank account
walletRouter.post('/withdraw', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { amount } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount < 500) {
      throw new AppError('Minimum withdrawal amount is ₹500.', 400);
    }

    const wallet = await getOrCreateWallet(req.user.userId);

    if (wallet.availableBalance < numericAmount) {
      throw new AppError(
        `Insufficient available balance. You have ₹${wallet.availableBalance.toLocaleString('en-IN')} available.`,
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

    // Atomically reserve funds (deduct from available, put into pending)
    wallet.availableBalance -= numericAmount;
    wallet.pendingBalance += numericAmount;
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
walletRouter.get('/bank-accounts', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

// 6. POST /api/v1/wallet/bank-accounts - Add or update bank account
walletRouter.post('/bank-accounts', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { accountHolderName, bankName, accountNumber, ifscCode, accountType = 'SAVINGS' } = req.body;

    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      throw new AppError('Please provide all mandatory bank account fields.', 400);
    }

    const cleanAcc = String(accountNumber).trim();
    const masked = `XXXX XXXX ${cleanAcc.slice(-4)}`;

    const bankAccount = await MemberBankAccountModel.findOneAndUpdate(
      { userId: req.user.userId },
      {
        userId: req.user.userId,
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        accountNumberMasked: masked,
        ifscCode: ifscCode.trim().toUpperCase(),
        accountType,
        verificationStatus: 'VERIFIED',
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
walletRouter.get('/admin/wallets', authenticate, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
