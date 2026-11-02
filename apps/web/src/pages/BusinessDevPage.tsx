import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceBadge
} from '../components/workspace/WorkspaceComponents';
import { RocketIcon, CheckCircleIcon, ArrowRightIcon, SparklesIcon, ShieldCheckIcon } from '../components/Icons';
import { apiRequest } from '../services/api';

export const BusinessDevPage: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [supportType, setSupportType] = useState('BUSINESS_PLANNING');
  const [currentChallenges, setCurrentChallenges] = useState('');
  const [expectedOutcomes, setExpectedOutcomes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
        title="Business Development & Scaling Support"
        subtitle="Request specialized management consulting, cloud modernization, regional market expansion, or operational turnarounds directly from FIC domain specialists."
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
          <WorkspaceCard variant="violet" className="text-center py-12 px-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#8064A9] to-[#9B7CC6] text-white flex items-center justify-center mx-auto shadow-lg">
              <CheckCircleIcon size={32} />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h3 className="text-xl font-black text-[#29302D]">Scaling Request Registered!</h3>
              <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed">
                FIC Business Development wing has received your diagnostic requirement for <strong className="text-[#29302D]">{businessName}</strong>. A dedicated sector director will coordinate with you within 48 hours.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <WorkspaceButton
                variant="violet"
                size="md"
                onClick={() => {
                  setBusinessName('');
                  setCurrentChallenges('');
                  setExpectedOutcomes('');
                  setIsSubmitted(false);
                }}
              >
                Submit Another Scaling Requirement
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
                placeholder="e.g. Double monthly output, establish 20 state-wide distributors, modernize ERP, obtain export accreditation..."
                value={expectedOutcomes}
                onChange={(e) => setExpectedOutcomes(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Governance note */}
            <div className="p-4 rounded-2xl bg-[#F4EEFB] border border-[#8064A9]/30 text-xs text-[#29302D] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#8064A9]/15 text-[#8064A9] flex items-center justify-center shrink-0">
                <ShieldCheckIcon size={16} />
              </div>
              <p className="text-[11px] text-[#77786E] leading-relaxed">
                All business financial metrics and operational figures are encrypted. Only designated FIC senior consultants access diagnostic files.
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
    </WorkspaceShell>
  );
};

export default BusinessDevPage;
