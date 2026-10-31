import mongoose, { Document, Schema } from 'mongoose';
import { KYCStatus } from '@fic/shared-types';

export interface IKYCDocumentItem {
  documentType: string;
  documentNumber?: string;
  fileUrl: string;
  uploadedAt: Date;
  verificationStatus: KYCStatus;
  remarks?: string;
}

export interface IKYCSubmissionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  status: KYCStatus;
  documents: IKYCDocumentItem[];
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KYCDocumentItemSchema = new Schema<IKYCDocumentItem>({
  documentType: { type: String, required: true },
  documentNumber: { type: String },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  verificationStatus: {
    type: String,
    enum: Object.values(KYCStatus),
    default: KYCStatus.PENDING
  },
  remarks: { type: String }
});

const KYCSubmissionSchema = new Schema<IKYCSubmissionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    status: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.PENDING
    },
    documents: [KYCDocumentItemSchema],
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

export const KYCSubmissionModel = mongoose.model<IKYCSubmissionDocument>('KYCSubmission', KYCSubmissionSchema);

