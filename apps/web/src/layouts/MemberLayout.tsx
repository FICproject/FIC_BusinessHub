import React from 'react';
import { Outlet } from 'react-router-dom';
import { MemberHeader } from '../components/MemberHeader';
import { MemberFooter } from '../components/MemberFooter';

interface MemberLayoutProps {
  children?: React.ReactNode;
}

export const MemberLayout: React.FC<MemberLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <MemberHeader />
      <main className="flex-1 w-full">
        {children || <Outlet />}
      </main>
      {/* Compact, clean member footer only - NEVER full public marketing footer */}
      <MemberFooter />
    </div>
  );
};

export default MemberLayout;
