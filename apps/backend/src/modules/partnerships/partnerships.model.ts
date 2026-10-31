import mongoose, { Document, Schema } from 'mongoose';

export interface IPartnershipRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  organizationName: string;
  partnershipType:
    | 'B2B_COLLABORATION'
    | 'MANUFACTURING_PARTNER'
    | 'DISTRIBUTION_NETWORK'
    | 'FRANCHISE'
    | 'VENDOR_RELATIONSHIP'
    | 'JOINT_VENTURE'
    | 'STRATEGIC_ALLIANCE';
  proposalSummary: string;
  targetIndustries: string[];
  status: 'SUBMITTED' | 'FIC_REVIEW' | 'MATCHING_IN_PROGRESS' | 'INTRODUCTION_INITIATED' | 'COMPLETED';
  ficNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartnershipRequestSchema = new Schema<IPartnershipRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationName: { type: String, required: true, trim: true },
    partnershipType: {
      type: String,
      enum: [
        'B2B_COLLABORATION',
        'MANUFACTURING_PARTNER',
        'DISTRIBUTION_NETWORK',
        'FRANCHISE',
        'VENDOR_RELATIONSHIP',
        'JOINT_VENTURE',
        'STRATEGIC_ALLIANCE'
      ],
      required: true
    },
    proposalSummary: { type: String, required: true },
    targetIndustries: [{ type: String }],
    status: {
      type: String,
      enum: ['SUBMITTED', 'FIC_REVIEW', 'MATCHING_IN_PROGRESS', 'INTRODUCTION_INITIATED', 'COMPLETED'],
      default: 'SUBMITTED'
    },
    ficNotes: { type: String }
  },
  { timestamps: true }
);

export const PartnershipRequestModel = mongoose.model<IPartnershipRequestDocument>(
  'PartnershipRequest',
  PartnershipRequestSchema
);
