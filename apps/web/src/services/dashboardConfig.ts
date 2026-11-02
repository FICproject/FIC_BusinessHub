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

export const getSubcategoryDashboardConfig = (
  user: AuthenticatedUser,
  activeRequestsCount: number
): DynamicDashboardConfig => {
  const subcategory =
    user.subCategory ||
    (user.subcategories && user.subcategories.length > 0 ? user.subcategories[0] : '') ||
    user.primaryCategory ||
    user.categoryName ||
    'Member';

  const subLower = subcategory.toLowerCase();

  // ==========================================
  // 1. STUDENT
  // ==========================================
  if (subLower.includes('student')) {
    return {
      roleBadge: 'STUDENT',
      roleTitle: 'Student Academic & Career Workspace',
      heroSubtitle:
        'Access curated industry mentorship, exclusive career internships, startup incubation opportunities, and student collaboration circles across Tamil Nadu.',
      kpiCards: [
        {
          title: 'Academic Mentors',
          value: 'Available',
          subtitle: '1-on-1 Strategy Calls',
          accent: 'violet',
          trend: 'FIC Network',
          path: '/meetings',
          iconName: 'calendar'
        },
        {
          title: 'Internships & Projects',
          value: '18 Active',
          subtitle: 'Verified Ecosystem Roles',
          accent: 'coral',
          trend: 'Opportunities',
          path: '/marketplace',
          iconName: 'briefcase'
        },
        {
          title: 'Student Startup Ideas',
          value: '1 Ready',
          subtitle: 'Incubation Channel',
          accent: 'amber',
          trend: 'Incubation',
          path: '/business-ideas',
          iconName: 'lightbulb'
        },
        {
          title: 'My Applications',
          value: activeRequestsCount,
          subtitle: 'Active FIC Requests',
          accent: 'emerald',
          trend: 'Live Tracker',
          path: '/my-requests',
          iconName: 'shield'
        }
      ],
      quickActions: [
        {
          title: 'Book a Mentor',
          subtitle: 'Facilitated consultations',
          path: '/meetings',
          gradient: 'from-[#8064A9] to-[#9B7CC6]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F3EEFA]/60',
          iconName: 'calendar'
        },
        {
          title: 'Explore Internships',
          subtitle: 'Verified marketplace tasks',
          path: '/marketplace',
          gradient: 'from-[#C66B52] to-[#E58C72]',
          borderHover: 'hover:border-[#E58C72]',
          bgHover: 'hover:bg-[#FFF4F0]/60',
          iconName: 'briefcase'
        },
        {
          title: 'Submit Startup Idea',
          subtitle: 'Incubation & validation',
          path: '/business-ideas',
          gradient: 'from-[#D99B43] to-[#F5B453]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FDF6E9]/60',
          iconName: 'lightbulb'
        },
        {
          title: 'My Services',
          subtitle: 'Offer freelance skills',
          path: '/my-services',
          gradient: 'from-[#29302D] to-[#8064A9]',
          borderHover: 'hover:border-[#29302D]',
          bgHover: 'hover:bg-[#F5EBDD]/60',
          iconName: 'shield'
        },
        {
          title: 'Skill Development',
          subtitle: 'Growth & certifications',
          path: '/business-development',
          gradient: 'from-[#8064A9] to-[#D78E9A]',
          borderHover: 'hover:border-[#8064A9]',
          bgHover: 'hover:bg-[#F9F5FD]/60',
          iconName: 'rocket'
        },
        {
          title: 'Student Syndicates',
          subtitle: 'Peer collaborations',
          path: '/partnerships',
          gradient: 'from-[#C66B52] to-[#D78E9A]',
          borderHover: 'hover:border-[#C66B52]',
          bgHover: 'hover:bg-[#FFF6F7]/60',
          iconName: 'handshake'
        },
        {
          title: 'My Applications',
          subtitle: 'Track proposals & responses',
          path: '/my-requests',
          gradient: 'from-[#D99B43] to-[#C66B52]',
          borderHover: 'hover:border-[#D99B43]',
          bgHover: 'hover:bg-[#FCFAF5]/60',
          iconName: 'shield'
        }
      ],
      specializedTrack: {
        badge: 'STUDENT CAREER ACCELERATOR',
        title: 'Mentorship & Career Incubation Track',
        description:
          'Connect directly with verified corporate leaders, academic professors, and startup founders for career guidance, resume reviews, and high-impact internship placements.',
        buttonLabel: 'Schedule Mentorship Session',
        buttonPath: '/meetings',
        metrics: [
          { label: 'Active Mentors Ready', value: '45+' },
          { label: 'Verified Internships', value: '18' },
          { label: 'Incubation Grants', value: 'Up to ₹2L' }
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
        'Engage in industry-academic research partnerships, mentor high-potential students, and conduct joint consultation sessions through FIC Intermediary Governance.',
      kpiCards: [
        {
          title: 'Academic Ties',
          value: '8 Active',
          subtitle: 'Institutional Projects',
          accent: 'coral',
          trend: 'Industry Links',
          path: '/partnerships',
          iconName: 'handshake'
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
          title: 'Institutional Ties',
          subtitle: 'Tie-ups & industry MoUs',
          path: '/partnerships',
          gradient: 'from-[#C66B52] to-[#E58C72]',
          borderHover: 'hover:border-[#E58C72]',
          bgHover: 'hover:bg-[#FFF4F0]/60',
          iconName: 'handshake'
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
          gradient: 'from-[#29302D] to-[#8064A9]',
          borderHover: 'hover:border-[#29302D]',
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
          path: '/my-requests',
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
          'Publish university research papers, host corporate masterclasses, and guide early-stage student enterprises through FIC academic grant partnerships.',
        buttonLabel: 'Explore Institutional Tie-ups',
        buttonPath: '/partnerships',
        metrics: [
          { label: 'Corporate Partners', value: '120+' },
          { label: 'Active Mentees', value: '34' },
          { label: 'Incubation Success', value: '92%' }
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
          value: '26 In Demand',
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
          gradient: 'from-[#29302D] to-[#8064A9]',
          borderHover: 'hover:border-[#29302D]',
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
          title: 'Agency Partnerships',
          subtitle: 'Subcontracting & alliances',
          path: '/partnerships',
          gradient: 'from-[#C66B52] to-[#D78E9A]',
          borderHover: 'hover:border-[#C66B52]',
          bgHover: 'hover:bg-[#FFF6F7]/60',
          iconName: 'handshake'
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
          title: 'B2B Distribution Ties',
          value: '14 Active',
          subtitle: 'Tie-ups & Franchises',
          accent: 'amber',
          trend: 'Regional Network',
          path: '/partnerships',
          iconName: 'handshake'
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
          title: 'B2B Partnerships',
          subtitle: 'Tie-ups & distributors',
          path: '/partnerships',
          gradient: 'from-[#C66B52] to-[#D78E9A]',
          borderHover: 'hover:border-[#C66B52]',
          bgHover: 'hover:bg-[#FFF6F7]/60',
          iconName: 'handshake'
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
          gradient: 'from-[#29302D] to-[#8064A9]',
          borderHover: 'hover:border-[#29302D]',
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
          { label: 'Verified B2B Suppliers', value: '250+' },
          { label: 'Active Distributors', value: '80+' },
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
          gradient: 'from-[#29302D] to-[#8064A9]',
          borderHover: 'hover:border-[#29302D]',
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
          title: 'B2B Pilots & Co-founders',
          subtitle: 'Tie-ups & partnerships',
          path: '/partnerships',
          gradient: 'from-[#C66B52] to-[#D78E9A]',
          borderHover: 'hover:border-[#C66B52]',
          bgHover: 'hover:bg-[#FFF6F7]/60',
          iconName: 'handshake'
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
          { label: 'Active Angel Syndicates', value: '12' },
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
          value: '9 Vetted',
          subtitle: 'Investment Pitches',
          accent: 'emerald',
          trend: 'Confidential Flow',
          path: '/investment',
          iconName: 'trending'
        },
        {
          title: 'Active Co-Syndicates',
          value: '3 Open',
          subtitle: 'Co-Investment Pools',
          accent: 'amber',
          trend: 'Co-Invest',
          path: '/partnerships',
          iconName: 'handshake'
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
          title: 'Syndicate Alliances',
          subtitle: 'Co-investment partnerships',
          path: '/partnerships',
          gradient: 'from-[#C66B52] to-[#D78E9A]',
          borderHover: 'hover:border-[#C66B52]',
          bgHover: 'hover:bg-[#FFF6F7]/60',
          iconName: 'handshake'
        },
        {
          title: 'Schedule Pitch Call',
          subtitle: 'Direct founder meetings',
          path: '/meetings',
          gradient: 'from-[#29302D] to-[#8064A9]',
          borderHover: 'hover:border-[#29302D]',
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
          { label: 'Active Deals in Pipeline', value: '14' },
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
          title: 'Supply Chain Ties',
          value: '22 Regional',
          subtitle: 'Distributor Networks',
          accent: 'amber',
          trend: 'B2B Partners',
          path: '/partnerships',
          iconName: 'handshake'
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
          title: 'B2B Distribution Ties',
          subtitle: 'Appoint regional dealers',
          path: '/partnerships',
          gradient: 'from-[#C66B52] to-[#D78E9A]',
          borderHover: 'hover:border-[#C66B52]',
          bgHover: 'hover:bg-[#FFF6F7]/60',
          iconName: 'handshake'
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
          gradient: 'from-[#29302D] to-[#8064A9]',
          borderHover: 'hover:border-[#29302D]',
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
          { label: 'Verified OEM Facilities', value: '75+' },
          { label: 'Bulk Orders Matched', value: '₹4.2 Cr' },
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
        title: 'B2B Partnerships',
        subtitle: 'Tie-ups & distributors',
        path: '/partnerships',
        gradient: 'from-[#C66B52] to-[#D78E9A]',
        borderHover: 'hover:border-[#C66B52]',
        bgHover: 'hover:bg-[#FFF6F7]/60',
        iconName: 'handshake'
      },
      {
        title: 'Meetings',
        subtitle: 'Facilitated consultations',
        path: '/meetings',
        gradient: 'from-[#29302D] to-[#8064A9]',
        borderHover: 'hover:border-[#29302D]',
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
        { label: 'Ecosystem Members', value: '1,200+' },
        { label: 'Active Opportunities', value: '45+' },
        { label: 'Escrow Protected', value: '100%' }
      ]
    }
  };
};
