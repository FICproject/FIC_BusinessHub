import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { KYCSubmissionModel } from './kyc.model';
import { UserModel } from '../users/users.model';
import { MemberModel } from '../admin/models/Member';
import { KycSubmissionModel as AdminKycSubmissionModel } from '../admin/models/KycSubmission';
import { CategoryModel as AdminCategoryModel } from '../admin/models/Category';
import { DocumentAssetModel, toSafeDocumentDto } from '../documents/documents.model';
import { uploadAndProcessDocument } from '../documents/documents.service';
import { PaymentModel } from '../payments/payments.model';
import { syncAdminPaymentRecord } from '../payments/payments.service';
import { awardReferralBonusIfApplicable } from '../auth/auth.controller';
import { authenticate, requireRoles, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import { config } from '../../config';
import { KYCStatus, UserRole } from '@fic/shared-types';
import {
  buildApprovedProfileDocuments,
  buildNormalizedKycDocuments,
  evaluateMemberActivationAccess,
  normalizeDocStatus,
  normalizeOverallKycStatus
} from './kyc-status.helpers';
import { listMemberNotifications, notifyAdmins, notifyMember } from '../notifications/notifications.service';
import {
  MAX_KYC_FILE_BYTES,
  validateAndMaskAadhaar,
  validatePanNumber
} from '../../common/utils/registration-validation';

export const kycRouter = Router();

const reuploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_KYC_FILE_BYTES,
    files: 1
  }
});

function handleReuploadMulterError(err: any, _req: Request, _res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size must not exceed 2 MB. Please upload a smaller file.', 400, 'FILE_TOO_LARGE'));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400, 'UPLOAD_ERROR'));
  }
  next(err);
}

// Submit initial or updated KYC documents (linked to private DocumentAsset uploads)
kycRouter.post('/submit', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { categoryId, documents } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      throw new AppError('Please provide at least one required KYC document.', 400);
    }

    const user = await UserModel.findById(req.user.userId);
    if (!user) throw new AppError('User account not found.', 404);

    const resolvedCategoryId =
      categoryId && mongoose.isValidObjectId(categoryId)
        ? new mongoose.Types.ObjectId(categoryId)
        : user.primaryCategoryId || new mongoose.Types.ObjectId();

    let categoryName = user.primaryCategoryName || 'General Business';
    let foundCat: any = null;
    try {
      foundCat = await AdminCategoryModel.findById(resolvedCategoryId);
      if (foundCat) categoryName = foundCat.name;
    } catch {
      // Keep existing name
    }

    // Preserve any already-APPROVED documents if this user already has an existing AdminKycSubmissionModel
    const existingAdminSub = await AdminKycSubmissionModel.findOne({
      $or: [{ memberId: user._id }, { memberEmail: user.email.toLowerCase() }]
    }).lean() as any;

    if (existingAdminSub && (existingAdminSub.status === 'APPROVED' || existingAdminSub.isLocked)) {
      throw new AppError(
        'Your KYC application has already been permanently approved and locked.',
        409,
        'KYC_ALREADY_APPROVED'
      );
    }

    const verifiedPayment = await PaymentModel.findOne({
      userId: req.user.userId,
      status: 'SUCCESS'
    })
      .sort({ createdAt: -1 })
      .lean();

    const existingMemberPaid = await MemberModel.exists({
      $or: [{ _id: user._id }, { email: user.email.toLowerCase() }],
      paymentStatus: 'PAID'
    });

    if (!verifiedPayment && !user.isMembershipActive && !existingMemberPaid) {
      throw new AppError(
        'Membership payment must be completed successfully before submitting your KYC application.',
        402,
        'PAYMENT_REQUIRED_BEFORE_KYC_SUBMISSION'
      );
    }

    if (foundCat && Array.isArray(foundCat.kycRequirements) && foundCat.kycRequirements.length > 0) {
      const submittedKeys = new Set(
        documents
          .map((d: any) => String(d.documentType || d.docKey || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_'))
          .filter(Boolean)
      );
      const hasPanAndIdFallback =
        submittedKeys.has('PAN_CARD') &&
        (submittedKeys.has('AADHAAR_CARD') ||
          submittedKeys.has('PASSPORT') ||
          submittedKeys.has('VOTER_ID') ||
          submittedKeys.has('DRIVING_LICENCE') ||
          submittedKeys.has('GOVT_ID'));
      for (const reqDoc of foundCat.kycRequirements) {
        const reqKey = String(reqDoc.docKey || reqDoc.documentType || reqDoc.type || reqDoc.title || '')
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_');
        const titleLower = String(reqDoc.title || reqDoc.label || '').toLowerCase();
        const isGenericIdentity =
          ['GOVT_ID', 'PAN_CARD', 'AADHAAR', 'AADHAAR_CARD', 'ID_PROOF', 'OWNER_ID'].includes(reqKey) ||
          titleLower.includes('aadhaar') ||
          /\bpan\b/.test(titleLower);
        const isCollegeDoc =
          ['COLLEGE_ID', 'STUDENT_ID', 'STUDENT_OR_EMP_ID'].includes(reqKey) ||
          titleLower.includes('college');
        const hasCollegeSubmitted =
          submittedKeys.has('COLLEGE_ID') ||
          submittedKeys.has('STUDENT_ID') ||
          submittedKeys.has('STUDENT_OR_EMP_ID');
        if (
          reqDoc.required &&
          !submittedKeys.has(reqKey) &&
          !(isGenericIdentity && hasPanAndIdFallback) &&
          !(isCollegeDoc && hasCollegeSubmitted)
        ) {
          throw new AppError(
            `Required category document "${reqDoc.title || reqKey}" is missing.`,
            400,
            'CATEGORY_DOCUMENT_REQUIRED'
          );
        }
      }
    }

    const existingApprovedByDocKey = new Map<string, any>();
    for (const d of existingAdminSub?.documents || []) {
      if (normalizeDocStatus(d.status) === 'APPROVED') {
        existingApprovedByDocKey.set(String(d.docKey), d);
      }
    }

    const verifiedDocs = await Promise.all(
      documents.map(async (doc: any, index: number) => {
        const docType = doc.documentType || doc.docKey || `doc_${index}`;
        const existingApproved = existingApprovedByDocKey.get(String(docType));
        if (existingApproved) {
          // Safeguard: never overwrite an already approved document via bulk submit
          return {
            documentId: existingApproved.documentId,
            documentType: existingApproved.docKey,
            title: existingApproved.title,
            fileUrl: existingApproved.documentId
              ? `/api/v1/documents/${existingApproved.documentId}/view`
              : existingApproved.fileUrl,
            fileName: existingApproved.fileName,
            originalMimeType: existingApproved.originalMimeType,
            originalFileSize: existingApproved.originalFileSize,
            checksum: existingApproved.checksum,
            hasOptimizedPreview: existingApproved.hasOptimizedPreview,
            hasThumbnail: existingApproved.hasThumbnail,
            documentNumber: existingApproved.documentNumber || '',
            uploadedAt: existingApproved.uploadedAt,
            status: 'APPROVED',
            version: existingApproved.version || 1,
            reviewedAt: existingApproved.reviewedAt,
            reviewedByName: existingApproved.reviewedByName,
            versionHistory: existingApproved.versionHistory || []
          };
        }

        if (doc.documentId) {
          const asset = await DocumentAssetModel.findOne({
            documentId: String(doc.documentId),
            ownerId: req.user!.userId,
            isDeleted: { $ne: true }
          });
          if (!asset) {
            throw new AppError(
              `Referenced KYC document "${doc.documentId}" was not found or belongs to another user.`,
              403,
              'INVALID_DOCUMENT_REFERENCE'
            );
          }

          let sanitizedDocNum = String(doc.documentNumber || asset.documentNumber || '').trim();
          const upperType = String(docType || '').toUpperCase();
          if (upperType === 'PAN_CARD' && sanitizedDocNum) {
            sanitizedDocNum = validatePanNumber(sanitizedDocNum);
          } else if (upperType === 'AADHAAR_CARD' && sanitizedDocNum) {
            sanitizedDocNum = validateAndMaskAadhaar(sanitizedDocNum).masked;
            if (asset.documentNumber !== sanitizedDocNum) {
              asset.documentNumber = sanitizedDocNum;
            }
          }

          asset.documentStatus = 'PENDING_REVIEW';
          asset.entityType = 'KYC';
          asset.isLatestVersion = true;
          asset.version = asset.version || 1;
          await asset.save();

          return {
            documentId: asset.documentId,
            documentType: docType,
            title: doc.documentName || doc.title || asset.documentLabel || docType || `Document ${index + 1}`,
            fileUrl: `/api/v1/documents/${asset.documentId}/view`,
            fileName: asset.originalFileName,
            originalMimeType: asset.originalMimeType,
            originalFileSize: asset.originalFileSize,
            checksum: asset.checksum,
            hasOptimizedPreview: Boolean(asset.optimizedStorageKey),
            hasThumbnail: Boolean(asset.thumbnailStorageKey),
            documentNumber: sanitizedDocNum,
            uploadedAt: asset.createdAt.toISOString(),
            status: 'PENDING_REVIEW',
            version: asset.version || 1,
            versionHistory: []
          };
        }

        const rawUrl = String(doc.fileUrl || '');
        if (rawUrl.startsWith('data:')) {
          throw new AppError(
            'Raw base64 KYC payloads are no longer accepted. Please upload files using POST /api/v1/documents/upload first.',
            400,
            'DIRECT_MULTIPART_UPLOAD_REQUIRED'
          );
        }

        return {
          documentId: undefined,
          documentType: docType,
          title: doc.documentName || doc.title || docType || `Document ${index + 1}`,
          fileUrl: rawUrl,
          fileName: doc.fileName || doc.documentName || `Document_${index + 1}`,
          documentNumber: doc.documentNumber || '',
          uploadedAt: new Date().toISOString(),
          status: 'PENDING_REVIEW',
          version: 1,
          versionHistory: []
        };
      })
    );

    // Also retain any previously APPROVED documents not included in the payload
    for (const [approvedKey, approvedDoc] of existingApprovedByDocKey.entries()) {
      if (!verifiedDocs.some((d) => String(d.documentType) === approvedKey)) {
        verifiedDocs.unshift({
          documentId: approvedDoc.documentId,
          documentType: approvedDoc.docKey,
          title: approvedDoc.title,
          fileUrl: approvedDoc.documentId
            ? `/api/v1/documents/${approvedDoc.documentId}/view`
            : approvedDoc.fileUrl,
          fileName: approvedDoc.fileName,
          originalMimeType: approvedDoc.originalMimeType,
          originalFileSize: approvedDoc.originalFileSize,
          checksum: approvedDoc.checksum,
          hasOptimizedPreview: approvedDoc.hasOptimizedPreview,
          hasThumbnail: approvedDoc.hasThumbnail,
          documentNumber: approvedDoc.documentNumber || '',
          uploadedAt: approvedDoc.uploadedAt,
          status: 'APPROVED',
          version: approvedDoc.version || 1,
          reviewedAt: approvedDoc.reviewedAt,
          reviewedByName: approvedDoc.reviewedByName,
          versionHistory: approvedDoc.versionHistory || []
        });
      }
    }

    const formattedAdminDocs = verifiedDocs.map((doc: any) => ({
      ...(doc.documentId ? { documentId: doc.documentId } : {}),
      docKey: doc.documentType,
      title: doc.title,
      fileUrl: doc.documentId ? `/api/admin/documents/${doc.documentId}/view` : doc.fileUrl,
      fileName: doc.fileName,
      originalMimeType: doc.originalMimeType,
      originalFileSize: doc.originalFileSize,
      checksum: doc.checksum,
      hasOptimizedPreview: doc.hasOptimizedPreview,
      hasThumbnail: doc.hasThumbnail,
      documentNumber: doc.documentNumber || '',
      uploadedAt: doc.uploadedAt,
      status: doc.status || 'PENDING_REVIEW',
      version: doc.version || 1,
      ...(doc.reviewedAt ? { reviewedAt: doc.reviewedAt } : {}),
      ...(doc.reviewedByName ? { reviewedByName: doc.reviewedByName } : {}),
      versionHistory: doc.versionHistory || []
    }));

    const verifiedPaymentDetails = verifiedPayment
      ? {
          orderId: verifiedPayment.razorpayOrderId || verifiedPayment.internalOrderId,
          paymentId: verifiedPayment.razorpayPaymentId || verifiedPayment.paymentId,
          amount: verifiedPayment.amount,
          currency: verifiedPayment.currency || 'INR',
          method: verifiedPayment.paymentMethod || 'RAZORPAY',
          paidAt: verifiedPayment.verifiedAt || verifiedPayment.updatedAt,
          status: 'CAPTURED'
        }
      : undefined;

    // 1. Save / Update in customer KYC submission collection
    const submission = await KYCSubmissionModel.findOneAndUpdate(
      { userId: req.user.userId },
      {
        $set: {
          userId: req.user.userId,
          categoryId: resolvedCategoryId,
          status: KYCStatus.PENDING,
          documents: verifiedDocs.map((doc: any) => ({
            ...(doc.documentId ? { documentId: doc.documentId } : {}),
            documentType: doc.documentType || 'ID_PROOF',
            title: doc.title,
            documentNumber: doc.documentNumber || '',
            originalFileName: doc.fileName,
            originalMimeType: doc.originalMimeType,
            originalFileSize: doc.originalFileSize,
            checksum: doc.checksum,
            hasOptimizedPreview: doc.hasOptimizedPreview,
            hasThumbnail: doc.hasThumbnail,
            fileUrl: doc.fileUrl,
            verificationStatus: doc.status === 'APPROVED' ? KYCStatus.APPROVED : 'PENDING_REVIEW',
            version: doc.version || 1,
            reviewedAt: doc.reviewedAt,
            reviewedByName: doc.reviewedByName,
            versionHistory: doc.versionHistory || [],
            uploadedAt: new Date(doc.uploadedAt)
          }))
        },
        $unset: {
          rejectionReason: 1,
          reviewedAt: 1,
          reviewedBy: 1
        }
      },
      { upsert: true, new: true }
    );

    const finalReferredByCode = req.body.referredByCode || user.referredByCode || undefined;
    const finalReferrerUserId = req.body.referrerUserId || user.referrerUserId || undefined;
    const finalReferralSource = (finalReferredByCode || finalReferrerUserId || user.referralSource === 'REFERRED') ? 'REFERRED' : 'ORGANIC';

    if (finalReferredByCode && !user.referredByCode) {
      user.referredByCode = finalReferredByCode;
      user.referralSource = 'REFERRED';
      if (finalReferrerUserId) user.referrerUserId = finalReferrerUserId;
      await user.save();
    }

    // 2. Synchronize to Admin KYC Submission collection
    const adminSub = await AdminKycSubmissionModel.findOneAndUpdate(
      { $or: [{ memberId: user._id }, { memberEmail: user.email.toLowerCase() }] },
      {
        $set: {
          memberId: user._id,
          memberName: user.fullName,
          memberEmail: user.email.toLowerCase(),
          memberPhone: user.phoneNumber,
          memberDob: user.dob,
          subCategory: user.subCategory || user.primarySubcategoryName || '',
          address: user.address,
          dynamicProfile: user.dynamicProfile,
          ...(verifiedPaymentDetails ? { paymentDetails: verifiedPaymentDetails } : {}),
          categoryId: resolvedCategoryId,
          categoryName,
          status: 'SUBMITTED',
          documents: formattedAdminDocs,
          referredByCode: finalReferredByCode,
          referrerUserId: finalReferrerUserId,
          referralSource: finalReferralSource,
          submittedAt: existingAdminSub?.submittedAt || new Date()
        },
        $unset: {
          rejectionReason: 1,
          verifiedAt: 1
        }
      },
      { upsert: true, new: true }
    );

    // 3. Keep Member record in sync cleanly
    await MemberModel.findOneAndUpdate(
      { $or: [{ _id: user._id }, { email: user.email.toLowerCase() }] },
      {
        $setOnInsert: {
          _id: user._id,
          registeredAt: user.createdAt || new Date()
        },
        $set: {
          name: user.fullName,
          email: user.email.toLowerCase(),
          phone: user.phoneNumber,
          primaryCategory: resolvedCategoryId,
          primaryCategoryName: categoryName,
          subcategories: [user.subCategory || user.primarySubcategoryName || 'Member'].filter(Boolean),
          kycStatus: 'SUBMITTED',
          status: 'UNDER_REVIEW',
          membershipPlan: verifiedPayment?.purpose === 'MEMBERSHIP_RENEWAL' ? 'ANNUAL_RENEWAL' : 'FIRST_YEAR_INTRO',
          membershipFeePaid: verifiedPayment ? verifiedPayment.amount : 0,
          paymentStatus: verifiedPayment ? 'PAID' : 'PENDING'
        }
      },
      { upsert: true }
    );

    await UserModel.findByIdAndUpdate(req.user.userId, {
      activeKycSubmissionId: submission._id,
      isKycApproved: false
    });

    if (verifiedPayment) {
      await syncAdminPaymentRecord(verifiedPayment as any, 'SUCCESS').catch((err) =>
        console.warn('Admin payment sync warning during KYC submit:', err)
      );
    }

    await awardReferralBonusIfApplicable(user).catch((err) =>
      console.warn('Referral bonus sync warning during KYC submit:', err)
    );

    await Promise.allSettled([
      notifyAdmins({
        eventType: 'NEW_KYC_SUBMITTED',
        title: 'KYC Application Submitted',
        message: `${user.fullName} (${categoryName}) submitted ${formattedAdminDocs.length} KYC document(s) for verification.`,
        link: '/kyc',
        priority: 'HIGH',
        metadata: {
          kycSubmissionId: adminSub._id.toString(),
          memberEmail: user.email
        }
      }),
      notifyMember({
        userId: user._id,
        eventType: 'KYC_SUBMITTED',
        title: 'KYC Documents Under Verification',
        message:
          'Your documents have been submitted and are currently under verification. Your dashboard will become available once approved.',
        link: '/kyc-pending',
        priority: 'MEDIUM',
        metadata: { kycSubmissionId: adminSub._id.toString() }
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'KYC application submitted successfully. It is now in queue for FIC verification.',
      data: submission
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/kyc/documents/:docRef/reupload
 * Single-document versioned reupload.
 * Strictly allows reuploading ONLY documents whose status is REUPLOAD_REQUIRED.
 * Preserves previously APPROVED documents and archives old versions into versionHistory.
 */
kycRouter.post(
  '/documents/:docRef/reupload',
  authenticate,
  reuploadMulter.single('file'),
  handleReuploadMulterError,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const docRef = String(req.params.docRef || '').trim();
      if (!docRef) throw new AppError('Document identifier is required.', 400, 'DOC_REF_REQUIRED');

      const user = await UserModel.findById(userId);
      if (!user) throw new AppError('User account not found.', 404, 'USER_NOT_FOUND');

      const adminSub = await AdminKycSubmissionModel.findOne({
        $or: [{ memberId: user._id }, { memberEmail: user.email.toLowerCase() }]
      });

      if (!adminSub || !Array.isArray(adminSub.documents) || adminSub.documents.length === 0) {
        throw new AppError('No KYC submission found to update.', 404, 'KYC_NOT_FOUND');
      }

      const targetIndex = adminSub.documents.findIndex(
        (d: any) => String(d.docKey) === docRef || (d.documentId && String(d.documentId) === docRef)
      );

      if (targetIndex === -1) {
        throw new AppError('Requested KYC document was not found on your submission.', 404, 'DOCUMENT_NOT_FOUND');
      }

      const targetDoc = adminSub.documents[targetIndex] as any;
      const currentStatus = normalizeDocStatus(targetDoc.status);

      if (currentStatus === 'APPROVED') {
        throw new AppError(
          'This document is already approved and locked. You cannot replace an approved document.',
          403,
          'DOCUMENT_ALREADY_APPROVED'
        );
      }

      if (currentStatus !== 'REUPLOAD_REQUIRED') {
        throw new AppError(
          `Document "${targetDoc.title}" is currently ${currentStatus} and does not require reupload.`,
          403,
          'DOCUMENT_REUPLOAD_NOT_ALLOWED'
        );
      }

      const oldDocumentId = targetDoc.documentId ? String(targetDoc.documentId) : undefined;
      const oldVersion = Number(targetDoc.version || 1);
      const nextVersion = oldVersion + 1;
      const documentNumber =
        typeof req.body?.documentNumber === 'string' && req.body.documentNumber.trim()
          ? req.body.documentNumber.trim()
          : targetDoc.documentNumber || '';

      let uploadedAsset: any = null;

      if (req.file) {
        const result = await uploadAndProcessDocument({
          ownerUserId: userId,
          uploadedByUserId: userId,
          file: req.file,
          documentCategory: 'KYC_RESUBMISSION',
          documentLabel: targetDoc.title || targetDoc.docKey,
          documentNumber,
          entityType: 'KYC',
          entityId: adminSub._id.toString()
        });
        uploadedAsset = await DocumentAssetModel.findOne({ documentId: result.dto.documentId });
      } else if (req.body?.documentId) {
        uploadedAsset = await DocumentAssetModel.findOne({
          documentId: String(req.body.documentId),
          ownerId: user._id,
          isDeleted: { $ne: true }
        });
        if (!uploadedAsset) {
          throw new AppError(
            'Referenced replacement document was not found or belongs to another user.',
            403,
            'INVALID_DOCUMENT_REFERENCE'
          );
        }
      } else {
        throw new AppError(
          'Please upload a replacement file (field "file") or provide a valid uploaded documentId.',
          400,
          'FILE_REQUIRED'
        );
      }

      // Archive previous DocumentAsset if it existed
      if (oldDocumentId) {
        await DocumentAssetModel.updateOne(
          { documentId: oldDocumentId, ownerId: user._id },
          {
            $set: {
              isLatestVersion: false,
              documentStatus: 'ARCHIVED'
            }
          }
        );
      }

      uploadedAsset.version = nextVersion;
      uploadedAsset.isLatestVersion = true;
      uploadedAsset.previousVersionId = oldDocumentId;
      uploadedAsset.previousVersionReference = oldDocumentId;
      uploadedAsset.documentStatus = 'PENDING_REVIEW';
      uploadedAsset.entityType = 'KYC';
      uploadedAsset.adminReviewReason = undefined;
      uploadedAsset.reviewedAt = undefined;
      uploadedAsset.reviewedBy = undefined;
      uploadedAsset.reviewedByName = undefined;
      if (documentNumber) uploadedAsset.documentNumber = documentNumber;
      await uploadedAsset.save();

      const existingHistory = Array.isArray(targetDoc.versionHistory) ? [...targetDoc.versionHistory] : [];
      existingHistory.push({
        version: oldVersion,
        documentId: oldDocumentId,
        fileUrl: targetDoc.fileUrl,
        fileName: targetDoc.fileName,
        originalMimeType: targetDoc.originalMimeType,
        originalFileSize: targetDoc.originalFileSize,
        checksum: targetDoc.checksum,
        uploadedAt: targetDoc.uploadedAt,
        status: currentStatus,
        reason: targetDoc.adminReviewReason || targetDoc.rejectionReason,
        reviewedAt: targetDoc.reviewedAt,
        reviewedByName: targetDoc.reviewedByName
      });

      const now = new Date();
      adminSub.documents[targetIndex] = {
        docKey: targetDoc.docKey,
        title: targetDoc.title,
        documentId: uploadedAsset.documentId,
        fileUrl: `/api/admin/documents/${uploadedAsset.documentId}/view`,
        fileName: uploadedAsset.originalFileName,
        originalMimeType: uploadedAsset.originalMimeType,
        originalFileSize: uploadedAsset.originalFileSize,
        checksum: uploadedAsset.checksum,
        hasOptimizedPreview: Boolean(uploadedAsset.optimizedStorageKey),
        hasThumbnail: Boolean(uploadedAsset.thumbnailStorageKey),
        documentNumber,
        uploadedAt: now.toISOString(),
        status: 'PENDING_REVIEW',
        version: nextVersion,
        previousVersionReference: oldDocumentId,
        adminReviewReason: undefined,
        rejectionReason: undefined,
        reviewedAt: undefined,
        reviewedBy: undefined,
        reviewedByName: undefined,
        versionHistory: existingHistory
      } as any;

      const stillNeedsReupload = adminSub.documents.some(
        (d: any) => normalizeDocStatus(d.status) === 'REUPLOAD_REQUIRED'
      );

      adminSub.lastResubmittedAt = now;
      if (!stillNeedsReupload) {
        adminSub.status = 'UNDER_REVIEW';
        adminSub.rejectionReason = undefined;
      }
      adminSub.markModified('documents');
      await adminSub.save();

      // Sync customer KYCSubmissionModel while preserving all untouched/approved docs
      await KYCSubmissionModel.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            status: stillNeedsReupload ? KYCStatus.RESUBMIT_REQUIRED : KYCStatus.PENDING,
            documents: adminSub.documents.map((d: any) => ({
              ...(d.documentId ? { documentId: d.documentId } : {}),
              documentType: d.docKey,
              title: d.title,
              documentNumber: d.documentNumber || '',
              originalFileName: d.fileName,
              originalMimeType: d.originalMimeType,
              originalFileSize: d.originalFileSize,
              checksum: d.checksum,
              hasOptimizedPreview: d.hasOptimizedPreview,
              hasThumbnail: d.hasThumbnail,
              fileUrl: d.documentId ? `/api/v1/documents/${d.documentId}/view` : d.fileUrl,
              uploadedAt: new Date(d.uploadedAt),
              verificationStatus: normalizeDocStatus(d.status),
              adminReviewReason: d.adminReviewReason,
              remarks: d.adminReviewReason,
              version: d.version || 1,
              previousVersionReference: d.previousVersionReference,
              reviewedAt: d.reviewedAt,
              reviewedByName: d.reviewedByName,
              versionHistory: d.versionHistory || []
            }))
          },
          ...(!stillNeedsReupload ? { $unset: { rejectionReason: 1 } } : {})
        },
        { upsert: true }
      );

      await MemberModel.findOneAndUpdate(
        { $or: [{ _id: user._id }, { email: user.email.toLowerCase() }] },
        {
          $set: {
            kycStatus: stillNeedsReupload ? 'RESUBMISSION_REQUESTED' : 'UNDER_REVIEW',
            status: stillNeedsReupload ? 'PENDING_KYC' : 'UNDER_REVIEW'
          }
        }
      );

      // Keep isKycApproved false until Admin reviews & approves resubmitted document + KYC
      await UserModel.findByIdAndUpdate(user._id, { $set: { isKycApproved: false } });

      await Promise.allSettled([
        notifyAdmins({
          eventType: 'DOCUMENT_RESUBMITTED',
          title: 'KYC Document Resubmitted',
          message: `${user.fullName} uploaded a revised version (v${nextVersion}) of "${targetDoc.title}" for review.`,
          link: '/kyc',
          priority: 'HIGH',
          metadata: {
            kycSubmissionId: adminSub._id.toString(),
            memberId: user._id.toString(),
            documentId: uploadedAsset.documentId,
            docKey: targetDoc.docKey,
            documentLabel: targetDoc.title,
            version: nextVersion
          }
        }),
        notifyMember({
          userId: user._id,
          eventType: 'DOCUMENT_RESUBMITTED',
          title: 'Revised Document Uploaded',
          message: `Your updated "${targetDoc.title}" (v${nextVersion}) has been uploaded and is pending Admin review.`,
          link: '/kyc-pending',
          priority: 'MEDIUM',
          metadata: {
            documentId: uploadedAsset.documentId,
            docKey: targetDoc.docKey,
            version: nextVersion
          }
        })
      ]);

      const updatedNormalizedDocs = buildNormalizedKycDocuments(adminSub.documents, [], [uploadedAsset]);

      res.status(200).json({
        success: true,
        message: `"${targetDoc.title}" (v${nextVersion}) reuploaded successfully and queued for Admin review.`,
        data: {
          kycStatus: adminSub.status,
          stillNeedsReupload,
          document: updatedNormalizedDocs[targetIndex],
          documents: updatedNormalizedDocs
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/kyc/additional-documents/:requestId/upload
 * Member uploads a newly requested additional document created via Admin "Add Documents".
 */
kycRouter.post(
  '/additional-documents/:requestId/upload',
  authenticate,
  reuploadMulter.single('file'),
  handleReuploadMulterError,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const requestId = String(req.params.requestId || '').trim();
      if (!requestId) throw new AppError('Additional document requestId is required.', 400, 'REQUEST_ID_REQUIRED');

      if (!req.file) {
        throw new AppError('Please attach the requested document file (max 2 MB).', 400, 'FILE_REQUIRED');
      }

      if (req.file.buffer.length > MAX_KYC_FILE_BYTES) {
        throw new AppError('File size must not exceed 2 MB. Please upload a smaller file.', 400, 'FILE_TOO_LARGE');
      }

      const user = await UserModel.findById(userId);
      if (!user) throw new AppError('User account not found.', 404, 'USER_NOT_FOUND');

      const adminSub = await AdminKycSubmissionModel.findOne({
        $or: [{ memberId: user._id }, { memberEmail: user.email.toLowerCase() }]
      });
      if (!adminSub) {
        throw new AppError('KYC submission record not found.', 404, 'KYC_NOT_FOUND');
      }

      if (adminSub.isLocked || adminSub.status === 'APPROVED') {
        throw new AppError(
          'Your KYC application is already permanently approved and locked.',
          409,
          'KYC_ALREADY_APPROVED'
        );
      }

      const reqList = Array.isArray(adminSub.additionalDocumentRequests)
        ? adminSub.additionalDocumentRequests
        : [];
      const reqIndex = reqList.findIndex((r: any) => String(r.requestId) === requestId);
      if (reqIndex === -1) {
        throw new AppError('Additional document request not found.', 404, 'ADDITIONAL_REQUEST_NOT_FOUND');
      }

      const targetReq = reqList[reqIndex] as any;
      if (String(targetReq.status || '').toUpperCase() === 'CANCELLED') {
        throw new AppError(
          'This document request was cancelled by the administrator and does not accept uploads.',
          409,
          'ADDITIONAL_REQUEST_CANCELLED'
        );
      }
      if (!['PENDING', 'REUPLOAD_REQUIRED'].includes(String(targetReq.status || '').toUpperCase())) {
        throw new AppError(
          `This document request is currently "${targetReq.status}" and does not accept new uploads.`,
          403,
          'ADDITIONAL_REQUEST_NOT_UPLOADABLE'
        );
      }

      const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
      const allowedExts = Array.isArray(targetReq.allowedExtensions) && targetReq.allowedExtensions.length > 0
        ? targetReq.allowedExtensions.map((x: string) => x.toLowerCase())
        : ['pdf', 'jpg', 'jpeg', 'png'];
      if (!allowedExts.includes(ext)) {
        throw new AppError(
          `Unsupported file format. Accepted formats for "${targetReq.documentName}": ${allowedExts.join(', ').toUpperCase()}.`,
          400,
          'UNSUPPORTED_FILE_TYPE'
        );
      }

      const result = await uploadAndProcessDocument({
        ownerUserId: userId,
        uploadedByUserId: userId,
        file: req.file,
        documentCategory: 'KYC_BUSINESS',
        documentLabel: targetReq.documentName,
        entityType: 'KYC',
        entityId: adminSub._id.toString()
      });

      const uploadedAsset = await DocumentAssetModel.findOne({ documentId: result.dto.documentId });
      if (!uploadedAsset) {
        throw new AppError('Failed to persist uploaded document.', 500, 'UPLOAD_PERSISTENCE_ERROR');
      }

      uploadedAsset.documentStatus = 'PENDING_REVIEW';
      await uploadedAsset.save();

      const now = new Date();
      const docKey = targetReq.docKey || `ADD_DOC_${targetReq.requestId}`;
      const existingDocIdx = (adminSub.documents || []).findIndex((d: any) => String(d.docKey) === docKey);

      const newDocRecord: any = {
        documentId: uploadedAsset.documentId,
        docKey,
        title: targetReq.documentName,
        fileUrl: `/api/admin/documents/${uploadedAsset.documentId}/view`,
        fileName: uploadedAsset.originalFileName,
        originalMimeType: uploadedAsset.originalMimeType,
        originalFileSize: uploadedAsset.originalFileSize,
        checksum: uploadedAsset.checksum,
        hasOptimizedPreview: Boolean(uploadedAsset.optimizedStorageKey),
        hasThumbnail: Boolean(uploadedAsset.thumbnailStorageKey),
        documentNumber: '',
        uploadedAt: now.toISOString(),
        status: 'PENDING_REVIEW',
        version: existingDocIdx >= 0 ? Number((adminSub.documents[existingDocIdx] as any).version || 1) + 1 : 1,
        versionHistory: existingDocIdx >= 0 ? (adminSub.documents[existingDocIdx] as any).versionHistory || [] : []
      };

      if (existingDocIdx >= 0) {
        const prevDoc = adminSub.documents[existingDocIdx] as any;
        newDocRecord.versionHistory = [
          ...(prevDoc.versionHistory || []),
          {
            version: prevDoc.version || 1,
            documentId: prevDoc.documentId,
            fileUrl: prevDoc.fileUrl,
            fileName: prevDoc.fileName,
            uploadedAt: prevDoc.uploadedAt,
            status: prevDoc.status,
            reason: targetReq.reviewReason || targetReq.reason
          }
        ];
        adminSub.documents[existingDocIdx] = newDocRecord;
      } else {
        adminSub.documents.push(newDocRecord);
      }
      adminSub.markModified('documents');

      targetReq.status = 'SUBMITTED';
      targetReq.fulfilledDocumentId = uploadedAsset.documentId;
      targetReq.submittedAt = now;
      adminSub.additionalDocumentRequests![reqIndex] = targetReq;
      adminSub.markModified('additionalDocumentRequests');
      adminSub.lastResubmittedAt = now;
      await adminSub.save();

      await KYCSubmissionModel.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            additionalDocumentRequests: adminSub.additionalDocumentRequests,
            documents: adminSub.documents.map((d: any) => ({
              ...(d.documentId ? { documentId: d.documentId } : {}),
              documentType: d.docKey,
              title: d.title,
              documentNumber: d.documentNumber || '',
              originalFileName: d.fileName,
              originalMimeType: d.originalMimeType,
              originalFileSize: d.originalFileSize,
              checksum: d.checksum,
              hasOptimizedPreview: d.hasOptimizedPreview,
              hasThumbnail: d.hasThumbnail,
              fileUrl: d.documentId ? `/api/v1/documents/${d.documentId}/view` : d.fileUrl,
              uploadedAt: new Date(d.uploadedAt),
              verificationStatus: normalizeDocStatus(d.status),
              adminReviewReason: d.adminReviewReason,
              remarks: d.adminReviewReason,
              version: d.version || 1,
              versionHistory: d.versionHistory || []
            }))
          }
        }
      );

      await Promise.allSettled([
        notifyAdmins({
          eventType: 'ADDITIONAL_DOCUMENT_UPLOADED',
          title: 'Additional KYC Document Uploaded',
          message: `${user.fullName} uploaded requested additional document "${targetReq.documentName}".`,
          link: '/kyc',
          priority: 'HIGH',
          metadata: {
            kycSubmissionId: adminSub._id.toString(),
            requestId: targetReq.requestId,
            documentId: uploadedAsset.documentId
          }
        }),
        notifyMember({
          userId: user._id,
          eventType: 'ADDITIONAL_DOCUMENT_SUBMITTED',
          title: 'Additional Document Submitted',
          message: `Your "${targetReq.documentName}" has been submitted and is now Pending Review.`,
          link: '/kyc-pending',
          priority: 'MEDIUM',
          metadata: { requestId: targetReq.requestId, documentId: uploadedAsset.documentId }
        })
      ]);

      res.status(200).json({
        success: true,
        message: `"${targetReq.documentName}" uploaded and submitted for Admin review.`,
        data: {
          request: targetReq,
          additionalDocumentRequests: adminSub.additionalDocumentRequests
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's own KYC status along with per-document status, versioning, activation checks, and notifications
kycRouter.get('/status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const [activation, privateDocs, notifData] = await Promise.all([
      evaluateMemberActivationAccess(req.user.userId),
      DocumentAssetModel.find({
        ownerId: req.user.userId,
        entityType: 'KYC',
        isDeleted: { $ne: true }
      }).sort({ createdAt: -1 }),
      listMemberNotifications(req.user.userId, 20)
    ]);

    const snapshot = activation.kycSnapshot;
    const submission = snapshot?.customerSub || null;
    const adminSubmission = snapshot?.adminSub || null;

    const resolvedStatus = normalizeOverallKycStatus(
      snapshot?.kycStatus,
      activation.checks.kycApproved
    );

    const normalizedDocuments = buildNormalizedKycDocuments(
      adminSubmission?.documents,
      submission?.documents,
      privateDocs
    );

    const rawAdditionalDocumentRequests =
      Array.isArray(adminSubmission?.additionalDocumentRequests) && adminSubmission.additionalDocumentRequests.length > 0
        ? adminSubmission.additionalDocumentRequests
        : Array.isArray(submission?.additionalDocumentRequests)
        ? submission.additionalDocumentRequests
        : [];

    const approvedDocuments = buildApprovedProfileDocuments(
      normalizedDocuments,
      rawAdditionalDocumentRequests,
      privateDocs
    );

    // Cancelled additional document requests must never be visible to the member or allow uploads
    const additionalDocumentRequests = rawAdditionalDocumentRequests.filter(
      (r: any) => String(r?.status || '').toUpperCase() !== 'CANCELLED'
    );

    const basePayload = submission || {};
    res.status(200).json({
      success: true,
      data: {
        ...basePayload,
        status: resolvedStatus,
        kycStatus: resolvedStatus,
        isKycApproved: activation.checks.kycApproved,
        isLocked: Boolean(adminSubmission?.isLocked || submission?.isLocked || activation.checks.kycApproved),
        lockedAt: adminSubmission?.lockedAt || submission?.lockedAt,
        approvedAt: adminSubmission?.approvedAt || submission?.approvedAt,
        approvedByName: adminSubmission?.approvedByName || submission?.approvedByName,
        canAccessDashboard: activation.canAccessDashboard,
        activationChecks: activation.checks,
        rejectionReason: snapshot?.rejectionReason,
        reviewerNotes: snapshot?.reviewerNotes,
        reviewedAt: snapshot?.reviewedAt,
        submittedAt: snapshot?.submittedAt,
        lastResubmittedAt: adminSubmission?.lastResubmittedAt,
        documents: normalizedDocuments,
        adminDocuments: normalizedDocuments,
        approvedDocuments,
        additionalDocumentRequests,
        documentAssets: privateDocs.map((d) => toSafeDocumentDto(d, 'member')),
        notifications: notifData.notifications,
        unreadNotificationsCount: notifData.unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// Demo/Testing helper: restricted instant approval for development verification
kycRouter.post(
  '/dev-approve-me',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Development endpoint disabled in production.', 404);
      }
      if (!req.user) throw new AppError('Unauthorized', 401);

      await KYCSubmissionModel.findOneAndUpdate(
        { userId: req.user.userId },
        { status: KYCStatus.APPROVED, reviewedAt: new Date() }
      );

      const user = await UserModel.findByIdAndUpdate(
        req.user.userId,
        { isKycApproved: true },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'KYC marked as Approved for testing by Administrator.',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);
