import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, removeAuthToken } from '../services/api';
import { Button, Badge } from '@fic/ui';
import {
  BriefcaseIcon,
  ShieldCheckIcon,
  UserIcon,
  SparklesIcon
} from './Icons';

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

  // Close mobile menu on link click
  const closeMenu = () => setMobileMenuOpen(false);

  // Check if current page is the landing page
  const isLandingPage = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-[#0B1020]/95 backdrop-blur-md border-b border-slate-800/80 text-white transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3 group" onClick={closeMenu}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
            FIC
          </div>
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight text-white block leading-tight">
              FIC Business Hub
            </span>
            <span className="text-[10px] text-blue-400 font-semibold tracking-wider block uppercase">
              Opportunity Ecosystem
            </span>
          </div>
        </Link>

        {/* ========================================================
            NAVIGATION TABS (DIFFERENT FOR VISITOR VS LOGGED-IN MEMBER)
           ======================================================== */}
        {user ? (
          /* ========================================================
             1. AUTHENTICATED MEMBER PORTAL NAVIGATION TABS
             When logged in: Show Workspace & Member Discovery Tools
             ======================================================== */
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
            <Link
              to="/dashboard"
              className={`hover:text-blue-400 transition-colors py-1 px-2.5 rounded-lg ${
                location.pathname === '/dashboard' ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30' : ''
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/marketplace"
              className={`hover:text-blue-400 transition-colors py-1 px-2.5 rounded-lg ${
                location.pathname === '/marketplace' ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30' : ''
              }`}
            >
              Marketplace
            </Link>
            <Link
              to="/business-ideas"
              className={`hover:text-blue-400 transition-colors py-1 px-2.5 rounded-lg ${
                location.pathname === '/business-ideas' ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30' : ''
              }`}
            >
              Business Ideas
            </Link>
            <Link
              to="/business-development"
              className={`hover:text-blue-400 transition-colors py-1 px-2.5 rounded-lg ${
                location.pathname === '/business-development' ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30' : ''
              }`}
            >
              Scaling
            </Link>
            <Link
              to="/investment"
              className={`hover:text-blue-400 transition-colors py-1 px-2.5 rounded-lg ${
                location.pathname === '/investment' ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30' : ''
              }`}
            >
              Investment
            </Link>
            <Link
              to="/partnerships"
              className={`hover:text-blue-400 transition-colors py-1 px-2.5 rounded-lg ${
                location.pathname === '/partnerships' ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30' : ''
              }`}
            >
              Partnerships
            </Link>
            <Link
              to="/my-requests"
              className={`hover:text-blue-400 transition-colors py-1 px-2.5 rounded-lg ${
                location.pathname === '/my-requests' ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30' : ''
              }`}
            >
              My Requests
            </Link>
          </nav>
        ) : (
          /* ========================================================
             2. PUBLIC LANDING PAGE NAVIGATION TABS
             When not logged in: Show Public Section Anchors & Information
             ======================================================== */
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="/#about" className="hover:text-blue-400 transition-colors">
              About FIC
            </a>
            <a href="/#who-can-join" className="hover:text-blue-400 transition-colors">
              Who Can Join
            </a>
            <a href="/#capabilities" className="hover:text-blue-400 transition-colors">
              Capabilities
            </a>
            <a href="/#how-it-works" className="hover:text-blue-400 transition-colors">
              How It Works
            </a>
            <a href="/#ecosystem" className="hover:text-blue-400 transition-colors">
              Ecosystem
            </a>
            <a href="/#membership" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <span>Membership</span>
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
                ₹99
              </span>
            </a>
            <a href="/#why-fic" className="hover:text-blue-400 transition-colors">
              Why FIC
            </a>
          </nav>
        )}

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            /* Logged-in Member Profile & Quick Actions */
            <div className="flex items-center gap-3">
              <div className="hidden xl:flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-medium truncate max-w-[140px]">
                  {user.fullName || user.categoryName || 'Member'}
                </span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                  ₹99 Pass
                </span>
              </div>

              {!location.pathname.startsWith('/dashboard') && (
                <Link to="/dashboard">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 px-3.5">
                    Member Dashboard
                  </Button>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-red-400 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-red-400/40 transition-colors"
                title="Sign out of FIC Business Hub"
              >
                Logout
              </button>
            </div>
          ) : (
            /* Public Visitor CTAs */
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-slate-200 border-slate-700 hover:bg-slate-800/80 font-bold text-xs px-4"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/get-started">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 px-4"
                >
                  Become a Member
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden flex items-center gap-2">
          {user && (
            <Link to="/dashboard" onClick={closeMenu}>
              <span className="text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-md sm:hidden">
                Dashboard
              </span>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg border border-slate-800"
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
        <div className="lg:hidden border-t border-slate-800 bg-[#0B1020] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {user ? (
            /* Mobile Member Links */
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs mb-3">
                <span className="font-bold text-white">{user.fullName || 'Member'}</span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  {user.categoryName || 'Active ₹99 Member'}
                </span>
              </div>
              <Link to="/dashboard" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                Dashboard Overview
              </Link>
              <Link to="/marketplace" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                Universal Marketplace
              </Link>
              <Link to="/business-ideas" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                Business Ideas & Incubation
              </Link>
              <Link to="/business-development" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                Scaling & Development
              </Link>
              <Link to="/investment" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                Investment & Funding
              </Link>
              <Link to="/partnerships" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                Partnerships & Tie-ups
              </Link>
              <Link to="/my-requests" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                My Requests Tracking
              </Link>
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-red-400 hover:bg-slate-900 rounded-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            /* Mobile Visitor Links */
            <div className="space-y-2">
              <a href="/#about" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                About FIC Business Hub
              </a>
              <a href="/#who-can-join" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                Who Can Join (8 Categories)
              </a>
              <a href="/#capabilities" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                Ecosystem Capabilities
              </a>
              <a href="/#how-it-works" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                How It Works (4 Steps)
              </a>
              <a href="/#ecosystem" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                One Ecosystem Roadmap
              </a>
              <a href="/#membership" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-amber-300 hover:bg-slate-900 rounded-lg">
                Membership (₹99 First Year)
              </a>
              <a href="/#why-fic" onClick={closeMenu} className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg">
                Why Choose FIC
              </a>
              <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                <Link to="/login" onClick={closeMenu} className="w-full">
                  <Button variant="outline" className="w-full border-slate-700 text-white text-xs py-2.5">
                    Sign In
                  </Button>
                </Link>
                <Link to="/get-started" onClick={closeMenu} className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-2.5 font-bold">
                    Become a Member
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
