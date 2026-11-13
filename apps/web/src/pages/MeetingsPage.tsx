import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  getStoredUser,
  getUserMeetings,
  scheduleMeeting,
  rescheduleMeeting,
  cancelMeeting,
  MeetingItem,
  MeetingMode,
  MeetingStatus,
  getMentorsDirectory,
  createMentorshipRequest,
  getStudentMentorshipRequests,
  getMentorMentorshipRequests,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
  rescheduleMentorshipRequest,
  respondToReschedule,
  completeMentorshipSession,
  IMentorshipRequest,
  IMentorDirectoryItem,
  apiRequest
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
  CheckCircleIcon
} from '../components/Icons';

export const MeetingsPage: React.FC = () => {
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_demo';

  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'scheduled' | 'pending' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // ==========================================
  // STUDENT & MENTOR ECOSYSTEM STATE
  // ==========================================
  const [searchParams] = useSearchParams();
  const isStudent = user?.subCategory?.toLowerCase().includes('student');
  const isMentor =
    user?.subCategory?.toLowerCase().includes('mentor') ||
    user?.subCategory?.toLowerCase().includes('trainer');

  const [mentorshipRequests, setMentorshipRequests] = useState<IMentorshipRequest[]>([]);
  const [mentorsList, setMentorsList] = useState<IMentorDirectoryItem[]>([]);

  // Student: Book a Mentor Form State
  const [isBookMentorModalOpen, setIsBookMentorModalOpen] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [selectedMentorName, setSelectedMentorName] = useState('');
  const [bookPurpose, setBookPurpose] = useState('Career Guidance');
  const [bookTitle, setBookTitle] = useState('');
  const [bookReason, setBookReason] = useState('');
  const [bookStudentLevel, setBookStudentLevel] = useState('Undergraduate');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('18:00');
  const [bookMode, setBookMode] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');

  // Mentor: Action Modals State
  const [acceptingRequest, setAcceptingRequest] = useState<IMentorshipRequest | null>(null);
  const [acceptConfirmedDate, setAcceptConfirmedDate] = useState('');
  const [acceptConfirmedTime, setAcceptConfirmedTime] = useState('');
  const [acceptLocationOrUrl, setAcceptLocationOrUrl] = useState('https://meet.google.com/fic-mentor-session');
  const [acceptMentorNotes, setAcceptMentorNotes] = useState('');

  const [rejectingRequest, setRejectingRequest] = useState<IMentorshipRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [reschedulingRequest, setReschedulingRequest] = useState<IMentorshipRequest | null>(null);
  const [rescheduleDateInput, setRescheduleDateInput] = useState('');
  const [rescheduleTimeInput, setRescheduleTimeInput] = useState('18:00');
  const [rescheduleNotesInput, setRescheduleNotesInput] = useState('');

  const [completingRequest, setCompletingRequest] = useState<IMentorshipRequest | null>(null);
  const [sessionSummaryInput, setSessionSummaryInput] = useState('');
  const [mentorNotesInput, setMentorNotesInput] = useState('');
  const [recommendedMaterialsInput, setRecommendedMaterialsInput] = useState('');
  const [followUpInstructionsInput, setFollowUpInstructionsInput] = useState('');

  const [viewingCompletedRequest, setViewingCompletedRequest] = useState<IMentorshipRequest | null>(null);

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
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);

  // Reschedule Form state
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00 AM - 11:45 AM IST');

  // Load meetings & mentoring data
  const reloadMeetings = async () => {
    try {
      const res = await apiRequest('/investment/my-meetings');
      if (res && res.success && Array.isArray(res.data)) {
        const backendMeetings: MeetingItem[] = res.data.map((m: any) => ({
          id: m._id,
          userId,
          title: m.title,
          category: m.meetingType === 'FUNDING_PITCH' ? 'Funding Pitch & Diligence' : (m.externalParticipants?.[0]?.roleOrCompany || 'Consultation'),
          scheduledDate: m.scheduledAt ? new Date(m.scheduledAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          scheduledTime: m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '11:00 AM',
          mode: 'VIRTUAL_MEET',
          modeLabel: m.meetingLink && m.meetingLink.includes('meet.google') ? 'Google Meet (Encrypted Video)' : (m.status === 'PENDING_COORDINATION' ? 'Awaiting Coordinator Setup' : 'FIC Facilitated Room'),
          locationOrUrl: m.meetingLink || undefined,
          facilitatorName: m.hostAdminId?.name || (m.status === 'PENDING_COORDINATION' ? 'FIC Coordinator Review' : 'FIC Assigned Coordinator'),
          facilitatorRole: m.status === 'PENDING_COORDINATION' ? 'Assigning Specialist...' : 'Verified FIC Coordinator',
          agenda: m.description || 'Consultation session with FIC coordinator regarding verified service requirements.',
          status: (m.status || 'PENDING_COORDINATION') as MeetingStatus,
          createdAt: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Today'
        }));

        setMeetings(backendMeetings);
        return;
      }
    } catch (_err) {
      // Fallback to local
    }
    const list = getUserMeetings(userId);
    setMeetings(list);
  };

  const loadMentoringData = async () => {
    try {
      const mentors = await getMentorsDirectory();
      setMentorsList(mentors);

      if (isStudent) {
        const reqs = await getStudentMentorshipRequests();
        setMentorshipRequests(reqs);
      } else if (isMentor) {
        const reqs = await getMentorMentorshipRequests();
        setMentorshipRequests(reqs);
      }
    } catch (_e) {}
  };

  useEffect(() => {
    reloadMeetings();
    loadMentoringData();

    if (searchParams.get('action') === 'book' || searchParams.get('mentorId')) {
      const mId = searchParams.get('mentorId') || '';
      const mName = searchParams.get('mentorName') || '';
      setSelectedMentorId(mId);
      setSelectedMentorName(mName);
      setIsBookMentorModalOpen(true);
    }
  }, [userId, searchParams, isStudent, isMentor]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Student: Book Mentor Handlers
  const handleOpenBookModal = (mId?: string, mName?: string) => {
    if (mId) setSelectedMentorId(mId);
    if (mName) setSelectedMentorName(mName);
    else if (mentorsList.length > 0 && !selectedMentorId) {
      setSelectedMentorId(mentorsList[0]._id);
      setSelectedMentorName(mentorsList[0].fullName);
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookDate(tomorrow.toISOString().split('T')[0]);
    setIsBookMentorModalOpen(true);
  };

  const handleBookMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMentor = mentorsList.find((m) => m._id === selectedMentorId);
    const mentorName = targetMentor?.fullName || selectedMentorName || 'Accredited FIC Mentor';

    if (!selectedMentorId || !bookDate || !bookTime) {
      showToast('Please select a mentor, date, and preferred time.');
      return;
    }

    await createMentorshipRequest({
      mentorId: selectedMentorId,
      mentorName,
      purpose: bookPurpose,
      title: bookTitle || `${bookPurpose} with ${mentorName}`,
      reason: bookReason || 'Seeking 1-on-1 guidance.',
      studentLevel: bookStudentLevel,
      preferredDate: bookDate,
      preferredTime: bookTime,
      meetingMode: bookMode
    });

    showToast('Mentorship session request submitted to mentor! Awaiting confirmation.');
    setIsBookMentorModalOpen(false);
    loadMentoringData();
  };

  // Mentor: Action Handlers
  const handleOpenAcceptModal = (req: IMentorshipRequest) => {
    setAcceptingRequest(req);
    setAcceptConfirmedDate(req.preferredDate);
    setAcceptConfirmedTime(req.preferredTime);
    setAcceptLocationOrUrl('https://meet.google.com/fic-mentor-session');
    setAcceptMentorNotes('Please review the foundational questions before our call.');
  };

  const handleConfirmAccept = async () => {
    if (!acceptingRequest) return;
    const id = acceptingRequest.id || acceptingRequest._id;
    if (!id) return;

    await acceptMentorshipRequest(id, {
      confirmedDate: acceptConfirmedDate,
      confirmedTime: acceptConfirmedTime,
      locationOrUrl: acceptLocationOrUrl,
      mentorNotes: acceptMentorNotes
    });

    showToast(`Session with ${acceptingRequest.studentName} confirmed and scheduled!`);
    setAcceptingRequest(null);
    loadMentoringData();
  };

  const handleOpenRejectModal = (req: IMentorshipRequest) => {
    setRejectingRequest(req);
    setRejectReason('Schedule fully booked during requested time slot.');
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    const id = rejectingRequest.id || rejectingRequest._id;
    if (!id) return;

    await rejectMentorshipRequest(id, rejectReason);
    showToast('Session request declined with reason.');
    setRejectingRequest(null);
    loadMentoringData();
  };

  const handleOpenRescheduleModal = (req: IMentorshipRequest) => {
    setReschedulingRequest(req);
    setRescheduleDateInput(req.preferredDate);
    setRescheduleTimeInput('19:00');
    setRescheduleNotesInput('Proposing alternate evening slot due to lecture schedule.');
  };

  const handleConfirmReschedule = async () => {
    if (!reschedulingRequest) return;
    const id = reschedulingRequest.id || reschedulingRequest._id;
    if (!id) return;

    await rescheduleMentorshipRequest(id, {
      proposedDate: rescheduleDateInput,
      proposedTime: rescheduleTimeInput,
      proposedNotes: rescheduleNotesInput
    });

    showToast(`Reschedule proposal sent to ${reschedulingRequest.studentName}.`);
    setReschedulingRequest(null);
    loadMentoringData();
  };

  const handleStudentRescheduleResponse = async (reqId: string, action: 'ACCEPT' | 'DECLINE') => {
    await respondToReschedule(reqId, action);
    showToast(action === 'ACCEPT' ? 'Rescheduled meeting confirmed!' : 'Reschedule proposal declined.');
    loadMentoringData();
  };

  const handleOpenCompleteModal = (req: IMentorshipRequest) => {
    setCompletingRequest(req);
    setSessionSummaryInput('');
    setMentorNotesInput('');
    setRecommendedMaterialsInput('');
    setFollowUpInstructionsInput('');
  };

  const handleConfirmComplete = async () => {
    if (!completingRequest) return;
    const id = completingRequest.id || completingRequest._id;
    if (!id) return;

    if (!sessionSummaryInput.trim()) {
      showToast('Please provide a brief session summary.');
      return;
    }

    await completeMentorshipSession(id, {
      sessionSummary: sessionSummaryInput.trim(),
      mentorNotes: mentorNotesInput.trim(),
      recommendedMaterials: recommendedMaterialsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      followUpInstructions: followUpInstructionsInput.trim()
    });

    showToast(`Mentorship session marked as completed with summary notes!`);
    setCompletingRequest(null);
    loadMentoringData();
  };

  // Unified Consultations combining meetings and student mentorship requests
  const unifiedConsultations = React.useMemo(() => {
    const existingMeetingIds = new Set(meetings.map((m) => String(m.id)));
    const mappedMentorship: any[] = [];

    for (const req of mentorshipRequests) {
      const reqId = String(req.requestId || req.id || req._id);
      if (existingMeetingIds.has(reqId)) continue;

      let canonicalStatus: MeetingStatus = 'PENDING_COORDINATION';
      if (req.status === 'CONFIRMED' || req.status === 'SCHEDULED' || req.status === 'ACCEPTED') {
        canonicalStatus = 'SCHEDULED';
      } else if (req.status === 'COMPLETED') {
        canonicalStatus = 'COMPLETED';
      } else if (req.status === 'REJECTED' || req.status === 'CANCELLED') {
        canonicalStatus = 'CANCELLED';
      }

      mappedMentorship.push({
        id: reqId,
        userId,
        title: req.title || (isMentor ? `Mentorship Session: ${req.studentName || 'Student'}` : `Mentorship Session: ${req.mentorName || 'Mentor'}`),
        category: 'Student Mentorship',
        scheduledDate: req.confirmedDate || req.preferredDate || 'TBD',
        scheduledTime: req.confirmedTime || req.preferredTime || '11:00 AM',
        mode: 'VIRTUAL_MEET',
        modeLabel: req.meetingMode === 'ONLINE' ? 'Virtual Video Meet' : 'In-Person Consultation',
        locationOrUrl: req.locationOrUrl,
        facilitatorName: isMentor ? (req.studentName || 'Student') : (req.mentorName || 'Accredited Mentor'),
        facilitatorRole: isMentor ? 'Registered Student' : 'Accredited FIC Mentor',
        agenda: req.reason || '1-on-1 mentorship consultation session',
        status: canonicalStatus,
        createdAt: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Today',
        isMentorship: true,
        mentorshipReq: req
      });
    }

    return [...meetings, ...mappedMentorship];
  }, [meetings, mentorshipRequests, isMentor, userId]);

  // KPI Calculations based on unified consultations
  const totalCount = unifiedConsultations.length;
  const scheduledCount = unifiedConsultations.filter((m) => m.status === 'SCHEDULED').length;
  const pendingCount = unifiedConsultations.filter((m) => m.status === 'PENDING_COORDINATION').length;
  const completedCount = unifiedConsultations.filter((m) => m.status === 'COMPLETED').length;

  // Filtered Meetings from unified consultations
  const filteredMeetings = unifiedConsultations.filter((m) => {
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

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingMeeting) return;

    if (!newTitle.trim() || !newDate || !newAgenda.trim()) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    setFormError('');
    setIsSubmittingMeeting(true);

    try {
      await apiRequest('/meetings/schedule', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          scheduledDate: newDate,
          scheduledTime: newTime,
          mode: newMode,
          agenda: newAgenda.trim()
        })
      });
      // Clear localStorage cache to avoid stale mock duplicates
      localStorage.removeItem('fic_member_meetings_db');
      setIsScheduleModalOpen(false);
      setNewTitle('');
      setNewAgenda('');
      setNewDate('');
      await reloadMeetings();
      showToast('Consultation request submitted! Awaiting coordinator confirmation.');
    } catch (_apiErr: any) {
      // Local fallback only if network completely unavailable
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
      await reloadMeetings();
      showToast('Consultation request saved offline. Awaiting coordinator review.');
    } finally {
      setIsSubmittingMeeting(false);
    }
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
    <WorkspaceShell>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#8064B1] to-[#6E529F] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 text-xs sm:text-sm font-bold"
          >
            <CheckCircleIcon size={18} className="text-[#3B9C91]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="violet"
        title={
          isStudent
            ? 'Student Mentorship Sessions & Consultations'
            : isMentor
            ? 'Incoming Student Requests & Mentorship Sessions'
            : 'Consultations & Facilitated Meetings'
        }
        subtitle={
          isStudent
            ? 'Schedule 1-on-1 strategy sessions with accredited industry and academic mentors, track confirmed slots, and review session notes.'
            : isMentor
            ? 'Review incoming mentorship requests from students, confirm or propose schedule adjustments, and log completed session notes.'
            : 'Review, schedule, and join verified virtual consultations or in-person hub meetings with FIC Sector Directors, project mentors, and corporate alliance coordinators.'
        }
        rightActions={
          isStudent ? (
            <WorkspaceButton
              variant="primary"
              size="md"
              icon={<CalendarIcon size={15} />}
              onClick={() => handleOpenBookModal()}
            >
              Book a Mentor
            </WorkspaceButton>
          ) : (
            <WorkspaceButton
              variant="violet"
              size="md"
              icon={<PlusIcon size={15} />}
              onClick={() => setIsScheduleModalOpen(true)}
            >
              Schedule Consultation
            </WorkspaceButton>
          )
        }
      />

      {/* ========================================================
          2. KPI SUMMARY METRICS WITH NUMERIC ANIMATION
         ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <WorkspaceKpi
          title={isMentor ? 'Student Requests' : isStudent ? 'Mentor Bookings' : 'Total Consultations'}
          value={<AnimatedCounter value={mentorshipRequests.length || totalCount} />}
          subtitle={isMentor ? 'From Registered Students' : isStudent ? 'With FIC Faculty' : 'All recorded sessions'}
          icon={<CalendarIcon size={18} />}
          accent="violet"
        />
        <WorkspaceKpi
          title="Confirmed Upcoming"
          value={
            <AnimatedCounter
              value={
                mentorshipRequests.filter((r) => r.status === 'CONFIRMED' || r.status === 'SCHEDULED').length ||
                scheduledCount
              }
            />
          }
          subtitle="Ready to join"
          icon={<ClockIcon size={18} />}
          accent="coral"
        />
        <WorkspaceKpi
          title="Pending Coordination"
          value={
            <AnimatedCounter
              value={
                mentorshipRequests.filter((r) => r.status === 'PENDING' || r.status === 'RESCHEDULE_REQUESTED').length ||
                pendingCount
              }
            />
          }
          subtitle="Awaiting response"
          icon={<AlertCircleIcon size={18} />}
          accent="amber"
        />
        <WorkspaceKpi
          title="Completed Sessions"
          value={
            <AnimatedCounter
              value={
                mentorshipRequests.filter((r) => r.status === 'COMPLETED').length ||
                completedCount
              }
            />
          }
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
        <div className="flex flex-wrap gap-1.5 border-b border-[#EDE2D7]/70 pb-2.5">
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
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive ? 'text-white' : 'text-[#453A33] hover:text-[#C65638] font-bold'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="meetingsFilterIndicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    className="absolute inset-0 bg-gradient-to-r from-[#8064B1] to-[#6E529F] rounded-lg shadow-[0_2px_8px_rgba(128,100,177,0.25)] -z-0"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#EDE2D7] text-[#51463F]'
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
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#82776E]" />
            <input
              type="text"
              placeholder="Search by topic, agenda keyword, or coordinator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-[13px] bg-white border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] text-[#51463F] shadow-2xs"
            />
          </div>

          <div className="sm:w-60">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-[13px] bg-white border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] text-[#51463F] shadow-2xs font-semibold"
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
      <motion.div layout className="space-y-4">
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
            filteredMeetings.map((meeting: any) => {
              if (meeting.isMentorship && meeting.mentorshipReq) {
                const req = meeting.mentorshipReq;
                const isPending = req.status === 'PENDING';
                const isRescheduled = req.status === 'RESCHEDULE_REQUESTED';
                const isConfirmed = req.status === 'CONFIRMED' || req.status === 'SCHEDULED' || req.status === 'ACCEPTED';
                const isCompleted = req.status === 'COMPLETED';
                const isRejected = req.status === 'REJECTED' || req.status === 'CANCELLED';

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
                    <div className="bg-white/95 rounded-2xl border border-[#EADFCF] p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(41,48,45,0.05)] hover:border-[#8064A9]/40 transition-all flex flex-col justify-between gap-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE2D7]/60 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-[#8064A9] bg-[#8064A9]/10 px-2 py-0.5 rounded-md">
                              {req.purpose || 'Student Mentorship'}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#82776E]">
                              {req.requestId || req.id}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-[#51463F] mt-1">
                            {req.title}
                          </h4>
                        </div>

                        <div>
                          {isConfirmed && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F8F5] text-[#27AE60] border border-[#27AE60]/30 flex items-center gap-1.5">
                              <CheckCircleIcon size={12} />
                              Confirmed & Scheduled
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF9F0] text-[#D99B43] border border-[#D99B43]/30 flex items-center gap-1.5">
                              <ClockIcon size={12} />
                              Awaiting Mentor Action
                            </span>
                          )}
                          {isRescheduled && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F4ECFB] text-[#8064A9] border border-[#8064A9]/30 flex items-center gap-1.5">
                              <CalendarIcon size={12} />
                              Reschedule Proposed
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F4ECFB] text-[#6E529F] border border-[#6E529F]/30 flex items-center gap-1.5">
                              <CheckCircleIcon size={12} />
                              Session Completed
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              Declined
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[#82776E]">
                        <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE2D7]/70">
                          <span className="text-[10px] uppercase font-bold text-[#82776E] block">
                            {isMentor ? 'Student Name:' : 'Mentor Name:'}
                          </span>
                          <span className="font-bold text-[#51463F] text-xs">
                            {isMentor ? req.studentName : req.mentorName}
                          </span>
                        </div>

                        <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE2D7]/70">
                          <span className="text-[10px] uppercase font-bold text-[#82776E] block">
                            Requested Slot:
                          </span>
                          <span className="font-bold text-[#51463F] text-xs">
                            {req.preferredDate} at {req.preferredTime}
                          </span>
                        </div>

                        <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE2D7]/70">
                          <span className="text-[10px] uppercase font-bold text-[#82776E] block">
                            {isConfirmed ? 'Confirmed Slot:' : 'Meeting Mode:'}
                          </span>
                          <span className="font-bold text-[#51463F] text-xs">
                            {isConfirmed
                              ? `${req.confirmedDate || req.preferredDate} at ${req.confirmedTime || req.preferredTime}`
                              : req.meetingMode === 'ONLINE'
                              ? 'Virtual Video Meet'
                              : 'In-Person Consultation'}
                          </span>
                        </div>
                      </div>

                      {req.reason && (
                        <div className="p-2.5 rounded-lg bg-[#FAF7F2] text-xs text-[#51463F] border border-[#EDE2D7]/70">
                          <strong className="text-[#8064A9] mr-1">Discussion Details:</strong>
                          <span>{req.reason}</span>
                        </div>
                      )}

                      {req.mentorNotes && (
                        <div className="p-2.5 rounded-lg bg-[#FAF7F2] text-xs text-[#51463F] border border-[#EDE2D7]/70">
                          <strong className="text-[#3B9C91] mr-1">Mentor Note:</strong>
                          <span>{req.mentorNotes}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#EDE2D7] flex flex-wrap items-center justify-between gap-2">
                        {isConfirmed && req.locationOrUrl && (
                          <a
                            href={req.locationOrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#27AE60] hover:bg-[#219653] text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
                          >
                            <VideoIcon size={13} />
                            Join Virtual Session
                          </a>
                        )}

                        {isCompleted && (
                          <WorkspaceButton
                            variant="outline"
                            size="sm"
                            icon={<CheckCircleIcon size={13} />}
                            onClick={() => setViewingCompletedRequest(req)}
                          >
                            View Summary & Study Materials
                          </WorkspaceButton>
                        )}

                        {isMentor && (
                          <div className="flex items-center gap-2 ml-auto">
                            {isPending && (
                              <>
                                <WorkspaceButton
                                  variant="outline"
                                  size="sm"
                                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                  onClick={() => handleOpenRejectModal(req)}
                                >
                                  Decline
                                </WorkspaceButton>
                                <WorkspaceButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenRescheduleModal(req)}
                                >
                                  Propose Alternate Time
                                </WorkspaceButton>
                                <WorkspaceButton
                                  variant="primary"
                                  size="sm"
                                  icon={<CheckCircleIcon size={13} />}
                                  onClick={() => handleOpenAcceptModal(req)}
                                >
                                  Accept & Confirm
                                </WorkspaceButton>
                              </>
                            )}

                            {isConfirmed && (
                              <WorkspaceButton
                                variant="primary"
                                size="sm"
                                className="bg-[#E8795B] hover:bg-[#D96B4D]"
                                icon={<CheckCircleIcon size={13} />}
                                onClick={() => handleOpenCompleteModal(req)}
                              >
                                Complete & Log Session
                              </WorkspaceButton>
                            )}
                          </div>
                        )}

                        {isStudent && isRescheduled && req.rescheduleProposal && (
                          <div className="flex items-center gap-2 ml-auto">
                            <WorkspaceButton
                              variant="primary"
                              size="sm"
                              onClick={() => handleStudentRescheduleResponse(req.id || req._id || '', 'ACCEPT')}
                            >
                              Accept Reschedule ({req.rescheduleProposal.proposedDate})
                            </WorkspaceButton>
                            <WorkspaceButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleStudentRescheduleResponse(req.id || req._id || '', 'DECLINE')}
                            >
                              Decline
                            </WorkspaceButton>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }

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
                  <div className="bg-white/95 rounded-2xl border border-[#EADFCF] p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(41,48,45,0.05)] hover:border-[#8064A9]/40 transition-all flex flex-col justify-between gap-3.5">
                    {/* Top Row */}
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#8064A9]/10 text-[#8064A9] font-black text-[11px] uppercase tracking-wide">
                            {meeting.category}
                          </span>
                          <span className="text-[11px] text-[#77786E] font-semibold">ID: {meeting.id}</span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isScheduled && (
                            <WorkspaceBadge variant="active">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
                              SCHEDULED
                            </WorkspaceBadge>
                          )}
                          {isPending && (
                            <WorkspaceBadge variant="pending">
                              <ClockIcon size={11} />
                              PENDING COORDINATION
                            </WorkspaceBadge>
                          )}
                          {isCompleted && (
                            <WorkspaceBadge variant="proposal">
                              <CheckCircleIcon size={11} />
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
                      <h3 className="text-sm sm:text-base font-black text-[#51463F] leading-snug">
                        {meeting.title}
                      </h3>

                      {/* Metadata Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5 text-xs text-[#82776E]">
                        {/* Date & Time */}
                        <div className="flex items-center gap-2 bg-[#FAF7F2] px-3 py-2 rounded-xl border border-[#EDE2D7]">
                          <CalendarIcon size={16} className="text-[#8064B1] shrink-0" />
                          <div>
                            <span className="font-bold text-[#51463F] block">{meeting.scheduledDate}</span>
                            <span className="text-[11px] text-[#82776E]">{meeting.scheduledTime}</span>
                          </div>
                        </div>

                        {/* Mode & Link */}
                        <div className="flex items-center gap-2 bg-[#FAF7F2] px-3 py-2 rounded-xl border border-[#EDE2D7]">
                          {meeting.mode === 'VIRTUAL_MEET' && (
                            <VideoIcon size={16} className="text-[#3B9C91] shrink-0" />
                          )}
                          {meeting.mode === 'IN_PERSON' && (
                            <MapPinIcon size={16} className="text-[#E8795B] shrink-0" />
                          )}
                          {meeting.mode === 'PHONE' && (
                            <PhoneIcon size={16} className="text-[#8064B1] shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-[#51463F] block">{meeting.modeLabel}</span>
                            <span className="text-[11px] text-[#82776E] truncate block max-w-[160px]">
                              {isScheduled && meeting.locationOrUrl
                                ? meeting.locationOrUrl
                                : isPending
                                ? 'Awaiting coordinator invite link'
                                : (meeting.locationOrUrl || 'Virtual Session')}
                            </span>
                          </div>
                        </div>

                        {/* Facilitator */}
                        <div className="flex items-center gap-2 bg-[#FAF7F2] px-3 py-2 rounded-xl border border-[#EDE2D7]">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#8064B1] to-[#6E529F] text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs">
                            FIC
                          </div>
                          <div>
                            <span className="font-bold text-[#51463F] block truncate max-w-[160px]">
                              {meeting.facilitatorName}
                            </span>
                            <span className="text-[10.5px] text-[#8064B1] font-semibold block truncate max-w-[160px]">
                              {meeting.facilitatorRole}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Agenda */}
                      <div className="pt-1 text-xs text-[#82776E] leading-relaxed">
                        <strong className="text-[#51463F] font-bold mr-1">Discussion Scope:</strong>
                        <span>{meeting.agenda}</span>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="pt-3 border-t border-[#EDE2D7] flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 text-xs text-[#82776E]">
                        <ShieldCheckIcon size={14} className="text-[#3B9C91]" />
                        <span>Facilitated under FIC Intermediary Non-Disclosure Governance</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <span className="px-3 py-1.5 bg-[#FAF7F2] text-[#8064B1] font-bold text-xs rounded-xl border border-[#EDE2D7] flex items-center gap-1.5 shadow-2xs">
                            <ClockIcon size={13} className="text-[#8064B1]" />
                            <span>Awaiting Admin Confirmation</span>
                          </span>
                        )}

                        {isScheduled && meeting.locationOrUrl && (
                          <a
                            href={meeting.locationOrUrl}
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
            <span className="text-xs font-black uppercase tracking-wider text-[#8064B1]">FIC Facilitated Session</span>
            <h3 className="text-xl font-black text-[#51463F] mt-0.5">Schedule Facilitated Consultation</h3>
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
              <label className="block font-black text-[#51463F] mb-1.5">Consultation Category *</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl focus:ring-2 focus:ring-[#8064B1] text-[#51463F] font-semibold"
              >
                <option value="Service Scope Alignment">Service Scope Alignment (Marketplace Services)</option>
                <option value="Business Scaling Advisory">Business Scaling Advisory (Tech, Ops & Expansion)</option>
                <option value="Investment Pitch Review">Investment Pitch Review (Private Syndicate Prep)</option>
                <option value="B2B Partnership Exploration">B2B Partnership Exploration (OEM & Supply Chain)</option>
                <option value="FIC Opportunity Consultation">FIC Opportunity Consultation (General Ecosystem Guidance)</option>
              </select>
            </div>

            <div>
              <label className="block font-black text-[#51463F] mb-1.5">Topic or Subject *</label>
              <input
                type="text"
                placeholder="e.g. Cloud SaaS Architecture Alignment or Factory Modernization Scope"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl focus:ring-2 focus:ring-[#8064B1] text-[#51463F]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-[#51463F] mb-1.5">Preferred Date *</label>
                <input
                  type="date"
                  min={todayDateString}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl focus:ring-2 focus:ring-[#8064B1] text-[#51463F]"
                />
              </div>
              <div>
                <label className="block font-black text-[#51463F] mb-1.5">Preferred Slot *</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl focus:ring-2 focus:ring-[#8064B1] text-[#51463F] font-semibold"
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
              <label className="block font-black text-[#51463F] mb-1.5">Meeting Mode *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewMode('VIRTUAL_MEET')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    newMode === 'VIRTUAL_MEET'
                      ? 'border-[#3B9C91] bg-[#E3F5F2] text-[#3B9C91] font-black'
                      : 'border-[#EDE2D7] bg-white text-[#82776E]'
                  }`}
                >
                  Virtual Meet
                </button>
                <button
                  type="button"
                  onClick={() => setNewMode('IN_PERSON')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    newMode === 'IN_PERSON'
                      ? 'border-[#E8795B] bg-[#F4D8D0] text-[#E8795B] font-black'
                      : 'border-[#EDE2D7] bg-white text-[#82776E]'
                  }`}
                >
                  In-Person Hub
                </button>
                <button
                  type="button"
                  onClick={() => setNewMode('PHONE')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    newMode === 'PHONE'
                      ? 'border-[#8064B1] bg-[#EAE3F4] text-[#8064B1] font-black'
                      : 'border-[#EDE2D7] bg-white text-[#82776E]'
                  }`}
                >
                  Phone Call
                </button>
              </div>
            </div>

            <div>
              <label className="block font-black text-[#51463F] mb-1.5">Discussion Agenda & Scope *</label>
              <textarea
                rows={3}
                placeholder="Outline key discussion points, required outcomes, and specific questions..."
                value={newAgenda}
                onChange={(e) => setNewAgenda(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl focus:ring-2 focus:ring-[#8064B1] text-[#51463F]"
              ></textarea>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-[#EDE2D7]">
              <WorkspaceButton
                variant="outline"
                size="sm"
                type="button"
                disabled={isSubmittingMeeting}
                onClick={() => setIsScheduleModalOpen(false)}
              >
                Cancel
              </WorkspaceButton>
              <WorkspaceButton
                variant="violet"
                size="sm"
                type="submit"
                loading={isSubmittingMeeting}
                disabled={isSubmittingMeeting}
              >
                {isSubmittingMeeting ? 'Submitting Request...' : 'Confirm Consultation Request'}
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
            <p className="text-xs text-[#82776E] mb-2">Request a new date or time slot for this session.</p>

            <div>
              <label className="block font-black text-[#51463F] mb-1.5">New Date *</label>
              <input
                type="date"
                min={todayDateString}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl focus:ring-2 focus:ring-[#8064B1] text-[#51463F]"
              />
            </div>

            <div>
              <label className="block font-black text-[#51463F] mb-1.5">New Slot *</label>
              <select
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EDE2D7] rounded-xl focus:ring-2 focus:ring-[#8064B1] text-[#51463F] font-semibold"
              >
                <option value="10:00 AM - 10:45 AM IST">Morning: 10:00 AM - 10:45 AM</option>
                <option value="11:00 AM - 11:45 AM IST">Morning: 11:00 AM - 11:45 AM</option>
                <option value="02:30 PM - 03:15 PM IST">Afternoon: 02:30 PM - 03:15 PM</option>
                <option value="04:00 PM - 04:45 PM IST">Afternoon: 04:00 PM - 04:45 PM</option>
                <option value="05:30 PM - 06:15 PM IST">Evening: 05:30 PM - 06:15 PM</option>
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-[#EDE2D7]">
              <WorkspaceButton variant="outline" size="sm" type="button" onClick={() => setRescheduleTarget(null)}>
                Cancel
              </WorkspaceButton>
              <WorkspaceButton variant="violet" size="sm" type="submit">
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
            <div className="w-12 h-12 rounded-2xl bg-[#E8795B]/10 text-[#E8795B] flex items-center justify-center mx-auto">
              <AlertCircleIcon size={24} />
            </div>
            <p className="text-xs text-[#82776E] leading-relaxed">
              Are you sure you want to cancel the session <strong>"{cancelTarget.title}"</strong>?
            </p>
            <div className="flex justify-center gap-3 pt-2 border-t border-[#EDE2D7]">
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

      {/* ========================================================
          8. STUDENT: BOOK A MENTOR MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={isBookMentorModalOpen}
        onClose={() => setIsBookMentorModalOpen(false)}
        maxWidth="max-w-xl"
        title="Book 1-on-1 Mentorship Session"
      >
        <form onSubmit={handleBookMentorSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-[#51463F] mb-1">
              Select Accredited Mentor *
            </label>
            <select
              value={selectedMentorId}
              onChange={(e) => {
                setSelectedMentorId(e.target.value);
                const found = mentorsList.find((m) => m._id === e.target.value);
                if (found) setSelectedMentorName(found.fullName);
              }}
              className="w-full px-3 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F] font-semibold focus:outline-hidden focus:border-[#8064A9]"
              required
            >
              <option value="">-- Choose Mentor --</option>
              {mentorsList.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.fullName} — {m.experience} ({m.organization})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Consultation Purpose *
              </label>
              <select
                value={bookPurpose}
                onChange={(e) => setBookPurpose(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F] font-semibold focus:outline-hidden focus:border-[#8064A9]"
              >
                <option value="Career Guidance">Career Guidance & Placement Roadmap</option>
                <option value="Subject Doubt Clarification">Subject & Tech Stack Clarification</option>
                <option value="Project Guidance">Capstone / Academic Project Review</option>
                <option value="Skill Development">Skill Development & Certifications</option>
                <option value="Startup Guidance">Student Startup & Incubation</option>
                <option value="Academic Mentorship">Higher Studies & Research</option>
                <option value="Other">Other Guidance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Current Academic Level *
              </label>
              <select
                value={bookStudentLevel}
                onChange={(e) => setBookStudentLevel(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F] font-semibold focus:outline-hidden focus:border-[#8064A9]"
              >
                <option value="Undergraduate">Undergraduate (1st - 4th Year)</option>
                <option value="Postgraduate">Postgraduate (Master's / MBA)</option>
                <option value="Diploma / Polytechnic">Diploma / Polytechnic</option>
                <option value="Higher Secondary">Higher Secondary (+2)</option>
                <option value="Research Scholar">PhD / Research Scholar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[#51463F] mb-1">
              Discussion Topic / Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Full-Stack Career Roadmap & GitHub Portfolio Review"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F] focus:outline-hidden focus:border-[#8064A9]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Preferred Date *
              </label>
              <input
                type="date"
                min={todayDateString}
                value={bookDate}
                onChange={(e) => setBookDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F] focus:outline-hidden focus:border-[#8064A9]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Preferred Time Slot *
              </label>
              <select
                value={bookTime}
                onChange={(e) => setBookTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F] font-semibold focus:outline-hidden focus:border-[#8064A9]"
              >
                <option value="11:00 AM">Morning: 11:00 AM IST</option>
                <option value="03:00 PM">Afternoon: 03:00 PM IST</option>
                <option value="05:30 PM">Evening: 05:30 PM IST</option>
                <option value="06:30 PM">Evening: 06:30 PM IST</option>
                <option value="08:00 PM">Night: 08:00 PM IST</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Meeting Mode
              </label>
              <select
                value={bookMode}
                onChange={(e) => setBookMode(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F] font-semibold focus:outline-hidden focus:border-[#8064A9]"
              >
                <option value="ONLINE">Virtual Video Meet</option>
                <option value="OFFLINE">In-Person Hub Meet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[#51463F] mb-1">
              What specific doubts or questions do you want to cover? *
            </label>
            <textarea
              rows={3}
              placeholder="Explain your current preparation, questions on code architecture, career dilemmas..."
              value={bookReason}
              onChange={(e) => setBookReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F] focus:outline-hidden focus:border-[#8064A9]"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5 border-t border-[#EDE2D7]">
            <WorkspaceButton
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsBookMentorModalOpen(false)}
            >
              Cancel
            </WorkspaceButton>
            <WorkspaceButton variant="primary" size="sm" type="submit">
              Submit Mentorship Request
            </WorkspaceButton>
          </div>
        </form>
      </AnimatedModal>

      {/* ========================================================
          9. MENTOR: ACCEPT & SCHEDULE REQUEST MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!acceptingRequest}
        onClose={() => setAcceptingRequest(null)}
        maxWidth="max-w-lg"
        title="Confirm Mentorship Session"
      >
        {acceptingRequest && (
          <div className="space-y-4">
            <p className="text-xs text-[#82776E]">
              Confirm meeting details with student <strong>{acceptingRequest.studentName}</strong> for "{acceptingRequest.title}".
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-[#51463F] mb-1">
                  Confirmed Date *
                </label>
                <input
                  type="date"
                  value={acceptConfirmedDate}
                  onChange={(e) => setAcceptConfirmedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#51463F] mb-1">
                  Confirmed Time *
                </label>
                <input
                  type="text"
                  value={acceptConfirmedTime}
                  onChange={(e) => setAcceptConfirmedTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Virtual Meeting Link / Venue *
              </label>
              <input
                type="text"
                value={acceptLocationOrUrl}
                onChange={(e) => setAcceptLocationOrUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Preparation Notes for Student (optional)
              </label>
              <textarea
                rows={2}
                value={acceptMentorNotes}
                onChange={(e) => setAcceptMentorNotes(e.target.value)}
                placeholder="e.g. Please keep your GitHub repo and resume open on screen..."
                className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5 border-t border-[#EDE2D7]">
              <WorkspaceButton variant="outline" size="sm" onClick={() => setAcceptingRequest(null)}>
                Cancel
              </WorkspaceButton>
              <WorkspaceButton variant="primary" size="sm" onClick={handleConfirmAccept}>
                Confirm & Schedule Session
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* ========================================================
          10. MENTOR: PROPOSE RESCHEDULE MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!reschedulingRequest}
        onClose={() => setReschedulingRequest(null)}
        maxWidth="max-w-md"
        title="Propose Alternate Time Slot"
      >
        {reschedulingRequest && (
          <div className="space-y-4">
            <p className="text-xs text-[#82776E]">
              Propose a new schedule for <strong>{reschedulingRequest.studentName}</strong>. The student will be notified to accept or decline.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-[#51463F] mb-1">
                  Proposed Date *
                </label>
                <input
                  type="date"
                  min={todayDateString}
                  value={rescheduleDateInput}
                  onChange={(e) => setRescheduleDateInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#51463F] mb-1">
                  Proposed Time *
                </label>
                <input
                  type="text"
                  value={rescheduleTimeInput}
                  onChange={(e) => setRescheduleTimeInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Reason for Rescheduling
              </label>
              <textarea
                rows={2}
                value={rescheduleNotesInput}
                onChange={(e) => setRescheduleNotesInput(e.target.value)}
                placeholder="e.g. Schedule conflict due to university lectures..."
                className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5 border-t border-[#EDE2D7]">
              <WorkspaceButton variant="outline" size="sm" onClick={() => setReschedulingRequest(null)}>
                Cancel
              </WorkspaceButton>
              <WorkspaceButton variant="primary" size="sm" onClick={handleConfirmReschedule}>
                Send Reschedule Proposal
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* ========================================================
          11. MENTOR: REJECT REQUEST MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        maxWidth="max-w-sm"
        title="Decline Mentorship Request"
      >
        {rejectingRequest && (
          <div className="space-y-4">
            <p className="text-xs text-[#82776E]">
              Provide a polite reason for declining the session request from <strong>{rejectingRequest.studentName}</strong>:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
            />
            <div className="pt-2 flex justify-end gap-2.5 border-t border-[#EDE2D7]">
              <WorkspaceButton variant="outline" size="sm" onClick={() => setRejectingRequest(null)}>
                Cancel
              </WorkspaceButton>
              <WorkspaceButton variant="primary" size="sm" onClick={handleConfirmReject}>
                Decline Request
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* ========================================================
          12. MENTOR: COMPLETE SESSION MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!completingRequest}
        onClose={() => setCompletingRequest(null)}
        maxWidth="max-w-xl"
        title="Complete Mentorship Session & Log Summary"
      >
        {completingRequest && (
          <div className="space-y-4">
            <p className="text-xs text-[#82776E]">
              Record discussion key takeaways, reading materials, and action steps for <strong>{completingRequest.studentName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Executive Session Summary *
              </label>
              <textarea
                rows={3}
                value={sessionSummaryInput}
                onChange={(e) => setSessionSummaryInput(e.target.value)}
                placeholder="Summarize the core topics covered, student's strengths, and areas for improvement..."
                className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Mentor Advisory & Key Recommendations
              </label>
              <textarea
                rows={2}
                value={mentorNotesInput}
                onChange={(e) => setMentorNotesInput(e.target.value)}
                placeholder="Specific technical and career guidance shared during the call..."
                className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Recommended Study Materials & Links (comma-separated)
              </label>
              <input
                type="text"
                value={recommendedMaterialsInput}
                onChange={(e) => setRecommendedMaterialsInput(e.target.value)}
                placeholder="e.g. Clean Architecture by Martin, FIC System Design Primer"
                className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#51463F] mb-1">
                Follow-Up Instructions for Student
              </label>
              <input
                type="text"
                value={followUpInstructionsInput}
                onChange={(e) => setFollowUpInstructionsInput(e.target.value)}
                placeholder="e.g. Implement indexing on MongoDB collection and share GitHub link in 2 weeks"
                className="w-full px-3 py-2 bg-white border border-[#EDE2D7] rounded-xl text-xs text-[#51463F]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5 border-t border-[#EDE2D7]">
              <WorkspaceButton variant="outline" size="sm" onClick={() => setCompletingRequest(null)}>
                Cancel
              </WorkspaceButton>
              <WorkspaceButton variant="primary" size="sm" onClick={handleConfirmComplete}>
                Mark Session as Completed
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* ========================================================
          13. VIEW COMPLETED SESSION SUMMARY MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!viewingCompletedRequest}
        onClose={() => setViewingCompletedRequest(null)}
        maxWidth="max-w-lg"
        title="Mentorship Session Summary & Study Notes"
      >
        {viewingCompletedRequest && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE2D7] pb-2 text-xs">
              <div>
                <strong className="text-[#51463F] block">
                  {viewingCompletedRequest.title}
                </strong>
                <span className="text-[#82776E]">
                  Mentor: {viewingCompletedRequest.mentorName} • Student: {viewingCompletedRequest.studentName}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase text-[#27AE60] bg-[#27AE60]/10 px-2 py-0.5 rounded-sm">
                Completed
              </span>
            </div>

            <div className="space-y-1">
              <strong className="text-xs font-black text-[#51463F]">Session Summary:</strong>
              <p className="text-xs text-[#51463F] leading-relaxed p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
                {viewingCompletedRequest.sessionSummary || 'Session completed.'}
              </p>
            </div>

            {viewingCompletedRequest.mentorNotes && (
              <div className="space-y-1">
                <strong className="text-xs font-black text-[#8064A9]">Mentor Guidance:</strong>
                <p className="text-xs text-[#51463F] leading-relaxed p-3 rounded-xl bg-white border border-[#EDE2D7]">
                  {viewingCompletedRequest.mentorNotes}
                </p>
              </div>
            )}

            {viewingCompletedRequest.recommendedMaterials && viewingCompletedRequest.recommendedMaterials.length > 0 && (
              <div className="space-y-1.5">
                <strong className="text-xs font-black text-[#51463F]">Recommended Study Materials:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {viewingCompletedRequest.recommendedMaterials.map((mat: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs font-bold text-[#8064A9] bg-[#8064A9]/10 border border-[#8064A9]/30 px-2.5 py-1 rounded-lg"
                    >
                      • {mat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {viewingCompletedRequest.followUpInstructions && (
              <div className="space-y-1">
                <strong className="text-xs font-black text-[#3B9C91]">Follow-Up Action:</strong>
                <p className="text-xs text-[#51463F] p-2.5 rounded-xl bg-[#3B9C91]/10 border border-[#3B9C91]/30">
                  {viewingCompletedRequest.followUpInstructions}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-[#EDE2D7]">
              <WorkspaceButton variant="outline" size="sm" onClick={() => setViewingCompletedRequest(null)}>
                Close
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>
    </WorkspaceShell>
  );
};

export default MeetingsPage;
