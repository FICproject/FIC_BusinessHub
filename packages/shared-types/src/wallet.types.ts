export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  RESTRICTED = 'RESTRICTED'
}

export enum WalletTransactionType {
  ADD_FUNDS = 'ADD_FUNDS',
  REFERRAL_REWARD = 'REFERRAL_REWARD',
  ADMIN_CREDIT = 'ADMIN_CREDIT',
  ADMIN_DEBIT = 'ADMIN_DEBIT',
  MEMBERSHIP_RENEWAL = 'MEMBERSHIP_RENEWAL',
  WITHDRAWAL = 'WITHDRAWAL',
  REFUND = 'REFUND',
  REWARD_REVERSAL = 'REWARD_REVERSAL',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum WalletTransactionStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
  REVERSED = 'REVERSED',
  REFUNDED = 'REFUNDED'
}

export enum WithdrawalStatus {
  REQUESTED = 'REQUESTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface IMemberWallet {
  walletId: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface IWalletTransaction {
  transactionId: string;
  walletId: string;
  userId: string;
  transactionType: WalletTransactionType;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  status: WalletTransactionStatus;
  idempotencyKey?: string;
  balanceAfter: number;
  sourceReferenceId?: string;
  createdAt: string;
}

export interface IWalletFunding {
  fundingId: string;
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentOrderId: string;
  gatewayTransactionId?: string;
  paymentStatus: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'PENDING';
  settlementStatus: 'SETTLED' | 'PENDING' | 'RECONCILED';
  failureReason?: string;
  createdAt: string;
}

export interface IWalletWithdrawal {
  withdrawalId: string;
  userId: string;
  walletId: string;
  amount: number;
  fee: number;
  netAmount: number;
  bankAccountReference: string;
  payoutProvider?: string;
  payoutReference?: string;
  status: WithdrawalStatus;
  adminReview?: {
    reviewedBy: string;
    reviewedAt: string;
    notes?: string;
  };
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMemberBankAccount {
  bankAccountId: string;
  userId: string;
  accountHolderName: string;
  bankName: string;
  accountNumberMasked: string;
  ifscCode: string;
  accountType: 'SAVINGS' | 'CURRENT';
  verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED';
  verifiedAt?: string;
  createdAt: string;
}

export interface IReferral {
  referralId: string;
  referralCode: string;
  referrerUserId: string;
  referrerName?: string;
  referredUserId: string;
  referredName: string;
  referredMemberName?: string;
  referredMemberId?: string;
  referredEmail?: string;
  categoryName?: string;
  subCategory?: string;
  referralSource: 'REFERRED' | 'ORGANIC';
  registrationDate: string;
  paymentStatus: 'PAID' | 'PENDING';
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  referralStatus: 'REGISTERED' | 'ELIGIBLE' | 'REWARDED' | 'INELIGIBLE';
  rewardAmount: number;
  rewardStatus: 'PENDING_ELIGIBILITY' | 'PENDING_APPROVAL' | 'CREDITED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  creditedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IReferralProgrammeConfiguration {
  enabled: boolean;
  rewardAmount: number;
  currency: string;
  eligibilityRules: {
    membershipPaymentRequired: boolean;
    kycApprovalRequired: boolean;
    accountActiveRequired: boolean;
    adminApprovalRequired: boolean;
  };
  effectiveFrom: string;
  effectiveUntil?: string;
  termsVersion: string;
  updatedBy: string;
  updatedAt: string;
}

export interface IWalletNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'MONEY_ADDED_SUCCESS'
    | 'ADD_FUNDS_FAILED'
    | 'WITHDRAWAL_REQUESTED'
    | 'WITHDRAWAL_APPROVED'
    | 'WITHDRAWAL_REJECTED'
    | 'WITHDRAWAL_COMPLETED'
    | 'REFERRAL_REGISTRATION'
    | 'REFERRAL_KYC_APPROVED'
    | 'REFERRAL_REWARD_APPROVED'
    | 'REFERRAL_REWARD_CREDITED'
    | 'MEMBERSHIP_RENEWAL_SUCCESS'
    | 'MEMBERSHIP_RENEWAL_FAILED'
    | 'MEMBERSHIP_EXPIRY_REMINDER'
    | 'GENERAL';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}
