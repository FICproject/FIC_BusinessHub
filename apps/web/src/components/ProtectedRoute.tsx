import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser, getAuthToken, setStoredUser, apiRequest } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<any>(() => getStoredUser());
  const token = getAuthToken();
  const location = useLocation();

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiRequest('/auth/me')
      .then((res) => {
        if (!active || !res?.data) return;
        const latest = { ...(getStoredUser() || {}), ...res.data };
        setStoredUser(latest);
        setUser(latest);
      })
      .catch(() => {
        // Keep current session snapshot if offline
      });
    return () => {
      active = false;
    };
  }, [token, location.pathname]);

  // Require active user profile and valid auth session token
  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict verification guard: No one gets portal access until KYC is verified/approved by Admin
  const normalizedStatus = String(user.kycStatus || '').toUpperCase();
  const isKycApproved = Boolean(
    user.isKycApproved === true &&
      normalizedStatus !== 'REJECTED' &&
      normalizedStatus !== 'RESUBMISSION_REQUESTED' &&
      normalizedStatus !== 'RESUBMIT_REQUIRED'
  );

  if (!isKycApproved) {
    return <Navigate to="/kyc-pending" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
