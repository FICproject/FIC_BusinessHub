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
      } else if (s === 'SUBMITTED') {
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

        return {
          ...sub,
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
      } else if (submission.status === 'APPROVED' && normalizeDocStatus(targetDoc.status) !== 'APPROVED') {
        submission.status = 'UNDER_REVIEW';
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
              documents: submission.documents.map((d: any) => ({
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

// PATCH /api/admin/kyc/:id/review - Overall Review/Decision on KYC submission
router.patch('/:id/review', authenticateAdmin, requirePermission('KYC_VERIFY'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision, reviewerNotes, rejectionReason } = req.body; // 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED'

    if (!['APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED'].includes(decision)) {
      res.status(400).json({ success: false, error: 'Invalid review decision' });
      return;
    }

    const submission = await KycSubmissionModel.findById(id);
    if (!submission) {
      res.status(404).json({ success: false, error: 'KYC submission not found' });
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

    // Strict rule: before final KYC approval, every uploaded document must be individually APPROVED
    if (decision === 'APPROVED') {
      if (!submission.documents || submission.documents.length === 0) {
        res.status(400).json({
          success: false,
          code: 'NO_DOCUMENTS_UPLOADED',
          error: 'Cannot approve KYC because the member has not uploaded any KYC documents.'
        });
        return;
      }
      const unapproved = submission.documents.filter((d: any) => normalizeDocStatus(d.status) !== 'APPROVED');
      if (unapproved.length > 0) {
        res.status(400).json({
          success: false,
          code: 'DOCUMENTS_NOT_APPROVED',
          error: `Cannot approve overall KYC until all documents are approved (${unapproved
            .map((d: any) => `${d.title}: ${normalizeDocStatus(d.status)}`)
            .join(', ')}).`
        });
        return;
      }
    }

    const now = new Date();
    submission.status = decision;
    submission.reviewerNotes = trimmedNotes || submission.reviewerNotes;
    submission.rejectionReason = decision === 'APPROVED' ? undefined : trimmedReason;
    submission.verifiedAt = now;
    await submission.save();

    const member = await MemberModel.findOne({
      $or: [{ _id: submission.memberId }, ...(submission.memberEmail ? [{ email: submission.memberEmail.toLowerCase() }] : [])]
    });
    if (member) {
      member.kycStatus = decision;
      if (decision === 'APPROVED' && member.paymentStatus === 'PAID') {
        member.status = 'ACTIVE';
      } else if (decision === 'REJECTED' || decision === 'RESUBMISSION_REQUESTED') {
        member.status = 'PENDING_KYC';
      }
      await member.save();
    }

    const isApproved = decision === 'APPROVED';
    const updatedUser = await UserModel.findOneAndUpdate(
      { $or: [{ _id: submission.memberId }, { email: submission.memberEmail?.toLowerCase() }] },
      {
        $set: {
          isKycApproved: isApproved,
          ...(isApproved ? {} : {})
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
          reviewedAt: now
        }
      },
      { upsert: true }
    );

    const linkedDocIds = (submission.documents || []).map((d: any) => d.documentId).filter(Boolean);
    if (decision === 'APPROVED' && linkedDocIds.length > 0) {
      await DocumentAssetModel.updateMany(
        {
          documentId: { $in: linkedDocIds },
          isLatestVersion: { $ne: false }
        },
        { $set: { documentStatus: 'APPROVED', reviewedAt: now, reviewedByName: req.admin?.name } }
      );
    }

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
          metadata: { kycSubmissionId: submission._id.toString() }
        });
      } else if (decision === 'RESUBMISSION_REQUESTED') {
        await notifyMember({
          userId: updatedUser._id,
          eventType: 'KYC_RESUBMISSION_REQUESTED',
          title: 'KYC Resubmission Requested',
          message: `Your KYC application requires correction. Reason: ${trimmedReason}`,
          link: '/kyc-pending',
          priority: 'HIGH',
          metadata: { kycSubmissionId: submission._id.toString(), reason: trimmedReason }
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

export default router;
