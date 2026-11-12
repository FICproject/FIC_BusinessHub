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

export interface IAdditionalDocumentRequest {
  requestId: string;
  documentName: string;
  docKey: string;
  description?: string;
  reason: string;
  required: boolean;
  allowedExtensions: string[];
  maxSizeBytes: number;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REUPLOAD_REQUIRED' | 'CANCELLED';
  requestedBy?: mongoose.Types.ObjectId;
  requestedByName?: string;
  requestedAt: Date;
  fulfilledDocumentId?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedByName?: string;
  reviewReason?: string;
}

export interface IKYCSubmissionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  status: KYCStatus;
  documents: IKYCDocumentItem[];
  additionalDocumentRequests?: IAdditionalDocumentRequest[];
  isLocked?: boolean;
  lockedAt?: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedByName?: string;
  reverificationHistory?: Array<{
    initiatedBy?: mongoose.Types.ObjectId;
    initiatedByName?: string;
    reason: string;
    initiatedAt: Date;
    previousApprovedAt?: Date;
    previousApprovedByName?: string;
  }>;
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

const AdditionalDocumentRequestSchema = new Schema(
  {
    requestId: { type: String, required: true },
    documentName: { type: String, required: true },
    docKey: { type: String, required: true },
    description: { type: String },
    reason: { type: String, required: true },
    required: { type: Boolean, default: true },
    allowedExtensions: { type: [String], default: ['pdf', 'jpg', 'jpeg', 'png'] },
    maxSizeBytes: { type: Number, default: 2 * 1024 * 1024 },
    status: {
      type: String,
      enum: ['PENDING', 'SUBMITTED', 'APPROVED', 'REUPLOAD_REQUIRED', 'CANCELLED'],
      default: 'PENDING'
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    requestedByName: { type: String },
    requestedAt: { type: Date, default: Date.now },
    fulfilledDocumentId: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedByName: { type: String },
    reviewReason: { type: String }
  },
  { _id: false }
);

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
    additionalDocumentRequests: { type: [AdditionalDocumentRequestSchema], default: [] },
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    approvedByName: { type: String },
    reverificationHistory: {
      type: [
        new Schema(
          {
            initiatedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
            initiatedByName: { type: String },
            reason: { type: String, required: true },
            initiatedAt: { type: Date, default: Date.now },
            previousApprovedAt: { type: Date },
            previousApprovedByName: { type: String }
          },
          { _id: false }
        )
      ],
      default: []
    },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

export const KYCSubmissionModel =
  (mongoose.models.KYCSubmission as mongoose.Model<IKYCSubmissionDocument>) ||
  mongoose.model<IKYCSubmissionDocument>('KYCSubmission', KYCSubmissionSchema);
