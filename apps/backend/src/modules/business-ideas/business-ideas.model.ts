import mongoose, { Document, Schema } from 'mongoose';
import {
  BusinessIdeaStage,
  BusinessIdeaStatus,
  BusinessIdeaSupportOption,
  CollaborationContributionType,
  CollaborationInterestStatus
} from '@fic/shared-types';

export interface IBusinessIdeaDocument extends Document {
  ideaRequestId: string;
  refNumber: string;
  userId: mongoose.Types.ObjectId;
  submitterMemberId: mongoose.Types.ObjectId;
  submitterName: string;
  submitterEmail?: string;
  submitterPhone?: string;
  title: string;
  mainCategoryId?: mongoose.Types.ObjectId | string;
  mainCategoryName: string;
  mainCategorySlug?: string;
  subcategoryId?: string;
  subcategoryName: string;
  description: string;
  targetMarket?: string;
  targetLocation?: string;
  developmentStage: BusinessIdeaStage;
  supportRequirements: BusinessIdeaSupportOption[];
  customSupportRequirement?: string;
  additionalMessage?: string;
  supportingDocuments: {
    name: string;
    fileUrl: string;
    fileType?: string;
    uploadedAt: string;
    documentId?: string;
  }[];
  adminReviewStatus: BusinessIdeaStatus;
  status: BusinessIdeaStatus;
  adminNotes?: string;
  adminFeedbackToSubmitter?: string;
  rejectionReason?: string;
  informationRequestNotes?: string;
  marketplacePublished: boolean;
  marketplacePublishedAt?: Date;
  interestedMembersCount: number;
  collaborationStatus?: string;
  fundingAsked: boolean;
  fundingRequired?: boolean | null;
  fundingRequestId?: string;
  fundingRequestRef?: string;
  meetingDetails?: {
    meetingId?: string;
    date?: string;
    time?: string;
    durationMinutes?: number;
    mode?: 'VIRTUAL' | 'IN_PERSON';
    linkOrLocation?: string;
    notes?: string;
    scheduledAt?: Date;
    scheduledBy?: string;
    isCompleted?: boolean;
    completedAt?: Date;
    completionSummary?: string;
  };
  activityTimeline: {
    action: string;
    actorType: 'MEMBER' | 'ADMIN' | 'SYSTEM' | 'INTERESTED_MEMBER';
    actorId?: string;
    actorName?: string;
    notes?: string;
    timestamp: Date;
  }[];

  // Legacy compatibility fields
  stage?: string;
  supportNeeded?: string | string[];
  supportRequired?: string;
  latestFicUpdate?: string;
  whatHappensNext?: string;
  updateHistory?: {
    date: string;
    status: string;
    update: string;
    updatedBy?: string;
  }[];
  currentStep?: number;
  advisor?: {
    name?: string;
    role?: string;
    desk?: string;
    assignedDate?: string;
  };
  reviewSummary?: Record<string, any>;
  recommendations?: Record<string, any>;
  nextSteps?: string[];
  memberAction?: Record<string, any>;
  activityHistory?: Record<string, any>[];
  feasibilityScore?: Record<string, any>;
  ficRemarks?: string;

  createdAt: Date;
  updatedAt: Date;
}

const BusinessIdeaSchema = new Schema<IBusinessIdeaDocument>(
  {
    ideaRequestId: { type: String, required: true, unique: true, index: true, trim: true },
    refNumber: { type: String, trim: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    submitterMemberId: { type: Schema.Types.ObjectId, ref: 'Member', index: true },
    submitterName: { type: String, required: true, trim: true },
    submitterEmail: { type: String, trim: true, lowercase: true },
    submitterPhone: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    mainCategoryId: { type: Schema.Types.Mixed },
    mainCategoryName: { type: String, required: true, default: 'General Business' },
    mainCategorySlug: { type: String, default: 'general-business' },
    subcategoryId: { type: String },
    subcategoryName: { type: String, required: true, default: 'Entrepreneur' },
    description: { type: String, required: true },
    targetMarket: { type: String, default: '' },
    targetLocation: { type: String, default: '' },
    developmentStage: {
      type: String,
      default: 'Just an Idea'
    },
    supportRequirements: [{ type: String }],
    customSupportRequirement: { type: String, default: '' },
    additionalMessage: { type: String, default: '' },
    supportingDocuments: [
      {
        name: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
        uploadedAt: { type: String },
        documentId: { type: String }
      }
    ],
    adminReviewStatus: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'INFORMATION_REQUESTED',
        'APPROVED',
        'MEETING_SCHEDULED',
        'MEETING_COMPLETED',
        'REJECTED',
        'SHARED_ON_MARKETPLACE',
        'INTEREST_RECEIVED',
        'MEMBER_SELECTION_PENDING',
        'MATCHED',
        'COMPLETED',
        'CLOSED'
      ],
      default: 'SUBMITTED',
      index: true
    },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'INFORMATION_REQUESTED',
        'APPROVED',
        'MEETING_SCHEDULED',
        'MEETING_COMPLETED',
        'REJECTED',
        'SHARED_ON_MARKETPLACE',
        'INTEREST_RECEIVED',
        'MEMBER_SELECTION_PENDING',
        'MATCHED',
        'COMPLETED',
        'CLOSED',
        // Legacy support
        'INFO_REQUIRED',
        'ASSESSMENT_IN_PROGRESS',
        'ADVISOR_ASSIGNED',
        'ACTION_PLAN_READY',
        'ON_HOLD'
      ],
      default: 'SUBMITTED',
      index: true
    },
    meetingDetails: {
      meetingId: { type: String },
      date: { type: String },
      time: { type: String },
      durationMinutes: { type: Number, default: 45 },
      mode: { type: String, enum: ['VIRTUAL', 'IN_PERSON'], default: 'VIRTUAL' },
      linkOrLocation: { type: String },
      notes: { type: String },
      scheduledAt: { type: Date },
      scheduledBy: { type: String },
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date },
      completionSummary: { type: String }
    },
    adminNotes: { type: String, default: '' },
    adminFeedbackToSubmitter: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    informationRequestNotes: { type: String, default: '' },
    marketplacePublished: { type: Boolean, default: false, index: true },
    marketplacePublishedAt: { type: Date },
    interestedMembersCount: { type: Number, default: 0 },
    collaborationStatus: { type: String, default: 'PENDING_REVIEW' },
    fundingAsked: { type: Boolean, default: false },
    fundingRequired: { type: Boolean, default: null },
    fundingRequestId: { type: String, default: null },
    fundingRequestRef: { type: String, default: null },
    activityTimeline: [
      {
        action: { type: String, required: true },
        actorType: { type: String, enum: ['MEMBER', 'ADMIN', 'SYSTEM', 'INTERESTED_MEMBER'], default: 'SYSTEM' },
        actorId: { type: String },
        actorName: { type: String },
        notes: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],

    // Legacy fields
    stage: { type: String, default: 'IDEA' },
    supportNeeded: { type: Schema.Types.Mixed },
    supportRequired: { type: String },
    latestFicUpdate: { type: String },
    whatHappensNext: { type: String },
    updateHistory: [
      {
        date: { type: String },
        status: { type: String },
        update: { type: String },
        updatedBy: { type: String }
      }
    ],
    currentStep: { type: Number, default: 1 },
    advisor: {
      name: { type: String },
      role: { type: String },
      desk: { type: String },
      assignedDate: { type: String }
    },
    reviewSummary: { type: Schema.Types.Mixed },
    recommendations: { type: Schema.Types.Mixed },
    nextSteps: [{ type: String }],
    memberAction: { type: Schema.Types.Mixed },
    activityHistory: [{ type: Schema.Types.Mixed }],
    feasibilityScore: { type: Schema.Types.Mixed },
    ficRemarks: { type: String }
  },
  { timestamps: true }
);

// Pre-save hook to ensure synchronization between ideaRequestId and refNumber, and status aliases
BusinessIdeaSchema.pre('save', function (next) {
  if (this.ideaRequestId && !this.refNumber) {
    this.refNumber = this.ideaRequestId;
  } else if (this.refNumber && !this.ideaRequestId) {
    this.ideaRequestId = this.refNumber;
  }
  if (this.adminReviewStatus && !this.status) {
    this.status = this.adminReviewStatus;
  } else if (this.status && !this.adminReviewStatus) {
    this.adminReviewStatus = this.status as BusinessIdeaStatus;
  }
  next();
});

export const BusinessIdeaModel =
  (mongoose.models.BusinessIdea as mongoose.Model<IBusinessIdeaDocument>) ||
  mongoose.model<IBusinessIdeaDocument>('BusinessIdea', BusinessIdeaSchema);

// ========================================================
// 2. Business Idea Interest Model
// ========================================================
export interface IBusinessIdeaInterestDocument extends Document {
  ideaRequestId: string;
  ideaId: mongoose.Types.ObjectId;
  ideaTitle?: string;
  interestedMemberId: mongoose.Types.ObjectId;
  interestedUserId: mongoose.Types.ObjectId;
  interestedMemberName: string;
  interestedMemberEmail?: string;
  interestedMemberPhone?: string;
  interestedCategoryName?: string;
  interestedSubcategoryName?: string;
  contributionType: CollaborationContributionType;
  interestReason: string;
  contributionOffer?: string;
  experience?: string;
  additionalMessage?: string;
  reviewStatus: CollaborationInterestStatus;
  adminNotes?: string;
  selectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  meetingDetails?: {
    meetingId?: string;
    date?: string;
    time?: string;
    durationMinutes?: number;
    mode?: 'VIRTUAL' | 'IN_PERSON';
    linkOrLocation?: string;
    notes?: string;
    scheduledAt?: Date;
    scheduledBy?: string;
    status?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BusinessIdeaInterestSchema = new Schema<IBusinessIdeaInterestDocument>(
  {
    ideaRequestId: { type: String, required: true, index: true },
    ideaId: { type: Schema.Types.ObjectId, ref: 'BusinessIdea', required: true, index: true },
    ideaTitle: { type: String },
    interestedMemberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    interestedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    interestedMemberName: { type: String, required: true, trim: true },
    interestedMemberEmail: { type: String, trim: true, lowercase: true },
    interestedMemberPhone: { type: String, trim: true },
    interestedCategoryName: { type: String, default: '' },
    interestedSubcategoryName: { type: String, default: '' },
    contributionType: {
      type: String,
      required: true,
      default: 'Business collaboration'
    },
    interestReason: { type: String, required: true },
    contributionOffer: { type: String },
    experience: { type: String, default: '' },
    additionalMessage: { type: String, default: '' },
    reviewStatus: {
      type: String,
      enum: ['INTEREST_SUBMITTED', 'UNDER_ADMIN_REVIEW', 'MEETING_SCHEDULED', 'MEETING_COMPLETED', 'SHORTLISTED', 'SELECTED', 'NOT_SELECTED'],
      default: 'INTEREST_SUBMITTED',
      index: true
    },
    meetingDetails: {
      meetingId: { type: String },
      date: { type: String },
      time: { type: String },
      durationMinutes: { type: Number, default: 45 },
      mode: { type: String, enum: ['VIRTUAL', 'IN_PERSON'], default: 'VIRTUAL' },
      linkOrLocation: { type: String },
      notes: { type: String },
      scheduledAt: { type: Date },
      scheduledBy: { type: String },
      status: { type: String, default: 'SCHEDULED' }
    },
    adminNotes: { type: String, default: '' },
    selectionReason: { type: String, default: '' },
    reviewedBy: { type: String },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

// Enforce unique interest per member per idea (prevent duplicates)
BusinessIdeaInterestSchema.index({ ideaId: 1, interestedMemberId: 1 }, { unique: true });

export const BusinessIdeaInterestModel =
  (mongoose.models.BusinessIdeaInterest as mongoose.Model<IBusinessIdeaInterestDocument>) ||
  mongoose.model<IBusinessIdeaInterestDocument>('BusinessIdeaInterest', BusinessIdeaInterestSchema);
