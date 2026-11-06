import mongoose, { Schema, Document } from 'mongoose';

export type InvestmentPoolStatus = 'OPEN' | 'FUNDED' | 'DISBURSED' | 'REPAID' | 'CLOSED';

export interface IPoolInvestor {
  memberId: mongoose.Types.ObjectId;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  investedAmount: number;
  investedAt: Date;
  expectedInterest: number;
  totalMaturityAmount: number;
  repaidAmount?: number;
  interestPaid?: number;
  payoutStatus: 'PENDING' | 'DISBURSED' | 'COMPLETED';
  payoutDate?: Date;
  transactionReference?: string;
}

export interface IInvestmentPool extends Document {
  poolCode: string;
  title: string;
  description: string;
  industryCategory: string;
  targetAmount: number;
  collectedAmount: number;
  minInvestmentPerUser: number;
  maxInvestmentPerUser?: number;
  investorAnnualYieldPercent: number;
  tenureMonths: number;
  status: InvestmentPoolStatus;
  linkedProposalId?: mongoose.Types.ObjectId;
  borrowerName?: string;
  borrowerBusinessName?: string;
  borrowerInterestRateAnnual?: number;
  ficMarginPercent?: number;
  investors: IPoolInvestor[];
  openedAt: Date;
  closedAt?: Date;
  disbursedToBorrowerAt?: Date;
  disbursementReference?: string;
  repaymentDueDate?: Date;
  totalRepaidByBorrower: number;
  createdAt: Date;
  updatedAt: Date;
}

const PoolInvestorSchema = new Schema<IPoolInvestor>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    memberName: { type: String, required: true },
    memberEmail: { type: String, required: true },
    memberPhone: { type: String },
    investedAmount: { type: Number, required: true },
    investedAt: { type: Date, default: Date.now },
    expectedInterest: { type: Number, required: true },
    totalMaturityAmount: { type: Number, required: true },
    repaidAmount: { type: Number, default: 0 },
    interestPaid: { type: Number, default: 0 },
    payoutStatus: {
      type: String,
      enum: ['PENDING', 'DISBURSED', 'COMPLETED'],
      default: 'PENDING',
    },
    payoutDate: { type: Date },
    transactionReference: { type: String },
  },
  { _id: true }
);

const InvestmentPoolSchema = new Schema<IInvestmentPool>(
  {
    poolCode: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    industryCategory: { type: String, required: true },

    targetAmount: { type: Number, required: true },
    collectedAmount: { type: Number, default: 0 },
    minInvestmentPerUser: { type: Number, default: 5000 },
    maxInvestmentPerUser: { type: Number },

    investorAnnualYieldPercent: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },

    status: {
      type: String,
      enum: ['OPEN', 'FUNDED', 'DISBURSED', 'REPAID', 'CLOSED'],
      default: 'OPEN',
      required: true,
    },

    linkedProposalId: { type: Schema.Types.ObjectId, ref: 'FundingApplication' },
    borrowerName: { type: String },
    borrowerBusinessName: { type: String },
    borrowerInterestRateAnnual: { type: Number },
    ficMarginPercent: { type: Number, default: 3.0 },

    investors: [PoolInvestorSchema],

    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    disbursedToBorrowerAt: { type: Date },
    disbursementReference: { type: String },
    repaymentDueDate: { type: Date },
    totalRepaidByBorrower: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const InvestmentPoolModel = (mongoose.models.InvestmentPool as mongoose.Model<IInvestmentPool>) || mongoose.model<IInvestmentPool>('InvestmentPool', InvestmentPoolSchema);
