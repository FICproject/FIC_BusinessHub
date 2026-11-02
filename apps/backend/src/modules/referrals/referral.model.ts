import mongoose, { Document, Schema } from 'mongoose';

export interface IReferralDocument extends Document {
  referralId: string;
  referralCode: string;
  referrerUserId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  referralSource: 'REFERRED' | 'ORGANIC';
  registrationDate: Date;
  paymentStatus: 'PAID' | 'PENDING';
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  referralStatus: 'REGISTERED' | 'ELIGIBLE' | 'REWARDED' | 'INELIGIBLE';
  rewardAmount: number;
  rewardStatus: 'PENDING_ELIGIBILITY' | 'PENDING_APPROVAL' | 'CREDITED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: Date;
  creditedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferralDocument>(
  {
    referralId: { type: String, required: true, unique: true, index: true },
    referralCode: { type: String, required: true, index: true },
    referrerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referredUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    referralSource: { type: String, enum: ['REFERRED', 'ORGANIC'], default: 'REFERRED' },
    registrationDate: { type: Date, default: Date.now },
    paymentStatus: { type: String, enum: ['PAID', 'PENDING'], default: 'PENDING' },
    kycStatus: { type: String, enum: ['VERIFIED', 'PENDING', 'REJECTED'], default: 'PENDING' },
    accountStatus: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    referralStatus: {
      type: String,
      enum: ['REGISTERED', 'ELIGIBLE', 'REWARDED', 'INELIGIBLE'],
      default: 'REGISTERED'
    },
    rewardAmount: { type: Number, default: 500 },
    rewardStatus: {
      type: String,
      enum: ['PENDING_ELIGIBILITY', 'PENDING_APPROVAL', 'CREDITED', 'REJECTED'],
      default: 'PENDING_ELIGIBILITY'
    },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    creditedAt: { type: Date },
    rejectionReason: { type: String }
  },
  { timestamps: true }
);

export const ReferralModel = mongoose.model<IReferralDocument>('Referral', ReferralSchema);

export interface IReferralProgrammeConfigDocument extends Document {
  enabled: boolean;
  rewardAmount: number;
  currency: string;
  eligibilityRules: {
    membershipPaymentRequired: boolean;
    kycApprovalRequired: boolean;
    accountActiveRequired: boolean;
    adminApprovalRequired: boolean;
  };
  effectiveFrom: Date;
  effectiveUntil?: Date;
  termsVersion: string;
  updatedBy: string;
}

const ReferralProgrammeConfigSchema = new Schema<IReferralProgrammeConfigDocument>(
  {
    enabled: { type: Boolean, default: true },
    rewardAmount: { type: Number, default: 500 },
    currency: { type: String, default: 'INR' },
    eligibilityRules: {
      membershipPaymentRequired: { type: Boolean, default: true },
      kycApprovalRequired: { type: Boolean, default: true },
      accountActiveRequired: { type: Boolean, default: true },
      adminApprovalRequired: { type: Boolean, default: true }
    },
    effectiveFrom: { type: Date, default: Date.now },
    effectiveUntil: { type: Date },
    termsVersion: { type: String, default: 'v1.0' },
    updatedBy: { type: String, default: 'SYSTEM_ADMIN' }
  },
  { timestamps: true }
);

export const ReferralProgrammeConfigModel = mongoose.model<IReferralProgrammeConfigDocument>(
  'ReferralProgrammeConfig',
  ReferralProgrammeConfigSchema
);
