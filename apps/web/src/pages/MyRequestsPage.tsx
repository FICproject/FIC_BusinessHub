import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  getStoredUser,
  getUserRequests,
  getStudentMentorshipRequests,
  getMentorMentorshipRequests,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
  rescheduleMentorshipRequest,
  respondToReschedule,
  completeMentorshipSession,
  cancelMentorshipRequest,
  apiRequest,
  IMentorshipRequest
} from '../services/api';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceBadge,
  WorkspaceEmptyState
} from '../components/workspace/WorkspaceComponents';
import {
  ShieldCheckIcon,
  LockIcon,
  BriefcaseIcon,
  LightbulbIcon,
  RocketIcon,
  HandshakeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  GraduationCapIcon,
  CalendarIcon,
  ClockIcon,
  VideoIcon,
  MapPinIcon,
  AlertCircleIcon,
  UserIcon
} from '../components/Icons';
import { motionSprings, fadeIn, staggerContainer, staggerItem } from '../motion';

export const MyRequestsPage: React.FC = () => {
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_default';
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  // Role detection
  const subcategory =
    user?.subCategory ||
    (user?.subcategories && user?.subcategories.length > 0 ? user?.subcategories[0] : '') ||
    user?.primaryCategory ||
    user?.categoryName ||
    '';
  const subLower = subcategory.toLowerCase();
  const isMentor =
    subLower.includes('mentor') ||
    subLower.includes('trainer') ||
    subLower.includes('teacher') ||
    subLower.includes('professor');
  const isStudent = subLower.includes('student');

  // Compute allowed tabs based on role
  // Mentor: Marketplace Requests + Student Requests
  // Student: Marketplace Requests + Mentor Requests
  // Others: Marketplace Requests + Incubation Ideas + Scaling Support
  const determineInitialTab = (): string => {
    if (urlTab) {
      if (isMentor && (urlTab === 'student-requests' || urlTab === 'student')) return 'student-requests';
      if (isStudent && (urlTab === 'mentor-requests' || urlTab === 'mentor')) return 'mentor-requests';
      if (urlTab === 'services' || urlTab === 'marketplace') return 'services';
      if (!isMentor && !isStudent) {
        if (['services', 'ideas', 'scaling'].includes(urlTab)) return urlTab;
      }
    }
    if (isMentor) return 'student-requests';
    if (isStudent) return 'mentor-requests';
    return 'services';
  };

  const [activeTab, setActiveTab] = useState<string>(determineInitialTab);

  // Sync tab with URL parameter changes
  useEffect(() => {
    if (urlTab) {
      if (isMentor && (urlTab === 'student-requests' || urlTab === 'student')) {
        setActiveTab('student-requests');
      } else if (isStudent && (urlTab === 'mentor-requests' || urlTab === 'mentor')) {
        setActiveTab('mentor-requests');
      } else if (urlTab === 'services' || urlTab === 'marketplace') {
        setActiveTab('services');
      } else if (!isMentor && !isStudent && ['services', 'ideas', 'scaling'].includes(urlTab)) {
        setActiveTab(urlTab);
      }
    }
  }, [urlTab, isMentor, isStudent]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // State for non-mentorship standard requests
  const [services, setServices] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [scaling, setScaling] = useState<any[]>([]);

  // State for Student / Mentor Mentorship Requests
  const [mentorshipRequests, setMentorshipRequests] = useState<IMentorshipRequest[]>([]);
  const [loadingMentorship, setLoadingMentorship] = useState(false);

  // Modal states
  const [detailsModalReq, setDetailsModalReq] = useState<IMentorshipRequest | null>(null);
  const [acceptModalReq, setAcceptModalReq] = useState<IMentorshipRequest | null>(null);
  const [rejectModalReq, setRejectModalReq] = useState<IMentorshipRequest | null>(null);
  const [rescheduleModalReq, setRescheduleModalReq] = useState<IMentorshipRequest | null>(null);
  const [completeModalReq, setCompleteModalReq] = useState<IMentorshipRequest | null>(null);

  // Form states for modals
  const [acceptForm, setAcceptForm] = useState({
    confirmedDate: '',
    confirmedTime: '',
    meetingMode: 'ONLINE' as 'ONLINE' | 'OFFLINE',
    locationOrUrl: '',
    mentorNotes: ''
  });

  const [rejectionReason, setRejectionReason] = useState('');

  const [rescheduleForm, setRescheduleForm] = useState({
    proposedDate: '',
    proposedTime: '',
    proposedMode: 'ONLINE',
    proposedNotes: ''
  });

  const [completeForm, setCompleteForm] = useState({
    sessionSummary: '',
    mentorNotes: '',
    recommendedMaterials: '',
    followUpInstructions: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  };

  // Fetch mentorship requests
  const fetchMentorshipData = async () => {
    setLoadingMentorship(true);
    try {
      if (isMentor) {
        const data = await getMentorMentorshipRequests();
        setMentorshipRequests(data);
      } else if (isStudent) {
        const data = await getStudentMentorshipRequests();
        setMentorshipRequests(data);
      }
    } catch (err) {
      console.error('Failed to load mentorship requests', err);
    } finally {
      setLoadingMentorship(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      // 1. Services: Fetch live requests from backend
      const loadServiceRequests = async () => {
        try {
          const res = await apiRequest('/connections/me');
          if (res && res.success && Array.isArray(res.data)) {
            setServices(res.data);
            return;
          }
        } catch {
          // Fallback to local user requests
        }

        const userRequests = getUserRequests(userId);
        setServices(
          userRequests.map((r, i) => ({
            id: r.id || `REQ-0${i + 1}`,
            title: r.serviceTitle || r.title,
            status: r.status || 'SUBMITTED',
            statusLabel: r.statusText || r.statusLabel || 'Under FIC Review',
            notes: r.requirementNotes || r.notes || 'Verified requirement submitted via FIC Business Hub.',
            ficRemark:
              r.ficRemark ||
              'FIC Coordinator assigned. Evaluating verified providers and preparing confidential proposals.',
            date: r.date || 'Today'
          }))
        );
      };

      // 2. Ideas: Fetch live from backend
      const loadIdeas = async () => {
        try {
          const res = await apiRequest('/business-ideas/me');
          if (res && res.success && Array.isArray(res.data)) {
            setIdeas(
              res.data.map((item: any) => ({
                id: item.refNumber || item._id,
                title: item.title,
                stage: item.stage,
                status: item.status,
                statusLabel: item.status ? item.status.replace(/_/g, ' ') : 'Under Review',
                date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'Recent',
                notes: item.description,
                ficRemark: item.latestFicUpdate || 'Under preliminary evaluation by FIC incubation desk.',
                updateHistory: item.updateHistory || [],
                memberAction: item.memberAction
              }))
            );
            return;
          }
        } catch {}

        try {
          const storedIdeas = localStorage.getItem(`fic_user_ideas_${userId}`);
          if (storedIdeas) {
            const parsed = JSON.parse(storedIdeas);
            setIdeas(
              parsed.map((item: any) => ({
                id: item.id,
                title: item.title,
                stage: item.stage,
                status: item.status,
                statusLabel: item.statusLabel,
                date: item.submittedDate || 'Recent',
                notes: item.description,
                ficRemark: item.reviewNotes || 'Under preliminary evaluation by FIC incubation desk.'
              }))
            );
          }
        } catch {}
      };

      // 3. Scaling: Fetch live from backend
      const loadScaling = async () => {
        try {
          const res = await apiRequest('/business-development-requests/me');
          if (res && res.success && Array.isArray(res.data)) {
            setScaling(
              res.data.map((item: any) => ({
                id: item.refNumber || item._id,
                businessName: item.businessName,
                supportType: item.supportType ? item.supportType.replace(/_/g, ' ') : 'Enterprise Support',
                status: item.status,
                statusLabel: item.status ? item.status.replace(/_/g, ' ') : 'Under Review',
                date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'Recent',
                notes: item.currentChallenges,
                ficRemark: item.latestFicUpdate || 'Diagnostic assessment under evaluation by domain specialist.',
                updateHistory: item.updateHistory || [],
                memberAction: item.memberAction
              }))
            );
            return;
          }
        } catch {}

        try {
          const storedScaling = localStorage.getItem(`fic_user_scaling_${userId}`);
          if (storedScaling) {
            const parsed = JSON.parse(storedScaling);
            setScaling(
              parsed.map((item: any) => ({
                id: item.id,
                businessName: item.businessName,
                supportType: item.supportTypeLabel || item.supportType,
                status: item.status,
                statusLabel: item.statusLabel,
                date: item.submittedDate || 'Recent',
                notes: item.currentChallenges,
                ficRemark: item.diagnosticNotes || 'Diagnostic assessment under evaluation by domain specialist.'
              }))
            );
          }
        } catch {}
      };

      const loadAllRequests = () => {
        loadServiceRequests();
        loadIdeas();
        loadScaling();
      };

      loadAllRequests();
      const pollTimer = setInterval(loadAllRequests, 5000);

      // Mentorship requests
      if (isMentor || isStudent) {
        fetchMentorshipData();
      }

      return () => {
        clearInterval(pollTimer);
      };
    }
  }, [user?.id, user?.userId, userId, isMentor, isStudent]);

  // Modal open helpers
  const openAcceptModal = (req: IMentorshipRequest) => {
    setAcceptModalReq(req);
    setAcceptForm({
      confirmedDate: req.preferredDate || new Date().toISOString().split('T')[0],
      confirmedTime: req.preferredTime || '17:00',
      meetingMode: req.meetingMode || 'ONLINE',
      locationOrUrl: req.locationOrUrl || 'https://meet.google.com/fic-mentor-session',
      mentorNotes: req.mentorNotes || 'Looking forward to our session. Please have your questions ready.'
    });
  };

  const openRejectModal = (req: IMentorshipRequest) => {
    setRejectModalReq(req);
    setRejectionReason('');
  };

  const openRescheduleModal = (req: IMentorshipRequest) => {
    setRescheduleModalReq(req);
    setRescheduleForm({
      proposedDate: req.preferredDate || '',
      proposedTime: req.preferredTime || '18:00',
      proposedMode: req.meetingMode || 'ONLINE',
      proposedNotes: ''
    });
  };

  const openCompleteModal = (req: IMentorshipRequest) => {
    setCompleteModalReq(req);
    setCompleteForm({
      sessionSummary: req.sessionSummary || '',
      mentorNotes: req.mentorNotes || '',
      recommendedMaterials: req.recommendedMaterials ? req.recommendedMaterials.join(', ') : '',
      followUpInstructions: req.followUpInstructions || ''
    });
  };

  // Actions execution
  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptModalReq) return;
    setIsSubmitting(true);
    try {
      const id = acceptModalReq._id || acceptModalReq.id || acceptModalReq.requestId;
      const res = await acceptMentorshipRequest(id, acceptForm);
      if (res) {
        showToast('Mentorship request accepted and consultation session scheduled!', 'success');
        setAcceptModalReq(null);
        await fetchMentorshipData();
      } else {
        showToast('Unable to accept request. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Error updating request status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalReq) return;
    setIsSubmitting(true);
    try {
      const id = rejectModalReq._id || rejectModalReq.id || rejectModalReq.requestId;
      const res = await rejectMentorshipRequest(id, rejectionReason || 'Mentor is currently unavailable for this schedule.');
      if (res) {
        showToast('Mentorship request declined with polite reason.', 'info');
        setRejectModalReq(null);
        await fetchMentorshipData();
      } else {
        showToast('Failed to decline request.', 'error');
      }
    } catch (err) {
      showToast('Error updating request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalReq) return;
    if (!rescheduleForm.proposedDate || !rescheduleForm.proposedTime) {
      showToast('Please specify both proposed date and time.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const id = rescheduleModalReq._id || rescheduleModalReq.id || rescheduleModalReq.requestId;
      const res = await rescheduleMentorshipRequest(id, rescheduleForm);
      if (res) {
        showToast('New schedule proposed to the student successfully.', 'success');
        setRescheduleModalReq(null);
        await fetchMentorshipData();
      } else {
        showToast('Failed to propose reschedule.', 'error');
      }
    } catch (err) {
      showToast('Error submitting reschedule proposal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleResponse = async (req: IMentorshipRequest, action: 'ACCEPT' | 'DECLINE') => {
    const id = req._id || req.id || req.requestId;
    setIsSubmitting(true);
    try {
      const res = await respondToReschedule(id, action);
      if (res) {
        if (action === 'ACCEPT') {
          showToast('Proposed schedule accepted! Session is now confirmed.', 'success');
        } else {
          showToast('Proposed schedule declined. Request cancelled.', 'info');
        }
        await fetchMentorshipData();
      }
    } catch (err) {
      showToast('Failed to respond to schedule proposal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelByStudent = async (req: IMentorshipRequest) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    const id = req._id || req.id || req.requestId;
    setIsSubmitting(true);
    try {
      const res = await cancelMentorshipRequest(id, 'Cancelled by student prior to confirmation.');
      if (res) {
        showToast('Mentorship request cancelled.', 'info');
        await fetchMentorshipData();
      }
    } catch (err) {
      showToast('Failed to cancel request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalReq) return;
    if (!completeForm.sessionSummary.trim()) {
      showToast('Please provide a brief session summary.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const id = completeModalReq._id || completeModalReq.id || completeModalReq.requestId;
      const materials = completeForm.recommendedMaterials
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const res = await completeMentorshipSession(id, {
        sessionSummary: completeForm.sessionSummary,
        mentorNotes: completeForm.mentorNotes,
        recommendedMaterials: materials,
        followUpInstructions: completeForm.followUpInstructions
      });
      if (res) {
        showToast('Consultation session marked as completed with logged audit.', 'success');
        setCompleteModalReq(null);
        await fetchMentorshipData();
      }
    } catch (err) {
      showToast('Failed to log completion audit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            <ClockIcon size={12} className="text-amber-600" />
            Pending Review
          </span>
        );
      case 'CONFIRMED':
      case 'ACCEPTED':
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircleIcon size={12} className="text-emerald-600" />
            Session Confirmed
          </span>
        );
      case 'RESCHEDULE_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
            <ClockIcon size={12} className="text-purple-600" />
            Reschedule Proposed
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircleIcon size={12} className="text-blue-600" />
            Completed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircleIcon size={12} className="text-rose-600" />
            Declined
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#FAF7F2] text-[#82776E] border border-[#EDE2D7]">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#FAF7F2] text-[#51463F] border border-[#EDE2D7]">
            {status}
          </span>
        );
    }
  };

  // Build Tab Config Array
  const tabItems = isMentor
    ? [
        {
          id: 'services',
          label: 'Marketplace Requests',
          count: services.length,
          icon: <BriefcaseIcon size={14} />
        },
        {
          id: 'student-requests',
          label: 'Student Requests',
          count: mentorshipRequests.length,
          icon: <GraduationCapIcon size={14} />
        }
      ]
    : isStudent
    ? [
        {
          id: 'services',
          label: 'Marketplace Requests',
          count: services.length,
          icon: <BriefcaseIcon size={14} />
        },
        {
          id: 'mentor-requests',
          label: 'Mentor Requests',
          count: mentorshipRequests.length,
          icon: <GraduationCapIcon size={14} />
        }
      ]
    : [
        {
          id: 'services',
          label: 'Marketplace Requests',
          count: services.length,
          icon: <BriefcaseIcon size={14} />
        },
        {
          id: 'ideas',
          label: 'Incubation Ideas',
          count: ideas.length,
          icon: <LightbulbIcon size={14} />
        },
        {
          id: 'scaling',
          label: 'Scaling Support',
          count: scaling.length,
          icon: <RocketIcon size={14} />
        }
      ];

  return (
    <WorkspaceShell>
      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold ${
              feedbackToast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : feedbackToast.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-300'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            <CheckCircleIcon size={16} className={feedbackToast.type === 'success' ? 'text-emerald-600' : 'text-amber-600'} />
            <span>{feedbackToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="coral"
        title={
          isMentor
            ? 'Mentor Requests & Student Consultations Hub'
            : isStudent
            ? 'My Applications & Mentorship Requests'
            : 'My Requests & Communications Hub'
        }
        subtitle={
          isMentor
            ? `Review and manage incoming student consultation bookings, evaluate guidance requirements, and schedule 1-on-1 sessions for ${
                user?.fullName || 'your account'
              }.`
            : isStudent
            ? `Track your submitted mentor bookings, interview applications, and marketplace service requirements for ${
                user?.fullName || 'your account'
              }.`
            : `Track all service requirements, incubation concepts, and enterprise scaling requests for ${
                user?.fullName || 'your account'
              }.`
        }
      />

      {/* ========================================================
          2. UNIFIED TAB NAVIGATION (OVERFLOW-X AUTO)
         ======================================================== */}
      <WorkspaceCard variant="glass" padded={false} className="p-1 sm:p-1.5 overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-max">
          {tabItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="relative px-3.5 py-2 rounded-xl font-bold text-xs sm:text-[13px] flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors duration-200"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeRequestsTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-[#E8795B] to-[#D96B4E] rounded-xl shadow-[0_2px_8px_rgba(232,121,91,0.25)] z-0"
                    transition={motionSprings.snappy}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 ${
                    isActive ? 'text-white' : 'text-[#453A33] hover:text-[#C65638] font-bold'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-[#FAF7F2] text-[#51463F] border border-[#EDE2D7]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </WorkspaceCard>

      {/* ========================================================
          3. TAB CONTENT
         ======================================================== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={motionSprings.gentle}
          className="space-y-4"
        >
          {/* ====================================================
              TAB: MENTOR STUDENT REQUESTS (MENTOR ONLY)
             ==================================================== */}
          {isMentor && activeTab === 'student-requests' && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3.5">
              {mentorshipRequests.length === 0 ? (
                <WorkspaceEmptyState
                  icon={<GraduationCapIcon size={28} />}
                  title="No incoming student requests"
                  description="You haven't received any mentorship or consultation bookings yet. Ensure your teaching services are active and visible in the student portal."
                  actionText="Manage Teaching Offerings"
                  onAction={() => (window.location.href = '/my-services')}
                  accent="violet"
                />
              ) : (
                mentorshipRequests.map((req) => (
                  <motion.div key={req._id || req.id || req.requestId} variants={staggerItem}>
                    <WorkspaceCard variant="default" className="space-y-3.5 border border-[#EDE2D7] shadow-sm hover:border-[#8064B1]/40 transition-all">
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF]/70 pb-3 gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-[#8064B1] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#F4EEFB] border border-[#8064B1]/20">
                              {req.requestId}
                            </span>
                            <span className="text-xs font-bold text-[#51463F] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#EDE2D7]">
                              Purpose: {req.purpose}
                            </span>
                            {req.meetingMode && (
                              <span className="text-[11px] font-semibold text-[#82776E] flex items-center gap-1">
                                {req.meetingMode === 'ONLINE' ? (
                                  <>
                                    <VideoIcon size={12} className="text-[#8064B1]" /> Virtual Video Call
                                  </>
                                ) : (
                                  <>
                                    <MapPinIcon size={12} className="text-[#C66B52]" /> In-Person Meeting
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-[#51463F] pt-1">
                            {req.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          {renderStatusBadge(req.status)}
                        </div>
                      </div>

                      {/* Student Info Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]/70 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#F4EEFB] text-[#8064B1] flex items-center justify-center font-bold">
                            <UserIcon size={15} />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#82776E] block font-semibold uppercase">Student Candidate</span>
                            <span className="font-bold text-[#51463F]">{req.studentName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#FAF0E6] text-[#C66B52] flex items-center justify-center font-bold">
                            <GraduationCapIcon size={15} />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#82776E] block font-semibold uppercase">Academic Level</span>
                            <span className="font-bold text-[#51463F]">{req.studentLevel || 'Undergraduate'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#EBF5F0] text-emerald-700 flex items-center justify-center font-bold">
                            <CalendarIcon size={15} />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#82776E] block font-semibold uppercase">
                              {req.status === 'CONFIRMED' || req.status === 'COMPLETED' ? 'Confirmed Schedule' : 'Preferred Slot'}
                            </span>
                            <span className="font-bold text-[#51463F]">
                              {req.confirmedDate || req.preferredDate} at {req.confirmedTime || req.preferredTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stated Reason & Desired Guidance */}
                      <div className="space-y-1.5 text-xs sm:text-[13px]">
                        <div className="p-3 rounded-xl bg-white border border-[#EDE2D7] text-[#82776E]">
                          <strong className="text-[#51463F] font-bold block mb-1">
                            Student's Guidance Request & Doubts:
                          </strong>
                          <p className="leading-relaxed">{req.reason}</p>
                        </div>

                        {/* If Reschedule Proposed, highlight */}
                        {req.status === 'RESCHEDULE_REQUESTED' && req.rescheduleProposal && (
                          <div className="p-3 rounded-xl bg-[#F4EEFB] border border-[#8064B1]/40 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-[#8064B1]">
                              <ClockIcon size={13} />
                              Your Proposed Alternative Schedule:
                            </div>
                            <p className="text-[#51463F] font-semibold">
                              {req.rescheduleProposal.proposedDate} at {req.rescheduleProposal.proposedTime} ({req.rescheduleProposal.proposedMode || req.meetingMode})
                            </p>
                            {req.rescheduleProposal.proposedNotes && (
                              <p className="text-[#82776E] italic">"{req.rescheduleProposal.proposedNotes}"</p>
                            )}
                            <span className="text-[11px] text-[#8064B1] font-semibold block pt-0.5">
                              Waiting for student confirmation.
                            </span>
                          </div>
                        )}

                        {/* If Confirmed, show meeting link & mentor notes */}
                        {(req.status === 'CONFIRMED' || req.status === 'SCHEDULED') && (
                          <div className="p-3 rounded-xl bg-[#EAF7F2] border border-emerald-300 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                                <CheckCircleIcon size={14} className="text-emerald-600" />
                                Consultation Confirmed
                              </span>
                              {req.locationOrUrl && (
                                <a
                                  href={req.locationOrUrl.startsWith('http') ? req.locationOrUrl : `https://${req.locationOrUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1"
                                >
                                  <VideoIcon size={12} />
                                  Open Meeting URL
                                </a>
                              )}
                            </div>
                            {req.mentorNotes && (
                              <p className="text-[#51463F] text-xs">
                                <strong className="font-semibold text-emerald-900">Your Instructions for Student:</strong>{' '}
                                {req.mentorNotes}
                              </p>
                            )}
                          </div>
                        )}

                        {/* If Completed, show summary snippet */}
                        {req.status === 'COMPLETED' && req.sessionSummary && (
                          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                            <span className="font-bold text-blue-900 block">Session Summary Logged:</span>
                            <p className="text-[#51463F] leading-relaxed">{req.sessionSummary}</p>
                            {req.recommendedMaterials && req.recommendedMaterials.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                <span className="font-bold text-[#51463F] text-[11px]">Recommended:</span>
                                {req.recommendedMaterials.map((mat: string, i: number) => (
                                  <span key={i} className="text-[10px] bg-white text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                                    {mat}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* If Rejected, show reason */}
                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                            <strong>Reason for Declining:</strong> {req.rejectionReason}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons Row */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#EDE2D7]/60">
                        <button
                          onClick={() => setDetailsModalReq(req)}
                          className="text-xs font-bold text-[#8064B1] hover:text-[#6E529F] flex items-center gap-1 py-1"
                        >
                          View Full Details &rarr;
                        </button>

                        <div className="flex items-center gap-2 flex-wrap">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => openRejectModal(req)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => openRescheduleModal(req)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#8064B1] bg-[#F4EEFB] hover:bg-[#EAE1F7] border border-[#8064B1]/30 transition-colors"
                              >
                                Propose Reschedule
                              </button>
                              <button
                                onClick={() => openAcceptModal(req)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all"
                              >
                                Accept & Confirm
                              </button>
                            </>
                          )}

                          {(req.status === 'CONFIRMED' || req.status === 'SCHEDULED') && (
                            <button
                              onClick={() => openCompleteModal(req)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all flex items-center gap-1"
                            >
                              <CheckCircleIcon size={13} />
                              Mark Session Completed
                            </button>
                          )}

                          {req.status === 'COMPLETED' && (
                            <button
                              onClick={() => setDetailsModalReq(req)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#51463F] bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#EDE2D7] transition-colors"
                            >
                              View Session Audit
                            </button>
                          )}
                        </div>
                      </div>
                    </WorkspaceCard>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ====================================================
              TAB: STUDENT MENTOR REQUESTS (STUDENT ONLY)
             ==================================================== */}
          {isStudent && activeTab === 'mentor-requests' && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3.5">
              {mentorshipRequests.length === 0 ? (
                <WorkspaceEmptyState
                  icon={<GraduationCapIcon size={28} />}
                  title="No mentor requests submitted"
                  description="You haven't submitted any mentor consultation requests yet. Connect with verified corporate leaders, academic professors, and startup founders."
                  actionText="Book a Mentor"
                  onAction={() => (window.location.href = '/meetings?action=book')}
                  accent="violet"
                />
              ) : (
                mentorshipRequests.map((req) => (
                  <motion.div key={req._id || req.id || req.requestId} variants={staggerItem}>
                    <WorkspaceCard variant="default" className="space-y-3.5 border border-[#EDE2D7] shadow-sm hover:border-[#8064B1]/40 transition-all">
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF]/70 pb-3 gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-[#8064B1] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#F4EEFB] border border-[#8064B1]/20">
                              {req.requestId}
                            </span>
                            <span className="text-xs font-bold text-[#51463F] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#EDE2D7]">
                              Purpose: {req.purpose}
                            </span>
                            {req.meetingMode && (
                              <span className="text-[11px] font-semibold text-[#82776E] flex items-center gap-1">
                                {req.meetingMode === 'ONLINE' ? (
                                  <>
                                    <VideoIcon size={12} className="text-[#8064B1]" /> Virtual Video Call
                                  </>
                                ) : (
                                  <>
                                    <MapPinIcon size={12} className="text-[#C66B52]" /> In-Person Meeting
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-[#51463F] pt-1">
                            {req.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          {renderStatusBadge(req.status)}
                        </div>
                      </div>

                      {/* Mentor Details Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]/70 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#F4EEFB] text-[#8064B1] flex items-center justify-center font-bold">
                            <UserIcon size={15} />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#82776E] block font-semibold uppercase">Assigned Mentor</span>
                            <span className="font-bold text-[#51463F]">{req.mentorName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#FAF0E6] text-[#C66B52] flex items-center justify-center font-bold">
                            <CalendarIcon size={15} />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#82776E] block font-semibold uppercase">Requested Date</span>
                            <span className="font-bold text-[#51463F]">{req.preferredDate}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#EBF5F0] text-emerald-700 flex items-center justify-center font-bold">
                            <ClockIcon size={15} />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#82776E] block font-semibold uppercase">
                              {req.status === 'CONFIRMED' || req.status === 'COMPLETED' ? 'Confirmed Slot' : 'Preferred Time'}
                            </span>
                            <span className="font-bold text-[#51463F]">
                              {req.confirmedTime || req.preferredTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stated Reason & Mentor Response */}
                      <div className="space-y-1.5 text-xs sm:text-[13px]">
                        <div className="p-3 rounded-xl bg-white border border-[#EDE2D7] text-[#82776E]">
                          <strong className="text-[#51463F] font-bold block mb-1">
                            Your Stated Objectives:
                          </strong>
                          <p className="leading-relaxed">{req.reason}</p>
                        </div>

                        {/* RESCHEDULE PROPOSAL BOX (Actionable by Student) */}
                        {req.status === 'RESCHEDULE_REQUESTED' && req.rescheduleProposal && (
                          <div className="p-3.5 rounded-xl bg-[#F4EEFB] border border-[#8064B1] text-xs space-y-2">
                            <div className="flex items-center gap-1.5 font-bold text-[#8064B1]">
                              <ClockIcon size={14} />
                              Mentor Has Proposed an Alternative Schedule:
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-[#8064B1]/30 text-[#51463F]">
                              <p className="font-bold text-sm text-[#8064B1]">
                                {req.rescheduleProposal.proposedDate} at {req.rescheduleProposal.proposedTime}
                              </p>
                              {req.rescheduleProposal.proposedNotes && (
                                <p className="text-xs text-[#82776E] mt-1 italic">
                                  "{req.rescheduleProposal.proposedNotes}"
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleRescheduleResponse(req, 'ACCEPT')}
                                disabled={isSubmitting}
                                className="px-3.5 py-1.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 text-xs shadow-sm transition-all"
                              >
                                Accept Proposed Schedule
                              </button>
                              <button
                                onClick={() => handleRescheduleResponse(req, 'DECLINE')}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 rounded-xl font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs transition-colors"
                              >
                                Decline Proposal
                              </button>
                            </div>
                          </div>
                        )}

                        {/* CONFIRMED MEETING BOX */}
                        {(req.status === 'CONFIRMED' || req.status === 'SCHEDULED') && (
                          <div className="p-3.5 rounded-xl bg-[#EAF7F2] border border-emerald-300 space-y-2 text-xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                <CheckCircleIcon size={15} className="text-emerald-600" />
                                Meeting Confirmed! Scheduled for {req.confirmedDate || req.preferredDate} at {req.confirmedTime || req.preferredTime}
                              </div>
                              {req.locationOrUrl && (
                                <a
                                  href={req.locationOrUrl.startsWith('http') ? req.locationOrUrl : `https://${req.locationOrUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm transition-all"
                                >
                                  <VideoIcon size={13} />
                                  Join Video Consultation
                                </a>
                              )}
                            </div>
                            {req.mentorNotes && (
                              <div className="p-2.5 rounded-lg bg-white/80 border border-emerald-200 text-[#51463F]">
                                <strong className="font-semibold text-emerald-900">Mentor's Instructions:</strong>{' '}
                                {req.mentorNotes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* COMPLETED SESSION BOX */}
                        {req.status === 'COMPLETED' && (
                          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                                <CheckCircleIcon size={14} className="text-blue-600" />
                                Session Completed & Audited
                              </span>
                              <button
                                onClick={() => setDetailsModalReq(req)}
                                className="text-[11px] font-bold text-blue-800 bg-white border border-blue-300 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                              >
                                View Full Summary & Materials
                              </button>
                            </div>
                            {req.sessionSummary && (
                              <p className="text-[#51463F] leading-relaxed line-clamp-2">
                                {req.sessionSummary}
                              </p>
                            )}
                          </div>
                        )}

                        {/* REJECTED BOX */}
                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                            <strong>Notice from Mentor:</strong> {req.rejectionReason}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons Row */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#EDE2D7]/60">
                        <button
                          onClick={() => setDetailsModalReq(req)}
                          className="text-xs font-bold text-[#8064B1] hover:text-[#6E529F] flex items-center gap-1 py-1"
                        >
                          View Request Details &rarr;
                        </button>

                        <div className="flex items-center gap-2 flex-wrap">
                          {req.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancelByStudent(req)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                            >
                              Cancel Request
                            </button>
                          )}
                          <Link to="/meetings?action=book">
                            <button className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#51463F] bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#EDE2D7] transition-colors">
                              Book Another Session
                            </button>
                          </Link>
                        </div>
                      </div>
                    </WorkspaceCard>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ====================================================
              TAB: SERVICES / MARKETPLACE REQUESTS (UNIVERSAL)
             ==================================================== */}
          {activeTab === 'services' && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3.5">
              {services.length === 0 ? (
                <WorkspaceEmptyState
                  icon={<BriefcaseIcon size={26} />}
                  title="No active service requests"
                  description="You haven't requested any marketplace services yet. Browse the universal catalog across all 10 business sectors."
                  actionText="Browse Marketplace"
                  onAction={() => (window.location.href = '/marketplace')}
                  accent="coral"
                />
              ) : (
                services.map((req) => (
                  <motion.div key={req.id} variants={staggerItem} whileHover={{ y: -2, transition: motionSprings.cardHover }}>
                    <WorkspaceCard variant="default" className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF]/70 pb-2.5 gap-2">
                        <div>
                          <span className="text-[10px] text-[#82776E] block font-mono font-bold tracking-wider">
                            REQ ID: {req.id}
                          </span>
                          <h3 className="text-sm sm:text-base font-black text-[#51463F] mt-0.5">
                            {req.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#82776E] font-medium">{req.date}</span>
                          <WorkspaceBadge variant={req.status === 'IN_PROGRESS' ? 'proposal' : 'pending'}>
                            {req.statusLabel}
                          </WorkspaceBadge>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs sm:text-[13px]">
                        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]/60">
                          <strong className="text-[#51463F] font-bold block mb-0.5">
                            Your Stated Requirements:
                          </strong>
                          <p className="text-[#82776E] leading-relaxed">{req.notes}</p>
                        </div>

                        {req.targetProvider && (
                          <div className="p-3 rounded-xl bg-[#EAF7F2] border border-emerald-300 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                              <ShieldCheckIcon size={14} className="text-emerald-600" />
                              Matched Service Provider:
                            </div>
                            <div className="text-xs text-[#51463F] font-bold">
                              {req.targetProvider.name}
                              {req.targetProvider.category ? ` (${req.targetProvider.category})` : ''}
                            </div>
                          </div>
                        )}

                        {req.scheduledMeeting && (
                          <div className="p-3.5 rounded-xl bg-[#F4EEFB] border border-[#8064B1] space-y-2 text-xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-bold text-[#8064B1] flex items-center gap-1.5">
                                <VideoIcon size={14} />
                                Diligence & Scope Meeting Scheduled:
                              </span>
                              <span className="text-[11px] font-semibold text-[#51463F] bg-white px-2 py-0.5 rounded border border-[#8064B1]/30">
                                {new Date(req.scheduledMeeting.scheduledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(req.scheduledMeeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {req.scheduledMeeting.meetingLink && (
                              <div className="pt-1">
                                <a
                                  href={req.scheduledMeeting.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#8064B1] hover:bg-[#6E529F] px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
                                >
                                  <VideoIcon size={13} />
                                  Join Video Conference
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-3 rounded-xl bg-[#F4EEFB] border border-[#8064B1]/30 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-[#8064B1] text-xs">
                            <LockIcon size={13} />
                            FIC Coordinator Progress & Notes:
                          </div>
                          <p className="text-xs text-[#51463F]/90 leading-relaxed font-medium">
                            {req.ficRemark}
                          </p>
                        </div>
                      </div>
                    </WorkspaceCard>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ====================================================
              TAB: BUSINESS IDEAS (NON-MENTOR / NON-STUDENT)
             ==================================================== */}
          {!isMentor && !isStudent && activeTab === 'ideas' && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              {ideas.length === 0 ? (
                <WorkspaceEmptyState
                  icon={<LightbulbIcon size={26} />}
                  title="No incubation ideas logged"
                  description="You haven't submitted any ideas for FIC incubation review."
                  actionText="Submit Business Idea"
                  onAction={() => (window.location.href = '/business-ideas')}
                  accent="amber"
                />
              ) : (
                ideas.map((idea) => (
                  <motion.div key={idea.id} variants={staggerItem} whileHover={{ y: -2, transition: motionSprings.cardHover }}>
                    <WorkspaceCard variant="amber" className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EDE2D7]/70 pb-3 gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#E5A23B] font-mono font-bold">
                              {idea.id}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                              {idea.stage}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-[#51463F]">
                            {idea.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#82776E] font-semibold">{idea.date}</span>
                          <WorkspaceBadge variant="luxury">{idea.statusLabel}</WorkspaceBadge>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#82776E] leading-relaxed">
                        {idea.notes}
                      </p>

                      <div className="p-3.5 rounded-2xl bg-white border border-[#EDE2D7] space-y-1 text-xs">
                        <div className="font-bold text-[#E5A23B]">FIC Advisory Progress:</div>
                        <p className="text-[#82776E]">{idea.ficRemark}</p>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <Link to="/business-ideas">
                          <WorkspaceButton variant="outline" size="sm" icon={<ArrowRightIcon size={12} />}>
                            Manage in Business Ideas Desk
                          </WorkspaceButton>
                        </Link>
                      </div>
                    </WorkspaceCard>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ====================================================
              TAB: SCALING SUPPORT (NON-MENTOR / NON-STUDENT)
             ==================================================== */}
          {!isMentor && !isStudent && activeTab === 'scaling' && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              {scaling.length === 0 ? (
                <WorkspaceEmptyState
                  icon={<RocketIcon size={26} />}
                  title="No active scaling tickets"
                  description="You haven't requested any enterprise development or scaling consultations."
                  actionText="Request Scaling Support"
                  onAction={() => (window.location.href = '/scaling')}
                  accent="violet"
                />
              ) : (
                scaling.map((scale) => (
                  <motion.div key={scale.id} variants={staggerItem} whileHover={{ y: -2, transition: motionSprings.cardHover }}>
                    <WorkspaceCard variant="violet" className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EDE2D7]/70 pb-3 gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-[#8064B1] font-mono font-bold">
                            {scale.id}
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-[#51463F]">
                            {scale.businessName}
                          </h3>
                          <div className="text-xs text-[#8064B1] font-bold">
                            Focus: {scale.supportType}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#82776E] font-semibold">{scale.date}</span>
                          <WorkspaceBadge variant="proposal">{scale.statusLabel}</WorkspaceBadge>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EDE2D7]">
                          <strong className="text-[#51463F] block mb-1">Operational Challenge:</strong>
                          <p className="text-[#82776E] leading-relaxed">{scale.notes}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#F7F2FB] border border-[#8064B1]/30 space-y-1 text-xs">
                          <div className="font-bold text-[#8064A9]">Specialist Diagnostic Memo:</div>
                          <p className="text-[#82776E]">{scale.ficRemark}</p>
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <Link to="/scaling">
                          <WorkspaceButton variant="outline" size="sm" icon={<ArrowRightIcon size={12} />}>
                            View Scaling Roadmap
                          </WorkspaceButton>
                        </Link>
                      </div>
                    </WorkspaceCard>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ========================================================
          MODAL 1: VIEW FULL DETAILS (STUDENT / MENTOR)
         ======================================================== */}
      <AnimatePresence>
        {detailsModalReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#EDE2D7] space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-[#EDE2D7] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#8064B1] bg-[#F4EEFB] px-2 py-0.5 rounded border border-[#8064B1]/20">
                      {detailsModalReq.requestId}
                    </span>
                    {renderStatusBadge(detailsModalReq.status)}
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-[#51463F] mt-1.5">
                    {detailsModalReq.title}
                  </h2>
                </div>
                <button
                  onClick={() => setDetailsModalReq(null)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EDE2D7] text-[#82776E] flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Participants Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EDE2D7] text-xs">
                <div>
                  <span className="text-[10px] text-[#82776E] font-semibold uppercase block">Student Details</span>
                  <p className="font-bold text-[#51463F] text-sm">{detailsModalReq.studentName}</p>
                  <p className="text-[#82776E]">{detailsModalReq.studentEmail || 'Registered FIC Student'}</p>
                  <p className="text-[#8064B1] font-semibold mt-0.5">{detailsModalReq.studentLevel || 'Undergraduate'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#82776E] font-semibold uppercase block">Mentor Details</span>
                  <p className="font-bold text-[#51463F] text-sm">{detailsModalReq.mentorName}</p>
                  <p className="text-[#82776E]">FIC Accredited Faculty / Industry Mentor</p>
                  <p className="text-[#C66B52] font-semibold mt-0.5">Focus: {detailsModalReq.purpose}</p>
                </div>
              </div>

              {/* Schedule & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white border border-[#EDE2D7] text-xs">
                <div>
                  <span className="text-[10px] text-[#82776E] font-semibold uppercase block">Preferred Schedule</span>
                  <p className="font-bold text-[#51463F]">{detailsModalReq.preferredDate}</p>
                  <p className="text-[#82776E]">{detailsModalReq.preferredTime}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#82776E] font-semibold uppercase block">Confirmed Schedule</span>
                  <p className="font-bold text-emerald-800">
                    {detailsModalReq.confirmedDate || 'Pending confirmation'}
                  </p>
                  <p className="text-emerald-700">{detailsModalReq.confirmedTime || '--:--'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#82776E] font-semibold uppercase block">Meeting Mode</span>
                  <p className="font-bold text-[#51463F]">{detailsModalReq.meetingMode}</p>
                  {detailsModalReq.locationOrUrl && (
                    <a
                      href={detailsModalReq.locationOrUrl.startsWith('http') ? detailsModalReq.locationOrUrl : `https://${detailsModalReq.locationOrUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8064B1] underline truncate block mt-0.5 max-w-[150px]"
                    >
                      {detailsModalReq.locationOrUrl}
                    </a>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1 text-xs sm:text-sm">
                <span className="font-bold text-[#51463F] block">Student Guidance Objectives & Notes:</span>
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EDE2D7] text-[#82776E] leading-relaxed">
                  {detailsModalReq.reason}
                </div>
              </div>

              {/* Reschedule Proposal if present */}
              {detailsModalReq.rescheduleProposal && (
                <div className="p-3.5 rounded-2xl bg-[#F4EEFB] border border-[#8064B1]/40 text-xs space-y-1">
                  <span className="font-bold text-[#8064B1] block">Reschedule Proposal Audit:</span>
                  <p className="text-[#51463F] font-semibold">
                    Proposed Slot: {detailsModalReq.rescheduleProposal.proposedDate} at {detailsModalReq.rescheduleProposal.proposedTime} ({detailsModalReq.rescheduleProposal.proposedMode || detailsModalReq.meetingMode})
                  </p>
                  {detailsModalReq.rescheduleProposal.proposedNotes && (
                    <p className="text-[#82776E] italic">"{detailsModalReq.rescheduleProposal.proposedNotes}"</p>
                  )}
                </div>
              )}

              {/* Completed Session Details */}
              {detailsModalReq.status === 'COMPLETED' && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-2.5">
                  <span className="font-bold text-blue-900 text-sm block">Session Completion Summary & Recommendations:</span>
                  {detailsModalReq.sessionSummary && (
                    <div>
                      <strong className="text-[#51463F] block mb-0.5">Session Summary:</strong>
                      <p className="text-[#51463F] leading-relaxed bg-white p-2.5 rounded-xl border border-blue-100">
                        {detailsModalReq.sessionSummary}
                      </p>
                    </div>
                  )}
                  {detailsModalReq.followUpInstructions && (
                    <div>
                      <strong className="text-[#51463F] block mb-0.5">Next Steps & Action Items:</strong>
                      <p className="text-[#82776E] bg-white p-2.5 rounded-xl border border-blue-100">
                        {detailsModalReq.followUpInstructions}
                      </p>
                    </div>
                  )}
                  {detailsModalReq.recommendedMaterials && detailsModalReq.recommendedMaterials.length > 0 && (
                    <div>
                      <strong className="text-[#51463F] block mb-1">Recommended Learning Materials:</strong>
                      <ul className="list-disc pl-5 space-y-0.5 text-blue-900 font-medium">
                        {detailsModalReq.recommendedMaterials.map((mat: string, i: number) => (
                          <li key={i}>{mat}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Rejection notice if present */}
              {detailsModalReq.status === 'REJECTED' && detailsModalReq.rejectionReason && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                  <strong className="block mb-0.5">Rejection Reason:</strong>
                  {detailsModalReq.rejectionReason}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setDetailsModalReq(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-[#51463F] bg-[#FAF7F2] hover:bg-[#EDE2D7] border border-[#EDE2D7]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 2: ACCEPT REQUEST (MENTOR)
         ======================================================== */}
      <AnimatePresence>
        {acceptModalReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#EDE2D7] space-y-4"
            >
              <div className="flex items-start justify-between border-b border-[#EDE2D7] pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#51463F]">
                    Accept & Confirm Consultation
                  </h3>
                  <p className="text-xs text-[#82776E] mt-0.5">
                    For student: <strong className="text-[#51463F]">{acceptModalReq.studentName}</strong> ({acceptModalReq.title})
                  </p>
                </div>
                <button
                  onClick={() => setAcceptModalReq(null)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EDE2D7] text-[#82776E] flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAcceptSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#51463F] block mb-1">Confirmed Date *</label>
                    <input
                      type="date"
                      required
                      value={acceptForm.confirmedDate}
                      onChange={(e) => setAcceptForm({ ...acceptForm, confirmedDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#51463F] block mb-1">Confirmed Time *</label>
                    <input
                      type="time"
                      required
                      value={acceptForm.confirmedTime}
                      onChange={(e) => setAcceptForm({ ...acceptForm, confirmedTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#51463F] block mb-1">Meeting Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAcceptForm({ ...acceptForm, meetingMode: 'ONLINE' })}
                      className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                        acceptForm.meetingMode === 'ONLINE'
                          ? 'bg-[#EAF7F2] text-emerald-800 border-emerald-400'
                          : 'bg-[#FAF7F2] text-[#82776E] border-[#EDE2D7]'
                      }`}
                    >
                      <VideoIcon size={14} /> Virtual Video Call
                    </button>
                    <button
                      type="button"
                      onClick={() => setAcceptForm({ ...acceptForm, meetingMode: 'OFFLINE' })}
                      className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                        acceptForm.meetingMode === 'OFFLINE'
                          ? 'bg-[#EAF7F2] text-emerald-800 border-emerald-400'
                          : 'bg-[#FAF7F2] text-[#82776E] border-[#EDE2D7]'
                      }`}
                    >
                      <MapPinIcon size={14} /> In-Person Meeting
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#51463F] block mb-1">
                    {acceptForm.meetingMode === 'ONLINE' ? 'Video Meeting URL (Google Meet / Zoom)' : 'Physical Meeting Location'}
                  </label>
                  <input
                    type="text"
                    value={acceptForm.locationOrUrl}
                    onChange={(e) => setAcceptForm({ ...acceptForm, locationOrUrl: e.target.value })}
                    placeholder={acceptForm.meetingMode === 'ONLINE' ? 'https://meet.google.com/xyz-abc' : 'FIC Incubation Lab Room 204'}
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#51463F] block mb-1">Preparation Instructions for Student</label>
                  <textarea
                    rows={2}
                    value={acceptForm.mentorNotes}
                    onChange={(e) => setAcceptForm({ ...acceptForm, mentorNotes: e.target.value })}
                    placeholder="e.g. Please bring your project demo link and list of key architecture questions."
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#EDE2D7]">
                  <button
                    type="button"
                    onClick={() => setAcceptModalReq(null)}
                    className="px-4 py-2 rounded-xl font-bold text-[#82776E] hover:text-[#51463F] bg-[#FAF7F2] border border-[#EDE2D7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md"
                  >
                    {isSubmitting ? 'Confirming...' : 'Confirm & Schedule Session'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 3: DECLINE / REJECT REQUEST (MENTOR)
         ======================================================== */}
      <AnimatePresence>
        {rejectModalReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#EDE2D7] space-y-4"
            >
              <div className="flex items-start justify-between border-b border-[#EDE2D7] pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-rose-900">
                    Decline Mentorship Request
                  </h3>
                  <p className="text-xs text-[#82776E]">
                    Student: {rejectModalReq.studentName}
                  </p>
                </div>
                <button
                  onClick={() => setRejectModalReq(null)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EDE2D7] text-[#82776E] flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRejectSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-[#51463F] block mb-1">
                    Polite Reason for Declining *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Schedule conflicts during university exam evaluation week. Please check back next month."
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-rose-400"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-[#82776E]">
                    <span>Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => setRejectionReason('Currently fully booked for this month.')}
                      className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#EDE2D7] hover:bg-white"
                    >
                      Fully Booked
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectionReason('Topic is outside my core research & advisory domain.')}
                      className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#EDE2D7] hover:bg-white"
                    >
                      Domain Mismatch
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#EDE2D7]">
                  <button
                    type="button"
                    onClick={() => setRejectModalReq(null)}
                    className="px-4 py-2 rounded-xl font-bold text-[#82776E] bg-[#FAF7F2] border border-[#EDE2D7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md"
                  >
                    {isSubmitting ? 'Submitting...' : 'Decline Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 4: PROPOSE RESCHEDULE (MENTOR)
         ======================================================== */}
      <AnimatePresence>
        {rescheduleModalReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#EDE2D7] space-y-4"
            >
              <div className="flex items-start justify-between border-b border-[#EDE2D7] pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#8064B1]">
                    Propose Alternative Reschedule
                  </h3>
                  <p className="text-xs text-[#82776E]">
                    Student: {rescheduleModalReq.studentName}
                  </p>
                </div>
                <button
                  onClick={() => setRescheduleModalReq(null)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EDE2D7] text-[#82776E] flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#51463F] block mb-1">Proposed Date *</label>
                    <input
                      type="date"
                      required
                      value={rescheduleForm.proposedDate}
                      onChange={(e) => setRescheduleForm({ ...rescheduleForm, proposedDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-[#8064B1]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#51463F] block mb-1">Proposed Time *</label>
                    <input
                      type="time"
                      required
                      value={rescheduleForm.proposedTime}
                      onChange={(e) => setRescheduleForm({ ...rescheduleForm, proposedTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-[#8064B1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#51463F] block mb-1">Proposed Mode</label>
                  <select
                    value={rescheduleForm.proposedMode}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, proposedMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-[#8064B1]"
                  >
                    <option value="ONLINE">Virtual Video Call (Online)</option>
                    <option value="OFFLINE">Campus / Office In-Person (Offline)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#51463F] block mb-1">Note for Student Explaining Reschedule</label>
                  <textarea
                    rows={2}
                    value={rescheduleForm.proposedNotes}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, proposedNotes: e.target.value })}
                    placeholder="e.g. Can we meet Wednesday afternoon instead? I have a faculty meeting at the requested time."
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-[#8064B1]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#EDE2D7]">
                  <button
                    type="button"
                    onClick={() => setRescheduleModalReq(null)}
                    className="px-4 py-2 rounded-xl font-bold text-[#82776E] bg-[#FAF7F2] border border-[#EDE2D7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-[#8064B1] to-[#6E529F] hover:from-[#6E529F] hover:to-[#5E428F] shadow-md"
                  >
                    {isSubmitting ? 'Submitting...' : 'Send Reschedule Proposal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 5: COMPLETE SESSION AUDIT (MENTOR)
         ======================================================== */}
      <AnimatePresence>
        {completeModalReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#EDE2D7] space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-[#EDE2D7] pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-blue-900">
                    Log Completed Mentorship Session
                  </h3>
                  <p className="text-xs text-[#82776E]">
                    Student: {completeModalReq.studentName} ({completeModalReq.title})
                  </p>
                </div>
                <button
                  onClick={() => setCompleteModalReq(null)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EDE2D7] text-[#82776E] flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCompleteSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-[#51463F] block mb-1">
                    Executive Session Summary *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={completeForm.sessionSummary}
                    onChange={(e) => setCompleteForm({ ...completeForm, sessionSummary: e.target.value })}
                    placeholder="e.g. Conducted portfolio audit. Discussed database schema normalization and advised on preparing 2 microservice case studies for placement interviews."
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#51463F] block mb-1">
                    Follow-Up Instructions / Homework for Student
                  </label>
                  <textarea
                    rows={2}
                    value={completeForm.followUpInstructions}
                    onChange={(e) => setCompleteForm({ ...completeForm, followUpInstructions: e.target.value })}
                    placeholder="e.g. Complete Docker containerization of backend API and push GitHub repo before next review call."
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#51463F] block mb-1">
                    Recommended Reading / Tools (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={completeForm.recommendedMaterials}
                    onChange={(e) => setCompleteForm({ ...completeForm, recommendedMaterials: e.target.value })}
                    placeholder="e.g. Designing Data-Intensive Applications, Kafka Quickstart Guide"
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE2D7] bg-[#FAF7F2] text-[#51463F] font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#EDE2D7]">
                  <button
                    type="button"
                    onClick={() => setCompleteModalReq(null)}
                    className="px-4 py-2 rounded-xl font-bold text-[#82776E] bg-[#FAF7F2] border border-[#EDE2D7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                  >
                    {isSubmitting ? 'Logging...' : 'Submit Session Completion'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </WorkspaceShell>
  );
};

export default MyRequestsPage;