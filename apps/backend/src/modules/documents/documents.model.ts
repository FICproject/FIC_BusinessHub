import mongoose, { Document, Schema } from 'mongoose';

export type DocumentCategory =
  | 'KYC_IDENTITY'
  | 'KYC_BUSINESS'
  | 'KYC_BANK'
  | 'BUSINESS_CERTIFICATE'
  | 'FUNDING_PITCH'
  | 'INVESTMENT_DOC'
  | 'PROFILE_DOC'
  | 'OTHER';

export type DocumentStatus =
  | 'UPLOADED'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface IDocumentAsset extends Document {
  documentId: string;
  ownerId: mongoose.Types.ObjectId;
  memberId?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  entityType: 'KYC' | 'PROFILE' | 'INVESTMENT' | 'SERVICE' | 'GENERAL';
  entityId?: string;
  originalFileName: string;
  originalFileExtension: string;
  originalMimeType: string;
  originalFileSize: number;
  originalStorageKey: string;
  optimizedStorageKey?: string;
  optimizedMimeType?: string;
  optimizedFileSize?: number;
  thumbnailStorageKey?: string;
  thumbnailMimeType?: string;
  thumbnailFileSize?: number;
  storageProvider: 's3' | 'local';
  checksum: string;
  compressionRatio?: number;
  documentCategory: DocumentCategory;
  documentLabel: string;
  documentNumber?: string;
  documentStatus: DocumentStatus;
  accessPermissions: {
    visibility: 'PRIVATE';
    ownerCanView: boolean;
    ownerCanDownload: boolean;
    adminCanView: boolean;
    adminCanDownload: boolean;
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentAssetSchema = new Schema<IDocumentAsset>(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    entityType: {
      type: String,
      enum: ['KYC', 'PROFILE', 'INVESTMENT', 'SERVICE', 'GENERAL'],
      default: 'GENERAL',
      index: true
    },
    entityId: { type: String, trim: true },
    originalFileName: { type: String, required: true, trim: true },
    originalFileExtension: { type: String, required: true, trim: true, lowercase: true },
    originalMimeType: { type: String, required: true, trim: true },
    originalFileSize: { type: Number, required: true },
    originalStorageKey: { type: String, required: true },
    optimizedStorageKey: { type: String },
    optimizedMimeType: { type: String },
    optimizedFileSize: { type: Number },
    thumbnailStorageKey: { type: String },
    thumbnailMimeType: { type: String },
    thumbnailFileSize: { type: Number },
    storageProvider: { type: String, enum: ['s3', 'local'], required: true, default: 'local' },
    checksum: { type: String, required: true, index: true },
    compressionRatio: { type: Number },
    documentCategory: {
      type: String,
      enum: [
        'KYC_IDENTITY',
        'KYC_BUSINESS',
        'KYC_BANK',
        'BUSINESS_CERTIFICATE',
        'FUNDING_PITCH',
        'INVESTMENT_DOC',
        'PROFILE_DOC',
        'OTHER'
      ],
      default: 'OTHER'
    },
    documentLabel: { type: String, required: true, trim: true },
    documentNumber: { type: String, trim: true },
    documentStatus: {
      type: String,
      enum: ['UPLOADED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'ARCHIVED'],
      default: 'UPLOADED',
      index: true
    },
    accessPermissions: {
      visibility: { type: String, enum: ['PRIVATE'], default: 'PRIVATE' },
      ownerCanView: { type: Boolean, default: true },
      ownerCanDownload: { type: Boolean, default: true },
      adminCanView: { type: Boolean, default: true },
      adminCanDownload: { type: Boolean, default: true }
    },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

DocumentAssetSchema.index({ ownerId: 1, entityType: 1, createdAt: -1 });

export const DocumentAssetModel =
  (mongoose.models.DocumentAsset as mongoose.Model<IDocumentAsset>) ||
  mongoose.model<IDocumentAsset>('DocumentAsset', DocumentAssetSchema);

export interface SafeDocumentDto {
  documentId: string;
  ownerId: string;
  entityType: string;
  entityId?: string;
  originalFileName: string;
  originalFileExtension: string;
  originalMimeType: string;
  originalFileSize: number;
  optimizedMimeType?: string;
  optimizedFileSize?: number;
  thumbnailMimeType?: string;
  thumbnailFileSize?: number;
  storageProvider: 's3' | 'local';
  checksum: string;
  compressionRatio?: number;
  hasOptimizedPreview: boolean;
  hasThumbnail: boolean;
  documentCategory: DocumentCategory;
  documentLabel: string;
  documentNumber?: string;
  documentStatus: DocumentStatus;
  viewUrl: string;
  thumbnailUrl?: string;
  downloadUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeDocumentDto(doc: IDocumentAsset, apiPrefix: 'member' | 'admin' = 'member'): SafeDocumentDto {
  const basePath =
    apiPrefix === 'admin'
      ? `/api/admin/documents/${doc.documentId}`
      : `/api/v1/documents/${doc.documentId}`;

  return {
    documentId: doc.documentId,
    ownerId: doc.ownerId.toString(),
    entityType: doc.entityType,
    entityId: doc.entityId,
    originalFileName: doc.originalFileName,
    originalFileExtension: doc.originalFileExtension,
    originalMimeType: doc.originalMimeType,
    originalFileSize: doc.originalFileSize,
    optimizedMimeType: doc.optimizedMimeType,
    optimizedFileSize: doc.optimizedFileSize,
    thumbnailMimeType: doc.thumbnailMimeType,
    thumbnailFileSize: doc.thumbnailFileSize,
    storageProvider: doc.storageProvider,
    checksum: doc.checksum,
    compressionRatio: doc.compressionRatio,
    hasOptimizedPreview: Boolean(doc.optimizedStorageKey),
    hasThumbnail: Boolean(doc.thumbnailStorageKey),
    documentCategory: doc.documentCategory,
    documentLabel: doc.documentLabel,
    documentNumber: doc.documentNumber,
    documentStatus: doc.documentStatus,
    viewUrl: `${basePath}/view`,
    thumbnailUrl: doc.thumbnailStorageKey ? `${basePath}/view?variant=thumbnail` : undefined,
    downloadUrl: `${basePath}/download`,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

