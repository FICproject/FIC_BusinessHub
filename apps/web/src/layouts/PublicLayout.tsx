import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#51463F] font-sans selection:bg-[#6D28D9] selection:text-white">
      {/* Public Header */}
      <Navbar />
      
      {/* Public Page Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Complete Public Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;
