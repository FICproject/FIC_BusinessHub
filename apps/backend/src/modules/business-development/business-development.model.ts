import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessDevRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  refNumber: string;
  businessName: string;
  supportType:
    | 'BUSINESS_PLANNING'
    | 'SETUP_GUIDANCE'
    | 'MARKET_RESEARCH'
    | 'BRANDING_MARKETING'
    | 'TECHNOLOGY_DEVELOPMENT'
    | 'OPERATIONAL_IMPROVEMENT'
    | 'EXPANSION_SCALING'
    | 'GENERAL_CONSULTANCY';
  currentChallenges: string;
  expectedOutcomes: string;
  status:
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'ASSESSMENT_IN_PROGRESS'
    | 'SPECIALIST_ASSIGNED'
    | 'DIAGNOSTIC_COMPLETED'
    | 'ACTION_PLAN_PREPARED'
    | 'IMPLEMENTATION_IN_PROGRESS'
    | 'WAITING_FOR_MEMBER'
    | 'COMPLETED'
    | 'ON_HOLD';
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
    refNumber: { type: String, trim: true, index: true },
    businessName: { type: String, required: true, trim: true },
    supportType: {
      type: String,
      enum: [
        'BUSINESS_PLANNING',
        'SETUP_GUIDANCE',
        'MARKET_RESEARCH',
        'BRANDING_MARKETING',
        'TECHNOLOGY_DEVELOPMENT',
        'OPERATIONAL_IMPROVEMENT',
        'EXPANSION_SCALING',
        'GENERAL_CONSULTANCY'
      ],
      required: true
    },
    currentChallenges: { type: String, required: true },
    expectedOutcomes: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
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
        title: { type: String, required: true },
        description: { type: String, required: true },
        timestamp: { type: String, required: true }
      }
    ],
    ficNotes: { type: String }
  },
  { timestamps: true }
);

export const BusinessDevRequestModel = mongoose.model<IBusinessDevRequestDocument>(
  'BusinessDevRequest',
  BusinessDevRequestSchema
);

