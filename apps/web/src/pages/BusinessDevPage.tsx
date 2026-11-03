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
import { AnimatedModal, ScrollReveal, AnimatedProgress } from '../motion';
import {
  RocketIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  ShieldCheckIcon,
  SearchIcon,
  BriefcaseIcon,
  ClockIcon,
  AlertCircleIcon,
  FileTextIcon
} from '../components/Icons';
import { apiRequest, getStoredUser } from '../services/api';

export interface ScalingRequestRecord {
  id: string;
  userId: string;
  businessName: string;
  supportType: string;
  supportTypeLabel: string;
  currentChallenges: string;
  expectedOutcomes: string;
  status: 'DIAGNOSTIC_PENDING' | 'SPECIALIST_ASSIGNED' | 'ROADMAP_PREPARED' | 'EXECUTION_IN_PROGRESS';
  statusLabel: string;
  submittedDate: string;
  assignedSpecialist?: {
    name: string;
    title: string;
    desk: string;
  };
  diagnosticNotes?: string;
  milestones?: {
    phase: string;
    timeframe: string;
    goal: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  }[];
}

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
  const [isLoading, setIsLoading] = useState(false);

  // Listing State
  const [scalingList, setScalingList] = useState<ScalingRequestRecord[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
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

  const initialDemoScaling: ScalingRequestRecord[] = [
    {
      id: 'SCALE-2026-402',
      userId,
      businessName: user?.fullName ? `${user.fullName} Enterprises` : 'Apex Industrial Unit',
      supportType: 'TECHNOLOGY_DEVELOPMENT',
      supportTypeLabel: 'Technology Modernization & Cloud Systems',
      currentChallenges:
        'Legacy on-premise inventory software lacks real-time multi-warehouse sync, resulting in delayed fulfillment and 12% stock discrepancies across southern regional depots.',
      expectedOutcomes:
        'Transition to automated cloud ERP architecture with IoT-assisted inventory tracking and barcoded dispatch verification.',
      status: 'ROADMAP_PREPARED',
      statusLabel: 'Roadmap Prepared',
      submittedDate: '26 Oct 2026',
      assignedSpecialist: {
        name: 'V. Ramanathan, M.Tech',
        title: 'FIC Senior Cloud & Industry 4.0 Advisor',
        desk: 'Technology & Enterprise Modernization Wing'
      },
      diagnosticNotes:
        'Diagnostic audit completed. Bottlenecks stem from legacy batch syncing. FIC advisory committee has architected an incremental microservices migration framework with zero factory downtime.',
      milestones: [
        {
          phase: 'Phase 1: Architecture Audit & Data Hygiene',
          timeframe: 'Day 1 - 30',
          goal: 'Audit SQL schemas, establish data backup pipelines and define REST contract specs.',
          status: 'COMPLETED'
        },
        {
          phase: 'Phase 2: Warehouse Pilot Deployment',
          timeframe: 'Day 31 - 60',
          goal: 'Deploy cloud instance to flagship Coimbatore warehouse with mobile scanner integration.',
          status: 'IN_PROGRESS'
        },
        {
          phase: 'Phase 3: Full Multi-Depot Synchronization',
          timeframe: 'Day 61 - 90',
          goal: 'Rollout to remaining 3 depots, conduct staff retraining and activate real-time management dashboard.',
          status: 'UPCOMING'
        }
      ]
    },
    {
      id: 'SCALE-2026-319',
      userId,
      businessName: 'Kongu Agro Processing',
      supportType: 'EXPANSION_SCALING',
      supportTypeLabel: 'Regional Expansion & Distributor Channel Onboarding',
      currentChallenges:
        'Concentrated retail presence in 3 districts only. Seeking verified distributor networks across Karnataka and Kerala for value-added organic pulses.',
      expectedOutcomes:
        'Onboard 8 tier-1 FMCG distributors and set up standardized credit governance agreements.',
      status: 'SPECIALIST_ASSIGNED',
      statusLabel: 'Specialist Assigned',
      submittedDate: '19 Oct 2026',
      assignedSpecialist: {
        name: 'M. Anand, MBA',
        title: 'Director - FIC Distribution Alliances',
        desk: 'FMCG & Commercial Retail Syndication'
      },
      diagnosticNotes:
        'Intermediary vetting in progress. 5 candidate distributor profiles identified through FIC verified network. Exploratory NDA sessions scheduled.',
      milestones: [
        {
          phase: 'Phase 1: Distributor Profiling & Margin Standardization',
          timeframe: 'Day 1 - 20',
          goal: 'Establish commercial pricing tiers, logistics SLAs and dealer margin structure.',
          status: 'COMPLETED'
        },
        {
          phase: 'Phase 2: Bilateral Facilitated Matchmaking',
          timeframe: 'Day 21 - 45',
          goal: 'FIC intermediary convenes confidential introduction meetings with shortlisted distribution houses.',
          status: 'IN_PROGRESS'
        }
      ]
    }
  ];

  // Load from localStorage or seed
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setScalingList(JSON.parse(stored));
      } else {
        localStorage.setItem(storageKey, JSON.stringify(initialDemoScaling));
        setScalingList(initialDemoScaling);
      }
    } catch {
      setScalingList(initialDemoScaling);
    }
  }, [storageKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newScalingRecord: ScalingRequestRecord = {
      id: `SCALE-2026-${Math.floor(100 + Math.random() * 900)}`,
      userId,
      businessName: businessName.trim(),
      supportType,
      supportTypeLabel: supportTypeLabels[supportType] || supportType,
      currentChallenges: currentChallenges.trim(),
      expectedOutcomes: expectedOutcomes.trim(),
      status: 'DIAGNOSTIC_PENDING',
      statusLabel: 'Diagnostic Pending',
      submittedDate: 'Today',
      assignedSpecialist: {
        name: 'FIC Specialist Allocation Desk',
        title: 'Senior Sector Director',
        desk: 'Enterprise Scaling Wing'
      },
      diagnosticNotes:
        'Your scaling diagnostic request has been logged. An FIC Sector Director will review your operational pain points and initiate preliminary specialist scoping.',
      milestones: [
        {
          phase: 'Phase 1: Operational Diagnostic Review',
          timeframe: 'Day 1 - 15',
          goal: 'FIC specialist conducts preliminary diagnostic review of operational challenges and prepares scoping memo.',
          status: 'IN_PROGRESS'
        },
        {
          phase: 'Phase 2: Bespoke Scaling Roadmap Delivery',
          timeframe: 'Day 16 - 45',
          goal: 'Present comprehensive turnaround and capability expansion strategy.',
          status: 'UPCOMING'
        }
      ]
    };

    try {
      await apiRequest('/business-development-requests', {
        method: 'POST',
        body: JSON.stringify({
          businessName,
          supportType,
          currentChallenges,
          expectedOutcomes
        })
      });
    } catch {
      // Graceful fallback to client-side persistence
    } finally {
      const updated = [newScalingRecord, ...scalingList];
      setScalingList(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      setIsSubmitted(true);
      setIsLoading(false);
    }
  };

  // Filtered Scaling Requests
  const filteredRequests = scalingList.filter((item) => {
    if (filterType !== 'ALL' && item.supportType !== filterType) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.businessName.toLowerCase().includes(q);
      const matchType = item.supportTypeLabel.toLowerCase().includes(q);
      const matchDesc = item.currentChallenges.toLowerCase().includes(q);
      if (!matchName && !matchType && !matchDesc) return false;
    }
    return true;
  });

  const getStatusBadge = (st: string, label: string) => {
    switch (st) {
      case 'ROADMAP_PREPARED':
        return <WorkspaceBadge variant="active">{label}</WorkspaceBadge>;
      case 'EXECUTION_IN_PROGRESS':
        return <WorkspaceBadge variant="luxury">{label}</WorkspaceBadge>;
      case 'SPECIALIST_ASSIGNED':
        return <WorkspaceBadge variant="proposal">{label}</WorkspaceBadge>;
      default:
        return <WorkspaceBadge variant="pending">{label}</WorkspaceBadge>;
    }
  };

  return (
    <WorkspaceShell maxWidth="6xl">
      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="violet"
        badge={
          <div className="flex items-center gap-2">
            <WorkspaceBadge variant="luxury">
              <SparklesIcon size={12} className="text-[#8064A9]" />
              Enterprise Scaling
            </WorkspaceBadge>
            <span className="text-[11px] font-bold text-[#8064A9] bg-white/80 border border-[#8064A9]/30 px-2.5 py-0.5 rounded-lg">
              Specialist Advisory
            </span>
          </div>
        }
        title="Business Development & Enterprise Scaling"
        subtitle="Overcome operational bottlenecks, execute cloud modernization, expand regional distribution channels, and track verified transformation roadmaps with FIC domain directors."
      />

      {/* ========================================================
          2. TWO-TAB WORKSPACE SWITCHER WITH SHARED LAYOUT INDICATOR
         ======================================================== */}
      <div className="flex items-center gap-2 border-b border-[#EADFCF] pb-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('submit')}
          className={`relative px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'submit' ? 'text-[#FCFAF6]' : 'text-[#77786E] hover:text-[#29302D]'
          }`}
        >
          {activeTab === 'submit' && (
            <motion.div
              layoutId="scalingTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-[#29302D] rounded-xl shadow-sm -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <RocketIcon size={16} />
            <span>Submit Scaling Request</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('active_requests')}
          className={`relative px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'active_requests' ? 'text-[#FCFAF6]' : 'text-[#77786E] hover:text-[#29302D]'
          }`}
        >
          {activeTab === 'active_requests' && (
            <motion.div
              layoutId="scalingTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-[#29302D] rounded-xl shadow-sm -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <FileTextIcon size={16} />
            <span>Active Requests & Roadmaps</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'active_requests' ? 'bg-white/20 text-white' : 'bg-[#EADFCF] text-[#29302D]'
              }`}
            >
              {scalingList.length}
            </span>
          </span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: SUBMISSION FORM / SUCCESS CONFIRMATION
         ======================================================== */}
      {activeTab === 'submit' && (
        <div className="max-w-4xl mx-auto">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <WorkspaceCard variant="violet" className="text-center py-12 px-6 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#8064A9] to-[#9B7CC6] text-white flex items-center justify-center mx-auto shadow-lg"
                >
                  <CheckCircleIcon size={32} />
                </motion.div>
                <div className="space-y-1.5 max-w-lg mx-auto">
                  <h3 className="text-xl font-black text-[#29302D]">Scaling Request Registered!</h3>
                  <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed">
                    FIC Business Development wing has received your diagnostic requirement for <strong className="text-[#29302D]">{businessName}</strong>. A dedicated sector director will coordinate with you and prepare your transformation roadmap.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <WorkspaceButton
                    variant="violet"
                    size="md"
                    onClick={() => setActiveTab('active_requests')}
                    icon={<ArrowRightIcon size={14} />}
                  >
                    View in Active Roadmaps Tracker
                  </WorkspaceButton>
                  <WorkspaceButton
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setBusinessName('');
                      setCurrentChallenges('');
                      setExpectedOutcomes('');
                      setIsSubmitted(false);
                    }}
                  >
                    Submit Another Requirement
                  </WorkspaceButton>
                </div>
              </WorkspaceCard>
            </motion.div>
          ) : (
            <WorkspaceCard variant="default">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Business Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Enterprise / Business Entity Name <span className="text-[#C66B52]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tiruppur Weaving Unit No. 4 / Apex Logistics"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    className="w-full text-xs sm:text-sm p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8064A9] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs"
                  />
                </div>

                {/* Support Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Required Growth & Development Area
                  </label>
                  <select
                    className="w-full text-xs sm:text-sm p-3.5 border border-[#EADFCF] rounded-2xl bg-white text-[#29302D] focus:outline-none focus:ring-2 focus:ring-[#8064A9] shadow-2xs font-semibold"
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

                {/* Current Challenges */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Current Operational Bottlenecks or Challenges <span className="text-[#C66B52]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8064A9] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs leading-relaxed"
                    placeholder="Describe current pain points, working capital issues, legacy bottlenecks, or market headwinds..."
                    value={currentChallenges}
                    onChange={(e) => setCurrentChallenges(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* Expected Outcomes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Target Objectives & Desired Milestones <span className="text-[#C66B52]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8064A9] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs leading-relaxed"
                    placeholder="e.g. 25% throughput improvement, onboarding 10 new distributors, or achieving ISO certification..."
                    value={expectedOutcomes}
                    onChange={(e) => setExpectedOutcomes(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* Notice */}
                <div className="p-4 rounded-2xl bg-[#F7F2FB] border border-[#8064A9]/30 text-xs text-[#29302D] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#8064A9]/15 text-[#8064A9] flex items-center justify-center shrink-0">
                    <ShieldCheckIcon size={16} />
                  </div>
                  <p className="text-[11px] text-[#77786E] leading-relaxed">
                    FIC Business Development programs adhere to strict commercial confidentiality. All strategic assessments are conducted by verified industry specialists bound by non-disclosure agreements.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex justify-end">
                  <WorkspaceButton
                    variant="violet"
                    size="md"
                    type="submit"
                    loading={isLoading}
                    icon={<ArrowRightIcon size={15} />}
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
          TAB 2: ACTIVE SCALING REQUESTS & ROADMAPS
         ======================================================== */}
      {activeTab === 'active_requests' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <WorkspaceCard variant="glass" padded={false} className="p-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77786E]" />
                <input
                  type="text"
                  placeholder="Search scaling requests by entity name or bottleneck keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EADFCF] rounded-xl text-xs sm:text-sm text-[#29302D] placeholder-[#77786E]/60 focus:outline-none focus:ring-2 focus:ring-[#8064A9]"
                />
              </div>

              {/* Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-white border border-[#EADFCF] rounded-xl text-xs text-[#29302D] font-bold focus:outline-none focus:ring-2 focus:ring-[#8064A9]"
                >
                  <option value="ALL">All Support Areas</option>
                  <option value="TECHNOLOGY_DEVELOPMENT">Technology & Cloud</option>
                  <option value="EXPANSION_SCALING">Regional Expansion</option>
                  <option value="BUSINESS_PLANNING">Strategic Planning</option>
                  <option value="OPERATIONAL_IMPROVEMENT">Lean Factory Ops</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-white border border-[#EADFCF] rounded-xl text-xs text-[#29302D] font-bold focus:outline-none focus:ring-2 focus:ring-[#8064A9]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DIAGNOSTIC_PENDING">Diagnostic Pending</option>
                  <option value="SPECIALIST_ASSIGNED">Specialist Assigned</option>
                  <option value="ROADMAP_PREPARED">Roadmap Prepared</option>
                  <option value="EXECUTION_IN_PROGRESS">Execution in Progress</option>
                </select>
              </div>
            </div>
          </WorkspaceCard>

          {/* List of Requests (Animated Layout & PopLayout) */}
          <motion.div layout className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredRequests.length === 0 ? (
                <motion.div
                  key="empty-scaling"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                >
                  <WorkspaceEmptyState
                    icon={<RocketIcon size={28} />}
                    title="No scaling requests found"
                    description="No active business development requests match the selected filters."
                    actionText="Submit Scaling Requirement"
                    onAction={() => setActiveTab('submit')}
                    accent="violet"
                  />
                </motion.div>
              ) : (
                filteredRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  >
                    <WorkspaceCard variant="default" className="space-y-4 hover:border-[#8064A9]/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF]/70 pb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-[#77786E] font-mono font-bold tracking-wider">
                              REQ: {req.id}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#8064A9]/10 text-[#8064A9] border border-[#8064A9]/20">
                              {req.supportTypeLabel}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-[#29302D]">
                            {req.businessName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#77786E] font-medium">{req.submittedDate}</span>
                          {getStatusBadge(req.status, req.statusLabel)}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm">
                        <div>
                          <strong className="text-[#29302D] font-bold block mb-0.5">Stated Bottleneck:</strong>
                          <p className="text-[#77786E] leading-relaxed line-clamp-2">
                            {req.currentChallenges}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EADFCF]/50">
                        <div className="text-xs text-[#77786E]">
                          {req.assignedSpecialist ? (
                            <span>
                              <strong className="text-[#29302D]">Specialist: </strong>
                              {req.assignedSpecialist.name} • {req.assignedSpecialist.desk}
                            </span>
                          ) : (
                            <span>Specialist assignment in progress</span>
                          )}
                        </div>

                        <WorkspaceButton
                          variant="violet"
                          size="sm"
                          onClick={() => setSelectedRequest(req)}
                          icon={<ArrowRightIcon size={13} />}
                        >
                          View Diagnostic Roadmap & Milestones
                        </WorkspaceButton>
                      </div>
                    </WorkspaceCard>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* ========================================================
          3. SCALING DETAILS & ROADMAP ANIMATED MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        maxWidth="max-w-2xl"
        title={
          selectedRequest && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-[#77786E] font-mono font-bold">
                  {selectedRequest.id}
                </span>
                {getStatusBadge(selectedRequest.status, selectedRequest.statusLabel)}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#29302D]">
                {selectedRequest.businessName}
              </h3>
              <span className="text-xs text-[#8064A9] font-bold">
                {selectedRequest.supportTypeLabel}
              </span>
            </div>
          )
        }
      >
        {selectedRequest && (
          <div className="space-y-5">
            {/* Diagnostic Report Notes */}
            <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#29302D] uppercase tracking-wider">
                  Diagnostic Assessment & Findings
                </span>
                {selectedRequest.assignedSpecialist && (
                  <span className="text-[11px] text-[#8064A9] font-bold">
                    {selectedRequest.assignedSpecialist.name}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed">
                {selectedRequest.diagnosticNotes}
              </p>
            </div>

            {/* Milestones / Roadmaps with Animated Status Progress */}
            {selectedRequest.milestones && selectedRequest.milestones.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#29302D] uppercase tracking-wider">
                    Transformation Roadmap & Execution Stages
                  </span>
                  <span className="text-[11px] font-bold text-[#8064A9]">
                    30-60-90 Day Framework
                  </span>
                </div>

                <div className="space-y-2.5">
                  {selectedRequest.milestones.map((m, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.15 }}
                      className="p-3.5 rounded-2xl bg-white border border-[#EADFCF] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#8064A9] text-white flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <strong className="text-xs font-black text-[#29302D]">{m.phase}</strong>
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            m.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : m.status === 'IN_PROGRESS'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {m.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8064A9] font-bold pl-7">
                        Timeline: {m.timeframe}
                      </div>
                      <p className="text-xs text-[#77786E] pl-7 leading-relaxed">
                        {m.goal}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex justify-end gap-3 border-t border-[#EADFCF]">
              <WorkspaceButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                Close Roadmap
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>
    </WorkspaceShell>
  );
};

export default BusinessDevPage;
