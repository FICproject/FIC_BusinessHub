import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#1E2421] text-[#FCFAF6] font-sans selection:bg-[#D99B43] selection:text-[#1E2421]">
      {/* Admin Executive Header */}
      <header className="sticky top-0 z-50 w-full h-[64px] bg-[#29302D] border-b border-[#D99B43]/20 shadow-md">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#D99B43] text-[#29302D] font-black flex items-center justify-center text-sm shadow-xs">
              FIC
            </div>
            <div>
              <span className="text-base font-black text-[#FCFAF6] tracking-tight block leading-tight">
                FIC Executive Operations
              </span>
              <span className="text-[10px] text-[#D99B43] font-bold uppercase tracking-widest block">
                Internal Governance & Verification
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#D99B43]/15 text-[#D99B43] border border-[#D99B43]/30">
              Super Admin Console
            </span>
            <Link
              to="/dashboard"
              className="text-xs text-[#FCFAF6]/70 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 transition-colors"
            >
              Member Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Admin Footer */}
      <footer className="w-full py-3 px-6 text-center text-xs text-[#FCFAF6]/40 border-t border-white/10 bg-[#29302D]/60">
        FIC Executive Governance Console &bull; Confidential Administrative Session
      </footer>
    </div>
  );
};

export default AdminLayout;
