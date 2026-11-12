import mongoose, { Schema, Document } from 'mongoose';
import { KycStatus } from '@fic/shared-types';

export interface IKycDocumentVersionEntry {
  version: number;
  documentId?: string;
  fileUrl: string;
  fileName: string;
  originalMimeType?: string;
  originalFileSize?: number;
  checksum?: string;
  uploadedAt: string;
  status: string;
  reason?: string;
  reviewedAt?: Date;
  reviewedByName?: string;
}

export interface IKycDocumentRecord {
  documentId?: string;
  docKey: string;
  title: string;
  fileUrl: string;
  fileName: string;
  originalMimeType?: string;
  originalFileSize?: number;
  checksum?: string;
  hasOptimizedPreview?: boolean;
  hasThumbnail?: boolean;
  documentNumber?: string;
  uploadedAt: string;
  status: string;
  rejectionReason?: string;
  adminReviewReason?: string;
  version?: number;
  previousVersionReference?: string;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedByName?: string;
  versionHistory?: IKycDocumentVersionEntry[];
}

export interface IAdminAdditionalDocumentRequest {
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

export interface IKycSubmission extends Document {
  memberId: mongoose.Types.ObjectId;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  memberDob?: string;
  subCategory?: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    state?: string;
    pinCode?: string;
    country?: string;
  };
  dynamicProfile?: Record<string, any>;
  paymentDetails?: {
    orderId?: string;
    paymentId?: string;
    signature?: string;
    amount?: number;
    currency?: string;
    method?: string;
    paidAt?: Date;
    status?: string;
  };
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  status: KycStatus;
  documents: IKycDocumentRecord[];
  additionalDocumentRequests?: IAdminAdditionalDocumentRequest[];
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
  assignedTo?: mongoose.Types.ObjectId;
  reviewerNotes?: string;
  rejectionReason?: string;
  submittedAt: Date;
  lastResubmittedAt?: Date;
  verifiedAt?: Date;
}

const KycDocumentVersionSchema = new Schema(
  {
    version: { type: Number, required: true },
    documentId: { type: String },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    originalMimeType: { type: String },
    originalFileSize: { type: Number },
    checksum: { type: String },
    uploadedAt: { type: String, required: true },
    status: { type: String, required: true },
    reason: { type: String },
    reviewedAt: { type: Date },
    reviewedByName: { type: String },
  },
  { _id: false }
);

const KycDocumentItemSchema = new Schema(
  {
    docKey: { type: String, required: true },
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    documentId: { type: String },
    originalMimeType: { type: String },
    originalFileSize: { type: Number },
    checksum: { type: String },
    hasOptimizedPreview: { type: Boolean },
    hasThumbnail: { type: Boolean },
    documentNumber: { type: String },
    uploadedAt: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING_REVIEW', 'PENDING', 'APPROVED', 'VERIFIED', 'REUPLOAD_REQUIRED', 'REJECTED'],
      default: 'PENDING_REVIEW',
    },
    rejectionReason: { type: String },
    adminReviewReason: { type: String },
    version: { type: Number, default: 1 },
    previousVersionReference: { type: String },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    reviewedByName: { type: String },
    versionHistory: { type: [KycDocumentVersionSchema], default: [] },
  },
  { _id: false }
);

const AdminAdditionalDocRequestSchema = new Schema(
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
      default: 'PENDING',
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    requestedByName: { type: String },
    requestedAt: { type: Date, default: Date.now },
    fulfilledDocumentId: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedByName: { type: String },
    reviewReason: { type: String },
  },
  { _id: false }
);

const KycSubmissionSchema = new Schema<IKycSubmission>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    memberName: { type: String, required: true },
    memberEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    memberPhone: { type: String },
    memberDob: { type: String },
    subCategory: { type: String },
    address: {
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      district: { type: String },
      state: { type: String },
      pinCode: { type: String },
      country: { type: String, default: 'India' }
    },
    dynamicProfile: { type: Schema.Types.Mixed },
    paymentDetails: {
      orderId: { type: String },
      paymentId: { type: String },
      signature: { type: String },
      amount: { type: Number, default: 99 },
      currency: { type: String, default: 'INR' },
      method: { type: String, default: 'RAZORPAY_UPI' },
      paidAt: { type: Date, default: Date.now },
      status: { type: String, default: 'CAPTURED' }
    },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, required: true },
    status: {
      type: String,
      enum: ['NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED'],
      default: 'SUBMITTED',
      required: true,
    },
    documents: [KycDocumentItemSchema],
    additionalDocumentRequests: { type: [AdminAdditionalDocRequestSchema], default: [] },
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
            previousApprovedByName: { type: String },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    reviewerNotes: { type: String },
    rejectionReason: { type: String },
    submittedAt: { type: Date, default: Date.now },
    lastResubmittedAt: { type: Date },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

KycSubmissionSchema.index({ status: 1, submittedAt: -1 });

export const KycSubmissionModel =
  (mongoose.models.KycSubmission as mongoose.Model<IKycSubmission>) ||
  mongoose.model<IKycSubmission>('KycSubmission', KycSubmissionSchema);
