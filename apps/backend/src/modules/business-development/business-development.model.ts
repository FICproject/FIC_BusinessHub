import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessDevRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  memberId?: mongoose.Types.ObjectId;
  requestId: string;
  refNumber: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  businessName: string;
  mainCategoryId?: string;
  mainCategoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  scalingSupportType?: string;
  currentBusinessStage?: string;
  businessDescription?: string;
  currentBusinessLocation?: string;
  targetExpansionLocation?: string;
  mainChallenge?: string;
  supportRequired?: string;
  customSupportRequired?: string;
  additionalDetails?: string;
  supportingDocuments?: {
    documentId?: string;
    name: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    uploadedAt: string;
  }[];
  status: string;
  meetingDetails?: {
    meetingId?: string;
    date?: string;
    time?: string;
    durationMinutes?: number;
    mode?: 'VIRTUAL' | 'IN_PERSON';
    linkOrLocation?: string;
    notes?: string;
    scheduledAt?: Date | string;
    scheduledBy?: string;
    isCompleted?: boolean;
    completedAt?: Date | string;
    completionSummary?: string;
  };
  meetingCompletedAt?: Date;
  completionSummary?: string;
  adminNotes?: string;
  activityTimeline?: {
    action: string;
    actorType: 'MEMBER' | 'ADMIN' | 'SYSTEM';
    actorId?: string;
    actorName?: string;
    notes?: string;
    timestamp: Date | string;
  }[];

  // Backward-compatible fields
  supportType?: string;
  currentChallenges?: string;
  expectedOutcomes?: string;
  latestFicUpdate?: string;
  whatHappensNext?: string;
  ficRecommendations?: string;
  updateHistory?: {
    date: string;
    status: string;
    update: string;
    updatedBy?: string;
  }[];
  assignedSpecialist?: {
    name?: string;
    title?: string;
    desk?: string;
    assignedDate?: string;
    isApprovedForMember?: boolean;
  };
  assessmentSummary?: {
    findings?: string;
    mainChallenges?: string[];
    areasToImprove?: string[];
    recommendedSolution?: string;
    isCompleted?: boolean;
    completedDate?: string;
  };
  milestones?: {
    stepNumber: number;
    stepName: string;
    whatWillBeDone: string;
    whyNeeded?: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
    expectedCompletionDate?: string;
    achievedOutcome?: string;
  }[];
  memberAction?: {
    isRequired: boolean;
    title?: string;
    reason?: string;
    dueDate?: string;
    submittedInfo?: string;
    submittedAt?: string;
  };
  activityHistory?: {
    title: string;
    description: string;
    timestamp: string;
  }[];
  ficNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessDevRequestSchema = new Schema<IBusinessDevRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', index: true },
    requestId: { type: String, trim: true },
    refNumber: { type: String, trim: true, index: true },
    submitterName: { type: String, trim: true },
    submitterEmail: { type: String, trim: true },
    submitterPhone: { type: String, trim: true },
    businessName: { type: String, required: true, trim: true },
    mainCategoryId: { type: String, trim: true },
    mainCategoryName: { type: String, trim: true },
    subcategoryId: { type: String, trim: true },
    subcategoryName: { type: String, trim: true },
    scalingSupportType: {
      type: String,
      trim: true
    },
    currentBusinessStage: {
      type: String,
      trim: true
    },
    businessDescription: { type: String, trim: true },
    currentBusinessLocation: { type: String, trim: true },
    targetExpansionLocation: { type: String, trim: true },
    mainChallenge: { type: String, trim: true },
    supportRequired: { type: String, trim: true },
    customSupportRequired: { type: String, trim: true },
    additionalDetails: { type: String, trim: true },
    supportingDocuments: [
      {
        documentId: { type: String },
        name: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
        fileSize: { type: Number },
        uploadedAt: { type: String }
      }
    ],
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'MEETING_SCHEDULED',
        'MEETING_COMPLETED',
        'CANCELLED',
        // Legacy statuses
        'ASSESSMENT_IN_PROGRESS',
        'SPECIALIST_ASSIGNED',
        'DIAGNOSTIC_COMPLETED',
        'ACTION_PLAN_PREPARED',
        'IMPLEMENTATION_IN_PROGRESS',
        'WAITING_FOR_MEMBER',
        'COMPLETED',
        'ON_HOLD'
      ],
      default: 'SUBMITTED'
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
    meetingCompletedAt: { type: Date },
    completionSummary: { type: String },
    adminNotes: { type: String },
    activityTimeline: [
      {
        action: { type: String, required: true },
        actorType: { type: String, enum: ['MEMBER', 'ADMIN', 'SYSTEM'], default: 'MEMBER' },
        actorId: { type: String },
        actorName: { type: String },
        notes: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],

    // Backward compatibility
    supportType: { type: String, trim: true },
    currentChallenges: { type: String },
    expectedOutcomes: { type: String },
    latestFicUpdate: { type: String },
    whatHappensNext: { type: String },
    ficRecommendations: { type: String },
    updateHistory: [
      {
        date: { type: String },
        status: { type: String },
        update: { type: String },
        updatedBy: { type: String }
      }
    ],
    assignedSpecialist: {
      name: { type: String },
      title: { type: String },
      desk: { type: String },
      assignedDate: { type: String },
      isApprovedForMember: { type: Boolean, default: false }
    },
    assessmentSummary: {
      findings: { type: String },
      mainChallenges: [{ type: String }],
      areasToImprove: [{ type: String }],
      recommendedSolution: { type: String },
      isCompleted: { type: Boolean, default: false },
      completedDate: { type: String }
    },
    milestones: [
      {
        stepNumber: { type: Number },
        stepName: { type: String },
        whatWillBeDone: { type: String },
        whyNeeded: { type: String },
        status: { type: String, enum: ['COMPLETED', 'IN_PROGRESS', 'UPCOMING'], default: 'UPCOMING' },
        expectedCompletionDate: { type: String },
        achievedOutcome: { type: String }
      }
    ],
    memberAction: {
      isRequired: { type: Boolean, default: false },
      title: { type: String },
      reason: { type: String },
      dueDate: { type: String },
      submittedInfo: { type: String },
      submittedAt: { type: String }
    },
    activityHistory: [
      {
        title: { type: String },
        description: { type: String },
        timestamp: { type: String }
      }
    ],
    ficNotes: { type: String }
  },
  { timestamps: true }
);

// Ensure index on requestId
BusinessDevRequestSchema.index({ requestId: 1 }, { unique: true, sparse: true });

export const BusinessDevRequestModel = mongoose.model<IBusinessDevRequestDocument>(
  'BusinessDevRequest',
  BusinessDevRequestSchema
);
export const ScalingRequestModel = BusinessDevRequestModel;
