import React from 'react';
import { Outlet } from 'react-router-dom';
import { MemberHeader } from '../components/MemberHeader';
import { MemberFooter } from '../components/MemberFooter';

interface MemberLayoutProps {
  children?: React.ReactNode;
}

export const MemberLayout: React.FC<MemberLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#29302D] font-sans relative overflow-x-hidden selection:bg-[#E58C72]/20 selection:text-[#C66B52]">
      {/* ========================================================
          AMBIENT MULTICOLOUR BACKGROUND MESH GLOWS
          Subtle luxury glows that give the authenticated portal depth
         ======================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Left Coral/Amber Glow */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#E58C72]/12 via-[#D99B43]/8 to-transparent blur-3xl" />
        
        {/* Top-Right Royal Violet/Lavender Glow */}
        <div className="absolute top-10 -right-32 w-[560px] h-[560px] rounded-full bg-gradient-to-bl from-[#8064A9]/10 via-[#D78E9A]/8 to-transparent blur-3xl" />
        
        {/* Mid-Page Amber Glow */}
        <div className="absolute top-[35%] -left-48 w-[480px] h-[480px] rounded-full bg-gradient-to-r from-[#D99B43]/7 to-transparent blur-3xl" />
        
        {/* Bottom Coral/Rose Glow */}
        <div className="absolute -bottom-48 right-10 w-[640px] h-[640px] rounded-full bg-gradient-to-tl from-[#E58C72]/8 via-[#D78E9A]/6 to-transparent blur-3xl" />
      </div>

      {/* Global Member Header */}
      <div className="relative z-50">
        <MemberHeader />
      </div>

      {/* Protected Workspace Page Content */}
      <main className="flex-1 w-full relative z-10">
        {children || <Outlet />}
      </main>

      {/* Clean Member Workspace Footer */}
      <div className="relative z-20">
        <MemberFooter />
      </div>
    </div>
  );
};

export default MemberLayout;
