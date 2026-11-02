import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Handle Schedule Submit
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Please enter a meeting topic or title.');
      return;
    }
    if (!newDate) {
      setFormError('Please select a preferred meeting date.');
      return;
    }
    if (!newAgenda.trim()) {
      setFormError('Please provide a brief agenda or description of discussion requirements.');
      return;
    }

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
    setFormError('');
    reloadMeetings();
    showToast('Consultation request submitted! FIC Desk coordinator is scheduling your session.');
  };

  // Handle Reschedule Submit
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !rescheduleDate) return;

    rescheduleMeeting(rescheduleTarget.id, rescheduleDate, rescheduleTime);
    setRescheduleTarget(null);
    reloadMeetings();
    showToast('Reschedule request sent to FIC coordinator for confirmation.');
  };

  // Handle Cancel Submit
  const handleCancelSubmit = () => {
    if (!cancelTarget) return;
    cancelMeeting(cancelTarget.id);
    setCancelTarget(null);
    reloadMeetings();
    showToast('Meeting cancelled successfully.');
  };

  const todayDateString = new Date().toISOString().split('T')[0];

  return (
    <WorkspaceShell maxWidth="7xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#29302D] text-[#FCFAF6] px-5 py-3.5 rounded-2xl shadow-2xl border border-[#D99B43]/40 flex items-center gap-3 animate-fade-in max-w-md">
          <CheckCircleIcon size={20} className="text-[#2E7D32] shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="violet"
        badge={
          <div className="flex items-center gap-2">
            <WorkspaceBadge variant="luxury">
              <CalendarIcon size={12} className="text-[#8064A9]" />
              Facilitated Consultations
            </WorkspaceBadge>
            <span className="text-[11px] font-bold text-[#8064A9] bg-white/80 border border-[#8064A9]/30 px-2.5 py-0.5 rounded-lg">
              FIC Desk Scheduled
            </span>
          </div>
        }
        title="Consultations & Meetings"
        subtitle="Review scheduled video conferences, on-site hub sessions, and FIC-coordinated discussions. All communications maintain member confidentiality and technical integrity."
        rightActions={
          <WorkspaceButton
            variant="charcoal"
            size="md"
            icon={<PlusIcon size={16} />}
            onClick={() => {
              setFormError('');
              setIsScheduleModalOpen(true);
            }}
          >
            Schedule Consultation
          </WorkspaceButton>
        }
      />

      {/* ========================================================
          2. 4 KPI SUMMARY CARDS
         ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <WorkspaceKpi
          title="Total Consultations"
          value={totalCount}
          subtitle="All coordinated sessions"
          icon={<CalendarIcon size={18} />}
          accent="coral"
        />
        <WorkspaceKpi
          title="Upcoming & Scheduled"
          value={scheduledCount}
          subtitle="Confirmed active sessions"
          icon={<VideoIcon size={18} />}
          accent="emerald"
        />
        <WorkspaceKpi
          title="Pending Coordination"
          value={pendingCount}
          subtitle="FIC Desk assigning expert"
          icon={<ClockIcon size={18} />}
          accent="amber"
        />
        <WorkspaceKpi
          title="Completed Sessions"
          value={completedCount}
          subtitle="Advisory summaries logged"
          icon={<CheckCircleIcon size={18} />}
          accent="violet"
        />
      </div>

      {/* ========================================================
          3. TABS & SEARCH / FILTER CONTROLS
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
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                filterTab === tab.key
                  ? 'bg-[#29302D] text-[#FCFAF6] shadow-sm'
                  : 'text-[#77786E] hover:text-[#29302D] hover:bg-[#F5EBDD]/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${
                  filterTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#EADFCF]/70 text-[#29302D]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
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
          4. MEETINGS LISTING
         ======================================================== */}
      {filteredMeetings.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredMeetings.map((meeting) => {
            const isScheduled = meeting.status === 'SCHEDULED';
            const isPending = meeting.status === 'PENDING_COORDINATION';
            const isCompleted = meeting.status === 'COMPLETED';
            const isCancelled = meeting.status === 'CANCELLED';

            return (
              <motion.div
                key={meeting.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
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
                          <span className="text-[11px] text-[#77786E] truncate max-w-[180px] block">
                            {meeting.locationOrUrl || 'Assigned by FIC Desk'}
                          </span>
                        </div>
                      </div>

                      {/* Facilitator */}
                      <div className="flex items-center gap-2.5 bg-[#FAF7F2] px-3.5 py-2.5 rounded-2xl border border-[#EADFCF]/60">
                        <ShieldCheckIcon size={18} className="text-[#D99B43] shrink-0" />
                        <div>
                          <span className="font-black text-[#29302D] block truncate max-w-[170px]">
                            {meeting.facilitatorName}
                          </span>
                          <span className="text-[11px] text-[#77786E] truncate max-w-[170px] block">
                            {meeting.facilitatorRole}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Agenda */}
                    <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EADFCF]/80 text-xs sm:text-sm">
                      <span className="font-black text-[#29302D] block mb-1">Session Agenda & Scope:</span>
                      <p className="text-[#29302D]/85 leading-relaxed">{meeting.agenda}</p>
                    </div>

                    {/* Coordinator Notes */}
                    {meeting.coordinatorNotes && (
                      <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-[#8064A9]/8 border border-[#8064A9]/20 text-xs">
                        <AlertCircleIcon size={16} className="text-[#8064A9] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-black text-[#8064A9] block">FIC Coordination Desk:</span>
                          <span className="text-[#29302D]/80 leading-normal">{meeting.coordinatorNotes}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action Row */}
                  <div className="pt-3 border-t border-[#EADFCF] flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11.5px] text-[#77786E] flex items-center gap-1.5 font-medium">
                      <ShieldCheckIcon size={14} className="text-[#2E7D32]" />
                      <span>Protected by FIC Intermediary Privacy Protocol</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {isScheduled && meeting.mode === 'VIRTUAL_MEET' && meeting.locationOrUrl && (
                        <a
                          href={meeting.locationOrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-black rounded-xl shadow-xs transition-colors"
                        >
                          <VideoIcon size={15} />
                          <span>Join Session</span>
                        </a>
                      )}

                      {!isCompleted && !isCancelled && (
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
                      )}

                      {!isCompleted && !isCancelled && (
                        <WorkspaceButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelTarget(meeting)}
                          className="text-[#C66B52] hover:bg-[#FFF4F0]"
                        >
                          Cancel
                        </WorkspaceButton>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          5. SCHEDULE CONSULTATION MODAL
         ======================================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#FAF7F2] border border-[#EADFCF] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-[#EADFCF] pb-4 mb-5">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#8064A9]">FIC Facilitated Session</span>
                <h3 className="text-xl font-black text-[#29302D] mt-0.5">Schedule Facilitated Consultation</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white border border-[#EADFCF] text-[#77786E] hover:text-[#29302D] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
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
        </div>
      )}

      {/* ========================================================
          6. RESCHEDULE MODAL
         ======================================================== */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#FAF7F2] border border-[#EADFCF] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <h3 className="text-lg font-black text-[#29302D] mb-1">Reschedule Consultation</h3>
            <p className="text-xs text-[#77786E] mb-4">Request a new date or time slot for this session.</p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs sm:text-sm">
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
          </div>
        </div>
      )}

      {/* ========================================================
          7. CANCEL CONFIRMATION MODAL
         ======================================================== */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#FAF7F2] border border-[#EADFCF] rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C66B52]/10 text-[#C66B52] flex items-center justify-center mx-auto">
              <AlertCircleIcon size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#29302D]">Cancel Consultation?</h3>
              <p className="text-xs text-[#77786E] mt-1 leading-relaxed">
                Are you sure you want to cancel the session <strong>"{cancelTarget.title}"</strong>?
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <WorkspaceButton variant="outline" size="sm" onClick={() => setCancelTarget(null)}>
                Keep Session
              </WorkspaceButton>
              <WorkspaceButton variant="primary" size="sm" onClick={handleCancelSubmit}>
                Yes, Cancel
              </WorkspaceButton>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
};

export default MeetingsPage;
