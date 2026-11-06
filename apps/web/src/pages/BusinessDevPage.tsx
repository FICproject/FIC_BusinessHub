import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceBadge,
  WorkspaceEmptyState
} from '../components/workspace/WorkspaceComponents';
import { AnimatedModal } from '../motion';
import {
  RocketIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  SearchIcon,
  ClockIcon,
  FileTextIcon
} from '../components/Icons';
import { apiRequest, getStoredUser } from '../services/api';

export interface ScalingRequestRecord {
  id: string;
  refNumber?: string;
  userId: string;
  businessName: string;
  supportType: string;
  supportTypeLabel: string;
  currentChallenges: string;
  expectedOutcomes: string;
  status:
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'ASSESSMENT_IN_PROGRESS'
    | 'SPECIALIST_ASSIGNED'
    | 'DIAGNOSTIC_COMPLETED'
    | 'ACTION_PLAN_PREPARED'
    | 'IMPLEMENTATION_IN_PROGRESS'
    | 'WAITING_FOR_MEMBER'
    | 'COMPLETED'
    | 'ON_HOLD';
  submittedDate: string;
  latestFicUpdate?: string;
  whatHappensNext?: string;
  ficRecommendations?: string;
  updateHistory?: {
    date: string;
    status: string;
    update: string;
    updatedBy?: string;
  }[];
}

export const SCALING_STATUS_CONFIG: Record<
  string,
  { label: string; explanation: string; variant: 'pending' | 'proposal' | 'active' | 'luxury' | 'urgent' | 'neutral' }
> = {
  SUBMITTED: {
    label: 'Submitted',
    explanation: 'Your scaling request has been received.',
    variant: 'pending'
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    explanation: 'FIC is reviewing your business requirements.',
    variant: 'pending'
  },
  ASSESSMENT_IN_PROGRESS: {
    label: 'Assessment in Progress',
    explanation: 'Your business assessment is in progress.',
    variant: 'luxury'
  },
  SPECIALIST_ASSIGNED: {
    label: 'Specialist Assigned',
    explanation: 'An industry specialist has been assigned to your request.',
    variant: 'proposal'
  },
  DIAGNOSTIC_COMPLETED: {
    label: 'Diagnostic Completed',
    explanation: 'Initial diagnosis has been completed.',
    variant: 'proposal'
  },
  ACTION_PLAN_PREPARED: {
    label: 'Action Plan Ready',
    explanation: 'Your action plan is ready for review.',
    variant: 'active'
  },
  IMPLEMENTATION_IN_PROGRESS: {
    label: 'Implementation in Progress',
    explanation: 'Action plan execution is currently active.',
    variant: 'luxury'
  },
  WAITING_FOR_MEMBER: {
    label: 'Waiting for Member',
    explanation: 'Please provide requested information to continue.',
    variant: 'urgent'
  },
  COMPLETED: {
    label: 'Completed',
    explanation: 'This scaling request has been completed.',
    variant: 'active'
  },
  ON_HOLD: {
    label: 'On Hold',
    explanation: 'This request is temporarily on hold.',
    variant: 'urgent'
  }
};

export const BusinessDevPage: React.FC = () => {
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_default';

  // Tabs: 'submit' | 'active_requests'
  const [activeTab, setActiveTab] = useState<'submit' | 'active_requests'>('submit');

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [supportType, setSupportType] = useState('BUSINESS_PLANNING');
  const [currentChallenges, setCurrentChallenges] = useState('');
  const [expectedOutcomes, setExpectedOutcomes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Listing State
  const [scalingList, setScalingList] = useState<ScalingRequestRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<ScalingRequestRecord | null>(null);

  const storageKey = `fic_user_scaling_${userId}`;

  const supportTypeLabels: Record<string, string> = {
    BUSINESS_PLANNING: 'Strategic Business Planning & Turnaround',
    SETUP_GUIDANCE: 'New Entity Setup & Statutory Compliance',
    MARKET_RESEARCH: 'Market Research & Customer Discovery',
    BRANDING_MARKETING: 'Branding & Digital Customer Acquisition',
    TECHNOLOGY_DEVELOPMENT: 'Technology Modernization & Cloud Systems',
    OPERATIONAL_IMPROVEMENT: 'Operational & Factory Floor Lean Optimization',
    EXPANSION_SCALING: 'Regional Expansion & Distributor Channel Onboarding',
    GENERAL_CONSULTANCY: 'General Business Advisory & Mentoring'
  };

  const initialDemoScaling: ScalingRequestRecord[] = [];

  // Load from server and local storage
  useEffect(() => {
    const loadRequests = async () => {
      let merged: ScalingRequestRecord[] = [];
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed: ScalingRequestRecord[] = JSON.parse(stored);
          merged = [...parsed];
        }
      } catch (err) {
        console.warn('LocalStorage load warning:', err);
      }

      try {
        const res = await apiRequest('/business-development-requests/me');
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const serverItems: ScalingRequestRecord[] = res.data.map((item: any) => ({
            id: item.refNumber || item._id,
            refNumber: item.refNumber || item._id,
            userId: item.userId,
            businessName: item.businessName,
            supportType: item.supportType,
            supportTypeLabel: supportTypeLabels[item.supportType] || item.supportType,
            currentChallenges: item.currentChallenges,
            expectedOutcomes: item.expectedOutcomes,
            status: item.status || 'SUBMITTED',
            submittedDate: item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
              : 'Recently',
            latestFicUpdate:
              item.latestFicUpdate || 'Your scaling request has been received. Our team is reviewing your business requirements.',
            whatHappensNext: item.whatHappensNext || 'FIC will review your request and share an update.',
            ficRecommendations: item.ficRecommendations,
            updateHistory: item.updateHistory || [
              {
                date: item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'Today',
                status: 'Submitted',
                update: 'Your scaling request has been received.'
              }
            ]
          }));

          const serverIds = new Set(serverItems.map((s) => s.id));
          const nonServer = merged.filter((m) => !serverIds.has(m.id));
          merged = [...serverItems, ...nonServer];
        }
      } catch (err) {
        console.warn('Backend fetch failed, using local seed:', err);
      }

      setScalingList(merged);
      try {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch (e) {
        console.error(e);
      }
    };

    loadRequests();
  }, [storageKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const generatedRef = `SCALE-2026-${Math.floor(100 + Math.random() * 900)}`;
    const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    const newScalingRecord: ScalingRequestRecord = {
      id: generatedRef,
      refNumber: generatedRef,
      userId,
      businessName: businessName.trim(),
      supportType,
      supportTypeLabel: supportTypeLabels[supportType] || supportType,
      currentChallenges: currentChallenges.trim(),
      expectedOutcomes: expectedOutcomes.trim(),
      status: 'SUBMITTED',
      submittedDate: todayFormatted,
      latestFicUpdate: 'Your scaling request has been received. Our team is reviewing your business requirements.',
      whatHappensNext: 'FIC will review your request and share an update.',
      updateHistory: [
        {
          date: todayFormatted,
          status: 'Submitted',
          update: 'Your scaling request has been received. Our team is reviewing your business requirements.',
          updatedBy: 'FIC Enterprise Desk'
        }
      ]
    };

    try {
      await apiRequest('/business-development-requests', {
        method: 'POST',
        body: JSON.stringify({
          refNumber: generatedRef,
          businessName: businessName.trim(),
          supportType,
          currentChallenges: currentChallenges.trim(),
          expectedOutcomes: expectedOutcomes.trim()
        })
      });
    } catch {
      // Graceful fallback to client persistence
    } finally {
      const updated = [newScalingRecord, ...scalingList];
      setScalingList(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      setSubmittedRef(generatedRef);
      setIsSubmitted(true);
      setIsLoading(false);
    }
  };

  // Filtered Scaling Requests
  const filteredRequests = scalingList.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.businessName.toLowerCase().includes(q);
      const matchType = item.supportTypeLabel.toLowerCase().includes(q);
      const matchDesc = item.currentChallenges.toLowerCase().includes(q);
      const matchRef = (item.refNumber || item.id).toLowerCase().includes(q);
      if (!matchName && !matchType && !matchDesc && !matchRef) return false;
    }
    return true;
  });

  const getStatusBadge = (st: string) => {
    const config = SCALING_STATUS_CONFIG[st] || { label: st, variant: 'pending' as const };
    return <WorkspaceBadge variant={config.variant}>{config.label}</WorkspaceBadge>;
  };

  const getWhatHappensNext = (req: ScalingRequestRecord) => {
    if (req.whatHappensNext) return req.whatHappensNext;
    switch (req.status) {
      case 'WAITING_FOR_MEMBER':
        return 'Please provide the requested information to proceed.';
      case 'ACTION_PLAN_PREPARED':
        return 'Your action plan is ready for review.';
      case 'SPECIALIST_ASSIGNED':
      case 'ASSESSMENT_IN_PROGRESS':
        return 'Our specialist is preparing recommendations.';
      case 'COMPLETED':
        return 'All scaling objectives have been completed.';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      default:
        return 'FIC will review your request and share an update.';
    }
  };

  return (
    <WorkspaceShell>
      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="violet"
        title="Business Development & Enterprise Scaling"
        subtitle="Submit your business challenges, get connected with experienced specialists, and track roadmap updates simply and clearly."
      />

      {/* ========================================================
          2. TWO-TAB WORKSPACE SWITCHER
         ======================================================== */}
      <div className="flex items-center gap-2 border-b border-[#EDE2D7] pb-2.5 mb-5">
        <button
          type="button"
          onClick={() => setActiveTab('submit')}
          className={`relative px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-[13px] transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'submit' ? 'text-white' : 'text-[#453A33] hover:text-[#C65638] font-bold'
          }`}
        >
          {activeTab === 'submit' && (
            <motion.div
              layoutId="scalingTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-gradient-to-r from-[#8064B1] to-[#6E529F] rounded-xl shadow-[0_2px_8px_rgba(128,100,177,0.25)] -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <RocketIcon size={15} />
            <span>Submit Scaling Request</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('active_requests')}
          className={`relative px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-[13px] transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'active_requests' ? 'text-white' : 'text-[#453A33] hover:text-[#C65638] font-bold'
          }`}
        >
          {activeTab === 'active_requests' && (
            <motion.div
              layoutId="scalingTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-gradient-to-r from-[#8064B1] to-[#6E529F] rounded-xl shadow-[0_2px_8px_rgba(128,100,177,0.25)] -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <FileTextIcon size={15} />
            <span>Active Requests & Roadmaps</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'active_requests'
                  ? 'bg-white/25 text-white'
                  : 'bg-[#FAF7F2] text-[#453A33] border border-[#EDE2D7]'
              }`}
            >
              {scalingList.length}
            </span>
          </span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: SUBMIT SCALING REQUEST FORM / SUCCESS BANNER
         ======================================================== */}
      {activeTab === 'submit' && (
        <div className="max-w-3xl mx-auto">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <WorkspaceCard variant="violet" className="text-center py-8 px-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8064B1] to-[#9B7CC6] text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircleIcon size={28} />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-xs font-mono font-bold">
                    Reference: {submittedRef}
                  </span>
                  <h3 className="text-xl font-black text-[#2E231C]">Scaling Request Registered!</h3>
                  <p className="text-xs sm:text-sm text-[#453A33] leading-relaxed">
                    FIC Business Development wing has received your scaling request for <strong className="text-[#2E231C]">{businessName}</strong>.
                  </p>
                  <p className="text-xs text-[#6B5E55] leading-relaxed bg-white/70 p-3 rounded-xl border border-[#EDE2D7]">
                    You can track your request status and latest FIC updates under <strong>"Active Requests & Roadmaps"</strong>.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <WorkspaceButton
                    variant="violet"
                    size="md"
                    onClick={() => setActiveTab('active_requests')}
                    icon={<ArrowRightIcon size={14} />}
                  >
                    Active Requests & Roadmaps
                  </WorkspaceButton>
                  <WorkspaceButton
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setBusinessName('');
                      setCurrentChallenges('');
                      setExpectedOutcomes('');
                      setIsSubmitted(false);
                      setSubmittedRef('');
                    }}
                  >
                    Submit Another Requirement
                  </WorkspaceButton>
                </div>
              </WorkspaceCard>
            </motion.div>
          ) : (
            <WorkspaceCard variant="default">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Business / Company Name */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#2E231C] block">
                    Business / Company Name <span className="text-[#C65638]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your business or company name."
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#2E231C] placeholder-[#82776E]/70 shadow-2xs"
                  />
                </div>

                {/* 2. Required Growth & Development Area */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#2E231C] block">
                    Required Growth & Development Area
                  </label>
                  <select
                    className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] focus:outline-none focus:ring-2 focus:ring-[#8064B1] shadow-2xs font-semibold"
                    value={supportType}
                    onChange={(e) => setSupportType(e.target.value)}
                  >
                    <option value="BUSINESS_PLANNING">Strategic Business Planning & Turnaround</option>
                    <option value="SETUP_GUIDANCE">New Entity Setup & Statutory Compliance</option>
                    <option value="MARKET_RESEARCH">Market Research & Customer Discovery</option>
                    <option value="BRANDING_MARKETING">Branding & Digital Customer Acquisition</option>
                    <option value="TECHNOLOGY_DEVELOPMENT">Technology Modernization & Cloud Systems</option>
                    <option value="OPERATIONAL_IMPROVEMENT">Operational & Factory Floor Lean Optimization</option>
                    <option value="EXPANSION_SCALING">Regional Expansion & Distributor Channel Onboarding</option>
                    <option value="GENERAL_CONSULTANCY">General Business Advisory & Mentoring</option>
                  </select>
                </div>

                {/* 3. Current Business Challenges */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#2E231C] block">
                    Current Business Challenges <span className="text-[#C65638]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full text-xs sm:text-[13px] p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#2E231C] placeholder-[#82776E]/70 shadow-2xs leading-relaxed"
                    placeholder="Explain the problems you currently face in your business. For example: delayed deliveries, low sales, lack of customers, inventory issues, or difficulty expanding into new locations."
                    value={currentChallenges}
                    onChange={(e) => setCurrentChallenges(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* 4. Target Objectives & Desired Improvements */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#2E231C] block">
                    Target Objectives & Desired Improvements <span className="text-[#C65638]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full text-xs sm:text-[13px] p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8064B1] bg-white text-[#2E231C] placeholder-[#82776E]/70 shadow-2xs leading-relaxed"
                    placeholder="Explain what you want to improve. For example: increase sales, reduce delivery delays, expand to new cities, or improve business operations."
                    value={expectedOutcomes}
                    onChange={(e) => setExpectedOutcomes(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* Confidentiality Notice */}
                <div className="p-3 rounded-xl bg-[#EAE3F4]/40 border border-[#8064B1]/30 text-xs text-[#2E231C] flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#8064B1]/15 text-[#8064B1] flex items-center justify-center shrink-0">
                    <ShieldCheckIcon size={14} />
                  </div>
                  <p className="text-[11px] text-[#453A33] leading-relaxed">
                    FIC Business Development programs adhere to strict commercial confidentiality. All strategic assessments are conducted by verified industry specialists.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex justify-end">
                  <WorkspaceButton
                    variant="violet"
                    size="md"
                    type="submit"
                    loading={isLoading}
                    icon={<ArrowRightIcon size={14} />}
                  >
                    Submit Scaling Request
                  </WorkspaceButton>
                </div>
              </form>
            </WorkspaceCard>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: ACTIVE REQUESTS & ROADMAPS (SIMPLE CARDS ONLY)
         ======================================================== */}
      {activeTab === 'active_requests' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Simple Search */}
          <div className="relative">
            <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
            <input
              type="text"
              placeholder="Search by company name, support area, or reference number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-xs sm:text-[13px] text-[#2E231C] placeholder-[#82776E]/70 focus:outline-none focus:ring-2 focus:ring-[#8064B1]"
            />
          </div>

          {/* Simple Scaling Cards List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredRequests.length === 0 ? (
                <motion.div
                  key="empty-scaling"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <WorkspaceEmptyState
                    icon={<RocketIcon size={28} />}
                    title="No scaling requests found"
                    description="No active scaling requests match your search."
                    actionText="Submit Scaling Requirement"
                    onAction={() => setActiveTab('submit')}
                    accent="violet"
                  />
                </motion.div>
              ) : (
                filteredRequests.map((req) => {
                  return (
                    <motion.div
                      key={req.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <WorkspaceCard variant="default" className="space-y-3 p-4 sm:p-5">
                        {/* Title & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE2D7]/70 pb-3">
                          <div>
                            <h3 className="text-base sm:text-lg font-black text-[#2E231C]">
                              {req.businessName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#6B5E55]">
                              <span>
                                <strong>Reference: </strong>
                                <span className="font-mono font-bold text-[#2E231C]">{req.refNumber || req.id}</span>
                              </span>
                              <span>•</span>
                              <span>
                                <strong>Support Area: </strong>
                                <span className="text-[#8064B1] font-semibold">{req.supportTypeLabel}</span>
                              </span>
                              <span>•</span>
                              <span>
                                <strong>Submitted: </strong>
                                {req.submittedDate}
                              </span>
                            </div>
                          </div>
                          <div>{getStatusBadge(req.status)}</div>
                        </div>

                        {/* Latest FIC Update (1 or 2 lines) */}
                        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] text-xs">
                          <strong className="text-[#2E231C] block mb-0.5">Latest FIC Update:</strong>
                          <p className="text-[#453A33] leading-relaxed">
                            "{req.latestFicUpdate || 'Our team is reviewing your business requirements.'}"
                          </p>
                        </div>

                        {/* Button: View Details */}
                        <div className="flex justify-end pt-1">
                          <WorkspaceButton
                            variant="violet"
                            size="sm"
                            onClick={() => setSelectedRequest(req)}
                            icon={<ArrowRightIcon size={13} />}
                          >
                            View Details
                          </WorkspaceButton>
                        </div>
                      </WorkspaceCard>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ========================================================
          3. VIEW DETAILS – SIMPLE MODAL (EXACT 5 SECTIONS)
         ======================================================== */}
      <AnimatedModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        maxWidth="max-w-2xl"
        title={
          selectedRequest && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-[#6B5E55] font-mono font-bold bg-stone-100 px-2 py-0.5 rounded">
                  Reference: {selectedRequest.refNumber || selectedRequest.id}
                </span>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#2E231C]">
                {selectedRequest.businessName}
              </h3>
            </div>
          )
        }
      >
        {selectedRequest && (
          <div className="space-y-5">
            {/* ----------------------------------------------------
                1. WHAT YOU SUBMITTED
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                1. What You Submitted
              </h4>
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#6B5E55] font-bold block mb-0.5">Company Name:</span>
                    <p className="text-[#2E231C] font-black text-sm">{selectedRequest.businessName}</p>
                  </div>
                  <div>
                    <span className="text-[#6B5E55] font-bold block mb-0.5">Requested Support Area:</span>
                    <p className="text-[#8064B1] font-bold">{selectedRequest.supportTypeLabel}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[#6B5E55] font-bold block mb-0.5">Current Business Challenges:</span>
                  <p className="text-[#453A33] leading-relaxed bg-white p-2.5 rounded-lg border border-[#EDE2D7]">
                    {selectedRequest.currentChallenges}
                  </p>
                </div>

                <div>
                  <span className="text-[#6B5E55] font-bold block mb-0.5">Target Objectives & Desired Improvements:</span>
                  <p className="text-[#453A33] leading-relaxed bg-white p-2.5 rounded-lg border border-[#EDE2D7]">
                    {selectedRequest.expectedOutcomes}
                  </p>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------
                2. FIC LATEST UPDATE
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                2. FIC Latest Update
              </h4>
              <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-xs">
                <p className="text-purple-950 font-medium leading-relaxed">
                  "{selectedRequest.latestFicUpdate || 'Our team is reviewing your business requirements.'}"
                </p>
              </div>
            </div>

            {/* ----------------------------------------------------
                3. CURRENT STATUS
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                3. Current Status
              </h4>
              <div className="p-3.5 rounded-xl bg-white border border-[#EDE2D7] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  {getStatusBadge(selectedRequest.status)}
                  <span className="text-[#453A33] font-medium">
                    {SCALING_STATUS_CONFIG[selectedRequest.status]?.explanation || 'Your request is being processed.'}
                  </span>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------
                4. WHAT HAPPENS NEXT?
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                4. What Happens Next?
              </h4>
              <div className="p-3.5 rounded-xl bg-white border border-[#EDE2D7] text-xs">
                <p className="text-[#453A33] leading-relaxed font-medium">
                  {getWhatHappensNext(selectedRequest)}
                </p>
              </div>
            </div>

            {/* Optional: FIC Recommendations (Only if genuine recommendation exists) */}
            {selectedRequest.ficRecommendations && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                  FIC Recommendations
                </h4>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                  <p className="text-emerald-950 leading-relaxed font-medium">
                    {selectedRequest.ficRecommendations}
                  </p>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                5. UPDATE HISTORY
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                5. Update History
              </h4>
              <div className="p-3.5 rounded-xl bg-white border border-[#EDE2D7] text-xs space-y-2.5">
                {selectedRequest.updateHistory && selectedRequest.updateHistory.length > 0 ? (
                  selectedRequest.updateHistory.map((hist, idx) => (
                    <div
                      key={idx}
                      className="border-b border-[#EDE2D7]/60 pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <strong className="text-[#2E231C]">{hist.status}</strong>
                        <span className="text-[#6B5E55] font-medium">{hist.date}</span>
                      </div>
                      <p className="text-[#453A33] text-[11px] leading-relaxed">{hist.update}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#6B5E55] text-xs">No previous updates recorded.</p>
                )}
              </div>
            </div>

            {/* Close */}
            <div className="pt-2 flex justify-end border-t border-[#EDE2D7]">
              <WorkspaceButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>
    </WorkspaceShell>
  );
};

export default BusinessDevPage;
