import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { getStoredUser, removeAuthToken, fetchPlatformPricingConfig } from '../services/api';
import { MemberHeader } from './MemberHeader';
import { ArrowRightIcon } from './Icons';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const shouldReduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [firstYearFee, setFirstYearFee] = useState<number>(99);
  const [activeSection, setActiveSection] = useState<string>('home');

  useEffect(() => {
    fetchPlatformPricingConfig().then((cfg) => {
      if (cfg?.firstYearMembershipFee) {
        setFirstYearFee(cfg.firstYearMembershipFee);
      }
    });
  }, []);

  // Section scroll-spy for active navigation item on home page
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    const handleScroll = () => {
      const sections = [
        { id: 'membership', offset: 200 },
        { id: 'how-it-works', offset: 200 },
        { id: 'services', offset: 200 },
        { id: 'home', offset: 0 }
      ];

      const scrollPosition = window.scrollY;

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop - section.offset;
          if (scrollPosition >= top) {
            setActiveSection(section.id);
            return;
          }
        }
      }
      setActiveSection('home');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

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

  const navLinks = [
    { label: 'Home', path: '/', isHash: false, sectionId: 'home' },
    { label: 'About', path: '/about', isHash: false, sectionId: '' },
    { label: 'Services', path: '/#services', isHash: true, sectionId: 'services' },
    {
      label: 'Membership',
      path: '/membership',
      isHash: false,
      sectionId: 'membership',
      badge: `₹${firstYearFee}`
    },
    { label: 'Contact', path: '/contact', isHash: false, sectionId: '' }
  ];

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 w-full h-[72px] min-h-[72px] max-h-[72px] bg-white/95 backdrop-blur-md border-b border-[#EDE2D7] text-[#51463F] shadow-[0_2px_12px_-4px_rgba(81,70,63,0.06)] select-none transition-colors"
    >
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        {/* Brand Logo - Left Side */}
        <Link
          to="/"
          className="flex items-center gap-3 shrink-0 group focus:outline-none"
          onClick={closeMenu}
        >
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6D28D9] via-[#7C3AED] to-[#E8795B] flex items-center justify-center text-white font-black text-sm shadow-[0_4px_12px_rgba(109,40,217,0.25)] shrink-0"
          >
            FIC
          </motion.div>
          <div className="flex flex-col justify-center">
            <span className="text-[18px] sm:text-[19px] font-black leading-tight tracking-tight text-[#51463F] group-hover:text-[#6D28D9] transition-colors duration-200">
              FIC Business Hub
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#82776E] tracking-wide uppercase leading-none mt-0.5">
              Forge India Connect Pvt. Ltd.
            </span>
          </div>
        </Link>

        {/* Center/Right Navigation Links - Desktop */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-[14px] font-semibold text-[#51463F]">
          {navLinks.map((item) => {
            const isCurrentPage = !item.isHash && location.pathname === item.path;
            const isCurrentSection =
              location.pathname === '/' &&
              ((item.isHash && activeSection === item.sectionId) ||
                (item.path === '/' && activeSection === 'home'));
            const isActive = isCurrentPage || isCurrentSection;

            const linkContent = (
              <span className="relative px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors duration-200 group">
                <span
                  className={`${
                    isActive ? 'text-[#6D28D9] font-bold' : 'text-[#51463F] group-hover:text-[#6D28D9]'
                  } transition-colors`}
                >
                  {item.label}
                </span>

                {item.badge && (
                  <span className="text-[10px] font-black bg-[#EDE5FF] text-[#6D28D9] px-2 py-0.5 rounded-full border border-[#6D28D9]/20 transition-transform group-hover:scale-105">
                    {item.badge}
                  </span>
                )}

                {/* Animated active navigation indicator */}
                {isActive && (
                  <motion.span
                    layoutId="navbarActiveIndicator"
                    className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-[#6D28D9] to-[#E8795B] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </span>
            );

            if (item.isHash) {
              return (
                <a
                  key={item.label}
                  href={item.path}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] rounded-lg"
                >
                  {linkContent}
                </a>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] rounded-lg"
              >
                {linkContent}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons: Login / Become a Member */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {user ? (
            <Link to="/dashboard">
              <motion.button
                whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                transition={{ duration: 0.15 }}
                type="button"
                className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#51463F] text-white hover:bg-[#6D28D9] shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                Dashboard
              </motion.button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <motion.button
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -1 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  className="px-4 py-2 rounded-xl text-[13.5px] font-bold text-[#51463F] border border-[#EDE2D7] hover:border-[#6D28D9]/40 hover:text-[#6D28D9] hover:bg-[#FAF7F2] transition-all cursor-pointer"
                >
                  Login
                </motion.button>
              </Link>

              <Link to="/register">
                <motion.button
                  whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -1 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  type="button"
                  className="group px-5 py-2.5 rounded-xl text-[13.5px] font-bold bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#E8795B] text-white shadow-[0_4px_14px_rgba(109,40,217,0.25)] hover:shadow-[0_8px_20px_-4px_rgba(109,40,217,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Become a Member</span>
                  <ArrowRightIcon
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </motion.button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden flex items-center gap-2">
          {user && (
            <Link to="/dashboard" onClick={closeMenu}>
              <span className="text-xs font-bold bg-[#6D28D9] text-white px-2.5 py-1 rounded-md sm:hidden">
                Dashboard
              </span>
            </Link>
          )}

          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.92 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#51463F] hover:text-[#6D28D9] rounded-xl border border-[#EDE2D7] hover:border-[#6D28D9]/30 transition-colors"
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
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu Collapsible Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden border-b border-[#EDE2D7] bg-white/98 backdrop-blur-md px-4 pt-3 pb-5 space-y-3 shadow-xl"
          >
            <nav className="flex flex-col space-y-1.5 text-sm font-semibold text-[#51463F]">
              <Link
                to="/"
                onClick={closeMenu}
                className="px-3.5 py-2.5 rounded-xl hover:bg-[#FAF7F2] hover:text-[#6D28D9] transition-colors"
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={closeMenu}
                className="px-3.5 py-2.5 rounded-xl hover:bg-[#FAF7F2] hover:text-[#6D28D9] transition-colors"
              >
                About
              </Link>
              <a
                href="/#services"
                onClick={closeMenu}
                className="px-3.5 py-2.5 rounded-xl hover:bg-[#FAF7F2] hover:text-[#6D28D9] transition-colors"
              >
                Services
              </a>
              <Link
                to="/membership"
                onClick={closeMenu}
                className="px-3.5 py-2.5 rounded-xl hover:bg-[#FAF7F2] hover:text-[#6D28D9] transition-colors flex items-center justify-between"
              >
                <span>Membership</span>
                <span className="text-[10px] font-black bg-[#EDE5FF] text-[#6D28D9] px-2 py-0.5 rounded-full border border-[#6D28D9]/20">
                  ₹{firstYearFee}
                </span>
              </Link>
              <Link
                to="/contact"
                onClick={closeMenu}
                className="px-3.5 py-2.5 rounded-xl hover:bg-[#FAF7F2] hover:text-[#6D28D9] transition-colors"
              >
                Contact
              </Link>
            </nav>

            <div className="pt-3 border-t border-[#EDE2D7] flex flex-col gap-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={closeMenu}>
                    <button
                      type="button"
                      className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#6D28D9] text-white hover:bg-[#5B21B6] transition-colors"
                    >
                      Go to Member Dashboard
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    type="button"
                    className="w-full py-2 text-center text-xs font-semibold text-[#82776E] hover:text-[#51463F]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu}>
                    <button
                      type="button"
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-[#51463F] border border-[#EDE2D7] hover:bg-[#FAF7F2] transition-colors"
                    >
                      Login
                    </button>
                  </Link>
                  <Link to="/register" onClick={closeMenu}>
                    <button
                      type="button"
                      className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#E8795B] text-white shadow-sm hover:opacity-95 transition-opacity"
                    >
                      Become a Member (₹{firstYearFee})
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
