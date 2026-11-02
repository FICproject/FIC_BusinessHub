import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, removeAuthToken } from '../services/api';
import { MemberHeader } from './MemberHeader';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on any authenticated member page, delegate strictly to the shared global MemberHeader
  const memberRoutes = [
    '/dashboard',
    '/marketplace',
    '/business-ideas',
    '/business-development',
    '/investment',
    '/partnerships',
    '/my-requests'
  ];
  const isMemberRoute = memberRoutes.some(
    (route) => location.pathname === route || location.pathname.startsWith(route + '/')
  );

  if (isMemberRoute && user) {
    return <MemberHeader />;
  }

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full h-[72px] min-h-[72px] max-h-[72px] bg-[#F5EBDD]/95 backdrop-blur-md border-b border-[#E8DBC8] text-[#29302D] shadow-xs select-none">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Brand Logo - Charcoal & Amber Gold / Violet Accent */}
        <Link
          to={user ? "/dashboard" : "/"}
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

        {/* Public Landing Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-[13.5px] font-semibold text-[#29302D]">
          <a href="/#about" className="hover:text-[#C66B52] transition-colors">
            About FIC
          </a>
          <a href="/#who-can-join" className="hover:text-[#8064A9] transition-colors">
            Who Can Join
          </a>
          <a href="/#capabilities" className="hover:text-[#D99B43] transition-colors">
            What You Can Do
          </a>
          <a href="/#how-it-works" className="hover:text-[#C66B52] transition-colors">
            How It Works
          </a>
          <a href="/#ecosystem" className="hover:text-[#8064A9] transition-colors">
            Ecosystem
          </a>
          <a href="/#membership" className="hover:text-[#D99B43] transition-colors flex items-center gap-1.5">
            <span>Membership</span>
            <span className="text-[11px] font-black bg-[#D99B43]/20 text-[#B87A28] px-2 py-0.5 rounded-full border border-[#D99B43]/30">
              ₹99
            </span>
          </a>
          <a href="/#why-fic" className="hover:text-[#C66B52] transition-colors">
            Why FIC
          </a>
        </nav>

        {/* Public Visitor Action Buttons */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {user ? (
            <Link to="/dashboard">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#29302D] text-[#FCFAF6] hover:bg-[#8064A9] transition-colors shadow-xs"
              >
                Go to Dashboard
              </button>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-[13px] font-bold text-[#29302D] border border-[#29302D]/30 hover:bg-[#FFF9F0] hover:border-[#29302D] transition-colors"
                >
                  Sign In
                </button>
              </Link>
              <Link to="/get-started">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#C66B52] hover:bg-[#D99B43] text-white shadow-md shadow-[#C66B52]/20 transition-all hover:scale-105"
                >
                  Become a Member
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden flex items-center gap-2">
          {user && (
            <Link to="/dashboard" onClick={closeMenu}>
              <span className="text-xs font-bold bg-[#29302D] text-[#FCFAF6] px-2.5 py-1 rounded-md sm:hidden">
                Dashboard
              </span>
            </Link>
          )}

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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E8DBC8] bg-[#F5EBDD] px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-[#29302D]">
            <a href="/#about" onClick={closeMenu} className="px-3 py-2 rounded-lg hover:bg-[#FFF9F0]">
              About FIC
            </a>
            <a href="/#who-can-join" onClick={closeMenu} className="px-3 py-2 rounded-lg hover:bg-[#FFF9F0]">
              Who Can Join
            </a>
            <a href="/#capabilities" onClick={closeMenu} className="px-3 py-2 rounded-lg hover:bg-[#FFF9F0]">
              What You Can Do
            </a>
            <a href="/#how-it-works" onClick={closeMenu} className="px-3 py-2 rounded-lg hover:bg-[#FFF9F0]">
              How It Works
            </a>
            <a href="/#ecosystem" onClick={closeMenu} className="px-3 py-2 rounded-lg hover:bg-[#FFF9F0]">
              Ecosystem
            </a>
            <a
              href="/#membership"
              onClick={closeMenu}
              className="px-3 py-2 rounded-lg hover:bg-[#FFF9F0] flex items-center justify-between"
            >
              <span>Membership</span>
              <span className="text-[11px] font-black bg-[#D99B43]/20 text-[#B87A28] px-2 py-0.5 rounded-full border border-[#D99B43]/30">
                ₹99
              </span>
            </a>
            <a href="/#why-fic" onClick={closeMenu} className="px-3 py-2 rounded-lg hover:bg-[#FFF9F0]">
              Why FIC
            </a>
          </nav>

          <div className="pt-3 border-t border-[#E8DBC8] flex flex-col gap-2">
            {user ? (
              <Link to="/dashboard" onClick={closeMenu}>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#29302D] text-[#FCFAF6] hover:bg-[#8064A9] transition-colors"
                >
                  Go to Member Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-[#29302D] border border-[#29302D]/30 hover:bg-[#FFF9F0] transition-colors"
                  >
                    Sign In
                  </button>
                </Link>
                <Link to="/get-started" onClick={closeMenu}>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#C66B52] text-white shadow-md shadow-[#C66B52]/20 transition-colors"
                  >
                    Become a Member (₹99)
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
