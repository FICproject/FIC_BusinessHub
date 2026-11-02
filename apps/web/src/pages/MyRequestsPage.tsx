import React, { useState, useEffect } from 'react';
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
  CheckCircleIcon
} from '../components/Icons';

export const MyRequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'ideas' | 'scaling' | 'partnerships'>('services');
  const user = getStoredUser();

  // Load user-isolated service requests
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const userRequests = getUserRequests(user.id || user.userId);
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
    }
  }, [user?.id, user?.userId]);

  // User-isolated ideas
  const sampleIdeas =
    user?.id === 'usr_kathir_001'
      ? [
          {
            id: 'idea-k01',
            title: 'Cloud Native Microservices Architecture for B2B Supply Chains',
            stage: 'PROTOTYPE',
            status: 'UNDER_REVIEW',
            statusLabel: 'Feasibility Assessment',
            date: '28 Oct 2026'
          }
        ]
      : [
          {
            id: 'idea-m01',
            title: 'AI Automated Quality Inspection for Knitted Fabrics',
            stage: 'PROTOTYPE',
            status: 'UNDER_REVIEW',
            statusLabel: 'Feasibility Assessment',
            date: '28 Oct 2026'
          }
        ];

  // User-isolated scaling requests
  const sampleScaling =
    user?.id === 'usr_kathir_001'
      ? [
          {
            id: 'scale-k01',
            businessName: 'Kathir Tech Innovations',
            supportType: 'Technology Development & Cloud Scaling',
            status: 'SPECIALIST_ASSIGNED',
            statusLabel: 'Specialist Assigned',
            date: '26 Oct 2026'
          }
        ]
      : [
          {
            id: 'scale-m01',
            businessName: 'Apex Textiles Unit',
            supportType: 'Industrial Restructuring & ERP Integration',
            status: 'SPECIALIST_ASSIGNED',
            statusLabel: 'Specialist Assigned',
            date: '26 Oct 2026'
          }
        ];

  const samplePartnerships =
    user?.id === 'usr_kathir_001'
      ? [
          {
            id: 'part-k01',
            organizationName: 'HyperScale Cloud Network',
            type: 'API & Software Integration Alliance',
            status: 'MATCHING_IN_PROGRESS',
            statusLabel: 'Matching in Progress',
            date: '24 Oct 2026'
          }
        ]
      : [
          {
            id: 'part-m01',
            organizationName: 'South Star Agro Traders',
            type: 'Distribution Network Expansion',
            status: 'MATCHING_IN_PROGRESS',
            statusLabel: 'Matching in Progress',
            date: '24 Oct 2026'
          }
        ];

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
        rightActions={
          <div className="p-3.5 bg-white/90 border border-[#E58C72]/30 rounded-2xl shadow-xs text-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center shrink-0">
              <ShieldCheckIcon size={18} />
            </div>
            <div>
              <span className="font-black text-[#29302D] block">Confidential Routing</span>
              <span className="text-[11px] text-[#77786E]">Assigned FIC Officers Only</span>
            </div>
          </div>
        }
      />

      {/* ========================================================
          2. LUXURY PILL TABS
         ======================================================== */}
      <WorkspaceCard variant="glass" padded={false} className="p-2 sm:p-2.5">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
          {[
            {
              id: 'services',
              label: 'Service Requests',
              count: services.length,
              icon: <BriefcaseIcon size={14} />
            },
            {
              id: 'ideas',
              label: 'Business Ideas',
              count: sampleIdeas.length,
              icon: <LightbulbIcon size={14} />
            },
            {
              id: 'scaling',
              label: 'Scaling Support',
              count: sampleScaling.length,
              icon: <RocketIcon size={14} />
            },
            {
              id: 'partnerships',
              label: 'B2B Partnerships',
              count: samplePartnerships.length,
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
            {sampleIdeas.map((idea) => (
              <WorkspaceCard key={idea.id} variant="amber">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#D99B43] font-mono font-bold">
                      IDEA ID: {idea.id}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#29302D]">
                      {idea.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#77786E]">
                      <span className="font-bold text-[#D99B43]">Stage: {idea.stage}</span>
                      <span>•</span>
                      <span>Submitted: {idea.date}</span>
                    </div>
                  </div>
                  <WorkspaceBadge variant="pending">{idea.statusLabel}</WorkspaceBadge>
                </div>
              </WorkspaceCard>
            ))}
          </div>
        )}

        {/* Scaling Support Tab */}
        {activeTab === 'scaling' && (
          <div className="space-y-4">
            {sampleScaling.map((scale) => (
              <WorkspaceCard key={scale.id} variant="violet">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8064A9] font-mono font-bold">
                      SCALE ID: {scale.id}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#29302D]">
                      {scale.businessName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#77786E]">
                      <span className="font-bold text-[#8064A9]">Focus: {scale.supportType}</span>
                      <span>•</span>
                      <span>Date: {scale.date}</span>
                    </div>
                  </div>
                  <WorkspaceBadge variant="proposal">{scale.statusLabel}</WorkspaceBadge>
                </div>
              </WorkspaceCard>
            ))}
          </div>
        )}

        {/* B2B Partnerships Tab */}
        {activeTab === 'partnerships' && (
          <div className="space-y-4">
            {samplePartnerships.map((part) => (
              <WorkspaceCard key={part.id} variant="rose">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#D78E9A] font-mono font-bold">
                      PART ID: {part.id}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#29302D]">
                      {part.organizationName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#77786E]">
                      <span className="font-bold text-[#D78E9A]">Type: {part.type}</span>
                      <span>•</span>
                      <span>Date: {part.date}</span>
                    </div>
                  </div>
                  <WorkspaceBadge variant="urgent">{part.statusLabel}</WorkspaceBadge>
                </div>
              </WorkspaceCard>
            ))}
          </div>
        )}

      </div>
    </WorkspaceShell>
  );
};

export default MyRequestsPage;
