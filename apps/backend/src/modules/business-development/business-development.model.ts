import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessDevRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
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
  status: 'SUBMITTED' | 'FIC_REVIEW' | 'SPECIALIST_ASSIGNED' | 'STRATEGY_IN_PROGRESS' | 'COMPLETED';
  ficNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessDevRequestSchema = new Schema<IBusinessDevRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
      enum: ['SUBMITTED', 'FIC_REVIEW', 'SPECIALIST_ASSIGNED', 'STRATEGY_IN_PROGRESS', 'COMPLETED'],
      default: 'SUBMITTED'
    },
    ficNotes: { type: String }
  },
  { timestamps: true }
);

export const BusinessDevRequestModel = mongoose.model<IBusinessDevRequestDocument>(
  'BusinessDevRequest',
  BusinessDevRequestSchema
);

