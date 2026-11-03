import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getStoredUser,
  getUserMeetings,
  scheduleMeeting,
  rescheduleMeeting,
  cancelMeeting,
  MeetingItem,
  MeetingMode,
  MeetingStatus
} from '../services/api';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceKpi,
  WorkspaceButton,
  WorkspaceBadge,
  WorkspaceEmptyState
} from '../components/workspace/WorkspaceComponents';
import { AnimatedModal, AnimatedCounter, StaggerContainer, StaggerItem } from '../motion';
import {
  CalendarIcon,
  VideoIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  ShieldCheckIcon,
  PlusIcon,
  SearchIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  SparklesIcon
} from '../components/Icons';

export const MeetingsPage: React.FC = () => {
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_demo';

  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'scheduled' | 'pending' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<MeetingItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MeetingItem | null>(null);

  // New Meeting Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Service Scope Alignment');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('11:00 AM - 11:45 AM IST');
  const [newMode, setNewMode] = useState<MeetingMode>('VIRTUAL_MEET');
  const [newAgenda, setNewAgenda] = useState('');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Reschedule Form state
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00 AM - 11:45 AM IST');

  // Load meetings
  const reloadMeetings = () => {
    const list = getUserMeetings(userId);
    setMeetings(list);
  };

  useEffect(() => {
    reloadMeetings();
  }, [userId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // KPI Calculations
  const totalCount = meetings.length;
  const scheduledCount = meetings.filter((m) => m.status === 'SCHEDULED').length;
  const pendingCount = meetings.filter((m) => m.status === 'PENDING_COORDINATION').length;
  const completedCount = meetings.filter((m) => m.status === 'COMPLETED').length;

  // Filtered Meetings
  const filteredMeetings = meetings.filter((m) => {
    if (filterTab === 'scheduled' && m.status !== 'SCHEDULED') return false;
    if (filterTab === 'pending' && m.status !== 'PENDING_COORDINATION') return false;
    if (filterTab === 'completed' && m.status !== 'COMPLETED') return false;
    if (filterTab === 'cancelled' && m.status !== 'CANCELLED') return false;

    if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchAgenda = m.agenda.toLowerCase().includes(q);
      const matchFacilitator = m.facilitatorName.toLowerCase().includes(q);
      const matchCategory = m.category.toLowerCase().includes(q);
      if (!matchTitle && !matchAgenda && !matchFacilitator && !matchCategory) return false;
    }

    return true;
  });

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !newAgenda.trim()) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    setFormError('');

    scheduleMeeting(userId, {
      title: newTitle.trim(),
      category: newCategory,
      scheduledDate: newDate,
      scheduledTime: newTime,
      mode: newMode,
      agenda: newAgenda.trim()
    });

    setIsScheduleModalOpen(false);
    setNewTitle('');
    setNewAgenda('');
    setNewDate('');
    reloadMeetings();
    showToast('Consultation request submitted! FIC Coordinator assigned.');
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !rescheduleDate) return;

    rescheduleMeeting(rescheduleTarget.id, rescheduleDate, rescheduleTime);
    setRescheduleTarget(null);
    reloadMeetings();
    showToast('Session slot updated successfully.');
  };

  const handleCancelSubmit = () => {
    if (!cancelTarget) return;

    cancelMeeting(cancelTarget.id);
    setCancelTarget(null);
    reloadMeetings();
    showToast('Session cancelled.');
  };

  const todayDateString = new Date().toISOString().split('T')[0];

  return (
    <WorkspaceShell maxWidth="6xl">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-50 bg-[#29302D] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#D99B43]/30 text-xs sm:text-sm font-bold"
          >
            <CheckCircleIcon size={18} className="text-[#2E7D32]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="violet"
        badge={
          <div className="flex items-center gap-2">
            <WorkspaceBadge variant="luxury">
              <SparklesIcon size={12} className="text-[#8064A9]" />
              Intermediary Desk
            </WorkspaceBadge>
            <span className="text-[11px] font-bold text-[#8064A9] bg-white/80 border border-[#8064A9]/30 px-2.5 py-0.5 rounded-lg">
              Facilitated Sessions
            </span>
          </div>
        }
        title="Consultations & Facilitated Meetings"
        subtitle="Review, schedule, and join verified virtual consultations or in-person hub meetings with FIC Sector Directors, project mentors, and corporate alliance coordinators."
        rightActions={
          <WorkspaceButton
            variant="violet"
            size="md"
            icon={<PlusIcon size={15} />}
            onClick={() => setIsScheduleModalOpen(true)}
          >
            Schedule Consultation
          </WorkspaceButton>
        }
      />

      {/* ========================================================
          2. KPI SUMMARY METRICS WITH NUMERIC ANIMATION
         ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <WorkspaceKpi
          title="Total Consultations"
          value={<AnimatedCounter value={totalCount} />}
          subtitle="All recorded sessions"
          icon={<CalendarIcon size={18} />}
          accent="violet"
        />
        <WorkspaceKpi
          title="Confirmed Upcoming"
          value={<AnimatedCounter value={scheduledCount} />}
          subtitle="Ready to join"
          icon={<ClockIcon size={18} />}
          accent="coral"
        />
        <WorkspaceKpi
          title="Pending Coordination"
          value={<AnimatedCounter value={pendingCount} />}
          subtitle="Coordinator matching slot"
          icon={<AlertCircleIcon size={18} />}
          accent="amber"
        />
        <WorkspaceKpi
          title="Completed Sessions"
          value={<AnimatedCounter value={completedCount} />}
          subtitle="Advisory summaries logged"
          icon={<CheckCircleIcon size={18} />}
          accent="violet"
        />
      </div>

      {/* ========================================================
          3. TABS & SEARCH / FILTER CONTROLS WITH GLIDING INDICATOR
         ======================================================== */}
      <WorkspaceCard variant="glass" padded={false} className="p-5 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#EADFCF]/70 pb-3">
          {[
            { key: 'all', label: 'All Consultations', count: totalCount },
            { key: 'scheduled', label: 'Upcoming / Scheduled', count: scheduledCount },
            { key: 'pending', label: 'Pending Coordination', count: pendingCount },
            { key: 'completed', label: 'Completed', count: completedCount },
            { key: 'cancelled', label: 'Cancelled', count: meetings.filter((m) => m.status === 'CANCELLED').length }
          ].map((tab) => {
            const isActive = filterTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key as any)}
                className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors flex items-center gap-2 cursor-pointer ${
                  isActive ? 'text-[#FCFAF6]' : 'text-[#77786E] hover:text-[#29302D]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="meetingsFilterIndicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    className="absolute inset-0 bg-[#29302D] rounded-xl shadow-sm -z-0"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#EADFCF]/70 text-[#29302D]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77786E]" />
            <input
              type="text"
              placeholder="Search by topic, agenda keyword, or coordinator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#EADFCF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064A9] text-[#29302D] shadow-2xs"
            />
          </div>

          <div className="sm:w-64">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#EADFCF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064A9] text-[#29302D] shadow-2xs font-semibold"
            >
              <option value="ALL">All Categories</option>
              <option value="Service Scope Alignment">Service Scope Alignment</option>
              <option value="Business Scaling Advisory">Business Scaling Advisory</option>
              <option value="Investment Pitch Review">Investment Pitch Review</option>
              <option value="B2B Partnership Exploration">B2B Partnership Exploration</option>
              <option value="FIC Opportunity Consultation">FIC Opportunity Consultation</option>
            </select>
          </div>
        </div>
      </WorkspaceCard>

      {/* ========================================================
          4. MEETINGS LISTING (ANIMATED LAYOUT & SPRING HOVER)
         ======================================================== */}
      <motion.div layout className="space-y-5">
        <AnimatePresence mode="popLayout">
          {filteredMeetings.length === 0 ? (
            <motion.div
              key="empty-meetings"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              <WorkspaceEmptyState
                icon={<CalendarIcon size={28} />}
                title="No Consultations Found"
                description={
                  searchQuery || categoryFilter !== 'ALL' || filterTab !== 'all'
                    ? 'No meetings match your active filter criteria. Try resetting filters.'
                    : 'You have not scheduled any consultations yet. Connect with certified FIC specialists for project scope alignment, growth advisory, or partnership coordination.'
                }
                actionText="Schedule Consultation"
                onAction={() => setIsScheduleModalOpen(true)}
                accent="violet"
              />
            </motion.div>
          ) : (
            filteredMeetings.map((meeting) => {
              const isScheduled = meeting.status === 'SCHEDULED';
              const isPending = meeting.status === 'PENDING_COORDINATION';
              const isCompleted = meeting.status === 'COMPLETED';
              const isCancelled = meeting.status === 'CANCELLED';

              return (
                <motion.div
                  key={meeting.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                >
                  <div className="bg-white/95 rounded-3xl border border-[#EADFCF] p-6 shadow-[0_4px_20px_-4px_rgba(41,48,45,0.05)] hover:border-[#8064A9]/40 transition-all flex flex-col justify-between gap-5">
                    {/* Top Row */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-[#8064A9]/10 text-[#8064A9] font-black text-xs uppercase tracking-wide">
                            {meeting.category}
                          </span>
                          <span className="text-xs text-[#77786E] font-semibold">ID: {meeting.id}</span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isScheduled && (
                            <WorkspaceBadge variant="active">
                              <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
                              SCHEDULED
                            </WorkspaceBadge>
                          )}
                          {isPending && (
                            <WorkspaceBadge variant="pending">
                              <ClockIcon size={12} />
                              PENDING COORDINATION
                            </WorkspaceBadge>
                          )}
                          {isCompleted && (
                            <WorkspaceBadge variant="proposal">
                              <CheckCircleIcon size={12} />
                              COMPLETED
                            </WorkspaceBadge>
                          )}
                          {isCancelled && (
                            <WorkspaceBadge variant="neutral">
                              CANCELLED
                            </WorkspaceBadge>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg sm:text-xl font-black text-[#29302D] leading-snug">
                        {meeting.title}
                      </h3>

                      {/* Metadata Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs sm:text-sm text-[#77786E]">
                        {/* Date & Time */}
                        <div className="flex items-center gap-2.5 bg-[#FAF7F2] px-3.5 py-2.5 rounded-2xl border border-[#EADFCF]/60">
                          <CalendarIcon size={18} className="text-[#8064A9] shrink-0" />
                          <div>
                            <span className="font-black text-[#29302D] block">{meeting.scheduledDate}</span>
                            <span className="text-[11px] text-[#77786E] font-medium">{meeting.scheduledTime}</span>
                          </div>
                        </div>

                        {/* Mode */}
                        <div className="flex items-center gap-2.5 bg-[#FAF7F2] px-3.5 py-2.5 rounded-2xl border border-[#EADFCF]/60">
                          {meeting.mode === 'VIRTUAL_MEET' && (
                            <VideoIcon size={18} className="text-[#2E7D32] shrink-0" />
                          )}
                          {meeting.mode === 'IN_PERSON' && (
                            <MapPinIcon size={18} className="text-[#C66B52] shrink-0" />
                          )}
                          {meeting.mode === 'PHONE' && (
                            <PhoneIcon size={18} className="text-[#8064A9] shrink-0" />
                          )}
                          <div>
                            <span className="font-black text-[#29302D] block">{meeting.modeLabel}</span>
                            <span className="text-[11px] text-[#77786E] truncate block max-w-[160px]">
                              {meeting.locationOrUrl}
                            </span>
                          </div>
                        </div>

                        {/* Facilitator */}
                        <div className="flex items-center gap-2.5 bg-[#FAF7F2] px-3.5 py-2.5 rounded-2xl border border-[#EADFCF]/60">
                          <div className="w-8 h-8 rounded-xl bg-[#8064A9] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            FIC
                          </div>
                          <div>
                            <span className="font-black text-[#29302D] block truncate max-w-[160px]">
                              {meeting.facilitatorName}
                            </span>
                            <span className="text-[11px] text-[#8064A9] font-bold block truncate max-w-[160px]">
                              {meeting.facilitatorRole}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Agenda */}
                      <div className="pt-2 text-xs text-[#77786E] leading-relaxed">
                        <strong className="text-[#29302D] font-black mr-1">Discussion Scope:</strong>
                        <span>{meeting.agenda}</span>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="pt-4 border-t border-[#EADFCF]/70 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-[#77786E]">
                        <ShieldCheckIcon size={14} className="text-[#2E7D32]" />
                        <span>Facilitated under FIC Intermediary Non-Disclosure Governance</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isScheduled && (
                          <a
                            href={meeting.locationOrUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <VideoIcon size={14} />
                            <span>Join Session Room</span>
                          </a>
                        )}

                        {(isScheduled || isPending) && (
                          <>
                            <WorkspaceButton
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRescheduleTarget(meeting);
                                setRescheduleDate(meeting.scheduledDate);
                                setRescheduleTime(meeting.scheduledTime);
                              }}
                            >
                              Reschedule
                            </WorkspaceButton>
                            <WorkspaceButton
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancelTarget(meeting)}
                            >
                              Cancel
                            </WorkspaceButton>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* ========================================================
          5. SCHEDULE CONSULTATION ANIMATED MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        maxWidth="max-w-xl"
        title={
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#8064A9]">FIC Facilitated Session</span>
            <h3 className="text-xl font-black text-[#29302D] mt-0.5">Schedule Facilitated Consultation</h3>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircleIcon size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-black text-[#29302D] mb-1.5">Consultation Category *</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EADFCF] rounded-xl focus:ring-2 focus:ring-[#8064A9] text-[#29302D] font-semibold"
              >
                <option value="Service Scope Alignment">Service Scope Alignment (Marketplace Services)</option>
                <option value="Business Scaling Advisory">Business Scaling Advisory (Tech, Ops & Expansion)</option>
                <option value="Investment Pitch Review">Investment Pitch Review (Private Syndicate Prep)</option>
                <option value="B2B Partnership Exploration">B2B Partnership Exploration (OEM & Supply Chain)</option>
                <option value="FIC Opportunity Consultation">FIC Opportunity Consultation (General Ecosystem Guidance)</option>
              </select>
            </div>

            <div>
              <label className="block font-black text-[#29302D] mb-1.5">Topic or Subject *</label>
              <input
                type="text"
                placeholder="e.g. Cloud SaaS Architecture Alignment or Factory Modernization Scope"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EADFCF] rounded-xl focus:ring-2 focus:ring-[#8064A9] text-[#29302D]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-[#29302D] mb-1.5">Preferred Date *</label>
                <input
                  type="date"
                  min={todayDateString}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EADFCF] rounded-xl focus:ring-2 focus:ring-[#8064A9] text-[#29302D]"
                />
              </div>
              <div>
                <label className="block font-black text-[#29302D] mb-1.5">Preferred Slot *</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EADFCF] rounded-xl focus:ring-2 focus:ring-[#8064A9] text-[#29302D] font-semibold"
                >
                  <option value="10:00 AM - 10:45 AM IST">Morning: 10:00 AM - 10:45 AM</option>
                  <option value="11:00 AM - 11:45 AM IST">Morning: 11:00 AM - 11:45 AM</option>
                  <option value="02:30 PM - 03:15 PM IST">Afternoon: 02:30 PM - 03:15 PM</option>
                  <option value="04:00 PM - 04:45 PM IST">Afternoon: 04:00 PM - 04:45 PM</option>
                  <option value="05:30 PM - 06:15 PM IST">Evening: 05:30 PM - 06:15 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-black text-[#29302D] mb-1.5">Meeting Mode *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewMode('VIRTUAL_MEET')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    newMode === 'VIRTUAL_MEET'
                      ? 'border-[#2E7D32] bg-[#2E7D32]/10 text-[#2E7D32] font-black'
                      : 'border-[#EADFCF] bg-white text-[#77786E]'
                  }`}
                >
                  Virtual Meet
                </button>
                <button
                  type="button"
                  onClick={() => setNewMode('IN_PERSON')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    newMode === 'IN_PERSON'
                      ? 'border-[#C66B52] bg-[#C66B52]/10 text-[#C66B52] font-black'
                      : 'border-[#EADFCF] bg-white text-[#77786E]'
                  }`}
                >
                  In-Person Hub
                </button>
                <button
                  type="button"
                  onClick={() => setNewMode('PHONE')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    newMode === 'PHONE'
                      ? 'border-[#8064A9] bg-[#8064A9]/10 text-[#8064A9] font-black'
                      : 'border-[#EADFCF] bg-white text-[#77786E]'
                  }`}
                >
                  Phone Call
                </button>
              </div>
            </div>

            <div>
              <label className="block font-black text-[#29302D] mb-1.5">Discussion Agenda & Scope *</label>
              <textarea
                rows={3}
                placeholder="Outline key discussion points, required outcomes, and specific questions..."
                value={newAgenda}
                onChange={(e) => setNewAgenda(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EADFCF] rounded-xl focus:ring-2 focus:ring-[#8064A9] text-[#29302D]"
              ></textarea>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-[#EADFCF]">
              <WorkspaceButton variant="outline" size="sm" type="button" onClick={() => setIsScheduleModalOpen(false)}>
                Cancel
              </WorkspaceButton>
              <WorkspaceButton variant="charcoal" size="sm" type="submit">
                Confirm Consultation Request
              </WorkspaceButton>
            </div>
          </form>
        </div>
      </AnimatedModal>

      {/* ========================================================
          6. RESCHEDULE ANIMATED MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        maxWidth="max-w-md"
        title="Reschedule Consultation"
      >
        {rescheduleTarget && (
          <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs sm:text-sm">
            <p className="text-xs text-[#77786E] mb-2">Request a new date or time slot for this session.</p>

            <div>
              <label className="block font-black text-[#29302D] mb-1.5">New Date *</label>
              <input
                type="date"
                min={todayDateString}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#EADFCF] rounded-xl focus:ring-2 focus:ring-[#8064A9] text-[#29302D]"
              />
            </div>

            <div>
              <label className="block font-black text-[#29302D] mb-1.5">New Slot *</label>
              <select
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EADFCF] rounded-xl focus:ring-2 focus:ring-[#8064A9] text-[#29302D] font-semibold"
              >
                <option value="10:00 AM - 10:45 AM IST">Morning: 10:00 AM - 10:45 AM</option>
                <option value="11:00 AM - 11:45 AM IST">Morning: 11:00 AM - 11:45 AM</option>
                <option value="02:30 PM - 03:15 PM IST">Afternoon: 02:30 PM - 03:15 PM</option>
                <option value="04:00 PM - 04:45 PM IST">Afternoon: 04:00 PM - 04:45 PM</option>
                <option value="05:30 PM - 06:15 PM IST">Evening: 05:30 PM - 06:15 PM</option>
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-[#EADFCF]">
              <WorkspaceButton variant="outline" size="sm" type="button" onClick={() => setRescheduleTarget(null)}>
                Cancel
              </WorkspaceButton>
              <WorkspaceButton variant="charcoal" size="sm" type="submit">
                Confirm Reschedule
              </WorkspaceButton>
            </div>
          </form>
        )}
      </AnimatedModal>

      {/* ========================================================
          7. CANCEL CONFIRMATION ANIMATED MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        maxWidth="max-w-sm"
        title="Cancel Consultation?"
      >
        {cancelTarget && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C66B52]/10 text-[#C66B52] flex items-center justify-center mx-auto">
              <AlertCircleIcon size={24} />
            </div>
            <p className="text-xs text-[#77786E] leading-relaxed">
              Are you sure you want to cancel the session <strong>"{cancelTarget.title}"</strong>?
            </p>
            <div className="flex justify-center gap-3 pt-2 border-t border-[#EADFCF]">
              <WorkspaceButton variant="outline" size="sm" onClick={() => setCancelTarget(null)}>
                Keep Session
              </WorkspaceButton>
              <WorkspaceButton variant="primary" size="sm" onClick={handleCancelSubmit}>
                Yes, Cancel
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>
    </WorkspaceShell>
  );
};

export default MeetingsPage;
