import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../services/api';

export const MemberHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    removeAuthToken();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  // Exact 10 member portal navigation routes with Meetings, My Services and Profile
  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Business Ideas', path: '/business-ideas' },
    { label: 'Scaling', path: '/business-development' },
    { label: 'Investment', path: '/investment' },
    { label: 'Partnerships', path: '/partnerships' },
    { label: 'Meetings', path: '/meetings' },
    { label: 'My Requests', path: '/my-requests' },
    { label: 'My Services', path: '/my-services' },
    { label: 'Profile', path: '/profile' }
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
            CENTER: 10 NAVIGATION LINKS (single row, no wrap)
            Dashboard | Marketplace | Ideas | Scaling | Investment | Partnerships | Meetings | My Requests | My Services | Profile
           ======================================================== */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 whitespace-nowrap">
          {navLinks.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-1.5 xl:px-2.5 py-1.5 rounded-lg text-[12.5px] xl:text-[13px] transition-colors duration-150 ${
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
            RIGHT: ONLY LOGOUT BUTTON (Name & ₹99 Pass removed)
           ======================================================== */}
        <div className="hidden lg:flex items-center shrink-0">
          <button
            onClick={handleLogout}
            type="button"
            className="text-[13px] text-[#77786E] hover:text-[#C66B52] font-semibold px-3.5 py-1.5 rounded-lg border border-[#E8DBC8] hover:border-[#C66B52]/40 transition-colors shrink-0"
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
