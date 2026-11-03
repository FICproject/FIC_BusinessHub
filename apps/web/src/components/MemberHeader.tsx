import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  getStoredUser,
  removeAuthToken,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  IWalletNotification
} from '../services/api';
import { BellIcon, CheckCircleIcon, ClockIcon, ShieldCheckIcon, AlertCircleIcon } from './Icons';

export const MemberHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_kathir_001';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<IWalletNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const reloadNotifications = () => {
    const list = getUserNotifications(userId);
    setNotifications(list);
  };

  useEffect(() => {
    reloadNotifications();
    const interval = setInterval(reloadNotifications, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };
    if (notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen]);

  const handleLogout = () => {
    removeAuthToken();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(userId);
    reloadNotifications();
  };

  const handleMarkSingleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markNotificationAsRead(userId, id);
    reloadNotifications();
  };

  // Exact Member Portal Navigation Routes (before Notification Bell, Profile, Logout)
  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Business Ideas', path: '/business-ideas' },
    { label: 'Scaling', path: '/business-development' },
    { label: 'Investment', path: '/investment' },
    { label: 'Partnerships', path: '/partnerships' },
    { label: 'Meetings', path: '/meetings' },
    { label: 'My Requests', path: '/my-requests' },
    { label: 'My Services', path: '/my-services' }
  ];

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'MONEY_ADDED_SUCCESS':
      case 'REFERRAL_REWARD_CREDITED':
        return <CheckCircleIcon size={16} className="text-[#27AE60] shrink-0" />;
      case 'WITHDRAWAL_REQUESTED':
      case 'REFERRAL_REGISTRATION':
        return <ClockIcon size={16} className="text-[#D99B43] shrink-0" />;
      case 'MEMBERSHIP_RENEWAL_SUCCESS':
        return <ShieldCheckIcon size={16} className="text-[#2D9CDB] shrink-0" />;
      case 'ADD_FUNDS_FAILED':
      case 'WITHDRAWAL_REJECTED':
      case 'MEMBERSHIP_RENEWAL_FAILED':
        return <AlertCircleIcon size={16} className="text-[#C66B52] shrink-0" />;
      default:
        return <BellIcon size={16} className="text-[#8064A9] shrink-0" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full h-[72px] min-h-[72px] max-h-[72px] bg-[#F5EBDD]/95 backdrop-blur-md border-b border-[#E8DBC8] text-[#29302D] shadow-xs select-none">
      <div className="w-full max-w-[1340px] mx-auto px-3 sm:px-5 lg:px-6 h-full flex items-center justify-between gap-2">
        
        {/* ========================================================
            LEFT: LOGO + TITLE + SUBTITLE
           ======================================================== */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
          onClick={closeMenu}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#29302D] border border-[#D99B43]/40 flex items-center justify-center text-[#FCFAF6] font-black text-sm sm:text-base shadow-xs group-hover:bg-[#8064A9] transition-colors shrink-0">
            FIC
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[18px] sm:text-[20px] font-black leading-tight tracking-tight text-[#29302D] group-hover:text-[#C66B52] transition-colors">
              FIC Business Hub
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#C66B52] tracking-wider uppercase leading-none mt-0.5">
              Opportunity Ecosystem
            </span>
          </div>
        </Link>

        {/* ========================================================
            CENTER: MEMBER MODULES (Dashboard to My Services)
           ======================================================== */}
        <nav className="hidden xl:flex items-center gap-0.5 whitespace-nowrap">
          {navLinks.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-2 py-1.5 rounded-lg text-[12.5px] transition-colors duration-150 ${
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
            RIGHT: NOTIFICATION BELL | PROFILE | LOGOUT
            (The Notification Bell appears immediately to LEFT of Profile)
           ======================================================== */}
        <div className="hidden xl:flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* NOTIFICATION BELL WITH DROPDOWN */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              type="button"
              className={`relative p-2 rounded-xl border transition-all ${
                notificationOpen
                  ? 'bg-[#29302D] text-[#FCFAF6] border-[#29302D]'
                  : 'bg-white/80 hover:bg-white text-[#29302D] border-[#E8DBC8] hover:border-[#8064A9]'
              }`}
              title="Notifications"
              aria-label="View notifications"
            >
              <BellIcon size={19} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#C66B52] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu with Spring Entrance */}
            <AnimatePresence>
              {notificationOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className="absolute right-0 mt-2 w-[calc(100vw-24px)] sm:w-[380px] max-w-[380px] bg-[#FFF9F0] border border-[#E8DBC8] rounded-2xl shadow-2xl z-50 overflow-hidden text-[#29302D]"
                >
                <div className="px-4 py-3 bg-[#F5EBDD] border-b border-[#E8DBC8] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[#29302D]">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C66B52]/15 text-[#C66B52] text-[11px] font-bold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11.5px] font-bold text-[#8064A9] hover:text-[#29302D] transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto divide-y divide-[#E8DBC8]/60">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#77786E]">
                      <BellIcon size={24} className="mx-auto mb-2 opacity-40 text-[#77786E]" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(userId, notif.id);
                          reloadNotifications();
                          if (notif.actionUrl) {
                            navigate(notif.actionUrl);
                            setNotificationOpen(false);
                          }
                        }}
                        className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 text-xs ${
                          notif.isRead
                            ? 'bg-[#FFF9F0] hover:bg-white/80 opacity-80'
                            : 'bg-white hover:bg-white/95 border-l-4 border-[#C66B52]'
                        }`}
                      >
                        <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[#29302D] truncate">{notif.title}</span>
                            <span className="text-[10px] text-[#77786E] shrink-0">{notif.createdAt}</span>
                          </div>
                          <p className="text-[11.5px] text-[#77786E] mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <button
                            onClick={(e) => handleMarkSingleRead(notif.id, e)}
                            className="text-[10px] font-bold text-[#8064A9] hover:underline shrink-0"
                            title="Mark as read"
                          >
                            Read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-[#F5EBDD] border-t border-[#E8DBC8] text-center">
                  <Link
                    to="/profile"
                    onClick={() => setNotificationOpen(false)}
                    className="text-xs font-bold text-[#8064A9] hover:text-[#C66B52] transition-colors"
                  >
                    View Wallet & Account Activity &rarr;
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          {/* PROFILE BUTTON */}
          <Link
            to="/profile"
            className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-colors ${
              location.pathname.startsWith('/profile')
                ? 'bg-[#29302D] text-[#FCFAF6] shadow-xs'
                : 'text-[#29302D]/80 hover:text-[#29302D] hover:bg-[#FFF9F0]'
            }`}
          >
            Profile
          </Link>

          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            type="button"
            className="text-[13px] text-[#77786E] hover:text-[#C66B52] font-semibold px-3 py-1.5 rounded-lg border border-[#E8DBC8] hover:border-[#C66B52]/40 transition-colors shrink-0 cursor-pointer"
            title="Sign out of FIC Business Hub"
          >
            Logout
          </button>
        </div>

        {/* ========================================================
            MOBILE / TABLET HAMBURGER BUTTON
           ======================================================== */}
        <div className="xl:hidden flex items-center gap-2">
          {/* Mobile Bell */}
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-2 text-[#29302D] rounded-lg border border-[#E8DBC8] bg-white cursor-pointer"
          >
            <BellIcon size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C66B52] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#29302D] hover:text-[#C66B52] rounded-lg border border-[#E8DBC8] transition-colors bg-white cursor-pointer"
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
          MOBILE MENU COLLAPSIBLE DRAWER WITH SPRING SLIDE
         ======================================================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="xl:hidden border-b border-[#E8DBC8] bg-[#F5EBDD] px-4 pt-3 pb-5 space-y-3 shadow-xl max-h-[85vh] overflow-y-auto"
          >
            {/* Authenticated Member Info Banner in Drawer */}
            <div className="p-3 bg-white/80 border border-[#E8DBC8] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#29302D] text-white flex items-center justify-center font-bold text-xs">
                  {user?.fullName?.charAt(0) || 'M'}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-[#29302D] block truncate max-w-[180px]">
                    {user?.fullName || 'Member'}
                  </span>
                  <span className="text-[10px] text-[#8064A9] font-bold block truncate max-w-[180px]">
                    {user?.subCategory || 'Enterprise Member'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2E7D32] bg-[#2E7D32]/10 px-2 py-0.5 rounded border border-[#2E7D32]/20">
                Active
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
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] transition-colors min-h-[44px] ${
                      isActive
                        ? 'bg-[#29302D] text-[#FCFAF6] font-bold shadow-2xs'
                        : 'text-[#29302D] hover:bg-[#FFF9F0] font-medium'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="text-xs text-[#E58C72]">●</span>}
                  </Link>
                );
              })}
              <Link
                to="/profile"
                onClick={closeMenu}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold transition-colors min-h-[44px] ${
                  location.pathname.startsWith('/profile')
                    ? 'bg-[#29302D] text-[#FCFAF6] shadow-2xs'
                    : 'text-[#29302D] hover:bg-[#FFF9F0]'
                }`}
              >
                <span>Profile & Wallet</span>
                {location.pathname.startsWith('/profile') && <span className="text-xs text-[#E58C72]">●</span>}
              </Link>
            </div>

            <div className="pt-2 border-t border-[#E8DBC8]">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 min-h-[44px] text-center text-[13px] font-bold text-[#C66B52] bg-white rounded-xl border border-[#E8DBC8] hover:bg-[#C66B52] hover:text-white transition-colors cursor-pointer shadow-2xs"
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default MemberHeader;
