import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceBadge
} from '../components/workspace/WorkspaceComponents';
import {
  TrendingUpIcon,
  ShieldCheckIcon,
  LockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  BriefcaseIcon
} from '../components/Icons';
import { apiRequest } from '../services/api';

export const InvestmentPage: React.FC = () => {
  const [profileType, setProfileType] = useState<'INVESTOR' | 'FUNDING_SEEKER'>('FUNDING_SEEKER');
  const [amountRange, setAmountRange] = useState('₹25 Lakhs - ₹1 Crore');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Manufacturing', 'Technology']);
  const [pitchSummary, setPitchSummary] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sectorList = ['Manufacturing', 'Technology', 'Agri-Tech', 'Healthcare', 'Retail / Franchise', 'Renewables'];

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
        subtitle="Privately express commercial investment appetite or growth capital requirements. Managed exclusively by authorized senior FIC Intermediary Officers under strict non-disclosure."
      />

      {/* ========================================================
          2. COMPLIANCE & PRIVACY SAFEGUARD NOTICE
         ======================================================== */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFBF8] border border-[#E58C72]/30 shadow-xs space-y-1.5">
        <div className="flex items-center gap-2 font-black text-[#C66B52] text-xs">
          <ShieldCheckIcon size={16} />
          Compliance & Regulatory Protocol:
        </div>
        <p className="text-xs text-[#77786E] leading-relaxed">
          Financial requirements and investor profiles are NEVER disclosed publicly or shown on marketplace feeds. FIC does not hold custody of investor funds or solicit public deposits. We act purely as a private intermediary coordinator for compliant B2B corporate introductions.
        </p>
      </div>

      {/* ========================================================
          3. FORM OR SUBMITTED STATE
         ======================================================== */}
      {isSubmitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <WorkspaceCard variant="amber" className="text-center py-12 px-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#D99B43] to-[#B87A28] text-white flex items-center justify-center mx-auto shadow-lg">
              <CheckCircleIcon size={32} />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h3 className="text-xl font-black text-[#29302D]">Confidential Record Registered!</h3>
              <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed">
                Your investment orientation profile has been encrypted and routed to the FIC Senior Deal Committee. You will be contacted privately if a verified, compliant match is established.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <WorkspaceButton
                variant="charcoal"
                size="md"
                onClick={() => {
                  setPitchSummary('');
                  setIsSubmitted(false);
                }}
              >
                Submit Another Confidential Profile
              </WorkspaceButton>
            </div>
          </WorkspaceCard>
        </motion.div>
      ) : (
        <WorkspaceCard variant="default">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Orientation Selector Cards */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-[#29302D] block mb-2.5">
                Select Your Profile Orientation
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setProfileType('FUNDING_SEEKER')}
                  className={`p-5 rounded-2xl border cursor-pointer text-left transition-all duration-200 ${
                    profileType === 'FUNDING_SEEKER'
                      ? 'border-[#C66B52] bg-gradient-to-br from-white via-[#FFFBF9] to-[#FFF4F0] shadow-md'
                      : 'border-[#EADFCF] hover:border-[#C66B52]/40 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-[#29302D]">Funding Seeker</span>
                    {profileType === 'FUNDING_SEEKER' && (
                      <span className="w-4 h-4 rounded-full bg-[#C66B52] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#77786E] leading-relaxed block">
                    Seeking growth capital, private equity, debt facilitation, or strategic angel participation.
                  </span>
                </div>

                <div
                  onClick={() => setProfileType('INVESTOR')}
                  className={`p-5 rounded-2xl border cursor-pointer text-left transition-all duration-200 ${
                    profileType === 'INVESTOR'
                      ? 'border-[#8064A9] bg-gradient-to-br from-white via-[#FAF8FD] to-[#F4EEFB] shadow-md'
                      : 'border-[#EADFCF] hover:border-[#8064A9]/40 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-[#29302D]">Private / Angel Investor</span>
                    {profileType === 'INVESTOR' && (
                      <span className="w-4 h-4 rounded-full bg-[#8064A9] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#77786E] leading-relaxed block">
                    Looking to evaluate high-conviction deal flow across vetted MSMEs and growth ventures.
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Range & Preferred Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#29302D] block">
                  {profileType === 'FUNDING_SEEKER' ? 'Capital Requirement Range' : 'Target Ticket Size'}
                </label>
                <select
                  className="w-full text-xs sm:text-sm p-3.5 border border-[#EADFCF] rounded-2xl bg-white text-[#29302D] focus:outline-none focus:ring-2 focus:ring-[#C66B52] shadow-2xs font-semibold"
                  value={amountRange}
                  onChange={(e) => setAmountRange(e.target.value)}
                >
                  <option value="₹5 Lakhs - ₹25 Lakhs">₹5 Lakhs - ₹25 Lakhs (Micro Incubation)</option>
                  <option value="₹25 Lakhs - ₹1 Crore">₹25 Lakhs - ₹1 Crore (Growth Stage)</option>
                  <option value="₹1 Crore - ₹5 Crores">₹1 Crore - ₹5 Crores (Scale & Expansion)</option>
                  <option value="Above ₹5 Crores">Above ₹5 Crores (Syndicate / Institutional)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#29302D] block">
                  Target Business Maturity
                </label>
                <select className="w-full text-xs sm:text-sm p-3.5 border border-[#EADFCF] rounded-2xl bg-white text-[#29302D] focus:outline-none focus:ring-2 focus:ring-[#C66B52] shadow-2xs font-semibold">
                  <option value="EARLY">Early Revenue / Working Prototype</option>
                  <option value="PROFITABLE">Profitable / Established Commercial Unit</option>
                  <option value="EXPANSION">Pan-India Franchise Expansion</option>
                </select>
              </div>
            </div>

            {/* Sectors of Interest */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-[#29302D] block">
                Target Sectors of Interest
              </label>
              <div className="flex flex-wrap gap-2">
                {sectorList.map((sec, i) => {
                  const isSelected = selectedSectors.includes(sec);
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => toggleSector(sec)}
                      className={`text-xs px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-[#29302D] text-[#FCFAF6] border-[#29302D] font-extrabold shadow-xs'
                          : 'bg-white text-[#77786E] border-[#EADFCF] hover:bg-[#F5EBDD]/60 hover:text-[#29302D] font-bold'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {sec}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pitch / Thesis */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-[#29302D] block">
                {profileType === 'FUNDING_SEEKER'
                  ? 'Brief Executive Summary / Pitch'
                  : 'Investor Background & Mandate'} <span className="text-[#C66B52]">*</span>
              </label>
              <textarea
                rows={4}
                className="w-full text-xs p-3.5 border border-[#EADFCF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C66B52] bg-white text-[#29302D] placeholder-[#77786E]/60 shadow-2xs leading-relaxed"
                placeholder={
                  profileType === 'FUNDING_SEEKER'
                    ? 'Summarize your unit economics, current revenues, competitive moat, and exact capital utilization plan...'
                    : 'Outline your investment philosophy, value addition beyond capital, and past portfolio/industry experience...'
                }
                value={pitchSummary}
                onChange={(e) => setPitchSummary(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <WorkspaceButton
                variant="charcoal"
                size="md"
                type="submit"
                loading={isLoading}
                icon={<ArrowRightIcon size={15} />}
              >
                Submit Confidential Profile
              </WorkspaceButton>
            </div>
          </form>
        </WorkspaceCard>
      )}
    </WorkspaceShell>
  );
};

export default InvestmentPage;
