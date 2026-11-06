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
  LightbulbIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  SearchIcon,
  ClockIcon,
  FileTextIcon
} from '../components/Icons';
import { apiRequest, getStoredUser } from '../services/api';

export interface BusinessIdeaRecord {
  id: string;
  refNumber?: string;
  userId: string;
  title: string;
  description: string;
  targetMarket: string;
  stage: 'IDEA' | 'PROTOTYPE' | 'EARLY_TRACTION' | 'GROWTH';
  supportRequired?: string;
  supportNeeded?: string | string[];
  status:
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFO_REQUIRED'
  | 'ASSESSMENT_IN_PROGRESS'
  | 'ADVISOR_ASSIGNED'
  | 'MEETING_SCHEDULED'
  | 'ACTION_PLAN_READY'
  | 'APPROVED'
  | 'ON_HOLD'
  | 'CLOSED';
  submittedDate: string;
  latestFicUpdate?: string;
  whatHappensNext?: string;
  updateHistory?: {
    date: string;
    status: string;
    update: string;
    updatedBy?: string;
  }[];
}

export const IDEA_STATUS_CONFIG: Record<
  string,
  { label: string; explanation: string; variant: 'pending' | 'proposal' | 'active' | 'luxury' | 'urgent' | 'neutral' }
> = {
  SUBMITTED: {
    label: 'Submitted',
    explanation: 'Your request has been received.',
    variant: 'pending'
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    explanation: 'FIC is reviewing your idea.',
    variant: 'pending'
  },
  INFO_REQUIRED: {
    label: 'Information Required',
    explanation: 'FIC needs additional details from you.',
    variant: 'urgent'
  },
  ASSESSMENT_IN_PROGRESS: {
    label: 'Assessment in Progress',
    explanation: 'Your idea is being evaluated by domain specialists.',
    variant: 'luxury'
  },
  ADVISOR_ASSIGNED: {
    label: 'Advisor Assigned',
    explanation: 'An advisor has been assigned.',
    variant: 'proposal'
  },
  MEETING_SCHEDULED: {
    label: 'Meeting Scheduled',
    explanation: 'Your advisory meeting has been scheduled.',
    variant: 'proposal'
  },
  ACTION_PLAN_READY: {
    label: 'Update Available',
    explanation: 'FIC has shared an update and recommendations.',
    variant: 'active'
  },
  APPROVED: {
    label: 'Completed',
    explanation: 'This request has been completed.',
    variant: 'active'
  },
  ON_HOLD: {
    label: 'On Hold',
    explanation: 'The review is temporarily on hold.',
    variant: 'urgent'
  },
  CLOSED: {
    label: 'Closed',
    explanation: 'This request has been closed.',
    variant: 'neutral'
  }
};

const getStageLabel = (stg?: string) => {
  switch (stg) {
    case 'PROTOTYPE':
      return 'Prototype / MVP Ready';
    case 'EARLY_TRACTION':
      return 'Early Traction';
    case 'GROWTH':
      return 'Ready for Scale';
    case 'IDEA':
    default:
      return 'Idea on Paper';
  }
};

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
  const [supportRequired, setSupportRequired] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Listing State
  const [ideasList, setIdeasList] = useState<BusinessIdeaRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdeaRecord | null>(null);

  const storageKey = `fic_user_ideas_${userId}`;

  const initialDemoIdeas: BusinessIdeaRecord[] = [];

  // Load from server and local storage
  useEffect(() => {
    const loadIdeas = async () => {
      let merged: BusinessIdeaRecord[] = [];
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed: BusinessIdeaRecord[] = JSON.parse(stored);
          merged = [...parsed];
        }
      } catch (err) {
        console.warn('LocalStorage load warning:', err);
      }

      try {
        const res = await apiRequest('/business-ideas/me');
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const serverIdeas: BusinessIdeaRecord[] = res.data.map((item: any) => ({
            id: item.refNumber || item._id,
            refNumber: item.refNumber || item._id,
            userId: item.userId,
            title: item.title,
            description: item.description,
            targetMarket: item.targetMarket || 'General Market',
            stage: item.stage || 'IDEA',
            supportRequired: item.supportRequired || (Array.isArray(item.supportNeeded) ? item.supportNeeded.join(', ') : item.supportNeeded) || '',
            supportNeeded: item.supportNeeded,
            status: item.status || 'SUBMITTED',
            submittedDate: item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
              : 'Recently',
            latestFicUpdate: item.latestFicUpdate || 'Your business idea has been received. Our team is currently reviewing it.',
            whatHappensNext: item.whatHappensNext || 'FIC will complete the initial review and update you.',
            updateHistory: item.updateHistory || [
              {
                date: item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'Today',
                status: 'Submitted',
                update: 'Your business idea has been received. Our team is currently reviewing it.'
              }
            ]
          }));

          const serverIds = new Set(serverIdeas.map((s) => s.id));
          const nonServer = merged.filter((m) => !serverIds.has(m.id));
          merged = [...serverIdeas, ...nonServer];
        }
      } catch (err) {
        console.warn('Backend fetch failed, using local seed:', err);
      }

      setIdeasList(merged);
      try {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch (e) {
        console.error(e);
      }
    };

    loadIdeas();
  }, [storageKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const generatedRef = `IDEA-2026-${Math.floor(100 + Math.random() * 900)}`;
    const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    const newIdeaRecord: BusinessIdeaRecord = {
      id: generatedRef,
      refNumber: generatedRef,
      userId,
      title: title.trim(),
      description: description.trim(),
      targetMarket: targetMarket.trim(),
      stage,
      supportRequired: supportRequired.trim(),
      supportNeeded: supportRequired.trim(),
      status: 'SUBMITTED',
      submittedDate: todayFormatted,
      latestFicUpdate: 'Your business idea has been received. Our team is currently reviewing it.',
      whatHappensNext: 'FIC will complete the initial review and update you.',
      updateHistory: [
        {
          date: todayFormatted,
          status: 'Submitted',
          update: 'Your business idea has been received. Our team is currently reviewing it.',
          updatedBy: 'FIC Incubation Desk'
        }
      ]
    };

    try {
      await apiRequest('/business-ideas', {
        method: 'POST',
        body: JSON.stringify({
          refNumber: generatedRef,
          title: title.trim(),
          description: description.trim(),
          targetMarket: targetMarket.trim(),
          stage,
          supportRequired: supportRequired.trim(),
          supportNeeded: supportRequired.trim()
        })
      });
    } catch {
      // Graceful fallback to client persistence
    } finally {
      const updated = [newIdeaRecord, ...ideasList];
      setIdeasList(updated);
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

  // Filtered Ideas
  const filteredIdeas = ideasList.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchMarket = item.targetMarket.toLowerCase().includes(q);
      const matchRef = (item.refNumber || item.id).toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchMarket && !matchRef) return false;
    }
    return true;
  });

  const getStatusBadge = (st: string) => {
    const config = IDEA_STATUS_CONFIG[st] || { label: st, variant: 'pending' as const };
    return <WorkspaceBadge variant={config.variant}>{config.label}</WorkspaceBadge>;
  };

  const getWhatHappensNext = (idea: BusinessIdeaRecord) => {
    if (idea.whatHappensNext) return idea.whatHappensNext;
    switch (idea.status) {
      case 'INFO_REQUIRED':
        return 'Please provide the requested information to continue.';
      case 'ADVISOR_ASSIGNED':
      case 'MEETING_SCHEDULED':
        return 'Your advisor will contact you after the review is completed.';
      case 'APPROVED':
        return 'Your idea has been accepted for incubation. FIC will connect you with industry mentors.';
      case 'UNDER_REVIEW':
      case 'SUBMITTED':
      default:
        return 'FIC will complete the initial review and update you.';
    }
  };

  return (
    <WorkspaceShell>
      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="amber"
        title="Business Ideas & Incubation Desk"
        subtitle="Submit your business idea, receive guidance from verified FIC mentors, and track review updates easily under strict non-disclosure."
      />

      {/* ========================================================
          2. TWO-TAB WORKSPACE SWITCHER
         ======================================================== */}
      <div className="flex items-center gap-2 border-b border-[#EADFCF] pb-2.5 mb-5">
        <button
          type="button"
          onClick={() => setActiveTab('submit')}
          className={`relative px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-[13px] transition-colors duration-200 flex items-center gap-2 cursor-pointer ${activeTab === 'submit' ? 'text-white' : 'text-[#453A33] hover:text-[#C65638] font-bold'
            }`}
        >
          {activeTab === 'submit' && (
            <motion.div
              layoutId="ideasTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-gradient-to-r from-[#E5A23B] to-[#D08E27] rounded-xl shadow-[0_2px_8px_rgba(229,162,59,0.25)] -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <LightbulbIcon size={15} />
            <span>Submit New Idea</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_ideas')}
          className={`relative px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-[13px] transition-colors duration-200 flex items-center gap-2 cursor-pointer ${activeTab === 'my_ideas' ? 'text-white' : 'text-[#453A33] hover:text-[#C65638] font-bold'
            }`}
        >
          {activeTab === 'my_ideas' && (
            <motion.div
              layoutId="ideasTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-gradient-to-r from-[#E5A23B] to-[#D08E27] rounded-xl shadow-[0_2px_8px_rgba(229,162,59,0.25)] -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <FileTextIcon size={15} />
            <span>Track Submitted Ideas</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'my_ideas'
                  ? 'bg-white/25 text-white'
                  : 'bg-[#FAF7F2] text-[#453A33] border border-[#EDE2D7]'
                }`}
            >
              {ideasList.length}
            </span>
          </span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: SUBMIT NEW IDEA FORM / SUCCESS BANNER
         ======================================================== */}
      {activeTab === 'submit' && (
        <div className="max-w-3xl mx-auto">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <WorkspaceCard variant="amber" className="text-center py-8 px-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2E7D32] to-[#4CAF50] text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircleIcon size={28} />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-mono font-bold">
                    Reference: {submittedRef}
                  </span>
                  <h3 className="text-xl font-black text-[#2E231C]">Idea Submitted Successfully!</h3>
                  <p className="text-xs sm:text-sm text-[#453A33] leading-relaxed">
                    Your business idea <strong className="text-[#2E231C]">"{title}"</strong> has been submitted successfully to the FIC Incubation Desk under strict non-disclosure.
                  </p>
                  <p className="text-xs text-[#6B5E55] leading-relaxed bg-white/70 p-3 rounded-xl border border-[#EDE2D7]">
                    You can track its progress and latest updates anytime under <strong>"Track Submitted Ideas"</strong>.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <WorkspaceButton
                    variant="amber"
                    size="md"
                    onClick={() => setActiveTab('my_ideas')}
                    icon={<ArrowRightIcon size={14} />}
                  >
                    Track Submitted Ideas
                  </WorkspaceButton>
                  <WorkspaceButton
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setTitle('');
                      setDescription('');
                      setTargetMarket('');
                      setSupportRequired('');
                      setIsSubmitted(false);
                      setSubmittedRef('');
                    }}
                  >
                    Submit Another Idea
                  </WorkspaceButton>
                </div>
              </WorkspaceCard>
            </motion.div>
          ) : (
            <WorkspaceCard variant="default">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Business Idea Title */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#2E231C] block">
                    Business Idea Title <span className="text-[#C65638]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI-driven Supply Chain Automation for Garments"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5A23B] bg-white text-[#2E231C] placeholder-[#82776E]/70 shadow-2xs"
                  />
                </div>

                {/* 2. Detailed Idea Description */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#2E231C] block">
                    Detailed Idea Description <span className="text-[#C65638]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full text-xs sm:text-[13px] p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5A23B] bg-white text-[#2E231C] placeholder-[#82776E]/70 shadow-2xs leading-relaxed"
                    placeholder="Explain what core problem your idea solves, how it works, target customers, and what makes it commercially unique..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* 3. Target Market & 4. Current Stage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#2E231C] block">
                      Target Market / Location <span className="text-[#C65638]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tamil Nadu textile hubs, Tier-2 MSMEs"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      required
                      className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5A23B] bg-white text-[#2E231C] placeholder-[#82776E]/70 shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#2E231C] block">
                      Current Development Stage
                    </label>
                    <select
                      className="w-full text-xs sm:text-sm p-3 border border-[#EDE2D7] rounded-xl bg-white text-[#2E231C] focus:outline-none focus:ring-2 focus:ring-[#E5A23B] shadow-2xs font-semibold"
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

                {/* 5. What Support Do You Need from FIC? (Simple Text Area) */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#2E231C] block">
                    What Support Do You Need from FIC? <span className="text-[11px] font-normal text-[#6B5E55]">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={supportRequired}
                    onChange={(e) => setSupportRequired(e.target.value)}
                    placeholder="Describe what support you need from FIC. For example: I need help validating my business idea, preparing a business plan, finding a mentor, developing an app, or planning my market entry."
                    className="w-full text-xs sm:text-[13px] p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5A23B] bg-white text-[#2E231C] placeholder-[#82776E]/70 shadow-2xs leading-relaxed"
                  />
                </div>

                {/* Confidentiality Notice */}
                <div className="p-3 rounded-xl bg-[#F8EBD0]/35 border border-[#E5A23B]/30 text-xs text-[#2E231C] flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#E5A23B]/15 text-[#BA7B1A] flex items-center justify-center shrink-0">
                    <ShieldCheckIcon size={14} />
                  </div>
                  <p className="text-[11px] text-[#453A33] leading-relaxed">
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
                    icon={<ArrowRightIcon size={14} />}
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
          TAB 2: TRACK SUBMITTED IDEAS (SIMPLE CARDS ONLY)
         ======================================================== */}
      {activeTab === 'my_ideas' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Simple Search */}
          <div className="relative">
            <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
            <input
              type="text"
              placeholder="Search by idea title, reference number, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE2D7] rounded-xl text-xs sm:text-[13px] text-[#2E231C] placeholder-[#82776E]/70 focus:outline-none focus:ring-2 focus:ring-[#E5A23B]"
            />
          </div>

          {/* Simple Idea Cards List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredIdeas.length === 0 ? (
                <motion.div
                  key="empty-ideas"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <WorkspaceEmptyState
                    icon={<LightbulbIcon size={28} />}
                    title="No ideas found"
                    description="You haven't submitted any ideas yet or no records match your search."
                    actionText="Submit New Business Idea"
                    onAction={() => setActiveTab('submit')}
                    accent="amber"
                  />
                </motion.div>
              ) : (
                filteredIdeas.map((idea) => {
                  return (
                    <motion.div
                      key={idea.id}
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
                              {idea.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-[#6B5E55]">
                              <span>
                                <strong>Reference: </strong>
                                <span className="font-mono font-bold text-[#2E231C]">{idea.refNumber || idea.id}</span>
                              </span>
                              <span>•</span>
                              <span>
                                <strong>Submitted: </strong>
                                {idea.submittedDate}
                              </span>
                            </div>
                          </div>
                          <div>{getStatusBadge(idea.status)}</div>
                        </div>

                        {/* Latest FIC Update (1 or 2 lines) */}
                        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] text-xs">
                          <strong className="text-[#2E231C] block mb-0.5">Latest FIC Update:</strong>
                          <p className="text-[#453A33] leading-relaxed">
                            "{idea.latestFicUpdate || 'Your business idea has been received. Our team is currently reviewing it.'}"
                          </p>
                        </div>

                        {/* Button: View Details */}
                        <div className="flex justify-end pt-1">
                          <WorkspaceButton
                            variant="amber"
                            size="sm"
                            onClick={() => setSelectedIdea(idea)}
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
        isOpen={!!selectedIdea}
        onClose={() => setSelectedIdea(null)}
        maxWidth="max-w-2xl"
        title={
          selectedIdea && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-[#6B5E55] font-mono font-bold bg-stone-100 px-2 py-0.5 rounded">
                  Reference: {selectedIdea.refNumber || selectedIdea.id}
                </span>
                {getStatusBadge(selectedIdea.status)}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#2E231C]">
                {selectedIdea.title}
              </h3>
            </div>
          )
        }
      >
        {selectedIdea && (
          <div className="space-y-5">
            {/* ----------------------------------------------------
                1. WHAT YOU SUBMITTED
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                1. What You Submitted
              </h4>
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7] space-y-3 text-xs">
                <div>
                  <span className="text-[#6B5E55] font-bold block mb-0.5">Idea Title:</span>
                  <p className="text-[#2E231C] font-black text-sm">{selectedIdea.title}</p>
                </div>
                <div>
                  <span className="text-[#6B5E55] font-bold block mb-0.5">Idea Description:</span>
                  <p className="text-[#453A33] leading-relaxed bg-white p-2.5 rounded-lg border border-[#EDE2D7]">
                    {selectedIdea.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#6B5E55] font-bold block mb-0.5">Target Market / Location:</span>
                    <p className="text-[#2E231C] font-semibold">{selectedIdea.targetMarket}</p>
                  </div>
                  <div>
                    <span className="text-[#6B5E55] font-bold block mb-0.5">Development Stage:</span>
                    <p className="text-[#2E231C] font-semibold">{getStageLabel(selectedIdea.stage)}</p>
                  </div>
                </div>
                <div>
                  <span className="text-[#6B5E55] font-bold block mb-0.5">Support Required:</span>
                  <p className="text-[#453A33] leading-relaxed bg-white p-2.5 rounded-lg border border-[#EDE2D7]">
                    {selectedIdea.supportRequired ||
                      (Array.isArray(selectedIdea.supportNeeded)
                        ? selectedIdea.supportNeeded.join(', ')
                        : selectedIdea.supportNeeded) ||
                      'General advisory and validation support.'}
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
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
                <p className="text-amber-950 font-medium leading-relaxed">
                  "{selectedIdea.latestFicUpdate || 'Your business idea has been received. Our team is currently reviewing it.'}"
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
                  {getStatusBadge(selectedIdea.status)}
                  <span className="text-[#453A33] font-medium">
                    {IDEA_STATUS_CONFIG[selectedIdea.status]?.explanation || 'Your idea is being reviewed.'}
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
                  {getWhatHappensNext(selectedIdea)}
                </p>
              </div>
            </div>

            {/* ----------------------------------------------------
                5. UPDATE HISTORY
               ---------------------------------------------------- */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#2E231C] uppercase tracking-wider">
                5. Update History
              </h4>
              <div className="p-3.5 rounded-xl bg-white border border-[#EDE2D7] text-xs space-y-2.5">
                {selectedIdea.updateHistory && selectedIdea.updateHistory.length > 0 ? (
                  selectedIdea.updateHistory.map((hist, idx) => (
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
                onClick={() => setSelectedIdea(null)}
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

export default BusinessIdeasPage;
