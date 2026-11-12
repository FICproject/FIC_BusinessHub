import mongoose from 'mongoose';
import { AccountStatus, MembershipStatus } from '@fic/shared-types';
import { UserModel } from '../users/users.model';
import { MemberModel } from '../admin/models/Member';
import { KycSubmissionModel as AdminKycSubmissionModel } from '../admin/models/KycSubmission';
import { KYCSubmissionModel } from './kyc.model';
import { MembershipModel } from '../membership/membership.model';
import { PaymentModel } from '../payments/payments.model';
import { DocumentAssetModel } from '../documents/documents.model';

export type CanonicalDocStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REUPLOAD_REQUIRED'
  | 'REJECTED';

export function normalizeDocStatus(raw?: string): CanonicalDocStatus {
  const s = String(raw || 'PENDING_REVIEW').trim().toUpperCase();
  if (s === 'APPROVED' || s === 'VERIFIED') return 'APPROVED';
  if (s === 'REUPLOAD_REQUIRED' || s === 'RESUBMIT_REQUIRED' || s === 'RESUBMISSION_REQUESTED') {
    return 'REUPLOAD_REQUIRED';
  }
  if (s === 'REJECTED') return 'REJECTED';
  return 'PENDING_REVIEW';
}

export function normalizeOverallKycStatus(raw?: string, isApproved?: boolean): string {
  if (isApproved) return 'APPROVED';
  const s = String(raw || 'NOT_SUBMITTED').trim().toUpperCase();
  if (s === 'APPROVED' || s === 'VERIFIED') return 'APPROVED';
  if (s === 'REJECTED') return 'REJECTED';
  if (s === 'RESUBMISSION_REQUESTED' || s === 'RESUBMIT_REQUIRED' || s === 'REUPLOAD_REQUIRED') {
    return 'RESUBMISSION_REQUESTED';
  }
  if (s === 'PENDING' || s === 'UNDER_REVIEW' || s === 'SUBMITTED') {
    return s === 'UNDER_REVIEW' ? 'UNDER_REVIEW' : 'SUBMITTED';
  }
  if (s === 'NOT_SUBMITTED') return 'NOT_SUBMITTED';
  return s;
}

export function buildNormalizedKycDocuments(
  adminDocs: any[] = [],
  customerDocs: any[] = [],
  privateAssets: any[] = []
) {
  const assetById = new Map<string, any>();
  for (const a of privateAssets) {
    if (a?.documentId) assetById.set(String(a.documentId), a);
  }

  const sourceList = adminDocs && adminDocs.length > 0 ? adminDocs : customerDocs || [];
  return sourceList.map((doc: any, idx: number) => {
    const docId = doc.documentId ? String(doc.documentId) : undefined;
    const asset = docId ? assetById.get(docId) : undefined;
    const docKey = doc.docKey || doc.documentType || docId || `doc_${idx}`;
    const canonicalStatus = normalizeDocStatus(doc.status || doc.verificationStatus || asset?.documentStatus);
    const reason = doc.adminReviewReason || doc.rejectionReason || doc.remarks || asset?.adminReviewReason || undefined;
    const version = Number(doc.version || asset?.version || 1);

    return {
      docKey,
      documentType: doc.documentType || doc.docKey || docKey,
      documentId: docId,
      title: doc.title || doc.documentName || asset?.documentLabel || doc.docKey || `Document #${idx + 1}`,
      fileName: doc.fileName || doc.originalFileName || asset?.originalFileName || `Document_${idx + 1}`,
      fileUrl: docId ? `/api/v1/documents/${docId}/view` : doc.fileUrl,
      adminViewUrl: docId ? `/api/admin/documents/${docId}/view` : doc.fileUrl,
      originalMimeType: doc.originalMimeType || asset?.originalMimeType,
      originalFileSize: doc.originalFileSize || asset?.originalFileSize,
      checksum: doc.checksum || asset?.checksum,
      documentNumber: doc.documentNumber || asset?.documentNumber || '',
      status: canonicalStatus,
      adminReviewReason: canonicalStatus === 'APPROVED' ? undefined : reason,
      rejectionReason: canonicalStatus === 'APPROVED' ? undefined : reason,
      version,
      previousVersionReference: doc.previousVersionReference || asset?.previousVersionReference || asset?.previousVersionId,
      reviewedAt: doc.reviewedAt || asset?.reviewedAt,
      reviewedByName: doc.reviewedByName || asset?.reviewedByName,
      uploadedAt: doc.uploadedAt || asset?.createdAt || new Date().toISOString(),
      versionHistory: Array.isArray(doc.versionHistory) ? doc.versionHistory : []
    };
  });
}

/**
 * Returns strictly Admin-approved KYC and additional documents for Member Profile display.
 * Excludes pending, rejected, superseded, and duplicate documents.
 */
export function buildApprovedProfileDocuments(
  normalizedDocs: any[] = [],
  additionalDocumentRequests: any[] = [],
  privateAssets: any[] = []
) {
  const assetById = new Map<string, any>();
  for (const a of privateAssets) {
    if (a?.documentId && a?.isLatestVersion !== false && !a?.isDeleted) {
      assetById.set(String(a.documentId), a);
    }
  }

  const deduped = new Map<string, any>();

  for (const doc of normalizedDocs || []) {
    if (normalizeDocStatus(doc.status) !== 'APPROVED') continue;
    const docId = doc.documentId ? String(doc.documentId) : '';
    const dedupeKey = docId || `KEY:${String(doc.docKey || doc.documentType || doc.title || '').trim().toUpperCase()}`;
    if (!dedupeKey) continue;

    const asset = docId ? assetById.get(docId) : undefined;
    const existing = deduped.get(dedupeKey);
    const version = Number(doc.version || asset?.version || 1);
    if (existing && Number(existing.version || 1) >= version) continue;

    deduped.set(dedupeKey, {
      documentId: docId || undefined,
      docKey: doc.docKey || doc.documentType || dedupeKey,
      documentCategory: doc.documentType || doc.docKey || 'KYC_DOCUMENT',
      title: doc.title || asset?.documentLabel || 'Verified KYC Document',
      fileName: doc.fileName || asset?.originalFileName || doc.title || 'verified-document',
      originalFileName: doc.fileName || asset?.originalFileName || doc.title || 'verified-document',
      originalFileExtension: asset?.originalFileExtension || (doc.fileName?.split('.').pop() || 'file'),
      originalMimeType: doc.originalMimeType || asset?.originalMimeType || 'application/octet-stream',
      originalFileSize: Number(doc.originalFileSize || asset?.originalFileSize || 0),
      checksum: doc.checksum || asset?.checksum,
      version,
      status: 'APPROVED',
      documentStatus: 'APPROVED',
      reviewedAt: doc.reviewedAt || asset?.reviewedAt,
      uploadedAt: doc.uploadedAt || asset?.createdAt,
      viewUrl: docId ? `/api/v1/documents/${docId}/view` : doc.fileUrl
    });
  }

  for (const reqDoc of additionalDocumentRequests || []) {
    if (normalizeDocStatus(reqDoc?.status) !== 'APPROVED') continue;
    const uploadedDoc = reqDoc?.uploadedDocument || {};
    const docId = uploadedDoc.documentId ? String(uploadedDoc.documentId) : '';
    const dedupeKey = docId || `ADD:${String(reqDoc.requestId || reqDoc.documentName || '').trim().toUpperCase()}`;
    if (!dedupeKey || deduped.has(dedupeKey)) continue;

    const asset = docId ? assetById.get(docId) : undefined;
    deduped.set(dedupeKey, {
      documentId: docId || undefined,
      docKey: reqDoc.requestId || dedupeKey,
      documentCategory: 'ADDITIONAL_KYC_DOCUMENT',
      title: reqDoc.documentName || uploadedDoc.title || asset?.documentLabel || 'Approved Additional Document',
      fileName: uploadedDoc.fileName || asset?.originalFileName || reqDoc.documentName || 'additional-document',
      originalFileName: uploadedDoc.fileName || asset?.originalFileName || reqDoc.documentName || 'additional-document',
      originalFileExtension: asset?.originalFileExtension || (uploadedDoc.fileName?.split('.').pop() || 'file'),
      originalMimeType: uploadedDoc.originalMimeType || asset?.originalMimeType || 'application/octet-stream',
      originalFileSize: Number(uploadedDoc.originalFileSize || asset?.originalFileSize || 0),
      checksum: uploadedDoc.checksum || asset?.checksum,
      version: Number(uploadedDoc.version || asset?.version || 1),
      status: 'APPROVED',
      documentStatus: 'APPROVED',
      reviewedAt: reqDoc.reviewedAt || asset?.reviewedAt,
      uploadedAt: uploadedDoc.uploadedAt || asset?.createdAt,
      viewUrl: docId ? `/api/v1/documents/${docId}/view` : uploadedDoc.fileUrl
    });
  }

  return Array.from(deduped.values());
}

export async function resolveUserKycSnapshot(user: {
  _id: any;
  email?: string;
  isKycApproved?: boolean;
}) {
  const email = user.email?.toLowerCase();
  const [adminSub, customerSub, memberRecord] = await Promise.all([
    AdminKycSubmissionModel.findOne({
      $or: [{ memberId: user._id }, ...(email ? [{ memberEmail: email }] : [])]
    })
      .sort({ updatedAt: -1, submittedAt: -1 })
      .lean() as Promise<any>,
    KYCSubmissionModel.findOne({ userId: user._id })
      .sort({ updatedAt: -1 })
      .lean() as Promise<any>,
    MemberModel.findOne({
      $or: [{ _id: user._id }, ...(email ? [{ email }] : [])]
    }).lean() as Promise<any>
  ]);

  let kycStatus = 'NOT_SUBMITTED';
  let rejectionReason: string | undefined;
  let reviewerNotes: string | undefined;
  let reviewedAt: Date | string | undefined;
  let submittedAt: Date | string | undefined;

  if (adminSub?.status) {
    kycStatus = normalizeOverallKycStatus(adminSub.status, false);
    rejectionReason = adminSub.rejectionReason || customerSub?.rejectionReason || undefined;
    reviewerNotes = adminSub.reviewerNotes || undefined;
    reviewedAt = adminSub.verifiedAt || adminSub.updatedAt || customerSub?.reviewedAt || undefined;
    submittedAt = adminSub.submittedAt || customerSub?.createdAt || undefined;
  } else if (customerSub?.status) {
    const raw = String(customerSub.status);
    if (raw === 'NOT_SUBMITTED' && memberRecord?.kycStatus && memberRecord.kycStatus !== 'NOT_SUBMITTED') {
      kycStatus = normalizeOverallKycStatus(memberRecord.kycStatus, false);
    } else {
      kycStatus = normalizeOverallKycStatus(raw, false);
    }
    rejectionReason = customerSub.rejectionReason || undefined;
    reviewedAt = customerSub.reviewedAt || undefined;
    submittedAt = customerSub.createdAt || undefined;
  } else if (memberRecord?.kycStatus) {
    kycStatus = normalizeOverallKycStatus(memberRecord.kycStatus, false);
    submittedAt = memberRecord.registeredAt || undefined;
  } else if (user.isKycApproved) {
    kycStatus = 'APPROVED';
  }

  return {
    kycStatus,
    isKycApproved: kycStatus === 'APPROVED',
    rejectionReason,
    reviewerNotes,
    reviewedAt,
    submittedAt,
    adminSub,
    customerSub,
    memberRecord
  };
}

export interface ActivationEvaluationResult {
  canAccessDashboard: boolean;
  denyStatus: number;
  denyCode: string;
  denyMessage: string;
  checks: {
    accountActive: boolean;
    isSuspended: boolean;
    kycApproved: boolean;
    kycStatus: string;
    kycLocked: boolean;
    membershipActive: boolean;
    paymentStatus: string;
    hasReuploadRequiredDocs: boolean;
    hasPendingAdditionalDocs: boolean;
  };
  user?: any;
  member?: any;
  kycSnapshot?: any;
}

export async function evaluateMemberActivationAccess(
  userId: string
): Promise<ActivationEvaluationResult> {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return {
      canAccessDashboard: false,
      denyStatus: 401,
      denyCode: 'UNAUTHORIZED',
      denyMessage: 'Invalid or missing user session.',
      checks: {
        accountActive: false,
        isSuspended: false,
        kycApproved: false,
        kycStatus: 'NOT_SUBMITTED',
        kycLocked: false,
        membershipActive: false,
        paymentStatus: 'PENDING',
        hasReuploadRequiredDocs: false,
        hasPendingAdditionalDocs: false
      }
    };
  }

  const user = await UserModel.findById(userId).select('-passwordHash').lean() as any;
  if (!user) {
    return {
      canAccessDashboard: false,
      denyStatus: 401,
      denyCode: 'USER_NOT_FOUND',
      denyMessage: 'Member account not found.',
      checks: {
        accountActive: false,
        isSuspended: false,
        kycApproved: false,
        kycStatus: 'NOT_SUBMITTED',
        kycLocked: false,
        membershipActive: false,
        paymentStatus: 'PENDING',
        hasReuploadRequiredDocs: false,
        hasPendingAdditionalDocs: false
      }
    };
  }

  const [kycSnapshot, latestMembership, latestPayment] = await Promise.all([
    resolveUserKycSnapshot(user),
    MembershipModel.findOne({ userId: user._id }).sort({ endDate: -1, createdAt: -1 }).lean() as Promise<any>,
    PaymentModel.findOne({ userId: user._id, status: 'SUCCESS' }).sort({ createdAt: -1 }).lean() as Promise<any>
  ]);

  const member = kycSnapshot.memberRecord;
  const userSuspended =
    user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.DEACTIVATED;
  const memberSuspended =
    member?.status === 'SUSPENDED' || member?.status === 'BLOCKED' || member?.status === 'DEACTIVATED';
  const isSuspended = Boolean(userSuspended || memberSuspended);
  const accountActive = Boolean(user.status === AccountStatus.ACTIVE && !memberSuspended);

  const normalizedDocs = buildNormalizedKycDocuments(
    kycSnapshot.adminSub?.documents,
    kycSnapshot.customerSub?.documents
  );
  const hasReuploadRequiredDocs = normalizedDocs.some((d) => d.status === 'REUPLOAD_REQUIRED');
  const hasRejectedDocs = normalizedDocs.some((d) => d.status === 'REJECTED');
  const hasPendingDocs = normalizedDocs.some((d) => d.status === 'PENDING_REVIEW');
  const additionalRequests = Array.isArray(kycSnapshot.adminSub?.additionalDocumentRequests)
    ? kycSnapshot.adminSub.additionalDocumentRequests
    : Array.isArray(kycSnapshot.customerSub?.additionalDocumentRequests)
    ? kycSnapshot.customerSub.additionalDocumentRequests
    : [];
  const hasPendingAdditionalDocs = additionalRequests.some(
    (req: any) =>
      req &&
      req.required !== false &&
      ['PENDING', 'SUBMITTED', 'REUPLOAD_REQUIRED'].includes(String(req.status || '').toUpperCase())
  );
  const kycLocked = Boolean(
    kycSnapshot.adminSub?.isLocked ||
      kycSnapshot.customerSub?.isLocked ||
      user.kycLocked ||
      member?.kycLocked ||
      kycSnapshot.kycStatus === 'APPROVED'
  );

  const kycApproved = Boolean(
    kycSnapshot.isKycApproved &&
      kycSnapshot.kycStatus === 'APPROVED' &&
      !hasReuploadRequiredDocs &&
      !hasRejectedDocs &&
      !hasPendingDocs &&
      !hasPendingAdditionalDocs
  );

  const now = new Date();
  const hasNonExpiredMembershipDoc = Boolean(
    latestMembership &&
      latestMembership.status === MembershipStatus.ACTIVE &&
      (!latestMembership.endDate || new Date(latestMembership.endDate) > now)
  );
  const paymentStatus = String(
    member?.paymentStatus || (latestPayment ? 'PAID' : user.isMembershipActive ? 'PAID' : 'PENDING')
  ).toUpperCase();

  const membershipNotExplicitlyFailed =
    paymentStatus !== 'FAILED' &&
    latestMembership?.status !== MembershipStatus.EXPIRED &&
    String(latestMembership?.status || '') !== 'CANCELLED' &&
    member?.status !== 'EXPIRED';

  const membershipActive = Boolean(
    membershipNotExplicitlyFailed &&
      (user.isMembershipActive === true || hasNonExpiredMembershipDoc || paymentStatus === 'PAID')
  );

  const canAccessDashboard = Boolean(accountActive && !isSuspended && kycApproved && membershipActive);

  let denyStatus = 403;
  let denyCode = 'ACCESS_DENIED';
  let denyMessage = 'Dashboard access requires full account, KYC, and membership activation.';

  if (isSuspended || !accountActive) {
    denyCode = 'ACCOUNT_SUSPENDED';
    denyMessage = 'Your account is suspended or inactive. Access to the member dashboard is disabled.';
  } else if (kycSnapshot.kycStatus === 'REJECTED') {
    denyCode = 'KYC_REJECTED';
    denyMessage = 'Your KYC verification application was rejected. Dashboard access is blocked.';
  } else if (kycSnapshot.kycStatus === 'RESUBMISSION_REQUESTED' || hasReuploadRequiredDocs) {
    denyCode = 'KYC_REUPLOAD_REQUIRED';
    denyMessage = 'One or more KYC documents require correction and reupload before dashboard access is enabled.';
  } else if (hasPendingAdditionalDocs) {
    denyCode = 'ADDITIONAL_DOCUMENTS_REQUIRED';
    denyMessage = 'Additional documents requested by FIC Admin must be submitted and approved before dashboard access is enabled.';
  } else if (!kycApproved) {
    denyCode = 'KYC_APPROVAL_REQUIRED';
    denyMessage = 'Your KYC verification is currently pending admin approval. Dashboard access is locked until approved.';
  } else if (!membershipActive) {
    denyCode = 'MEMBERSHIP_INACTIVE';
    denyMessage = 'Active membership payment/subscription is required before accessing the member dashboard.';
  }

  return {
    canAccessDashboard,
    denyStatus,
    denyCode,
    denyMessage,
    checks: {
      accountActive,
      isSuspended,
      kycApproved,
      kycStatus: kycSnapshot.kycStatus,
      kycLocked,
      membershipActive,
      paymentStatus,
      hasReuploadRequiredDocs,
      hasPendingAdditionalDocs
    },
    user,
    member,
    kycSnapshot
  };
}

export async function getMemberLatestAssetsMap(userId: mongoose.Types.ObjectId | string) {
  return DocumentAssetModel.find({
    ownerId: userId,
    entityType: 'KYC',
    isDeleted: { $ne: true }
  })
    .sort({ version: -1, createdAt: -1 })
    .lean();
}
