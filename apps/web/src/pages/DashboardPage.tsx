import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  getStoredUser,
  apiRequest,
  getUserRequests,
  getEcosystemCounts,
  getMyTeachingServices,
  getMyLearningVideos,
  getStudentMentorshipRequests,
  getMentorMentorshipRequests,
  AuthenticatedUser
} from '../services/api';
import { getSubcategoryDashboardConfig, EcosystemTelemetryStats } from '../services/dashboardConfig';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceKpi,
  WorkspaceButton,
  WorkspaceBadge
} from '../components/workspace/WorkspaceComponents';
import {
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
  ScrollReveal,
  AnimatedCard
} from '../motion';
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
  const [user, setUser] = useState<AuthenticatedUser | null>(() => getStoredUser());
  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [ecosystemStats, setEcosystemStats] = useState<EcosystemTelemetryStats | undefined>(undefined);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      navigate('/login');
      return;
    }
    setUser(stored);

    // Load active requests & live ecosystem counts strictly for the authenticated user
    const loadData = async () => {
      try {
        const [connRes, counts] = await Promise.all([
          apiRequest('/connections/me'),
          getEcosystemCounts()
        ]);

        if (connRes?.data && Array.isArray(connRes.data)) {
          setActiveRequests(connRes.data);
        } else {
          const userSpecific = getUserRequests(stored.id || stored.userId);
          setActiveRequests(userSpecific);
        }

        let myServicesCount = 0;
        let myVideosCount = 0;
        let studentRequestsCount = 0;

        const subLower = (stored.subCategory || '').toLowerCase();
        if (subLower.includes('mentor') || subLower.includes('trainer')) {
          const [tServices, lVideos] = await Promise.all([
            getMyTeachingServices(),
            getMyLearningVideos()
          ]);
          myServicesCount = tServices.length;
          myVideosCount = lVideos.length;
        } else if (subLower.includes('student')) {
          const sReqs = await getStudentMentorshipRequests();
          studentRequestsCount = sReqs.length;
        }

        setEcosystemStats({
          registeredStudents: counts.registeredStudents,
          availableMentors: counts.availableMentors,
          learningVideosCount: counts.learningVideosCount,
          completedSessions: counts.completedSessions,
          myServicesCount,
          myVideosCount,
          studentRequestsCount
        });
      } catch (_e) {}
    };

    loadData();
  }, [navigate]);

  if (!user) {
    return (
      <WorkspaceShell>
        <div className="py-24 text-center">
          <p className="text-base font-bold text-[#51463F]">Loading Member Workspace...</p>
          <p className="text-xs text-[#82776E] mt-1">Retrieving verified dashboard telemetry</p>
        </div>
      </WorkspaceShell>
    );
  }

  // Generate dynamic, subcategory-tailored workspace configuration
  const dashboardConfig = getSubcategoryDashboardConfig(user, activeRequests.length, ecosystemStats);

  const renderDashboardIcon = (name: string, size = 18) => {
    switch (name) {
      case 'briefcase':
        return <BriefcaseIcon size={size} />;
      case 'lightbulb':
        return <LightbulbIcon size={size} />;
      case 'rocket':
      case 'graduation':
        return <RocketIcon size={size} />;
      case 'trending':
        return <TrendingUpIcon size={size} />;
      case 'shield':
        return <ShieldCheckIcon size={size} />;
      case 'calendar':
        return <CalendarIcon size={size} />;
      case 'handshake':
      case 'users':
        return <HandshakeIcon size={size} />;
      default:
        return <BriefcaseIcon size={size} />;
    }
  };

  return (
    <WorkspaceShell>
      {/* ========================================================
          1. WELCOME & STATUS HERO
         ======================================================== */}
      <WorkspaceHero
        accent="coral"
        title={`Welcome back, ${user.fullName || 'Member'}!`}
        subtitle={dashboardConfig.heroSubtitle}
      />

      {/* ========================================================
          2. DYNAMIC SUBCATEGORY-TAILORED KPI STAT CARDS
         ======================================================== */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5 lg:gap-4">
        {dashboardConfig.kpiCards.map((kpi, idx) => {
          const isNumeric = typeof kpi.value === 'number';
          return (
            <StaggerItem key={idx}>
              <WorkspaceKpi
                title={kpi.title}
                value={isNumeric ? <AnimatedCounter value={kpi.value as number} /> : kpi.value}
                subtitle={kpi.subtitle}
                icon={renderDashboardIcon(kpi.iconName, 17)}
                accent={kpi.accent}
                trend={kpi.trend}
                onClick={() => navigate(kpi.path)}
              />
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* ========================================================
          3. TAILORED OPPORTUNITY ACTIONS & SERVICES (7 MODULES)
         ======================================================== */}
      <WorkspaceCard variant="glass" padded={false} className="overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-[#EDE2D7] bg-white/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full bg-[#E8795B]"
            />
            <h2 className="text-xs sm:text-sm font-black text-[#51463F]">
              Opportunity Actions & Services ({dashboardConfig.roleBadge})
            </h2>
          </div>
          <span className="text-[11px] font-bold text-[#5A4F47] hidden sm:inline">
            Moderated by FIC Intermediary Governance
          </span>
        </div>

        <div className="p-3.5 sm:p-4">
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            {dashboardConfig.quickActions.map((action) => (
              <StaggerItem key={action.path + action.title}>
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                  className="h-full"
                >
                  <Link
                    to={action.path}
                    className={`p-3 rounded-xl border border-[#EDE2D7] ${action.borderHover} ${action.bgHover} bg-white/90 transition-colors text-center space-y-1.5 cursor-pointer h-full flex flex-col justify-center items-center group shadow-2xs`}
                  >
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${action.gradient} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                    >
                      {renderDashboardIcon(action.iconName, 17)}
                    </div>
                    <strong className="text-[11.5px] sm:text-xs text-[#51463F] block font-black group-hover:text-[#E8795B] transition-colors leading-tight">
                      {action.title}
                    </strong>
                    <span className="text-[10px] text-[#5A4F47] font-medium leading-tight line-clamp-1">
                      {action.subtitle}
                    </span>
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </WorkspaceCard>

      {/* ========================================================
          ROLE-SPECIFIC HIGHLIGHT TRACK
         ======================================================== */}
      {dashboardConfig.specializedTrack && (
        <ScrollReveal direction="up">
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#FFF9F0] via-white to-[#F5EBDD] border border-[#E5A23B]/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#8064B1] text-white text-[9.5px] font-black tracking-wider uppercase">
                  {dashboardConfig.specializedTrack.badge}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-[#51463F]">
                  {dashboardConfig.specializedTrack.title}
                </h3>
              </div>
              <p className="text-xs text-[#5A4F47] leading-relaxed font-medium">
                {dashboardConfig.specializedTrack.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                {dashboardConfig.specializedTrack.metrics.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-[11.5px]">
                    <span className="text-[#E8795B] font-black">{m.value}</span>
                    <span className="text-[#5A4F47] font-semibold">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <Link
                to={dashboardConfig.specializedTrack.buttonPath}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8064B1] to-[#6E529F] hover:from-[#6E529F] hover:to-[#5E448D] text-white text-xs font-bold transition-all shadow-[0_2px_6px_rgba(128,100,177,0.2)]"
              >
                <span>{dashboardConfig.specializedTrack.buttonLabel}</span>
                <ArrowRightIcon size={13} />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* ========================================================
          4. ACTIVE REQUESTS TRACKER & FIC BULLETIN
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        
        {/* Left Column: Active Service Requests */}
        <div className="lg:col-span-8">
          <ScrollReveal direction="up" delay={0.1}>
            <WorkspaceCard variant="default" padded={false} className="h-full flex flex-col">
              <div className="px-4 sm:px-5 py-3 border-b border-[#EDE2D7] bg-[#FAF7F2]/60 flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#51463F]">
                    Active Service Requests & Coordination
                  </h3>
                  <span className="text-[11px] text-[#5A4F47] font-medium">
                    Live status of your requirements under FIC intermediary review
                  </span>
                </div>
                <Link to="/my-requests">
                  <WorkspaceButton variant="outline" size="sm">
                    View All &rarr;
                  </WorkspaceButton>
                </Link>
              </div>

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                {activeRequests.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#5A4F47] space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] border border-[#E8795B]/30 text-[#E8795B] flex items-center justify-center mx-auto">
                      <BriefcaseIcon size={20} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-[#51463F]">No active requests yet</p>
                      <p className="max-w-xs mx-auto text-[11.5px] font-medium">Browse the Universal Marketplace to submit requirements across any business sector.</p>
                    </div>
                    <Link to="/marketplace" className="inline-block pt-1">
                      <WorkspaceButton variant="primary" size="sm">
                        Browse Marketplace &rarr;
                      </WorkspaceButton>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-[#EDE2D7]/60">
                    {activeRequests.map((req, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.15 }}
                        className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-xs sm:text-[13px] font-black text-[#51463F] group-hover:text-[#E8795B] transition-colors">
                            {req.serviceTitle || req.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-[#5A4F47] font-medium">
                            <span>Requested: {req.date || 'Active'}</span>
                            <span>•</span>
                            <span className="text-[#8064B1] font-bold">FIC Officer Assigned</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <WorkspaceBadge
                            variant={req.status === 'IN_PROGRESS' ? 'proposal' : 'pending'}
                            size="sm"
                          >
                            {req.statusText || req.status || 'Under Review'}
                          </WorkspaceBadge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Privacy Safeguard Footer */}
                <div className="pt-3 mt-4 border-t border-[#EDE2D7] text-[11px] text-[#5A4F47] font-medium flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#E8795B]/10 text-[#E8795B] flex items-center justify-center shrink-0">
                    <LockIcon size={12} />
                  </div>
                  <span>
                    Provider communication is strictly coordinated by FIC Officers to maintain confidentiality and guarantee compliance.
                  </span>
                </div>
              </div>
            </WorkspaceCard>
          </ScrollReveal>
        </div>

        {/* Right Column: Opportunity Bulletin */}
        <div className="lg:col-span-4">
          <ScrollReveal direction="up" delay={0.2}>
            <WorkspaceCard variant="amber" padded={false} className="h-full flex flex-col">
              <div className="px-4 sm:px-5 py-3 border-b border-[#E5A23B]/30 bg-[#F8EBD0]/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SparklesIcon size={16} className="text-[#E5A23B]" />
                  <h3 className="text-xs sm:text-sm font-black text-[#51463F]">
                    FIC Opportunity Bulletin
                  </h3>
                </div>
                <WorkspaceBadge variant="luxury" size="sm">
                  Verified
                </WorkspaceBadge>
              </div>

              <div className="p-3.5 sm:p-4 space-y-2.5 flex-1">
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="p-3 rounded-xl bg-white/95 border border-[#E5A23B]/30 shadow-2xs space-y-1 hover:border-[#E5A23B] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-[11.5px] text-[#51463F] font-black">
                      Universal Discovery Enabled
                    </strong>
                    <span className="text-[9.5px] font-bold text-[#E5A23B] bg-[#E5A23B]/15 px-1.5 py-0.5 rounded-md">
                      All Sectors
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A4F47] font-medium leading-relaxed">
                    As an approved member, you can browse listings across all 10 business sectors regardless of your primary category.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="p-3 rounded-xl bg-white/95 border border-[#8064B1]/30 shadow-2xs space-y-1 hover:border-[#8064B1] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-[11.5px] text-[#51463F] font-black">
                      Tiruppur Textile OEM Tie-Up
                    </strong>
                    <span className="text-[9.5px] font-bold text-[#8064B1] bg-[#8064B1]/15 px-1.5 py-0.5 rounded-md">
                      Manufacturing
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A4F47] font-medium leading-relaxed">
                    Export-grade uniform stitching capacity open for franchise chains and school suppliers through FIC.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="p-3 rounded-xl bg-white/95 border border-[#E8795B]/30 shadow-2xs space-y-1 hover:border-[#E8795B] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-[11.5px] text-[#51463F] font-black">
                      Strict Regulatory Standards
                    </strong>
                    <span className="text-[9.5px] font-bold text-[#E8795B] bg-[#E8795B]/15 px-1.5 py-0.5 rounded-md">
                      Compliance
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A4F47] font-medium leading-relaxed">
                    FIC does not hold custody of investment funds. Financial expressions are strictly confidential introduction requests.
                  </p>
                </motion.div>
              </div>
            </WorkspaceCard>
          </ScrollReveal>
        </div>

      </div>
    </WorkspaceShell>
  );
};

export default DashboardPage;
