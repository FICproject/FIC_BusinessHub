import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getStoredUser, apiRequest, getUserRequests, AuthenticatedUser } from '../services/api';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceKpi,
  WorkspaceButton,
  WorkspaceBadge
} from '../components/workspace/WorkspaceComponents';
import {
  BriefcaseIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  LightbulbIcon,
  RocketIcon,
  TrendingUpIcon,
  HandshakeIcon,
  ArrowRightIcon,
  LockIcon,
  CalendarIcon,
  SparklesIcon
} from '../components/Icons';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [activeRequests, setActiveRequests] = useState<any[]>([]);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      navigate('/login');
      return;
    }
    setUser(stored);

    // Load active requests strictly for the authenticated user
    const loadData = async () => {
      const res = await apiRequest('/connections/me');
      if (res?.data && Array.isArray(res.data)) {
        setActiveRequests(res.data);
      } else {
        const userSpecific = getUserRequests(stored.id || stored.userId);
        setActiveRequests(userSpecific);
      }
    };

    loadData();
  }, [navigate]);

  if (!user) return null;

  const quickActions = [
    {
      title: 'Browse Marketplace',
      subtitle: 'Universal verified services',
      icon: <BriefcaseIcon size={20} />,
      path: '/marketplace',
      gradient: 'from-[#C66B52] to-[#E58C72]',
      borderHover: 'hover:border-[#E58C72]',
      bgHover: 'hover:bg-[#FFF4F0]/60'
    },
    {
      title: 'My Services',
      subtitle: 'Add & manage capabilities',
      icon: <ShieldCheckIcon size={20} />,
      path: '/my-services',
      gradient: 'from-[#8064A9] to-[#9B7CC6]',
      borderHover: 'hover:border-[#8064A9]',
      bgHover: 'hover:bg-[#F3EEFA]/60'
    },
    {
      title: 'Submit Business Idea',
      subtitle: 'Incubation & validation',
      icon: <LightbulbIcon size={20} />,
      path: '/business-ideas',
      gradient: 'from-[#D99B43] to-[#F5B453]',
      borderHover: 'hover:border-[#D99B43]',
      bgHover: 'hover:bg-[#FDF6E9]/60'
    },
    {
      title: 'Business Scaling',
      subtitle: 'Technology & expansion',
      icon: <RocketIcon size={20} />,
      path: '/business-development',
      gradient: 'from-[#8064A9] to-[#D78E9A]',
      borderHover: 'hover:border-[#8064A9]',
      bgHover: 'hover:bg-[#F9F5FD]/60'
    },
    {
      title: 'Investment & Funding',
      subtitle: 'Private syndicates',
      icon: <TrendingUpIcon size={20} />,
      path: '/investment',
      gradient: 'from-[#D99B43] to-[#C66B52]',
      borderHover: 'hover:border-[#D99B43]',
      bgHover: 'hover:bg-[#FCFAF5]/60'
    },
    {
      title: 'B2B Partnerships',
      subtitle: 'Tie-ups & distributors',
      icon: <HandshakeIcon size={20} />,
      path: '/partnerships',
      gradient: 'from-[#C66B52] to-[#D78E9A]',
      borderHover: 'hover:border-[#C66B52]',
      bgHover: 'hover:bg-[#FFF6F7]/60'
    },
    {
      title: 'Meetings',
      subtitle: 'Facilitated consultations',
      icon: <CalendarIcon size={20} />,
      path: '/meetings',
      gradient: 'from-[#29302D] to-[#8064A9]',
      borderHover: 'hover:border-[#29302D]',
      bgHover: 'hover:bg-[#F5EBDD]/60'
    }
  ];

  return (
    <WorkspaceShell maxWidth="7xl">
      {/* ========================================================
          1. WELCOME & STATUS HERO
         ======================================================== */}
      <WorkspaceHero
        accent="coral"
        badge={
          <div className="flex flex-wrap items-center gap-2">
            {user.subcategories && user.subcategories.length > 0 ? (
              user.subcategories.map((sub, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-black uppercase tracking-wider text-[#C66B52] bg-white/80 border border-[#E58C72]/40 px-2.5 py-0.5 rounded-lg shadow-2xs"
                >
                  {sub}
                </span>
              ))
            ) : user.subCategory ? (
              <span className="text-[11px] font-black uppercase tracking-wider text-[#C66B52] bg-white/80 border border-[#E58C72]/40 px-2.5 py-0.5 rounded-lg shadow-2xs">
                {user.subCategory}
              </span>
            ) : (
              <span className="text-[11px] font-black uppercase tracking-wider text-[#C66B52] bg-white/80 border border-[#E58C72]/40 px-2.5 py-0.5 rounded-lg shadow-2xs">
                VERIFIED MEMBER
              </span>
            )}
            <WorkspaceBadge variant={user.accountStatus === 'ACTIVE' ? 'active' : 'pending'}>
              {user.accountStatus || 'Active'} Account
            </WorkspaceBadge>
          </div>
        }
        title={`Welcome back, ${user.fullName || 'Member'}!`}
        subtitle="Your FIC Business Hub ecosystem workspace is fully active and verified. Access universal capabilities, confidential opportunities, and track ongoing coordination."
        rightActions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Membership Validity Pill */}
            <div className="px-4 py-2.5 rounded-2xl bg-white/90 border border-[#D99B43]/40 shadow-xs text-xs space-y-0.5">
              <span className="text-[#9C6818] font-black block">
                {user.membershipPlan || '1st Year Membership'}
              </span>
              <span className="text-[#B87A28] text-[11px] font-bold">
                {user.membershipExpiryDate || 'Valid for 365 Days (₹99)'}
              </span>
            </div>

            {/* KYC Status Pill */}
            <div className="px-4 py-2.5 rounded-2xl bg-white/90 border border-[#2E7D32]/30 shadow-xs text-xs flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#2E7D32]/15 flex items-center justify-center text-[#2E7D32] shrink-0">
                <ShieldCheckIcon size={16} />
              </div>
              <div>
                <span className="text-[#1B5E20] font-black block">
                  {user.isKycApproved ? 'KYC Verified' : 'KYC Under Review'}
                </span>
                <span className="text-[#2E7D32] text-[11px] font-semibold">
                  {user.isKycApproved ? 'Sector Approved' : 'Submitted for Approval'}
                </span>
              </div>
            </div>
          </div>
        }
      />

      {/* ========================================================
          2. 4 EXECUTIVE KPI STAT CARDS
         ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <WorkspaceKpi
          title="Active Requests"
          value={activeRequests.length}
          subtitle="In FIC Coordination"
          icon={<BriefcaseIcon size={18} />}
          accent="coral"
          trend="Live Tracker"
          onClick={() => navigate('/my-requests')}
        />
        <WorkspaceKpi
          title="Submitted Ideas"
          value="1"
          subtitle="Review Scheduled"
          icon={<LightbulbIcon size={18} />}
          accent="amber"
          trend="Incubation"
          onClick={() => navigate('/business-ideas')}
        />
        <WorkspaceKpi
          title="Scaling Support"
          value="Available"
          subtitle="Specialists Ready"
          icon={<RocketIcon size={18} />}
          accent="violet"
          trend="Advisory"
          onClick={() => navigate('/business-development')}
        />
        <WorkspaceKpi
          title="Confidential Channel"
          value="Active"
          subtitle="Private Deal Flow"
          icon={<TrendingUpIcon size={18} />}
          accent="emerald"
          trend="Private Access"
          onClick={() => navigate('/investment')}
        />
      </div>

      {/* ========================================================
          3. OPPORTUNITY ACTIONS & SERVICES (7 MODULES)
         ======================================================== */}
      <WorkspaceCard variant="glass" padded={false} className="overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EADFCF] bg-white/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C66B52]" />
            <h2 className="text-base font-black text-[#29302D]">
              Opportunity Actions & Services
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#77786E] hidden sm:inline">
            Moderated by FIC Intermediary Governance
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
            {quickActions.map((action, idx) => (
              <motion.div
                key={action.path}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to={action.path}
                  className={`p-4 rounded-2xl border border-[#EADFCF] ${action.borderHover} ${action.bgHover} bg-white/90 transition-all text-center space-y-2.5 cursor-pointer h-full flex flex-col justify-center items-center group shadow-2xs`}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${action.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                  >
                    {action.icon}
                  </div>
                  <strong className="text-xs text-[#29302D] block font-extrabold group-hover:text-[#C66B52] transition-colors">
                    {action.title}
                  </strong>
                  <span className="text-[11px] text-[#77786E] leading-tight">
                    {action.subtitle}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </WorkspaceCard>

      {/* ========================================================
          4. ACTIVE REQUESTS TRACKER & FIC BULLETIN
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column: Active Service Requests */}
        <div className="lg:col-span-8">
          <WorkspaceCard variant="default" padded={false} className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-[#EADFCF] bg-[#FAF7F2]/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#29302D]">
                  Active Service Requests & Coordination
                </h3>
                <span className="text-xs text-[#77786E]">
                  Live status of your requirements under FIC intermediary review
                </span>
              </div>
              <Link to="/my-requests">
                <WorkspaceButton variant="outline" size="sm">
                  View All &rarr;
                </WorkspaceButton>
              </Link>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              {activeRequests.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#77786E] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF4F0] border border-[#E58C72]/30 text-[#C66B52] flex items-center justify-center mx-auto">
                    <BriefcaseIcon size={22} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-[#29302D]">No active requests yet</p>
                    <p className="max-w-xs mx-auto">Browse the Universal Marketplace to submit requirements across any business sector.</p>
                  </div>
                  <Link to="/marketplace" className="inline-block pt-1">
                    <WorkspaceButton variant="primary" size="sm">
                      Browse Marketplace &rarr;
                    </WorkspaceButton>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#EADFCF]/60">
                  {activeRequests.map((req, idx) => (
                    <div
                      key={idx}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-[#29302D] group-hover:text-[#C66B52] transition-colors">
                          {req.serviceTitle || req.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-[#77786E]">
                          <span>Requested: {req.date || 'Active'}</span>
                          <span>•</span>
                          <span className="text-[#8064A9] font-semibold">FIC Officer Assigned</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <WorkspaceBadge
                          variant={req.status === 'IN_PROGRESS' ? 'proposal' : 'pending'}
                        >
                          {req.statusText || req.status || 'Under Review'}
                        </WorkspaceBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Privacy Safeguard Footer */}
              <div className="pt-4 mt-6 border-t border-[#EADFCF] text-xs text-[#77786E] flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#C66B52]/10 text-[#C66B52] flex items-center justify-center shrink-0">
                  <LockIcon size={13} />
                </div>
                <span>
                  Provider communication is strictly coordinated by FIC Officers to maintain confidentiality and guarantee compliance.
                </span>
              </div>
            </div>
          </WorkspaceCard>
        </div>

        {/* Right Column: Opportunity Bulletin */}
        <div className="lg:col-span-4">
          <WorkspaceCard variant="amber" padded={false} className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-[#D99B43]/30 bg-[#FDF6E9]/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon size={18} className="text-[#D99B43]" />
                <h3 className="text-sm font-black text-[#29302D]">
                  FIC Opportunity Bulletin
                </h3>
              </div>
              <WorkspaceBadge variant="luxury" size="sm">
                Verified
              </WorkspaceBadge>
            </div>

            <div className="p-6 space-y-3.5 flex-1">
              <div className="p-4 rounded-2xl bg-white/95 border border-[#D99B43]/30 shadow-2xs space-y-1.5 hover:border-[#D99B43] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs text-[#29302D] font-black">
                    Universal Discovery Enabled
                  </strong>
                  <span className="text-[10px] font-bold text-[#D99B43] bg-[#D99B43]/15 px-2 py-0.5 rounded-md">
                    All Sectors
                  </span>
                </div>
                <p className="text-xs text-[#77786E] leading-relaxed">
                  As an approved member, you can browse listings across all 10 business sectors regardless of your primary category.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/95 border border-[#8064A9]/30 shadow-2xs space-y-1.5 hover:border-[#8064A9] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs text-[#29302D] font-black">
                    Tiruppur Textile OEM Tie-Up
                  </strong>
                  <span className="text-[10px] font-bold text-[#8064A9] bg-[#8064A9]/15 px-2 py-0.5 rounded-md">
                    Manufacturing
                  </span>
                </div>
                <p className="text-xs text-[#77786E] leading-relaxed">
                  Export-grade uniform stitching capacity open for franchise chains and school suppliers through FIC.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/95 border border-[#C66B52]/30 shadow-2xs space-y-1.5 hover:border-[#C66B52] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs text-[#29302D] font-black">
                    Strict Regulatory Standards
                  </strong>
                  <span className="text-[10px] font-bold text-[#C66B52] bg-[#C66B52]/15 px-2 py-0.5 rounded-md">
                    Compliance
                  </span>
                </div>
                <p className="text-xs text-[#77786E] leading-relaxed">
                  FIC does not hold custody of investment funds. Financial expressions are strictly confidential introduction requests.
                </p>
              </div>
            </div>
          </WorkspaceCard>
        </div>

      </div>
    </WorkspaceShell>
  );
};

export default DashboardPage;
