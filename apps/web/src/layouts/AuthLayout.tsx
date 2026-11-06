import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { getStoredUser } from '../services/api';

export const AuthLayout: React.FC = () => {
  const user = getStoredUser();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div
      className={`font-sans selection:bg-[#C66B52] selection:text-white relative ${
        isLoginPage
          ? 'h-screen max-h-screen flex flex-col overflow-hidden bg-[#FAF4EB] bg-cover bg-center bg-no-repeat'
          : 'min-h-screen flex flex-col bg-[#F5EBDD] text-[#29302D]'
      }`}
      style={isLoginPage ? { backgroundImage: "url('/auth-bg.jpg')" } : undefined}
    >
      {/* Clean Auth Header */}
      <header className="shrink-0 w-full h-[64px] min-h-[64px] max-h-[64px] bg-white/40 backdrop-blur-md border-b border-[#E8DBC8]/50 select-none z-20 sticky top-0">
        <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link
            to={user ? "/dashboard" : "/"}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1C1824] border border-white/30 flex items-center justify-center text-[#FCFAF6] font-black text-sm shadow-xs group-hover:bg-[#8064A9] transition-colors shrink-0">
              FIC
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[18px] font-black leading-tight tracking-tight text-[#1E1728] group-hover:text-[#C66B52] transition-colors">
                FIC Business Hub
              </span>
              <span className="text-[10px] font-extrabold text-[#C66B52] tracking-wider uppercase leading-none mt-0.5">
                Secure Authentication Gateway
              </span>
            </div>
          </Link>

          <Link
            to={user ? "/dashboard" : "/"}
            className="text-xs font-bold text-[#1E1728] hover:text-[#C66B52] px-4 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#E8DBC8] shadow-xs transition-all"
          >
            {user ? "← Back to Dashboard" : "← Back to Home"}
          </Link>
        </div>
      </header>

      {/* Auth Content */}
      <main
        className={`flex-1 w-full ${
          isLoginPage
            ? 'flex flex-col items-center justify-center overflow-hidden z-10 px-4'
            : 'flex flex-col items-center z-10'
        }`}
      >
        <Outlet />
      </main>

      {/* Minimal Footer */}
      <footer className="shrink-0 w-full py-3 text-center text-xs select-none z-10 mt-auto border-t border-[#E8DBC8]/40 bg-white/20">
        <div className="max-w-[1320px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] font-medium text-[#4A4252]">
          <span>&copy; {new Date().getFullYear()} FIC Business Hub. Enterprise Identity & KYC Security.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-[#1E1728] transition-colors font-semibold">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-[#1E1728] transition-colors font-semibold">
              Terms & Conditions
            </Link>
            <a href="mailto:support@ficapp.in" className="hover:text-[#1E1728] transition-colors font-semibold">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;

