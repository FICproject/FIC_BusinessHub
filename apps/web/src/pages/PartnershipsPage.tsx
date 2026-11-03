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
import { AnimatedModal, StaggerContainer, StaggerItem } from '../motion';
import {
  HandshakeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  ShieldCheckIcon,
  SearchIcon,
  ClockIcon,
  AlertCircleIcon,
  FileTextIcon,
  BriefcaseIcon
} from '../components/Icons';
import { apiRequest, getStoredUser } from '../services/api';

export interface PartnershipRecord {
  id: string;
  userId: string;
  organizationName: string;
  partnershipType: string;
  partnershipTypeLabel: string;
  proposalSummary: string;
  status: 'FIC_ASSESSMENT' | 'PARTNER_IDENTIFIED' | 'EXPLORATORY_SESSION' | 'MOU_DRAFTING';
  statusLabel: string;
  submittedDate: string;
  matchedEntity?: {
    name: string;
    sector: string;
    location: string;
    synergyScore: number;
  };
  intermediaryRemarks?: string;
  ndaStatus?: 'PENDING_SIGNATURE' | 'EXECUTED';
  meetingStatus?: string;
}

export const PartnershipsPage: React.FC = () => {
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_default';

  // Tabs: 'submit' | 'track_alliances'
  const [activeTab, setActiveTab] = useState<'submit' | 'track_alliances'>('submit');

  // Form State
  const [organizationName, setOrganizationName] = useState('');
  const [partnershipType, setPartnershipType] = useState('B2B_COLLABORATION');
  const [proposalSummary, setProposalSummary] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Listing State
  const [alliancesList, setAlliancesList] = useState<PartnershipRecord[]>([]);
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlliance, setSelectedAlliance] = useState<PartnershipRecord | null>(null);

  const storageKey = `fic_user_partnerships_${userId}`;

  const partnershipTypeLabels: Record<string, string> = {
    B2B_COLLABORATION: 'Commercial B2B Tie-Up & Cross-Selling',
    DISTRIBUTOR_NETWORK: 'State-wide Distributor & Dealer Onboarding',
    JOINT_VENTURE: 'Strategic Equity Joint Venture (JV)',
    OEM_SUPPLIER: 'OEM Contract Manufacturing & Supply Alliance',
    FRANCHISE_EXPANSION: 'Franchise Network Development',
    TECHNOLOGY_INTEGRATION: 'Technology API & Platform Integration'
  };

  const initialDemoPartnerships: PartnershipRecord[] = [
    {
      id: 'PTNR-2026-612',
      userId,
      organizationName: user?.fullName ? `${user.fullName} Solutions` : 'Apex Industrial Alliances',
      partnershipType: 'DISTRIBUTOR_NETWORK',
      partnershipTypeLabel: 'State-wide Distributor & Dealer Onboarding',
      proposalSummary:
        'Seeking verified FMCG and general trade distributors across Coimbatore, Madurai, and Tiruchirappalli with warehousing capacity of 2,000+ sq. ft. and established dealer lines.',
      status: 'EXPLORATORY_SESSION',
      statusLabel: 'Exploratory Session Scheduled',
      submittedDate: '27 Oct 2026',
      matchedEntity: {
        name: 'Kongu Regional Logistics & Distribution Ltd.',
        sector: 'Wholesale & Logistics',
        location: 'Coimbatore, Tamil Nadu',
        synergyScore: 94
      },
      intermediaryRemarks:
        'FIC Commercial Desk has matched your requirement with a verified multi-depot FMCG distributor with 18 years operating history in Western Tamil Nadu. Bilateral NDA has been executed.',
      ndaStatus: 'EXECUTED',
      meetingStatus: 'Virtual facilitation meet scheduled via FIC Intermediary Desk'
    },
    {
      id: 'PTNR-2026-508',
      userId,
      organizationName: 'Precision Engineering Consortium',
      partnershipType: 'OEM_SUPPLIER',
      partnershipTypeLabel: 'OEM Contract Manufacturing & Supply Alliance',
      proposalSummary:
        'OEM capacity sharing for automotive aluminum dye-casting parts. Looking to supply Tier-1 automotive assembly units in Chennai and Sriperumbudur.',
      status: 'PARTNER_IDENTIFIED',
      statusLabel: 'Partner Identified',
      submittedDate: '18 Oct 2026',
      matchedEntity: {
        name: 'AutoTech Subsystems OEM',
        sector: 'Automotive & Heavy Engineering',
        location: 'Sriperumbudur Auto Cluster',
        synergyScore: 89
      },
      intermediaryRemarks:
        'FIC Automotive specialist has vetted technical capacity drawings and ISO/TS certifications. Preliminary alignment report submitted to lead buyer.',
      ndaStatus: 'PENDING_SIGNATURE',
      meetingStatus: 'Awaiting mutual NDA completion'
    }
  ];

  // Load from localStorage or seed
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setAlliancesList(JSON.parse(stored));
      } else {
        localStorage.setItem(storageKey, JSON.stringify(initialDemoPartnerships));
        setAlliancesList(initialDemoPartnerships);
      }
    } catch {
      setAlliancesList(initialDemoPartnerships);
    }
  }, [storageKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newAllianceRecord: PartnershipRecord = {
      id: `PTNR-2026-${Math.floor(100 + Math.random() * 900)}`,
      userId,
      organizationName: organizationName.trim(),
      partnershipType,
      partnershipTypeLabel: partnershipTypeLabels[partnershipType] || partnershipType,
      proposalSummary: proposalSummary.trim(),
      status: 'FIC_ASSESSMENT',
      statusLabel: 'FIC Assessment',
      submittedDate: 'Today',
      matchedEntity: {
        name: 'FIC Corporate Matching In Progress',
        sector: 'Enterprise Sector Directory',
        location: 'South India Hub',
        synergyScore: 78
      },
      intermediaryRemarks:
        'Your alliance proposal has been logged with the FIC Corporate Partnerships Wing. Our analysts are screening verified member companies in our database for optimal business synergy.',
      ndaStatus: 'PENDING_SIGNATURE',
      meetingStatus: 'Intermediary assessment pending'
    };

    try {
      await apiRequest('/partnership-requests', {
        method: 'POST',
        body: JSON.stringify({
          organizationName,
          partnershipType,
          proposalSummary
        })
      });
    } catch {
      // Graceful fallback
    } finally {
      const updated = [newAllianceRecord, ...alliancesList];
      setAlliancesList(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      setIsSubmitted(true);
      setIsLoading(false);
    }
  };

  const filteredAlliances = alliancesList.filter((item) => {
    if (filterType !== 'ALL' && item.partnershipType !== filterType) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrg = item.organizationName.toLowerCase().includes(q);
      const matchType = item.partnershipTypeLabel.toLowerCase().includes(q);
      const matchSummary = item.proposalSummary.toLowerCase().includes(q);
      if (!matchOrg && !matchType && !matchSummary) return false;
    }
    return true;
  });

  const getStatusBadge = (st: string, label: string) => {
    switch (st) {
      case 'EXPLORATORY_SESSION':
        return <WorkspaceBadge variant="luxury">{label}</WorkspaceBadge>;
      case 'MOU_DRAFTING':
        return <WorkspaceBadge variant="active">{label}</WorkspaceBadge>;
      case 'PARTNER_IDENTIFIED':
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
        accent="rose"
        badge={
          <div className="flex items-center gap-2">
            <WorkspaceBadge variant="luxury">
              <SparklesIcon size={12} className="text-[#D78E9A]" />
              Strategic Alliances
            </WorkspaceBadge>
            <span className="text-[11px] font-bold text-[#D78E9A] bg-white/80 border border-[#D78E9A]/30 px-2.5 py-0.5 rounded-lg">
              B2B Matchmaking
            </span>
          </div>
        }
        title="Business Tie-ups & Strategic Partnerships"
        subtitle="Form joint ventures, OEM supply alliances, state-wide distributor networks, and cross-selling partnerships with verified enterprises across FIC."
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
              layoutId="ptnrTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-[#29302D] rounded-xl shadow-sm -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <HandshakeIcon size={16} />
            <span>Submit Tie-Up Proposal</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('track_alliances')}
          className={`relative px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
            activeTab === 'track_alliances' ? 'text-[#FCFAF6]' : 'text-[#77786E] hover:text-[#29302D]'
          }`}
        >
          {activeTab === 'track_alliances' && (
            <motion.div
              layoutId="ptnrTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute inset-0 bg-[#29302D] rounded-xl shadow-sm -z-0"
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <FileTextIcon size={16} />
            <span>Track Alliances & Matchmaking</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'track_alliances' ? 'bg-white/20 text-white' : 'bg-[#EADFCF] text-[#29302D]'
              }`}
            >
              {alliancesList.length}
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
              <WorkspaceCard variant="rose" className="text-center py-12 px-6 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#D78E9A] to-[#F0A8B5] text-white flex items-center justify-center mx-auto shadow-lg"
                >
                  <CheckCircleIcon size={32} />
                </motion.div>
                <div className="space-y-1.5 max-w-lg mx-auto">
                  <h3 className="text-xl font-black text-[#29302D]">Tie-Up Proposal Registered!</h3>
                  <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed">
                    Your partnership requirement for <strong className="text-[#29302D]">{organizationName}</strong> has been logged. FIC will identify suitable verified enterprise partners and arrange confidential exploratory meetings.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <WorkspaceButton
                    variant="rose"
                    size="md"
                    onClick={() => setActiveTab('track_alliances')}
                    icon={<ArrowRightIcon size={14} />}
                  >
                    View in Alliances Tracker
                  </WorkspaceButton>
                  <WorkspaceButton
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setOrganizationName('');
                      setProposalSummary('');
                      setIsSubmitted(false);
                    }}
                  >
                    Submit Another Tie-Up
                  </WorkspaceButton>
                </div>
              </WorkspaceCard>
            </motion.div>
          ) : (
            <WorkspaceCard variant="default">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Entity Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Your Company / Entity Name <span className="text-[#C66B52]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. South Star Agro Traders / Apex Precision Engineering"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    className="w-full text-xs sm:text-sm p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D78E9A] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs"
                  />
                </div>

                {/* Partnership Model */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Partnership & Collaboration Model
                  </label>
                  <select
                    className="w-full text-xs sm:text-sm p-3.5 border border-[#EADFCF] rounded-2xl bg-white text-[#29302D] focus:outline-none focus:ring-2 focus:ring-[#D78E9A] shadow-2xs font-semibold"
                    value={partnershipType}
                    onChange={(e) => setPartnershipType(e.target.value)}
                  >
                    <option value="B2B_COLLABORATION">Commercial B2B Tie-Up & Cross-Selling</option>
                    <option value="DISTRIBUTOR_NETWORK">State-wide Distributor & Dealer Onboarding</option>
                    <option value="JOINT_VENTURE">Strategic Equity Joint Venture (JV)</option>
                    <option value="OEM_SUPPLIER">OEM Contract Manufacturing & Supply Alliance</option>
                    <option value="FRANCHISE_EXPANSION">Franchise Network Development</option>
                    <option value="TECHNOLOGY_INTEGRATION">Technology API & Platform Integration</option>
                  </select>
                </div>

                {/* Proposal Summary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29302D] block">
                    Collaboration Scope & Target Partner Profile <span className="text-[#C66B52]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D78E9A] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs leading-relaxed"
                    placeholder="Describe what your organization brings to the table, what partner attributes you seek, target geography, and commercial synergy expectation..."
                    value={proposalSummary}
                    onChange={(e) => setProposalSummary(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* Protection Notice */}
                <div className="p-4 rounded-2xl bg-[#FCF3F5] border border-[#D78E9A]/30 text-xs text-[#29302D] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#D78E9A]/15 text-[#C66B52] flex items-center justify-center shrink-0">
                    <ShieldCheckIcon size={16} />
                  </div>
                  <p className="text-[11px] text-[#77786E] leading-relaxed">
                    FIC Corporate Partnerships Desk maintains strict commercial confidentiality. Proposals are matched only with verified, KYC-cleared corporate members.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex justify-end">
                  <WorkspaceButton
                    variant="rose"
                    size="md"
                    type="submit"
                    loading={isLoading}
                    icon={<ArrowRightIcon size={15} />}
                  >
                    Submit Tie-Up Proposal
                  </WorkspaceButton>
                </div>
              </form>
            </WorkspaceCard>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: TRACK ALLIANCES & MATCHMAKING
         ======================================================== */}
      {activeTab === 'track_alliances' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <WorkspaceCard variant="glass" padded={false} className="p-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77786E]" />
                <input
                  type="text"
                  placeholder="Search proposals by company name or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EADFCF] rounded-xl text-xs sm:text-sm text-[#29302D] placeholder-[#77786E]/60 focus:outline-none focus:ring-2 focus:ring-[#D78E9A]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-white border border-[#EADFCF] rounded-xl text-xs text-[#29302D] font-bold focus:outline-none focus:ring-2 focus:ring-[#D78E9A]"
                >
                  <option value="ALL">All Models</option>
                  <option value="DISTRIBUTOR_NETWORK">Distributor Networks</option>
                  <option value="OEM_SUPPLIER">OEM Supplier Alliances</option>
                  <option value="B2B_COLLABORATION">Commercial B2B Tie-Ups</option>
                  <option value="JOINT_VENTURE">Joint Ventures</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-white border border-[#EADFCF] rounded-xl text-xs text-[#29302D] font-bold focus:outline-none focus:ring-2 focus:ring-[#D78E9A]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="FIC_ASSESSMENT">FIC Assessment</option>
                  <option value="PARTNER_IDENTIFIED">Partner Identified</option>
                  <option value="EXPLORATORY_SESSION">Exploratory Session</option>
                  <option value="MOU_DRAFTING">MOU Drafting</option>
                </select>
              </div>
            </div>
          </WorkspaceCard>

          {/* List (Animated Layout & PopLayout) */}
          <motion.div layout className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredAlliances.length === 0 ? (
                <motion.div
                  key="empty-alliances"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                >
                  <WorkspaceEmptyState
                    icon={<HandshakeIcon size={28} />}
                    title="No partnership proposals found"
                    description="No active alliance records match the current filters."
                    actionText="Submit Tie-Up Proposal"
                    onAction={() => setActiveTab('submit')}
                    accent="rose"
                  />
                </motion.div>
              ) : (
                filteredAlliances.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  >
                    <WorkspaceCard variant="default" className="space-y-4 hover:border-[#D78E9A]/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF]/70 pb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-[#77786E] font-mono font-bold tracking-wider">
                              PROP: {item.id}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#D78E9A]/15 text-[#C66B52] border border-[#D78E9A]/20">
                              {item.partnershipTypeLabel}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-[#29302D]">
                            {item.organizationName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#77786E] font-medium">{item.submittedDate}</span>
                          {getStatusBadge(item.status, item.statusLabel)}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed line-clamp-2">
                        {item.proposalSummary}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EADFCF]/50">
                        <div className="text-xs text-[#77786E]">
                          {item.matchedEntity ? (
                            <span>
                              <strong className="text-[#29302D]">Candidate Partner: </strong>
                              {item.matchedEntity.name} ({item.matchedEntity.location})
                            </span>
                          ) : (
                            <span>Candidate matchmaking in progress</span>
                          )}
                        </div>

                        <WorkspaceButton
                          variant="rose"
                          size="sm"
                          onClick={() => setSelectedAlliance(item)}
                          icon={<ArrowRightIcon size={13} />}
                        >
                          View Partner Match Details & Status
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
          3. ALLIANCE DETAILS & MATCHMAKING ANIMATED MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!selectedAlliance}
        onClose={() => setSelectedAlliance(null)}
        maxWidth="max-w-2xl"
        title={
          selectedAlliance && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-[#77786E] font-mono font-bold">
                  {selectedAlliance.id}
                </span>
                {getStatusBadge(selectedAlliance.status, selectedAlliance.statusLabel)}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#29302D]">
                {selectedAlliance.organizationName}
              </h3>
              <span className="text-xs text-[#C66B52] font-bold">
                {selectedAlliance.partnershipTypeLabel}
              </span>
            </div>
          )
        }
      >
        {selectedAlliance && (
          <div className="space-y-5">
            {/* Scope */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-[#29302D] uppercase tracking-wider block">
                Collaboration Scope & Target Profile
              </span>
              <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed bg-white p-3.5 rounded-2xl border border-[#EADFCF]">
                {selectedAlliance.proposalSummary}
              </p>
            </div>

            {/* Candidate Matched Entity */}
            {selectedAlliance.matchedEntity && (
              <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#29302D] uppercase tracking-wider">
                    Candidate Partner Match Profile
                  </span>
                  <span className="text-xs font-black text-[#2E7D32] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedAlliance.matchedEntity.synergyScore}% Compatibility Score
                  </span>
                </div>
                <div className="text-sm font-black text-[#29302D]">
                  {selectedAlliance.matchedEntity.name}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#77786E]">
                  <div>
                    <strong className="text-[#29302D]">Sector: </strong>
                    {selectedAlliance.matchedEntity.sector}
                  </div>
                  <div>
                    <strong className="text-[#29302D]">Location: </strong>
                    {selectedAlliance.matchedEntity.location}
                  </div>
                </div>
              </div>
            )}

            {/* Intermediary Remarks */}
            <div className="p-4 rounded-2xl bg-[#FCF3F5] border border-[#D78E9A]/30 space-y-1.5 text-xs">
              <strong className="text-[#C66B52] font-black block">
                FIC Intermediary Assessment
              </strong>
              <p className="text-[#77786E] leading-relaxed">
                {selectedAlliance.intermediaryRemarks}
              </p>
              {selectedAlliance.meetingStatus && (
                <div className="pt-1 font-bold text-[#29302D]">
                  Current Step: {selectedAlliance.meetingStatus}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 flex justify-end gap-3 border-t border-[#EADFCF]">
              <WorkspaceButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedAlliance(null)}
              >
                Close Details
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>
    </WorkspaceShell>
  );
};

export default PartnershipsPage;
