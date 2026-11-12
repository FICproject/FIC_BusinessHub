import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser, getAuthToken, setStoredUser, removeAuthToken, apiRequest } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<any>(() => getStoredUser());
  const token = getAuthToken();
  const location = useLocation();
  const [verifying, setVerifying] = useState<boolean>(() => Boolean(token));
  const [authInvalid, setAuthInvalid] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      return;
    }
    let active = true;
    apiRequest('/auth/me')
      .then((res) => {
        if (!active) return;
        if (res?.data) {
          const latest = { ...(getStoredUser() || {}), ...res.data };
          setStoredUser(latest);
          setUser(latest);
          setAuthInvalid(false);
        }
      })
      .catch((err: any) => {
        if (!active) return;
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('unauthorized') || msg.includes('invalid') || msg.includes('suspended') || msg.includes('deactivated')) {
          removeAuthToken();
          setUser(null);
          setAuthInvalid(true);
        }
      })
      .finally(() => {
        if (active) setVerifying(false);
      });
    return () => {
      active = false;
    };
  }, [token, location.pathname]);

  if (!user || !token || authInvalid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wait briefly on initial route verification before deciding access so fresh Admin revocations/suspensions block immediately
  if (verifying && user.canAccessDashboard === undefined) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E8DBC8] rounded-2xl px-6 py-4 text-xs font-semibold text-[#51463F] shadow-sm">
          Verifying account & KYC eligibility...
        </div>
      </div>
    );
  }

  const normalizedStatus = String(user.kycStatus || '').toUpperCase();
  const isSuspended =
    String(user.status || 'ACTIVE').toUpperCase() === 'SUSPENDED' ||
    String(user.status || '').toUpperCase() === 'DEACTIVATED';
  const isKycApproved = Boolean(
    user.isKycApproved === true &&
      normalizedStatus !== 'REJECTED' &&
      normalizedStatus !== 'RESUBMISSION_REQUESTED' &&
      normalizedStatus !== 'RESUBMIT_REQUIRED'
  );
  const isMembershipActive = user.isMembershipActive !== false;
  const canAccessDashboard =
    !isSuspended &&
    isKycApproved &&
    isMembershipActive &&
    (user.canAccessDashboard === undefined ? true : Boolean(user.canAccessDashboard));

  if (!canAccessDashboard) {
    return <Navigate to="/kyc-pending" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
