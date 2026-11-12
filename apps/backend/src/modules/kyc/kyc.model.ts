import mongoose, { Document, Schema } from 'mongoose';
import { KYCStatus } from '@fic/shared-types';

export interface IKYCDocumentItem {
  documentId?: string;
  documentType: string;
  title?: string;
  documentNumber?: string;
  originalFileName?: string;
  originalMimeType?: string;
  originalFileSize?: number;
  checksum?: string;
  hasOptimizedPreview?: boolean;
  hasThumbnail?: boolean;
  fileUrl: string;
  uploadedAt: Date;
  verificationStatus: string;
  remarks?: string;
  adminReviewReason?: string;
  version?: number;
  previousVersionReference?: string;
  reviewedAt?: Date;
  reviewedByName?: string;
  versionHistory?: Array<{
    version: number;
    documentId?: string;
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
    status: string;
    reason?: string;
    reviewedAt?: Date;
    reviewedByName?: string;
  }>;
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

const KYCDocumentVersionSchema = new Schema(
  {
    version: { type: Number, required: true },
    documentId: { type: String },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    uploadedAt: { type: String, required: true },
    status: { type: String, required: true },
    reason: { type: String },
    reviewedAt: { type: Date },
    reviewedByName: { type: String }
  },
  { _id: false }
);

const KYCDocumentItemSchema = new Schema<IKYCDocumentItem>({
  documentId: { type: String, index: true },
  documentType: { type: String, required: true },
  title: { type: String },
  documentNumber: { type: String },
  originalFileName: { type: String },
  originalMimeType: { type: String },
  originalFileSize: { type: Number },
  checksum: { type: String },
  hasOptimizedPreview: { type: Boolean },
  hasThumbnail: { type: Boolean },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  verificationStatus: {
    type: String,
    enum: [
      ...Object.values(KYCStatus),
      'PENDING_REVIEW',
      'REUPLOAD_REQUIRED',
      'VERIFIED'
    ],
    default: KYCStatus.PENDING
  },
  remarks: { type: String },
  adminReviewReason: { type: String },
  version: { type: Number, default: 1 },
  previousVersionReference: { type: String },
  reviewedAt: { type: Date },
  reviewedByName: { type: String },
  versionHistory: { type: [KYCDocumentVersionSchema], default: [] }
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

export const KYCSubmissionModel =
  (mongoose.models.KYCSubmission as mongoose.Model<IKYCSubmissionDocument>) ||
  mongoose.model<IKYCSubmissionDocument>('KYCSubmission', KYCSubmissionSchema);
