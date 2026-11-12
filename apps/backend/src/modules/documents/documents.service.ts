import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from '../../common/errors/app-error';
import { objectStorage } from '../../integrations/object-storage';
import { UserModel } from '../users/users.model';
import { MemberModel } from '../admin/models/Member';
import {
  DocumentAssetModel,
  DocumentCategory,
  IDocumentAsset,
  SafeDocumentDto,
  toSafeDocumentDto
} from './documents.model';
import { validateUploadedDocumentBuffer } from './file-validator';
import { generateOptimizedDerivatives } from './image-optimizer';

export type ViewVariant = 'preview' | 'thumbnail' | 'original';

export interface SignedDocumentTokenPayload {
  documentId: string;
  actorId: string;
  isAdmin: boolean;
  variant: ViewVariant;
  disposition: 'inline' | 'attachment';
}

export interface UploadDocumentParams {
  ownerUserId: string;
  uploadedByUserId: string;
  file: {
    originalname: string;
    mimetype?: string;
    buffer: Buffer;
    size?: number;
  };
  documentCategory?: string;
  documentLabel?: string;
  documentNumber?: string;
  entityType?: 'KYC' | 'PROFILE' | 'INVESTMENT' | 'SERVICE' | 'GENERAL';
  entityId?: string;
}

const VALID_CATEGORIES = new Set<DocumentCategory>([
  'KYC_IDENTITY',
  'KYC_BUSINESS',
  'KYC_BANK',
  'BUSINESS_CERTIFICATE',
  'FUNDING_PITCH',
  'INVESTMENT_DOC',
  'PROFILE_DOC',
  'OTHER'
]);

const VALID_ENTITY_TYPES = new Set(['KYC', 'PROFILE', 'INVESTMENT', 'SERVICE', 'GENERAL']);

export function normalizeCategory(raw?: string): DocumentCategory {
  const upper = (raw || '').trim().toUpperCase() as DocumentCategory;
  if (VALID_CATEGORIES.has(upper)) {
    return upper;
  }
  return 'OTHER';
}

export function normalizeEntityType(
  raw?: string
): 'KYC' | 'PROFILE' | 'INVESTMENT' | 'SERVICE' | 'GENERAL' {
  const upper = (raw || '').trim().toUpperCase();
  if (VALID_ENTITY_TYPES.has(upper)) {
    return upper as 'KYC' | 'PROFILE' | 'INVESTMENT' | 'SERVICE' | 'GENERAL';
  }
  return 'GENERAL';
}

export async function uploadAndProcessDocument(
  params: UploadDocumentParams
): Promise<{ asset: IDocumentAsset; dto: SafeDocumentDto }> {
  const fileInfo = validateUploadedDocumentBuffer({
    originalName: params.file.originalname,
    buffer: params.file.buffer,
    claimedMimeType: params.file.mimetype
  });

  let derivatives;
  try {
    derivatives = await generateOptimizedDerivatives(params.file.buffer, fileInfo);
  } catch (optErr: any) {
    throw new AppError(
      `Image processing failed: ${optErr?.message || 'corrupted or malformed image bytes'}`,
      400,
      'INVALID_IMAGE_CONTENT'
    );
  }

  const documentId = `DOC-${crypto.randomUUID()}`;
  const ownerSegment = params.ownerUserId.replace(/[^a-zA-Z0-9_-]/g, '');

  const originalStorageKey = `originals/${ownerSegment}/${documentId}/original.${fileInfo.extension}`;
  const optimizedStorageKey = derivatives.previewBuffer
    ? `previews/${ownerSegment}/${documentId}/preview.${derivatives.previewExtension || 'webp'}`
    : undefined;
  const thumbnailStorageKey = derivatives.thumbnailBuffer
    ? `thumbnails/${ownerSegment}/${documentId}/thumb.${derivatives.thumbnailExtension || 'webp'}`
    : undefined;

  const uploadedKeys: string[] = [];

  try {
    // 1. Store exact untouched original bytes in private storage
    await objectStorage.putObject({
      key: originalStorageKey,
      body: params.file.buffer,
      contentType: fileInfo.detectedMimeType,
      metadata: {
        'document-id': documentId,
        'checksum-sha256': fileInfo.checksumSha256,
        'original-filename': fileInfo.safeOriginalFileName
      }
    });
    uploadedKeys.push(originalStorageKey);

    // 2. Store compressed optimized WebP preview separately (never overwrites original)
    if (optimizedStorageKey && derivatives.previewBuffer) {
      await objectStorage.putObject({
        key: optimizedStorageKey,
        body: derivatives.previewBuffer,
        contentType: derivatives.previewMimeType || 'image/webp',
        metadata: {
          'document-id': documentId,
          variant: 'preview'
        }
      });
      uploadedKeys.push(optimizedStorageKey);
    }

    // 3. Store thumbnail separately for fast list/card previews
    if (thumbnailStorageKey && derivatives.thumbnailBuffer) {
      await objectStorage.putObject({
        key: thumbnailStorageKey,
        body: derivatives.thumbnailBuffer,
        contentType: derivatives.thumbnailMimeType || 'image/webp',
        metadata: {
          'document-id': documentId,
          variant: 'thumbnail'
        }
      });
      uploadedKeys.push(thumbnailStorageKey);
    }

    // Bind memberId if an Admin Member record exists for this user
    const user = await UserModel.findById(params.ownerUserId).select('email').lean<{ email?: string }>();
    const member = user?.email
      ? await MemberModel.findOne({ email: user.email.toLowerCase() }).select('_id').lean<{ _id?: any }>()
      : null;

    const entityType = normalizeEntityType(params.entityType);
    const asset = await DocumentAssetModel.create({
      documentId,
      ownerId: params.ownerUserId,
      ...(member?._id ? { memberId: member._id } : {}),
      uploadedBy: params.uploadedByUserId,
      entityType,
      ...(params.entityId ? { entityId: params.entityId.trim() } : {}),
      originalFileName: fileInfo.safeOriginalFileName,
      originalFileExtension: fileInfo.extension,
      originalMimeType: fileInfo.detectedMimeType,
      originalFileSize: fileInfo.fileSize,
      originalStorageKey,
      optimizedStorageKey,
      optimizedMimeType: derivatives.previewMimeType,
      optimizedFileSize: derivatives.previewFileSize,
      thumbnailStorageKey,
      thumbnailMimeType: derivatives.thumbnailMimeType,
      thumbnailFileSize: derivatives.thumbnailFileSize,
      storageProvider: objectStorage.providerName,
      checksum: fileInfo.checksumSha256,
      compressionRatio: derivatives.compressionRatio,
      documentCategory: normalizeCategory(params.documentCategory),
      documentLabel: (params.documentLabel || fileInfo.safeOriginalFileName).trim().slice(0, 140),
      ...(params.documentNumber ? { documentNumber: params.documentNumber.trim().slice(0, 80) } : {}),
      documentStatus: entityType === 'KYC' ? 'PENDING_REVIEW' : 'UPLOADED',
      accessPermissions: {
        visibility: 'PRIVATE',
        ownerCanView: true,
        ownerCanDownload: true,
        adminCanView: true,
        adminCanDownload: true
      }
    });

    return {
      asset,
      dto: toSafeDocumentDto(asset, 'member')
    };
  } catch (err) {
    // Rollback orphaned storage objects if DB persistence fails
    await Promise.allSettled(uploadedKeys.map((key) => objectStorage.deleteObject(key)));
    throw err;
  }
}

export async function getAuthorizedDocumentAsset(params: {
  documentId: string;
  requesterId: string;
  isAdmin: boolean;
  action: 'view' | 'download';
}): Promise<IDocumentAsset> {
  const doc = await DocumentAssetModel.findOne({
    documentId: params.documentId,
    isDeleted: { $ne: true }
  });

  if (!doc) {
    throw new AppError('Document not found.', 404, 'DOCUMENT_NOT_FOUND');
  }

  if (params.isAdmin) {
    const allowed =
      params.action === 'download'
        ? doc.accessPermissions?.adminCanDownload !== false
        : doc.accessPermissions?.adminCanView !== false;
    if (!allowed) {
      throw new AppError('Admin access to this document is restricted.', 403, 'FORBIDDEN');
    }
    return doc;
  }

  if (doc.ownerId.toString() !== params.requesterId.toString()) {
    throw new AppError('Forbidden. You are not authorized to access this document.', 403, 'FORBIDDEN');
  }

  const ownerAllowed =
    params.action === 'download'
      ? doc.accessPermissions?.ownerCanDownload !== false
      : doc.accessPermissions?.ownerCanView !== false;

  if (!ownerAllowed) {
    throw new AppError('Access to this document has been restricted.', 403, 'FORBIDDEN');
  }

  return doc;
}

export async function getVerifiedOriginalBuffer(doc: IDocumentAsset): Promise<{
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  checksum: string;
}> {
  const { buffer } = await objectStorage.getObjectBuffer(doc.originalStorageKey);
  const actualChecksum = crypto.createHash('sha256').update(buffer).digest('hex');

  if (actualChecksum !== doc.checksum) {
    throw new AppError(
      'Document integrity verification failed. Checksum mismatch detected.',
      500,
      'DOCUMENT_INTEGRITY_ERROR'
    );
  }

  return {
    buffer,
    mimeType: doc.originalMimeType,
    fileName: doc.originalFileName,
    checksum: doc.checksum
  };
}

export async function getViewBufferForVariant(
  doc: IDocumentAsset,
  requestedVariant: ViewVariant = 'preview'
): Promise<{
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  variantServed: ViewVariant;
  checksum: string;
}> {
  if (requestedVariant === 'thumbnail' && doc.thumbnailStorageKey) {
    try {
      const { buffer } = await objectStorage.getObjectBuffer(doc.thumbnailStorageKey);
      return {
        buffer,
        mimeType: doc.thumbnailMimeType || 'image/webp',
        fileName: `${doc.documentId}_thumb.webp`,
        variantServed: 'thumbnail',
        checksum: doc.checksum
      };
    } catch {
      // Fallback safely to preview/original if thumbnail was missing
    }
  }

  if (requestedVariant === 'preview' && doc.optimizedStorageKey) {
    try {
      const { buffer } = await objectStorage.getObjectBuffer(doc.optimizedStorageKey);
      return {
        buffer,
        mimeType: doc.optimizedMimeType || 'image/webp',
        fileName: `${doc.documentId}_preview.webp`,
        variantServed: 'preview',
        checksum: doc.checksum
      };
    } catch {
      // Fallback safely to exact original
    }
  }

  const original = await getVerifiedOriginalBuffer(doc);
  return {
    ...original,
    variantServed: 'original'
  };
}

export function issueSignedDocumentToken(payload: SignedDocumentTokenPayload): string {
  return jwt.sign(payload, config.jwt.documentSigningSecret, {
    expiresIn: config.storage.signedUrlTtlSeconds
  });
}

export function verifySignedDocumentToken(token: string): SignedDocumentTokenPayload {
  try {
    return jwt.verify(token, config.jwt.documentSigningSecret) as SignedDocumentTokenPayload;
  } catch {
    throw new AppError('Invalid or expired signed document access token.', 401, 'INVALID_DOCUMENT_TOKEN');
  }
}

export async function resolveSignedAccessUrl(params: {
  doc: IDocumentAsset;
  actorId: string;
  isAdmin: boolean;
  variant: ViewVariant;
  disposition: 'inline' | 'attachment';
  apiBaseUrl: string;
}): Promise<{ url: string; expiresInSeconds: number; storageProvider: 's3' | 'local' }> {
  const { doc, actorId, isAdmin, variant, disposition, apiBaseUrl } = params;

  const targetKey =
    disposition === 'attachment'
      ? doc.originalStorageKey
      : variant === 'thumbnail' && doc.thumbnailStorageKey
      ? doc.thumbnailStorageKey
      : variant === 'preview' && doc.optimizedStorageKey
      ? doc.optimizedStorageKey
      : doc.originalStorageKey;

  const targetContentType =
    disposition === 'attachment' || targetKey === doc.originalStorageKey
      ? doc.originalMimeType
      : 'image/webp';

  if (objectStorage.getSignedDownloadUrl && doc.storageProvider === 's3') {
    const presigned = await objectStorage.getSignedDownloadUrl(
      targetKey,
      config.storage.signedUrlTtlSeconds,
      {
        fileName: doc.originalFileName,
        disposition,
        contentType: targetContentType
      }
    );
    if (presigned) {
      return {
        url: presigned,
        expiresInSeconds: config.storage.signedUrlTtlSeconds,
        storageProvider: 's3'
      };
    }
  }

  const token = issueSignedDocumentToken({
    documentId: doc.documentId,
    actorId,
    isAdmin,
    variant: disposition === 'attachment' ? 'original' : variant,
    disposition
  });

  const prefix = isAdmin ? '/api/admin/documents' : '/api/v1/documents';
  return {
    url: `${apiBaseUrl}${prefix}/${doc.documentId}/signed?token=${encodeURIComponent(token)}`,
    expiresInSeconds: config.storage.signedUrlTtlSeconds,
    storageProvider: doc.storageProvider
  };
}
