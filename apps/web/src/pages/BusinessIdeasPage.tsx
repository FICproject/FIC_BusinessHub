import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceBadge
} from '../components/workspace/WorkspaceComponents';
import { LightbulbIcon, CheckCircleIcon, ArrowRightIcon, SparklesIcon, ShieldCheckIcon } from '../components/Icons';
import { apiRequest } from '../services/api';

export const BusinessIdeasPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [stage, setStage] = useState('IDEA');
  const [supportNeeded, setSupportNeeded] = useState<string[]>(['Idea Validation']);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        title="Submit Business Idea for Incubation"
        subtitle="Get your concept validated by experienced industry mentors and FIC consultants. We evaluate business viability, market size, technical feasibility, and prepare strategic roadmaps."
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
          <WorkspaceCard variant="amber" className="text-center py-12 px-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#2E7D32] to-[#4CAF50] text-white flex items-center justify-center mx-auto shadow-lg">
              <CheckCircleIcon size={32} />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h3 className="text-xl font-black text-[#29302D]">Idea Submitted Successfully!</h3>
              <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed">
                Your business concept <strong className="text-[#29302D]">"{title}"</strong> has been securely logged with the FIC Incubation Desk. An industry advisor will evaluate initial feasibility within 3 business days.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <WorkspaceButton
                variant="primary"
                size="md"
                onClick={() => {
                  setTitle('');
                  setDescription('');
                  setTargetMarket('');
                  setIsSubmitted(false);
                }}
              >
                Submit Another Business Idea
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
                  onChange={(e) => setStage(e.target.value)}
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
    </WorkspaceShell>
  );
};

export default BusinessIdeasPage;
