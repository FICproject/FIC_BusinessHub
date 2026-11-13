import mongoose, { Schema, Document } from 'mongoose';

export type FundingStage =
  | 'USER_REQUEST'   // Step 1: Initial business proposal submitted
  | 'REVIEW'         // Step 2: Under diligence & pitch meeting scheduled/conducted
  | 'FUNDED'         // Step 3: Approved & principal disbursed
  | 'REPAID'         // Step 4: Fully settled with interest
  | 'REJECTED';      // Declined

export type FundingType = 'DEBT' | 'EQUITY' | 'REVENUE_SHARE' | 'WORKING_CAPITAL';

export interface IFundingApplication extends Document {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  businessName: string;
  industryCategory: string;
  businessPitch: string;
  pitchDeckUrl?: string;

  // Financial terms
  fundingType?: FundingType;
  requestedAmount: number; // Principal requested by applicant
  approvedPrincipal?: number; // Actual principal funded by FIC
  interestRateAnnual?: number; // Superadmin interest rate % per year (e.g., 12%)
  tenureMonths?: number; // e.g. 12 months
  proposedEquityPercent?: number; // Proposed equity %
  valuation?: number; // Proposed company valuation
  expectedTotalInterest?: number; // Calculated interest yield
  repaidAmount: number; // Amount collected so far
  accruedInterestCollected: number; // Portion of interest realized

  // Workflow stage
  stage: FundingStage;

  // Link to member & request
  memberUserId?: mongoose.Types.ObjectId;
  fundingRequestId?: mongoose.Types.ObjectId;

  // Meeting & Diligence details
  meetingScheduledAt?: Date;
  meetingLink?: string;
  diligenceNotes?: string;

  // Funding disbursement metadata
  disbursementDate?: Date;
  disbursementReference?: string;

  // Audit
  reviewedBy?: string;
  decisionDate?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FundingApplicationSchema = new Schema<IFundingApplication>(
  {
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    applicantPhone: { type: String, required: true },
    businessName: { type: String, required: true },
    industryCategory: { type: String, required: true },
    businessPitch: { type: String, required: true },
    pitchDeckUrl: { type: String },

    fundingType: {
      type: String,
      enum: ['DEBT', 'EQUITY', 'REVENUE_SHARE', 'WORKING_CAPITAL'],
      default: 'DEBT',
    },
    requestedAmount: { type: Number, required: true },
    approvedPrincipal: { type: Number },
    interestRateAnnual: { type: Number, default: 12 },
    tenureMonths: { type: Number, default: 12 },
    proposedEquityPercent: { type: Number },
    valuation: { type: Number },
    expectedTotalInterest: { type: Number, default: 0 },
    repaidAmount: { type: Number, default: 0 },
    accruedInterestCollected: { type: Number, default: 0 },

    stage: {
      type: String,
      enum: ['USER_REQUEST', 'REVIEW', 'FUNDED', 'REPAID', 'REJECTED'],
      default: 'USER_REQUEST',
      required: true,
    },

    memberUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    fundingRequestId: { type: Schema.Types.ObjectId, ref: 'FundingRequest' },

    meetingScheduledAt: { type: Date },
    meetingLink: { type: String },
    diligenceNotes: { type: String },

    disbursementDate: { type: Date },
    disbursementReference: { type: String },

    reviewedBy: { type: String },
    decisionDate: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const FundingApplicationModel = (mongoose.models.FundingApplication as mongoose.Model<IFundingApplication>) || mongoose.model<IFundingApplication>('FundingApplication', FundingApplicationSchema);
