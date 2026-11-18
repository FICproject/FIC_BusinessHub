import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D2520] font-sans selection:bg-[#4F46E5] selection:text-white">
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
