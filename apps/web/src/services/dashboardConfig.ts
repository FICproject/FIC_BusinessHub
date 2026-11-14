import React from 'react';
import { AuthenticatedUser } from './api';

export interface DashboardKpiItem {
  title: string;
  value: string | number;
  subtitle: string;
  accent: 'coral' | 'amber' | 'violet' | 'emerald';
  trend: string;
  path: string;
  iconName: 'briefcase' | 'lightbulb' | 'rocket' | 'trending' | 'shield' | 'calendar' | 'handshake' | 'users' | 'graduation';
}

export interface DashboardQuickAction {
  title: string;
  subtitle: string;
  path: string;
  gradient: string;
  borderHover: string;
  bgHover: string;
  iconName: 'briefcase' | 'lightbulb' | 'rocket' | 'trending' | 'shield' | 'calendar' | 'handshake' | 'users' | 'graduation';
}

export interface SpecializedTrack {
  badge: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonPath: string;
  metrics: { label: string; value: string }[];
}

export interface DynamicDashboardConfig {
  roleBadge: string;
  roleTitle: string;
  heroSubtitle: string;
  kpiCards: DashboardKpiItem[];
  quickActions: DashboardQuickAction[];
  specializedTrack: SpecializedTrack;
}

export interface HeaderNavLink {
  label: string;
  path: string;
}

export interface RoleNavigation {
  roleBadge: string;
  roleTitle: string;
  headerLinks: HeaderNavLink[];
  opportunityActions: DashboardQuickAction[];
}

export interface EcosystemTelemetryStats {
  registeredStudents?: number;
  availableMentors?: number;
  learningVideosCount?: number;
  completedSessions?: number;
  myServicesCount?: number;
  myVideosCount?: number;
  studentRequestsCount?: number;
}

// ========================================================
// 1. CENTRALIZED ROLE NAVIGATION (SINGLE SOURCE OF TRUTH)
// ========================================================
export const getRoleNavigation = (user: AuthenticatedUser | null): RoleNavigation => {
  if (!user) {
    return {
      roleBadge: 'MEMBER',
      roleTitle: 'FIC Business Hub Member Workspace',
      headerLinks: [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Marketplace', path: '/marketplace' },
        { label: 'Business Ideas', path: '/business-ideas' },
        { label: 'Scaling', path: '/business-development' },
        { label: 'Investment', path: '/investment' },
        { label: 'Meetings', path: '/meetings' },
        { label: 'My Requests', path: '/my-requests' },
        { label: 'My Services', path: '/my-services' }
      ],
      opportunityActions: []
    };
  }

  const subcategory =
    user.subCategory ||
    (user.subcategories && user.subcategories.length > 0 ? user.subcategories[0] : '') ||
    user.primaryCategory ||
    user.categoryName ||
    'Member';

  const subLower = subcategory.toLowerCase();

  // 1. STUDENT
  if (subLower.includes('student')) {
    return {
      roleBadge: 'STUDENT',
      roleTitle: 'Student Academic & Career Workspace',
      headerLinks: [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Marketplace', path: '/marketplace' },
        { label: 'Business Ideas', path: '/business-ideas' },
        { label: 'Investment', path: '/investment' },
        { label: 'Meetings', path: '/meetings' },
        { label: 'My Requests', path: '/my-requests' },
        { label: 'Skill Development', path: '/skill-development' }
      ],
      opportunityActions: [
        {
          title: 'Book a Mentor',
          subtitle: '1-on-1 career & academic calls',
          path: '/meetings?action=book',
          gradient: 'from-[#8064A9] to-[#9B7CC6]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F3EEFA]/60',
          iconName: 'calendar'
        },
        {
          title: 'Skill Development',
          subtitle: 'Masterclasses & video courses',
          path: '/skill-development',
          gradient: 'from-[#8064A9] to-[#D78E9A]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F9F5FD]/60',
          iconName: 'rocket'
        },
        {
          title: 'Submit Startup Idea',
          subtitle: 'Incubation & validation desk',
          path: '/business-ideas',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'lightbulb'
        },
        {
          title: 'Explore Internships',
          subtitle: 'Verified marketplace roles',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#E58C72]',
          borderHover: 'hover:border-[#E58C72]',
          bgHover: 'hover:bg-[#FFF4F0]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Ecosystem Marketplace',
          subtitle: 'Browse all capabilities',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#D78E9A]',
          borderHover: 'hover:border-[#C66B52]',
          bgHover: 'hover:bg-[#FFF6F7]/60',
          iconName: 'briefcase'
        },
        {
          title: 'My Applications',
          subtitle: 'Track proposals & responses',
          path: '/my-requests?tab=mentor-requests',
          gradient: 'from-[#D99B43] to-[#C66B52]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FCFAF5]/60',
          iconName: 'shield'
        },
        {
          title: 'Scheduled Meetings',
          subtitle: 'Upcoming mentor sessions',
          path: '/meetings',
          gradient: 'from-[#8064B1] to-[#6E529F]',
          borderHover: 'hover:border-[#8064B1]',
          bgHover: 'hover:bg-[#F5EBDD]/60',
          iconName: 'calendar'
        }
      ]
    };
  }

  // 2. MENTOR / TRAINER
  if (subLower.includes('mentor') || subLower.includes('trainer')) {
    return {
      roleBadge: 'MENTOR / TRAINER',
      roleTitle: 'Mentorship, Coaching & Faculty Workspace',
      headerLinks: [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Marketplace', path: '/marketplace' },
        { label: 'Business Ideas', path: '/business-ideas' },
        { label: 'Investment', path: '/investment' },
        { label: 'Meetings', path: '/meetings' },
        { label: 'My Requests', path: '/my-requests' },
        { label: 'My Services', path: '/my-services' }
      ],
      opportunityActions: [
        {
          title: 'Browse Marketplace',
          subtitle: 'Explore member inquiries',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#E58C72]',
          borderHover: 'hover:border-[#E58C72]',
          bgHover: 'hover:bg-[#FFF4F0]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Manage My Services',
          subtitle: 'Teaching & coaching offerings',
          path: '/my-services',
          gradient: 'from-[#8064B1] to-[#6E529F]',
          borderHover: 'hover:border-[#8064B1]',
          bgHover: 'hover:bg-[#F5EBDD]/60',
          iconName: 'shield'
        },
        {
          title: 'Upload Learning Videos',
          subtitle: 'Publish video masterclasses',
          path: '/my-services?tab=videos',
          gradient: 'from-[#8064A9] to-[#D78E9A]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F9F5FD]/60',
          iconName: 'rocket'
        },
        {
          title: 'Meetings & Sessions',
          subtitle: 'Review student consultations',
          path: '/meetings',
          gradient: 'from-[#8064A9] to-[#9B7CC6]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F3EEFA]/60',
          iconName: 'calendar'
        },
        {
          title: 'Submit Business Idea',
          subtitle: 'Incubation & validation',
          path: '/business-ideas',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'lightbulb'
        },
        {
          title: 'Investment Opportunities',
          subtitle: 'Explore syndicates & schemes',
          path: '/investment',
          gradient: 'from-[#D99B43] to-[#C66B52]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FCFAF5]/60',
          iconName: 'trending'
        },
        {
          title: 'Student Requests',
          subtitle: 'Incoming mentorship bookings',
          path: '/my-requests?tab=student-requests',
          gradient: 'from-[#C66B52] to-[#D78E9A]',
          borderHover: 'hover:border-[#C66B52]',
          bgHover: 'hover:bg-[#FFF6F7]/60',
          iconName: 'handshake'
        }
      ]
    };
  }

  // 3. TEACHER / PROFESSOR / RESEARCHER
  if (subLower.includes('teacher') || subLower.includes('professor') || subLower.includes('researcher')) {
    return {
      roleBadge: 'TEACHER / PROFESSOR',
      roleTitle: 'Academic Faculty & Research Workspace',
      headerLinks: [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Marketplace', path: '/marketplace' },
        { label: 'Business Ideas', path: '/business-ideas' },
        { label: 'Investment', path: '/investment' },
        { label: 'Meetings', path: '/meetings' },
        { label: 'My Requests', path: '/my-requests' },
        { label: 'My Services', path: '/my-services' }
      ],
      opportunityActions: [
        {
          title: 'Schedule Consultations',
          subtitle: 'Manage faculty advisory',
          path: '/meetings',
          gradient: 'from-[#8064A9] to-[#9B7CC6]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F3EEFA]/60',
          iconName: 'calendar'
        },
        {
          title: 'Academic Grants',
          subtitle: 'FIC-backed research funding',
          path: '/investment',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'trending'
        },
        {
          title: 'Review Student Ideas',
          subtitle: 'Incubation & validation',
          path: '/business-ideas',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'lightbulb'
        },
        {
          title: 'Research Services',
          subtitle: 'Offer consultancy',
          path: '/my-services',
          gradient: 'from-[#8064B1] to-[#6E529F]',
          borderHover: 'hover:border-[#8064B1]',
          bgHover: 'hover:bg-[#F5EBDD]/60',
          iconName: 'shield'
        },
        {
          title: 'Academic Grants',
          subtitle: 'Grant funding & schemes',
          path: '/investment',
          gradient: 'from-[#D99B43] to-[#C66B52]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FCFAF5]/60',
          iconName: 'trending'
        },
        {
          title: 'Ecosystem Marketplace',
          subtitle: 'Explore campus requirements',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#D78E9A]',
          borderHover: 'hover:border-[#C66B52]',
          bgHover: 'hover:bg-[#FFF6F7]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Active Inquiries',
          subtitle: 'Student & enterprise leads',
          path: '/my-requests?tab=student-requests',
          gradient: 'from-[#8064A9] to-[#D78E9A]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F9F5FD]/60',
          iconName: 'shield'
        }
      ]
    };
  }

  // DEFAULT (Business Owner, Manufacturer, Freelancer, Farmer, etc.)
  return {
    roleBadge: subcategory.toUpperCase(),
    roleTitle: `${subcategory} Workspace`,
    headerLinks: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Marketplace', path: '/marketplace' },
      { label: 'Business Ideas', path: '/business-ideas' },
      { label: 'Scaling', path: '/business-development' },
      { label: 'Investment', path: '/investment' },
      { label: 'Meetings', path: '/meetings' },
      { label: 'My Requests', path: '/my-requests' },
      { label: 'My Services', path: '/my-services' }
    ],
    opportunityActions: [
      {
        title: 'Manage My Services',
        subtitle: 'Add & edit capabilities',
        path: '/my-services',
        gradient: 'from-[#8064B1] to-[#6E529F]',
        borderHover: 'hover:border-[#8064B1]',
        bgHover: 'hover:bg-[#F5EBDD]/60',
        iconName: 'shield'
      },
      {
        title: 'Browse Marketplace',
        subtitle: 'Explore enterprise needs',
        path: '/marketplace',
        gradient: 'from-[#C66B52] to-[#E58C72]',
        borderHover: 'hover:border-[#E58C72]',
        bgHover: 'hover:bg-[#FFF4F0]/60',
        iconName: 'briefcase'
      },
      {
        title: 'Consultation Calls',
        subtitle: 'Facilitated meetings',
        path: '/meetings',
        gradient: 'from-[#8064A9] to-[#9B7CC6]',
        borderHover: 'hover:border-[#8064A9]',
        bgHover: 'hover:bg-[#F3EEFA]/60',
        iconName: 'calendar'
      },
      {
        title: 'Submit Business Idea',
        subtitle: 'Incubation & validation',
        path: '/business-ideas',
        gradient: 'from-[#D99B43] to-[#F5B453]',
        borderHover: 'hover:border-[#D99B43]',
        bgHover: 'hover:bg-[#FDF6E9]/60',
        iconName: 'lightbulb'
      },
      {
        title: 'Business Scaling',
        subtitle: 'Technology & expansion',
        path: '/business-development',
        gradient: 'from-[#8064A9] to-[#D78E9A]',
        borderHover: 'hover:border-[#8064A9]',
        bgHover: 'hover:bg-[#F9F5FD]/60',
        iconName: 'rocket'
      },
      {
        title: 'Investment Channel',
        subtitle: 'Capital & syndicate deals',
        path: '/investment',
        gradient: 'from-[#D99B43] to-[#C66B52]',
        borderHover: 'hover:border-[#D99B43]',
        bgHover: 'hover:bg-[#FCFAF5]/60',
        iconName: 'trending'
      },
      {
        title: 'Client Inquiries',
        subtitle: 'Track proposals & scope',
        path: '/my-requests',
        gradient: 'from-[#D99B43] to-[#C66B52]',
        borderHover: 'hover:border-[#D99B43]',
        bgHover: 'hover:bg-[#FCFAF5]/60',
        iconName: 'shield'
      }
    ]
  };
};

export const getSubcategoryDashboardConfig = (
  user: AuthenticatedUser,
  activeRequestsCount: number,
  ecosystemStats?: EcosystemTelemetryStats
): DynamicDashboardConfig => {
  const subcategory =
    user.subCategory ||
    (user.subcategories && user.subcategories.length > 0 ? user.subcategories[0] : '') ||
    user.primaryCategory ||
    user.categoryName ||
    'Member';

  const subLower = subcategory.toLowerCase();
  const roleNav = getRoleNavigation(user);

  // ==========================================
  // 1. STUDENT
  // ==========================================
  if (subLower.includes('student')) {
    const availableMentors = ecosystemStats?.availableMentors ?? 0;
    const learningVideos = ecosystemStats?.learningVideosCount ?? 0;
    const myMentorRequests = ecosystemStats?.studentRequestsCount ?? 2;

    return {
      roleBadge: 'STUDENT',
      roleTitle: 'Student Academic & Career Workspace',
      heroSubtitle:
        'Access curated industry mentorship, exclusive career internships, startup incubation opportunities, and student collaboration circles across Tamil Nadu.',
      kpiCards: [
        {
          title: 'Available Mentors',
          value: availableMentors,
          subtitle: 'Accredited Experts Ready',
          accent: 'violet',
          trend: 'Live Directory',
          path: '/meetings?action=book',
          iconName: 'calendar'
        },
        {
          title: 'Learning Videos',
          value: learningVideos,
          subtitle: 'Skill Masterclasses',
          accent: 'coral',
          trend: 'Curated Library',
          path: '/skill-development',
          iconName: 'rocket'
        },
        {
          title: 'Internships & Projects',
          value: 'Live',
          subtitle: 'Verified Ecosystem Roles',
          accent: 'amber',
          trend: 'Opportunities',
          path: '/marketplace',
          iconName: 'briefcase'
        },
        {
          title: 'My Applications',
          value: activeRequestsCount,
          subtitle: 'Active FIC Requests',
          accent: 'emerald',
          trend: 'Live Tracker',
          path: '/my-requests?tab=mentor-requests',
          iconName: 'shield'
        }
      ],
      quickActions: roleNav.opportunityActions,
      specializedTrack: {
        badge: 'STUDENT CAREER ACCELERATOR',
        title: 'Mentorship & Career Incubation Track',
        description:
          'Connect directly with verified corporate leaders, academic professors, and startup founders for career guidance, resume reviews, and high-impact internship placements.',
        buttonLabel: 'Schedule Mentorship Session',
        buttonPath: '/meetings?action=book',
        metrics: [
          { label: 'Active Mentors Ready', value: `${availableMentors}` },
          { label: 'Marketplace Roles', value: 'Live' },
          { label: 'Incubation Grants', value: 'Available' },
        ]
      }
    };
  }

  // ==========================================
  // 2. MENTOR / TRAINER
  // ==========================================
  if (subLower.includes('mentor') || subLower.includes('trainer')) {
    const registeredStudents = ecosystemStats?.registeredStudents ?? 0;
    const myServices = ecosystemStats?.myServicesCount ?? 0;
    const myVideos = ecosystemStats?.myVideosCount ?? 0;
    const completedSessions = ecosystemStats?.completedSessions ?? 0;

    return {
      roleBadge: 'MENTOR / TRAINER',
      roleTitle: 'Mentorship, Coaching & Faculty Workspace',
      heroSubtitle:
        'Publish teaching services, upload high-impact skill development videos, conduct 1-on-1 consultations with registered students, and guide emerging entrepreneurs.',
      kpiCards: [
        {
          title: 'Registered Students',
          value: registeredStudents,
          subtitle: 'Seeking Guidance & Upskilling',
          accent: 'coral',
          trend: 'Active Ecosystem',
          path: '/marketplace',
          iconName: 'users'
        },
        {
          title: 'My Teaching Services',
          value: myServices,
          subtitle: 'Published Mentorship Tracks',
          accent: 'violet',
          trend: 'Verified Offerings',
          path: '/my-services',
          iconName: 'shield'
        },
        {
          title: 'Learning Videos',
          value: myVideos,
          subtitle: 'Uploaded Masterclasses',
          accent: 'amber',
          trend: 'Skill Portal',
          path: '/my-services?tab=videos',
          iconName: 'rocket'
        },
        {
          title: 'Completed Sessions',
          value: completedSessions,
          subtitle: 'Logged Student Consultations',
          accent: 'emerald',
          trend: 'Audited History',
          path: '/meetings',
          iconName: 'calendar'
        }
      ],
      quickActions: roleNav.opportunityActions,
      specializedTrack: {
        badge: 'MENTORSHIP & FACULTY INITIATIVE',
        title: 'Student Talent Incubation & Skills Accelerator',
        description:
          'Conduct 1-on-1 career navigation calls, publish structured masterclasses, and mentor university student entrepreneurs on technical feasibility and venture architecture.',
        buttonLabel: 'Manage Teaching Offerings',
        buttonPath: '/my-services',
        metrics: [
          { label: 'Registered Students', value: `${registeredStudents}` },
          { label: 'Quality Standard', value: 'Audited' },
          { label: 'Avg Session Length', value: '45 mins' }
        ]
      }
    };
  }


  // ==========================================
  // 2. TEACHER / PROFESSOR / RESEARCHER
  // ==========================================
  if (subLower.includes('teacher') || subLower.includes('professor') || subLower.includes('researcher')) {
    return {
      roleBadge: 'TEACHER / PROFESSOR',
      roleTitle: 'Academic Faculty & Research Workspace',
      heroSubtitle:
        'Engage in industry-academic research initiatives, mentor high-potential students, and conduct joint consultation sessions through FIC Intermediary Governance.',
      kpiCards: [
        {
          title: 'Research Grants',
          value: '₹15L Pool',
          subtitle: 'Institutional Projects',
          accent: 'coral',
          trend: 'Active Funding',
          path: '/investment',
          iconName: 'trending'
        },
        {
          title: 'Student Consultations',
          value: activeRequestsCount || '3',
          subtitle: 'Mentorship Sessions',
          accent: 'violet',
          trend: 'Bookings',
          path: '/meetings',
          iconName: 'calendar'
        },
        {
          title: 'R&D Incubation',
          value: 'Available',
          subtitle: 'FIC Research Grants',
          accent: 'amber',
          trend: 'Grant Portal',
          path: '/business-ideas',
          iconName: 'lightbulb'
        },
        {
          title: 'Knowledge Network',
          value: 'Verified',
          subtitle: 'Academic Directory',
          accent: 'emerald',
          trend: 'FIC Circle',
          path: '/marketplace',
          iconName: 'shield'
        }
      ],
      quickActions: [
        {
          title: 'Schedule Consultations',
          subtitle: 'Manage faculty advisory',
          path: '/meetings',
          gradient: 'from-[#8064A9] to-[#9B7CC6]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F3EEFA]/60',
          iconName: 'calendar'
        },
        {
          title: 'Academic Grants',
          subtitle: 'FIC-backed research funding',
          path: '/investment',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'trending'
        },
        {
          title: 'Review Student Ideas',
          subtitle: 'Incubation & validation',
          path: '/business-ideas',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'lightbulb'
        },
        {
          title: 'Research Services',
          subtitle: 'Offer consultancy',
          path: '/my-services',
          gradient: 'from-[#8064B1] to-[#6E529F]',
          borderHover: 'hover:border-[#8064B1]',
          bgHover: 'hover:bg-[#F5EBDD]/60',
          iconName: 'shield'
        },
        {
          title: 'Ecosystem Marketplace',
          subtitle: 'Explore campus requirements',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#D78E9A]',
          borderHover: 'hover:border-[#C66B52]',
          bgHover: 'hover:bg-[#FFF6F7]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Active Inquiries',
          subtitle: 'Student & enterprise leads',
          path: '/my-requests?tab=student-requests',
          gradient: 'from-[#8064A9] to-[#D78E9A]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F9F5FD]/60',
          iconName: 'shield'
        }
      ],
      specializedTrack: {
        badge: 'ACADEMIC COLLABORATION INITIATIVE',
        title: 'Institutional Research & Industry Advisory',
        description:
          'Publish university research papers, host corporate masterclasses, and guide early-stage student enterprises through FIC Intermediary Governance.',
        buttonLabel: 'Explore Research Grants & Advisory',
        buttonPath: '/investment',
        metrics: [
          { label: 'Research Schemes', value: 'Active' },
          { label: 'Active Mentees', value: 'Available' },
          { label: 'Incubation Support', value: 'Active' }
        ]
      }
    };
  }

  // ==========================================
  // 3. FREELANCER / SOFTWARE DEVELOPER / IT PROFESSIONAL
  // ==========================================
  if (
    subLower.includes('freelance') ||
    subLower.includes('software') ||
    subLower.includes('developer') ||
    subLower.includes('it professional')
  ) {
    return {
      roleBadge: 'FREELANCE SPECIALIST',
      roleTitle: 'Independent Specialist & Developer Workspace',
      heroSubtitle:
        'Manage your published marketplace services, track client inquiries forwarded through FIC Intermediary Governance, and consult with enterprises requiring technical expertise.',
      kpiCards: [
        {
          title: 'My Published Services',
          value: 'Active',
          subtitle: 'Listed in Marketplace',
          accent: 'coral',
          trend: 'Verified Badge',
          path: '/my-services',
          iconName: 'shield'
        },
        {
          title: 'Client Inquiries',
          value: activeRequestsCount,
          subtitle: 'FIC Verified Requests',
          accent: 'violet',
          trend: 'Live Tracker',
          path: '/my-requests',
          iconName: 'briefcase'
        },
        {
          title: 'Marketplace Deals',
          value: 'In Demand',
          subtitle: 'Enterprise Projects',
          accent: 'amber',
          trend: 'Open Requests',
          path: '/marketplace',
          iconName: 'lightbulb'
        },
        {
          title: 'Consultations',
          value: 'Scheduled',
          subtitle: 'Client Discovery Calls',
          accent: 'emerald',
          trend: 'Video / In-Person',
          path: '/meetings',
          iconName: 'calendar'
        }
      ],
      quickActions: [
        {
          title: 'Manage My Services',
          subtitle: 'Add & edit capabilities',
          path: '/my-services',
          gradient: 'from-[#8064A9] to-[#9B7CC6]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F3EEFA]/60',
          iconName: 'shield'
        },
        {
          title: 'Browse Marketplace',
          subtitle: 'Explore enterprise needs',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#E58C72]',
          borderHover: 'hover:border-[#E58C72]',
          bgHover: 'hover:bg-[#FFF4F0]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Consultation Calls',
          subtitle: 'Facilitated meetings',
          path: '/meetings',
          gradient: 'from-[#8064B1] to-[#6E529F]',
          borderHover: 'hover:border-[#8064B1]',
          bgHover: 'hover:bg-[#F5EBDD]/60',
          iconName: 'calendar'
        },
        {
          title: 'Submit Tech Idea',
          subtitle: 'SaaS & IP incubation',
          path: '/business-ideas',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'lightbulb'
        },
        {
          title: 'Tech Scaling Advisory',
          subtitle: 'Enterprise architecture',
          path: '/business-development',
          gradient: 'from-[#8064A9] to-[#D78E9A]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F9F5FD]/60',
          iconName: 'rocket'
        },
        {
          title: 'Enterprise Inquiries',
          subtitle: 'Explore client tenders',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#E58C72]',
          borderHover: 'hover:border-[#E58C72]',
          bgHover: 'hover:bg-[#FFF4F0]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Client Inquiries',
          subtitle: 'Track proposals & scope',
          path: '/my-requests',
          gradient: 'from-[#D99B43] to-[#C66B52]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FCFAF5]/60',
          iconName: 'shield'
        }
      ],
      specializedTrack: {
        badge: 'FREELANCE CAPABILITY ENGINE',
        title: 'Universal Service Marketplace Showcase',
        description:
          'Your services are published directly into the FIC Universal Marketplace with verified FIC credentials. Clients request coordination directly through FIC governance.',
        buttonLabel: 'Add & Manage My Services',
        buttonPath: '/my-services',
        metrics: [
          { label: 'Active Service Cards', value: '1+' },
          { label: 'Client Lead Flow', value: 'Active' },
          { label: 'Intermediary Shield', value: 'Protected' }
        ]
      }
    };
  }

  // ==========================================
  // 4. BUSINESS OWNER / RETAILER / WHOLESALER / DISTRIBUTOR
  // ==========================================
  if (
    subLower.includes('business owner') ||
    subLower.includes('retailer') ||
    subLower.includes('wholesaler') ||
    subLower.includes('distributor') ||
    subLower.includes('franchise')
  ) {
    return {
      roleBadge: 'BUSINESS OWNER',
      roleTitle: 'Enterprise & Commercial Workspace',
      heroSubtitle:
        'Accelerate business growth, establish B2B distributor networks, procure verified commercial services, and access private expansion capital.',
      kpiCards: [
        {
          title: 'B2B Trade Inquiries',
          value: activeRequestsCount || '2',
          subtitle: 'Distributor Leads',
          accent: 'coral',
          trend: 'Live Flow',
          path: '/my-requests',
          iconName: 'briefcase'
        },
        {
          title: 'Business Scaling',
          value: 'Available',
          subtitle: 'Expansion Advisors',
          accent: 'violet',
          trend: 'Specialists Ready',
          path: '/business-development',
          iconName: 'rocket'
        },
        {
          title: 'Trade Inquiries',
          value: 'Active',
          subtitle: 'Verified OEM Requirements',
          accent: 'amber',
          trend: 'Intermediary Feed',
          path: '/marketplace',
          iconName: 'briefcase'
        },
        {
          title: 'Expansion Capital',
          value: 'Secured',
          subtitle: 'Private Syndicates',
          accent: 'emerald',
          trend: 'Confidential Access',
          path: '/investment',
          iconName: 'trending'
        }
      ],
      quickActions: [
        {
          title: 'Business Scaling',
          subtitle: 'Technology & expansion',
          path: '/business-development',
          gradient: 'from-[#8064A9] to-[#D78E9A]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F9F5FD]/60',
          iconName: 'rocket'
        },
        {
          title: 'Commercial Tenders',
          subtitle: 'Supply chain contracts',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#D78E9A]',
          borderHover: 'hover:border-[#C66B52]',
          bgHover: 'hover:bg-[#FFF6F7]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Procure Services',
          subtitle: 'Universal verified services',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#E58C72]',
          borderHover: 'hover:border-[#E58C72]',
          bgHover: 'hover:bg-[#FFF4F0]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Expansion Funding',
          subtitle: 'Private syndicates',
          path: '/investment',
          gradient: 'from-[#D99B43] to-[#C66B52]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FCFAF5]/60',
          iconName: 'trending'
        },
        {
          title: 'Trade Consultations',
          subtitle: 'Facilitated consultations',
          path: '/meetings',
          gradient: 'from-[#8064B1] to-[#6E529F]',
          borderHover: 'hover:border-[#8064B1]',
          bgHover: 'hover:bg-[#F5EBDD]/60',
          iconName: 'calendar'
        },
        {
          title: 'List My Capabilities',
          subtitle: 'Add wholesale / services',
          path: '/my-services',
          gradient: 'from-[#8064A9] to-[#9B7CC6]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F3EEFA]/60',
          iconName: 'shield'
        },
        {
          title: 'Submit New Venture',
          subtitle: 'Franchise & incubation',
          path: '/business-ideas',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'lightbulb'
        }
      ],
      specializedTrack: {
        badge: 'ENTERPRISE COMMERCIAL HUB',
        title: 'B2B Commercial & Distribution Growth Track',
        description:
          'Connect with verified suppliers across South India, establish regional retail and wholesale distribution networks, and access expert corporate scaling advisory.',
        buttonLabel: 'Explore B2B Expansion Support',
        buttonPath: '/business-development',
        metrics: [
          { label: 'Verified B2B Suppliers', value: 'Ecosystem' },
          { label: 'Active Distributors', value: 'Ecosystem' },
          { label: 'Escrow Protection', value: '100%' }
        ]
      }
    };
  }

  // ==========================================
  // 5. STARTUP FOUNDER
  // ==========================================
  if (subLower.includes('startup') || subLower.includes('founder') || subLower.includes('idea owner')) {
    return {
      roleBadge: 'STARTUP FOUNDER',
      roleTitle: 'Startup Founder & Innovation Workspace',
      heroSubtitle:
        'Submit and incubate business concepts, connect with pre-vetted private investors, access high-caliber tech talent, and track venture milestones.',
      kpiCards: [
        {
          title: 'Incubation Status',
          value: '1 Venture',
          subtitle: 'Under FIC Review',
          accent: 'amber',
          trend: 'Incubation',
          path: '/business-ideas',
          iconName: 'lightbulb'
        },
        {
          title: 'Investor Pitches',
          value: 'Active',
          subtitle: 'Private Deal Room',
          accent: 'emerald',
          trend: 'Private Syndicate',
          path: '/investment',
          iconName: 'trending'
        },
        {
          title: 'Founder Advisory',
          value: 'Ready',
          subtitle: 'Specialist Advisory Calls',
          accent: 'violet',
          trend: '1-on-1 Sessions',
          path: '/meetings',
          iconName: 'calendar'
        },
        {
          title: 'Active Requests',
          value: activeRequestsCount,
          subtitle: 'In FIC Coordination',
          accent: 'coral',
          trend: 'Live Tracker',
          path: '/my-requests',
          iconName: 'shield'
        }
      ],
      quickActions: [
        {
          title: 'Submit / Track Idea',
          subtitle: 'Incubation & validation',
          path: '/business-ideas',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'lightbulb'
        },
        {
          title: 'Private Syndicates',
          subtitle: 'Angel & seed capital',
          path: '/investment',
          gradient: 'from-[#D99B43] to-[#C66B52]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FCFAF5]/60',
          iconName: 'trending'
        },
        {
          title: 'Founder Mentorship',
          subtitle: 'Facilitated consultations',
          path: '/meetings',
          gradient: 'from-[#8064B1] to-[#6E529F]',
          borderHover: 'hover:border-[#8064B1]',
          bgHover: 'hover:bg-[#F5EBDD]/60',
          iconName: 'calendar'
        },
        {
          title: 'Scaling Advisory',
          subtitle: 'Tech & operational scale',
          path: '/business-development',
          gradient: 'from-[#8064A9] to-[#D78E9A]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F9F5FD]/60',
          iconName: 'rocket'
        },
        {
          title: 'Hire Tech Specialists',
          subtitle: 'Universal verified services',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#E58C72]',
          borderHover: 'hover:border-[#E58C72]',
          bgHover: 'hover:bg-[#FFF4F0]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Enterprise Scaling Advisory',
          subtitle: 'Turnaround & tech roadmap',
          path: '/business-development',
          gradient: 'from-[#8064A9] to-[#D78E9A]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F9F5FD]/60',
          iconName: 'rocket'
        },
        {
          title: 'My Startup Profile',
          subtitle: 'Verified credentials',
          path: '/profile',
          gradient: 'from-[#8064A9] to-[#9B7CC6]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F3EEFA]/60',
          iconName: 'shield'
        }
      ],
      specializedTrack: {
        badge: 'VENTURE INCUBATION LAB',
        title: 'FIC Venture Incubation & Seed Pitch Channel',
        description:
          'Transform high-impact business concepts into scale-ready enterprises. Access structured validation, legal incorporation, patent assistance, and angel syndicate demos.',
        buttonLabel: 'Submit Business Idea for Review',
        buttonPath: '/business-ideas',
        metrics: [
          { label: 'Angel Syndicates', value: 'Private' },
          { label: 'Average Review Time', value: '48 Hrs' },
          { label: 'IP Protection', value: '100% NDA' }
        ]
      }
    };
  }

  // ==========================================
  // 6. INVESTOR
  // ==========================================
  if (subLower.includes('investor')) {
    return {
      roleBadge: 'INVESTOR',
      roleTitle: 'Private Investor & Syndicate Workspace',
      heroSubtitle:
        'Review curated pre-vetted startup deal flows, participate in co-investment syndicates, and track portfolio company milestones under strict intermediary compliance.',
      kpiCards: [
        {
          title: 'Deal Pipeline',
          value: 'Private',
          subtitle: 'Investment Pitches',
          accent: 'emerald',
          trend: 'Confidential Flow',
          path: '/investment',
          iconName: 'trending'
        },
        {
          title: 'Active Deal Rooms',
          value: 'Deal Room',
          subtitle: 'Private Deal Rooms',
          accent: 'amber',
          trend: 'Private Flow',
          path: '/investment',
          iconName: 'trending'
        },
        {
          title: 'Founder Meetings',
          value: activeRequestsCount || 'Available',
          subtitle: 'Pitch Consultations',
          accent: 'violet',
          trend: '1-on-1 Pitch',
          path: '/meetings',
          iconName: 'calendar'
        },
        {
          title: 'Deal Room Channel',
          value: 'Secured',
          subtitle: 'Intermediary Escrow',
          accent: 'coral',
          trend: 'FIC Guard',
          path: '/investment',
          iconName: 'shield'
        }
      ],
      quickActions: [
        {
          title: 'Explore Deal Flow',
          subtitle: 'Private vetted syndicates',
          path: '/investment',
          gradient: 'from-[#D99B43] to-[#C66B52]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FCFAF5]/60',
          iconName: 'trending'
        },
        {
          title: 'Private Deal Room',
          subtitle: 'Vetted syndicate dossiers',
          path: '/investment',
          gradient: 'from-[#3B9C91] to-[#2E847A]',
          borderHover: 'hover:border-[#3B9C91]',
          bgHover: 'hover:bg-[#E3F5F2]/60',
          iconName: 'shield'
        },
        {
          title: 'Schedule Pitch Call',
          subtitle: 'Direct founder meetings',
          path: '/meetings',
          gradient: 'from-[#8064B1] to-[#6E529F]',
          borderHover: 'hover:border-[#8064B1]',
          bgHover: 'hover:bg-[#F5EBDD]/60',
          iconName: 'calendar'
        },
        {
          title: 'Vetted Idea Submissions',
          subtitle: 'Incubation pipeline',
          path: '/business-ideas',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'lightbulb'
        },
        {
          title: 'Due Diligence Services',
          subtitle: 'Legal, tax & audit services',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#E58C72]',
          borderHover: 'hover:border-[#E58C72]',
          bgHover: 'hover:bg-[#FFF4F0]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Portfolio Scaling',
          subtitle: 'Post-investment advisory',
          path: '/business-development',
          gradient: 'from-[#8064A9] to-[#D78E9A]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F9F5FD]/60',
          iconName: 'rocket'
        },
        {
          title: 'My Inquiries',
          subtitle: 'Active deal records',
          path: '/my-requests',
          gradient: 'from-[#8064A9] to-[#9B7CC6]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F3EEFA]/60',
          iconName: 'shield'
        }
      ],
      specializedTrack: {
        badge: 'CONFIDENTIAL DEAL FLOW',
        title: 'Curated Angel & Private Equity Deal Pipeline',
        description:
          'Access thoroughly vetted startups across Tamil Nadu seeking seed to growth stage capital. All opportunities have completed FIC intermediary compliance review.',
        buttonLabel: 'Access Private Deal Room',
        buttonPath: '/investment',
        metrics: [
          { label: 'Deals in Pipeline', value: 'Private' },
          { label: 'Ticket Sizes', value: '₹10L - ₹5Cr' },
          { label: 'Verified Governance', value: '100%' }
        ]
      }
    };
  }

  // ==========================================
  // 7. MANUFACTURER / INDUSTRIAL
  // ==========================================
  if (subLower.includes('manufactur') || subLower.includes('factory') || subLower.includes('industrial')) {
    return {
      roleBadge: 'MANUFACTURER',
      roleTitle: 'Manufacturing & Industrial Workspace',
      heroSubtitle:
        'Showcase industrial production capacity, connect with institutional buyers and export distributors, and secure OEM bulk contract orders.',
      kpiCards: [
        {
          title: 'OEM Capacity Listed',
          value: 'Active',
          subtitle: 'Visible to Buyers',
          accent: 'coral',
          trend: 'Industrial OEM',
          path: '/my-services',
          iconName: 'shield'
        },
        {
          title: 'Bulk Supply Inquiries',
          value: activeRequestsCount || '4',
          subtitle: 'B2B Buyer Requests',
          accent: 'violet',
          trend: 'Live Flow',
          path: '/my-requests',
          iconName: 'briefcase'
        },
        {
          title: 'Supply Chain Trade',
          value: 'Regional',
          subtitle: 'Verified Distributor Leads',
          accent: 'amber',
          trend: 'FIC Network',
          path: '/marketplace',
          iconName: 'briefcase'
        },
        {
          title: 'Industrial Scaling',
          value: 'Available',
          subtitle: 'Export Advisory',
          accent: 'emerald',
          trend: 'Modernization',
          path: '/business-development',
          iconName: 'rocket'
        }
      ],
      quickActions: [
        {
          title: 'OEM Capacity (My Services)',
          subtitle: 'List manufacturing lines',
          path: '/my-services',
          gradient: 'from-[#8064A9] to-[#9B7CC6]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F3EEFA]/60',
          iconName: 'shield'
        },
        {
          title: 'Distributor Sourcing',
          subtitle: 'FIC-vetted regional trade',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#E58C72]',
          borderHover: 'hover:border-[#E58C72]',
          bgHover: 'hover:bg-[#FFF4F0]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Procure Raw Materials',
          subtitle: 'Universal verified services',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#E58C72]',
          borderHover: 'hover:border-[#E58C72]',
          bgHover: 'hover:bg-[#FFF4F0]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Industrial Scaling',
          subtitle: 'Automation & export setup',
          path: '/business-development',
          gradient: 'from-[#8064A9] to-[#D78E9A]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F9F5FD]/60',
          iconName: 'rocket'
        },
        {
          title: 'Buyer Consultations',
          subtitle: 'Facilitated meetings',
          path: '/meetings',
          gradient: 'from-[#8064B1] to-[#6E529F]',
          borderHover: 'hover:border-[#8064B1]',
          bgHover: 'hover:bg-[#F5EBDD]/60',
          iconName: 'calendar'
        },
        {
          title: 'Expansion Capital',
          subtitle: 'Machinery & capex syndicates',
          path: '/investment',
          gradient: 'from-[#D99B43] to-[#C66B52]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FCFAF5]/60',
          iconName: 'trending'
        },
        {
          title: 'Bulk Buyer Requests',
          subtitle: 'Track live orders & RFQs',
          path: '/my-requests',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'shield'
        }
      ],
      specializedTrack: {
        badge: 'INDUSTRIAL OEM HUB',
        title: 'OEM Production & Bulk Supply Network',
        description:
          'List your factory production capacities directly into the Universal Marketplace. Receive verified RFQs from corporate retail chains, export houses, and government suppliers.',
        buttonLabel: 'Publish Manufacturing Line',
        buttonPath: '/my-services',
        metrics: [
          { label: 'OEM Facilities', value: 'Verified' },
          { label: 'Order Governance', value: '100%' },
          { label: 'Intermediary Quality Audit', value: '100%' }
        ]
      }
    };
  }

  // ==========================================
  // 8. DEFAULT / GENERAL SPECIALIST
  // ==========================================
  const cleanBadge = (subcategory || 'VERIFIED MEMBER').toUpperCase();
  return {
    roleBadge: cleanBadge,
    roleTitle: `${subcategory} Professional Workspace`,
    heroSubtitle:
      'Access your FIC Business Hub ecosystem capabilities, browse universal marketplace opportunities, and track ongoing member coordination.',
    kpiCards: [
      {
        title: 'Active Requests',
        value: activeRequestsCount,
        subtitle: 'In FIC Coordination',
        accent: 'coral',
        trend: 'Live Tracker',
        path: '/my-requests',
        iconName: 'briefcase'
      },
      {
        title: 'My Published Services',
        value: 'Active',
        subtitle: 'Marketplace Showcase',
        accent: 'violet',
        trend: 'Verified Badge',
        path: '/my-services',
        iconName: 'shield'
      },
      {
        title: 'Scaling Support',
        value: 'Available',
        subtitle: 'Specialists Ready',
        accent: 'amber',
        trend: 'Advisory',
        path: '/business-development',
        iconName: 'rocket'
      },
      {
        title: 'Consultations',
        value: 'Scheduled',
        subtitle: 'Facilitated Meetings',
        accent: 'emerald',
        trend: 'Direct Access',
        path: '/meetings',
        iconName: 'calendar'
      }
    ],
    quickActions: [
      {
        title: 'Browse Marketplace',
        subtitle: 'Universal verified services',
        path: '/marketplace',
        gradient: 'from-[#C66B52] to-[#E58C72]',
        borderHover: 'hover:border-[#E58C72]',
        bgHover: 'hover:bg-[#FFF4F0]/60',
        iconName: 'briefcase'
      },
      {
        title: 'My Services',
        subtitle: 'Add & manage capabilities',
        path: '/my-services',
        gradient: 'from-[#8064A9] to-[#9B7CC6]',
        borderHover: 'hover:border-[#8064A9]',
        bgHover: 'hover:bg-[#F3EEFA]/60',
        iconName: 'shield'
      },
      {
        title: 'Submit Business Idea',
        subtitle: 'Incubation & validation',
        path: '/business-ideas',
        gradient: 'from-[#D99B43] to-[#F5B453]',
        borderHover: 'hover:border-[#D99B43]',
        bgHover: 'hover:bg-[#FDF6E9]/60',
        iconName: 'lightbulb'
      },
      {
        title: 'Business Scaling',
        subtitle: 'Technology & expansion',
        path: '/business-development',
        gradient: 'from-[#8064A9] to-[#D78E9A]',
        borderHover: 'hover:border-[#8064A9]',
        bgHover: 'hover:bg-[#F9F5FD]/60',
        iconName: 'rocket'
      },
      {
        title: 'Investment & Funding',
        subtitle: 'Private syndicates',
        path: '/investment',
        gradient: 'from-[#D99B43] to-[#C66B52]',
        borderHover: 'hover:border-[#D99B43]',
        bgHover: 'hover:bg-[#FCFAF5]/60',
        iconName: 'trending'
      },
      {
        title: 'My Applications',
        subtitle: 'Track submitted requests',
        path: '/my-requests',
        gradient: 'from-[#C66B52] to-[#E58C72]',
        borderHover: 'hover:border-[#E58C72]',
        bgHover: 'hover:bg-[#FFF4F0]/60',
        iconName: 'shield'
      },
      {
        title: 'Meetings',
        subtitle: 'Facilitated consultations',
        path: '/meetings',
        gradient: 'from-[#8064B1] to-[#6E529F]',
        borderHover: 'hover:border-[#8064B1]',
        bgHover: 'hover:bg-[#F5EBDD]/60',
        iconName: 'calendar'
      }
    ],
    specializedTrack: {
      badge: `${cleanBadge} ECOSYSTEM TRACK`,
      title: `${subcategory} Professional Ecosystem Track`,
      description:
        'Access universal capabilities, connect with verified ecosystem members across Tamil Nadu, and expand your commercial reach under FIC intermediary protection.',
      buttonLabel: 'Explore Ecosystem Services',
      buttonPath: '/marketplace',
      metrics: [
        { label: 'Ecosystem Governance', value: '100% KYC' },
        { label: 'Platform Moderation', value: 'Active' },
        { label: 'Escrow Protected', value: '100%' }
      ]
    }
  };
};
