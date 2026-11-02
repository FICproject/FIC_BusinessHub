import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getStoredUser } from '../services/api';

export const PublicLayout: React.FC = () => {
  const user = getStoredUser();
  const location = useLocation();

  // AUTHENTICATED USER NAVIGATION POLICY:
  // When an authenticated member visits the public marketing landing page (/),
  // immediately redirect them to their Member Dashboard.
  // Permitted informational/legal pages (/about, /membership, /contact, /privacy-policy, /terms-and-conditions)
  // are allowed and render with a clear route back to the Member Dashboard in the header.
  if (user && location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF6] text-[#29302D] font-sans selection:bg-[#C66B52] selection:text-white">
      {/* Public Header */}
      <Navbar />
      
      {/* Public Page Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Complete Public Footer - strictly contained inside PublicLayout */}
      <Footer />
    </div>
  );
};

export default PublicLayout;

