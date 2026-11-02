import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const user = getStoredUser();
  const location = useLocation();

  if (!user) {
    // Redirect to login page, preserving the attempted destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
