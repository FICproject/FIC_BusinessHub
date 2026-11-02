import React from 'react';
import { Outlet } from 'react-router-dom';
import { MemberHeader } from './MemberHeader';
import { Footer } from './Footer';

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
      <Footer />
    </div>
  );
};

export default MemberLayout;
