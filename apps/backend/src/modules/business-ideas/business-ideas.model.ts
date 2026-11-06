import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessIdeaDocument extends Document {
  userId: mongoose.Types.ObjectId;
  refNumber: string;
  title: string;
  description: string;
  targetMarket?: string;
  stage: 'IDEA' | 'PROTOTYPE' | 'EARLY_TRACTION' | 'GROWTH';
  supportNeeded?: string | string[];
  supportRequired?: string;
  status:
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'INFO_REQUIRED'
    | 'ASSESSMENT_IN_PROGRESS'
    | 'ADVISOR_ASSIGNED'
    | 'MEETING_SCHEDULED'
    | 'ACTION_PLAN_READY'
    | 'APPROVED'
    | 'ON_HOLD'
    | 'CLOSED';
  latestFicUpdate?: string;
  whatHappensNext?: string;
  updateHistory?: {
    date: string;
    status: string;
    update: string;
    updatedBy?: string;
  }[];
  currentStep?: number; // 1: Idea Submitted, 2: Initial Review, 3: Feasibility Assessment, 4: Advisor Review, 5: Recommendations Ready
  advisor?: {
    name?: string;
    role?: string;
    desk?: string;
    assignedDate?: string;
  };
  reviewSummary?: {
    marketDemand?: string;
    techPossibility?: string;
    businessOpportunity?: string;
    estimatedChallenges?: string;
    overallVerdict?: string;
    isReviewed?: boolean;
    reviewedDate?: string;
  };
  recommendations?: {
    strengths?: string[];
    improvements?: string[];
    challenges?: string[];
    actionItems?: string[];
  };
  nextSteps?: string[];
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
  feasibilityScore?: {
    marketViability?: number;
    techFeasibility?: number;
    commercialScalability?: number;
    verifiedByPanel?: boolean;
  };
  ficRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessIdeaSchema = new Schema<IBusinessIdeaDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refNumber: { type: String, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    targetMarket: { type: String },
    stage: {
      type: String,
      enum: ['IDEA', 'PROTOTYPE', 'EARLY_TRACTION', 'GROWTH'],
      default: 'IDEA'
    },
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
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'INFO_REQUIRED',
        'ASSESSMENT_IN_PROGRESS',
        'ADVISOR_ASSIGNED',
        'MEETING_SCHEDULED',
        'ACTION_PLAN_READY',
        'APPROVED',
        'ON_HOLD',
        'CLOSED'
      ],
      default: 'SUBMITTED'
    },
    currentStep: { type: Number, default: 1 },
    advisor: {
      name: { type: String },
      role: { type: String },
      desk: { type: String },
      assignedDate: { type: String }
    },
    reviewSummary: {
      marketDemand: { type: String },
      techPossibility: { type: String },
      businessOpportunity: { type: String },
      estimatedChallenges: { type: String },
      overallVerdict: { type: String },
      isReviewed: { type: Boolean, default: false },
      reviewedDate: { type: String }
    },
    recommendations: {
      strengths: [{ type: String }],
      improvements: [{ type: String }],
      challenges: [{ type: String }],
      actionItems: [{ type: String }]
    },
    nextSteps: [{ type: String }],
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
    feasibilityScore: {
      marketViability: { type: Number },
      techFeasibility: { type: Number },
      commercialScalability: { type: Number },
      verifiedByPanel: { type: Boolean, default: false }
    },
    ficRemarks: { type: String }
  },
  { timestamps: true }
);

export const BusinessIdeaModel = mongoose.model<IBusinessIdeaDocument>('BusinessIdea', BusinessIdeaSchema);


