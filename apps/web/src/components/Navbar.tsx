import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser, removeAuthToken } from '../services/api';
import { Button, Badge } from '@fic/ui';
import { BriefcaseIcon, ShieldCheckIcon } from './Icons';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
            FIC
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 tracking-tight block leading-tight">
              FIC Business Hub
            </span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide block uppercase">
              Opportunity Ecosystem
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <a href="/#sectors" className="hover:text-blue-600 transition-colors">10 Sectors</a>
          <Link to="/marketplace" className="hover:text-blue-600 transition-colors">Marketplace</Link>
          <a href="/#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
          <a href="/#pricing" className="hover:text-blue-600 transition-colors">
            Membership <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold ml-1">₹99</span>
          </a>
          <a href="/#faqs" className="hover:text-blue-600 transition-colors">FAQs</a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="primary" size="sm">
                  Member Dashboard
                </Button>
              </Link>
              <Link to="/my-requests" className="hidden sm:inline-block">
                <Button variant="outline" size="sm">
                  My Requests
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-500 hover:text-red-600 font-medium px-2 py-1"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/get-started">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

