import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, removeAuthToken } from '../services/api';

export const MemberHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    removeAuthToken();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  // Exact 7 member portal navigation routes
  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Business Ideas', path: '/business-ideas' },
    { label: 'Scaling', path: '/business-development' },
    { label: 'Investment', path: '/investment' },
    { label: 'Partnerships', path: '/partnerships' },
    { label: 'My Requests', path: '/my-requests' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full h-[72px] min-h-[72px] max-h-[72px] bg-[#F5EBDD]/95 backdrop-blur-md border-b border-[#E8DBC8] text-[#29302D] shadow-xs select-none">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        {/* ========================================================
            LEFT: LOGO + TITLE (20px) + SUBTITLE (11px)
           ======================================================== */}
        <Link
          to="/dashboard"
          className="flex items-center gap-3 shrink-0 group focus:outline-none"
          onClick={closeMenu}
        >
          <div className="w-10 h-10 rounded-xl bg-[#29302D] border border-[#D99B43]/40 flex items-center justify-center text-[#FCFAF6] font-black text-base shadow-xs group-hover:bg-[#8064A9] transition-colors shrink-0">
            FIC
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[20px] font-black leading-tight tracking-tight text-[#29302D] group-hover:text-[#C66B52] transition-colors">
              FIC Business Hub
            </span>
            <span className="text-[11px] font-bold text-[#C66B52] tracking-wider uppercase leading-none mt-0.5">
              Opportunity Ecosystem
            </span>
          </div>
        </Link>

        {/* ========================================================
            CENTER: 7 NAVIGATION LINKS (13.5px, single row, no wrap)
           ======================================================== */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 whitespace-nowrap">
          {navLinks.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 xl:px-3.5 py-1.5 rounded-lg text-[13.5px] transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#29302D] text-[#FCFAF6] font-bold shadow-xs'
                    : 'text-[#29302D]/80 hover:text-[#29302D] hover:bg-[#FFF9F0] font-medium'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ========================================================
            RIGHT: MEMBER NAME (13px) + BADGE (12px) + LOGOUT (13px)
           ======================================================== */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-[#FFF9F0] px-3 py-1.5 rounded-xl border border-[#E8DBC8] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#D99B43] animate-pulse shrink-0"></span>
            <span className="font-bold text-[13px] text-[#29302D] truncate max-w-[130px] xl:max-w-[160px]">
              {user?.fullName || user?.categoryName || 'Member'}
            </span>
            <span className="text-[12px] text-[#B87A28] font-black bg-[#D99B43]/20 border border-[#D99B43]/40 px-2 py-0.5 rounded-md shrink-0">
              ₹99 Pass
            </span>
          </div>

          <button
            onClick={handleLogout}
            type="button"
            className="text-[13px] text-[#77786E] hover:text-[#C66B52] font-semibold px-3 py-1.5 rounded-lg border border-[#E8DBC8] hover:border-[#C66B52]/40 transition-colors shrink-0"
            title="Sign out of FIC Business Hub"
          >
            Logout
          </button>
        </div>

        {/* ========================================================
            MOBILE / TABLET HAMBURGER BUTTON
           ======================================================== */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#29302D] hover:text-[#C66B52] rounded-lg border border-[#E8DBC8] transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

      </div>

      {/* ========================================================
          MOBILE MENU COLLAPSIBLE DRAWER
         ======================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E8DBC8] bg-[#F5EBDD] px-4 pt-3 pb-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E8DBC8]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D99B43] animate-pulse"></span>
              <span className="text-[13px] font-bold text-[#29302D]">
                {user?.fullName || user?.categoryName || 'Member'}
              </span>
            </div>
            <span className="text-[12px] font-bold bg-[#D99B43]/20 text-[#B87A28] border border-[#D99B43]/40 px-2.5 py-0.5 rounded-md">
              ₹99 Pass
            </span>
          </div>

          <div className="space-y-1">
            {navLinks.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={`block px-3 py-2 rounded-lg text-[13.5px] transition-colors ${
                    isActive
                      ? 'bg-[#29302D] text-[#FCFAF6] font-bold'
                      : 'text-[#29302D] hover:bg-[#FFF9F0] font-medium'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#E8DBC8]">
            <button
              onClick={handleLogout}
              className="w-full py-2 text-center text-[13px] font-bold text-[#C66B52] bg-[#FFF9F0] rounded-lg border border-[#E8DBC8] hover:bg-[#C66B52] hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default MemberHeader;

