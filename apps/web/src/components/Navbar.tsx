import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, removeAuthToken } from '../services/api';
import { Button } from '@fic/ui';

export const Navbar: React.FC = () => {
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

  return (
    <header className="sticky top-0 z-50 bg-[#F5EBDD]/95 backdrop-blur-md border-b border-[#E8DBC8] text-[#29302D] transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo - Charcoal & Amber Gold / Violet Accent */}
        <Link
          to={user ? "/dashboard" : "/"}
          className="flex items-center gap-3 group select-none"
          onClick={closeMenu}
        >
          <div className="w-10 h-10 rounded-xl bg-[#29302D] border border-[#D99B43]/40 flex items-center justify-center text-[#FCFAF6] font-black text-base shadow-md group-hover:bg-[#8064A9] transition-colors">
            FIC
          </div>
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight text-[#29302D] block leading-tight">
              FIC Business Hub
            </span>
            <span className="text-[10px] text-[#C66B52] font-bold tracking-wider block uppercase">
              Opportunity Ecosystem
            </span>
          </div>
        </Link>

        {/* ========================================================
            NAVIGATION TABS (SEPARATED FOR PUBLIC VISITOR VS MEMBER)
           ======================================================== */}
        {user ? (
          /* ========================================================
             1. AUTHENTICATED MEMBER PORTAL NAVIGATION TABS
             ======================================================== */
          <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-[#29302D]">
            <Link
              to="/dashboard"
              className={`hover:text-[#C66B52] transition-colors py-1.5 px-3 rounded-lg ${
                location.pathname === '/dashboard'
                  ? 'bg-[#29302D] text-[#FCFAF6]'
                  : 'hover:bg-[#FFF9F0]'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/marketplace"
              className={`hover:text-[#C66B52] transition-colors py-1.5 px-3 rounded-lg ${
                location.pathname === '/marketplace'
                  ? 'bg-[#29302D] text-[#FCFAF6]'
                  : 'hover:bg-[#FFF9F0]'
              }`}
            >
              Marketplace
            </Link>
            <Link
              to="/business-ideas"
              className={`hover:text-[#C66B52] transition-colors py-1.5 px-3 rounded-lg ${
                location.pathname === '/business-ideas'
                  ? 'bg-[#29302D] text-[#FCFAF6]'
                  : 'hover:bg-[#FFF9F0]'
              }`}
            >
              Business Ideas
            </Link>
            <Link
              to="/business-development"
              className={`hover:text-[#C66B52] transition-colors py-1.5 px-3 rounded-lg ${
                location.pathname === '/business-development'
                  ? 'bg-[#29302D] text-[#FCFAF6]'
                  : 'hover:bg-[#FFF9F0]'
              }`}
            >
              Scaling
            </Link>
            <Link
              to="/investment"
              className={`hover:text-[#C66B52] transition-colors py-1.5 px-3 rounded-lg ${
                location.pathname === '/investment'
                  ? 'bg-[#29302D] text-[#FCFAF6]'
                  : 'hover:bg-[#FFF9F0]'
              }`}
            >
              Investment
            </Link>
            <Link
              to="/partnerships"
              className={`hover:text-[#C66B52] transition-colors py-1.5 px-3 rounded-lg ${
                location.pathname === '/partnerships'
                  ? 'bg-[#29302D] text-[#FCFAF6]'
                  : 'hover:bg-[#FFF9F0]'
              }`}
            >
              Partnerships
            </Link>
            <Link
              to="/my-requests"
              className={`hover:text-[#C66B52] transition-colors py-1.5 px-3 rounded-lg ${
                location.pathname === '/my-requests'
                  ? 'bg-[#29302D] text-[#FCFAF6]'
                  : 'hover:bg-[#FFF9F0]'
              }`}
            >
              My Requests
            </Link>
          </nav>
        ) : (
          /* ========================================================
             2. PUBLIC LANDING PAGE NAVIGATION TABS
             ======================================================== */
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-[#29302D]">
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
              <span className="text-[10px] font-black bg-[#D99B43]/20 text-[#D99B43] px-2 py-0.5 rounded-full border border-[#D99B43]/30">
                ₹99
              </span>
            </a>
            <a href="/#why-fic" className="hover:text-[#C66B52] transition-colors">
              Why FIC
            </a>
          </nav>
        )}

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            /* Logged-in Member Profile & Quick Actions */
            <div className="flex items-center gap-3">
              <div className="hidden xl:flex items-center gap-2 bg-[#FFF9F0] px-3 py-1.5 rounded-xl border border-[#E8DBC8] text-xs text-[#29302D]">
                <span className="w-2 h-2 rounded-full bg-[#D99B43] animate-pulse"></span>
                <span className="font-bold truncate max-w-[130px]">
                  {user.fullName || user.categoryName || 'Member'}
                </span>
                <span className="text-[10px] text-[#FCFAF6] font-extrabold bg-[#29302D] px-1.5 py-0.5 rounded">
                  ₹99 Pass
                </span>
              </div>

              {!location.pathname.startsWith('/dashboard') && (
                <Link to="/dashboard">
                  <Button
                    size="sm"
                    className="bg-[#29302D] hover:bg-[#8064A9] text-[#FCFAF6] font-bold text-xs shadow-md shadow-[#29302D]/20 px-3.5"
                  >
                    Member Dashboard
                  </Button>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="text-xs text-[#77786E] hover:text-[#C66B52] font-bold px-2.5 py-1.5 rounded-lg border border-[#E8DBC8] hover:border-[#C66B52]/40 transition-colors"
                title="Sign out of FIC Business Hub"
              >
                Logout
              </button>
            </div>
          ) : (
            /* Public Visitor CTAs */
            <div className="flex items-center gap-3">
              <Link to="/login">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#29302D] border border-[#29302D]/30 hover:bg-[#FFF9F0] hover:border-[#29302D] transition-colors"
                >
                  Sign In
                </button>
              </Link>
              <Link to="/get-started">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C66B52] hover:bg-[#D99B43] text-white shadow-md shadow-[#C66B52]/20 transition-all hover:scale-105"
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
            className="p-2 text-[#29302D] hover:text-[#C66B52] rounded-lg border border-[#E8DBC8]"
            aria-label="Toggle navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8DBC8] bg-[#F5EBDD] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {user ? (
            /* Mobile Member Links */
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#FFF9F0] border border-[#E8DBC8] flex items-center justify-between text-xs mb-3">
                <span className="font-bold text-[#29302D]">{user.fullName || 'Member'}</span>
                <span className="text-[10px] text-[#FCFAF6] font-black bg-[#29302D] px-2 py-0.5 rounded">
                  {user.categoryName || 'Active ₹99 Member'}
                </span>
              </div>
              <Link to="/dashboard" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#29302D] hover:bg-[#FFF9F0] rounded-lg">
                Dashboard Overview
              </Link>
              <Link to="/marketplace" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#29302D] hover:bg-[#FFF9F0] rounded-lg">
                Universal Marketplace
              </Link>
              <Link to="/business-ideas" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#29302D] hover:bg-[#FFF9F0] rounded-lg">
                Business Ideas & Incubation
              </Link>
              <Link to="/business-development" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#29302D] hover:bg-[#FFF9F0] rounded-lg">
                Scaling & Development
              </Link>
              <Link to="/investment" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#29302D] hover:bg-[#FFF9F0] rounded-lg">
                Investment & Funding
              </Link>
              <Link to="/partnerships" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#29302D] hover:bg-[#FFF9F0] rounded-lg">
                Partnerships & Tie-ups
              </Link>
              <Link to="/my-requests" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#29302D] hover:bg-[#FFF9F0] rounded-lg">
                My Requests Tracking
              </Link>
              <div className="pt-2 border-t border-[#E8DBC8]">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm font-bold text-[#C66B52] hover:bg-[#FFF9F0] rounded-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            /* Mobile Visitor Links */
            <div className="space-y-2">
              <a href="/#about" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#29302D] hover:bg-[#FFF9F0] rounded-lg">
                About FIC Business Hub
              </a>
              <a href="/#who-can-join" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#8064A9] hover:bg-[#FFF9F0] rounded-lg">
                Who Can Join
              </a>
              <a href="/#capabilities" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#D99B43] hover:bg-[#FFF9F0] rounded-lg">
                What You Can Do
              </a>
              <a href="/#how-it-works" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#C66B52] hover:bg-[#FFF9F0] rounded-lg">
                How FIC Works
              </a>
              <a href="/#ecosystem" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#8064A9] hover:bg-[#FFF9F0] rounded-lg">
                One Connected Ecosystem
              </a>
              <a href="/#membership" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#D99B43] hover:bg-[#FFF9F0] rounded-lg">
                Membership (₹99 First Year)
              </a>
              <a href="/#why-fic" onClick={closeMenu} className="block px-3 py-2 text-sm font-bold text-[#29302D] hover:bg-[#FFF9F0] rounded-lg">
                Why FIC
              </a>
              <div className="pt-3 border-t border-[#E8DBC8] flex flex-col gap-2">
                <Link to="/login" onClick={closeMenu} className="w-full">
                  <button className="w-full py-2.5 text-xs font-bold border border-[#29302D]/40 text-[#29302D] rounded-xl hover:bg-[#FFF9F0]">
                    Sign In
                  </button>
                </Link>
                <Link to="/get-started" onClick={closeMenu} className="w-full">
                  <button className="w-full py-2.5 text-xs font-bold bg-[#C66B52] hover:bg-[#D99B43] text-white rounded-xl shadow-sm">
                    Become a Member
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
