import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { config } from '../../config';
import { AppError } from '../../common/errors/app-error';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { DocumentAssetModel, toSafeDocumentDto } from './documents.model';
import {
  getAuthorizedDocumentAsset,
  getVerifiedOriginalBuffer,
  getViewBufferForVariant,
  resolveSignedAccessUrl,
  uploadAndProcessDocument,
  verifySignedDocumentToken,
  ViewVariant
} from './documents.service';

export const documentsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.storage.maxUploadBytes,
    files: 10
  }
});

function handleMulterError(err: any, _req: Request, _res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = Math.round(config.storage.maxUploadBytes / (1024 * 1024));
      return next(new AppError(`Uploaded file exceeds ${maxMb} MB limit.`, 400, 'FILE_TOO_LARGE'));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400, 'UPLOAD_ERROR'));
  }
  next(err);
}

function setSecurityStreamHeaders(
  res: Response,
  params: {
    mimeType: string;
    fileName: string;
    disposition: 'inline' | 'attachment';
    checksum: string;
    documentId: string;
    variant?: string;
    byteLength: number;
  }
): void {
  const fallbackName = params.fileName.replace(/["\\\r\n;]/g, '_');
  const encodedName = encodeURIComponent(params.fileName);

  res.setHeader('Content-Type', params.mimeType === 'text/plain' ? 'text/plain; charset=utf-8' : params.mimeType);
  res.setHeader('Content-Length', String(params.byteLength));
  res.setHeader(
    'Content-Disposition',
    `${params.disposition}; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Document-Id', params.documentId);
  res.setHeader('X-Original-Checksum-Sha256', params.checksum);
  if (params.variant) {
    res.setHeader('X-Document-Variant', params.variant);
  }
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (params.mimeType === 'text/plain' || params.mimeType === 'application/pdf') {
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  }
}

function getApiBaseUrl(req: Request): string {
  const protocol = req.headers['x-forwarded-proto']?.toString().split(',')[0] || req.protocol || 'http';
  const host = req.get('host') || `localhost:${config.port}`;
  return `${protocol}://${host}`;
}

/**
 * POST /api/v1/documents/upload
 * Multipart file upload with byte-level validation, original preservation, and optimized preview generation.
 */
documentsRouter.post(
  '/upload',
  authenticate,
  upload.single('file'),
  handleMulterError,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }
      if (!req.file) {
        throw new AppError('No document file provided. Expecting multipart field "file".', 400, 'FILE_REQUIRED');
      }

      const { documentCategory, documentLabel, documentNumber, entityType, entityId } = req.body || {};

      const { dto } = await uploadAndProcessDocument({
        ownerUserId: userId,
        uploadedByUserId: userId,
        file: req.file,
        documentCategory,
        documentLabel,
        documentNumber,
        entityType,
        entityId
      });

      res.status(201).json({
        success: true,
        message: 'Document securely uploaded with original preserved and preview optimized.',
        data: dto
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/documents/upload-batch
 * Upload up to 10 documents in one multipart request ("files" field).
 */
documentsRouter.post(
  '/upload-batch',
  authenticate,
  upload.array('files', 10),
  handleMulterError,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        throw new AppError('At least one file must be uploaded under field "files".', 400, 'FILE_REQUIRED');
      }

      const { documentCategory, entityType, entityId } = req.body || {};
      const results = [];
      for (const file of files) {
        const { dto } = await uploadAndProcessDocument({
          ownerUserId: userId,
          uploadedByUserId: userId,
          file,
          documentCategory,
          entityType,
          entityId
        });
        results.push(dto);
      }

      res.status(201).json({
        success: true,
        message: `${results.length} document(s) uploaded and preserved securely.`,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/my
 * Lists private documents belonging to the currently authenticated member.
 */
documentsRouter.get(
  '/my',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const filter: Record<string, any> = {
        ownerId: userId,
        isDeleted: { $ne: true }
      };
      if (req.query.entityType) {
        filter.entityType = String(req.query.entityType).toUpperCase();
      }
      if (req.query.documentCategory) {
        filter.documentCategory = String(req.query.documentCategory).toUpperCase();
      }

      const docs = await DocumentAssetModel.find(filter).sort({ createdAt: -1 }).limit(100);
      res.json({
        success: true,
        data: docs.map((d) => toSafeDocumentDto(d, 'member'))
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/:documentId/signed?token=...
 * Serves a document via a short-lived HMAC-signed token verified against DB permissions.
 */
documentsRouter.get(
  '/:documentId/signed',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = String(req.query.token || '');
      if (!token) {
        throw new AppError('Missing signed document access token.', 401, 'TOKEN_REQUIRED');
      }

      const payload = verifySignedDocumentToken(token);
      if (payload.documentId !== req.params.documentId) {
        throw new AppError('Token does not match requested document.', 403, 'FORBIDDEN');
      }

      const doc = await getAuthorizedDocumentAsset({
        documentId: payload.documentId,
        requesterId: payload.actorId,
        isAdmin: payload.isAdmin,
        action: payload.disposition === 'attachment' ? 'download' : 'view'
      });

      if (payload.disposition === 'attachment' || payload.variant === 'original') {
        const original = await getVerifiedOriginalBuffer(doc);
        setSecurityStreamHeaders(res, {
          mimeType: original.mimeType,
          fileName: original.fileName,
          disposition: payload.disposition,
          checksum: original.checksum,
          documentId: doc.documentId,
          variant: 'original',
          byteLength: original.buffer.length
        });
        res.send(original.buffer);
        return;
      }

      const viewResult = await getViewBufferForVariant(doc, payload.variant);
      setSecurityStreamHeaders(res, {
        mimeType: viewResult.mimeType,
        fileName: viewResult.fileName,
        disposition: 'inline',
        checksum: viewResult.checksum,
        documentId: doc.documentId,
        variant: viewResult.variantServed,
        byteLength: viewResult.buffer.length
      });
      res.send(viewResult.buffer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/:documentId
 * Fetches safe metadata for a document owned by the member.
 */
documentsRouter.get(
  '/:documentId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }
      const doc = await getAuthorizedDocumentAsset({
        documentId: req.params.documentId,
        requesterId: userId,
        isAdmin: false,
        action: 'view'
      });
      res.json({ success: true, data: toSafeDocumentDto(doc, 'member') });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/:documentId/access-url
 * Returns a short-lived signed URL (S3 presigned or HMAC-signed backend URL) for preview/original view or download.
 */
documentsRouter.get(
  '/:documentId/access-url',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const rawVariant = String(req.query.variant || 'preview').toLowerCase();
      const variant: ViewVariant =
        rawVariant === 'thumbnail' ? 'thumbnail' : rawVariant === 'original' ? 'original' : 'preview';
      const disposition = String(req.query.action || 'view').toLowerCase() === 'download' ? 'attachment' : 'inline';

      const doc = await getAuthorizedDocumentAsset({
        documentId: req.params.documentId,
        requesterId: userId,
        isAdmin: false,
        action: disposition === 'attachment' ? 'download' : 'view'
      });

      const signed = await resolveSignedAccessUrl({
        doc,
        actorId: userId,
        isAdmin: false,
        variant,
        disposition,
        apiBaseUrl: getApiBaseUrl(req)
      });

      res.json({
        success: true,
        data: {
          ...signed,
          document: toSafeDocumentDto(doc, 'member')
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/:documentId/view?variant=preview|thumbnail|original
 * Authorized inline viewing endpoint. Serves compressed preview for UI speed or exact original on demand.
 */
documentsRouter.get(
  '/:documentId/view',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const rawVariant = String(req.query.variant || 'preview').toLowerCase();
      const variant: ViewVariant =
        rawVariant === 'thumbnail' ? 'thumbnail' : rawVariant === 'original' ? 'original' : 'preview';

      const doc = await getAuthorizedDocumentAsset({
        documentId: req.params.documentId,
        requesterId: userId,
        isAdmin: false,
        action: 'view'
      });

      const result = await getViewBufferForVariant(doc, variant);
      setSecurityStreamHeaders(res, {
        mimeType: result.mimeType,
        fileName: result.fileName,
        disposition: 'inline',
        checksum: result.checksum,
        documentId: doc.documentId,
        variant: result.variantServed,
        byteLength: result.buffer.length
      });
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/:documentId/download
 * Authorized download endpoint. ALWAYS serves exact original bytes after verifying SHA-256 checksum.
 */
documentsRouter.get(
  '/:documentId/download',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const doc = await getAuthorizedDocumentAsset({
        documentId: req.params.documentId,
        requesterId: userId,
        isAdmin: false,
        action: 'download'
      });

      const original = await getVerifiedOriginalBuffer(doc);
      setSecurityStreamHeaders(res, {
        mimeType: original.mimeType,
        fileName: original.fileName,
        disposition: 'attachment',
        checksum: original.checksum,
        documentId: doc.documentId,
        variant: 'original',
        byteLength: original.buffer.length
      });
      res.send(original.buffer);
    } catch (error) {
      next(error);
    }
  }
);

