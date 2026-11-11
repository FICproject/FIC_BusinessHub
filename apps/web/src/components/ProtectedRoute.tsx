import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser, getAuthToken } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const user = getStoredUser();
  const token = getAuthToken();
  const location = useLocation();

  // Require active user profile and valid auth session token
  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict verification guard: No one gets portal access until KYC is verified/approved by Admin
  const isKycApproved = Boolean(
    user.isKycApproved === true ||
    ((user as any).status === 'ACTIVE' && (user.kycStatus as string) === 'APPROVED')
  );

  if (!isKycApproved) {
    return <Navigate to="/kyc-pending" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};


