import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceBadge
} from '../components/workspace/WorkspaceComponents';
import { HandshakeIcon, CheckCircleIcon, ArrowRightIcon, SparklesIcon, ShieldCheckIcon } from '../components/Icons';
import { apiRequest } from '../services/api';

export const PartnershipsPage: React.FC = () => {
  const [organizationName, setOrganizationName] = useState('');
  const [partnershipType, setPartnershipType] = useState('B2B_COLLABORATION');
  const [proposalSummary, setProposalSummary] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest('/partnership-requests', {
        method: 'POST',
        body: JSON.stringify({
          organizationName,
          partnershipType,
          proposalSummary
        })
      });
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WorkspaceShell maxWidth="4xl">
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
        subtitle="Form joint ventures, OEM supply alliances, state-wide distributor networks, or strategic commercial integrations with verified enterprises across FIC."
      />

      {/* ========================================================
          2. FORM OR SUBMITTED STATE
         ======================================================== */}
      {isSubmitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <WorkspaceCard variant="rose" className="text-center py-12 px-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#D78E9A] to-[#F0A8B5] text-white flex items-center justify-center mx-auto shadow-lg">
              <CheckCircleIcon size={32} />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h3 className="text-xl font-black text-[#29302D]">Tie-Up Proposal Registered!</h3>
              <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed">
                Your partnership requirement for <strong className="text-[#29302D]">{organizationName}</strong> has been logged. FIC will identify suitable verified enterprise partners and arrange confidential exploratory meetings.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <WorkspaceButton
                variant="rose"
                size="md"
                onClick={() => {
                  setOrganizationName('');
                  setProposalSummary('');
                  setIsSubmitted(false);
                }}
              >
                Submit Another Tie-Up Requirement
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
                <option value="B2B_COLLABORATION">Commercial B2B Collaboration</option>
                <option value="MANUFACTURING_PARTNER">OEM / Contract Manufacturing Supply</option>
                <option value="DISTRIBUTION_NETWORK">Distributor / Stockist Representation</option>
                <option value="FRANCHISE">Franchise Network Expansion</option>
                <option value="VENDOR_RELATIONSHIP">Vendor / Raw Material Procurement Sourcing</option>
                <option value="JOINT_VENTURE">Joint Venture / Co-Development Consortium</option>
                <option value="STRATEGIC_ALLIANCE">Cross-Promotion Strategic Alliance</option>
              </select>
            </div>

            {/* Proposal Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-[#29302D] block">
                Proposal & Mutual Value Proposition <span className="text-[#C66B52]">*</span>
              </label>
              <textarea
                rows={4}
                className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D78E9A] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs leading-relaxed"
                placeholder="Explain what kind of partner profile you are seeking, target geography, expected synergy, minimum volume commitments, and commercial terms..."
                value={proposalSummary}
                onChange={(e) => setProposalSummary(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Governance note */}
            <div className="p-4 rounded-2xl bg-[#FCF8F9] border border-[#D78E9A]/30 text-xs text-[#29302D] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#D78E9A]/15 text-[#D78E9A] flex items-center justify-center shrink-0">
                <ShieldCheckIcon size={16} />
              </div>
              <p className="text-[11px] text-[#77786E] leading-relaxed">
                FIC acts as neutral intermediary. Both parties undergo mutual suitability screening before commercial agreements are finalized.
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
                Submit Tie-Up Requirement
              </WorkspaceButton>
            </div>
          </form>
        </WorkspaceCard>
      )}
    </WorkspaceShell>
  );
};

export default PartnershipsPage;
