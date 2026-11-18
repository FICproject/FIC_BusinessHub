import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, removeAuthToken, fetchPlatformPricingConfig } from '../services/api';
import { MemberHeader } from './MemberHeader';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [firstYearFee, setFirstYearFee] = useState<number>(99);

  useEffect(() => {
    fetchPlatformPricingConfig().then((cfg) => {
      if (cfg?.firstYearMembershipFee) {
        setFirstYearFee(cfg.firstYearMembershipFee);
      }
    });
  }, []);

  // If on any authenticated member workspace page, delegate strictly to the shared global MemberHeader
  const memberRoutes = [
    '/dashboard',
    '/marketplace',
    '/business-ideas',
    '/business-development',
    '/investment',
    '/meetings',
    '/my-requests',
    '/my-services',
    '/profile'
  ];
  const isMemberRoute = memberRoutes.some(
    (route) => location.pathname === route || location.pathname.startsWith(route + '/')
  );

  if (isMemberRoute && user) {
    return <MemberHeader />;
  }

  const handleLogout = () => {
    removeAuthToken();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full h-[72px] min-h-[72px] max-h-[72px] bg-white/95 backdrop-blur-md border-b border-[#E8E2D9] text-[#2D2520] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] select-none">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Brand Logo - Left Side */}
        <Link
          to="/"
          className="flex items-center gap-3 shrink-0 group focus:outline-none"
          onClick={closeMenu}
        >
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center text-white font-black text-sm shadow-xs group-hover:bg-[#4338CA] transition-colors shrink-0">
            FIC
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[18px] sm:text-[19px] font-black leading-tight tracking-tight text-[#2D2520] group-hover:text-[#4F46E5] transition-colors">
              FIC Business Hub
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#857A71] tracking-wide uppercase leading-none mt-0.5">
              Forge India Connect Pvt. Ltd.
            </span>
          </div>
        </Link>

        {/* Right Navigation Links - Desktop */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-[14px] font-semibold text-[#574D45]">
          <Link
            to="/"
            className={`hover:text-[#4F46E5] transition-colors ${location.pathname === '/' ? 'text-[#4F46E5]' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={`hover:text-[#4F46E5] transition-colors ${location.pathname === '/about' ? 'text-[#4F46E5]' : ''}`}
          >
            About
          </Link>
          <a
            href="/#services"
            className="hover:text-[#4F46E5] transition-colors"
          >
            Services
          </a>
          <Link
            to="/membership"
            className={`hover:text-[#4F46E5] transition-colors flex items-center gap-1.5 ${location.pathname === '/membership' ? 'text-[#4F46E5]' : ''}`}
          >
            <span>Membership</span>
            <span className="text-[10px] font-black bg-[#4F46E5]/10 text-[#4F46E5] px-2 py-0.5 rounded-full border border-[#4F46E5]/20">
              ₹{firstYearFee}
            </span>
          </Link>
          <Link
            to="/contact"
            className={`hover:text-[#4F46E5] transition-colors ${location.pathname === '/contact' ? 'text-[#4F46E5]' : ''}`}
          >
            Contact
          </Link>
        </nav>

        {/* Action Buttons: Login / Become a Member */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {user ? (
            <Link to="/dashboard">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#2D2520] text-white hover:bg-[#4F46E5] transition-colors"
              >
                Dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-[13.5px] font-bold text-[#2D2520] hover:text-[#4F46E5] hover:bg-[#FAF8F5] transition-colors"
                >
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl text-[13.5px] font-bold bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-xs transition-colors"
                >
                  Become a Member
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden flex items-center gap-2">
          {user && (
            <Link to="/dashboard" onClick={closeMenu}>
              <span className="text-xs font-bold bg-[#4F46E5] text-white px-2.5 py-1 rounded-md sm:hidden">
                Dashboard
              </span>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#2D2520] hover:text-[#4F46E5] rounded-lg border border-[#E8E2D9] transition-colors"
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

      {/* Mobile Menu Collapsible Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E8E2D9] bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-[#2D2520]">
            <Link to="/" onClick={closeMenu} className="px-3 py-2 rounded-lg hover:bg-[#FAF8F5]">
              Home
            </Link>
            <Link to="/about" onClick={closeMenu} className="px-3 py-2 rounded-lg hover:bg-[#FAF8F5]">
              About
            </Link>
            <a href="/#services" onClick={closeMenu} className="px-3 py-2 rounded-lg hover:bg-[#FAF8F5]">
              Services
            </a>
            <Link
              to="/membership"
              onClick={closeMenu}
              className="px-3 py-2 rounded-lg hover:bg-[#FAF8F5] flex items-center justify-between"
            >
              <span>Membership</span>
              <span className="text-[10px] font-black bg-[#4F46E5]/10 text-[#4F46E5] px-2 py-0.5 rounded-full border border-[#4F46E5]/20">
                ₹{firstYearFee}
              </span>
            </Link>
            <Link to="/contact" onClick={closeMenu} className="px-3 py-2 rounded-lg hover:bg-[#FAF8F5]">
              Contact
            </Link>
          </nav>

          <div className="pt-3 border-t border-[#E8E2D9] flex flex-col gap-2">
            {user ? (
              <>
                <Link to="/dashboard" onClick={closeMenu}>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors"
                  >
                    Go to Member Dashboard
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  type="button"
                  className="w-full py-2 text-center text-xs font-semibold text-[#857A71] hover:text-[#2D2520]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-[#2D2520] border border-[#E8E2D9] hover:bg-[#FAF8F5] transition-colors"
                  >
                    Login
                  </button>
                </Link>
                <Link to="/register" onClick={closeMenu}>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#4F46E5] text-white shadow-xs hover:bg-[#4338CA] transition-colors"
                  >
                    Become a Member (₹{firstYearFee})
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
