import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../../../config';
import { AppError } from '../../../common/errors/app-error';
import { DocumentAssetModel, toSafeDocumentDto } from '../../documents/documents.model';
import {
  getAuthorizedDocumentAsset,
  getVerifiedOriginalBuffer,
  getViewBufferForVariant,
  resolveSignedAccessUrl,
  verifySignedDocumentToken,
  ViewVariant
} from '../../documents/documents.service';
import {
  authenticateAdmin,
  AuthenticatedAdminRequest,
  logAdminAction
} from '../middleware/admin-auth.middleware';

const router = Router();

function setAdminDocumentHeaders(
  res: Response,
  params: {
    mimeType: string;
    fileName: string;
    disposition: 'inline' | 'attachment';
    checksum: string;
    documentId: string;
    variant: string;
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
  res.setHeader('X-Document-Variant', params.variant);
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
 * GET /api/admin/documents
 * Lists stored private document assets for authorized admin review.
 */
router.get('/', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: Record<string, any> = { isDeleted: { $ne: true } };
    if (req.query.ownerId) filter.ownerId = req.query.ownerId;
    if (req.query.memberId) filter.memberId = req.query.memberId;
    if (req.query.entityType) filter.entityType = String(req.query.entityType).toUpperCase();
    if (req.query.documentStatus) filter.documentStatus = String(req.query.documentStatus).toUpperCase();

    const docs = await DocumentAssetModel.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({
      success: true,
      data: docs.map((d) => toSafeDocumentDto(d, 'admin'))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/documents/:documentId/signed?token=...
 * Short-lived HMAC-signed access endpoint for Admin UI modals/downloads.
 */
router.get('/:documentId/signed', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = String(req.query.token || '');
    if (!token) {
      throw new AppError('Missing signed document token.', 401, 'TOKEN_REQUIRED');
    }

    const payload = verifySignedDocumentToken(token);
    if (!payload.isAdmin || payload.documentId !== req.params.documentId) {
      throw new AppError('Invalid admin signed document token.', 403, 'FORBIDDEN');
    }

    const doc = await getAuthorizedDocumentAsset({
      documentId: payload.documentId,
      requesterId: payload.actorId,
      isAdmin: true,
      action: payload.disposition === 'attachment' ? 'download' : 'view'
    });

    if (payload.disposition === 'attachment' || payload.variant === 'original') {
      const original = await getVerifiedOriginalBuffer(doc);
      setAdminDocumentHeaders(res, {
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
    setAdminDocumentHeaders(res, {
      mimeType: viewResult.mimeType,
      fileName: viewResult.fileName,
      disposition: 'inline',
      checksum: viewResult.checksum,
      documentId: doc.documentId,
      variant: viewResult.variantServed,
      byteLength: viewResult.buffer.length
    });
    res.send(viewResult.buffer);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/documents/:documentId/access-url
 * Generates short-lived S3 presigned URL or signed Admin API URL.
 */
router.get(
  '/:documentId/access-url',
  authenticateAdmin,
  async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = (req.admin?.id || 'admin').toString();
      const rawVariant = String(req.query.variant || 'preview').toLowerCase();
      const variant: ViewVariant =
        rawVariant === 'thumbnail' ? 'thumbnail' : rawVariant === 'original' ? 'original' : 'preview';
      const disposition = String(req.query.action || 'view').toLowerCase() === 'download' ? 'attachment' : 'inline';

      const doc = await getAuthorizedDocumentAsset({
        documentId: req.params.documentId,
        requesterId: adminId,
        isAdmin: true,
        action: disposition === 'attachment' ? 'download' : 'view'
      });

      const signed = await resolveSignedAccessUrl({
        doc,
        actorId: adminId,
        isAdmin: true,
        variant,
        disposition,
        apiBaseUrl: getApiBaseUrl(req)
      });

      await logAdminAction(
        req,
        disposition === 'attachment' ? 'DOCUMENT_DOWNLOAD_URL' : 'DOCUMENT_VIEW_URL',
        'DocumentAsset',
        doc.documentId,
        { variant }
      );

      res.json({
        success: true,
        data: {
          ...signed,
          document: toSafeDocumentDto(doc, 'admin')
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/admin/documents/:documentId/view?variant=preview|thumbnail|original
 */
router.get(
  '/:documentId/view',
  authenticateAdmin,
  async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = (req.admin?.id || 'admin').toString();
      const rawVariant = String(req.query.variant || 'preview').toLowerCase();
      const variant: ViewVariant =
        rawVariant === 'thumbnail' ? 'thumbnail' : rawVariant === 'original' ? 'original' : 'preview';

      const doc = await getAuthorizedDocumentAsset({
        documentId: req.params.documentId,
        requesterId: adminId,
        isAdmin: true,
        action: 'view'
      });

      const result = await getViewBufferForVariant(doc, variant);
      await logAdminAction(req, 'VIEW_DOCUMENT', 'DocumentAsset', doc.documentId, {
        variant: result.variantServed
      });

      setAdminDocumentHeaders(res, {
        mimeType: result.mimeType,
        fileName: result.fileName,
        disposition: 'inline',
        checksum: result.checksum,
        documentId: doc.documentId,
        variant: result.variantServed,
        byteLength: result.buffer.length
      });
      res.send(result.buffer);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/admin/documents/:documentId/download
 * Streams verified exact original file to authorized admin.
 */
router.get(
  '/:documentId/download',
  authenticateAdmin,
  async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = (req.admin?.id || 'admin').toString();
      const doc = await getAuthorizedDocumentAsset({
        documentId: req.params.documentId,
        requesterId: adminId,
        isAdmin: true,
        action: 'download'
      });

      const original = await getVerifiedOriginalBuffer(doc);
      await logAdminAction(req, 'DOWNLOAD_DOCUMENT', 'DocumentAsset', doc.documentId, {
        originalFileName: original.fileName,
        checksum: original.checksum
      });

      setAdminDocumentHeaders(res, {
        mimeType: original.mimeType,
        fileName: original.fileName,
        disposition: 'attachment',
        checksum: original.checksum,
        documentId: doc.documentId,
        variant: 'original',
        byteLength: original.buffer.length
      });
      res.send(original.buffer);
    } catch (err) {
      next(err);
    }
  }
);

export const adminDocumentsRouter = router;
