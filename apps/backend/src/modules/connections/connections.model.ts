import mongoose, { Document, Schema } from 'mongoose';
import { ServiceRequestStatus } from '@fic/shared-types';

export interface IServiceRequestDocument extends Document {
  serviceId: mongoose.Types.ObjectId;
  requesterId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  assignedStaffId?: mongoose.Types.ObjectId;
  status: ServiceRequestStatus;
  requirementNotes: string;
  ficNotes?: string;
  proposalDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceRequestSchema = new Schema<IServiceRequestDocument>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'ServiceListing', required: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: Object.values(ServiceRequestStatus),
      default: ServiceRequestStatus.SUBMITTED
    },
    requirementNotes: { type: String, required: true },
    ficNotes: { type: String },
    proposalDetails: { type: String }
  },
  { timestamps: true }
);

export const ServiceRequestModel = mongoose.model<IServiceRequestDocument>('ServiceRequest', ServiceRequestSchema);
