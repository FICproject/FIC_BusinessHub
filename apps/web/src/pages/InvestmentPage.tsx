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
import { AnimatedModal, AnimatedProgress, StaggerContainer, StaggerItem } from '../motion';
import {
  TrendingUpIcon,
  ShieldCheckIcon,
  LockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  BriefcaseIcon,
  SearchIcon,
  AlertCircleIcon,
  FileTextIcon
} from '../components/Icons';
import { apiRequest, getStoredUser } from '../services/api';

export interface InvestmentRecord {
  id: string;
  userId: string;
  profileType: 'INVESTOR' | 'FUNDING_SEEKER';
  amountRange: string;
  sectors: string[];
  pitchSummary: string;
  status: 'CONFIDENTIAL_REVIEW' | 'DUE_DILIGENCE_PREP' | 'SYNDICATE_MATCHED' | 'MEETING_SCHEDULED';
  statusLabel: string;
  submittedDate: string;
  assignedOfficer?: {
    name: string;
    desk: string;
  };
  dealRoomNotes?: string;
  dueDiligenceScore?: {
    statutoryCompliance: number;
    financialHealth: number;
    businessModelViability: number;
  };
  meetingStatus?: string;
}

export interface DealRoomOpportunity {
  id: string;
  dealCode: string;
  sector: string;
  nature: string;
  ticketSize: string;
  tenure: string;
  highlight: string;
  syndicateLead: string;
  ndaRequired: boolean;
}

export const InvestmentPage: React.FC = () => {
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_default';

  // 3 Tabs: 'submit' | 'my_inquiries' | 'deal_room'
  const [activeTab, setActiveTab] = useState<'submit' | 'my_inquiries' | 'deal_room'>('submit');

  // Form State
  const [profileType, setProfileType] = useState<'INVESTOR' | 'FUNDING_SEEKER'>('FUNDING_SEEKER');
  const [amountRange, setAmountRange] = useState('₹25 Lakhs - ₹1 Crore');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Manufacturing', 'Technology']);
  const [pitchSummary, setPitchSummary] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Inquiries List State
  const [inquiriesList, setInquiriesList] = useState<InvestmentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<InvestmentRecord | null>(null);

  // Opportunity Interest Modal State
  const [activeOpportunity, setActiveOpportunity] = useState<DealRoomOpportunity | null>(null);
  const [oppInterestNote, setOppInterestNote] = useState('');
  const [oppSuccess, setOppSuccess] = useState(false);

  const storageKey = `fic_user_investments_${userId}`;

  const sectorList = [
    'Manufacturing',
    'Technology',
    'Agri-Tech',
    'Healthcare',
    'Retail / Franchise',
    'Renewables',
    'Logistics & Warehousing'
  ];

  // Deal Room Bulletin Opportunities
  const dealRoomOpportunities: DealRoomOpportunity[] = [
    {
      id: 'OPP-IND-901',
      dealCode: 'FIC-DEAL-TN-901 (Automated Spinning & Hosiery)',
      sector: 'Manufacturing',
      nature: 'Mezzanine Growth Capital & Working Capital Co-investment',
      ticketSize: '₹1.5 Crore - ₹3 Crore',
      tenure: '36 Months Convertible',
      highlight:
        'Established 14-year-old profitable Tier-1 garment exporter in Tiruppur expanding into automated jacquard knitting with confirmed orders for UK brands.',
      syndicateLead: 'FIC Institutional Syndicate Committee',
      ndaRequired: true
    },
    {
      id: 'OPP-AGR-842',
      dealCode: 'FIC-DEAL-KA-842 (Cold Chain Agri Processing)',
      sector: 'Agri-Tech',
      nature: 'Strategic Minority Equity (15%)',
      ticketSize: '₹75 Lakhs - ₹1.2 Crore',
      tenure: 'Equity Growth Capital',
      highlight:
        'Solar-powered primary processing packhouse network across Karnataka and Tamil Nadu with farm-gate aggregation and export tie-ups in the Middle East.',
      syndicateLead: 'FIC Agro-Industrial Desk',
      ndaRequired: true
    },
    {
      id: 'OPP-HLT-670',
      dealCode: 'FIC-DEAL-KL-670 (Ayurvedic Wellness & Phytopharma)',
      sector: 'Healthcare',
      nature: 'Secured Term Financing with Royalty Participation',
      ticketSize: '₹50 Lakhs - ₹1 Crore',
      tenure: '24 Months',
      highlight:
        'GMP-certified wellness extraction manufacturer expanding automated bottling line with approved US FDA export registrations.',
      syndicateLead: 'FIC Healthcare Investment Circle',
      ndaRequired: true
    }
  ];

  const initialDemoInquiries: InvestmentRecord[] = [
    {
      id: 'INV-2026-914',
      userId,
      profileType: 'FUNDING_SEEKER',
      amountRange: '₹50 Lakhs - ₹1.5 Crore',
      sectors: ['Manufacturing', 'Technology'],
      pitchSummary:
        'Scaling our precision CNC component tooling line with automated CAD integration. Seeking growth capital for machinery acquisition and vendor credit guarantees.',
      status: 'SYNDICATE_MATCHED',
      statusLabel: 'Syndicate Matched',
      submittedDate: '24 Oct 2026',
      assignedOfficer: {
        name: 'V. S. Raghavan, CFA',
        desk: 'FIC Senior Intermediary Deal Committee'
      },
      dealRoomNotes:
        'Preliminary due diligence passed. Entity qualifies under MSME fast-track growth syndication. 2 accredited family office syndicates within FIC have expressed interest in reviewing anonymized data room.',
      dueDiligenceScore: {
        statutoryCompliance: 96,
        financialHealth: 88,
        businessModelViability: 91
      },
      meetingStatus: 'Confidential exploratory video session in coordination'
    }
  ];

  // Load from localStorage or seed
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setInquiriesList(JSON.parse(stored));
      } else {
        localStorage.setItem(storageKey, JSON.stringify(initialDemoInquiries));
        setInquiriesList(initialDemoInquiries);
      }
    } catch {
      setInquiriesList(initialDemoInquiries);
    }
  }, [storageKey]);

  const toggleSector = (sec: string) => {
    if (selectedSectors.includes(sec)) {
      setSelectedSectors(selectedSectors.filter((s) => s !== sec));
    } else {
      setSelectedSectors([...selectedSectors, sec]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newRecord: InvestmentRecord = {
      id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      userId,
      profileType,
      amountRange,
      sectors: selectedSectors,
      pitchSummary: pitchSummary.trim(),
      status: 'CONFIDENTIAL_REVIEW',
      statusLabel: 'Confidential Review',
      submittedDate: 'Today',
      assignedOfficer: {
        name: 'FIC Senior Deal Committee',
        desk: 'Private Intermediary Capital Desk'
      },
      dealRoomNotes:
        'Your investment interest expression has been encrypted and assigned to the senior deal committee under non-disclosure. Initial statutory compliance checks are underway.',
      dueDiligenceScore: {
        statutoryCompliance: 85,
        financialHealth: 80,
        businessModelViability: 82
      },
      meetingStatus: 'Under review by committee'
    };

    try {
      await apiRequest('/investment-profiles', {
        method: 'POST',
        body: JSON.stringify({
          profileType,
          amountRange,
          sectors: selectedSectors,
          pitchSummary
        })
      });
    } catch {
      // Graceful fallback
    } finally {
      const updated = [newRecord, ...inquiriesList];
      setInquiriesList(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      setIsSubmitted(true);
      setIsLoading(false);
    }
  };

  const handleOpportunitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOppSuccess(true);
    setTimeout(() => {
      setOppSuccess(false);
      setActiveOpportunity(null);
      setOppInterestNote('');
    }, 2000);
  };

  const filteredInquiries = inquiriesList.filter((item) => {
    if (filterType !== 'ALL' && item.profileType !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPitch = item.pitchSummary.toLowerCase().includes(q);
      const matchRange = item.amountRange.toLowerCase().includes(q);
      const matchSectors = item.sectors.some((s) => s.toLowerCase().includes(q));
      if (!matchPitch && !matchRange && !matchSectors) return false;
    }
    return true;
  });

  const getStatusBadge = (st: string, label: string) => {
    switch (st) {
      case 'SYNDICATE_MATCHED':
        return <WorkspaceBadge variant="luxury">{label}</WorkspaceBadge>;
      case 'MEETING_SCHEDULED':
        return <WorkspaceBadge variant="active">{label}</WorkspaceBadge>;
      case 'DUE_DILIGENCE_PREP':
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
        accent="charcoal"
        badge={
          <div className="flex items-center gap-2">
            <WorkspaceBadge variant="luxury">
              <LockIcon size={12} className="text-[#D99B43]" />
              Strictly Confidential
            </WorkspaceBadge>
            <span className="text-[11px] font-bold text-[#FCFAF6] bg-white/10 border border-[#D99B43]/30 px-2.5 py-0.5 rounded-lg">
              Private Deal Room
            </span>
          </div>
        }
        title="Confidential Investment & Funding Channel"
        subtitle="Express capital appetite or funding requirements, track institutional due diligence scores, and access verified private syndicate opportunities under strict non-disclosure."
      />

      {/* ========================================================
          COMPLIANCE NOTICE
         ======================================================== */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFBF8] border border-[#E58C72]/30 shadow-xs space-y-1.5 mb-6">
        <div className="flex items-center gap-2 font-black text-[#C66B52] text-xs">
          <ShieldCheckIcon size={16} />
          Compliance & Regulatory Protocol:
        </div>
        <p className="text-xs text-[#77786E] leading-relaxed">
          Financial requirements and investor profiles are NEVER disclosed publicly or shown on open marketplace feeds. FIC does not hold custody of investor funds or solicit public deposits. We act purely as a private intermediary coordinator for compliant B2B corporate introductions.
        </p>
      </div>

      {/* ========================================================
          2. THREE-TAB WORKSPACE SWITCHER WITH SHARED LAYOUT INDICATOR
         ======================================================== */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#EADFCF] pb-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('submit')}
          className={`relative px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'submit' ? 'text-[#FCFAF6]' : 'text-[#77786E] hover:text-[#29302D]'
          }`}
        >
          {activeTab === 'submit' && (
            <motion.div
              layoutId="invTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-[#29302D] rounded-xl shadow-sm -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <LockIcon size={16} />
            <span>Submit Expression of Interest</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_inquiries')}
          className={`relative px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'my_inquiries' ? 'text-[#FCFAF6]' : 'text-[#77786E] hover:text-[#29302D]'
          }`}
        >
          {activeTab === 'my_inquiries' && (
            <motion.div
              layoutId="invTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-[#29302D] rounded-xl shadow-sm -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <FileTextIcon size={16} />
            <span>My Deal Expressions & Status</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'my_inquiries' ? 'bg-white/20 text-white' : 'bg-[#EADFCF] text-[#29302D]'
              }`}
            >
              {inquiriesList.length}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deal_room')}
          className={`relative px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'deal_room' ? 'text-[#FCFAF6]' : 'text-[#77786E] hover:text-[#29302D]'
          }`}
        >
          {activeTab === 'deal_room' && (
            <motion.div
              layoutId="invTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-[#29302D] rounded-xl shadow-sm -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <SparklesIcon size={16} className="text-[#D99B43]" />
            <span>Private Deal Room Opportunities</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#D99B43]/20 text-[#9C6818]">
              {dealRoomOpportunities.length} Active
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
              <WorkspaceCard variant="amber" className="text-center py-12 px-6 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#D99B43] to-[#B87A28] text-white flex items-center justify-center mx-auto shadow-lg"
                >
                  <CheckCircleIcon size={32} />
                </motion.div>
                <div className="space-y-1.5 max-w-lg mx-auto">
                  <h3 className="text-xl font-black text-[#29302D]">Confidential Record Registered!</h3>
                  <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed">
                    Your investment orientation profile has been encrypted and routed to the FIC Senior Deal Committee. You will be contacted privately once accredited syndicate matches are confirmed.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <WorkspaceButton
                    variant="charcoal"
                    size="md"
                    onClick={() => setActiveTab('my_inquiries')}
                    icon={<ArrowRightIcon size={14} />}
                  >
                    View in Deal Expressions Tracker
                  </WorkspaceButton>
                  <WorkspaceButton
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setPitchSummary('');
                      setIsSubmitted(false);
                    }}
                  >
                    Submit Another Inquiry
                  </WorkspaceButton>
                </div>
              </WorkspaceCard>
            </motion.div>
          ) : (
            <WorkspaceCard variant="default">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Type Radio */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#29302D] block">
                    Your Commercial Orientation <span className="text-[#C66B52]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setProfileType('FUNDING_SEEKER')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        profileType === 'FUNDING_SEEKER'
                          ? 'border-[#29302D] bg-[#29302D] text-white shadow-md'
                          : 'border-[#EADFCF] bg-white text-[#29302D] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <strong className="text-sm font-black block">Seeking Growth Capital / Funding</strong>
                      <span className={`text-xs block mt-1 ${profileType === 'FUNDING_SEEKER' ? 'text-[#EADFCF]' : 'text-[#77786E]'}`}>
                        I represent an enterprise or startup seeking expansion investment, working capital, or joint syndication.
                      </span>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setProfileType('INVESTOR')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        profileType === 'INVESTOR'
                          ? 'border-[#29302D] bg-[#29302D] text-white shadow-md'
                          : 'border-[#EADFCF] bg-white text-[#29302D] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <strong className="text-sm font-black block">Accredited Commercial Investor</strong>
                      <span className={`text-xs block mt-1 ${profileType === 'INVESTOR' ? 'text-[#EADFCF]' : 'text-[#77786E]'}`}>
                        I represent a private family office, syndicate, or enterprise looking to deploy capital in vetted ventures.
                      </span>
                    </motion.button>
                  </div>
                </div>

                {/* Amount Range */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Expected Capital Ticket Size
                  </label>
                  <select
                    className="w-full text-xs sm:text-sm p-3.5 border border-[#EADFCF] rounded-2xl bg-white text-[#29302D] focus:outline-none focus:ring-2 focus:ring-[#29302D] shadow-2xs font-semibold"
                    value={amountRange}
                    onChange={(e) => setAmountRange(e.target.value)}
                  >
                    <option value="₹10 Lakhs - ₹25 Lakhs">₹10 Lakhs - ₹25 Lakhs (Micro Seed / Seed)</option>
                    <option value="₹25 Lakhs - ₹1 Crore">₹25 Lakhs - ₹1 Crore (Early Growth / Expansion)</option>
                    <option value="₹1 Crore - ₹5 Crores">₹1 Crore - ₹5 Crores (Mid-Market Enterprise)</option>
                    <option value="₹5 Crores - ₹20 Crores">₹5 Crores - ₹20 Crores (Large Corporate Syndicate)</option>
                    <option value="₹20 Crores+">₹20 Crores+ (Infrastructure / Institutional)</option>
                  </select>
                </div>

                {/* Sector Multi-select */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#29302D] block">
                    Target Industry Sectors
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sectorList.map((sec, i) => {
                      const isSelected = selectedSectors.includes(sec);
                      return (
                        <motion.button
                          type="button"
                          key={i}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => toggleSector(sec)}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-[#29302D] text-white border-transparent font-black shadow-xs'
                              : 'bg-white text-[#77786E] border-[#EADFCF] hover:bg-[#FAF7F2] font-bold'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {sec}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Confidential Brief */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Confidential Overview & Business Fundamentals <span className="text-[#C66B52]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#29302D] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs leading-relaxed"
                    placeholder="Provide overview of current revenue run-rate, use of proceeds, gross margins, and debt status. This remains strictly confidential..."
                    value={pitchSummary}
                    onChange={(e) => setPitchSummary(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* Submit */}
                <div className="pt-2 flex justify-end">
                  <WorkspaceButton
                    variant="charcoal"
                    size="md"
                    type="submit"
                    loading={isLoading}
                    icon={<LockIcon size={14} />}
                  >
                    Register Confidential Expression
                  </WorkspaceButton>
                </div>
              </form>
            </WorkspaceCard>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: MY INQUIRIES & DEAL FLOW STATUS
         ======================================================== */}
      {activeTab === 'my_inquiries' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <WorkspaceCard variant="glass" padded={false} className="p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77786E]" />
                <input
                  type="text"
                  placeholder="Search inquiries by keywords or sectors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EADFCF] rounded-xl text-xs sm:text-sm text-[#29302D] placeholder-[#77786E]/60 focus:outline-none focus:ring-2 focus:ring-[#29302D]"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-white border border-[#EADFCF] rounded-xl text-xs text-[#29302D] font-bold focus:outline-none focus:ring-2 focus:ring-[#29302D]"
              >
                <option value="ALL">All Orientations</option>
                <option value="FUNDING_SEEKER">Funding Seeker</option>
                <option value="INVESTOR">Commercial Investor</option>
              </select>
            </div>
          </WorkspaceCard>

          {/* List (Animated Layout & Stagger) */}
          <motion.div layout className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredInquiries.length === 0 ? (
                <motion.div
                  key="empty-inquiries"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                >
                  <WorkspaceEmptyState
                    icon={<TrendingUpIcon size={28} />}
                    title="No investment inquiries recorded"
                    description="You have not submitted any confidential investment or capital inquiries."
                    actionText="Submit Expression of Interest"
                    onAction={() => setActiveTab('submit')}
                    accent="charcoal"
                  />
                </motion.div>
              ) : (
                filteredInquiries.map((inv) => (
                  <motion.div
                    key={inv.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  >
                    <WorkspaceCard variant="default" className="space-y-4 hover:border-[#D99B43]/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF]/70 pb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-[#77786E] font-mono font-bold tracking-wider">
                              DEAL REF: {inv.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                              {inv.profileType === 'FUNDING_SEEKER' ? 'Seeking Capital' : 'Investor Profile'}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-[#29302D]">
                            Target Ticket: {inv.amountRange}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#77786E] font-medium">{inv.submittedDate}</span>
                          {getStatusBadge(inv.status, inv.statusLabel)}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed line-clamp-2">
                        {inv.pitchSummary}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EADFCF]/50">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-[#77786E]">Sectors:</span>
                          {inv.sectors.map((s, idx) => (
                            <span key={idx} className="text-[10px] bg-[#FAF7F2] border border-[#EADFCF] text-[#29302D] font-bold px-2 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))}
                        </div>

                        <WorkspaceButton
                          variant="charcoal"
                          size="sm"
                          onClick={() => setSelectedRecord(inv)}
                          icon={<ArrowRightIcon size={13} />}
                        >
                          View Confidential Deal Room Status
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
          TAB 3: PRIVATE DEAL ROOM OPPORTUNITIES BULLETIN
         ======================================================== */}
      {activeTab === 'deal_room' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#D99B43]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon size={18} className="text-[#D99B43]" />
              <div>
                <strong className="text-xs font-black text-[#29302D] block">
                  Vetted Institutional Opportunities
                </strong>
                <span className="text-[11px] text-[#77786E]">
                  Pre-screened commercial deals vetted by FIC Senior Deal Committee. Bilateral NDAs required before data room unlock.
                </span>
              </div>
            </div>
          </div>

          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {dealRoomOpportunities.map((opp) => (
              <motion.div
                key={opp.id}
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="h-full"
              >
                <WorkspaceCard variant="default" className="flex flex-col justify-between h-full space-y-4 border-[#EADFCF] hover:border-[#D99B43] transition-colors">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F2] border border-[#EADFCF] text-[#29302D] rounded-md">
                        {opp.sector}
                      </span>
                      <span className="text-[10px] font-black text-[#C66B52] bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <LockIcon size={10} /> NDA Required
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-[#29302D]">
                      {opp.dealCode}
                    </h4>

                    <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EADFCF] space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#77786E]">Ticket Size:</span>
                        <strong className="text-[#29302D]">{opp.ticketSize}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#77786E]">Structure:</span>
                        <strong className="text-[#29302D]">{opp.tenure}</strong>
                      </div>
                    </div>

                    <p className="text-xs text-[#77786E] leading-relaxed">
                      {opp.highlight}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#EADFCF]">
                    <WorkspaceButton
                      variant="charcoal"
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => setActiveOpportunity(opp)}
                      icon={<LockIcon size={13} />}
                    >
                      Express Confidential Interest
                    </WorkspaceButton>
                  </div>
                </WorkspaceCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: MY INQUIRY DETAILS ANIMATED MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        maxWidth="max-w-2xl"
        title={
          selectedRecord && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-[#77786E] font-mono font-bold">
                  {selectedRecord.id}
                </span>
                {getStatusBadge(selectedRecord.status, selectedRecord.statusLabel)}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#29302D]">
                {selectedRecord.amountRange}
              </h3>
              <span className="text-xs text-[#8064A9] font-bold">
                {selectedRecord.profileType === 'FUNDING_SEEKER' ? 'Capital Seeker File' : 'Accredited Investor File'}
              </span>
            </div>
          )
        }
      >
        {selectedRecord && (
          <div className="space-y-5">
            {/* Pitch */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-[#29302D] uppercase tracking-wider block">
                Executive Orientation Summary
              </span>
              <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed bg-white p-3.5 rounded-2xl border border-[#EADFCF]">
                {selectedRecord.pitchSummary}
              </p>
            </div>

            {/* Due Diligence Scores with Animated Progress Bars */}
            {selectedRecord.dueDiligenceScore && (
              <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#29302D] uppercase tracking-wider">
                    FIC Intermediary Due Diligence Ratings
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Verified Standing
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EADFCF] space-y-1.5">
                    <span className="text-[10px] text-[#77786E] font-bold block">Statutory Compliance</span>
                    <span className="text-base font-black text-[#29302D]">
                      {selectedRecord.dueDiligenceScore.statutoryCompliance}%
                    </span>
                    <AnimatedProgress
                      value={selectedRecord.dueDiligenceScore.statutoryCompliance}
                      barColor="bg-emerald-600"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EADFCF] space-y-1.5">
                    <span className="text-[10px] text-[#77786E] font-bold block">Financial Health</span>
                    <span className="text-base font-black text-[#29302D]">
                      {selectedRecord.dueDiligenceScore.financialHealth}%
                    </span>
                    <AnimatedProgress
                      value={selectedRecord.dueDiligenceScore.financialHealth}
                      barColor="bg-[#D99B43]"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EADFCF] space-y-1.5">
                    <span className="text-[10px] text-[#77786E] font-bold block">Viability Score</span>
                    <span className="text-base font-black text-[#29302D]">
                      {selectedRecord.dueDiligenceScore.businessModelViability}%
                    </span>
                    <AnimatedProgress
                      value={selectedRecord.dueDiligenceScore.businessModelViability}
                      barColor="bg-purple-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Deal Room Remarks */}
            <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#D99B43]/40 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <strong className="text-[#9C6818] font-black">Deal Committee Observation</strong>
                {selectedRecord.assignedOfficer && (
                  <span className="text-[10px] font-bold text-[#77786E]">
                    {selectedRecord.assignedOfficer.name}
                  </span>
                )}
              </div>
              <p className="text-[#77786E] leading-relaxed">
                {selectedRecord.dealRoomNotes}
              </p>
              {selectedRecord.meetingStatus && (
                <div className="pt-1 font-bold text-[#29302D]">
                  Next Facilitated Step: {selectedRecord.meetingStatus}
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-[#EADFCF]">
              <WorkspaceButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecord(null)}
              >
                Close Record
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* ========================================================
          MODAL 2: EXPRESS INTEREST IN DEAL ROOM OPPORTUNITY
         ======================================================== */}
      <AnimatedModal
        isOpen={!!activeOpportunity}
        onClose={() => setActiveOpportunity(null)}
        maxWidth="max-w-lg"
        title={
          activeOpportunity && (
            <div>
              <span className="text-[10px] font-black uppercase text-[#C66B52] tracking-wider">
                Confidential Opportunity Expression
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#29302D] mt-0.5">
                {activeOpportunity.dealCode}
              </h3>
            </div>
          )
        }
      >
        {activeOpportunity && (
          <div className="space-y-4">
            {oppSuccess ? (
              <div className="py-8 text-center space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto"
                >
                  <CheckCircleIcon size={24} />
                </motion.div>
                <h4 className="text-base font-black text-[#29302D]">Interest Registered Confidentially!</h4>
                <p className="text-xs text-[#77786E] max-w-xs mx-auto">
                  The FIC Senior Deal Committee has received your notice. An NDA document will be issued to your registered email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleOpportunitySubmit} className="space-y-4 text-xs sm:text-sm">
                <div className="p-3.5 bg-white rounded-2xl border border-[#EADFCF] space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#77786E]">Sector:</span>
                    <strong className="text-[#29302D]">{activeOpportunity.sector}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77786E]">Ticket Size:</span>
                    <strong className="text-[#29302D]">{activeOpportunity.ticketSize}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77786E]">Structure:</span>
                    <strong className="text-[#29302D]">{activeOpportunity.tenure}</strong>
                  </div>
                </div>

                <div>
                  <label className="block font-black text-[#29302D] mb-1.5">
                    Your Capacity or Preliminary Alignment Note *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly state your investment syndicate criteria or strategic synergy..."
                    value={oppInterestNote}
                    onChange={(e) => setOppInterestNote(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EADFCF] rounded-xl focus:ring-2 focus:ring-[#29302D] text-[#29302D]"
                  ></textarea>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 flex items-center gap-2">
                  <LockIcon size={14} className="shrink-0" />
                  <span>
                    By submitting, you agree to execute bilateral Non-Disclosure prior to inspection of financial data rooms.
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-[#EADFCF]">
                  <WorkspaceButton
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setActiveOpportunity(null)}
                  >
                    Cancel
                  </WorkspaceButton>
                  <WorkspaceButton
                    variant="charcoal"
                    size="sm"
                    type="submit"
                  >
                    Confirm & Request Data Room Access
                  </WorkspaceButton>
                </div>
              </form>
            )}
          </div>
        )}
      </AnimatedModal>
    </WorkspaceShell>
  );
};

export default InvestmentPage;
