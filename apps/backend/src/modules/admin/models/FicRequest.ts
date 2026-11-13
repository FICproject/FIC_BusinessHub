import mongoose, { Schema, Document } from 'mongoose';
import { RequestStatus, RequestType } from '@fic/shared-types';

export interface IFicRequest extends Document {
  type: string;
  sourceModule?: string;
  sourceRefId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  requesterId: mongoose.Types.ObjectId;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterCategory?: string;
  targetServiceId?: mongoose.Types.ObjectId;
  targetProviderId?: mongoose.Types.ObjectId;
  status: string;
  assignedStaffId?: mongoose.Types.ObjectId;
  assignedStaffName?: string;
  adminResponse?: string;
  adminRespondedAt?: Date;
  adminRespondedByName?: string;
  providerNotifiedAt?: Date;
  providerResponse?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  providerResponseAt?: Date;
  scheduledMeetingId?: mongoose.Types.ObjectId;
  internalNotes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FicRequestSchema = new Schema<IFicRequest>(
  {
    type: {
      type: String,
      enum: [
        'SERVICE_INQUIRY',
        'BUSINESS_IDEAS',
        'SCALING_SUPPORT',
        'BUSINESS_DEVELOPMENT',
        'INVESTMENT_INTEREST',
        'PARTNERSHIP',
      ],
      default: 'SERVICE_INQUIRY',
      required: true,
    },
    sourceModule: {
      type: String,
      enum: ['MARKETPLACE', 'BUSINESS_IDEAS', 'SCALING_SUPPORT', 'CUSTOM'],
      default: 'MARKETPLACE',
    },
    sourceRefId: { type: Schema.Types.ObjectId },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    requesterName: { type: String, required: true },
    requesterEmail: { type: String, required: true },
    requesterPhone: { type: String },
    requesterCategory: { type: String },
    targetServiceId: { type: Schema.Types.ObjectId, ref: 'ServiceListing' },
    targetProviderId: { type: Schema.Types.ObjectId, ref: 'Member' },
    status: {
      type: String,
      enum: [
        'NEW',
        'SUBMITTED',
        'UNDER_REVIEW',
        'ASSIGNED',
        'IN_PROGRESS',
        'INFORMATION_REQUIRED',
        'RESPONDED',
        'PROVIDER_CONTACTED',
        'MEETING_SCHEDULED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
      ],
      default: 'NEW',
      required: true,
    },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    assignedStaffName: { type: String },
    adminResponse: { type: String },
    adminRespondedAt: { type: Date },
    adminRespondedByName: { type: String },
    providerNotifiedAt: { type: Date },
    providerResponse: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
    },
    providerResponseAt: { type: Date },
    scheduledMeetingId: { type: Schema.Types.ObjectId, ref: 'Meeting' },
    internalNotes: [{ type: String }],
  },
  { timestamps: true }
);

export const FicRequestModel = (mongoose.models.FicRequest as mongoose.Model<IFicRequest>) || mongoose.model<IFicRequest>('FicRequest', FicRequestSchema);
