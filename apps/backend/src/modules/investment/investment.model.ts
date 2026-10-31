import mongoose, { Document, Schema } from 'mongoose';

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

const InvestmentProfileSchema = new Schema<IInvestmentProfileDocument>(
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
  'InvestmentProfile',
  InvestmentProfileSchema
);
