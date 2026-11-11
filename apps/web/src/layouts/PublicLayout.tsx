import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getStoredUser } from '../services/api';

export const PublicLayout: React.FC = () => {
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

