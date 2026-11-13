import crypto from 'crypto';
import mongoose from 'mongoose';
import { Router, Response } from 'express';
import { KycSubmissionModel } from '../models/KycSubmission';
import { MemberModel } from '../models/Member';
import { UserModel } from '../../users/users.model';
import { KYCSubmissionModel } from '../../kyc/kyc.model';
import { DocumentAssetModel, toSafeDocumentDto } from '../../documents/documents.model';
import { PaymentModel } from '../../payments/payments.model';
import { AccountStatus, KYCStatus } from '@fic/shared-types';
import {
  authenticateAdmin,
  AuthenticatedAdminRequest,
  requirePermission,
  logAdminAction
} from '../middleware/admin-auth.middleware';
import { buildNormalizedKycDocuments, normalizeDocStatus } from '../../kyc/kyc-status.helpers';
import { notifyMember } from '../../notifications/notifications.service';

const router = Router();

async function syncMissingKycSubmissionsFromSharedDb() {
  const [existingAdminSubs, customerSubs, members] = await Promise.all([
    KycSubmissionModel.find({
      $or: [{ memberId: { $ne: null } }, { memberEmail: { $exists: true, $ne: '' } }]
    })
      .select('memberId memberEmail')
      .lean(),
    KYCSubmissionModel.find({
      userId: { $ne: null },
      status: { $ne: KYCStatus.NOT_SUBMITTED }
    })
      .sort({ updatedAt: -1 })
      .lean(),
    MemberModel.find({
      $nor: [{ kycStatus: 'NOT_SUBMITTED', paymentStatus: 'PENDING' }]
    }).lean()
  ]);

  const coveredMemberIds = new Set<string>();
  const coveredEmails = new Set<string>();
  for (const sub of existingAdminSubs as any[]) {
    if (sub.memberId) coveredMemberIds.add(String(sub.memberId));
    if (sub.memberEmail) coveredEmails.add(String(sub.memberEmail).toLowerCase());
  }

  const customerSubByUserId = new Map<string, any>();
  for (const cs of customerSubs as any[]) {
    if (cs.userId) customerSubByUserId.set(String(cs.userId), cs);
  }

  const candidateUserIds = new Set<string>();
  for (const cs of customerSubs as any[]) {
    if (cs.userId && !coveredMemberIds.has(String(cs.userId))) {
      candidateUserIds.add(String(cs.userId));
    }
  }
  for (const m of members as any[]) {
    const email = m.email?.toLowerCase();
    if (!coveredMemberIds.has(String(m._id)) && (!email || !coveredEmails.has(email))) {
      candidateUserIds.add(String(m._id));
    }
  }

  if (candidateUserIds.size === 0) return;

  const users = (await UserModel.find({ _id: { $in: Array.from(candidateUserIds) } }).lean()) as any[];
  for (const user of users) {
    const email = user.email?.toLowerCase();
    if (coveredMemberIds.has(String(user._id)) || (email && coveredEmails.has(email))) continue;

    const memberDoc = (members as any[]).find(
      (m) => String(m._id) === String(user._id) || (email && m.email?.toLowerCase() === email)
    );
    const customerSub = customerSubByUserId.get(String(user._id));
    const [assets, latestPayment] = await Promise.all([
      DocumentAssetModel.find({
        ownerId: user._id,
        entityType: 'KYC',
        isDeleted: { $ne: true },
        isLatestVersion: { $ne: false }
      })
        .sort({ createdAt: -1 })
        .lean(),
      PaymentModel.findOne({ userId: user._id, status: 'SUCCESS' }).sort({ createdAt: -1 }).lean()
    ]);

    const docsFromAssets = (assets as any[]).map((a, idx) => ({
      documentId: a.documentId,
      docKey: a.documentCategory || `doc_${idx}`,
      title: a.documentLabel || a.originalFileName || `Document ${idx + 1}`,
      fileUrl: `/api/admin/documents/${a.documentId}/view`,
      fileName: a.originalFileName || a.documentLabel || `Document_${idx + 1}`,
      originalMimeType: a.originalMimeType,
      originalFileSize: a.originalFileSize,
      checksum: a.checksum,
      hasOptimizedPreview: Boolean(a.optimizedStorageKey),
      hasThumbnail: Boolean(a.thumbnailStorageKey),
      documentNumber: a.documentNumber || '',
      uploadedAt: (a.createdAt || new Date()).toISOString(),
      status: normalizeDocStatus(a.documentStatus),
      version: a.version || 1,
      previousVersionReference: a.previousVersionReference || a.previousVersionId
    }));

    const docsFromSub = (customerSub?.documents || []).map((d: any, idx: number) => ({
      ...(d.documentId ? { documentId: d.documentId } : {}),
      docKey: d.documentType || `doc_${idx}`,
      title: d.title || d.documentType || `Document ${idx + 1}`,
      fileUrl: d.documentId ? `/api/admin/documents/${d.documentId}/view` : d.fileUrl,
      fileName: d.originalFileName || d.documentType || `Document_${idx + 1}`,
      originalMimeType: d.originalMimeType,
      originalFileSize: d.originalFileSize,
      checksum: d.checksum,
      hasOptimizedPreview: d.hasOptimizedPreview,
      hasThumbnail: d.hasThumbnail,
      documentNumber: d.documentNumber || '',
      uploadedAt: (d.uploadedAt || customerSub.createdAt || new Date()).toISOString(),
      status: normalizeDocStatus(d.verificationStatus),
      version: d.version || 1
    }));

    const mergedDocs = docsFromAssets.length > 0 ? docsFromAssets : docsFromSub;
    const rawState = customerSub?.status || memberDoc?.kycStatus || 'NOT_SUBMITTED';
    const hasCompletedPayment = Boolean(
      latestPayment || user.isMembershipActive || memberDoc?.paymentStatus === 'PAID'
    );
    const hasActualSubmission =
      (rawState !== 'NOT_SUBMITTED' || Boolean(customerSub && customerSub.status !== 'NOT_SUBMITTED')) &&
      mergedDocs.length > 0;

    // Never surface unpaid or unsubmitted draft registrations in Admin KYC Verification Desk
    if (!hasCompletedPayment || !hasActualSubmission) {
      continue;
    }

    const normalizedStatus =
      rawState === 'APPROVED' || user.isKycApproved
        ? 'APPROVED'
        : rawState === 'REJECTED'
        ? 'REJECTED'
        : rawState === 'RESUBMIT_REQUIRED' || rawState === 'RESUBMISSION_REQUESTED'
        ? 'RESUBMISSION_REQUESTED'
        : 'SUBMITTED';

    if (!memberDoc) {
      await MemberModel.findOneAndUpdate(
        { $or: [{ _id: user._id }, ...(email ? [{ email }] : [])] },
        {
          $setOnInsert: {
            _id: user._id,
            registeredAt: user.createdAt || new Date()
          },
          $set: {
            name: user.fullName,
            email: email || user.email,
            phone: user.phoneNumber,
            primaryCategory: user.primaryCategoryId,
            primaryCategoryName: user.primaryCategoryName || 'General Business',
            subcategories: [user.subCategory || user.primarySubcategoryName || 'Member'].filter(Boolean),
            kycStatus: normalizedStatus,
            status: normalizedStatus === 'APPROVED' ? 'ACTIVE' : 'UNDER_REVIEW',
            membershipFeePaid: latestPayment ? latestPayment.amount : 0,
            paymentStatus: latestPayment ? 'PAID' : 'PENDING'
          }
        },
        { upsert: true }
      );
    }

    await KycSubmissionModel.findOneAndUpdate(
      { $or: [{ memberId: user._id }, ...(email ? [{ memberEmail: email }] : [])] },
      {
        $setOnInsert: {
          memberId: user._id,
          memberName: user.fullName,
          memberEmail: email || user.email,
          memberPhone: user.phoneNumber,
          memberDob: user.dob,
          subCategory: user.subCategory || user.primarySubcategoryName || '',
          address: user.address,
          dynamicProfile: user.dynamicProfile,
          categoryId: customerSub?.categoryId || user.primaryCategoryId || new mongoose.Types.ObjectId(),
          categoryName: user.primaryCategoryName || 'General Business',
          status: normalizedStatus,
          documents: mergedDocs,
          ...(latestPayment
            ? {
                paymentDetails: {
                  orderId: latestPayment.razorpayOrderId || latestPayment.internalOrderId,
                  paymentId: latestPayment.razorpayPaymentId || latestPayment.paymentId,
                  amount: latestPayment.amount,
                  currency: latestPayment.currency || 'INR',
                  method: latestPayment.paymentMethod || 'RAZORPAY',
                  paidAt: latestPayment.verifiedAt || latestPayment.updatedAt,
                  status: 'CAPTURED'
                }
              }
            : {}),
          submittedAt: customerSub?.createdAt || user.createdAt || new Date()
        }
      },
      { upsert: true }
    );

    coveredMemberIds.add(String(user._id));
    if (email) coveredEmails.add(email);
  }
}


async function resolveReferralAttribution(userDoc: any) {
  if (!userDoc) {
    return {
      source: 'DIRECT',
      sourceLabel: 'Direct Registration',
      referredByName: '',
      referralCode: ''
    };
  }

  const isReferred = Boolean(userDoc.referredByCode || userDoc.referrerUserId || userDoc.referralSource === 'REFERRED');
  if (!isReferred) {
    return {
      source: 'DIRECT',
      sourceLabel: 'Direct Registration',
      referredByName: '',
      referralCode: ''
    };
  }

  let referrerName = '';
  if (userDoc.referrerUserId) {
    const refUser = await UserModel.findById(userDoc.referrerUserId).select('fullName email').lean();
    if (refUser) referrerName = (refUser as any).fullName;
  }
  if (!referrerName && userDoc.referredByCode) {
    const refUser = await UserModel.findOne({
      $or: [{ referralCode: userDoc.referredByCode }, { email: userDoc.referredByCode.toLowerCase() }]
    }).select('fullName email').lean();
    if (refUser) referrerName = (refUser as any).fullName;
  }

  return {
    source: 'REFERRAL',
    sourceLabel: 'Referral',
    referredByName: referrerName || 'Registered Referrer',
    referralCode: userDoc.referredByCode || ''
  };
}

function summarizeSubmissionDocs(docs: any[] = []) {
  const normalizedDocs = buildNormalizedKycDocuments(docs, [], []);
  const approvedDocsCount = normalizedDocs.filter((d) => d.status === 'APPROVED').length;
  const reuploadRequiredDocsCount = normalizedDocs.filter((d) => d.status === 'REUPLOAD_REQUIRED').length;
  const rejectedDocsCount = normalizedDocs.filter((d) => d.status === 'REJECTED').length;
  const pendingDocsCount = normalizedDocs.filter((d) => d.status === 'PENDING_REVIEW').length;
  const allDocsApproved = normalizedDocs.length > 0 && approvedDocsCount === normalizedDocs.length;

  return {
    normalizedDocs,
    docSummary: {
      total: normalizedDocs.length,
      approved: approvedDocsCount,
      reuploadRequired: reuploadRequiredDocsCount,
      rejected: rejectedDocsCount,
      pendingReview: pendingDocsCount,
      allDocsApproved
    }
  };
}

// GET /api/admin/kyc - List KYC submissions with filter
router.get('/', authenticateAdmin, requirePermission('KYC_VERIFY'), async (req, res) => {
  try {
    await syncMissingKycSubmissionsFromSharedDb();

    const { status, categoryId } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') {
      const s = String(status).trim().toUpperCase();
      if (s === 'RESUBMISSION_REQUESTED') {
        filter.status = { $in: ['RESUBMISSION_REQUESTED', 'RESUBMIT_REQUIRED'] };
      } else if (s === 'SUBMITTED' || s === 'PENDING' || s === 'PENDING_REVIEW') {
        filter.status = { $in: ['SUBMITTED', 'PENDING', 'UNDER_REVIEW'] };
      } else {
        filter.status = s;
      }
    } else {
      filter.status = { $ne: 'NOT_SUBMITTED' };
    }
    if (categoryId) filter.categoryId = categoryId;

    filter.$or = [
      { memberId: { $ne: null } },
      { memberEmail: { $exists: true, $ne: '' } },
      { memberName: { $exists: true, $ne: '' } }
    ];

    const submissions = await KycSubmissionModel.find(filter)
      .populate('memberId', 'name email phone status address registeredAt paymentStatus')
      .populate('categoryId', 'name')
      .populate('assignedTo', 'name')
      .sort({ submittedAt: -1, updatedAt: -1 })
      .lean();

    const dedupMap = new Map<string, any>();
    for (const sub of submissions as any[]) {
      if (!sub.memberName && !sub.memberEmail && !sub.memberId) continue;
      const memberKey = String(
        sub.memberId?._id || sub.memberId || (sub.memberEmail ? sub.memberEmail.toLowerCase() : sub._id)
      );
      if (!dedupMap.has(memberKey)) {
        dedupMap.set(memberKey, sub);
      }
    }

    const enrichedSubmissions = await Promise.all(
      Array.from(dedupMap.values()).map(async (sub: any) => {
        const normalizedStatus =
          sub.status === 'RESUBMIT_REQUIRED' ? 'RESUBMISSION_REQUESTED' : sub.status;
        const user = (await UserModel.findOne({
          $or: [{ _id: sub.memberId?._id || sub.memberId }, { email: sub.memberEmail?.toLowerCase() }]
        }).lean()) as any;

        const { normalizedDocs, docSummary } = summarizeSubmissionDocs(sub.documents || []);
        const referralInfo = await resolveReferralAttribution(user);

        return {
          ...sub,
          referralInfo,
          status: normalizedStatus,
          adminNotes: sub.adminNotes || sub.reviewerNotes,
          memberPhone: sub.memberPhone || sub.memberId?.phone || user?.phoneNumber || '',
          memberDob: sub.memberDob || user?.dob,
          subCategory: sub.subCategory || user?.subCategory || user?.primarySubcategoryName,
          address: sub.address || user?.address,
          dynamicProfile: sub.dynamicProfile || user?.dynamicProfile,
          registeredAt: sub.memberId?.registeredAt || user?.createdAt || sub.submittedAt,
          documents: normalizedDocs.map((d) => ({
            ...d,
            fileUrl: d.adminViewUrl || d.fileUrl
          })),
          docSummary
        };
      })
    );

    res.json({ success: true, data: enrichedSubmissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/kyc/:id - Get specific KYC submission details
router.get('/:id', authenticateAdmin, requirePermission('KYC_VERIFY'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const submission = await KycSubmissionModel.findById(req.params.id)
      .populate('memberId')
      .populate('categoryId')
      .populate('assignedTo', 'name email role')
      .lean();

    if (!submission) {
      res.status(404).json({ success: false, error: 'KYC submission not found' });
      return;
    }

    const subObj = submission as any;
    const ownerUser = (await UserModel.findOne({
      $or: [{ _id: subObj.memberId?._id || subObj.memberId }, { email: subObj.memberEmail?.toLowerCase() }]
    }).lean()) as any;

    if (ownerUser) {
      subObj.memberPhone = subObj.memberPhone || ownerUser.phoneNumber;
      subObj.memberDob = subObj.memberDob || ownerUser.dob;
      subObj.subCategory = subObj.subCategory || ownerUser.subCategory || ownerUser.primarySubcategoryName;
      subObj.address = subObj.address || ownerUser.address;
      subObj.dynamicProfile = subObj.dynamicProfile || ownerUser.dynamicProfile;
      subObj.registeredAt = subObj.memberId?.registeredAt || ownerUser.createdAt || subObj.submittedAt;
    }

    const privateAssets = await DocumentAssetModel.find({
      $or: [
        ...(ownerUser?._id ? [{ ownerId: ownerUser._id }] : []),
        ...(subObj.memberId ? [{ memberId: subObj.memberId?._id || subObj.memberId }] : [])
      ],
      entityType: 'KYC',
      isDeleted: { $ne: true }
    }).sort({ version: -1, createdAt: -1 });

    subObj.documentAssets = privateAssets.map((a) => toSafeDocumentDto(a, 'admin'));

    const normalizedDocs = buildNormalizedKycDocuments(subObj.documents || [], [], privateAssets);
    const { docSummary } = summarizeSubmissionDocs(normalizedDocs);
    subObj.documents = normalizedDocs.map((d) => ({
      ...d,
      fileUrl: d.adminViewUrl || d.fileUrl
    }));
    subObj.docSummary = docSummary;
    subObj.referralInfo = await resolveReferralAttribution(ownerUser);

    res.json({ success: true, data: subObj });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/admin/kyc/:id/documents/:docRef/review
 * Individual document-level verification (Approve, Request Reupload with reason, or Reject).
 * Enforces version concurrency check (expectedVersion) so Admin cannot accidentally verify an outdated document.
 */
router.patch(
  '/:id/documents/:docRef/review',
  authenticateAdmin,
  requirePermission('KYC_VERIFY'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id, docRef } = req.params;
      const { decision, reason, expectedVersion } = req.body;

      const normalizedDecision = String(decision || '').trim().toUpperCase();
      if (!['APPROVED', 'REUPLOAD_REQUIRED', 'REJECTED'].includes(normalizedDecision)) {
        res.status(400).json({
          success: false,
          error: 'Invalid document decision. Must be APPROVED, REUPLOAD_REQUIRED, or REJECTED.'
        });
        return;
      }

      const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
      if ((normalizedDecision === 'REUPLOAD_REQUIRED' || normalizedDecision === 'REJECTED') && !trimmedReason) {
        res.status(400).json({
          success: false,
          error: 'A clear reason is mandatory when requesting document reupload or rejecting a document.'
        });
        return;
      }

      const submission = await KycSubmissionModel.findById(id);
      if (!submission) {
        res.status(404).json({ success: false, error: 'KYC submission not found' });
        return;
      }

      if (submission.status === 'APPROVED' || submission.isLocked) {
        res.status(409).json({
          success: false,
          code: 'KYC_ALREADY_APPROVED',
          error: 'This KYC application has already been permanently approved and locked. Further ordinary document review actions are not permitted.'
        });
        return;
      }

      // Guard if caller passed an archived old DocumentAsset ID rather than active latest doc
      const archivedAsset = await DocumentAssetModel.findOne({
        documentId: docRef,
        isLatestVersion: false
      }).lean();
      if (archivedAsset) {
        res.status(409).json({
          success: false,
          code: 'ARCHIVED_DOCUMENT',
          error: 'This document version has been archived and superseded by a newer member upload. Please review the latest version.'
        });
        return;
      }

      const docIndex = submission.documents.findIndex(
        (d: any) => String(d.docKey) === docRef || (d.documentId && String(d.documentId) === docRef)
      );

      if (docIndex === -1) {
        res.status(404).json({ success: false, error: 'Document not found in this KYC submission' });
        return;
      }

      const targetDoc = submission.documents[docIndex] as any;
      const currentVersion = Number(targetDoc.version || 1);

      if (expectedVersion !== undefined && expectedVersion !== null && Number(expectedVersion) !== currentVersion) {
        res.status(409).json({
          success: false,
          code: 'VERSION_MISMATCH',
          error: `A newer version (v${currentVersion}) of "${targetDoc.title}" was uploaded by the member. Please refresh and inspect the latest version.`
        });
        return;
      }

      const now = new Date();
      targetDoc.status = normalizedDecision;
      targetDoc.adminReviewReason = normalizedDecision === 'APPROVED' ? undefined : trimmedReason;
      targetDoc.rejectionReason = normalizedDecision === 'APPROVED' ? undefined : trimmedReason;
      targetDoc.reviewedAt = now;
      targetDoc.reviewedBy = new mongoose.Types.ObjectId(req.admin!.id);
      targetDoc.reviewedByName = req.admin!.name;

      submission.documents[docIndex] = targetDoc;
      submission.markModified('documents');

      // Compute updated overall status based on individual document verdicts
      const hasReuploadRequired = submission.documents.some(
        (d: any) => normalizeDocStatus(d.status) === 'REUPLOAD_REQUIRED'
      );
      const hasRejectedDoc = submission.documents.some(
        (d: any) => normalizeDocStatus(d.status) === 'REJECTED'
      );

      if (hasReuploadRequired) {
        submission.status = 'RESUBMISSION_REQUESTED';
        submission.rejectionReason = trimmedReason || submission.rejectionReason;
        submission.verifiedAt = now;
      } else if (hasRejectedDoc) {
        submission.status = 'REJECTED';
        submission.rejectionReason = trimmedReason || submission.rejectionReason;
        submission.verifiedAt = now;
      } else if (submission.status === 'SUBMITTED' || submission.status === 'RESUBMISSION_REQUESTED') {
        submission.status = 'UNDER_REVIEW';
        submission.rejectionReason = undefined;
      }

      await submission.save();

      // Update linked DocumentAsset if present
      if (targetDoc.documentId) {
        await DocumentAssetModel.updateOne(
          { documentId: targetDoc.documentId },
          {
            $set: {
              documentStatus: normalizedDecision,
              adminReviewReason: normalizedDecision === 'APPROVED' ? undefined : trimmedReason,
              reviewedAt: now,
              reviewedBy: new mongoose.Types.ObjectId(req.admin!.id),
              reviewedByName: req.admin!.name
            }
          }
        );
      }

      const userFilter = {
        $or: [{ _id: submission.memberId }, ...(submission.memberEmail ? [{ email: submission.memberEmail.toLowerCase() }] : [])]
      };
      const userDoc = await UserModel.findOne(userFilter);

      // Update Member & Customer KYC models when a document requires reupload/rejection or restarts under review
      const overallNextStatus = submission.status;
      await MemberModel.findOneAndUpdate(
        {
          $or: [{ _id: submission.memberId }, ...(submission.memberEmail ? [{ email: submission.memberEmail.toLowerCase() }] : [])]
        },
        {
          $set: {
            kycStatus: overallNextStatus,
            ...(hasReuploadRequired || hasRejectedDoc ? { status: 'PENDING_KYC' } : { status: 'UNDER_REVIEW' })
          }
        }
      );

      if (userDoc) {
        if (hasReuploadRequired || hasRejectedDoc) {
          userDoc.isKycApproved = false;
          await userDoc.save();
        }

        await KYCSubmissionModel.findOneAndUpdate(
          { userId: userDoc._id },
          {
            $set: {
              status: hasReuploadRequired
                ? KYCStatus.RESUBMIT_REQUIRED
                : hasRejectedDoc
                ? KYCStatus.REJECTED
                : KYCStatus.PENDING,
              rejectionReason: hasReuploadRequired || hasRejectedDoc ? submission.rejectionReason : undefined,
              reviewedAt: now,
              documents: buildMemberKycDocuments(submission.documents || [])
            }
          },
          { upsert: true }
        );

        if (normalizedDecision === 'REUPLOAD_REQUIRED') {
          await notifyMember({
            userId: userDoc._id,
            eventType: 'DOCUMENT_REUPLOAD_REQUIRED',
            title: 'Your KYC document requires correction',
            message: `Your KYC document requires correction. Please review "${targetDoc.title}" (v${currentVersion}) and upload it again. Reason: ${trimmedReason}`,
            link: '/kyc-pending',
            priority: 'HIGH',
            metadata: {
              kycSubmissionId: submission._id.toString(),
              documentId: targetDoc.documentId,
              docKey: targetDoc.docKey,
              documentLabel: targetDoc.title,
              version: currentVersion,
              reason: trimmedReason,
              actionRequired: 'REUPLOAD_DOCUMENT'
            }
          });
        } else if (normalizedDecision === 'REJECTED') {
          await notifyMember({
            userId: userDoc._id,
            eventType: 'DOCUMENT_REJECTED',
            title: 'KYC Document Rejected',
            message: `Your KYC document "${targetDoc.title}" was rejected. Reason: ${trimmedReason}`,
            link: '/kyc-pending',
            priority: 'HIGH',
            metadata: {
              kycSubmissionId: submission._id.toString(),
              documentId: targetDoc.documentId,
              docKey: targetDoc.docKey,
              documentLabel: targetDoc.title,
              version: currentVersion,
              reason: trimmedReason
            }
          });
        } else if (normalizedDecision === 'APPROVED') {
          await notifyMember({
            userId: userDoc._id,
            eventType: 'DOCUMENT_APPROVED',
            title: 'KYC Document Approved',
            message: `Your document "${targetDoc.title}" (v${currentVersion}) has been verified and approved.`,
            link: '/kyc-pending',
            priority: 'MEDIUM',
            metadata: {
              kycSubmissionId: submission._id.toString(),
              documentId: targetDoc.documentId,
              docKey: targetDoc.docKey,
              documentLabel: targetDoc.title,
              version: currentVersion
            }
          });
        }
      }

      await logAdminAction(req, `KYC_DOC_${normalizedDecision}`, 'KycSubmission', id, {
        memberId: submission.memberId?.toString(),
        docKey: targetDoc.docKey,
        documentId: targetDoc.documentId,
        version: currentVersion,
        decision: normalizedDecision,
        reason: trimmedReason || undefined
      });

      const { normalizedDocs, docSummary } = summarizeSubmissionDocs(submission.documents || []);

      res.json({
        success: true,
        message: `Document "${targetDoc.title}" (v${currentVersion}) marked as ${normalizedDecision}.`,
        data: {
          ...submission.toObject(),
          documents: normalizedDocs.map((d) => ({ ...d, fileUrl: d.adminViewUrl || d.fileUrl })),
          docSummary
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

function buildMemberKycDocuments(docs: any[]) {
  return (docs || []).map((d: any) => ({
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
  }));
}

// PATCH /api/admin/kyc/:id/review - Overall Review/Decision on KYC submission
router.patch('/:id/review', authenticateAdmin, requirePermission('KYC_VERIFY'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision, reviewerNotes, rejectionReason, reuploadDocKeys } = req.body; // 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED'

    if (!['APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED'].includes(decision)) {
      res.status(400).json({ success: false, error: 'Invalid review decision' });
      return;
    }

    const submission = await KycSubmissionModel.findById(id);
    if (!submission) {
      res.status(404).json({ success: false, error: 'KYC submission not found' });
      return;
    }

    if (submission.status === 'APPROVED' || submission.isLocked) {
      res.status(409).json({
        success: false,
        code: 'KYC_ALREADY_APPROVED',
        error: 'This KYC application has already been permanently approved and locked. Further ordinary decisions are not permitted.'
      });
      return;
    }

    const trimmedReason = typeof rejectionReason === 'string' ? rejectionReason.trim() : '';
    const trimmedNotes = typeof reviewerNotes === 'string' ? reviewerNotes.trim() : '';

    if (decision !== 'APPROVED' && !trimmedReason) {
      res.status(400).json({
        success: false,
        error: 'Please provide a clear reason or instructions for rejection or resubmission.'
      });
      return;
    }

    if (decision === 'APPROVED' && (!submission.documents || submission.documents.length === 0)) {
      res.status(400).json({
        success: false,
        code: 'NO_DOCUMENTS_UPLOADED',
        error: 'Cannot approve KYC because the member has not uploaded any KYC documents.'
      });
      return;
    }

    if (decision === 'APPROVED' && Array.isArray(submission.additionalDocumentRequests)) {
      const pendingMandatoryAdditional = submission.additionalDocumentRequests.filter(
        (r: any) =>
          r.required !== false &&
          ['PENDING', 'REUPLOAD_REQUIRED'].includes(String(r.status || '').toUpperCase())
      );
      if (pendingMandatoryAdditional.length > 0) {
        res.status(400).json({
          success: false,
          code: 'ADDITIONAL_DOCUMENTS_PENDING',
          error: `Cannot grant final KYC approval while mandatory requested documents are still pending upload: ${pendingMandatoryAdditional
            .map((r: any) => r.documentName)
            .join(', ')}.`
        });
        return;
      }
    }

    const selectedKeysSet = new Set(
      Array.isArray(reuploadDocKeys)
        ? reuploadDocKeys.map((k: any) => String(k || '').trim()).filter(Boolean)
        : []
    );

    const hasExplicitReuploadList = Array.isArray(reuploadDocKeys);
    if (decision === 'RESUBMISSION_REQUESTED' && submission.documents?.length > 0 && hasExplicitReuploadList) {
      const matchedCount = submission.documents.filter((d: any) => {
        const docKey = String(d.docKey || '').trim();
        const docId = String(d.documentId || '').trim();
        return (docKey && selectedKeysSet.has(docKey)) || (docId && selectedKeysSet.has(docId));
      }).length;
      if (matchedCount === 0) {
        res.status(400).json({
          success: false,
          code: 'NO_DOCUMENTS_SELECTED',
          error: 'Please select at least one uploaded document requiring reupload.'
        });
        return;
      }
    }

    const now = new Date();
    const reviewerName = req.admin?.name || 'FIC Compliance Officer';
    const reviewerObjectId = req.admin?.id && mongoose.Types.ObjectId.isValid(req.admin.id)
      ? new mongoose.Types.ObjectId(req.admin.id)
      : undefined;

    if (Array.isArray(submission.documents) && submission.documents.length > 0) {
      submission.documents = submission.documents.map((rawDoc: any) => {
        const doc = typeof rawDoc?.toObject === 'function' ? rawDoc.toObject() : { ...rawDoc };
        const docKey = String(doc.docKey || '').trim();
        const docId = String(doc.documentId || '').trim();
        const isSelectedForReupload = !hasExplicitReuploadList
          || (Boolean(docKey) && selectedKeysSet.has(docKey))
          || (Boolean(docId) && selectedKeysSet.has(docId));

        if (decision === 'APPROVED') {
          return {
            ...doc,
            status: 'APPROVED',
            adminReviewReason: undefined,
            rejectionReason: undefined,
            reviewedAt: now,
            ...(reviewerObjectId ? { reviewedBy: reviewerObjectId } : {}),
            reviewedByName: reviewerName
          };
        }

        if (decision === 'RESUBMISSION_REQUESTED') {
          if (isSelectedForReupload) {
            return {
              ...doc,
              status: 'REUPLOAD_REQUIRED',
              adminReviewReason: trimmedReason,
              rejectionReason: trimmedReason,
              reviewedAt: now,
              ...(reviewerObjectId ? { reviewedBy: reviewerObjectId } : {}),
              reviewedByName: reviewerName
            };
          }
          return {
            ...doc,
            status: 'APPROVED',
            adminReviewReason: undefined,
            rejectionReason: undefined,
            reviewedAt: now,
            ...(reviewerObjectId ? { reviewedBy: reviewerObjectId } : {}),
            reviewedByName: reviewerName
          };
        }

        return {
          ...doc,
          status: 'REJECTED',
          adminReviewReason: trimmedReason,
          rejectionReason: trimmedReason,
          reviewedAt: now,
          ...(reviewerObjectId ? { reviewedBy: reviewerObjectId } : {}),
          reviewedByName: reviewerName
        };
      }) as any;
      submission.markModified('documents');
    }

    const isApproved = decision === 'APPROVED';
    if (isApproved && Array.isArray(submission.additionalDocumentRequests) && submission.additionalDocumentRequests.length > 0) {
      submission.additionalDocumentRequests = submission.additionalDocumentRequests.map((reqDoc: any) => {
        const plain = typeof reqDoc?.toObject === 'function' ? reqDoc.toObject() : { ...reqDoc };
        if (String(plain.status || '').toUpperCase() === 'SUBMITTED') {
          return {
            ...plain,
            status: 'APPROVED',
            reviewedAt: now,
            reviewedByName: reviewerName
          };
        }
        return plain;
      }) as any;
      submission.markModified('additionalDocumentRequests');
    }

    const atomicUpdated = await KycSubmissionModel.findOneAndUpdate(
      { _id: submission._id, status: { $ne: 'APPROVED' }, isLocked: { $ne: true } },
      {
        $set: {
          documents: submission.documents,
          additionalDocumentRequests: submission.additionalDocumentRequests || [],
          status: decision,
          reviewerNotes: trimmedNotes || submission.reviewerNotes,
          rejectionReason: isApproved ? undefined : trimmedReason,
          verifiedAt: now,
          ...(isApproved
            ? {
                isLocked: true,
                lockedAt: now,
                approvedAt: now,
                ...(reviewerObjectId ? { approvedBy: reviewerObjectId } : {}),
                approvedByName: reviewerName
              }
            : {})
        }
      },
      { new: true }
    );

    if (!atomicUpdated) {
      res.status(409).json({
        success: false,
        code: 'KYC_ALREADY_APPROVED',
        error: 'This KYC application has already been permanently approved and locked.'
      });
      return;
    }

    submission.set(atomicUpdated.toObject());

    const member = await MemberModel.findOne({
      $or: [{ _id: submission.memberId }, ...(submission.memberEmail ? [{ email: submission.memberEmail.toLowerCase() }] : [])]
    });
    if (member) {
      member.kycStatus = decision;
      if (isApproved) {
        member.kycLocked = true;
        member.kycApprovedAt = now;
        if (member.paymentStatus === 'PAID') {
          member.status = 'ACTIVE';
        }
      } else if (decision === 'REJECTED' || decision === 'RESUBMISSION_REQUESTED') {
        member.status = 'PENDING_KYC';
      }
      await member.save();
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { $or: [{ _id: submission.memberId }, { email: submission.memberEmail?.toLowerCase() }] },
      {
        $set: {
          isKycApproved: isApproved,
          ...(isApproved
            ? {
                kycLocked: true,
                kycApprovedAt: now,
                ...(reviewerObjectId ? { kycApprovedBy: reviewerObjectId } : {})
              }
            : {})
        }
      },
      { new: true }
    );

    await KYCSubmissionModel.findOneAndUpdate(
      { $or: [{ userId: submission.memberId }, ...(member?._id ? [{ userId: member._id }] : [])] },
      {
        $set: {
          userId: submission.memberId || member?._id,
          categoryId: submission.categoryId,
          status: isApproved
            ? KYCStatus.APPROVED
            : decision === 'REJECTED'
            ? KYCStatus.REJECTED
            : KYCStatus.RESUBMIT_REQUIRED,
          rejectionReason: isApproved ? undefined : trimmedReason,
          reviewedAt: now,
          documents: buildMemberKycDocuments(submission.documents || []),
          additionalDocumentRequests: submission.additionalDocumentRequests || [],
          ...(isApproved
            ? {
                isLocked: true,
                lockedAt: now,
                approvedAt: now,
                ...(reviewerObjectId ? { approvedBy: reviewerObjectId } : {}),
                approvedByName: reviewerName
              }
            : {})
        }
      },
      { upsert: true }
    );

    const docsList = submission.documents || [];
    const additionalApprovedDocIds = (submission.additionalDocumentRequests || [])
      .filter((r: any) => normalizeDocStatus(r?.status) === 'APPROVED' && r?.uploadedDocument?.documentId)
      .map((r: any) => r.uploadedDocument.documentId);
    const approvedDocIds = [
      ...docsList
        .filter((d: any) => normalizeDocStatus(d.status) === 'APPROVED' && d.documentId)
        .map((d: any) => d.documentId),
      ...additionalApprovedDocIds
    ];
    const reuploadDocIds = docsList
      .filter((d: any) => normalizeDocStatus(d.status) === 'REUPLOAD_REQUIRED' && d.documentId)
      .map((d: any) => d.documentId);
    const rejectedDocIds = docsList
      .filter((d: any) => normalizeDocStatus(d.status) === 'REJECTED' && d.documentId)
      .map((d: any) => d.documentId);

    if (approvedDocIds.length > 0) {
      await DocumentAssetModel.updateMany(
        {
          documentId: { $in: approvedDocIds },
          isLatestVersion: { $ne: false }
        },
        {
          $set: { documentStatus: 'APPROVED', reviewedAt: now, reviewedByName: reviewerName },
          $unset: { adminReviewReason: 1 }
        }
      );
    }
    if (reuploadDocIds.length > 0) {
      await DocumentAssetModel.updateMany(
        {
          documentId: { $in: reuploadDocIds },
          isLatestVersion: { $ne: false }
        },
        {
          $set: {
            documentStatus: 'REUPLOAD_REQUIRED',
            adminReviewReason: trimmedReason,
            reviewedAt: now,
            reviewedByName: reviewerName
          }
        }
      );
    }
    if (rejectedDocIds.length > 0) {
      await DocumentAssetModel.updateMany(
        {
          documentId: { $in: rejectedDocIds },
          isLatestVersion: { $ne: false }
        },
        {
          $set: {
            documentStatus: 'REJECTED',
            adminReviewReason: trimmedReason,
            reviewedAt: now,
            reviewedByName: reviewerName
          }
        }
      );
    }

    const reuploadDocs = docsList.filter((d: any) => normalizeDocStatus(d.status) === 'REUPLOAD_REQUIRED');
    const reuploadDocTitles = reuploadDocs.map((d: any) => d.title).filter(Boolean);

    if (updatedUser) {
      if (decision === 'APPROVED') {
        await notifyMember({
          userId: updatedUser._id,
          eventType: 'KYC_APPROVED',
          title: 'KYC Approved! Dashboard Access Ready',
          message:
            'Your KYC verification has been approved by the FIC Compliance Desk. All portal features are ready based on your active membership.',
          link: '/dashboard',
          priority: 'HIGH',
          metadata: { kycSubmissionId: submission._id.toString() },
          sourceKey: `KYC_APPROVED:${submission._id.toString()}:${Number(submission.reverificationHistory?.length || 0)}`
        });
      } else if (decision === 'RESUBMISSION_REQUESTED') {
        const docSummaryText = reuploadDocTitles.length > 0 ? ` (${reuploadDocTitles.join(', ')})` : '';
        await notifyMember({
          userId: updatedUser._id,
          eventType: 'KYC_RESUBMISSION_REQUESTED',
          title: 'Your KYC document requires correction',
          message: `Your KYC document requires correction${docSummaryText}. Please review the document and upload it again. Reason: ${trimmedReason}`,
          link: '/kyc-pending',
          priority: 'HIGH',
          metadata: {
            kycSubmissionId: submission._id.toString(),
            reason: trimmedReason,
            reuploadDocKeys: reuploadDocs.map((d: any) => d.docKey).filter(Boolean),
            documentLabels: reuploadDocTitles
          }
        });
      } else {
        await notifyMember({
          userId: updatedUser._id,
          eventType: 'KYC_REJECTED',
          title: 'KYC Application Rejected',
          message: `Your KYC verification was rejected. Reason: ${trimmedReason}`,
          link: '/kyc-pending',
          priority: 'HIGH',
          metadata: { kycSubmissionId: submission._id.toString(), reason: trimmedReason }
        });
      }
    }

    await logAdminAction(req, `KYC_${decision}`, 'KycSubmission', id, {
      memberId: submission.memberId?.toString(),
      decision,
      reuploadDocKeys: decision === 'RESUBMISSION_REQUESTED' ? reuploadDocs.map((d: any) => d.docKey) : undefined,
      rejectionReason: trimmedReason || undefined,
    });

    const { normalizedDocs, docSummary } = summarizeSubmissionDocs(submission.documents || []);

    res.json({
      success: true,
      message: `KYC submission marked as ${decision}. Portal access ${isApproved ? 'GRANTED' : 'RESTRICTED'}.`,
      data: {
        ...submission.toObject(),
        documents: normalizedDocs.map((d) => ({ ...d, fileUrl: d.adminViewUrl || d.fileUrl })),
        docSummary
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/kyc/:id/additional-documents - Admin requests a brand-new additional document
router.post(
  '/:id/additional-documents',
  authenticateAdmin,
  requirePermission('KYC_VERIFY'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { documentName, description, reason, required = true, allowedExtensions } = req.body;

      const trimmedName = typeof documentName === 'string' ? documentName.trim() : '';
      const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
      const trimmedDesc = typeof description === 'string' ? description.trim() : '';

      if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 120) {
        res.status(400).json({ success: false, error: 'Document Name is required (2–120 characters).' });
        return;
      }
      if (!trimmedReason || trimmedReason.length < 3 || trimmedReason.length > 500) {
        res.status(400).json({ success: false, error: 'Reason for requesting this document is required.' });
        return;
      }

      const submission = await KycSubmissionModel.findById(id);
      if (!submission) {
        res.status(404).json({ success: false, error: 'KYC submission not found' });
        return;
      }

      if (submission.isLocked || submission.status === 'APPROVED') {
        res.status(409).json({
          success: false,
          code: 'KYC_ALREADY_APPROVED',
          error: 'Cannot add document requests to a permanently approved KYC application without Super Admin reverification.'
        });
        return;
      }

      if (submission.status === 'REJECTED') {
        res.status(400).json({
          success: false,
          error: 'Cannot add document requests to a rejected application.'
        });
        return;
      }

      const normalizedNameKey = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const existingRequests = Array.isArray(submission.additionalDocumentRequests)
        ? submission.additionalDocumentRequests
        : [];
      const hasActiveDuplicate = existingRequests.some(
        (r: any) =>
          String(r.documentName || '').trim().toLowerCase() === trimmedName.toLowerCase() &&
          !['CANCELLED', 'APPROVED'].includes(String(r.status || '').toUpperCase())
      );

      if (hasActiveDuplicate) {
        res.status(409).json({
          success: false,
          code: 'DUPLICATE_DOC_REQUEST',
          error: `An active document request for "${trimmedName}" already exists.`
        });
        return;
      }

      const safeExtensions = Array.isArray(allowedExtensions) && allowedExtensions.length > 0
        ? allowedExtensions
            .map((ext: any) => String(ext || '').trim().toLowerCase().replace('.', ''))
            .filter((ext: string) => ['pdf', 'jpg', 'jpeg', 'png'].includes(ext))
        : ['pdf', 'jpg', 'jpeg', 'png'];

      const requestId = `ADD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const docKey = `ADD_${normalizedNameKey.toUpperCase() || requestId}_${requestId.slice(-4)}`;
      const now = new Date();
      const adminObjectId = req.admin?.id && mongoose.Types.ObjectId.isValid(req.admin.id)
        ? new mongoose.Types.ObjectId(req.admin.id)
        : undefined;

      const newRequest: any = {
        requestId,
        documentName: trimmedName,
        docKey,
        ...(trimmedDesc ? { description: trimmedDesc } : {}),
        reason: trimmedReason,
        required: Boolean(required),
        allowedExtensions: safeExtensions.length > 0 ? safeExtensions : ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeBytes: 2 * 1024 * 1024,
        status: 'PENDING',
        ...(adminObjectId ? { requestedBy: adminObjectId } : {}),
        requestedByName: req.admin?.name || 'FIC Compliance Officer',
        requestedAt: now
      };

      submission.additionalDocumentRequests = [...existingRequests, newRequest] as any;
      submission.markModified('additionalDocumentRequests');
      await submission.save();

      const memberUser = await UserModel.findOne({
        $or: [{ _id: submission.memberId }, ...(submission.memberEmail ? [{ email: submission.memberEmail.toLowerCase() }] : [])]
      });

      await KYCSubmissionModel.findOneAndUpdate(
        { $or: [{ userId: submission.memberId }, ...(memberUser?._id ? [{ userId: memberUser._id }] : [])] },
        {
          $set: {
            additionalDocumentRequests: submission.additionalDocumentRequests
          }
        }
      );

      if (memberUser) {
        await notifyMember({
          userId: memberUser._id,
          eventType: 'ADDITIONAL_DOCUMENT_REQUESTED',
          title: 'Additional KYC Document Required',
          message: `FIC Admin has requested an additional document (${trimmedName}). Please review the instructions and upload the requested document. Reason: ${trimmedReason}`,
          link: '/kyc-pending',
          priority: 'HIGH',
          metadata: {
            kycSubmissionId: submission._id.toString(),
            requestId,
            documentName: trimmedName,
            reason: trimmedReason
          }
        });
      }

      await logAdminAction(req, 'KYC_ADD_DOCUMENT_REQUEST', 'KycSubmission', id, {
        memberId: submission.memberId?.toString(),
        requestId,
        documentName: trimmedName,
        required: Boolean(required)
      });

      const { normalizedDocs, docSummary } = summarizeSubmissionDocs(submission.documents || []);
      res.status(201).json({
        success: true,
        message: `Additional document request "${trimmedName}" sent to member.`,
        data: {
          ...submission.toObject(),
          documents: normalizedDocs.map((d) => ({ ...d, fileUrl: d.adminViewUrl || d.fileUrl })),
          docSummary,
          createdRequest: newRequest
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PATCH /api/admin/kyc/:id/additional-documents/:requestId/review
router.patch(
  '/:id/additional-documents/:requestId/review',
  authenticateAdmin,
  requirePermission('KYC_VERIFY'),
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      const { id, requestId } = req.params;
      const { decision, reason } = req.body;
      const normalizedDecision = String(decision || '').trim().toUpperCase();

      if (!['APPROVED', 'REUPLOAD_REQUIRED', 'CANCELLED'].includes(normalizedDecision)) {
        res.status(400).json({ success: false, error: 'Decision must be APPROVED, REUPLOAD_REQUIRED, or CANCELLED.' });
        return;
      }

      const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
      if (normalizedDecision === 'REUPLOAD_REQUIRED' && !trimmedReason) {
        res.status(400).json({ success: false, error: 'Reason is mandatory when requesting reupload.' });
        return;
      }

      const submission = await KycSubmissionModel.findById(id);
      if (!submission) {
        res.status(404).json({ success: false, error: 'KYC submission not found' });
        return;
      }
      if (submission.isLocked || submission.status === 'APPROVED') {
        res.status(409).json({
          success: false,
          code: 'KYC_ALREADY_APPROVED',
          error: 'This KYC application is already permanently approved and locked.'
        });
        return;
      }

      const reqList = Array.isArray(submission.additionalDocumentRequests)
        ? submission.additionalDocumentRequests
        : [];
      const idx = reqList.findIndex((r: any) => String(r.requestId) === requestId);
      if (idx === -1) {
        res.status(404).json({ success: false, error: 'Additional document request not found.' });
        return;
      }

      const now = new Date();
      const targetReq = reqList[idx] as any;
      targetReq.status = normalizedDecision;
      targetReq.reviewedAt = now;
      targetReq.reviewedByName = req.admin?.name || 'FIC Compliance Officer';
      targetReq.reviewReason = trimmedReason || undefined;
      submission.additionalDocumentRequests![idx] = targetReq;
      submission.markModified('additionalDocumentRequests');

      // Also sync linked document inside submission.documents if uploaded
      const linkedDocIdx = (submission.documents || []).findIndex(
        (d: any) =>
          String(d.docKey) === String(targetReq.docKey) ||
          (targetReq.fulfilledDocumentId && String(d.documentId) === String(targetReq.fulfilledDocumentId))
      );
      if (linkedDocIdx >= 0 && normalizedDecision !== 'CANCELLED') {
        const linkedDoc = submission.documents[linkedDocIdx] as any;
        linkedDoc.status = normalizedDecision;
        linkedDoc.adminReviewReason = normalizedDecision === 'APPROVED' ? undefined : trimmedReason;
        linkedDoc.reviewedAt = now;
        linkedDoc.reviewedByName = req.admin?.name || 'FIC Compliance Officer';
        submission.documents[linkedDocIdx] = linkedDoc;
        submission.markModified('documents');

        if (linkedDoc.documentId) {
          await DocumentAssetModel.updateOne(
            { documentId: linkedDoc.documentId },
            {
              $set: {
                documentStatus: normalizedDecision,
                reviewedAt: now,
                reviewedByName: req.admin?.name || 'FIC Compliance Officer',
                ...(trimmedReason && normalizedDecision !== 'APPROVED' ? { adminReviewReason: trimmedReason } : {})
              }
            }
          );
        }
      }

      await submission.save();

      const memberUser = await UserModel.findOne({
        $or: [{ _id: submission.memberId }, ...(submission.memberEmail ? [{ email: submission.memberEmail.toLowerCase() }] : [])]
      });

      await KYCSubmissionModel.findOneAndUpdate(
        { $or: [{ userId: submission.memberId }, ...(memberUser?._id ? [{ userId: memberUser._id }] : [])] },
        {
          $set: {
            additionalDocumentRequests: submission.additionalDocumentRequests,
            documents: buildMemberKycDocuments(submission.documents || [])
          }
        }
      );

      if (memberUser && normalizedDecision !== 'CANCELLED') {
        await notifyMember({
          userId: memberUser._id,
          eventType:
            normalizedDecision === 'APPROVED' ? 'ADDITIONAL_DOCUMENT_APPROVED' : 'ADDITIONAL_DOCUMENT_REUPLOAD_REQUIRED',
          title:
            normalizedDecision === 'APPROVED'
              ? `Additional Document Approved (${targetReq.documentName})`
              : `Correction Needed: ${targetReq.documentName}`,
          message:
            normalizedDecision === 'APPROVED'
              ? `Your additional document "${targetReq.documentName}" has been approved.`
              : `Please reupload "${targetReq.documentName}". Reason: ${trimmedReason}`,
          link: '/kyc-pending',
          priority: 'HIGH'
        });
      }

      await logAdminAction(req, `KYC_ADDITIONAL_DOC_${normalizedDecision}`, 'KycSubmission', id, {
        requestId,
        documentName: targetReq.documentName,
        decision: normalizedDecision
      });

      const { normalizedDocs, docSummary } = summarizeSubmissionDocs(submission.documents || []);
      res.json({
        success: true,
        message: `Additional document "${targetReq.documentName}" updated to ${normalizedDecision}.`,
        data: {
          ...submission.toObject(),
          documents: normalizedDocs.map((d) => ({ ...d, fileUrl: d.adminViewUrl || d.fileUrl })),
          docSummary
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/admin/kyc/:id/reverify - Strict exception: SUPER_ADMIN only reverification with full history preservation
router.post(
  '/:id/reverify',
  authenticateAdmin,
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    try {
      if (String(req.admin?.role || '').toUpperCase() !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          code: 'SUPER_ADMIN_REQUIRED',
          error: 'Only an authorized Super Admin can initiate reverification of an approved KYC application.'
        });
        return;
      }

      const { id } = req.params;
      const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
      if (reason.length < 10) {
        res.status(400).json({
          success: false,
          error: 'A detailed compliance reason (at least 10 characters) is mandatory to initiate reverification.'
        });
        return;
      }

      const submission = await KycSubmissionModel.findById(id);
      if (!submission) {
        res.status(404).json({ success: false, error: 'KYC submission not found' });
        return;
      }

      const now = new Date();
      const adminObjectId = req.admin?.id && mongoose.Types.ObjectId.isValid(req.admin.id)
        ? new mongoose.Types.ObjectId(req.admin.id)
        : undefined;

      const historyEntry = {
        ...(adminObjectId ? { initiatedBy: adminObjectId } : {}),
        initiatedByName: req.admin?.name || 'Super Admin',
        reason,
        initiatedAt: now,
        previousApprovedAt: submission.approvedAt || submission.verifiedAt,
        previousApprovedByName: submission.approvedByName || 'Compliance Desk'
      };

      submission.reverificationHistory = [...(submission.reverificationHistory || []), historyEntry] as any;
      submission.isLocked = false;
      submission.status = 'UNDER_REVIEW';
      submission.reviewerNotes = `Super Admin Reverification Initiated: ${reason}`;
      submission.markModified('reverificationHistory');
      await submission.save();

      const member = await MemberModel.findOneAndUpdate(
        { $or: [{ _id: submission.memberId }, ...(submission.memberEmail ? [{ email: submission.memberEmail.toLowerCase() }] : [])] },
        { $set: { kycStatus: 'UNDER_REVIEW', kycLocked: false, status: 'UNDER_REVIEW' } },
        { new: true }
      );

      const user = await UserModel.findOneAndUpdate(
        { $or: [{ _id: submission.memberId }, { email: submission.memberEmail?.toLowerCase() }] },
        { $set: { isKycApproved: false, kycLocked: false } },
        { new: true }
      );

      await KYCSubmissionModel.findOneAndUpdate(
        { $or: [{ userId: submission.memberId }, ...(member?._id ? [{ userId: member._id }] : [])] },
        {
          $set: {
            status: KYCStatus.PENDING,
            isLocked: false,
            reverificationHistory: submission.reverificationHistory
          }
        }
      );

      if (user) {
        await notifyMember({
          userId: user._id,
          eventType: 'KYC_REVERIFICATION_INITIATED',
          title: 'KYC Compliance Reverification Notice',
          message: `FIC Super Admin initiated a compliance reverification of your KYC profile. Reason: ${reason}`,
          link: '/kyc-pending',
          priority: 'HIGH'
        });
      }

      await logAdminAction(req, 'KYC_SUPER_ADMIN_REVERIFY', 'KycSubmission', id, {
        reason,
        previousApprovedAt: historyEntry.previousApprovedAt
      });

      const { normalizedDocs, docSummary } = summarizeSubmissionDocs(submission.documents || []);
      res.json({
        success: true,
        message: 'Approved KYC unlocked for Super Admin reverification with full history preserved.',
        data: {
          ...submission.toObject(),
          documents: normalizedDocs.map((d) => ({ ...d, fileUrl: d.adminViewUrl || d.fileUrl })),
          docSummary
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default router;
