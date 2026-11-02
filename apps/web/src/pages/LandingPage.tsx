import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BriefcaseIcon,
  FactoryIcon,
  CodeIcon,
  GraduationCapIcon,
  TrendingUpIcon,
  UsersIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  LightbulbIcon,
  RocketIcon,
  HandshakeIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserIcon
} from '../components/Icons';

// Spring animation configuration for card settling
const springTransition = {
  type: 'spring' as const,
  stiffness: 80,
  damping: 14,
  mass: 0.9
};

// Rotating phrases for Hero Section
const ROTATING_PHRASES = [
  'Build Businesses',
  'Discover Opportunities',
  'Create Connections',
  'Grow Together'
];

export const LandingPage: React.FC = () => {
  // Hero rotating text index
  const [rotatingIndex, setRotatingIndex] = useState(0);
  // Interactive capability in Section 4 Bento
  const [activeCapability, setActiveCapability] = useState<number>(0);
  // Interactive node in Section 6 Ecosystem
  const [selectedEcosystemNode, setSelectedEcosystemNode] = useState<number>(0);
  // Interactive FAQ in Section 8
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Rotate text every 2.8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // 8 Target Audiences (Section 3) - Split into 2 groups of 4 with Multicolor Accents
  const AUDIENCE_GROUP_1 = [
    {
      id: 'entrepreneurs',
      title: 'Entrepreneurs & Startup Founders',
      category: 'Startups & Ventures',
      desc: 'Validate innovative concepts with structured incubation feedback, connect with early-stage business infrastructure, and access private angel deal flows.',
      icon: RocketIcon,
      accentColor: '#E58C72', // Coral
      bgGradient: 'from-white via-[#FCFAF6] to-[#FFF9F0]',
      borderColor: 'border-[#E58C72]/40 hover:border-[#E58C72]',
      tagBg: 'bg-[#E58C72]/15 text-[#C66B52]',
      features: ['Idea Validation Desk', 'Incubation Roadmaps', 'Founder Matchmaking'],
      badge: 'Early Stage'
    },
    {
      id: 'business-owners',
      title: 'Business Owners & Retailers',
      category: 'Commercial Enterprises',
      desc: 'Discover verified B2B vendors, scale operations, expand regional supply chains, and build distribution channels without sales spam.',
      icon: BriefcaseIcon,
      accentColor: '#D99B43', // Amber Gold
      bgGradient: 'from-white via-[#FCFAF6] to-[#FFF9F0]',
      borderColor: 'border-[#D99B43]/40 hover:border-[#D99B43]',
      tagBg: 'bg-[#D99B43]/15 text-[#B87A28]',
      features: ['Vendor Discovery', 'Supply Chain Expansion', 'Wholesale Tie-ups'],
      badge: 'Commercial'
    },
    {
      id: 'manufacturers',
      title: 'Manufacturers & Industrialists',
      category: 'Production & Industrial Scale',
      desc: 'Connect with bulk purchasers, raw material suppliers, factory co-packers, and production scaling partners across Indian industrial corridors.',
      icon: FactoryIcon,
      accentColor: '#D78E9A', // Dusty Rose
      bgGradient: 'from-white via-[#FCFAF6] to-[#FFF9F0]',
      borderColor: 'border-[#D78E9A]/40 hover:border-[#D78E9A]',
      tagBg: 'bg-[#D78E9A]/15 text-[#C66B52]',
      features: ['OEM Contract Match', 'Industrial Raw Materials', 'Bulk Logistics'],
      badge: 'Industrial'
    },
    {
      id: 'investors',
      title: 'Investors & Funding Seekers',
      category: 'Private Capital & Syndicates',
      desc: 'Confidential deal-flow channels for angel investors, syndicates, and capital seekers with zero public exposure of contact details.',
      icon: TrendingUpIcon,
      accentColor: '#8064A9', // Royal Violet
      bgGradient: 'from-white via-[#FCFAF6] to-[#FFF9F0]',
      borderColor: 'border-[#8064A9]/40 hover:border-[#8064A9]',
      tagBg: 'bg-[#8064A9]/15 text-[#8064A9]',
      features: ['Confidential Deal Flow', 'Vetted Growth Startups', 'Zero Public Exposure'],
      badge: 'Private Capital'
    }
  ];

  const AUDIENCE_GROUP_2 = [
    {
      id: 'professionals',
      title: 'Professionals & Freelancers',
      category: 'Specialized Domain Experts',
      desc: 'Chartered Accountants, legal advocates, software engineers, and domain consultants seeking verified corporate contracts and advisory retainers.',
      icon: CodeIcon,
      accentColor: '#B7A5D1', // Muted Lavender
      bgGradient: 'from-white via-[#FCFAF6] to-[#FFF9F0]',
      borderColor: 'border-[#B7A5D1]/40 hover:border-[#8064A9]',
      tagBg: 'bg-[#B7A5D1]/20 text-[#8064A9]',
      features: ['Corporate Retainers', 'CA & Legal Consults', 'High-Trust Contracts'],
      badge: 'Specialized'
    },
    {
      id: 'students',
      title: 'Students & Job Seekers (18+)',
      category: 'Academic & Future Talent',
      desc: 'Direct career incubation, university startup support, verified credentials, and high-trust networking with enterprise decision-makers.',
      icon: GraduationCapIcon,
      accentColor: '#C66B52', // Terracotta
      bgGradient: 'from-white via-[#FCFAF6] to-[#FFF9F0]',
      borderColor: 'border-[#C66B52]/40 hover:border-[#C66B52]',
      tagBg: 'bg-[#C66B52]/15 text-[#C66B52]',
      features: ['Career Incubation', '18+ Adult Certification', 'Founder Mentorship'],
      badge: 'Talent Incubator'
    },
    {
      id: 'mentors',
      title: 'Teachers & Industry Mentors',
      category: 'Executive Guidance & Advisory',
      desc: 'Academic leaders, senior domain veterans, and industry directors guiding the next generation of Indian enterprises through structured consultations.',
      icon: UsersIcon,
      accentColor: '#D99B43', // Amber Gold
      bgGradient: 'from-white via-[#FCFAF6] to-[#FFF9F0]',
      borderColor: 'border-[#D99B43]/40 hover:border-[#D99B43]',
      tagBg: 'bg-[#D99B43]/15 text-[#B87A28]',
      features: ['Executive Advisory', 'Structured Sessions', 'Knowledge Transfer'],
      badge: 'Strategic'
    },
    {
      id: 'consultants',
      title: 'Consultants & Domain Specialists',
      category: 'Institutional Advisory',
      desc: 'Turn specialized domain expertise into high-value institutional consulting assignments, factory audits, and technology modernizations.',
      icon: LightbulbIcon,
      accentColor: '#E58C72', // Coral
      bgGradient: 'from-white via-[#FCFAF6] to-[#FFF9F0]',
      borderColor: 'border-[#E58C72]/40 hover:border-[#E58C72]',
      tagBg: 'bg-[#E58C72]/15 text-[#C66B52]',
      features: ['Technology Audits', 'Institutional Advisory', 'Turnaround Strategy'],
      badge: 'Advisory'
    }
  ];

  // 7 Capabilities for Bento Grid (Section 4) on Charcoal Background
  const CAPABILITIES = [
    {
      id: 0,
      title: 'Business Ideas & Opportunities',
      badge: 'Incubation & Validation',
      accent: '#D99B43',
      shortDesc: 'Pitch ideas, receive structured viability feedback, and access the FIC incubation desk.',
      detail:
        'Members can submit innovative business concepts or browse FIC-curated commercial opportunities. Dedicated coordinators evaluate viability, structure business models, and connect you with incubation partners.',
      icon: LightbulbIcon,
      actionText: 'Explore Idea Incubation Desk',
      link: '/business-ideas',
      highlightBadge: 'Confidential Desk'
    },
    {
      id: 1,
      title: 'Business Development & Scaling',
      badge: 'Operational Growth',
      accent: '#C66B52',
      shortDesc: 'Market expansion, technology modernizations, factory scaling, and institutional matchmaking.',
      detail:
        'Access structured consulting for plant expansion, supply chain upgrades, brand positioning, and B2B matchmaking coordinated by FIC business development executives.',
      icon: RocketIcon,
      actionText: 'Request Scaling Support',
      link: '/business-development',
      highlightBadge: 'Growth Framework'
    },
    {
      id: 2,
      title: 'Universal Services Marketplace',
      badge: 'Privacy-First Directory',
      accent: '#E58C72',
      shortDesc: 'Browse verified providers across all 10 sectors with 100% provider contact privacy.',
      detail:
        'Every verified member can browse listings across manufacturing, legal, IT, logistics, and agriculture. FIC coordinates all quotes and proposals, protecting provider phone numbers from public spam.',
      icon: BriefcaseIcon,
      actionText: 'Browse Universal Marketplace',
      link: '/marketplace',
      highlightBadge: '10 Sectors'
    },
    {
      id: 3,
      title: 'Investment & Funding Connections',
      badge: 'Confidential Syndicates',
      accent: '#8064A9',
      shortDesc: 'Private capital matching for growth-stage ventures, angel syndicates, and seed seekers.',
      detail:
        'Privately submit funding requirements or investment criteria. FIC Verification Executives facilitate confidential introductions between vetted investors and promising enterprises with zero public exposure.',
      icon: TrendingUpIcon,
      actionText: 'Explore Private Funding',
      link: '/investment',
      highlightBadge: 'Vetted Deal Flow'
    },
    {
      id: 4,
      title: 'Business Partnerships & Tie-ups',
      badge: 'B2B Alliances',
      accent: '#D78E9A',
      shortDesc: 'Strategic joint ventures, distribution tie-ups, manufacturing agreements, and B2B introductions.',
      detail:
        'Find regional distributors, factory co-packers, wholesale partners, and authorized franchisees through FIC-verified corporate matchmaking.',
      icon: HandshakeIcon,
      actionText: 'Explore Strategic Tie-ups',
      link: '/partnerships',
      highlightBadge: 'Verified Alliances'
    },
    {
      id: 5,
      title: 'Professional Networking',
      badge: 'High-Trust Directory',
      accent: '#B7A5D1',
      shortDesc: 'Authenticated ecosystem access connecting genuine decision-makers with KYC verification.',
      detail:
        'Every participating member is authenticated with verified identity and legal 18+ eligibility. Network with verified founders, CAs, engineers, and executives with confidence.',
      icon: UsersIcon,
      actionText: 'Connect with Members',
      link: '/get-started',
      highlightBadge: '18+ Verified'
    },
    {
      id: 6,
      title: 'Mentoring & Knowledge Sharing',
      badge: 'Executive Advisory',
      accent: '#D99B43',
      shortDesc: 'Connect with experienced business leaders for strategic guidance and industry mentorship.',
      detail:
        'Bridge knowledge gaps with industry veterans, senior researchers, and corporate advisors who provide structured consultations to scale your operations.',
      icon: GraduationCapIcon,
      actionText: 'Find Industry Mentors',
      link: '/get-started',
      highlightBadge: 'Direct Mentorship'
    }
  ];

  // 4-Step Process (Section 5)
  const HOW_IT_WORKS_STEPS = [
    {
      step: '01',
      title: 'Join FIC Business Hub',
      time: '~45 seconds',
      desc: 'Create your account in seconds, verify 18+ legal adult eligibility, and configure your basic profile.',
      icon: UserIcon,
      accent: '#E58C72'
    },
    {
      step: '02',
      title: 'Complete Membership & Verification',
      time: '~2 minutes',
      desc: 'Activate 365 days of full ecosystem access with the transparent ₹99 pass and upload category proof.',
      icon: ShieldCheckIcon,
      accent: '#D99B43'
    },
    {
      step: '03',
      title: 'Explore Opportunities & Submit Requests',
      time: 'Instant Access',
      desc: 'Browse privacy-safe services, pitch business concepts, or indicate funding requirements across 10 sectors.',
      icon: SparklesIcon,
      accent: '#8064A9'
    },
    {
      step: '04',
      title: 'FIC Coordinates Relevant Connections',
      time: '24h SLA',
      desc: 'Dedicated FIC officers review specifications, coordinate with providers, and track proposal execution.',
      icon: HandshakeIcon,
      accent: '#C66B52'
    }
  ];

  // Section 6: Interactive Ecosystem Entities
  const ECOSYSTEM_ENTITIES = [
    {
      name: 'Entrepreneurs',
      role: 'Idea & Venture Creators',
      accent: '#E58C72',
      desc: 'Brings high-potential concepts, agile teams, and innovative technologies into the ecosystem.',
      delivers: 'Validated pitches & commercial expansion appetite',
      receives: 'Growth capital, incubation guidance & factory tie-ups',
      icon: RocketIcon
    },
    {
      name: 'Business Owners',
      role: 'Commercial & Retail Engines',
      accent: '#D99B43',
      desc: 'Drives operational trade, regional distribution networks, and wholesale commerce.',
      delivers: 'Bulk purchasing demand & regional sales reach',
      receives: 'Verified B2B suppliers, scaling advice & financing',
      icon: BriefcaseIcon
    },
    {
      name: 'Manufacturers',
      role: 'Industrial & Production Backbone',
      accent: '#D78E9A',
      desc: 'Operates factory production lines, machinery, and raw material conversion.',
      delivers: 'Production capacity, OEM packaging & industrial supply',
      receives: 'Long-term corporate contracts & supply chain partners',
      icon: FactoryIcon
    },
    {
      name: 'Investors',
      role: 'Private Capital Syndicates',
      accent: '#8064A9',
      desc: 'Provides seed capital, angel funding, and growth financing to verified enterprises.',
      delivers: 'Equity capital, strategic guidance & corporate governance',
      receives: 'Confidential deal flow with pre-vetted founder dossiers',
      icon: TrendingUpIcon
    },
    {
      name: 'Professionals',
      role: 'Specialized Domain Experts',
      accent: '#B7A5D1',
      desc: 'Delivers corporate accounting, legal compliance, AI engineering, and technical audits.',
      delivers: 'Verified services, statutory audits & implementation',
      receives: 'High-value institutional retainers without sales spam',
      icon: CodeIcon
    },
    {
      name: 'Mentors',
      role: 'Strategic Guidance & Advisory',
      accent: '#C66B52',
      desc: 'Senior industry veterans and academic leaders coaching emerging leadership.',
      delivers: 'Executive wisdom, board advisory & operational frameworks',
      receives: 'Direct access to dynamic founders and co-incubation equity',
      icon: UsersIcon
    }
  ];

  // 6 Value Pillars (Section 8)
  const WHY_FIC_PILLARS = [
    {
      title: 'One Unified Business Ecosystem',
      desc: 'All 10 core industry sectors — from IT and manufacturing to agriculture and healthcare — interconnected in a single, coordinated national hub.',
      icon: BriefcaseIcon,
      accent: '#D99B43'
    },
    {
      title: 'Cross-Category Discovery',
      desc: 'Every verified member can freely discover services and suppliers across all 10 sectors, regardless of their own primary domain.',
      icon: SparklesIcon,
      accent: '#E58C72'
    },
    {
      title: 'Coordinated Business Connections',
      desc: 'Dedicated FIC officers mediate communications and proposals, ensuring serious requirements and zero unsolicited marketing spam.',
      icon: HandshakeIcon,
      accent: '#8064A9'
    },
    {
      title: 'Multiple Business Opportunities',
      desc: 'Cross-pollination of B2B tie-ups, commercial contracts, private investments, and strategic mentorship all under one roof.',
      icon: RocketIcon,
      accent: '#C66B52'
    },
    {
      title: 'Professional Networking',
      desc: 'An authenticated, high-trust directory where every participant is legally verified and identity-confirmed with 18+ eligibility.',
      icon: UsersIcon,
      accent: '#D78E9A'
    },
    {
      title: 'Verified Member Participation',
      desc: 'Strict category-specific KYC verification safeguards legitimate business enterprises and ensures complete peace of mind.',
      icon: ShieldCheckIcon,
      accent: '#B7A5D1'
    }
  ];

  // FAQs (Section 8 / Accordion)
  const FAQS = [
    {
      q: 'What is FIC Business Hub?',
      a: 'FIC Business Hub is an authenticated national business ecosystem connecting entrepreneurs, established enterprises, manufacturers, investors, and professionals across India. FIC acts as the central intermediary coordinator to help you discover verified services, submit business ideas, explore funding, and form B2B partnerships with complete privacy.'
    },
    {
      q: 'How does the ₹99 first-year membership fee work?',
      a: 'The first-year introductory membership fee is flat ₹99 for a full 365 days of universal ecosystem access (GST and transaction processing included). From the second year onwards, the standard annual renewal is ₹5,999/year. The pricing is completely identical across all 10 business sectors with zero hidden fees or fake countdown discounts.'
    },
    {
      q: 'Why are provider contact numbers hidden in the public marketplace?',
      a: 'To guarantee quality, prevent unsolicited sales spam, and safeguard member data, all listings protect provider privacy. When you request a service, FIC dedicated officers review your specifications and coordinate directly with the verified provider to deliver formal proposals.'
    },
    {
      q: 'Who is eligible to register for FIC Business Hub?',
      a: 'Any individual aged 18 years or older residing in India is eligible to join. We have dedicated industry categories for Startup Founders, Retailers, Factory Owners, Software Engineers, CAs, Farmers, Doctors, and Adult Students.'
    },
    {
      q: 'How does the category KYC verification process operate?',
      a: 'After selecting your primary sector and completing the ₹99 membership payment, you attach your sector verification document (e.g. Aadhaar, GSTIN, Udyam Certificate, Patta, or Student ID). Our Verification Executives review submissions within 24 business hours to activate your full Member Dashboard.'
    }
  ];

  return (
    <div className="bg-[#F5EBDD] text-[#29302D] min-h-screen selection:bg-[#C66B52] selection:text-white font-sans overflow-x-hidden">
      {/* ========================================================
          SECTION 1 – HERO (ULTIMATE ASYMMETRIC SPLIT & 3D ECOSYSTEM)
         ======================================================== */}
      <section className="relative min-h-[94vh] flex items-center bg-[#F5EBDD] pt-8 pb-16 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#E8DBC8]">
        {/* Multicolor Soft Floating Ambient Lights */}
        <div className="absolute top-0 right-10 w-[550px] h-[550px] bg-[#E58C72]/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/4"></div>
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-[#8064A9]/15 rounded-full blur-[130px] pointer-events-none translate-y-1/4"></div>
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-[#D99B43]/15 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* LEFT CONTENT: Word-by-Word Animated Typography (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6 lg:pr-6"
          >
            {/* Small Label with Pulsing Amber Indicator */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#29302D]/5 border border-[#29302D]/15 text-[#29302D] text-xs font-bold tracking-wider uppercase shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D99B43] animate-ping"></span>
              <span className="tracking-widest">FIC BUSINESS ECOSYSTEM</span>
            </div>

            {/* Word-by-Word Animated Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#29302D] tracking-tight leading-[1.06]">
              <span className="inline-block mr-3">Where</span>
              <span className="inline-block mr-3 text-[#D99B43] underline decoration-[#D99B43]/30 underline-offset-8">
                Ideas
              </span>
              <span className="inline-block mr-3">Meet</span>
              <span className="inline-block text-[#C66B52]">
                Opportunities.
              </span>
            </h1>

            {/* Rotating Dynamic Text Box */}
            <div className="flex items-center gap-3 py-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#77786E]">
                Designed To:
              </span>
              <div className="h-8 overflow-hidden relative min-w-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={rotatingIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-[#E8DBC8] text-xs sm:text-sm font-extrabold text-[#8064A9] shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8064A9]"></span>
                    <span>{ROTATING_PHRASES[rotatingIndex]}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#77786E] leading-relaxed max-w-2xl font-normal">
              One connected ecosystem for entrepreneurs, businesses, investors, professionals and visionaries to discover opportunities, build relationships and grow together.
            </p>

            {/* Staggered CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-xl bg-[#C66B52] text-white font-bold text-sm shadow-lg shadow-[#C66B52]/25 hover:bg-[#D99B43] hover:shadow-xl transition-all duration-200 group"
              >
                <span>Explore Business Hub</span>
                <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/get-started"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white border border-[#29302D]/20 text-[#29302D] font-bold text-sm hover:bg-[#FFF9F0] hover:border-[#29302D] transition-all duration-200 shadow-xs"
              >
                <span>Become a Member</span>
              </Link>
            </div>

            {/* Trust Metrics Bar */}
            <div className="pt-6 border-t border-[#E8DBC8] grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block font-black text-xl text-[#29302D]">₹99</span>
                <span className="text-[#77786E] font-medium">First-Year Access</span>
              </div>
              <div>
                <span className="block font-black text-xl text-[#8064A9]">10 Sectors</span>
                <span className="text-[#77786E] font-medium">National Network</span>
              </div>
              <div>
                <span className="block font-black text-xl text-[#C66B52]">100% Privacy</span>
                <span className="text-[#77786E] font-medium">FIC Coordination</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT VISUAL: Rich Animated 3D-Style Business Ecosystem (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.95, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative flex items-center justify-center min-h-[460px] sm:min-h-[520px]"
          >
            {/* Multi-ring Orbital System */}
            <div className="relative w-84 h-84 sm:w-96 sm:h-96 rounded-full flex items-center justify-center">
              {/* Outer Slow Amber Orbit */}
              <div className="absolute inset-0 rounded-full border border-dashed border-[#D99B43]/50 animate-orbital pointer-events-none"></div>

              {/* Middle Reverse Violet Orbit */}
              <div className="absolute inset-6 rounded-full border border-dotted border-[#8064A9]/45 animate-orbital-reverse pointer-events-none"></div>

              {/* Inner Coral Orbit */}
              <div className="absolute inset-12 rounded-full border border-dashed border-[#E58C72]/40 animate-orbital-fast pointer-events-none"></div>

              {/* Ambient Radial Core Light */}
              <div className="w-52 h-52 rounded-full bg-gradient-to-tr from-[#8064A9]/20 via-[#D99B43]/20 to-[#E58C72]/20 blur-2xl"></div>

              {/* Central FIC Core Prism */}
              <div className="relative z-10 w-28 h-28 rounded-2xl bg-[#29302D] text-[#FCFAF6] flex flex-col items-center justify-center shadow-2xl border border-[#D99B43]/50">
                <span className="text-2xl font-black tracking-tight text-white">FIC</span>
                <span className="text-[9px] font-bold tracking-widest text-[#D99B43] uppercase mt-0.5">
                  CORE HUB
                </span>
                <div className="mt-2 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E58C72]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D99B43]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8064A9]"></span>
                </div>
              </div>

              {/* Floating Glass Card 1: Entrepreneur (Top Left) */}
              <div className="absolute -top-4 -left-6 sm:top-0 sm:-left-8 z-20 animate-float-1 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#E58C72]/40 shadow-xl max-w-[200px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E58C72]/20 text-[#C66B52] flex items-center justify-center shrink-0">
                    <RocketIcon size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-[#29302D] truncate">Startup Founder</p>
                    <span className="text-[9px] font-semibold text-[#C66B52] block">Pitch Validated ✓</span>
                  </div>
                </div>
              </div>

              {/* Floating Glass Card 2: Industrial OEM Plant (Top Right) */}
              <div className="absolute -top-5 -right-5 sm:top-2 sm:-right-8 z-20 animate-float-2 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#D99B43]/40 shadow-xl max-w-[205px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#D99B43]/20 text-[#D99B43] flex items-center justify-center shrink-0">
                    <FactoryIcon size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-[#29302D] truncate">Precision OEM Plant</p>
                    <span className="text-[9px] font-semibold text-[#B87A28] block">Bulk Supply Capable</span>
                  </div>
                </div>
              </div>

              {/* Floating Glass Card 3: Angel Syndicate (Bottom Right) */}
              <div className="absolute -bottom-4 -right-4 sm:bottom-4 sm:-right-6 z-20 animate-float-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#8064A9]/40 shadow-xl max-w-[200px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#8064A9]/20 text-[#8064A9] flex items-center justify-center shrink-0">
                    <TrendingUpIcon size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-[#29302D] truncate">Angel Syndicate</p>
                    <span className="text-[9px] font-semibold text-[#8064A9] block">Confidential Deal Flow</span>
                  </div>
                </div>
              </div>

              {/* Floating Glass Card 4: CA / Legal Advisor (Bottom Left) */}
              <div className="absolute -bottom-5 -left-6 sm:bottom-4 sm:-left-8 z-20 animate-float-2 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#D78E9A]/40 shadow-xl max-w-[195px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#D78E9A]/20 text-[#C66B52] flex items-center justify-center shrink-0">
                    <ShieldCheckIcon size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-[#29302D] truncate">Corporate CA</p>
                    <span className="text-[9px] font-semibold text-[#C66B52] block">Verified Retainer</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          SECTION 2 – ABOUT FIC (CONNECTED BUSINESS UNIVERSE)
         ======================================================== */}
      <section id="about" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#FCFAF6] border-b border-[#E8DBC8]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Narrative Column (6 Cols) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C66B52]/15 text-[#C66B52] text-xs font-bold uppercase tracking-wider">
                <span>The National Coordination Universe</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#29302D] tracking-tight leading-tight">
                More Than a Platform. A Connected Business Universe.
              </h2>
              <p className="text-base text-[#77786E] leading-relaxed">
                FIC Business Hub bridges traditional silos between Indian manufacturing plants, innovative tech ventures, institutional capital, and licensed professionals. We replace fragmented directories with an orchestrated, high-trust commercial infrastructure.
              </p>
              <p className="text-sm text-[#77786E] leading-relaxed">
                Our central coordination architecture ensures complete provider contact privacy. Quotes, commercial introductions, and partnership proposals are vetted by FIC officers before presentation — guaranteeing serious buyers and zero sales harassment.
              </p>
              <div className="pt-2 flex items-center gap-6">
                <Link
                  to="/get-started"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#C66B52] hover:text-[#D99B43] transition-colors"
                >
                  <span>Discover our coordination guarantee</span>
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            </motion.div>

            {/* Right Asymmetrical Visual Showcase (6 Cols) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-4"
            >
              {/* Feature Tile 1: Privacy Safeguard */}
              <div className="p-6 rounded-2xl bg-white border border-[#E58C72]/30 hover:border-[#E58C72] transition-all duration-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#E58C72]/15 text-[#C66B52] flex items-center justify-center shrink-0">
                    <ShieldCheckIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#29302D] mb-1">
                      100% Provider Contact Privacy
                    </h3>
                    <p className="text-xs text-[#77786E] leading-relaxed">
                      Provider phone numbers are never publicly scraped or shared. FIC acts as the mediating coordinator so commercial inquiries are serious and verified.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Tile 2: 10 Core Interconnected Sectors */}
              <div className="p-6 rounded-2xl bg-white border border-[#8064A9]/30 hover:border-[#8064A9] transition-all duration-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#8064A9]/15 text-[#8064A9] flex items-center justify-center shrink-0">
                    <HandshakeIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#29302D] mb-1">
                      Cross-Sector Commercial Synergy
                    </h3>
                    <p className="text-xs text-[#77786E] leading-relaxed">
                      Factories meet software developers, agrarian suppliers link with cold-storage logistics, and new ventures pitch directly to active syndicates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Tile 3: Rigorous Verification */}
              <div className="p-6 rounded-2xl bg-white border border-[#D99B43]/30 hover:border-[#D99B43] transition-all duration-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#D99B43]/15 text-[#D99B43] flex items-center justify-center shrink-0">
                    <CheckCircleIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#29302D] mb-1">
                      Category-Specific KYC Verification
                    </h3>
                    <p className="text-xs text-[#77786E] leading-relaxed">
                      Adult eligibility (18+) is confirmed and sector credentials (Aadhaar, GSTIN, Udyam, Patta, or Student ID) are verified within 24 business hours.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 3 – WHO CAN JOIN FIC? (STAGGERED BOTTOM-TO-TOP SCROLL CARDS)
         ======================================================== */}
      <section id="who-can-join" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#F5EBDD] border-b border-[#E8DBC8]">
        <div className="max-w-7xl mx-auto space-y-14">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#C66B52] uppercase tracking-wider">
              A Dedicated Place For High-Intent Achievers
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#29302D] tracking-tight">
              Every Ambition Has a Place Here.
            </h2>
            <p className="text-sm sm:text-base text-[#77786E] leading-relaxed">
              FIC unites 8 specialized commercial profiles into one frictionless national network. Select where you create impact.
            </p>
          </div>

          {/* Group 1: 4 Cards Rising from Below Sequentially (Spring-based settling) */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#8064A9] uppercase tracking-wider block">
              Core Enterprise Pillars
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {AUDIENCE_GROUP_1.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      ...springTransition,
                      delay: idx * 0.14
                    }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className={`p-6 rounded-2xl bg-white border ${item.borderColor} shadow-xs flex flex-col justify-between`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${item.accentColor}20`, color: item.accentColor }}
                        >
                          <Icon size={22} />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.tagBg}`}>
                          {item.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-[#29302D] tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#77786E] leading-relaxed mt-1.5">
                          {item.desc}
                        </p>
                      </div>

                      {/* Micro Features */}
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {item.features.map((feat, fIdx) => (
                          <span
                            key={fIdx}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#29302D] bg-[#FFF9F0] px-2 py-0.5 rounded-md border border-[#E8DBC8]"
                          >
                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: item.accentColor }}></span>
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-5 border-t border-[#E8DBC8]/70 mt-6 flex items-center justify-between">
                      <Link
                        to="/register"
                        className="text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                        style={{ color: item.accentColor }}
                      >
                        <span>Join as {item.title.split('&')[0].trim()}</span>
                        <ArrowRightIcon size={14} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Group 2: 4 Cards Rising Sequentially (Spring-based settling) */}
          <div className="space-y-4 pt-4">
            <span className="text-xs font-bold text-[#D99B43] uppercase tracking-wider block">
              Knowledge, Advisory & Growth Gateways
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {AUDIENCE_GROUP_2.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      ...springTransition,
                      delay: idx * 0.14
                    }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className={`p-6 rounded-2xl bg-white border ${item.borderColor} shadow-xs flex flex-col justify-between`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${item.accentColor}20`, color: item.accentColor }}
                        >
                          <Icon size={22} />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.tagBg}`}>
                          {item.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-[#29302D] tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#77786E] leading-relaxed mt-1.5">
                          {item.desc}
                        </p>
                      </div>

                      {/* Micro Features */}
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {item.features.map((feat, fIdx) => (
                          <span
                            key={fIdx}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#29302D] bg-[#FFF9F0] px-2 py-0.5 rounded-md border border-[#E8DBC8]"
                          >
                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: item.accentColor }}></span>
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-5 border-t border-[#E8DBC8]/70 mt-6 flex items-center justify-between">
                      <Link
                        to="/register"
                        className="text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                        style={{ color: item.accentColor }}
                      >
                        <span>Join as {item.title.split('&')[0].trim()}</span>
                        <ArrowRightIcon size={14} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 4 – WHAT YOU CAN DO (ADVANCED BENTO GRID ON CHARCOAL)
         ======================================================== */}
      <section id="capabilities" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#29302D] text-[#FCFAF6] border-b border-[#D99B43]/20 relative overflow-hidden">
        {/* Ambient Dark Charcoal Multi-light Flares */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8064A9]/20 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#C66B52]/20 rounded-full blur-[130px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-12 relative z-10">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-bold text-[#D99B43] uppercase tracking-wider">
                Full-Spectrum Operations
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#FCFAF6] tracking-tight">
                One Ecosystem. Endless Possibilities.
              </h2>
              <p className="text-sm sm:text-base text-[#E8DBC8]">
                An advanced editorial bento grid showcasing the 7 major avenues unlocked with your verified member dashboard.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#D99B43] hover:text-[#E58C72] transition-colors"
            >
              <span>Explore Universal Marketplace</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Tile 1: Business Ideas & Opportunities (Span 2) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(0)}
              className={`p-7 rounded-3xl border cursor-pointer transition-all duration-200 md:col-span-2 ${
                activeCapability === 0
                  ? 'bg-[#29302D] text-[#FCFAF6] border-[#D99B43] shadow-lg shadow-[#D99B43]/15'
                  : 'bg-[#29302D]/70 text-[#E8DBC8] border-[#E8DBC8]/20 hover:border-[#D99B43]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-[#D99B43]/20 text-[#D99B43] border border-[#D99B43]/30">
                  Idea Validation Desk
                </span>
                <LightbulbIcon size={24} className="text-[#D99B43]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Business Ideas & Opportunities</h3>
              <p className="text-xs text-[#E8DBC8] leading-relaxed mb-4">
                Submit concepts for confidential validation. Access our incubation desk to connect with co-founders, market experts, and operational infrastructure.
              </p>
              <div className="text-xs font-bold inline-flex items-center gap-1.5 text-[#D99B43] underline underline-offset-4">
                <span>Explore Idea Incubation Desk</span>
                <ArrowRightIcon size={14} />
              </div>
            </motion.div>

            {/* Tile 2: Universal Services Marketplace (Span 2) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(2)}
              className={`p-7 rounded-3xl border cursor-pointer transition-all duration-200 md:col-span-2 ${
                activeCapability === 2
                  ? 'bg-[#29302D] text-[#FCFAF6] border-[#E58C72] shadow-lg shadow-[#E58C72]/15'
                  : 'bg-[#29302D]/70 text-[#E8DBC8] border-[#E8DBC8]/20 hover:border-[#E58C72]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-[#E58C72]/20 text-[#E58C72] border border-[#E58C72]/30">
                  Privacy-First Directory
                </span>
                <BriefcaseIcon size={24} className="text-[#E58C72]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Universal Services Marketplace</h3>
              <p className="text-xs text-[#E8DBC8] leading-relaxed mb-4">
                Discover verified vendors across manufacturing, IT, logistics, and legal services. Contact numbers remain confidential while FIC mediates all quotes.
              </p>
              <div className="text-xs font-bold inline-flex items-center gap-1.5 text-[#E58C72] underline underline-offset-4">
                <span>Browse Verified Services</span>
                <ArrowRightIcon size={14} />
              </div>
            </motion.div>

            {/* Tile 3: Development & Scaling (Col 1) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(1)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 ${
                activeCapability === 1
                  ? 'bg-[#29302D] text-[#FCFAF6] border-[#C66B52]'
                  : 'bg-[#29302D]/70 text-[#E8DBC8] border-[#E8DBC8]/20 hover:border-[#C66B52]/50'
              }`}
            >
              <RocketIcon size={22} className="text-[#C66B52]" />
              <h3 className="text-base font-bold mt-3 mb-1 text-white">Scaling & Growth</h3>
              <p className="text-xs text-[#A7AAA0] leading-relaxed">
                Factory expansion, market entry, and institutional matchmaking.
              </p>
            </motion.div>

            {/* Tile 4: Investment & Funding (Col 2) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(3)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 ${
                activeCapability === 3
                  ? 'bg-[#29302D] text-[#FCFAF6] border-[#8064A9]'
                  : 'bg-[#29302D]/70 text-[#E8DBC8] border-[#E8DBC8]/20 hover:border-[#8064A9]/50'
              }`}
            >
              <TrendingUpIcon size={22} className="text-[#8064A9]" />
              <h3 className="text-base font-bold mt-3 mb-1 text-white">Private Funding</h3>
              <p className="text-xs text-[#A7AAA0] leading-relaxed">
                Confidential deal flow between angel syndicates and vetted ventures.
              </p>
            </motion.div>

            {/* Tile 5: Strategic Partnerships (Col 3) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(4)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 ${
                activeCapability === 4
                  ? 'bg-[#29302D] text-[#FCFAF6] border-[#D78E9A]'
                  : 'bg-[#29302D]/70 text-[#E8DBC8] border-[#E8DBC8]/20 hover:border-[#D78E9A]/50'
              }`}
            >
              <HandshakeIcon size={22} className="text-[#D78E9A]" />
              <h3 className="text-base font-bold mt-3 mb-1 text-white">B2B Partnerships</h3>
              <p className="text-xs text-[#A7AAA0] leading-relaxed">
                Joint ventures, regional distribution, and factory packaging.
              </p>
            </motion.div>

            {/* Tile 6: Professional Networking (Col 4) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(5)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 ${
                activeCapability === 5
                  ? 'bg-[#29302D] text-[#FCFAF6] border-[#B7A5D1]'
                  : 'bg-[#29302D]/70 text-[#E8DBC8] border-[#E8DBC8]/20 hover:border-[#B7A5D1]/50'
              }`}
            >
              <UsersIcon size={22} className="text-[#B7A5D1]" />
              <h3 className="text-base font-bold mt-3 mb-1 text-white">Verified Network</h3>
              <p className="text-xs text-[#A7AAA0] leading-relaxed">
                Connect with authenticated 18+ decision-makers without spam.
              </p>
            </motion.div>
          </div>

          {/* Interactive Capability Detail Drawer */}
          <div className="p-6 rounded-2xl bg-[#29302D]/90 border border-[#D99B43]/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#D99B43] uppercase tracking-wider">
                Active Selection: {CAPABILITIES[activeCapability].title}
              </span>
              <p className="text-xs text-[#E8DBC8]">
                {CAPABILITIES[activeCapability].detail}
              </p>
            </div>
            <Link
              to={CAPABILITIES[activeCapability].link}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C66B52] text-white text-xs font-bold shrink-0 hover:bg-[#D99B43] transition-colors"
            >
              <span>{CAPABILITIES[activeCapability].actionText}</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 5 – HOW FIC WORKS (LARGE HORIZONTAL TIMELINE)
         ======================================================== */}
      <section id="how-it-works" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#FCFAF6] border-b border-[#E8DBC8]">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#8064A9] uppercase tracking-wider">
              From Registration to Proposal Execution
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#29302D] tracking-tight">
              Your Journey From Connection to Opportunity.
            </h2>
            <p className="text-sm sm:text-base text-[#77786E]">
              A 4-step progressive timeline engineered for rapid onboarding and verifiable commercial trust.
            </p>
          </div>

          {/* Progressive Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {HOW_IT_WORKS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.12 }}
                  className="relative p-6 rounded-2xl bg-white border border-[#E8DBC8] shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Step Number + Time Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black font-mono" style={{ color: step.accent }}>
                        {step.step}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${step.accent}15`, color: step.accent }}
                      >
                        {step.time}
                      </span>
                    </div>

                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${step.accent}15`, color: step.accent }}
                    >
                      <Icon size={20} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#29302D] mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs text-[#77786E] leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E8DBC8]/70 mt-6 flex items-center gap-1.5 text-[11px] font-bold text-[#29302D]">
                    <CheckCircleIcon size={14} className="text-[#D99B43]" />
                    <span>Verified Step</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 6 – THE FIC ECOSYSTEM (RICH MULTICOLOR CONNECTIONS)
         ======================================================== */}
      <section id="ecosystem" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#29302D] text-[#FCFAF6] border-b border-[#D99B43]/20 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#8064A9]/20 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#D99B43] uppercase tracking-wider">
              Network Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#FCFAF6] tracking-tight">
              Everything Connected. One Ecosystem.
            </h2>
            <p className="text-sm sm:text-base text-[#E8DBC8] leading-relaxed">
              Explore the two-way commercial value exchanges between diverse Indian market participants, coordinated centrally with 100% provider data protection.
            </p>
          </div>

          {/* Interactive Central Hub & Nodes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Entity Selectors (5 Cols) */}
            <div className="lg:col-span-5 space-y-2.5">
              <span className="text-[11px] font-bold text-[#D99B43] tracking-wider uppercase block mb-3">
                Select Active Participant:
              </span>
              {ECOSYSTEM_ENTITIES.map((entity, idx) => {
                const Icon = entity.icon;
                const isSelected = selectedEcosystemNode === idx;
                return (
                  <button
                    key={entity.name}
                    onClick={() => setSelectedEcosystemNode(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#29302D] border-[#D99B43] text-white shadow-md'
                        : 'bg-[#29302D]/60 border-[#E8DBC8]/20 text-[#A7AAA0] hover:bg-[#29302D]/90 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isSelected ? entity.accent : `${entity.accent}25`,
                          color: isSelected ? '#FFFFFF' : entity.accent
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{entity.name}</p>
                        <p className="text-[10px] text-[#A7AAA0]">{entity.role}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D99B43]/20 text-[#D99B43]">
                        Inspecting Node
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Central Node Visual & Value Flow Card (7 Cols) */}
            <div className="lg:col-span-7 p-8 rounded-3xl bg-[#29302D]/90 border border-[#D99B43]/40 backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between border-b border-[#D99B43]/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#D99B43] text-[#29302D] flex items-center justify-center font-black text-xl shadow-lg">
                    FIC
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {ECOSYSTEM_ENTITIES[selectedEcosystemNode].name} Connection Vector
                    </h3>
                    <p className="text-xs text-[#D99B43]">
                      FIC Mediated Intermediary Flow
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#D78E9A] border border-[#D78E9A]/40 px-2 py-0.5 rounded-full">
                  Node 0{selectedEcosystemNode + 1}
                </span>
              </div>

              <p className="text-xs text-[#E8DBC8] leading-relaxed">
                {ECOSYSTEM_ENTITIES[selectedEcosystemNode].desc}
              </p>

              {/* Two-Way Value Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#29302D]/95 border border-[#E8DBC8]/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-[#E58C72] uppercase tracking-wider block">
                    &uarr; Delivers to Ecosystem:
                  </span>
                  <p className="text-xs font-semibold text-white">
                    {ECOSYSTEM_ENTITIES[selectedEcosystemNode].delivers}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#29302D]/95 border border-[#E8DBC8]/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-[#8064A9] uppercase tracking-wider block">
                    &darr; Receives via FIC Coordination:
                  </span>
                  <p className="text-xs font-semibold text-white">
                    {ECOSYSTEM_ENTITIES[selectedEcosystemNode].receives}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#A7AAA0]">
                  Contact privacy 100% enforced during coordination.
                </span>
                <Link
                  to="/get-started"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D99B43] hover:underline"
                >
                  <span>Connect with this sector</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 7 – MEMBERSHIP (START YOUR JOURNEY WITH FIC - ₹99)
         ======================================================== */}
      <section id="membership" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#F5EBDD] border-b border-[#E8DBC8]">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-[#D99B43] uppercase tracking-wider">
              Transparent Membership Terms
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#29302D] tracking-tight">
              Start Your Journey With FIC.
            </h2>
            <p className="text-sm sm:text-base text-[#77786E]">
              Zero artificial countdown discounts. Zero hidden transaction levies. Identical pricing across all 10 core industry categories.
            </p>
          </div>

          {/* Luxury Membership Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 sm:p-10 rounded-3xl bg-[#29302D] text-[#FCFAF6] border border-[#D99B43]/50 shadow-2xl relative overflow-hidden animate-zoom-in-out"
          >
            {/* Ambient Multi-glow Flare */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D99B43]/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-8">
              {/* Top Banner: First Year vs Year 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D99B43]/25">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D99B43]/20 text-[#D99B43] text-xs font-bold tracking-wider uppercase mb-2">
                    <SparklesIcon size={14} />
                    <span>Introductory Access Pass</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    First-Year Onboarding Membership
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-[#D99B43]">₹99</span>
                    <span className="text-xs text-[#E8DBC8] font-medium">/ first 365 days</span>
                  </div>
                  <span className="text-[11px] text-[#A7AAA0] block mt-0.5">
                    GST & payment fees included
                  </span>
                </div>
              </div>

              {/* Renewal note */}
              <div className="p-3.5 rounded-xl bg-[#29302D]/90 border border-[#D99B43]/30 text-xs text-[#E8DBC8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>Standard annual renewal from Year 2 onwards:</span>
                <span className="font-bold text-[#D99B43]">₹5,999 / year</span>
              </div>

              {/* 6 Included Core Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-white">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#D99B43] shrink-0" />
                  <span>Full access to Universal Services Marketplace</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#E58C72] shrink-0" />
                  <span>Sector-tailored dynamic dashboard & tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#8064A9] shrink-0" />
                  <span>Business idea validation & incubation desk</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#D78E9A] shrink-0" />
                  <span>Confidential investment & funding deal flows</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#B7A5D1] shrink-0" />
                  <span>FIC-mediated commercial introductions & B2B tie-ups</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#D99B43] shrink-0" />
                  <span>Strict privacy safeguard for provider contact data</span>
                </div>
              </div>

              {/* Legal Note & Button */}
              <div className="pt-4 border-t border-[#D99B43]/25 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[11px] text-[#A7AAA0]">
                  * Membership access requires KYC verification and legal 18+ adult age.
                </span>
                <Link
                  to="/get-started"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#C66B52] text-white font-bold text-sm shadow-lg hover:bg-[#D99B43] transition-all duration-200"
                >
                  <span>Activate ₹99 Membership</span>
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          SECTION 8 – WHY FIC? (BUILT AROUND CONNECTIONS THAT MATTER)
         ======================================================== */}
      <section id="why-fic" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#FCFAF6] border-b border-[#E8DBC8]">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#8064A9] uppercase tracking-wider">
              The Strategic Advantage
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#29302D] tracking-tight">
              Built Around Connections That Matter.
            </h2>
            <p className="text-sm sm:text-base text-[#77786E]">
              Engineered to eliminate unsolicited cold spam while creating authenticated commercial matchmaking across India.
            </p>
          </div>

          {/* 6 Value Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_FIC_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-6 rounded-2xl bg-white border border-[#E8DBC8] hover:shadow-md transition-all duration-200"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${pillar.accent}20`, color: pillar.accent }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-[#29302D] mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-[#77786E] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* FAQs Accordion */}
          <div className="max-w-3xl mx-auto pt-8 space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-[#29302D]">Frequently Asked Questions</h3>
              <p className="text-xs text-[#77786E] mt-1">
                Everything you need to know about membership, privacy, and ecosystem access.
              </p>
            </div>

            {FAQS.map((faq, fIdx) => {
              const isOpen = openFaq === fIdx;
              return (
                <div
                  key={fIdx}
                  className="rounded-2xl border border-[#E8DBC8] bg-white overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : fIdx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-[#29302D] hover:text-[#C66B52]"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-base font-mono transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
                      +
                    </span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-5 pb-5 pt-0 text-xs text-[#77786E] leading-relaxed border-t border-[#E8DBC8]/60 pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 9 – FINAL CALL TO ACTION (RICH TERRACOTTA / VIOLET)
         ======================================================== */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#C66B52] text-white relative overflow-hidden">
        {/* Soft Gold / Violet Ambient Glow Elements */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-[#D99B43]/30 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#8064A9]/30 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/30 text-white text-xs font-bold tracking-wider uppercase">
            <SparklesIcon size={14} className="text-[#D99B43]" />
            <span>Join the Indian Enterprise Network</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Your Next Opportunity Begins With a Connection.
          </h2>

          <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto font-normal leading-relaxed">
            Bring your ideas, experience and ambitions into one connected business ecosystem.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/get-started"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#29302D] text-white font-bold text-sm shadow-2xl hover:bg-[#D99B43] hover:text-[#29302D] transition-all duration-200"
            >
              <span>Become a Member</span>
              <ArrowRightIcon size={16} />
            </Link>
            <Link
              to="/marketplace"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-transparent border border-white/50 text-white font-bold text-sm hover:bg-white/10 transition-all duration-200"
            >
              <span>Explore FIC</span>
            </Link>
          </div>

          <p className="text-xs text-white/70 pt-4">
            First-year introductory access at flat ₹99 • Verification required • 18+ Adult Policy
          </p>
        </div>
      </section>
    </div>
  );
};
