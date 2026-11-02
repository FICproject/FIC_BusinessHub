import mongoose, { Document, Schema } from 'mongoose';
import {
  WalletStatus,
  WalletTransactionType,
  WalletTransactionStatus,
  WithdrawalStatus
} from '@fic/shared-types';

// ==========================================
// 1. Member Wallet Schema & Model
// ==========================================
export interface IMemberWalletDocument extends Document {
  userId: mongoose.Types.ObjectId;
  currency: string;
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
  restrictedBalance: number;
  withdrawalEligibleBalance: number;
  membershipEligibleBalance: number;
  totalAdded: number;
  totalWithdrawn: number;
  totalReferralEarnings: number;
  totalRenewalSpent: number;
  status: WalletStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MemberWalletSchema = new Schema<IMemberWalletDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    currency: { type: String, default: 'INR' },
    totalBalance: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    restrictedBalance: { type: Number, default: 0 },
    withdrawalEligibleBalance: { type: Number, default: 0 },
    membershipEligibleBalance: { type: Number, default: 0 },
    totalAdded: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalReferralEarnings: { type: Number, default: 0 },
    totalRenewalSpent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(WalletStatus),
      default: WalletStatus.ACTIVE
    }
  },
  { timestamps: true }
);

export const MemberWalletModel = mongoose.model<IMemberWalletDocument>(
  'MemberWallet',
  MemberWalletSchema
);

// ==========================================
// 2. Wallet Transaction Ledger Schema & Model
// ==========================================
export interface IWalletTransactionDocument extends Document {
  transactionId: string;
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  transactionType: WalletTransactionType;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  status: WalletTransactionStatus;
  idempotencyKey?: string;
  balanceAfter: number;
  sourceReferenceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransactionDocument>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    walletId: { type: Schema.Types.ObjectId, ref: 'MemberWallet', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transactionType: {
      type: String,
      enum: Object.values(WalletTransactionType),
      required: true
    },
    direction: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(WalletTransactionStatus),
      default: WalletTransactionStatus.COMPLETED
    },
    idempotencyKey: { type: String, index: true },
    balanceAfter: { type: Number, required: true },
    sourceReferenceId: { type: String }
  },
  { timestamps: true }
);

export const WalletTransactionModel = mongoose.model<IWalletTransactionDocument>(
  'WalletTransaction',
  WalletTransactionSchema
);

// ==========================================
// 3. Wallet Funding (Add Funds) Schema & Model
// ==========================================
export interface IWalletFundingDocument extends Document {
  fundingId: string;
  userId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentOrderId: string;
  gatewayTransactionId?: string;
  paymentStatus: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'PENDING';
  settlementStatus: 'SETTLED' | 'PENDING' | 'RECONCILED';
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WalletFundingSchema = new Schema<IWalletFundingDocument>(
  {
    fundingId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    walletId: { type: Schema.Types.ObjectId, ref: 'MemberWallet', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentProvider: { type: String, default: 'RAZORPAY_OR_MOCK' },
    paymentOrderId: { type: String, required: true },
    gatewayTransactionId: { type: String },
    paymentStatus: {
      type: String,
      enum: ['INITIATED', 'SUCCESS', 'FAILED', 'PENDING'],
      default: 'INITIATED'
    },
    settlementStatus: {
      type: String,
      enum: ['SETTLED', 'PENDING', 'RECONCILED'],
      default: 'PENDING'
    },
    failureReason: { type: String }
  },
  { timestamps: true }
);

export const WalletFundingModel = mongoose.model<IWalletFundingDocument>(
  'WalletFunding',
  WalletFundingSchema
);

// ==========================================
// 4. Wallet Withdrawal Schema & Model
// ==========================================
export interface IWalletWithdrawalDocument extends Document {
  withdrawalId: string;
  userId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  amount: number;
  fee: number;
  netAmount: number;
  bankAccountReference: string;
  payoutProvider?: string;
  payoutReference?: string;
  status: WithdrawalStatus;
  adminReview?: {
    reviewedBy: string;
    reviewedAt: Date;
    notes?: string;
  };
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WalletWithdrawalSchema = new Schema<IWalletWithdrawalDocument>(
  {
    withdrawalId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    walletId: { type: Schema.Types.ObjectId, ref: 'MemberWallet', required: true },
    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    bankAccountReference: { type: String, required: true },
    payoutProvider: { type: String, default: 'BANK_DIRECT_OR_IMPS' },
    payoutReference: { type: String },
    status: {
      type: String,
      enum: Object.values(WithdrawalStatus),
      default: WithdrawalStatus.REQUESTED
    },
    adminReview: {
      reviewedBy: { type: String },
      reviewedAt: { type: Date },
      notes: { type: String }
    },
    failureReason: { type: String }
  },
  { timestamps: true }
);

export const WalletWithdrawalModel = mongoose.model<IWalletWithdrawalDocument>(
  'WalletWithdrawal',
  WalletWithdrawalSchema
);

// ==========================================
// 5. Member Bank Account Schema & Model
// ==========================================
export interface IMemberBankAccountDocument extends Document {
  userId: mongoose.Types.ObjectId;
  accountHolderName: string;
  bankName: string;
  accountNumberMasked: string;
  ifscCode: string;
  accountType: 'SAVINGS' | 'CURRENT';
  verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED';
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemberBankAccountSchema = new Schema<IMemberBankAccountDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountHolderName: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumberMasked: { type: String, required: true },
    ifscCode: { type: String, required: true },
    accountType: { type: String, enum: ['SAVINGS', 'CURRENT'], default: 'SAVINGS' },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'PENDING_VERIFICATION', 'REJECTED'],
      default: 'VERIFIED'
    },
    verifiedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const MemberBankAccountModel = mongoose.model<IMemberBankAccountDocument>(
  'MemberBankAccount',
  MemberBankAccountSchema
);
