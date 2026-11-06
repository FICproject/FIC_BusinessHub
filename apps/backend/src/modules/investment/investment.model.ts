import mongoose, { Document, Schema } from 'mongoose';

// ========================================================
// 1. FUNDING REQUEST MODEL (BUSINESSES / STARTUPS)
// ========================================================
export type FundingStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFO_REQUIRED'
  | 'VERIFICATION_IN_PROGRESS'
  | 'ASSESSMENT_IN_PROGRESS'
  | 'REVIEW_COMPLETED'
  | 'DISCUSSION_REQUESTED'
  | 'ON_HOLD'
  | 'CLOSED';

export interface IFundingRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  refNumber: string;
  businessName: string;
  businessType:
    | 'Startup'
    | 'Proprietorship'
    | 'Partnership'
    | 'LLP'
    | 'Private Limited Company'
    | 'Public Limited Company'
    | 'Other';
  industry: string;
  location: {
    country: string;
    state: string;
    district?: string;
    city: string;
  };
  businessStage:
    | 'Idea Stage'
    | 'Startup / Pre-Revenue'
    | 'Early Revenue'
    | 'Growing Business'
    | 'Established Business';
  fundingAmount: number; // in INR
  fundingPurpose: string[];
  useOfFundsExplanation: string;
  currentAnnualRevenue?: string;
  businessDescription: string;
  documents?: {
    name: string;
    fileUrl: string;
    fileType?: string;
    uploadedAt: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  }[];
  status: FundingStatus;
  latestFicUpdate: string;
  whatHappensNext: string;
  updateHistory: {
    date: string;
    status: string;
    update: string;
    updatedBy?: string;
  }[];
  internalNotes?: {
    note: string;
    createdBy: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const FundingRequestSchema = new Schema<IFundingRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refNumber: { type: String, required: true, unique: true, index: true },
    businessName: { type: String, required: true, trim: true },
    businessType: {
      type: String,
      required: true,
      enum: [
        'Startup',
        'Proprietorship',
        'Partnership',
        'LLP',
        'Private Limited Company',
        'Public Limited Company',
        'Other'
      ]
    },
    industry: { type: String, required: true, index: true },
    location: {
      country: { type: String, required: true },
      state: { type: String, required: true },
      district: { type: String },
      city: { type: String, required: true }
    },
    businessStage: {
      type: String,
      required: true,
      enum: [
        'Idea Stage',
        'Startup / Pre-Revenue',
        'Early Revenue',
        'Growing Business',
        'Established Business'
      ]
    },
    fundingAmount: { type: Number, required: true },
    fundingPurpose: [{ type: String, required: true }],
    useOfFundsExplanation: { type: String, required: true },
    currentAnnualRevenue: { type: String },
    businessDescription: { type: String, required: true },
    documents: [
      {
        name: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
        uploadedAt: { type: String },
        status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' }
      }
    ],
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'INFO_REQUIRED',
        'VERIFICATION_IN_PROGRESS',
        'ASSESSMENT_IN_PROGRESS',
        'REVIEW_COMPLETED',
        'DISCUSSION_REQUESTED',
        'ON_HOLD',
        'CLOSED'
      ],
      default: 'SUBMITTED',
      index: true
    },
    latestFicUpdate: {
      type: String,
      default: 'Your funding request has been received. Our team is reviewing your business details.'
    },
    whatHappensNext: {
      type: String,
      default: 'FIC will review your submitted information and coordinate preliminary verification.'
    },
    updateHistory: [
      {
        date: { type: String, required: true },
        status: { type: String, required: true },
        update: { type: String, required: true },
        updatedBy: { type: String }
      }
    ],
    internalNotes: [
      {
        note: { type: String, required: true },
        createdBy: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const FundingRequestModel = mongoose.model<IFundingRequestDocument>(
  'FundingRequest',
  FundingRequestSchema
);

// ========================================================
// 2. INVESTOR PROFILE MODEL (INVESTORS / ORGANIZATIONS)
// ========================================================
export type InvestorStatus =
  | 'SUBMITTED'
  | 'VERIFICATION_IN_PROGRESS'
  | 'INFO_REQUIRED'
  | 'VERIFICATION_COMPLETED'
  | 'UNDER_REVIEW'
  | 'DISCUSSION_REQUESTED'
  | 'ON_HOLD'
  | 'CLOSED';

export interface IInvestorProfileDocument extends Document {
  userId: mongoose.Types.ObjectId;
  refNumber: string;
  investorType:
    | 'Individual Investor'
    | 'Company / Corporate Investor'
    | 'Investment Firm'
    | 'Family Office'
    | 'Other';
  investorName: string;
  country: string;
  stateCity: string;
  investorProfile: string;
  totalCapacity: string;
  preferredTicketSize: string;
  preferredSectors: string[];
  preferredStages: string[];
  investmentType:
    | 'Equity Investment'
    | 'Debt Financing'
    | 'Strategic Investment'
    | 'Open to Discussion'
    | 'Other';
  investmentExperience?: string;
  additionalPreferences?: string;
  documents?: {
    name: string;
    fileUrl: string;
    fileType?: string;
    uploadedAt: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  }[];
  status: InvestorStatus;
  latestFicUpdate: string;
  whatHappensNext: string;
  updateHistory: {
    date: string;
    status: string;
    update: string;
    updatedBy?: string;
  }[];
  internalNotes?: {
    note: string;
    createdBy: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const InvestorProfileSchema = new Schema<IInvestorProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refNumber: { type: String, required: true, unique: true, index: true },
    investorType: {
      type: String,
      required: true,
      enum: [
        'Individual Investor',
        'Company / Corporate Investor',
        'Investment Firm',
        'Family Office',
        'Other'
      ]
    },
    investorName: { type: String, required: true, trim: true },
    country: { type: String, required: true },
    stateCity: { type: String, required: true },
    investorProfile: { type: String, required: true },
    totalCapacity: { type: String, required: true },
    preferredTicketSize: { type: String, required: true },
    preferredSectors: [{ type: String, required: true }],
    preferredStages: [{ type: String, required: true }],
    investmentType: {
      type: String,
      required: true,
      enum: [
        'Equity Investment',
        'Debt Financing',
        'Strategic Investment',
        'Open to Discussion',
        'Other'
      ]
    },
    investmentExperience: { type: String },
    additionalPreferences: { type: String },
    documents: [
      {
        name: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
        uploadedAt: { type: String },
        status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' }
      }
    ],
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'VERIFICATION_IN_PROGRESS',
        'INFO_REQUIRED',
        'VERIFICATION_COMPLETED',
        'UNDER_REVIEW',
        'DISCUSSION_REQUESTED',
        'ON_HOLD',
        'CLOSED'
      ],
      default: 'SUBMITTED',
      index: true
    },
    latestFicUpdate: {
      type: String,
      default: 'Your investor profile is currently being verified.'
    },
    whatHappensNext: {
      type: String,
      default: 'Your profile verification is in progress.'
    },
    updateHistory: [
      {
        date: { type: String, required: true },
        status: { type: String, required: true },
        update: { type: String, required: true },
        updatedBy: { type: String }
      }
    ],
    internalNotes: [
      {
        note: { type: String, required: true },
        createdBy: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const InvestorProfileModel = mongoose.model<IInvestorProfileDocument>(
  'InvestorProfile',
  InvestorProfileSchema
);

// ========================================================
// 3. LEGACY MODEL PRESERVATION (DO NOT BREAK EXISTING DATA)
// ========================================================
export interface IInvestmentProfileDocument extends Document {
  userId: mongoose.Types.ObjectId;
  profileType: 'INVESTOR' | 'FUNDING_SEEKER';
  sectors: string[];
  amountRange: string;
  stagePreference?: string;
  pitchSummary?: string;
  isConfidential: boolean;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'FIC_ASSESSMENT' | 'POTENTIAL_MATCH' | 'CLOSED';
  ficNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LegacyInvestmentProfileSchema = new Schema<IInvestmentProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileType: {
      type: String,
      enum: ['INVESTOR', 'FUNDING_SEEKER'],
      required: true
    },
    sectors: [{ type: String }],
    amountRange: { type: String, required: true },
    stagePreference: { type: String },
    pitchSummary: { type: String },
    isConfidential: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['SUBMITTED', 'UNDER_REVIEW', 'FIC_ASSESSMENT', 'POTENTIAL_MATCH', 'CLOSED'],
      default: 'SUBMITTED'
    },
    ficNotes: { type: String }
  },
  { timestamps: true }
);

export const InvestmentProfileModel = mongoose.model<IInvestmentProfileDocument>(
  'LegacyInvestmentProfile',
  LegacyInvestmentProfileSchema
);
