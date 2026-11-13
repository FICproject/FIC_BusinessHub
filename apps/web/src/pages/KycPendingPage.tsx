import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Upload,
  CheckCircle2,
  XCircle,
  FileText,
  Send,
  Bell,
  Lock,
  Check
} from 'lucide-react';
import {
  getStoredUser,
  removeAuthToken,
  apiRequest,
  setStoredUser,
  uploadDocumentFile,
  submitKycApplicationStrict,
  validateClientFileBeforeUpload,
  reuploadSingleKycDocumentStrict,
  uploadAdditionalRequestedDocumentStrict,
  MAX_KYC_FILE_BYTES,
  markMemberNotificationReadStrict,
  markAllMemberNotificationsReadStrict
} from '../services/api';

type NormalizedKycState =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'RESUBMISSION_REQUESTED'
  | 'REJECTED'
  | 'APPROVED'
  | 'NOT_SUBMITTED';

function normalizeMemberKycStatus(raw?: string, isApproved?: boolean): NormalizedKycState {
  if (isApproved) return 'APPROVED';
  const upper = String(raw || 'SUBMITTED').trim().toUpperCase();
  if (upper === 'APPROVED' || upper === 'VERIFIED') return 'APPROVED';
  if (upper === 'REJECTED') return 'REJECTED';
  if (upper === 'RESUBMISSION_REQUESTED' || upper === 'RESUBMIT_REQUIRED') return 'RESUBMISSION_REQUESTED';
  if (upper === 'UNDER_REVIEW') return 'UNDER_REVIEW';
  if (upper === 'NOT_SUBMITTED') return 'NOT_SUBMITTED';
  return 'SUBMITTED';
}

function getDocBadgeInfo(status?: string) {
  const s = String(status || 'PENDING_REVIEW').toUpperCase();
  if (s === 'APPROVED' || s === 'VERIFIED') {
    return {
      label: 'Approved',
      className: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    };
  }
  if (s === 'REUPLOAD_REQUIRED') {
    return {
      label: 'Reupload Required',
      className: 'bg-amber-100 text-amber-800 border border-amber-300'
    };
  }
  if (s === 'REJECTED') {
    return {
      label: 'Rejected',
      className: 'bg-rose-100 text-rose-800 border border-rose-200'
    };
  }
  return {
    label: 'Pending Review',
    className: 'bg-sky-100 text-sky-800 border border-sky-200'
  };
}

export const KycPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(() => getStoredUser());
  const [checking, setChecking] = useState(false);
  const [kycStatus, setKycStatus] = useState<NormalizedKycState>(() =>
    normalizeMemberKycStatus(user?.kycStatus, user?.isKycApproved)
  );
  const [rejectionReason, setRejectionReason] = useState<string | null>(user?.rejectionReason || null);
  const [reviewerNotes, setReviewerNotes] = useState<string | null>(user?.reviewerNotes || null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(user?.reviewedAt || null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [additionalRequests, setAdditionalRequests] = useState<any[]>([]);
  const [uploadingRequestId, setUploadingRequestId] = useState<string | null>(null);
  const [additionalUploadFeedback, setAdditionalUploadFeedback] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});
  const [isLocked, setIsLocked] = useState<boolean>(Boolean(user?.isKycApproved));
  const [approvedAt, setApprovedAt] = useState<string | null>(user?.kycApprovedAt || null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [activationChecks, setActivationChecks] = useState<any>(user?.activationChecks || null);
  const [canAccessDashboard, setCanAccessDashboard] = useState<boolean>(Boolean(user?.canAccessDashboard));

  // Individual single-document reupload states
  const [reuploadingDocKey, setReuploadingDocKey] = useState<string | null>(null);
  const [docUploadFeedback, setDocUploadFeedback] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});

  // Initial KYC submission states (only used when status === NOT_SUBMITTED)
  const [resubmitDocType, setResubmitDocType] = useState<string>('ID_PROOF');
  const [resubmitDocNumber, setResubmitDocNumber] = useState<string>('');
  const [resubmitFiles, setResubmitFiles] = useState<Array<{ file: File; label: string; type: string; number: string }>>([]);
  const [resubmitError, setResubmitError] = useState<string>('');
  const [resubmitSuccess, setResubmitSuccess] = useState<string>('');
  const [submittingResubmit, setSubmittingResubmit] = useState<boolean>(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      let updatedUser: any = null;
      let liveKycData: any = null;

      try {
        const meRes = await apiRequest('/auth/me');
        if (meRes?.data) updatedUser = meRes.data;
      } catch {
        // Fallback below
      }

      try {
        const kycRes = await apiRequest('/kyc/status');
        if (kycRes?.data) liveKycData = kycRes.data;
      } catch {
        // Ignore if unauthenticated
      }

      if (!updatedUser && user?.email) {
        try {
          const checkRes = await apiRequest(`/auth/check-status?email=${encodeURIComponent(user.email)}`);
          if (checkRes?.data) updatedUser = checkRes.data;
        } catch {
          // Ignore network error
        }
      }

      if (updatedUser || liveKycData) {
        const merged = {
          ...(user || {}),
          ...(updatedUser || {}),
          ...(liveKycData?.kycStatus ? { kycStatus: liveKycData.kycStatus } : {}),
          ...(typeof liveKycData?.isKycApproved === 'boolean' ? { isKycApproved: liveKycData.isKycApproved } : {}),
          ...(typeof liveKycData?.canAccessDashboard === 'boolean'
            ? { canAccessDashboard: liveKycData.canAccessDashboard }
            : {}),
          ...(liveKycData?.activationChecks ? { activationChecks: liveKycData.activationChecks } : {}),
          rejectionReason: liveKycData?.rejectionReason ?? updatedUser?.rejectionReason ?? undefined,
          reviewerNotes: liveKycData?.reviewerNotes ?? updatedUser?.reviewerNotes ?? undefined,
          reviewedAt: liveKycData?.reviewedAt ?? updatedUser?.reviewedAt ?? undefined
        };

        const resolvedState = normalizeMemberKycStatus(merged.kycStatus, merged.isKycApproved);
        merged.kycStatus = resolvedState;

        setUser(merged);
        setStoredUser(merged);
        setKycStatus(resolvedState);
        setRejectionReason(merged.rejectionReason || null);
        setReviewerNotes(merged.reviewerNotes || null);
        setReviewedAt(merged.reviewedAt || null);

        if (liveKycData?.activationChecks || updatedUser?.activationChecks) {
          setActivationChecks(liveKycData?.activationChecks || updatedUser?.activationChecks);
        }
        const unlocked = Boolean(liveKycData?.canAccessDashboard ?? merged.canAccessDashboard);
        setCanAccessDashboard(unlocked);

        const docList = Array.isArray(liveKycData?.documents) && liveKycData.documents.length > 0
          ? liveKycData.documents
          : Array.isArray(liveKycData?.adminDocuments) && liveKycData.adminDocuments.length > 0
          ? liveKycData.adminDocuments
          : Array.isArray(liveKycData?.documentAssets)
          ? liveKycData.documentAssets.map((a: any) => ({
              docKey: a.documentCategory,
              documentId: a.documentId,
              title: a.documentLabel,
              fileName: a.originalFileName,
              status: a.documentStatus,
              version: a.version || 1,
              adminReviewReason: a.adminReviewReason
            }))
          : [];
        setDocuments(docList);
        setAdditionalRequests(
          (Array.isArray(liveKycData?.additionalDocumentRequests) ? liveKycData.additionalDocumentRequests : [])
            .filter((r: any) => String(r?.status || '').toUpperCase() !== 'CANCELLED')
        );
        setIsLocked(Boolean(liveKycData?.isLocked || resolvedState === 'APPROVED'));
        setApprovedAt(liveKycData?.approvedAt || null);

        if (Array.isArray(liveKycData?.notifications)) {
          setNotifications(liveKycData.notifications);
          setUnreadNotificationsCount(
            typeof liveKycData.unreadNotificationsCount === 'number'
              ? liveKycData.unreadNotificationsCount
              : liveKycData.notifications.filter((n: any) => !n.isRead).length
          );
        }

        if (resolvedState === 'APPROVED' && unlocked) {
          navigate('/dashboard', { replace: true });
          return;
        }
      }
    } catch (e) {
      console.error('Failed to sync KYC status', e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login', { replace: true });
  };

  const handleSingleDocumentReupload = async (doc: any, file?: File) => {
    if (!file) return;
    const docRef = String(doc.docKey || doc.documentId);
    setDocUploadFeedback((prev) => {
      const next = { ...prev };
      delete next[docRef];
      return next;
    });

    try {
      validateClientFileBeforeUpload(file, MAX_KYC_FILE_BYTES, ['pdf', 'jpg', 'jpeg', 'png']);
    } catch (valErr: any) {
      setDocUploadFeedback((prev) => ({
        ...prev,
        [docRef]: { type: 'error', message: valErr?.message || 'File size must not exceed 2 MB. Please upload a smaller file.' }
      }));
      return;
    }

    setReuploadingDocKey(docRef);
    try {
      const resData = await reuploadSingleKycDocumentStrict(docRef, file, doc.documentNumber);
      setDocUploadFeedback((prev) => ({
        ...prev,
        [docRef]: {
          type: 'success',
          message: `"${doc.title}" (v${resData?.document?.version || Number(doc.version || 1) + 1}) uploaded for Admin review.`
        }
      }));
      await checkStatus();
    } catch (err: any) {
      setDocUploadFeedback((prev) => ({
        ...prev,
        [docRef]: { type: 'error', message: err?.message || 'Unable to reupload this document.' }
      }));
    } finally {
      setReuploadingDocKey(null);
    }
  };

  const handleUploadAdditionalDoc = async (reqItem: any, file?: File) => {
    if (!file) return;
    const reqId = String(reqItem.requestId);
    setAdditionalUploadFeedback((prev) => {
      const next = { ...prev };
      delete next[reqId];
      return next;
    });

    const allowed = Array.isArray(reqItem.allowedExtensions) && reqItem.allowedExtensions.length > 0
      ? reqItem.allowedExtensions
      : ['pdf', 'jpg', 'jpeg', 'png'];

    try {
      validateClientFileBeforeUpload(file, MAX_KYC_FILE_BYTES, allowed);
    } catch (valErr: any) {
      setAdditionalUploadFeedback((prev) => ({
        ...prev,
        [reqId]: { type: 'error', message: valErr?.message || 'File size must not exceed 2 MB. Please upload a smaller file.' }
      }));
      return;
    }

    setUploadingRequestId(reqId);
    try {
      await uploadAdditionalRequestedDocumentStrict(reqId, file, allowed);
      setAdditionalUploadFeedback((prev) => ({
        ...prev,
        [reqId]: {
          type: 'success',
          message: `"${reqItem.documentName}" uploaded successfully and sent to Admin for review.`
        }
      }));
      await checkStatus();
    } catch (err: any) {
      setAdditionalUploadFeedback((prev) => ({
        ...prev,
        [reqId]: { type: 'error', message: err?.message || 'Failed to upload requested document.' }
      }));
    } finally {
      setUploadingRequestId(null);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadNotificationsCount((c) => Math.max(0, c - 1));
    await markMemberNotificationReadStrict(id);
  };

  const handleMarkAllNotifsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotificationsCount(0);
    await markAllMemberNotificationsReadStrict();
  };

  const handleSelectInitialFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResubmitError('');
    setResubmitSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateClientFileBeforeUpload(file, MAX_KYC_FILE_BYTES, ['pdf', 'jpg', 'jpeg', 'png', 'docx']);
    } catch (valErr: any) {
      setResubmitError(valErr?.message || 'Invalid file selected.');
      return;
    }
    setResubmitFiles((prev) => [
      ...prev,
      {
        file,
        label:
          resubmitDocType === 'ID_PROOF'
            ? 'Government Identity Proof (PAN / Aadhaar)'
            : resubmitDocType === 'BUSINESS_PROOF'
            ? 'Business Registration / Udyam / GST'
            : 'KYC Compliance Proof',
        type: resubmitDocType,
        number: resubmitDocNumber.trim()
      }
    ]);
    setResubmitDocNumber('');
    e.target.value = '';
  };

  const handleInitialKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResubmitError('');
    setResubmitSuccess('');
    if (resubmitFiles.length === 0) {
      setResubmitError('Please attach at least one KYC document to submit.');
      return;
    }

    setSubmittingResubmit(true);
    try {
      const uploadedItems: any[] = [];
      for (const item of resubmitFiles) {
        const asset = await uploadDocumentFile(item.file, {
          entityType: 'KYC',
          documentCategory: item.type === 'ID_PROOF' ? 'KYC_IDENTITY' : 'KYC_BUSINESS',
          documentLabel: item.label,
          documentNumber: item.number
        });
        uploadedItems.push({
          documentId: asset.documentId,
          documentType: item.type,
          documentName: item.label,
          documentNumber: item.number,
          fileName: asset.originalFileName || item.file.name,
          fileUrl: asset.viewUrl
        });
      }

      const categoryId =
        typeof user?.primaryCategoryId === 'object' ? user?.primaryCategoryId?._id : user?.primaryCategoryId;

      await submitKycApplicationStrict({
        categoryId,
        documents: uploadedItems
      });

      setResubmitFiles([]);
      setResubmitSuccess('KYC documents submitted successfully and routed for Admin verification.');
      await checkStatus();
    } catch (err: any) {
      setResubmitError(err?.message || 'Unable to submit KYC documents. Please try again.');
    } finally {
      setSubmittingResubmit(false);
    }
  };

  const reuploadDocs = documents.filter((d) => String(d.status).toUpperCase() === 'REUPLOAD_REQUIRED');
  const isResubmitRequested = kycStatus === 'RESUBMISSION_REQUESTED' || reuploadDocs.length > 0;
  const isRejected = kycStatus === 'REJECTED';
  const isApprovedAwaitingActivation = kycStatus === 'APPROVED' && !canAccessDashboard;

  const topBarClass = isRejected
    ? 'from-rose-500 via-red-500 to-rose-600'
    : isResubmitRequested
    ? 'from-orange-500 via-amber-500 to-orange-600'
    : 'from-amber-500 via-orange-500 to-amber-600';

  const statusBadgeText = isRejected
    ? 'REJECTED'
    : isResubmitRequested
    ? 'DOCUMENT CORRECTION REQUIRED'
    : isApprovedAwaitingActivation
    ? 'MEMBERSHIP / ACCOUNT ACTIVATION PENDING'
    : kycStatus === 'NOT_SUBMITTED'
    ? 'KYC SUBMISSION REQUIRED'
    : 'UNDER ADMIN VERIFICATION';

  const statusBadgeClass = isRejected
    ? 'bg-rose-100 text-rose-700 border border-rose-300'
    : isResubmitRequested
    ? 'bg-orange-100 text-orange-800 border border-orange-300'
    : 'bg-amber-100 text-amber-800 border border-amber-300';

  return (
    <div className="min-h-screen bg-[#F5EBDD]/50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-[#E8DBC8] shadow-xl p-6 sm:p-10 space-y-6 relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${topBarClass}`}></div>

        {/* Header Icon & Brand */}
        <div className="text-center space-y-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm border ${
              isRejected
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : isResubmitRequested
                ? 'bg-orange-50 border-orange-200 text-orange-600'
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}
          >
            {isRejected ? (
              <XCircle className="w-8 h-8 text-rose-600" />
            ) : isResubmitRequested ? (
              <ShieldAlert className="w-8 h-8 text-orange-600" />
            ) : (
              <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-[#29302D] tracking-tight">
            {isRejected
              ? 'KYC Application Rejected'
              : isResubmitRequested
              ? 'Document Correction & Reupload Required'
              : isApprovedAwaitingActivation
              ? 'Account Activation Pending'
              : 'Account & KYC Verification Status'}
          </h2>
          <p className="text-xs text-[#77786E] max-w-lg mx-auto leading-relaxed">
            {isRejected
              ? 'Your KYC verification application was reviewed and declined by FIC Compliance Administration. Review the details below.'
              : isResubmitRequested
              ? 'Your KYC document requires correction. Please review the document and upload it again.'
              : 'Your registration has been submitted successfully. Your documents are currently under verification. If any document requires correction, you will receive a notification. Your dashboard will become available after the required verification and activation steps are completed.'}
          </p>
        </div>

        {/* Notifications Panel (Persistent DB Notifications) */}
        {notifications.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DBC8] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#29302D]">
                <Bell className="w-4 h-4 text-[#C66B52]" />
                <span>Verification Notifications</span>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C66B52] text-white">
                    {unreadNotificationsCount} new
                  </span>
                )}
              </div>
              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllNotifsRead}
                  className="text-[11px] font-bold text-[#8064A9] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {notifications.slice(0, 6).map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkNotifRead(n.id)}
                  className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    n.isRead
                      ? 'bg-white border-[#E8DBC8] text-[#77786E]'
                      : 'bg-orange-50/70 border-orange-200 text-[#29302D]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-2">
                      <span>{n.title}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#C66B52] inline-block" />}
                    </div>
                    <p className="text-[11px] leading-relaxed">{n.message}</p>
                    <p className="text-[10px] opacity-60">
                      {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkNotifRead(n.id);
                      }}
                      title="Mark read"
                      className="text-[#8064A9] hover:text-[#6E529F] shrink-0 p-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applicant Overview Card */}
        <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8DBC8] space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-[#E8DBC8]">
            <span className="text-[#77786E] font-medium">Applicant Name</span>
            <span className="font-bold text-[#29302D]">{user?.fullName || 'Ecosystem Applicant'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-[#E8DBC8]">
            <span className="text-[#77786E] font-medium">Registered Email</span>
            <span className="font-bold text-[#29302D]">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-[#E8DBC8]">
            <span className="text-[#77786E] font-medium">Enrolled Sector</span>
            <span className="font-bold text-[#29302D]">{user?.primaryCategoryName || user?.categoryName || 'General'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-[#E8DBC8]">
            <span className="text-[#77786E] font-medium">Subcategory / Role</span>
            <span className="font-bold text-[#8064A9]">{user?.subCategory || user?.primarySubcategoryName || 'Member'}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-[#77786E] font-medium">Compliance Review Status</span>
            <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${statusBadgeClass}`}>
              {statusBadgeText}
            </span>
          </div>
        </div>

        {/* Permanent KYC Approval & Lock Notice */}
        {(kycStatus === 'APPROVED' || isLocked) && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-800">
                KYC Permanently Verified & Locked
              </div>
              <p className="font-medium leading-relaxed">
                Your identity and KYC verification are permanently approved{approvedAt ? ` as of ${new Date(approvedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}` : ''}.
              </p>
            </div>
          </div>
        )}

        {/* Explicit Admin Decision Feedback Box (Overall Reject/Resubmit) */}
        {(isRejected || isResubmitRequested) && rejectionReason && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              isRejected
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-orange-50 border-orange-200 text-orange-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase tracking-wider text-[10px]">
                {isRejected ? 'Official Rejection Reason' : 'Your KYC Document Requires Correction'}
              </span>
              {reviewedAt && (
                <span className="text-[10px] opacity-75">
                  Updated {new Date(reviewedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </span>
              )}
            </div>
            <p className="font-medium leading-relaxed">{rejectionReason}</p>
            {reviewerNotes && (
              <p className="text-[11px] opacity-85 pt-1 border-t border-black/10">Reviewer Note: {reviewerNotes}</p>
            )}
          </div>
        )}

        {/* Individual Document Verification & Targeted Single-Doc Reupload */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#29302D]">
                KYC Document Verification ({documents.length})
              </h3>
              <span className="text-[11px] text-[#77786E]">
                Reupload is enabled only on flagged documents
              </span>
            </div>

            <div className="space-y-3">
              {documents.map((doc: any, idx: number) => {
                const docRef = String(doc.docKey || doc.documentId || idx);
                const docStatusUpper = String(doc.status || 'PENDING_REVIEW').toUpperCase();
                const badge = getDocBadgeInfo(docStatusUpper);
                const isDocApproved = docStatusUpper === 'APPROVED' || docStatusUpper === 'VERIFIED';
                const canReupload = docStatusUpper === 'REUPLOAD_REQUIRED';
                const feedback = docUploadFeedback[docRef];
                const isUploading = reuploadingDocKey === docRef;

                return (
                  <div
                    key={`${docRef}-${idx}`}
                    className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                      canReupload
                        ? 'bg-amber-50/60 border-amber-300'
                        : isDocApproved
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-[#FAF7F2] border-[#E8DBC8]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-[#8064A9] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-[#29302D] truncate">
                            {doc.title || doc.documentLabel || doc.docKey}
                          </div>
                          <div className="text-[11px] text-[#77786E] truncate">
                            {doc.fileName} • Version v{doc.version || 1}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}>
                          {badge.label}
                        </span>
                        {isDocApproved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {(doc.adminReviewReason || doc.rejectionReason) && !isDocApproved && (
                      <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-amber-900 text-[11px]">
                        <strong>Reason:</strong> {doc.adminReviewReason || doc.rejectionReason}
                      </div>
                    )}

                    {canReupload && (
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-amber-900 font-medium">
                          Please upload a corrected copy of this document (PDF / JPG / JPEG / PNG • Max 2 MB, max 2 MB).
                        </span>
                        <label
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${
                            isUploading
                              ? 'bg-slate-300 text-slate-600 cursor-wait'
                              : 'bg-[#C66B52] hover:bg-[#b55e46] text-white'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Uploading Replacement...' : 'Reupload Document'}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                            disabled={isUploading}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = '';
                              if (f) handleSingleDocumentReupload(doc, f);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {feedback && (
                      <div
                        className={`p-2 rounded-lg text-[11px] font-semibold ${
                          feedback.type === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {feedback.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional Documents Requested by Admin (Only active, non-cancelled requests) */}
        {additionalRequests.filter((r: any) => String(r?.status || '').toUpperCase() !== 'CANCELLED').length > 0 && (() => {
          const activeReqs = additionalRequests.filter((r: any) => String(r?.status || '').toUpperCase() !== 'CANCELLED');
          return (
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#8064A9]/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#29302D]">
                <Upload className="w-4 h-4 text-[#8064A9]" />
                <span>Additional Documents Requested by Admin ({activeReqs.length})</span>
              </div>
              <span className="text-[10px] font-semibold text-[#77786E]">Max 2 MB • PDF/JPG/PNG</span>
            </div>

            {activeReqs.some((r: any) => ['PENDING', 'REUPLOAD_REQUIRED'].includes(String(r.status || '').toUpperCase())) && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                FIC Admin has requested an additional document. Please review the instructions and upload the requested document.
              </div>
            )}

            <div className="space-y-3">
              {activeReqs.map((reqItem: any) => {
                const reqStatus = String(reqItem.status || 'PENDING').toUpperCase();
                const canUpload = reqStatus === 'PENDING' || reqStatus === 'REUPLOAD_REQUIRED';
                const isUploadingReq = uploadingRequestId === reqItem.requestId;
                const fb = additionalUploadFeedback[reqItem.requestId];
                const allowedExts = Array.isArray(reqItem.allowedExtensions) && reqItem.allowedExtensions.length > 0
                  ? reqItem.allowedExtensions
                  : ['pdf', 'jpg', 'jpeg', 'png'];
                const acceptAttr = allowedExts.map((x: string) => `.${x}`).join(',');
                const badgeClass =
                  reqStatus === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : reqStatus === 'REUPLOAD_REQUIRED'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : reqStatus === 'SUBMITTED'
                    ? 'bg-sky-100 text-sky-800 border-sky-200'
                    : reqStatus === 'CANCELLED'
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-orange-100 text-orange-800 border-orange-200';
                const statusLabel =
                  reqStatus === 'APPROVED'
                    ? 'Approved'
                    : reqStatus === 'REUPLOAD_REQUIRED'
                    ? 'Reupload Required'
                    : reqStatus === 'SUBMITTED'
                    ? 'Submitted • Under Review'
                    : reqStatus === 'CANCELLED'
                    ? 'Cancelled'
                    : 'Action Required';

                return (
                  <div
                    key={reqItem.requestId}
                    className="p-4 rounded-xl bg-white border border-[#E8DBC8] space-y-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[#29302D] break-words">{reqItem.documentName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${reqItem.required !== false ? 'bg-[#C66B52]/10 text-[#C66B52]' : 'bg-slate-100 text-slate-600'}`}>
                            {reqItem.required !== false ? 'Mandatory' : 'Optional'}
                          </span>
                        </div>
                        {reqItem.description && (
                          <p className="text-[11px] text-[#77786E] leading-relaxed">
                            <strong className="text-[#29302D]">Instructions:</strong> {reqItem.description}
                          </p>
                        )}
                        <p className="text-[11px] text-[#77786E] leading-relaxed">
                          <strong className="text-[#29302D]">Reason:</strong> {reqItem.reason}
                        </p>
                        <p className="text-[10px] text-[#77786E]">
                          Accepted: {allowedExts.join(', ').toUpperCase()} • Strict Limit: 2 MB
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {(() => {
                      const fulfilledId = reqItem.fulfilledDocumentId || reqItem.uploadedDocumentId;
                      const linkedDoc = documents.find(
                        (d: any) => (fulfilledId && d.documentId === fulfilledId) || (reqItem.docKey && d.docKey === reqItem.docKey)
                      );
                      const uploadedFileName = reqItem.uploadedFileName || linkedDoc?.fileName;
                      const submittedAt = reqItem.submittedAt || reqItem.uploadedAt;
                      const remark = reqItem.reviewReason || reqItem.adminReviewReason;
                      return (
                        <>
                          {uploadedFileName && (
                            <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DBC8] text-[11px] text-[#29302D] flex flex-wrap items-center justify-between gap-2">
                              <span className="truncate font-medium">Uploaded: {uploadedFileName}</span>
                              {submittedAt && (
                                <span className="text-[10px] text-[#77786E]">
                                  {new Date(submittedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                </span>
                              )}
                            </div>
                          )}

                          {remark && reqStatus === 'REUPLOAD_REQUIRED' && (
                            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                              <strong>Admin Remark:</strong> {remark}
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {canUpload && !isLocked && (
                      <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-[#8064A9]/50 bg-[#8064A9]/5 hover:bg-[#8064A9]/10 text-[#8064A9] font-bold cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingReq ? 'Uploading Document...' : 'Add Document'}</span>
                        <input
                          type="file"
                          accept={acceptAttr}
                          disabled={isUploadingReq}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) handleUploadAdditionalDoc(reqItem, f);
                          }}
                          className="hidden"
                        />
                      </label>
                    )}

                    {fb && (
                      <div
                        className={`p-2 rounded-lg text-[11px] font-semibold ${
                          fb.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {fb.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}

        {/* Initial Document Upload Section ONLY when user has NOT submitted any KYC documents yet */}
        {kycStatus === 'NOT_SUBMITTED' && documents.length === 0 && (
          <form onSubmit={handleInitialKycSubmit} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#D99B43]/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#29302D] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#C66B52]" />
                <span>Submit KYC Documents</span>
              </h3>
              <span className="text-[10px] text-[#77786E] font-medium">PDF / JPG / PNG / DOCX</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#77786E] mb-1">Document Type</label>
                <select
                  value={resubmitDocType}
                  onChange={(e) => setResubmitDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DBC8] bg-white text-[#29302D] text-xs font-medium"
                >
                  <option value="ID_PROOF">Government Identity Proof (PAN / Aadhaar)</option>
                  <option value="BUSINESS_PROOF">Business Registration / Udyam / GST</option>
                  <option value="ADDRESS_PROOF">Address Proof</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#77786E] mb-1">Document Number (Optional)</label>
                <input
                  type="text"
                  value={resubmitDocNumber}
                  onChange={(e) => setResubmitDocNumber(e.target.value)}
                  placeholder="e.g. PAN / Registration No."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DBC8] bg-white text-[#29302D] text-xs"
                />
              </div>
            </div>

            <label className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#C66B52]/50 bg-white hover:bg-[#FFF9F0] text-[#C66B52] text-xs font-bold cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Attach KYC Document</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                onChange={handleSelectInitialFile}
                className="hidden"
              />
            </label>

            {resubmitFiles.length > 0 && (
              <div className="space-y-2">
                {resubmitFiles.map((item, idx) => (
                  <div
                    key={`${item.file.name}-${idx}`}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#E8DBC8] text-xs"
                  >
                    <span className="font-semibold text-[#29302D] truncate">{item.file.name}</span>
                    <button
                      type="button"
                      onClick={() => setResubmitFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-rose-600 text-[11px] font-bold hover:underline ml-2 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {resubmitError && <p className="text-xs text-rose-600 font-semibold">{resubmitError}</p>}
            {resubmitSuccess && <p className="text-xs text-emerald-700 font-semibold">{resubmitSuccess}</p>}

            <button
              type="submit"
              disabled={submittingResubmit || resubmitFiles.length === 0}
              className="w-full py-2.5 px-4 bg-[#C66B52] hover:bg-[#b55e46] text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingResubmit ? 'Submitting Documents...' : 'Submit KYC Documents'}</span>
            </button>
          </form>
        )}

        {/* Account & Dashboard Activation Rules Checklist (Responsive Non-Overlapping Cards) */}
        {activationChecks && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DBC8] space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-extrabold uppercase tracking-wider text-[10px] text-[#77786E]">
                Dashboard Access Activation Checklist
              </div>
              <span className="text-[10px] text-[#77786E] font-medium">
                All required verification conditions must pass
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-[#E8DBC8] flex flex-col justify-between gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-[#77786E]">Account Status</span>
                <span
                  className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    activationChecks.accountActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {activationChecks.accountActive ? 'Active' : 'Suspended'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#E8DBC8] flex flex-col justify-between gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-[#77786E]">KYC Verification</span>
                <span
                  className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[11px] font-bold border break-all ${
                    activationChecks.kycApproved && !activationChecks.hasPendingAdditionalDocs && !activationChecks.hasPendingDocs
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {activationChecks.hasPendingAdditionalDocs
                    ? 'Additional Docs Required'
                    : activationChecks.kycApproved
                    ? 'Approved'
                    : String(activationChecks.kycStatus || 'Pending').replace(/_/g, ' ')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#E8DBC8] flex flex-col justify-between gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-[#77786E]">Membership Plan</span>
                <span
                  className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    activationChecks.membershipActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {activationChecks.membershipActive ? 'Active' : activationChecks.paymentStatus || 'Pending'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="w-full py-3 px-4 bg-[#8064A9] hover:bg-[#6E529F] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Verification Status...' : 'Refresh Verification Status'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-white border border-[#E8DBC8] hover:bg-[#F5EBDD]/40 text-[#51463F] font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Return to Login</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[#E8DBC8] flex items-center justify-center gap-2 text-[11px] text-[#77786E]">
          <ShieldCheck className="w-4 h-4 text-[#8064A9]" />
          <span>Protected by FIC Real-Time Compliance Gatekeeper</span>
        </div>
      </div>
    </div>
  );
};
