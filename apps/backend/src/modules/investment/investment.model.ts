import mongoose, { Document, Schema } from 'mongoose';

// ========================================================
// 1. FUNDING REQUEST MODEL (BUSINESSES / STARTUPS - PHASES 1 & 2)
// ========================================================
export type FundingStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'FUNDED'
  | 'COMPLETED'
  | 'INFO_REQUIRED'
  | 'VERIFICATION_IN_PROGRESS'
  | 'ASSESSMENT_IN_PROGRESS'
  | 'REVIEW_COMPLETED'
  | 'DISCUSSION_REQUESTED'
  | 'ON_HOLD'
  | 'CLOSED';

export interface IFundingRequestedDocItem {
  id: string;
  name: string;
  instructions: string;
  isUploaded?: boolean;
  uploadedDocId?: string;
  uploadedDocName?: string;
  uploadedFileUrl?: string;
  uploadedAt?: Date | string;
}

export interface IFundingChangeRequest {
  date: Date | string;
  requestedBy: string;
  message: string;
  requestedDocuments: IFundingRequestedDocItem[];
  resolvedAt?: Date | string;
  isResolved?: boolean;
}

export interface IFundingRequestVersion {
  versionNumber: number;
  submittedAt: Date | string;
  data: Record<string, any>;
  changeRequestMessage?: string;
}

export interface IFundingRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  refNumber: string;
  fundingRequestId?: string; // e.g. FIC-FUND-2026-10492
  
  // Mandatory Phase 1 Fields
  companyName: string;
  businessName: string; // compatibility alias
  fundingDuration: string; // e.g. "12 Months"
  durationMonths: number;
  requiredFundingAmount: number;
  fundingAmount: number; // compatibility alias
  minInvestmentAmount: number;
  maxInvestmentAmount: number;
  expectedReturns: string; // e.g. "18% p.a."
  returnRatePercent: number;
  returnFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'MATURITY';
  fundingPurpose: string | string[];
  useOfFundsExplanation?: string;
  businessDescription?: string;

  // Optional / Profile details
  businessType?: string;
  industry?: string;
  location?: {
    country?: string;
    state?: string;
    district?: string;
    city?: string;
  };
  businessStage?: string;
  currentAnnualRevenue?: string;

  // Supporting Documents
  documents?: {
    documentId?: string;
    name: string;
    fileUrl: string;
    originalMimeType?: string;
    originalFileSize?: number;
    checksum?: string;
    fileType?: string;
    uploadedAt: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  }[];

  status: FundingStatus;
  
  // Change Requests & Resubmission (Phase 2.2)
  changeRequests: IFundingChangeRequest[];
  versionHistory: IFundingRequestVersion[];

  // Approval Information (Phase 2.3)
  approvedBy?: string;
  approvedAdminId?: string;
  approvedAt?: Date;
  approvalNotes?: string;

  // Investment progress tracking (Phase 3)
  totalInvested: number;
  remainingFundingAmount: number;
  investorCount: number;

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
  activityTimeline: {
    action: string;
    actorType: 'MEMBER' | 'ADMIN' | 'SYSTEM';
    actorName?: string;
    notes?: string;
    timestamp: Date | string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const FundingRequestSchema = new Schema<IFundingRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refNumber: { type: String, required: true, unique: true, index: true },
    fundingRequestId: { type: String, index: true },
    companyName: { type: String, required: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    fundingDuration: { type: String, required: true, default: '12 Months' },
    durationMonths: { type: Number, required: true, default: 12 },
    requiredFundingAmount: { type: Number, required: true },
    fundingAmount: { type: Number, required: true },
    minInvestmentAmount: { type: Number, required: true, default: 10000 },
    maxInvestmentAmount: { type: Number, required: true },
    expectedReturns: { type: String, required: true, default: '15% p.a.' },
    returnRatePercent: { type: Number, default: 15 },
    returnFrequency: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'YEARLY', 'MATURITY'],
      default: 'YEARLY'
    },
    fundingPurpose: { type: Schema.Types.Mixed, required: true },
    useOfFundsExplanation: { type: String },
    businessDescription: { type: String },
    businessType: { type: String, default: 'Private Limited Company' },
    industry: { type: String, default: 'Business & Entrepreneurship', index: true },
    location: {
      country: { type: String, default: 'India' },
      state: { type: String, default: '' },
      district: { type: String },
      city: { type: String, default: '' }
    },
    businessStage: { type: String, default: 'Growing Business' },
    currentAnnualRevenue: { type: String },
    documents: [
      {
        documentId: { type: String },
        name: { type: String },
        originalMimeType: { type: String },
        originalFileSize: { type: Number },
        checksum: { type: String },
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
        'CHANGES_REQUESTED',
        'RESUBMITTED',
        'APPROVED',
        'REJECTED',
        'ACTIVE',
        'FUNDED',
        'COMPLETED',
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
    changeRequests: [
      {
        date: { type: Date, default: Date.now },
        requestedBy: { type: String, default: 'FIC Admin' },
        message: { type: String, required: true },
        requestedDocuments: [
          {
            id: { type: String },
            name: { type: String, required: true },
            instructions: { type: String, required: true },
            isUploaded: { type: Boolean, default: false },
            uploadedDocId: { type: String },
            uploadedDocName: { type: String },
            uploadedFileUrl: { type: String },
            uploadedAt: { type: Date }
          }
        ],
        resolvedAt: { type: Date },
        isResolved: { type: Boolean, default: false }
      }
    ],
    versionHistory: [
      {
        versionNumber: { type: Number, required: true },
        submittedAt: { type: Date, default: Date.now },
        data: { type: Schema.Types.Mixed },
        changeRequestMessage: { type: String }
      }
    ],
    approvedBy: { type: String },
    approvedAdminId: { type: String },
    approvedAt: { type: Date },
    approvalNotes: { type: String },
    totalInvested: { type: Number, default: 0 },
    remainingFundingAmount: { type: Number },
    investorCount: { type: Number, default: 0 },
    latestFicUpdate: {
      type: String,
      default: 'Your funding request has been received. Our team is reviewing your business details.'
    },
    whatHappensNext: {
      type: String,
      default: 'FIC Admin will review your submitted application and update the status.'
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
    ],
    activityTimeline: [
      {
        action: { type: String, required: true },
        actorType: { type: String, enum: ['MEMBER', 'ADMIN', 'SYSTEM'], default: 'SYSTEM' },
        actorName: { type: String },
        notes: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

FundingRequestSchema.pre('save', function (next) {
  if (!this.fundingRequestId) {
    this.fundingRequestId = this.refNumber;
  }
  if (!this.companyName && this.businessName) {
    this.companyName = this.businessName;
  }
  if (!this.businessName && this.companyName) {
    this.businessName = this.companyName;
  }
  if (this.requiredFundingAmount && !this.fundingAmount) {
    this.fundingAmount = this.requiredFundingAmount;
  }
  if (this.fundingAmount && !this.requiredFundingAmount) {
    this.requiredFundingAmount = this.fundingAmount;
  }
  if (this.remainingFundingAmount === undefined || this.remainingFundingAmount === null) {
    this.remainingFundingAmount = Math.max(0, (this.requiredFundingAmount || 0) - (this.totalInvested || 0));
  }
  next();
});

export const FundingRequestModel =
  (mongoose.models.FundingRequest as mongoose.Model<IFundingRequestDocument>) ||
  mongoose.model<IFundingRequestDocument>('FundingRequest', FundingRequestSchema);

// ========================================================
// 2. INVESTMENT REQUEST MODEL (INVESTORS - PHASES 3, 4, 5, 6, 7, 8, 9, 10)
// ========================================================
export type InvestmentRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'PAYMENT_PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'FUND_RELEASE_PENDING'
  | 'ACTIVE'
  | 'MATURITY_PENDING'
  | 'MATURITY_PAYMENT_RECEIVED'
  | 'MATURITY_PAID'
  | 'COMPLETED'
  | 'REJECTED';

export interface IInvestmentRequestDocument extends Document {
  investmentId: string; // e.g. INV-2026-10492
  fundingRequestId: mongoose.Types.ObjectId;
  fundingRequestRef: string;
  projectName: string;
  fundingRequestorId: mongoose.Types.ObjectId;
  fundingRequestorName: string;
  fundingRequestorEmail?: string;
  fundingRequestorPhone?: string;

  // Investor Info
  investorId: mongoose.Types.ObjectId;
  investorName: string;
  investorEmail: string;
  investorPhone?: string;

  // Amounts & Terms
  requestedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  pendingPaymentAmount: number;

  // Fund Release (Phase 7)
  eligibleReleaseAmount: number;
  releasedAmount: number;
  pendingReleaseAmount: number;
  disbursedAt?: Date;
  disbursedBy?: string;
  disbursementTxnId?: string;

  // Terms & Return Schedule (Phase 8)
  expectedReturns: string;
  returnRatePercent: number;
  returnFrequency: string;
  fundingDuration: string;
  durationMonths: number;
  investmentStartDate?: Date;
  maturityDate?: Date;

  // Maturity Info (Phases 9 & 10)
  maturityAmountDue: number;
  maturityAmountReceived: number;
  maturityAmountReleased: number;
  maturityReceivedAt?: Date;
  maturityReleasedAt?: Date;
  maturityReleaseTxnId?: string;

  // Returns & Repayment Ledger
  repayments?: {
    installmentNumber?: number;
    dueDate?: Date;
    amountDue: number;
    amountPaid?: number;
    paidAt?: Date;
    paymentReference?: string;
    status: 'SCHEDULED' | 'DUE' | 'OVERDUE' | 'PARTIALLY_PAID' | 'PAID';
    verifiedBy?: string;
    verifiedAt?: Date;
    notes?: string;
  }[];

  status: InvestmentRequestStatus;

  // Admin Changes & Rejection
  adminNotes?: string;
  changeRequestNotes?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: Date;

  activityTimeline: {
    action: string;
    actorType: 'MEMBER' | 'ADMIN' | 'SYSTEM';
    actorName?: string;
    notes?: string;
    timestamp: Date | string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const InvestmentRequestSchema = new Schema<IInvestmentRequestDocument>(
  {
    investmentId: { type: String, required: true, unique: true, index: true },
    fundingRequestId: { type: Schema.Types.ObjectId, ref: 'FundingRequest', required: true, index: true },
    fundingRequestRef: { type: String, required: true, index: true },
    projectName: { type: String, required: true },
    fundingRequestorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fundingRequestorName: { type: String, required: true },
    fundingRequestorEmail: { type: String },
    fundingRequestorPhone: { type: String },

    investorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    investorName: { type: String, required: true },
    investorEmail: { type: String, required: true },
    investorPhone: { type: String },

    requestedAmount: { type: Number, required: true },
    approvedAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    pendingPaymentAmount: { type: Number, default: 0 },

    eligibleReleaseAmount: { type: Number, default: 0 },
    releasedAmount: { type: Number, default: 0 },
    pendingReleaseAmount: { type: Number, default: 0 },
    disbursedAt: { type: Date },
    disbursedBy: { type: String },
    disbursementTxnId: { type: String },

    expectedReturns: { type: String, required: true },
    returnRatePercent: { type: Number, default: 15 },
    returnFrequency: { type: String, default: 'YEARLY' },
    fundingDuration: { type: String, default: '12 Months' },
    durationMonths: { type: Number, default: 12 },
    investmentStartDate: { type: Date },
    maturityDate: { type: Date },

    maturityAmountDue: { type: Number, default: 0 },
    maturityAmountReceived: { type: Number, default: 0 },
    maturityAmountReleased: { type: Number, default: 0 },
    maturityReceivedAt: { type: Date },
    maturityReleasedAt: { type: Date },
    maturityReleaseTxnId: { type: String },

    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'CHANGES_REQUESTED',
        'RESUBMITTED',
        'APPROVED',
        'PAYMENT_PENDING',
        'PARTIALLY_PAID',
        'PAID',
        'FUND_RELEASE_PENDING',
        'ACTIVE',
        'MATURITY_PENDING',
        'MATURITY_PAYMENT_RECEIVED',
        'MATURITY_PAID',
        'COMPLETED',
        'REJECTED'
      ],
      default: 'SUBMITTED',
      index: true
    },

    adminNotes: { type: String },
    changeRequestNotes: { type: String },
    rejectionReason: { type: String },
    approvedBy: { type: String },
    approvedAt: { type: Date },

    repayments: [
      {
        installmentNumber: { type: Number },
        dueDate: { type: Date },
        amountDue: { type: Number, required: true },
        amountPaid: { type: Number, default: 0 },
        paidAt: { type: Date },
        paymentReference: { type: String },
        status: {
          type: String,
          enum: ['SCHEDULED', 'DUE', 'OVERDUE', 'PARTIALLY_PAID', 'PAID'],
          default: 'SCHEDULED'
        },
        verifiedBy: { type: String },
        verifiedAt: { type: Date },
        notes: { type: String }
      }
    ],

    activityTimeline: [
      {
        action: { type: String, required: true },
        actorType: { type: String, enum: ['MEMBER', 'ADMIN', 'SYSTEM'], default: 'SYSTEM' },
        actorName: { type: String },
        notes: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const InvestmentRequestModel =
  (mongoose.models.InvestmentRequest as mongoose.Model<IInvestmentRequestDocument>) ||
  mongoose.model<IInvestmentRequestDocument>('InvestmentRequest', InvestmentRequestSchema);

// ========================================================
// 3. FINANCIAL TRANSACTION MODEL (CENTRALIZED LEDGER - PHASE 12)
// ========================================================
export type FinancialTransactionType =
  | 'INVESTMENT_PAYMENT'
  | 'FUND_RELEASE'
  | 'RETURN_PAYMENT'
  | 'MATURITY_PAYMENT'
  | 'MATURITY_RELEASE'
  | 'REFUND'
  | 'PAYMENT_REVERSAL'
  | 'PAYOUT_FAILED';

export interface IFinancialTransactionDocument extends Document {
  transactionId: string; // e.g. TXN-2026-10492
  type: FinancialTransactionType;
  investmentId?: string;
  fundingRequestId?: string;
  payerId?: string;
  payerName?: string;
  receiverId?: string;
  receiverName?: string;
  amount: number;
  currency: string;
  paymentGateway: string; // e.g. 'RAZORPAY', 'BANK_TRANSFER', 'FIC_WALLET'
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  verifiedAt?: Date;
  failureReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialTransactionSchema = new Schema<IFinancialTransactionDocument>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: [
        'INVESTMENT_PAYMENT',
        'FUND_RELEASE',
        'RETURN_PAYMENT',
        'MATURITY_PAYMENT',
        'MATURITY_RELEASE',
        'REFUND',
        'PAYMENT_REVERSAL',
        'PAYOUT_FAILED'
      ],
      required: true,
      index: true
    },
    investmentId: { type: String, index: true },
    fundingRequestId: { type: String, index: true },
    payerId: { type: String },
    payerName: { type: String },
    receiverId: { type: String },
    receiverName: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentGateway: { type: String, default: 'RAZORPAY' },
    gatewayOrderId: { type: String },
    gatewayPaymentId: { type: String },
    status: {
      type: String,
      enum: ['SUCCESS', 'PENDING', 'FAILED'],
      default: 'SUCCESS',
      index: true
    },
    verifiedAt: { type: Date, default: Date.now },
    failureReason: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

export const FinancialTransactionModel =
  (mongoose.models.FinancialTransaction as mongoose.Model<IFinancialTransactionDocument>) ||
  mongoose.model<IFinancialTransactionDocument>('FinancialTransaction', FinancialTransactionSchema);

// ========================================================
// 4. FIC RECEIVING BANK ACCOUNT CONFIGURATION (PHASE 6.2)
// ========================================================
export interface IReceivingBankAccountDocument extends Document {
  key: string;
  accountHolderName: string;
  bankName: string;
  accountNumberMasked: string; // e.g. •••• •••• 1234
  accountNumber: string; // complete account number
  ifscCode: string;
  branchName: string;
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'INACTIVE';
  updatedByAdminId?: string;
  updatedByAdminName?: string;
  auditHistory: {
    updatedBy: string;
    timestamp: Date;
    changes: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ReceivingBankAccountSchema = new Schema<IReceivingBankAccountDocument>(
  {
    key: { type: String, required: true, unique: true, default: 'FIC_PRIMARY_RECEIVING_ACCOUNT' },
    accountHolderName: { type: String, required: true, default: 'FORGE INDIA CONNECT PRIVATE LIMITED' },
    bankName: { type: String, required: true, default: 'HDFC Bank' },
    accountNumberMasked: { type: String, required: true, default: '•••• •••• 5678' },
    accountNumber: { type: String, required: true, default: '50200012345678' },
    ifscCode: { type: String, required: true, default: 'HDFC0001234' },
    branchName: { type: String, required: true, default: 'Anna Nagar, Chennai' },
    status: { type: String, enum: ['ACTIVE', 'PENDING_VERIFICATION', 'INACTIVE'], default: 'ACTIVE' },
    updatedByAdminId: { type: String },
    updatedByAdminName: { type: String, default: 'System Initializer' },
    auditHistory: [
      {
        updatedBy: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        changes: { type: String, required: true }
      }
    ]
  },
  { timestamps: true }
);

export const ReceivingBankAccountModel =
  (mongoose.models.ReceivingBankAccount as mongoose.Model<IReceivingBankAccountDocument>) ||
  mongoose.model<IReceivingBankAccountDocument>('ReceivingBankAccount', ReceivingBankAccountSchema);

export async function ensureReceivingBankAccount(): Promise<IReceivingBankAccountDocument> {
  let acc = await ReceivingBankAccountModel.findOne({ key: 'FIC_PRIMARY_RECEIVING_ACCOUNT' });
  if (!acc) {
    acc = await ReceivingBankAccountModel.create({
      key: 'FIC_PRIMARY_RECEIVING_ACCOUNT',
      accountHolderName: 'FORGE INDIA CONNECT PRIVATE LIMITED',
      bankName: 'HDFC Bank',
      accountNumberMasked: '•••• •••• 5678',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0001234',
      branchName: 'Anna Nagar, Chennai',
      status: 'ACTIVE',
      updatedByAdminName: 'System Setup'
    });
  }
  return acc;
}

// ========================================================
// 5. INVESTOR PROFILE MODEL (BACKWARD COMPATIBILITY)
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
    documentId?: string;
    name: string;
    fileUrl: string;
    originalMimeType?: string;
    originalFileSize?: number;
    checksum?: string;
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
        documentId: { type: String },
        name: { type: String },
        originalMimeType: { type: String },
        originalFileSize: { type: Number },
        checksum: { type: String },
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

export const InvestorProfileModel =
  (mongoose.models.InvestorProfile as mongoose.Model<IInvestorProfileDocument>) ||
  mongoose.model<IInvestorProfileDocument>('InvestorProfile', InvestorProfileSchema);

// ========================================================
// 6. LEGACY INVESTMENT PROFILE (PRESERVED)
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

export const InvestmentProfileModel =
  (mongoose.models.LegacyInvestmentProfile as mongoose.Model<IInvestmentProfileDocument>) ||
  mongoose.model<IInvestmentProfileDocument>('LegacyInvestmentProfile', LegacyInvestmentProfileSchema);
