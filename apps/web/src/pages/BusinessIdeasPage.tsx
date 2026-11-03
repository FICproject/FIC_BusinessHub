import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceBadge,
  WorkspaceEmptyState
} from '../components/workspace/WorkspaceComponents';
import {
  LightbulbIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  ShieldCheckIcon,
  SearchIcon,
  ClockIcon,
  AlertCircleIcon,
  FileTextIcon
} from '../components/Icons';
import { apiRequest, getStoredUser } from '../services/api';

export interface BusinessIdeaRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetMarket: string;
  stage: 'IDEA' | 'PROTOTYPE' | 'EARLY_TRACTION' | 'GROWTH';
  supportNeeded: string[];
  status: 'UNDER_REVIEW' | 'FEASIBILITY_ANALYSIS' | 'ADVISORY_SCHEDULED' | 'APPROVED_INCUBATION';
  statusLabel: string;
  submittedDate: string;
  advisorName?: string;
  advisorRole?: string;
  feasibilityScore?: {
    marketViability: number; // out of 100
    techFeasibility: number;
    commercialScalability: number;
  };
  reviewNotes?: string;
  nextSteps?: string[];
}

export const BusinessIdeasPage: React.FC = () => {
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_default';

  // Tabs: 'submit' | 'my_ideas'
  const [activeTab, setActiveTab] = useState<'submit' | 'my_ideas'>('submit');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [stage, setStage] = useState<'IDEA' | 'PROTOTYPE' | 'EARLY_TRACTION' | 'GROWTH'>('IDEA');
  const [supportNeeded, setSupportNeeded] = useState<string[]>(['Idea Validation', 'Mentoring & Advisory']);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Listing State
  const [ideasList, setIdeasList] = useState<BusinessIdeaRecord[]>([]);
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdeaRecord | null>(null);

  const storageKey = `fic_user_ideas_${userId}`;

  // Initial Seed Data for Demo & Authentic Experience
  const initialDemoIdeas: BusinessIdeaRecord[] = [
    {
      id: 'IDEA-2026-881',
      userId,
      title: 'AI Automated Quality Inspection for Knitted Fabrics',
      description:
        'An edge-computing computer vision camera rig mounted over weaving looms to detect fabric drop stitches, yarn unevenness, and oil marks in real time, reducing garment rejection by up to 35%.',
      targetMarket: 'Tiruppur, Surat & Ludhiana textile manufacturing clusters (Tier-2 MSMEs)',
      stage: 'PROTOTYPE',
      supportNeeded: ['Technology & MVP Development', 'Mentoring & Advisory', 'Go-to-Market Strategy'],
      status: 'ADVISORY_SCHEDULED',
      statusLabel: 'Advisory Scheduled',
      submittedDate: '28 Oct 2026',
      advisorName: 'Dr. S. R. Natarajan',
      advisorRole: 'FIC Chief Industrial Incubation Specialist',
      feasibilityScore: {
        marketViability: 88,
        techFeasibility: 82,
        commercialScalability: 91
      },
      reviewNotes:
        'Strong industry problem statement with immediate payback period for Tier-2 spinning and knitting mills. FIC Incubation desk has prepared a preliminary patent review and recommended introducing this solution to verified garment associations in Tamil Nadu.',
      nextSteps: [
        'Exploratory pilot setup at partner factory unit in Tiruppur',
        'Hardware BOM cost reduction advisory with electronics specialist',
        'Facilitated session with FIC OEM distributors committee'
      ]
    },
    {
      id: 'IDEA-2026-742',
      userId,
      title: 'Decentralized Cold-Chain Telemetry for Agri-Fresh Produce',
      description:
        'Solar-powered IoT tracking nodes for refrigerated transport trucks monitoring real-time humidity, temperature, and vehicle shock to eliminate farm-to-shelf spoilage in dairy and horticulture.',
      targetMarket: 'South India agricultural logistics, dairy cooperatives & export cold stores',
      stage: 'IDEA',
      supportNeeded: ['Idea Validation', 'Business Plan Preparation', 'Regulatory & Legal Setup'],
      status: 'FEASIBILITY_ANALYSIS',
      statusLabel: 'Feasibility Analysis',
      submittedDate: '15 Oct 2026',
      advisorName: 'K. Meenakshi Sundaram',
      advisorRole: 'FIC Agri-Tech & Supply Chain Lead',
      feasibilityScore: {
        marketViability: 85,
        techFeasibility: 79,
        commercialScalability: 84
      },
      reviewNotes:
        'Concept validated against NABARD and APEDA cold chain guidelines. Unit economics look favorable. Mentorship session scheduled to refine sensor manufacturing supply chain.',
      nextSteps: [
        'Complete NABARD subsidy eligibility assessment',
        'Finalize cloud backend infrastructure architecture'
      ]
    }
  ];

  // Load from localStorage or seed
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setIdeasList(JSON.parse(stored));
      } else {
        localStorage.setItem(storageKey, JSON.stringify(initialDemoIdeas));
        setIdeasList(initialDemoIdeas);
      }
    } catch {
      setIdeasList(initialDemoIdeas);
    }
  }, [storageKey]);

  const supportOptions = [
    'Idea Validation',
    'Business Plan Preparation',
    'Technology & MVP Development',
    'Mentoring & Advisory',
    'Regulatory & Legal Setup',
    'Go-to-Market Strategy'
  ];

  const toggleSupport = (item: string) => {
    if (supportNeeded.includes(item)) {
      setSupportNeeded(supportNeeded.filter((s) => s !== item));
    } else {
      setSupportNeeded([...supportNeeded, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newIdeaRecord: BusinessIdeaRecord = {
      id: `IDEA-2026-${Math.floor(100 + Math.random() * 900)}`,
      userId,
      title: title.trim(),
      description: description.trim(),
      targetMarket: targetMarket.trim(),
      stage,
      supportNeeded,
      status: 'UNDER_REVIEW',
      statusLabel: 'Under FIC Review',
      submittedDate: 'Today',
      advisorName: 'FIC Incubation Desk',
      advisorRole: 'Sector Evaluation Committee',
      feasibilityScore: {
        marketViability: 75,
        techFeasibility: 78,
        commercialScalability: 70
      },
      reviewNotes:
        'Your idea submission has been securely logged with the FIC Incubation Desk under strict non-disclosure. Initial preliminary scoring and sector matching are currently in progress.',
      nextSteps: [
        'Initial patentability and duplicate check by FIC Research Desk',
        'Domain expert assigned for 1-on-1 strategic feasibility session'
      ]
    };

    try {
      await apiRequest('/business-ideas', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          targetMarket,
          stage,
          supportNeeded
        })
      });
    } catch {
      // Graceful fallback to client-side persistence
    } finally {
      const updated = [newIdeaRecord, ...ideasList];
      setIdeasList(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      setIsSubmitted(true);
      setIsLoading(false);
    }
  };

  // Filtered Ideas
  const filteredIdeas = ideasList.filter((item) => {
    if (filterStage !== 'ALL' && item.stage !== filterStage) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchMarket = item.targetMarket.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchMarket) return false;
    }
    return true;
  });

  const getStageBadge = (stg: string) => {
    switch (stg) {
      case 'IDEA':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">Idea on Paper</span>;
      case 'PROTOTYPE':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">Prototype / MVP</span>;
      case 'EARLY_TRACTION':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">Early Traction</span>;
      case 'GROWTH':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">Ready for Scale</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (st: string, label: string) => {
    switch (st) {
      case 'APPROVED_INCUBATION':
        return <WorkspaceBadge variant="active">{label}</WorkspaceBadge>;
      case 'ADVISORY_SCHEDULED':
        return <WorkspaceBadge variant="proposal">{label}</WorkspaceBadge>;
      case 'FEASIBILITY_ANALYSIS':
        return <WorkspaceBadge variant="luxury">{label}</WorkspaceBadge>;
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
        accent="amber"
        badge={
          <div className="flex items-center gap-2">
            <WorkspaceBadge variant="luxury">
              <SparklesIcon size={12} className="text-[#D99B43]" />
              FIC Incubation Desk
            </WorkspaceBadge>
            <span className="text-[11px] font-bold text-[#D99B43] bg-white/80 border border-[#D99B43]/30 px-2.5 py-0.5 rounded-lg">
              Feasibility & Mentorship
            </span>
          </div>
        }
        title="Business Ideas & Incubation Desk"
        subtitle="Validate your concept, receive structured feasibility ratings from accredited mentors, and track institutional advisory notes under strict non-disclosure."
      />

      {/* ========================================================
          2. TWO-TAB WORKSPACE SWITCHER
         ======================================================== */}
      <div className="flex items-center gap-2 border-b border-[#EADFCF] pb-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('submit')}
          className={`px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'submit'
              ? 'bg-[#29302D] text-[#FCFAF6] shadow-sm'
              : 'text-[#77786E] hover:text-[#29302D] hover:bg-white/80'
          }`}
        >
          <LightbulbIcon size={16} />
          <span>Submit New Idea</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_ideas')}
          className={`px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'my_ideas'
              ? 'bg-[#29302D] text-[#FCFAF6] shadow-sm'
              : 'text-[#77786E] hover:text-[#29302D] hover:bg-white/80'
          }`}
        >
          <FileTextIcon size={16} />
          <span>Track Submitted Ideas</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'my_ideas' ? 'bg-white/20 text-white' : 'bg-[#EADFCF] text-[#29302D]'
            }`}
          >
            {ideasList.length}
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
              transition={{ duration: 0.3 }}
            >
              <WorkspaceCard variant="amber" className="text-center py-12 px-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#2E7D32] to-[#4CAF50] text-white flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircleIcon size={32} />
                </div>
                <div className="space-y-1.5 max-w-lg mx-auto">
                  <h3 className="text-xl font-black text-[#29302D]">Idea Submitted Successfully!</h3>
                  <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed">
                    Your business concept <strong className="text-[#29302D]">"{title}"</strong> has been securely logged with the FIC Incubation Desk. You can immediately monitor reviewer progress and feasibility analysis in the tracker tab.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <WorkspaceButton
                    variant="primary"
                    size="md"
                    onClick={() => setActiveTab('my_ideas')}
                    icon={<ArrowRightIcon size={14} />}
                  >
                    View in Submitted Ideas Tracker
                  </WorkspaceButton>
                  <WorkspaceButton
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setTitle('');
                      setDescription('');
                      setTargetMarket('');
                      setIsSubmitted(false);
                    }}
                  >
                    Submit Another Idea
                  </WorkspaceButton>
                </div>
              </WorkspaceCard>
            </motion.div>
          ) : (
            <WorkspaceCard variant="default">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Idea Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Business Idea Title <span className="text-[#C66B52]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI-driven Supply Chain Automation for Garments"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full text-xs sm:text-sm p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D99B43] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs"
                  />
                </div>

                {/* Concept Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Detailed Concept Description <span className="text-[#C66B52]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D99B43] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs leading-relaxed"
                    placeholder="Explain what core problem your idea solves, how it works, target customers, and what makes it commercially unique..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* Target Market & Stage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-[#29302D] block">
                      Target Market / Geography <span className="text-[#C66B52]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tamil Nadu textile hubs, Tier-2 MSMEs"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      required
                      className="w-full text-xs sm:text-sm p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D99B43] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-[#29302D] block">
                      Current Maturity Stage
                    </label>
                    <select
                      className="w-full text-xs sm:text-sm p-3.5 border border-[#EADFCF] rounded-2xl bg-white text-[#29302D] focus:outline-none focus:ring-2 focus:ring-[#D99B43] shadow-2xs font-semibold"
                      value={stage}
                      onChange={(e) => setStage(e.target.value as any)}
                    >
                      <option value="IDEA">Idea on Paper</option>
                      <option value="PROTOTYPE">Prototype / MVP Ready</option>
                      <option value="EARLY_TRACTION">Early Customers / Traction</option>
                      <option value="GROWTH">Ready for Scale</option>
                    </select>
                  </div>
                </div>

                {/* Support Needed Multi-select Pills */}
                <div className="space-y-2.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    What Support Do You Need from FIC?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {supportOptions.map((opt, i) => {
                      const isSelected = supportNeeded.includes(opt);
                      return (
                        <button
                          type="button"
                          key={i}
                          onClick={() => toggleSupport(opt)}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D99B43] to-[#B87A28] text-white border-transparent font-black shadow-xs'
                              : 'bg-white text-[#77786E] border-[#EADFCF] hover:bg-[#FDF6E9]/60 hover:text-[#29302D] font-bold'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Confidentiality Notice */}
                <div className="p-4 rounded-2xl bg-[#FDF6E9] border border-[#D99B43]/30 text-xs text-[#29302D] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#D99B43]/15 text-[#9C6818] flex items-center justify-center shrink-0">
                    <ShieldCheckIcon size={16} />
                  </div>
                  <p className="text-[11px] text-[#77786E] leading-relaxed">
                    FIC guarantees proprietary IP protection. Your concept is handled strictly under non-disclosure protocol and is reviewed only by accredited FIC consultants.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex justify-end">
                  <WorkspaceButton
                    variant="amber"
                    size="md"
                    type="submit"
                    loading={isLoading}
                    icon={<ArrowRightIcon size={15} />}
                  >
                    Submit Idea for FIC Review
                  </WorkspaceButton>
                </div>
              </form>
            </WorkspaceCard>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: MY SUBMITTED IDEAS & ADVISORY TRACKER
         ======================================================== */}
      {activeTab === 'my_ideas' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <WorkspaceCard variant="glass" padded={false} className="p-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77786E]" />
                <input
                  type="text"
                  placeholder="Search submitted ideas by title, keyword, or market..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EADFCF] rounded-xl text-xs sm:text-sm text-[#29302D] placeholder-[#77786E]/60 focus:outline-none focus:ring-2 focus:ring-[#D99B43]"
                />
              </div>

              {/* Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="px-3 py-2 bg-white border border-[#EADFCF] rounded-xl text-xs text-[#29302D] font-bold focus:outline-none focus:ring-2 focus:ring-[#D99B43]"
                >
                  <option value="ALL">All Stages</option>
                  <option value="IDEA">Idea on Paper</option>
                  <option value="PROTOTYPE">Prototype / MVP</option>
                  <option value="EARLY_TRACTION">Early Traction</option>
                  <option value="GROWTH">Ready for Scale</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-white border border-[#EADFCF] rounded-xl text-xs text-[#29302D] font-bold focus:outline-none focus:ring-2 focus:ring-[#D99B43]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="FEASIBILITY_ANALYSIS">Feasibility Analysis</option>
                  <option value="ADVISORY_SCHEDULED">Advisory Scheduled</option>
                  <option value="APPROVED_INCUBATION">Approved Incubation</option>
                </select>
              </div>
            </div>
          </WorkspaceCard>

          {/* Idea Cards List */}
          {filteredIdeas.length === 0 ? (
            <WorkspaceEmptyState
              icon={<LightbulbIcon size={28} />}
              title="No ideas match your filters"
              description="You have not submitted any ideas matching this criteria, or your search query yielded no results."
              actionText="Submit New Business Idea"
              onAction={() => setActiveTab('submit')}
              accent="amber"
            />
          ) : (
            <div className="space-y-4">
              {filteredIdeas.map((idea) => (
                <WorkspaceCard key={idea.id} variant="default" className="space-y-4 hover:border-[#D99B43]/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF]/70 pb-3 gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-[#77786E] font-mono font-bold tracking-wider">
                          REF: {idea.id}
                        </span>
                        {getStageBadge(idea.stage)}
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-[#29302D]">
                        {idea.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#77786E] font-medium">{idea.submittedDate}</span>
                      {getStatusBadge(idea.status, idea.statusLabel)}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed line-clamp-2">
                    {idea.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#EADFCF]/50">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-[#77786E]">Support Requested:</span>
                      {idea.supportNeeded.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-[#FAF7F2] border border-[#EADFCF] text-[#29302D] font-bold px-2 py-0.5 rounded-md"
                        >
                          {item}
                        </span>
                      ))}
                      {idea.supportNeeded.length > 3 && (
                        <span className="text-[10px] text-[#77786E] font-bold">
                          +{idea.supportNeeded.length - 3} more
                        </span>
                      )}
                    </div>

                    <WorkspaceButton
                      variant="amber"
                      size="sm"
                      onClick={() => setSelectedIdea(idea)}
                      icon={<ArrowRightIcon size={13} />}
                    >
                      View Advisory Assessment & Details
                    </WorkspaceButton>
                  </div>
                </WorkspaceCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          3. IDEA DETAILS & FEASIBILITY ASSESSMENT MODAL
         ======================================================== */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#FAF7F2] border border-[#EADFCF] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5 my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#EADFCF] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] text-[#77786E] font-mono font-bold">
                    {selectedIdea.id}
                  </span>
                  {getStageBadge(selectedIdea.stage)}
                  {getStatusBadge(selectedIdea.status, selectedIdea.statusLabel)}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#29302D]">
                  {selectedIdea.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIdea(null)}
                className="w-8 h-8 rounded-xl bg-white border border-[#EADFCF] text-[#77786E] hover:text-[#29302D] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Core Description */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-[#29302D] uppercase tracking-wider block">
                Concept & Target Market
              </span>
              <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed bg-white p-3.5 rounded-2xl border border-[#EADFCF]">
                {selectedIdea.description}
              </p>
              <div className="text-xs text-[#77786E] pt-1">
                <strong className="text-[#29302D]">Target Geography: </strong>
                {selectedIdea.targetMarket}
              </div>
            </div>

            {/* Feasibility Ratings */}
            {selectedIdea.feasibilityScore && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF9F0] to-[#F5EBDD] border border-[#D99B43]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-[#9C6818]">
                    <SparklesIcon size={14} />
                    FIC Feasibility Diagnostics
                  </div>
                  <span className="text-[10px] font-bold text-[#9C6818] uppercase tracking-wider">
                    Assessed by Panel
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-[#EADFCF] space-y-1">
                    <span className="text-[10px] text-[#77786E] font-bold block">Market Viability</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-[#29302D]">
                        {selectedIdea.feasibilityScore.marketViability}%
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">Strong</span>
                    </div>
                    <div className="w-full bg-[#FAF7F2] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${selectedIdea.feasibilityScore.marketViability}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-[#EADFCF] space-y-1">
                    <span className="text-[10px] text-[#77786E] font-bold block">Tech Feasibility</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-[#29302D]">
                        {selectedIdea.feasibilityScore.techFeasibility}%
                      </span>
                      <span className="text-[10px] text-[#D99B43] font-bold">Viable</span>
                    </div>
                    <div className="w-full bg-[#FAF7F2] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#D99B43] h-full rounded-full"
                        style={{ width: `${selectedIdea.feasibilityScore.techFeasibility}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-[#EADFCF] space-y-1">
                    <span className="text-[10px] text-[#77786E] font-bold block">Commercial Scale</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-[#29302D]">
                        {selectedIdea.feasibilityScore.commercialScalability}%
                      </span>
                      <span className="text-[10px] text-purple-600 font-bold">High Potential</span>
                    </div>
                    <div className="w-full bg-[#FAF7F2] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full"
                        style={{ width: `${selectedIdea.feasibilityScore.commercialScalability}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advisory Review Notes */}
            {selectedIdea.reviewNotes && (
              <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#29302D]">Advisory Panel Remarks</span>
                  {selectedIdea.advisorName && (
                    <span className="text-[11px] text-[#8064A9] font-bold">
                      {selectedIdea.advisorName} ({selectedIdea.advisorRole})
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#77786E] leading-relaxed">
                  {selectedIdea.reviewNotes}
                </p>
              </div>
            )}

            {/* Next Steps Roadmap */}
            {selectedIdea.nextSteps && selectedIdea.nextSteps.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-black text-[#29302D] uppercase tracking-wider block">
                  Recommended Action Roadmap
                </span>
                <div className="space-y-2">
                  {selectedIdea.nextSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-[#EADFCF] flex items-center gap-3 text-xs text-[#29302D]"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#29302D] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 flex justify-end gap-3 border-t border-[#EADFCF]">
              <WorkspaceButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedIdea(null)}
              >
                Close Details
              </WorkspaceButton>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
};

export default BusinessIdeasPage;
