import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { getStoredUser } from '../services/api';

export const AuthLayout: React.FC = () => {
  const user = getStoredUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EBDD] text-[#29302D] font-sans selection:bg-[#C66B52] selection:text-white">
      {/* Clean Auth Header */}
      <header className="sticky top-0 z-50 w-full h-[72px] min-h-[72px] max-h-[72px] bg-[#F5EBDD]/95 backdrop-blur-md border-b border-[#E8DBC8] select-none">
        <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link
            to={user ? "/dashboard" : "/"}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#29302D] border border-[#D99B43]/40 flex items-center justify-center text-[#FCFAF6] font-black text-base shadow-xs group-hover:bg-[#8064A9] transition-colors shrink-0">
              FIC
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[20px] font-black leading-tight tracking-tight text-[#29302D] group-hover:text-[#C66B52] transition-colors">
                FIC Business Hub
              </span>
              <span className="text-[11px] font-bold text-[#C66B52] tracking-wider uppercase leading-none mt-0.5">
                Secure Authentication Gateway
              </span>
            </div>
          </Link>

          <Link
            to={user ? "/dashboard" : "/"}
            className="text-xs font-bold text-[#77786E] hover:text-[#C66B52] px-3.5 py-1.5 rounded-lg border border-[#E8DBC8] hover:border-[#C66B52]/40 transition-colors"
          >
            {user ? "← Back to Dashboard" : "← Back to Home"}
          </Link>
        </div>
      </header>

      {/* Auth Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#77786E] border-t border-[#E8DBC8]/70 bg-[#F5EBDD]/50 select-none">
        <div className="max-w-[1320px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} FIC Business Hub. Enterprise Identity & KYC Security.</span>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/privacy-policy" className="hover:text-[#C66B52] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-[#C66B52] transition-colors">
              Terms & Conditions
            </Link>
            <a href="mailto:support@ficapp.in" className="hover:text-[#C66B52] transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;

