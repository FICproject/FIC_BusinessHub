import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessIdeaDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  targetMarket?: string;
  stage: 'IDEA' | 'PROTOTYPE' | 'EARLY_TRACTION' | 'GROWTH';
  supportNeeded: string[];
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'FIC_CONSULTATION_SCHEDULED' | 'SUPPORT_ACTIVE' | 'CLOSED';
  ficRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessIdeaSchema = new Schema<IBusinessIdeaDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    targetMarket: { type: String },
    stage: {
      type: String,
      enum: ['IDEA', 'PROTOTYPE', 'EARLY_TRACTION', 'GROWTH'],
      default: 'IDEA'
    },
    supportNeeded: [{ type: String }],
    status: {
      type: String,
      enum: ['SUBMITTED', 'UNDER_REVIEW', 'FIC_CONSULTATION_SCHEDULED', 'SUPPORT_ACTIVE', 'CLOSED'],
      default: 'SUBMITTED'
    },
    ficRemarks: { type: String }
  },
  { timestamps: true }
);

export const BusinessIdeaModel = mongoose.model<IBusinessIdeaDocument>('BusinessIdea', BusinessIdeaSchema);
