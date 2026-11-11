import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building
} from 'lucide-react';
import { getStoredUser, removeAuthToken, apiRequest, setStoredUser } from '../services/api';

export const KycPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(() => getStoredUser());
  const [checking, setChecking] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  const checkStatus = async () => {
    setChecking(true);
    try {
      // 1. Try real backend authenticated status check (/auth/me or /users/me)
      let updatedUser: any = null;
      try {
        const res = await apiRequest('/auth/me');
        if (res?.data) updatedUser = res.data;
      } catch {
        try {
          const res2 = await apiRequest('/users/me');
          if (res2?.data) updatedUser = res2.data;
        } catch {
          // Ignore network error and fall through
        }
      }

      // 2. Also check public status sync via email in case session token is mock
      if (!updatedUser && user?.email) {
        try {
          const checkRes = await apiRequest(`/auth/check-status?email=${encodeURIComponent(user.email)}`);
          if (checkRes?.data) updatedUser = checkRes.data;
        } catch {
          // Ignore
        }
      }

      if (updatedUser) {
        const merged = { ...user, ...updatedUser };
        setUser(merged);
        setStoredUser(merged);

        // If approved by admin, grant portal access immediately!
        if (merged.isKycApproved === true || (merged.status === 'ACTIVE' && (merged.kycStatus === 'APPROVED' || merged.kycStatus === 'VERIFIED'))) {
          navigate('/dashboard', { replace: true });
          return;
        }

        if (merged.kycStatus === 'REJECTED' || merged.status === 'REJECTED') {
          setRejectionReason(merged.rejectionReason || 'Application was rejected by verification compliance.');
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
    // Auto poll every 10 seconds to detect admin approval seamlessly
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login', { replace: true });
  };

  const isRejected = user?.kycStatus === 'REJECTED' || !!rejectionReason;

  return (
    <div className="min-h-screen bg-[#F5EBDD]/50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-[#E8DBC8] shadow-xl p-8 sm:p-10 space-y-8 relative overflow-hidden">
        {/* Top Decorative Amber Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"></div>

        {/* Header Icon & Brand */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            {isRejected ? (
              <ShieldAlert className="w-8 h-8 text-rose-600" />
            ) : (
              <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-[#29302D] tracking-tight">
            {isRejected ? 'KYC Verification Needs Attention' : 'Portal Access Awaiting Admin Approval'}
          </h2>
          <p className="text-xs text-[#77786E] max-w-md mx-auto leading-relaxed">
            {isRejected
              ? 'Your KYC documents were reviewed by FIC Administration and require corrections or resubmission before portal privileges can be activated.'
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
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                isRejected
                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isRejected ? 'RESUBMIT / REJECTED' : 'UNDER ADMIN REVIEW (PENDING)'}
            </span>
          </div>
        </div>

        {/* Rejection / Note feedback if any */}
        {isRejected && rejectionReason && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <span className="font-bold block uppercase tracking-wider text-[10px]">Reviewer Note:</span>
            <p>{rejectionReason}</p>
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
        <div className="space-y-3 pt-2">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="w-full py-3 px-4 bg-[#C66B52] hover:bg-[#b05d45] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status with Server...' : 'Check Approval Status'}</span>
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
