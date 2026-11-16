import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Clock,
  Briefcase,
  Video,
  Lightbulb,
  Wallet,
  AlertCircle,
  Search,
  X,
  CheckCheck,
  Inbox
} from 'lucide-react';
import {
  IWalletNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markMemberNotificationReadStrict,
  markAllMemberNotificationsReadStrict
} from '../services/api';

export type NotificationCategory = 'ALL' | 'UNREAD' | 'SERVICE' | 'MEETING' | 'FUNDING_IDEA' | 'WALLET_SYSTEM';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: IWalletNotification[];
  userId: string;
  onReload: () => Promise<void>;
}

export const getNotificationCategory = (notif: IWalletNotification): 'SERVICE' | 'MEETING' | 'FUNDING_IDEA' | 'WALLET_SYSTEM' => {
  const text = `${notif.title || ''} ${notif.message || ''} ${notif.type || ''}`.toLowerCase();

  if (text.includes('meeting') || text.includes('call') || text.includes('consultation') || text.includes('introductory') || text.includes('google meet')) {
    return 'MEETING';
  }
  if (text.includes('service') || text.includes('request') || text.includes('project requirement') || text.includes('provider') || text.includes('brief')) {
    return 'SERVICE';
  }
  if (text.includes('funding') || text.includes('idea') || text.includes('invest') || text.includes('pitch') || text.includes('equity') || text.includes('scaling')) {
    return 'FUNDING_IDEA';
  }
  return 'WALLET_SYSTEM';
};

export const getNotificationRoute = (notif: IWalletNotification): string => {
  if (notif.actionUrl) return notif.actionUrl;
  const cat = getNotificationCategory(notif);
  const text = `${notif.title || ''} ${notif.message || ''}`.toLowerCase();

  switch (cat) {
    case 'MEETING':
      return '/meetings';
    case 'SERVICE':
      if (text.includes('in my services') || text.includes('new project requirements') || text.includes('service provider')) {
        return '/my-services';
      }
      return '/my-requests';
    case 'FUNDING_IDEA':
      if (text.includes('idea')) return '/business-ideas';
      if (text.includes('scaling')) return '/scaling';
      return '/investment';
    case 'WALLET_SYSTEM':
    default:
      if (text.includes('kyc') || text.includes('wallet') || text.includes('money') || text.includes('referral') || text.includes('reward') || text.includes('payout')) {
        return '/profile';
      }
      return '/dashboard';
  }
};

export const formatNotificationTime = (createdAt?: string): string => {
  if (!createdAt) return 'Recently';
  if (createdAt === 'Just now' || createdAt === 'Yesterday') return createdAt;
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return createdAt;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  userId,
  onReload
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NotificationCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Close on escape key & lock body scroll
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Counts for tabs
  const counts = useMemo(() => {
    let unread = 0;
    let service = 0;
    let meeting = 0;
    let fundingIdea = 0;
    let walletSystem = 0;

    notifications.forEach((n) => {
      if (!n.isRead) unread++;
      const cat = getNotificationCategory(n);
      if (cat === 'SERVICE') service++;
      else if (cat === 'MEETING') meeting++;
      else if (cat === 'FUNDING_IDEA') fundingIdea++;
      else walletSystem++;
    });

    return {
      all: notifications.length,
      unread,
      service,
      meeting,
      fundingIdea,
      walletSystem
    };
  }, [notifications]);

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === 'UNREAD' && n.isRead) return false;
      if (activeTab !== 'ALL' && activeTab !== 'UNREAD') {
        const cat = getNotificationCategory(n);
        if (cat !== activeTab) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (n.title || '').toLowerCase().includes(query);
        const messageMatch = (n.message || '').toLowerCase().includes(query);
        if (!titleMatch && !messageMatch) return false;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      markAllNotificationsAsRead(userId);
      await markAllMemberNotificationsReadStrict();
      await onReload();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif: IWalletNotification) => {
    if (!notif.isRead) {
      markNotificationAsRead(userId, notif.id);
      await markMemberNotificationReadStrict(notif.id);
      onReload();
    }
    const route = getNotificationRoute(notif);
    onClose();
    navigate(route);
  };

  const handleSingleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markNotificationAsRead(userId, id);
    await markMemberNotificationReadStrict(id);
    onReload();
  };

  const renderIcon = (notif: IWalletNotification) => {
    const cat = getNotificationCategory(notif);
    switch (cat) {
      case 'MEETING':
        return (
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Video size={17} />
          </div>
        );
      case 'SERVICE':
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Briefcase size={17} />
          </div>
        );
      case 'FUNDING_IDEA':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Lightbulb size={17} />
          </div>
        );
      case 'WALLET_SYSTEM':
      default:
        if (notif.type?.includes('FAILED') || notif.type?.includes('REJECTED')) {
          return (
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertCircle size={17} />
            </div>
          );
        }
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Wallet size={17} />
          </div>
        );
    }
  };

  const renderBadge = (notif: IWalletNotification) => {
    const cat = getNotificationCategory(notif);
    switch (cat) {
      case 'MEETING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            Meeting
          </span>
        );
      case 'SERVICE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200/60">
            Service Request
          </span>
        );
      case 'FUNDING_IDEA':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/60">
            Innovation & Capital
          </span>
        );
      case 'WALLET_SYSTEM':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
            Account & Wallet
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#EDE2D7] overflow-hidden flex flex-col max-h-[88vh] z-10"
        >
          {/* Modal Header */}
          <div className="px-5 py-4 bg-[#FAF7F2] border-b border-[#EDE2D7] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8064B1] to-[#6E529F] text-white flex items-center justify-center shadow-sm">
                <Bell size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-[#51463F] tracking-tight">
                    Notification Center
                  </h3>
                  {counts.unread > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0EB] text-[#E8795B] text-xs font-black border border-[#E8795B]/20">
                      {counts.unread} unread
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#82776E] mt-0.5">
                  Stay informed on introductions, service dispatches, and business opportunities.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {counts.unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#EDE2D7] text-xs font-bold text-[#8064B1] hover:text-[#51463F] hover:bg-[#FAF7F2] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Mark all notifications as read"
                >
                  <CheckCheck size={14} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-[#EDE2D7] text-[#82776E] hover:text-[#51463F] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Search Bar & Mobile Mark-All-Read */}
          <div className="p-3 sm:px-5 sm:pt-3 sm:pb-2 bg-white border-b border-[#EDE2D7]/60 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-[#82776E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notifications by title or message..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-[#FAF7F2] border border-[#EDE2D7] rounded-xl text-[#51463F] placeholder-[#A0958C] focus:outline-none focus:ring-2 focus:ring-[#8064B1]/30 focus:border-[#8064B1]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-[#82776E] hover:text-[#51463F]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {counts.unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="sm:hidden flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white border border-[#EDE2D7] text-[11px] font-bold text-[#8064B1] shadow-2xs"
                >
                  <CheckCheck size={13} />
                  <span>Mark Read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ALL'
                    ? 'bg-[#8064B1] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#51463F] hover:bg-[#F3EDE6]'
                }`}
              >
                <span>All</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'ALL' ? 'bg-white/25 text-white' : 'bg-[#EDE2D7] text-[#82776E]'
                }`}>
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('UNREAD')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'UNREAD'
                    ? 'bg-[#E8795B] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#51463F] hover:bg-[#F3EDE6]'
                }`}
              >
                <span>Unread</span>
                {counts.unread > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === 'UNREAD' ? 'bg-white/25 text-white' : 'bg-[#FFF0EB] text-[#E8795B]'
                  }`}>
                    {counts.unread}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SERVICE')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'SERVICE'
                    ? 'bg-[#8064B1] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#51463F] hover:bg-[#F3EDE6]'
                }`}
              >
                <Briefcase size={13} />
                <span>Service Requests</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'SERVICE' ? 'bg-white/25 text-white' : 'bg-[#EDE2D7] text-[#82776E]'
                }`}>
                  {counts.service}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('MEETING')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'MEETING'
                    ? 'bg-[#8064B1] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#51463F] hover:bg-[#F3EDE6]'
                }`}
              >
                <Video size={13} />
                <span>Meetings & Calls</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'MEETING' ? 'bg-white/25 text-white' : 'bg-[#EDE2D7] text-[#82776E]'
                }`}>
                  {counts.meeting}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('FUNDING_IDEA')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'FUNDING_IDEA'
                    ? 'bg-[#8064B1] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#51463F] hover:bg-[#F3EDE6]'
                }`}
              >
                <Lightbulb size={13} />
                <span>Funding & Ideas</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'FUNDING_IDEA' ? 'bg-white/25 text-white' : 'bg-[#EDE2D7] text-[#82776E]'
                }`}>
                  {counts.fundingIdea}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('WALLET_SYSTEM')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'WALLET_SYSTEM'
                    ? 'bg-[#8064B1] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#51463F] hover:bg-[#F3EDE6]'
                }`}
              >
                <Wallet size={13} />
                <span>System & Wallet</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'WALLET_SYSTEM' ? 'bg-white/25 text-white' : 'bg-[#EDE2D7] text-[#82776E]'
                }`}>
                  {counts.walletSystem}
                </span>
              </button>
            </div>
          </div>

          {/* Notifications Scrollable Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#EDE2D7]/70 p-1 sm:p-2">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#EDE2D7] flex items-center justify-center mx-auto text-[#A0958C]">
                  <Inbox size={26} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#51463F]">No notifications found</h4>
                  <p className="text-xs text-[#82776E] mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? `No notifications matched "${searchQuery}". Try different search terms or clear filters.`
                      : activeTab === 'UNREAD'
                      ? 'You have caught up with all updates! No unread notifications.'
                      : 'There are no notifications in this category yet.'}
                  </p>
                </div>
                {(searchQuery || activeTab !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTab('ALL');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EDE6] text-xs font-bold text-[#8064B1] transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 sm:p-4 rounded-xl transition-all cursor-pointer flex items-start gap-3.5 group ${
                    notif.isRead
                      ? 'bg-white hover:bg-[#FAF7F2]/80 opacity-85'
                      : 'bg-[#FFF9F6] hover:bg-[#FFF2EC] border-l-4 border-[#E8795B]'
                  }`}
                >
                  {/* Category Icon */}
                  {renderIcon(notif)}

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {renderBadge(notif)}
                      <span className="text-[11px] text-[#A0958C] flex items-center gap-1 font-medium">
                        <Clock size={11} />
                        <span>{formatNotificationTime(notif.createdAt)}</span>
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#E8795B]" title="Unread" />
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-[#51463F] group-hover:text-[#8064B1] transition-colors line-clamp-1">
                      {notif.title}
                    </h4>

                    <p className="text-xs text-[#82776E] mt-1 leading-relaxed line-clamp-3">
                      {notif.message}
                    </p>
                  </div>

                  {/* Actions on card */}
                  <div className="flex flex-col items-end gap-2 shrink-0 self-center">
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleSingleMarkRead(notif.id, e)}
                        className="text-[10px] font-extrabold text-[#8064B1] hover:underline px-2 py-1 rounded-lg hover:bg-white"
                        title="Mark this notification as read"
                      >
                        Mark Read
                      </button>
                    )}
                    <span className="text-xs text-[#82776E] group-hover:text-[#8064B1] group-hover:translate-x-0.5 transition-all">
                      &rarr;
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 bg-[#FAF7F2] border-t border-[#EDE2D7] flex items-center justify-between text-xs text-[#82776E]">
            <span>
              Showing {filteredNotifications.length} of {notifications.length} notification{notifications.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-[#EDE2D7] font-bold text-[#51463F] transition-all cursor-pointer shadow-2xs"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

