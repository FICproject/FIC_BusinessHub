import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@fic/ui';
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
  CalendarIcon,
  VideoIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  ShieldCheckIcon,
  PlusIcon,
  SearchIcon,
  AlertCircleIcon,
  CheckCircleIcon
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
    // Status tab filter
    if (filterTab === 'scheduled' && m.status !== 'SCHEDULED') return false;
    if (filterTab === 'pending' && m.status !== 'PENDING_COORDINATION') return false;
    if (filterTab === 'completed' && m.status !== 'COMPLETED') return false;
    if (filterTab === 'cancelled' && m.status !== 'CANCELLED') return false;

    // Category filter
    if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false;

    // Search query filter
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

  // Today's date for date-picker min constraint
  const todayDateString = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#29302D] text-[#FCFAF6] px-5 py-3.5 rounded-xl shadow-xl border border-[#D99B43]/40 flex items-center gap-3 animate-fade-in max-w-md">
          <CheckCircleIcon size={20} className="text-[#27AE60] shrink-0" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* ========================================================
          1. HEADER & TOP ACTIONS
         ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8DBC8] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8064A9]/10 border border-[#8064A9]/30 text-[#8064A9] text-xs font-bold uppercase tracking-wider mb-2">
            <CalendarIcon size={14} />
            <span>Facilitated Member Consultations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#29302D] tracking-tight">
            Consultations & Meetings
          </h1>
          <p className="text-sm sm:text-base text-[#77786E] mt-1 max-w-2xl">
            Review scheduled video conferences, on-site hub sessions, and FIC-coordinated discussions. All communications maintain member confidentiality.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => {
              setFormError('');
              setIsScheduleModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#29302D] hover:bg-[#8064A9] text-[#FCFAF6] px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
          >
            <PlusIcon size={16} />
            <span>Schedule Consultation</span>
          </Button>
        </div>
      </div>

      {/* ========================================================
          2. KPI SUMMARY CARDS
         ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Meetings */}
        <div className="bg-[#FFF9F0] border border-[#E8DBC8] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#77786E] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Consultations</span>
            <div className="w-8 h-8 rounded-lg bg-[#29302D]/5 flex items-center justify-center text-[#29302D]">
              <CalendarIcon size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-[#29302D]">{totalCount}</div>
          <div className="text-xs text-[#77786E] mt-1">All coordinated sessions</div>
        </div>

        {/* Upcoming & Scheduled */}
        <div className="bg-[#FFF9F0] border border-[#27AE60]/30 rounded-2xl p-5 shadow-xs bg-linear-to-br from-[#FFF9F0] to-[#27AE60]/5">
          <div className="flex items-center justify-between text-[#27AE60] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Upcoming & Scheduled</span>
            <div className="w-8 h-8 rounded-lg bg-[#27AE60]/10 flex items-center justify-center text-[#27AE60]">
              <VideoIcon size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-[#27AE60]">{scheduledCount}</div>
          <div className="text-xs text-[#77786E] mt-1">Confirmed with active link / venue</div>
        </div>

        {/* Pending Coordination */}
        <div className="bg-[#FFF9F0] border border-[#D99B43]/30 rounded-2xl p-5 shadow-xs bg-linear-to-br from-[#FFF9F0] to-[#D99B43]/5">
          <div className="flex items-center justify-between text-[#D99B43] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Coordination</span>
            <div className="w-8 h-8 rounded-lg bg-[#D99B43]/10 flex items-center justify-center text-[#D99B43]">
              <ClockIcon size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-[#D99B43]">{pendingCount}</div>
          <div className="text-xs text-[#77786E] mt-1">FIC Desk assigning specialist</div>
        </div>

        {/* Completed */}
        <div className="bg-[#FFF9F0] border border-[#8064A9]/30 rounded-2xl p-5 shadow-xs bg-linear-to-br from-[#FFF9F0] to-[#8064A9]/5">
          <div className="flex items-center justify-between text-[#8064A9] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Sessions</span>
            <div className="w-8 h-8 rounded-lg bg-[#8064A9]/10 flex items-center justify-center text-[#8064A9]">
              <CheckCircleIcon size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-[#8064A9]">{completedCount}</div>
          <div className="text-xs text-[#77786E] mt-1">Advisory summaries recorded</div>
        </div>
      </div>

      {/* ========================================================
          3. TABS & SEARCH / FILTER CONTROLS
         ======================================================== */}
      <div className="bg-[#FFF9F0] border border-[#E8DBC8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#E8DBC8] pb-3">
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
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                filterTab === tab.key
                  ? 'bg-[#29302D] text-[#FCFAF6] shadow-sm'
                  : 'text-[#29302D]/70 hover:text-[#29302D] hover:bg-[#F5EBDD]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                  filterTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#E8DBC8] text-[#29302D]'
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
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#E8DBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064A9]/30 text-[#29302D]"
            />
          </div>

          <div className="sm:w-64">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E8DBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064A9]/30 text-[#29302D]"
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
      </div>

      {/* ========================================================
          4. MEETINGS LISTING
         ======================================================== */}
      {filteredMeetings.length === 0 ? (
        <div className="bg-[#FFF9F0] border border-dashed border-[#E8DBC8] rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#8064A9]/10 text-[#8064A9] flex items-center justify-center mx-auto mb-4">
            <CalendarIcon size={28} />
          </div>
          <h3 className="text-lg font-bold text-[#29302D]">No Consultations Found</h3>
          <p className="text-sm text-[#77786E] max-w-md mx-auto mt-1 mb-5">
            {searchQuery || categoryFilter !== 'ALL' || filterTab !== 'all'
              ? 'No meetings match your active filter criteria. Try resetting filters.'
              : 'You have not scheduled any consultations yet. Connect with certified FIC specialists for project scope alignment, growth advisory, or partnership coordination.'}
          </p>
          <Button
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#29302D] hover:bg-[#8064A9] text-[#FCFAF6] px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm"
          >
            <PlusIcon size={16} />
            <span>Schedule First Consultation</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredMeetings.map((meeting) => {
            const isScheduled = meeting.status === 'SCHEDULED';
            const isPending = meeting.status === 'PENDING_COORDINATION';
            const isCompleted = meeting.status === 'COMPLETED';
            const isCancelled = meeting.status === 'CANCELLED';

            return (
              <div
                key={meeting.id}
                className="bg-[#FFF9F0] border border-[#E8DBC8] rounded-2xl p-5 sm:p-6 shadow-xs hover:border-[#8064A9]/40 transition-all flex flex-col justify-between gap-5"
              >
                {/* Meeting Top Row */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    {/* Category Chip */}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-[#8064A9]/10 text-[#8064A9] font-bold text-xs uppercase tracking-wide">
                        {meeting.category}
                      </span>
                      <span className="text-xs text-[#77786E]">ID: {meeting.id}</span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isScheduled && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#27AE60]/10 border border-[#27AE60]/30 text-[#27AE60] text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-[#27AE60] animate-pulse" />
                          SCHEDULED
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D99B43]/10 border border-[#D99B43]/30 text-[#D99B43] text-xs font-bold">
                          <ClockIcon size={12} />
                          PENDING COORDINATION
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2D9CDB]/10 border border-[#2D9CDB]/30 text-[#2D9CDB] text-xs font-bold">
                          <CheckCircleIcon size={12} />
                          COMPLETED
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#77786E]/10 border border-[#77786E]/30 text-[#77786E] text-xs font-bold">
                          CANCELLED
                        </span>
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
                    <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-xl border border-[#E8DBC8]/60">
                      <CalendarIcon size={16} className="text-[#8064A9] shrink-0" />
                      <div>
                        <span className="font-bold text-[#29302D] block">{meeting.scheduledDate}</span>
                        <span className="text-[11px] text-[#77786E]">{meeting.scheduledTime}</span>
                      </div>
                    </div>

                    {/* Mode */}
                    <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-xl border border-[#E8DBC8]/60">
                      {meeting.mode === 'VIRTUAL_MEET' && (
                        <VideoIcon size={16} className="text-[#27AE60] shrink-0" />
                      )}
                      {meeting.mode === 'IN_PERSON' && (
                        <MapPinIcon size={16} className="text-[#C66B52] shrink-0" />
                      )}
                      {meeting.mode === 'PHONE' && (
                        <PhoneIcon size={16} className="text-[#2D9CDB] shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-[#29302D] block">{meeting.modeLabel}</span>
                        <span className="text-[11px] text-[#77786E] truncate max-w-[180px] block">
                          {meeting.locationOrUrl || 'Assigned by FIC'}
                        </span>
                      </div>
                    </div>

                    {/* Facilitator */}
                    <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-xl border border-[#E8DBC8]/60">
                      <ShieldCheckIcon size={16} className="text-[#D99B43] shrink-0" />
                      <div>
                        <span className="font-bold text-[#29302D] block truncate max-w-[170px]">
                          {meeting.facilitatorName}
                        </span>
                        <span className="text-[11px] text-[#77786E] truncate max-w-[170px] block">
                          {meeting.facilitatorRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Agenda */}
                  <div className="bg-[#FCFAF6] p-4 rounded-xl border border-[#E8DBC8]/80 text-xs sm:text-sm">
                    <span className="font-bold text-[#29302D] block mb-1">Session Agenda & Scope:</span>
                    <p className="text-[#29302D]/85 leading-relaxed">{meeting.agenda}</p>
                  </div>

                  {/* Coordinator Notes */}
                  {meeting.coordinatorNotes && (
                    <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#8064A9]/5 border border-[#8064A9]/20 text-xs">
                      <AlertCircleIcon size={15} className="text-[#8064A9] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#8064A9] block">FIC Coordination Desk:</span>
                        <span className="text-[#29302D]/80 leading-normal">{meeting.coordinatorNotes}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Row */}
                <div className="pt-3 border-t border-[#E8DBC8] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11.5px] text-[#77786E] flex items-center gap-1.5">
                    <ShieldCheckIcon size={14} className="text-[#27AE60]" />
                    <span>Protected by FIC Intermediary Privacy Protocol</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Join Meeting Button */}
                    {isScheduled && meeting.mode === 'VIRTUAL_MEET' && meeting.locationOrUrl && (
                      <a
                        href={meeting.locationOrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#27AE60] hover:bg-[#219653] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
                      >
                        <VideoIcon size={15} />
                        <span>Join Google Meet</span>
                      </a>
                    )}

                    {/* Reschedule Button */}
                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={() => {
                          setRescheduleTarget(meeting);
                          setRescheduleDate(meeting.scheduledDate);
                          setRescheduleTime(meeting.scheduledTime);
                        }}
                        className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#29302D] bg-white border border-[#E8DBC8] hover:border-[#8064A9] hover:text-[#8064A9] rounded-xl transition-colors"
                      >
                        Reschedule
                      </button>
                    )}

                    {/* Cancel Button */}
                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={() => setCancelTarget(meeting)}
                        className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#C66B52] bg-white border border-[#E8DBC8] hover:border-[#C66B52] hover:bg-[#C66B52]/5 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          5. SCHEDULE NEW CONSULTATION MODAL
         ======================================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#FFF9F0] border border-[#E8DBC8] rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-[#E8DBC8] pb-4 mb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8064A9]">FIC Facilitated Session</span>
                <h3 className="text-xl font-black text-[#29302D] mt-0.5">Schedule Facilitated Consultation</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white border border-[#E8DBC8] text-[#77786E] hover:text-[#29302D] flex items-center justify-center"
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
              {/* Category */}
              <div>
                <label className="block font-bold text-[#29302D] mb-1.5">Consultation Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DBC8] rounded-xl focus:ring-2 focus:ring-[#8064A9]/30 text-[#29302D]"
                >
                  <option value="Service Scope Alignment">Service Scope Alignment (Marketplace Services)</option>
                  <option value="Business Scaling Advisory">Business Scaling Advisory (Tech, Ops & Expansion)</option>
                  <option value="Investment Pitch Review">Investment Pitch Review (Private Syndicate Prep)</option>
                  <option value="B2B Partnership Exploration">B2B Partnership Exploration (OEM & Supply Chain)</option>
                  <option value="FIC Opportunity Consultation">FIC Opportunity Consultation (General Ecosystem Guidance)</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-[#29302D] mb-1.5">Topic or Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. Cloud SaaS Architecture Alignment or Factory Modernization Scope"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DBC8] rounded-xl focus:ring-2 focus:ring-[#8064A9]/30 text-[#29302D]"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#29302D] mb-1.5">Preferred Date *</label>
                  <input
                    type="date"
                    min={todayDateString}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8DBC8] rounded-xl focus:ring-2 focus:ring-[#8064A9]/30 text-[#29302D]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#29302D] mb-1.5">Preferred Slot *</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8DBC8] rounded-xl focus:ring-2 focus:ring-[#8064A9]/30 text-[#29302D]"
                  >
                    <option value="10:00 AM - 10:45 AM IST">Morning: 10:00 AM - 10:45 AM</option>
                    <option value="11:00 AM - 11:45 AM IST">Morning: 11:00 AM - 11:45 AM</option>
                    <option value="02:30 PM - 03:15 PM IST">Afternoon: 02:30 PM - 03:15 PM</option>
                    <option value="04:00 PM - 04:45 PM IST">Afternoon: 04:00 PM - 04:45 PM</option>
                    <option value="05:30 PM - 06:15 PM IST">Evening: 05:30 PM - 06:15 PM</option>
                  </select>
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block font-bold text-[#29302D] mb-1.5">Meeting Mode *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMode('VIRTUAL_MEET')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      newMode === 'VIRTUAL_MEET'
                        ? 'border-[#27AE60] bg-[#27AE60]/10 text-[#27AE60] font-bold'
                        : 'border-[#E8DBC8] bg-white text-[#29302D]/70'
                    }`}
                  >
                    <VideoIcon size={18} className="mx-auto mb-1" />
                    <span className="text-xs block">Google Meet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMode('IN_PERSON')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      newMode === 'IN_PERSON'
                        ? 'border-[#C66B52] bg-[#C66B52]/10 text-[#C66B52] font-bold'
                        : 'border-[#E8DBC8] bg-white text-[#29302D]/70'
                    }`}
                  >
                    <MapPinIcon size={18} className="mx-auto mb-1" />
                    <span className="text-xs block">Regional Hub</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMode('PHONE')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      newMode === 'PHONE'
                        ? 'border-[#2D9CDB] bg-[#2D9CDB]/10 text-[#2D9CDB] font-bold'
                        : 'border-[#E8DBC8] bg-white text-[#29302D]/70'
                    }`}
                  >
                    <PhoneIcon size={18} className="mx-auto mb-1" />
                    <span className="text-xs block">Phone Call</span>
                  </button>
                </div>
              </div>

              {/* Agenda */}
              <div>
                <label className="block font-bold text-[#29302D] mb-1.5">Discussion Agenda & Requirements *</label>
                <textarea
                  rows={3}
                  placeholder="Outline your project scope, questions, or specific expectations from the FIC specialist..."
                  value={newAgenda}
                  onChange={(e) => setNewAgenda(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DBC8] rounded-xl focus:ring-2 focus:ring-[#8064A9]/30 text-[#29302D]"
                />
              </div>

              {/* Privacy Notice */}
              <div className="p-3 bg-white rounded-xl border border-[#E8DBC8] flex items-start gap-2.5 text-xs text-[#77786E]">
                <ShieldCheckIcon size={16} className="text-[#27AE60] shrink-0 mt-0.5" />
                <span>
                  <strong>Confidential Intermediary Policy:</strong> Direct contact numbers and company information remain private. A certified FIC coordinator is present during discussions to safeguard mutual interests.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DBC8]">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#77786E] hover:text-[#29302D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#29302D] hover:bg-[#8064A9] text-[#FCFAF6] font-bold rounded-xl shadow-xs transition-colors"
                >
                  Submit Consultation Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          6. RESCHEDULE MODAL
         ======================================================== */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFF9F0] border border-[#E8DBC8] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-black text-[#29302D] mb-1">Reschedule Consultation</h3>
            <p className="text-xs text-[#77786E] mb-4">
              Select a new preferred date and time for: <strong>{rescheduleTarget.title}</strong>
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[#29302D] mb-1">New Preferred Date *</label>
                <input
                  type="date"
                  min={todayDateString}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#29302D] mb-1">New Preferred Slot *</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DBC8] rounded-xl text-[#29302D]"
                >
                  <option value="10:00 AM - 10:45 AM IST">Morning: 10:00 AM - 10:45 AM</option>
                  <option value="11:00 AM - 11:45 AM IST">Morning: 11:00 AM - 11:45 AM</option>
                  <option value="02:30 PM - 03:15 PM IST">Afternoon: 02:30 PM - 03:15 PM</option>
                  <option value="04:00 PM - 04:45 PM IST">Afternoon: 04:00 PM - 04:45 PM</option>
                  <option value="05:30 PM - 06:15 PM IST">Evening: 05:30 PM - 06:15 PM</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DBC8]">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#77786E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#29302D] hover:bg-[#8064A9] text-[#FCFAF6] font-bold rounded-xl text-xs transition-colors"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          7. CANCEL MODAL
         ======================================================== */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFF9F0] border border-[#E8DBC8] rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircleIcon size={24} />
            </div>
            <h3 className="text-base font-black text-[#29302D] mb-1">Cancel Consultation?</h3>
            <p className="text-xs text-[#77786E] mb-5">
              Are you sure you want to cancel the session <strong>&ldquo;{cancelTarget.title}&rdquo;</strong>? The FIC desk will release the coordinator slot.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-[#77786E] bg-white border border-[#E8DBC8] rounded-xl hover:bg-gray-50"
              >
                Keep Session
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;
