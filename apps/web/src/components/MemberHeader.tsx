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
import { getRoleNavigation } from '../services/dashboardConfig';
import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  UserIcon,
  EditIcon,
  LogOutIcon
} from './Icons';
import { LifeBuoy } from 'lucide-react';

export const MemberHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_kathir_001';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<IWalletNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const getInitials = (name?: string) => {
    if (!name) return 'M';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const reloadNotifications = () => {
    const list = getUserNotifications(userId);
    setNotifications(list);
  };

  useEffect(() => {
    reloadNotifications();
    // Live polling every 2.5 seconds so unread badge & notification list update in real-time
    const interval = setInterval(reloadNotifications, 2500);

    // Cross-tab and immediate same-window event listener for instant updates
    const handleStorageChange = () => reloadNotifications();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('fic_notifications_updated', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('fic_notifications_updated', handleStorageChange);
    };
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

  // Click outside & Escape key to close profile dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setNotificationOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

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

  // Dynamic Role-Based Member Portal Navigation Routes (before Notification Bell, Profile, Logout)
  const navLinks = getRoleNavigation(user).headerLinks;

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
    <header className="sticky top-0 z-50 w-full h-[64px] min-h-[64px] max-h-[64px] bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EDE2D7] text-[#51463F] shadow-[0_1px_8px_rgba(81,70,63,0.03)] select-none">
      <div className="w-full px-3.5 sm:px-5 lg:px-6 xl:px-8 2xl:px-10 h-full flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-4">

        {/* ========================================================
            LEFT: LOGO + BRAND NAME (FLUSH LEFT)
           ======================================================== */}
        <div className="flex items-center justify-start justify-self-start shrink-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 group focus:outline-none"
            onClick={closeMenu}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8795B] to-[#D96B4E] border border-[#E8795B]/40 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-[0_2px_6px_rgba(232,121,91,0.2)] group-hover:from-[#8064B1] group-hover:to-[#6E529F] transition-all shrink-0">
              FIC
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[15px] sm:text-[16px] font-black leading-tight tracking-tight text-[#51463F] group-hover:text-[#E8795B] transition-colors whitespace-nowrap">
                FIC Business Hub
              </span>
              <span className="text-[9px] font-extrabold text-[#E8795B] tracking-wider uppercase leading-none mt-0.5 whitespace-nowrap">
                Opportunity Ecosystem
              </span>
            </div>
          </Link>
        </div>

        {/* ========================================================
            CENTER: DYNAMIC ROLE-BASED NAVIGATION LINKS (MATHEMATICALLY CENTERED)
           ======================================================== */}
        <nav className="hidden lg:flex items-center justify-center justify-self-center gap-1 xl:gap-1.5 2xl:gap-2 whitespace-nowrap">
          {navLinks.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative h-9 px-2.5 xl:px-3 2xl:px-3.5 rounded-xl text-[12px] xl:text-[12.5px] 2xl:text-[13px] transition-all duration-150 inline-flex items-center justify-center text-center leading-none select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white font-black shadow-[0_2px_8px_rgba(232,121,91,0.25)]'
                    : 'text-[#453A33] hover:text-[#C65638] hover:bg-[#FDECE7]/80 font-bold'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ========================================================
            RIGHT: NOTIFICATION BELL | PROFILE DROPDOWN (FLUSH RIGHT)
           ======================================================== */}
        <div className="hidden lg:flex items-center justify-end justify-self-end gap-2 xl:gap-2.5 shrink-0">

          {/* NOTIFICATION BELL WITH DROPDOWN */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              type="button"
              className={`relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                notificationOpen
                  ? 'bg-[#FFF0EB] text-[#E8795B] border-[#E8795B]/40 shadow-xs'
                  : 'bg-white/90 hover:bg-white text-[#51463F] border-[#EDE2D7] hover:border-[#8064B1]'
              }`}
              title="Notifications"
              aria-label="View notifications"
            >
              <BellIcon size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-[#E8795B] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu with Spring Entrance */}
            <AnimatePresence>
              {notificationOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className="absolute right-0 mt-2 w-[calc(100vw-24px)] sm:w-[360px] max-w-[360px] bg-white border border-[#EDE2D7] rounded-xl shadow-2xl z-50 overflow-hidden text-[#51463F]"
                >
                  <div className="px-3.5 py-2.5 bg-[#FAF7F2] border-b border-[#EDE2D7] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs sm:text-sm text-[#51463F]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FFF0EB] text-[#E8795B] text-[10px] font-bold border border-[#E8795B]/20">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-bold text-[#8064B1] hover:text-[#51463F] transition-colors cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[300px] overflow-y-auto divide-y divide-[#EDE2D7]/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#82776E]">
                        <BellIcon size={20} className="mx-auto mb-1.5 opacity-40 text-[#82776E]" />
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
                          className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 text-xs ${notif.isRead
                              ? 'bg-[#FAF7F2] hover:bg-white/80 opacity-80'
                              : 'bg-white hover:bg-[#FFF0EB]/40 border-l-4 border-[#E8795B]'
                            }`}
                        >
                          <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[#51463F] text-xs truncate">{notif.title}</span>
                              <span className="text-[10px] text-[#82776E] shrink-0">{notif.createdAt}</span>
                            </div>
                            <p className="text-[11px] text-[#82776E] mt-0.5 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <button
                              onClick={(e) => handleMarkSingleRead(notif.id, e)}
                              className="text-[10px] font-bold text-[#8064B1] hover:underline shrink-0"
                              title="Mark as read"
                            >
                              Read
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 bg-[#FAF7F2] border-t border-[#EDE2D7] text-center">
                    <Link
                      to="/profile"
                      onClick={() => setNotificationOpen(false)}
                      className="text-[11px] font-bold text-[#8064B1] hover:text-[#E8795B] transition-colors"
                    >
                      View Wallet & Account Activity &rarr;
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ========================================================
              PROFILE DROPDOWN (AVATAR + PROFILE TEXT + DROPDOWN MENU)
             ======================================================== */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => {
                setProfileMenuOpen(!profileMenuOpen);
                setNotificationOpen(false);
              }}
              type="button"
              className={`h-9 flex items-center gap-2 pl-1.5 pr-2.5 rounded-xl border transition-all cursor-pointer select-none group ${
                profileMenuOpen || location.pathname.startsWith('/profile')
                  ? 'bg-white border-[#8064B1] text-[#8064B1] shadow-xs'
                  : 'bg-white/80 hover:bg-white border-[#EDE2D7] hover:border-[#8064B1]/40 text-[#51463F]'
              }`}
              title="Member Account & Profile Menu"
              aria-label="Toggle profile menu"
            >
              {/* 2. Member Profile Picture / Avatar */}
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullName || 'Member'}
                  className="w-7 h-7 rounded-lg object-cover border border-[#EDE2D7] shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8064B1] to-[#6E529F] text-white flex items-center justify-center font-black text-[11px] shadow-xs shrink-0">
                  {getInitials(user?.fullName)}
                </div>
              )}

              {/* 3. Profile Button / Text */}
              <span className="text-xs font-bold leading-none">
                Profile
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 opacity-60 group-hover:opacity-100 ${
                  profileMenuOpen ? 'rotate-180' : ''
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* PROFILE DROPDOWN MENU */}
            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className="absolute right-0 mt-2 w-72 bg-white border border-[#EDE2D7] rounded-2xl shadow-2xl z-50 overflow-hidden text-[#51463F]"
                >
                  {/* Top Member Header */}
                  <div className="p-3.5 bg-[#FAF7F2] border-b border-[#EDE2D7]">
                    <div className="flex items-center gap-3">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.fullName || 'Member'}
                          className="w-10 h-10 rounded-xl object-cover border border-[#EDE2D7] shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8064B1] to-[#6E529F] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                          {getInitials(user?.fullName)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-black text-xs text-[#51463F] block truncate">
                          {user?.fullName || 'Authenticated Member'}
                        </span>
                        <span className="text-[10px] text-[#8064B1] font-bold block truncate">
                          {user?.subCategory || 'Enterprise Member'}
                        </span>
                        <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider text-[#3B9C91] bg-[#E3F5F2] px-1.5 py-0.2 rounded-sm border border-[#3B9C91]/30">
                          Active Account
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="p-1.5 space-y-0.5">
                    {/* Option 1: View Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-[#FAF7F2] text-left transition-colors flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#8064B1]/10 text-[#8064B1] flex items-center justify-center shrink-0 group-hover:bg-[#8064B1] group-hover:text-white transition-colors">
                        <UserIcon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#51463F] block leading-tight">
                          View Profile
                        </span>
                        <span className="text-[10px] text-[#82776E] block mt-0.5">
                          Personal details, wallet & verification
                        </span>
                      </div>
                    </button>

                    {/* Option 2: Edit Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/profile?edit=true');
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-[#FAF7F2] text-left transition-colors flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#3B9C91]/10 text-[#3B9C91] flex items-center justify-center shrink-0 group-hover:bg-[#3B9C91] group-hover:text-white transition-colors">
                        <EditIcon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#51463F] block leading-tight">
                          Edit Profile
                        </span>
                        <span className="text-[10px] text-[#82776E] block mt-0.5">
                          Update contact, address & bio details
                        </span>
                      </div>
                    </button>

                    {/* Option 3: Help & Support Live Desk */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/support');
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-[#FAF7F2] text-left transition-colors flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#8064B1]/10 text-[#8064B1] flex items-center justify-center shrink-0 group-hover:bg-[#8064B1] group-hover:text-white transition-colors">
                        <LifeBuoy className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#51463F] block leading-tight">
                          Help & Support Desk
                        </span>
                        <span className="text-[10px] text-[#82776E] block mt-0.5">
                          Live chat with Admin & raise inquiries
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#EDE2D7]" />

                  {/* Option 3: Logout */}
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-[#FFF0EB] text-left transition-colors flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#E8795B]/10 text-[#E8795B] flex items-center justify-center shrink-0 group-hover:bg-[#E8795B] group-hover:text-white transition-colors">
                        <LogOutIcon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#E8795B] block leading-tight">
                          Logout
                        </span>
                        <span className="text-[10px] text-[#82776E] block mt-0.5">
                          Sign out of FIC Business Hub
                        </span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ========================================================
            MOBILE / TABLET HAMBURGER BUTTON (< 1024px)
           ======================================================== */}
        <div className="lg:hidden flex items-center justify-end gap-2">
          {/* Mobile Bell */}
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-2 text-[#51463F] rounded-xl border border-[#EDE2D7] bg-white cursor-pointer"
          >
            <BellIcon size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E8795B] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#51463F] hover:text-[#E8795B] rounded-xl border border-[#EDE2D7] transition-colors bg-white cursor-pointer"
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
          MOBILE MENU COLLAPSIBLE DRAWER WITH SPRING SLIDE (< 1024px)
         ======================================================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden border-b border-[#EDE2D7] bg-[#FAF7F2] px-4 pt-3 pb-5 space-y-3 shadow-xl max-h-[85vh] overflow-y-auto"
          >
            {/* Authenticated Member Info Banner in Drawer */}
            <div className="p-3 bg-white border border-[#EDE2D7] rounded-2xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8795B] to-[#D96B4E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.fullName?.charAt(0) || 'M'}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-[#51463F] block truncate max-w-[180px]">
                    {user?.fullName || 'Member'}
                  </span>
                  <span className="text-[10px] text-[#8064B1] font-bold block truncate max-w-[180px]">
                    {user?.subCategory || 'Enterprise Member'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#3B9C91] bg-[#E3F5F2] px-2 py-0.5 rounded-lg border border-[#3B9C91]/30">
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
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] transition-colors min-h-[44px] ${isActive
                        ? 'bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white font-bold shadow-2xs'
                        : 'text-[#453A33] hover:bg-[#FDECE7] font-bold'
                      }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="text-xs text-white">●</span>}
                  </Link>
                );
              })}
              <Link
                to="/profile"
                onClick={closeMenu}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold transition-colors min-h-[44px] ${location.pathname === '/profile'
                    ? 'bg-gradient-to-r from-[#8064B1] to-[#6E529F] text-white shadow-2xs'
                    : 'text-[#51463F] hover:bg-[#EAE3F4]/50'
                  }`}
              >
                <span>View Profile & Wallet</span>
                {location.pathname === '/profile' && <span className="text-xs text-white">●</span>}
              </Link>
              <Link
                to="/profile?edit=true"
                onClick={closeMenu}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold transition-colors min-h-[44px] text-[#51463F] hover:bg-[#EAE3F4]/50"
              >
                <span>Edit Profile</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-[#EDE2D7]">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 min-h-[44px] text-center text-[13px] font-bold text-[#E8795B] bg-white rounded-xl border border-[#EDE2D7] hover:bg-[#FFF0EB] transition-colors cursor-pointer shadow-2xs"
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
