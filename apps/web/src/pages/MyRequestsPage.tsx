import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest, getStoredUser, getUserRequests } from '../services/api';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceBadge,
  WorkspaceEmptyState
} from '../components/workspace/WorkspaceComponents';
import {
  ShieldCheckIcon,
  LockIcon,
  BriefcaseIcon,
  LightbulbIcon,
  RocketIcon,
  HandshakeIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '../components/Icons';

export const MyRequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'ideas' | 'scaling' | 'partnerships'>('services');
  const user = getStoredUser();
  const userId = user?.id || user?.userId || 'usr_default';

  // Load user-isolated service requests
  const [services, setServices] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [scaling, setScaling] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      // 1. Services
      const userRequests = getUserRequests(userId);
      setServices(
        userRequests.map((r, i) => ({
          id: r.id || `REQ-0${i + 1}`,
          title: r.serviceTitle || r.title,
          status: r.status || 'SUBMITTED',
          statusLabel: r.statusText || r.statusLabel || 'FIC Review',
          notes: r.requirementNotes || r.notes || 'Verified requirement submitted via FIC Business Hub.',
          ficRemark:
            r.ficRemark ||
            'FIC Coordinator assigned. Evaluating verified providers and preparing confidential proposals.',
          date: r.date || 'Today'
        }))
      );

      // 2. Ideas from localStorage or seed
      try {
        const storedIdeas = localStorage.getItem(`fic_user_ideas_${userId}`);
        if (storedIdeas) {
          const parsed = JSON.parse(storedIdeas);
          setIdeas(
            parsed.map((item: any) => ({
              id: item.id,
              title: item.title,
              stage: item.stage,
              status: item.status,
              statusLabel: item.statusLabel,
              date: item.submittedDate || 'Recent',
              notes: item.description,
              ficRemark: item.reviewNotes || 'Under preliminary evaluation by FIC incubation desk.'
            }))
          );
        } else {
          setIdeas([
            {
              id: 'IDEA-2026-881',
              title: 'AI Automated Quality Inspection for Knitted Fabrics',
              stage: 'PROTOTYPE',
              status: 'ADVISORY_SCHEDULED',
              statusLabel: 'Advisory Scheduled',
              date: '28 Oct 2026',
              notes: 'Edge-computing computer vision camera rig mounted over weaving looms.',
              ficRemark: 'FIC Incubation desk prepared patent review and scheduled advisory session.'
            }
          ]);
        }
      } catch {
        setIdeas([]);
      }

      // 3. Scaling from localStorage or seed
      try {
        const storedScaling = localStorage.getItem(`fic_user_scaling_${userId}`);
        if (storedScaling) {
          const parsed = JSON.parse(storedScaling);
          setScaling(
            parsed.map((item: any) => ({
              id: item.id,
              businessName: item.businessName,
              supportType: item.supportTypeLabel || item.supportType,
              status: item.status,
              statusLabel: item.statusLabel,
              date: item.submittedDate || 'Recent',
              notes: item.currentChallenges,
              ficRemark: item.diagnosticNotes || 'Diagnostic assessment under evaluation by domain specialist.'
            }))
          );
        } else {
          setScaling([
            {
              id: 'SCALE-2026-402',
              businessName: user?.fullName ? `${user.fullName} Enterprises` : 'Apex Industrial Unit',
              supportType: 'Technology Modernization & Cloud Systems',
              status: 'ROADMAP_PREPARED',
              statusLabel: 'Roadmap Prepared',
              date: '26 Oct 2026',
              notes: 'Legacy inventory sync causing 12% stock discrepancies across southern regional depots.',
              ficRemark: 'Turnaround roadmap prepared. Specialist allocated for Phase 1 migration.'
            }
          ]);
        }
      } catch {
        setScaling([]);
      }

      // 4. Partnerships from localStorage or seed
      try {
        const storedPartnerships = localStorage.getItem(`fic_user_partnerships_${userId}`);
        if (storedPartnerships) {
          const parsed = JSON.parse(storedPartnerships);
          setPartnerships(
            parsed.map((item: any) => ({
              id: item.id,
              organizationName: item.organizationName,
              type: item.partnershipTypeLabel || item.partnershipType,
              status: item.status,
              statusLabel: item.statusLabel,
              date: item.submittedDate || 'Recent',
              notes: item.proposalSummary,
              ficRemark: item.intermediaryRemarks || 'Screening verified companies for optimal business synergy.'
            }))
          );
        } else {
          setPartnerships([
            {
              id: 'PTNR-2026-612',
              organizationName: user?.fullName ? `${user.fullName} Solutions` : 'Apex Industrial Alliances',
              type: 'State-wide Distributor & Dealer Onboarding',
              status: 'EXPLORATORY_SESSION',
              statusLabel: 'Exploratory Session',
              date: '27 Oct 2026',
              notes: 'Seeking verified FMCG distributors across Coimbatore, Madurai, and Tiruchirappalli.',
              ficRemark: 'Bilateral NDA executed. Exploratory virtual session scheduled with lead distributor.'
            }
          ]);
        }
      } catch {
        setPartnerships([]);
      }
    }
  }, [user?.id, user?.userId, userId]);

  return (
    <WorkspaceShell maxWidth="6xl">
      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent="coral"
        badge={
          <div className="flex items-center gap-2">
            <WorkspaceBadge variant="luxury">
              <SparklesIcon size={12} className="text-[#C66B52]" />
              Intermediary Tracker
            </WorkspaceBadge>
            <span className="text-[11px] font-bold text-[#C66B52] bg-white/80 border border-[#E58C72]/30 px-2.5 py-0.5 rounded-lg">
              FIC Monitored Status
            </span>
          </div>
        }
        title="My Requests & Communications Hub"
        subtitle={`Track all service requirements, incubation concepts, scaling tickets, and partnership discussions for ${
          user?.fullName || 'your account'
        }.`}
      />

      {/* ========================================================
          2. UNIFIED TAB NAVIGATION (OVERFLOW-X AUTO)
         ======================================================== */}
      <WorkspaceCard variant="glass" padded={false} className="p-1.5 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            {
              id: 'services',
              label: 'Marketplace Requests',
              count: services.length,
              icon: <BriefcaseIcon size={14} />
            },
            {
              id: 'ideas',
              label: 'Incubation Ideas',
              count: ideas.length,
              icon: <LightbulbIcon size={14} />
            },
            {
              id: 'scaling',
              label: 'Scaling Support',
              count: scaling.length,
              icon: <RocketIcon size={14} />
            },
            {
              id: 'partnerships',
              label: 'B2B Partnerships',
              count: partnerships.length,
              icon: <HandshakeIcon size={14} />
            }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#29302D] text-[#FCFAF6] shadow-sm'
                    : 'text-[#77786E] hover:text-[#29302D] hover:bg-[#F5EBDD]/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#EADFCF]/70 text-[#29302D]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </WorkspaceCard>

      {/* ========================================================
          3. TAB CONTENT
         ======================================================== */}
      <div className="space-y-5">
        
        {/* Service Requests Tab */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {services.length === 0 ? (
              <WorkspaceEmptyState
                icon={<BriefcaseIcon size={26} />}
                title="No active service requests"
                description="You haven't requested any marketplace services yet. Browse the universal catalog across all 10 business sectors."
                actionText="Browse Marketplace"
                onAction={() => (window.location.href = '/marketplace')}
                accent="coral"
              />
            ) : (
              services.map((req) => (
                <WorkspaceCard key={req.id} variant="default" className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF]/70 pb-3.5 gap-2.5">
                    <div>
                      <span className="text-[10px] text-[#77786E] block font-mono font-bold tracking-wider">
                        REQ ID: {req.id}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-[#29302D] mt-0.5">
                        {req.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-[#77786E] font-semibold">{req.date}</span>
                      <WorkspaceBadge
                        variant={req.status === 'IN_PROGRESS' ? 'proposal' : 'pending'}
                      >
                        {req.statusLabel}
                      </WorkspaceBadge>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF]/60">
                      <strong className="text-[#29302D] font-black block mb-1">
                        Your Stated Requirements:
                      </strong>
                      <p className="text-[#77786E] leading-relaxed">{req.notes}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F4EEFB] border border-[#8064A9]/30 space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-[#8064A9]">
                        <LockIcon size={14} />
                        FIC Coordinator Progress & Notes:
                      </div>
                      <p className="text-xs text-[#29302D]/85 leading-relaxed font-medium">
                        {req.ficRemark}
                      </p>
                    </div>
                  </div>
                </WorkspaceCard>
              ))
            )}
          </div>
        )}

        {/* Business Ideas Tab */}
        {activeTab === 'ideas' && (
          <div className="space-y-4">
            {ideas.length === 0 ? (
              <WorkspaceEmptyState
                icon={<LightbulbIcon size={26} />}
                title="No incubation ideas logged"
                description="You haven't submitted any ideas for FIC incubation review."
                actionText="Submit Business Idea"
                onAction={() => (window.location.href = '/business-ideas')}
                accent="amber"
              />
            ) : (
              ideas.map((idea) => (
                <WorkspaceCard key={idea.id} variant="amber" className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF]/70 pb-3 gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#D99B43] font-mono font-bold">
                          {idea.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          {idea.stage}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-[#29302D]">
                        {idea.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#77786E] font-semibold">{idea.date}</span>
                      <WorkspaceBadge variant="luxury">{idea.statusLabel}</WorkspaceBadge>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed">
                    {idea.notes}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#EADFCF] space-y-1 text-xs">
                    <div className="font-bold text-[#9C6818]">FIC Advisory Progress:</div>
                    <p className="text-[#77786E]">{idea.ficRemark}</p>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Link to="/business-ideas">
                      <WorkspaceButton variant="outline" size="sm" icon={<ArrowRightIcon size={12} />}>
                        Manage in Business Ideas Desk
                      </WorkspaceButton>
                    </Link>
                  </div>
                </WorkspaceCard>
              ))
            )}
          </div>
        )}

        {/* Scaling Support Tab */}
        {activeTab === 'scaling' && (
          <div className="space-y-4">
            {scaling.length === 0 ? (
              <WorkspaceEmptyState
                icon={<RocketIcon size={26} />}
                title="No active scaling tickets"
                description="You haven't requested any enterprise development or scaling consultations."
                actionText="Request Scaling Support"
                onAction={() => (window.location.href = '/scaling')}
                accent="violet"
              />
            ) : (
              scaling.map((scale) => (
                <WorkspaceCard key={scale.id} variant="violet" className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF]/70 pb-3 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[#8064A9] font-mono font-bold">
                        {scale.id}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-[#29302D]">
                        {scale.businessName}
                      </h3>
                      <div className="text-xs text-[#8064A9] font-bold">
                        Focus: {scale.supportType}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#77786E] font-semibold">{scale.date}</span>
                      <WorkspaceBadge variant="proposal">{scale.statusLabel}</WorkspaceBadge>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF]">
                      <strong className="text-[#29302D] block mb-1">Operational Challenge:</strong>
                      <p className="text-[#77786E] leading-relaxed">{scale.notes}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#F7F2FB] border border-[#8064A9]/30 space-y-1 text-xs">
                      <div className="font-bold text-[#8064A9]">Specialist Diagnostic Memo:</div>
                      <p className="text-[#77786E]">{scale.ficRemark}</p>
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Link to="/scaling">
                      <WorkspaceButton variant="outline" size="sm" icon={<ArrowRightIcon size={12} />}>
                        View Scaling Roadmap
                      </WorkspaceButton>
                    </Link>
                  </div>
                </WorkspaceCard>
              ))
            )}
          </div>
        )}

        {/* B2B Partnerships Tab */}
        {activeTab === 'partnerships' && (
          <div className="space-y-4">
            {partnerships.length === 0 ? (
              <WorkspaceEmptyState
                icon={<HandshakeIcon size={26} />}
                title="No partnership proposals"
                description="You haven't initiated any B2B tie-ups or joint venture proposals."
                actionText="Explore B2B Partnerships"
                onAction={() => (window.location.href = '/partnerships')}
                accent="rose"
              />
            ) : (
              partnerships.map((part) => (
                <WorkspaceCard key={part.id} variant="rose" className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADFCF]/70 pb-3 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[#D78E9A] font-mono font-bold">
                        {part.id}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-[#29302D]">
                        {part.organizationName}
                      </h3>
                      <div className="text-xs text-[#C66B52] font-bold">
                        Model: {part.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#77786E] font-semibold">{part.date}</span>
                      <WorkspaceBadge variant="luxury">{part.statusLabel}</WorkspaceBadge>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#77786E] leading-relaxed">
                    {part.notes}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#EADFCF] space-y-1 text-xs">
                    <div className="font-bold text-[#C66B52]">Intermediary Status:</div>
                    <p className="text-[#77786E]">{part.ficRemark}</p>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Link to="/partnerships">
                      <WorkspaceButton variant="outline" size="sm" icon={<ArrowRightIcon size={12} />}>
                        View Alliance Details
                      </WorkspaceButton>
                    </Link>
                  </div>
                </WorkspaceCard>
              ))
            )}
          </div>
        )}

      </div>
    </WorkspaceShell>
  );
};

export default MyRequestsPage;
