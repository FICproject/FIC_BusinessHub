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
  Send
} from 'lucide-react';
import {
  getStoredUser,
  removeAuthToken,
  apiRequest,
  setStoredUser,
  uploadDocumentFile,
  submitKycApplicationStrict,
  validateClientFileBeforeUpload
} from '../services/api';

type NormalizedKycState =
  | 'SUBMITTED'
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
  if (upper === 'NOT_SUBMITTED') return 'NOT_SUBMITTED';
  return 'SUBMITTED';
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
  const [existingDocs, setExistingDocs] = useState<any[]>([]);

  // Resubmission form states
  const [resubmitDocType, setResubmitDocType] = useState<string>('RESUBMITTED_PROOF');
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
        // Fallback to check-status below
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

        if (Array.isArray(liveKycData?.documentAssets)) {
          setExistingDocs(liveKycData.documentAssets);
        }

        if (resolvedState === 'APPROVED') {
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

  const handleSelectResubmitFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResubmitError('');
    setResubmitSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateClientFileBeforeUpload(file);
    } catch (valErr: any) {
      setResubmitError(valErr?.message || 'Invalid file selected.');
      return;
    }
    setResubmitFiles((prev) => [
      ...prev,
      {
        file,
        label: resubmitDocType === 'ID_PROOF' ? 'Identity Proof (Corrected)' : resubmitDocType === 'BUSINESS_PROOF' ? 'Business Registration Proof (Corrected)' : 'Corrected KYC Document',
        type: resubmitDocType,
        number: resubmitDocNumber.trim()
      }
    ]);
    setResubmitDocNumber('');
    e.target.value = '';
  };

  const handleRemoveQueuedFile = (index: number) => {
    setResubmitFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResubmitError('');
    setResubmitSuccess('');
    if (resubmitFiles.length === 0) {
      setResubmitError('Please attach at least one corrected KYC document to resubmit.');
      return;
    }

    setSubmittingResubmit(true);
    try {
      const uploadedItems: any[] = [];
      for (const item of resubmitFiles) {
        const asset = await uploadDocumentFile(item.file, {
          entityType: 'KYC',
          documentCategory: 'KYC_RESUBMISSION',
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
      setResubmitSuccess('Corrected KYC documents submitted successfully. Your application is back in queue for review.');
      await checkStatus();
    } catch (err: any) {
      setResubmitError(err?.message || 'Unable to resubmit KYC documents. Please try again.');
    } finally {
      setSubmittingResubmit(false);
    }
  };

  const isResubmitRequested = kycStatus === 'RESUBMISSION_REQUESTED';
  const isRejected = kycStatus === 'REJECTED';

  const topBarClass = isRejected
    ? 'from-rose-500 via-red-500 to-rose-600'
    : isResubmitRequested
    ? 'from-orange-500 via-amber-500 to-orange-600'
    : 'from-amber-500 via-orange-500 to-amber-600';

  const statusBadgeText = isRejected
    ? 'REJECTED'
    : isResubmitRequested
    ? 'RESUBMISSION REQUESTED'
    : kycStatus === 'NOT_SUBMITTED'
    ? 'KYC SUBMISSION REQUIRED'
    : 'UNDER ADMIN REVIEW (SUBMITTED)';

  const statusBadgeClass = isRejected
    ? 'bg-rose-100 text-rose-700 border border-rose-300'
    : isResubmitRequested
    ? 'bg-orange-100 text-orange-800 border border-orange-300'
    : 'bg-amber-100 text-amber-800 border border-amber-300';

  return (
    <div className="min-h-screen bg-[#F5EBDD]/50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-[#E8DBC8] shadow-xl p-8 sm:p-10 space-y-6 relative overflow-hidden">
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
              ? 'KYC Resubmission Requested'
              : 'Portal Access Awaiting Admin Approval'}
          </h2>
          <p className="text-xs text-[#77786E] max-w-md mx-auto leading-relaxed">
            {isRejected
              ? 'Your KYC verification application was reviewed and permanently declined by FIC Compliance Administration. Please review the reason below.'
              : isResubmitRequested
              ? 'FIC Compliance Administration has requested updated or corrected KYC documents. Please upload the requested corrections below to resume verification.'
              : 'Your registration and documents have been securely routed to the Admin KYC Verification Desk. Full ecosystem access is granted once an authorized administrator inspects and approves your proofs.'}
          </p>
        </div>

        {/* Applicant Overview Card */}
        <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8DBC8] space-y-3 text-xs">
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

        {/* Explicit Admin Decision Feedback Box (Resubmission or Rejection) */}
        {(isRejected || isResubmitRequested) && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              isRejected
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-orange-50 border-orange-200 text-orange-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase tracking-wider text-[10px]">
                {isRejected ? 'Official Rejection Reason' : 'Resubmission Instructions from Admin'}
              </span>
              {reviewedAt && (
                <span className="text-[10px] opacity-75">
                  Updated {new Date(reviewedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </span>
              )}
            </div>
            <p className="font-medium leading-relaxed">
              {rejectionReason ||
                (isRejected
                  ? 'Application did not meet verification requirements. Please contact FIC Compliance Support for details.'
                  : 'Please upload clear, readable copies of your identity and business documents.')}
            </p>
            {reviewerNotes && (
              <p className="text-[11px] opacity-85 pt-1 border-t border-black/10">
                Reviewer Note: {reviewerNotes}
              </p>
            )}
          </div>
        )}

        {resubmitSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{resubmitSuccess}</span>
          </div>
        )}

        {/* Interactive Document Resubmission Section when Admin clicked Request Resubmit */}
        {(isResubmitRequested || kycStatus === 'NOT_SUBMITTED') && (
          <form onSubmit={handleResubmitSubmit} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#D99B43]/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#29302D] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#C66B52]" />
                <span>{isResubmitRequested ? 'Upload Corrected KYC Documents' : 'Submit KYC Documents'}</span>
              </h3>
              <span className="text-[10px] text-[#77786E] font-medium">PDF / JPG / PNG</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#77786E] mb-1">Document Type</label>
                <select
                  value={resubmitDocType}
                  onChange={(e) => setResubmitDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DBC8] bg-white text-[#29302D] text-xs font-medium"
                >
                  <option value="RESUBMITTED_PROOF">Corrected Compliance Proof</option>
                  <option value="ID_PROOF">Government Identity Proof (PAN / Aadhaar)</option>
                  <option value="BUSINESS_PROOF">Business Registration / Udyam / GST</option>
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

            <div>
              <label className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#C66B52]/50 bg-white hover:bg-[#FFF9F0] text-[#C66B52] text-xs font-bold cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Choose File to Attach</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleSelectResubmitFile}
                  className="hidden"
                />
              </label>
            </div>

            {resubmitFiles.length > 0 && (
              <div className="space-y-2">
                {resubmitFiles.map((item, idx) => (
                  <div
                    key={`${item.file.name}-${idx}`}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#E8DBC8] text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-[#C66B52] shrink-0" />
                      <span className="font-semibold text-[#29302D] truncate">{item.file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveQueuedFile(idx)}
                      className="text-rose-600 text-[11px] font-bold hover:underline ml-2 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {resubmitError && (
              <p className="text-xs text-rose-600 font-semibold">{resubmitError}</p>
            )}

            <button
              type="submit"
              disabled={submittingResubmit || resubmitFiles.length === 0}
              className="w-full py-2.5 px-4 bg-[#29302D] hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingResubmit ? 'Uploading & Resubmitting...' : 'Submit Corrected Documents'}</span>
            </button>
          </form>
        )}

        {existingDocs.length > 0 && !isResubmitRequested && (
          <div className="text-[11px] text-[#77786E] flex items-center justify-between px-1">
            <span>Submitted documents on file:</span>
            <span className="font-bold text-[#29302D]">{existingDocs.length} document(s)</span>
          </div>
        )}

        {/* Notice of strictly guarded access */}
        <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#D99B43]/30 text-xs text-[#77786E] space-y-2">
          <div className="flex items-center space-x-2 font-bold text-[#29302D]">
            <ShieldCheck className="w-4 h-4 text-[#D99B43]" />
            <span>Strict Verification Guarantee</span>
          </div>
          <p className="leading-relaxed">
            FIC Business Hub enforces verified peer safety. No member is permitted access to commercial opportunities, trade requests, or financial operations until the internal operations team commits an approved KYC decision.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="w-full py-3 px-4 bg-[#C66B52] hover:bg-[#b05d45] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status with Server...' : 'Refresh Latest KYC Status'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-[#E8DBC8] text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out / Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
