import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BriefcaseIcon,
  FactoryIcon,
  CodeIcon,
  GraduationCapIcon,
  SproutIcon,
  TrendingUpIcon,
  HeartPulseIcon,
  UsersIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  LightbulbIcon,
  RocketIcon,
  HandshakeIcon,
  CheckCircleIcon,
  LockIcon,
  SparklesIcon,
  UserIcon,
  SearchIcon
} from '../components/Icons';

export const LandingPage: React.FC = () => {
  // Interactive state for Section 4 Bento capability preview
  const [activeCapability, setActiveCapability] = useState<number>(0);
  // Interactive state for Section 6 Ecosystem node selection
  const [selectedEcosystemNode, setSelectedEcosystemNode] = useState<number>(0);
  // Interactive state for Section 8 FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // 8 Target Audiences (Section 3) - Varied visual compositions
  const WHO_CAN_JOIN = [
    {
      id: 'entrepreneurs',
      title: 'Entrepreneurs & Startup Founders',
      category: 'Startups & Early Ventures',
      desc: 'Validate business ideas with structured incubation feedback, connect with early-stage business infrastructure, and access private angel deal flows.',
      icon: RocketIcon,
      accentBorder: 'border-[#397B55]',
      accentBg: 'bg-[#397B55]/10',
      badgeColor: 'text-[#183B2D] bg-[#397B55]/15',
      features: ['Idea Validation Desk', 'Incubation Roadmaps', 'Founder Matchmaking'],
      layout: 'large' // Featured large card
    },
    {
      id: 'business-owners',
      title: 'Business Owners & Retailers',
      category: 'Commercial Enterprises',
      desc: 'Discover verified B2B vendors, scale operations, expand regional supply chains, and build distribution channels without sales spam.',
      icon: BriefcaseIcon,
      accentBorder: 'border-[#C6A66A]',
      accentBg: 'bg-[#C6A66A]/10',
      badgeColor: 'text-[#C6A66A] bg-[#C6A66A]/15',
      features: ['Vendor Discovery', 'Supply Chain Expansion', 'Wholesale Tie-ups'],
      layout: 'horizontal'
    },
    {
      id: 'manufacturers',
      title: 'Manufacturers & Industrialists',
      category: 'Production & Industrial Scale',
      desc: 'Connect with bulk purchasers, raw material suppliers, factory co-packers, and production scaling partners across Indian industrial corridors.',
      icon: FactoryIcon,
      accentBorder: 'border-[#8D9874]',
      accentBg: 'bg-[#8D9874]/10',
      badgeColor: 'text-[#183B2D] bg-[#8D9874]/20',
      features: ['OEM Contract Match', 'Industrial Raw Materials', 'Bulk Logistics'],
      layout: 'standard'
    },
    {
      id: 'investors',
      title: 'Investors & Funding Seekers',
      category: 'Private Capital & Syndicates',
      desc: 'Confidential deal-flow channels for angel investors, syndicates, and capital seekers with zero public exposure of contact details.',
      icon: TrendingUpIcon,
      accentBorder: 'border-[#C6A66A]',
      accentBg: 'bg-[#C6A66A]/10',
      badgeColor: 'text-[#C6A66A] bg-[#20251F]',
      features: ['Confidential Deal Flow', 'Vetted Growth Startups', 'Zero Public Exposure'],
      layout: 'luxury'
    },
    {
      id: 'professionals',
      title: 'Professionals & Freelancers',
      category: 'Specialized Domain Experts',
      desc: 'Chartered Accountants, legal advocates, software engineers, and domain consultants seeking verified corporate contracts and advisory retainers.',
      icon: CodeIcon,
      accentBorder: 'border-[#397B55]',
      accentBg: 'bg-[#397B55]/10',
      badgeColor: 'text-[#397B55] bg-[#397B55]/15',
      features: ['Corporate Retainers', 'CA & Legal Consults', 'High-Trust Contracts'],
      layout: 'standard'
    },
    {
      id: 'students',
      title: 'Students & Job Seekers (18+)',
      category: 'Academic & Future Talent',
      desc: 'Direct career incubation, university startup support, verified credentials, and high-trust networking with enterprise decision-makers.',
      icon: GraduationCapIcon,
      accentBorder: 'border-[#BC7556]',
      accentBg: 'bg-[#BC7556]/10',
      badgeColor: 'text-[#BC7556] bg-[#BC7556]/15',
      features: ['Career Incubation', '18+ Adult Certification', 'Founder Mentorship'],
      layout: 'standard'
    },
    {
      id: 'mentors',
      title: 'Teachers & Industry Mentors',
      category: 'Executive Guidance & Advisory',
      desc: 'Academic leaders, senior domain veterans, and industry directors guiding the next generation of Indian enterprises through structured consultations.',
      icon: UsersIcon,
      accentBorder: 'border-[#8D9874]',
      accentBg: 'bg-[#8D9874]/10',
      badgeColor: 'text-[#183B2D] bg-[#8D9874]/20',
      features: ['Executive Advisory', 'Structured Sessions', 'Knowledge Transfer'],
      layout: 'horizontal'
    },
    {
      id: 'consultants',
      title: 'Consultants & Domain Specialists',
      category: 'Institutional Advisory',
      desc: 'Turn specialized domain expertise into high-value institutional consulting assignments, factory audits, and technology modernizations.',
      icon: LightbulbIcon,
      accentBorder: 'border-[#397B55]',
      accentBg: 'bg-[#397B55]/10',
      badgeColor: 'text-[#397B55] bg-[#397B55]/15',
      features: ['Technology Audits', 'Institutional Advisory', 'Turnaround Strategy'],
      layout: 'standard'
    }
  ];

  // 7 Capabilities for Bento Grid (Section 4)
  const CAPABILITIES = [
    {
      id: 0,
      title: 'Business Ideas & Opportunities',
      badge: 'Incubation & Validation',
      tagline: 'From napkin sketch to structured enterprise roadmap.',
      shortDesc: 'Pitch ideas, receive structured viability feedback, and access the FIC incubation desk.',
      detail:
        'Members can submit innovative business concepts or browse FIC-curated commercial opportunities. Dedicated coordinators evaluate viability, structure business models, and connect you with incubation partners.',
      icon: LightbulbIcon,
      actionText: 'Explore Idea Incubation Desk',
      link: '/business-ideas',
      stats: '100% Confidential Review'
    },
    {
      id: 1,
      title: 'Business Development & Scaling',
      badge: 'Operational Growth',
      tagline: 'Transform an operational business into a market leader.',
      shortDesc: 'Market expansion, technology modernizations, factory scaling, and institutional matchmaking.',
      detail:
        'Access structured consulting for plant expansion, supply chain upgrades, brand positioning, and B2B matchmaking coordinated by FIC business development executives.',
      icon: RocketIcon,
      actionText: 'Request Scaling Support',
      link: '/business-development',
      stats: 'Dedicated Coordination Desk'
    },
    {
      id: 2,
      title: 'Universal Services Marketplace',
      badge: 'Privacy-First Directory',
      tagline: 'Discover verified corporate services with complete contact privacy.',
      shortDesc: 'Browse verified providers across all 10 sectors with 100% provider number protection.',
      detail:
        'Every verified member can browse listings across manufacturing, legal, IT, logistics, and agriculture. FIC coordinates all quotes and proposals, protecting provider phone numbers from public spam.',
      icon: BriefcaseIcon,
      actionText: 'Browse Universal Marketplace',
      link: '/marketplace',
      stats: '10 Interconnected Sectors'
    },
    {
      id: 3,
      title: 'Investment & Funding Connections',
      badge: 'Confidential Syndicates',
      tagline: 'Private capital matchmaking without public investor directories.',
      shortDesc: 'Private capital matching for growth-stage ventures, angel syndicates, and seed seekers.',
      detail:
        'Privately submit funding requirements or investment criteria. FIC Verification Executives facilitate confidential introductions between vetted investors and promising enterprises with zero public exposure.',
      icon: TrendingUpIcon,
      actionText: 'Explore Private Funding',
      link: '/investment',
      stats: 'Vetted Deal Flows'
    },
    {
      id: 4,
      title: 'Business Partnerships & Tie-ups',
      badge: 'B2B Strategic Alliances',
      tagline: 'Joint ventures, distribution networks, and regional agency tie-ups.',
      shortDesc: 'Strategic joint ventures, distribution tie-ups, manufacturing agreements, and B2B introductions.',
      detail:
        'Find regional distributors, factory co-packers, wholesale partners, and authorized franchisees through FIC-verified corporate matchmaking.',
      icon: HandshakeIcon,
      actionText: 'Explore Strategic Tie-ups',
      link: '/partnerships',
      stats: 'Verified Commercial Counterparts'
    },
    {
      id: 5,
      title: 'Professional Networking',
      badge: 'High-Trust Directory',
      tagline: 'Connect with verified decision-makers without unsolicited marketing spam.',
      shortDesc: 'Authenticated ecosystem access connecting genuine decision-makers with KYC verification.',
      detail:
        'Every participating member is authenticated with verified identity and legal 18+ eligibility. Network with verified founders, CAs, engineers, and executives with confidence.',
      icon: UsersIcon,
      actionText: 'Connect with Members',
      link: '/get-started',
      stats: '100% Verified Members'
    },
    {
      id: 6,
      title: 'Mentoring & Knowledge Sharing',
      badge: 'Executive Advisory',
      tagline: 'Gain strategic insights from seasoned corporate veterans.',
      shortDesc: 'Connect with experienced business leaders for strategic guidance and industry mentorship.',
      detail:
        'Bridge knowledge gaps with industry veterans, senior researchers, and corporate advisors who provide structured consultations to scale your operations.',
      icon: GraduationCapIcon,
      actionText: 'Find Industry Mentors',
      link: '/get-started',
      stats: 'Direct Executive Guidance'
    }
  ];

  // 4-Step Process (Section 5)
  const HOW_IT_WORKS_STEPS = [
    {
      step: '01',
      title: 'Join FIC Business Hub',
      time: '~45 seconds',
      desc: 'Create your account in seconds, verify 18+ legal adult eligibility, and configure your credentials.',
      icon: UserIcon,
      accent: '#397B55'
    },
    {
      step: '02',
      title: 'Complete Membership & Verification',
      time: '~2 minutes',
      desc: 'Activate 365 days of full ecosystem access with the transparent ₹99 pass and upload category proof.',
      icon: ShieldCheckIcon,
      accent: '#C6A66A'
    },
    {
      step: '03',
      title: 'Discover Opportunities & Submit Requests',
      time: 'Instant Access',
      desc: 'Browse privacy-safe services, pitch business concepts, or indicate funding requirements across 10 sectors.',
      icon: SparklesIcon,
      accent: '#8D9874'
    },
    {
      step: '04',
      title: 'FIC Coordinates Relevant Connections',
      time: '24h Coordination SLA',
      desc: 'Dedicated FIC officers review specifications, coordinate with providers, and track proposal execution.',
      icon: HandshakeIcon,
      accent: '#BC7556'
    }
  ];

  // Section 6: Interactive Ecosystem Entities
  const ECOSYSTEM_ENTITIES = [
    {
      name: 'Entrepreneurs',
      role: 'Idea & Venture Creators',
      desc: 'Brings high-potential concepts, agile teams, and innovative technologies into the ecosystem.',
      delivers: 'Validated pitches & commercial expansion appetite',
      receives: 'Growth capital, incubation guidance & factory tie-ups',
      icon: RocketIcon
    },
    {
      name: 'Business Owners',
      role: 'Commercial & Retail Engines',
      desc: 'Drives operational trade, regional distribution networks, and wholesale commerce.',
      delivers: 'Bulk purchasing demand & regional sales reach',
      receives: 'Verified B2B suppliers, scaling advice & financing',
      icon: BriefcaseIcon
    },
    {
      name: 'Manufacturers',
      role: 'Industrial & Production Backbone',
      desc: 'Operates factory production lines, machinery, and raw material conversion.',
      delivers: 'Production capacity, OEM packaging & industrial supply',
      receives: 'Long-term corporate contracts & supply chain partners',
      icon: FactoryIcon
    },
    {
      name: 'Investors',
      role: 'Private Capital Syndicates',
      desc: 'Provides seed capital, angel funding, and growth financing to verified enterprises.',
      delivers: 'Equity capital, strategic guidance & corporate governance',
      receives: 'Confidential deal flow with pre-vetted founder dossiers',
      icon: TrendingUpIcon
    },
    {
      name: 'Professionals',
      role: 'Specialized Domain Experts',
      desc: 'Delivers corporate accounting, legal compliance, AI engineering, and technical audits.',
      delivers: 'Verified services, statutory audits & implementation',
      receives: 'High-value institutional retainers without sales spam',
      icon: CodeIcon
    },
    {
      name: 'Mentors',
      role: 'Strategic Guidance & Advisory',
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
      icon: BriefcaseIcon
    },
    {
      title: 'Cross-Category Discovery',
      desc: 'Every verified member can freely discover services and suppliers across all 10 sectors, regardless of their own primary domain.',
      icon: SparklesIcon
    },
    {
      title: 'Coordinated Business Connections',
      desc: 'Dedicated FIC officers mediate communications and proposals, ensuring serious requirements and zero unsolicited marketing spam.',
      icon: HandshakeIcon
    },
    {
      title: 'Multiple Business Opportunities',
      desc: 'Cross-pollination of B2B tie-ups, commercial contracts, private investments, and strategic mentorship all under one roof.',
      icon: RocketIcon
    },
    {
      title: 'Professional Networking',
      desc: 'An authenticated, high-trust directory where every participant is legally verified and identity-confirmed with 18+ eligibility.',
      icon: UsersIcon
    },
    {
      title: 'Verified Member Participation',
      desc: 'Strict category-specific KYC verification safeguards legitimate business enterprises and ensures complete peace of mind.',
      icon: ShieldCheckIcon
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
    <div className="bg-[#F6F2E9] text-[#242820] min-h-screen selection:bg-[#397B55] selection:text-[#FFFDF8] font-sans overflow-x-hidden">
      {/* ========================================================
          SECTION 1 – HERO (EDITORIAL SPLIT WITH ANIMATED VISUAL)
         ======================================================== */}
      <section className="relative min-h-[92vh] flex items-center bg-[#F6F2E9] pt-8 pb-16 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#EDE5D6]">
        {/* Soft organic ambient shapes */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#EDE5D6]/70 rounded-full blur-[90px] pointer-events-none -translate-y-1/3 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#C6A66A]/10 rounded-full blur-[100px] pointer-events-none translate-y-1/4 -translate-x-1/4"></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* LEFT SIDE: Editorial Typography & Actions (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6 lg:pr-6"
          >
            {/* Editorial Category Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#183B2D]/5 border border-[#183B2D]/15 text-[#183B2D] text-xs font-bold tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#397B55] animate-ping"></span>
              <span className="tracking-widest">FIC BUSINESS ECOSYSTEM</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#242820] tracking-tight leading-[1.08]">
              Where{' '}
              <span className="text-[#C6A66A] underline decoration-[#C6A66A]/30 underline-offset-8">
                Ideas
              </span>{' '}
              Meet{' '}
              <span className="text-[#397B55]">
                Opportunities.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#77786E] leading-relaxed max-w-2xl font-normal">
              One connected ecosystem for entrepreneurs, businesses, investors, professionals and visionaries to discover opportunities, build relationships and grow together.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl bg-[#183B2D] text-[#F8F5ED] font-bold text-sm shadow-md hover:bg-[#397B55] hover:shadow-lg transition-all duration-200 group"
              >
                <span>Explore Business Hub</span>
                <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/get-started"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white border border-[#183B2D]/20 text-[#242820] font-bold text-sm hover:bg-[#EDE5D6] hover:border-[#183B2D]/40 transition-all duration-200 shadow-xs"
              >
                <span>Become a Member</span>
              </Link>
            </div>

            {/* Editorial Trust Elements */}
            <div className="pt-6 border-t border-[#EDE5D6] grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block font-black text-lg text-[#183B2D]">₹99</span>
                <span className="text-[#77786E] font-medium">First-Year Pass</span>
              </div>
              <div>
                <span className="block font-black text-lg text-[#183B2D]">10 Sectors</span>
                <span className="text-[#77786E] font-medium">National Network</span>
              </div>
              <div>
                <span className="block font-black text-lg text-[#183B2D]">100% Privacy</span>
                <span className="text-[#77786E] font-medium">FIC Coordination</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT SIDE: Animated Business Ecosystem Visual (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative flex items-center justify-center min-h-[420px] sm:min-h-[480px]"
          >
            {/* Central Orbital Globe / Graphic */}
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full flex items-center justify-center">
              {/* Outer Slow Rotating Ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-[#C6A66A]/40 animate-orbital pointer-events-none"></div>

              {/* Reverse Inner Ring */}
              <div className="absolute inset-6 rounded-full border border-dotted border-[#397B55]/40 animate-orbital-reverse pointer-events-none"></div>

              {/* Ambient Center Glow */}
              <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-[#183B2D]/10 via-[#C6A66A]/15 to-[#397B55]/10 blur-xl"></div>

              {/* Central Core Emblem */}
              <div className="relative z-10 w-28 h-28 rounded-2xl bg-[#183B2D] text-[#F8F5ED] flex flex-col items-center justify-center shadow-xl border border-[#C6A66A]/40">
                <span className="text-2xl font-black tracking-tight">FIC</span>
                <span className="text-[9px] font-bold tracking-widest text-[#C6A66A] uppercase mt-0.5">
                  ECOSYSTEM
                </span>
                <div className="mt-1.5 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#397B55]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C6A66A]"></span>
                </div>
              </div>

              {/* Floating Node 1: AI Venture Founder (Top Left) */}
              <div className="absolute -top-3 -left-4 sm:top-2 sm:-left-6 z-20 animate-float-gentle bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-[#EDE5D6] shadow-lg max-w-[190px]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#397B55]/15 text-[#397B55] flex items-center justify-center shrink-0">
                    <RocketIcon size={14} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-[#242820] truncate">AI Venture Founder</p>
                    <span className="text-[9px] font-semibold text-[#397B55] block">Idea Validated ✓</span>
                  </div>
                </div>
              </div>

              {/* Floating Node 2: Precision Manufacturer (Top Right) */}
              <div
                className="absolute -top-4 -right-4 sm:top-4 sm:-right-8 z-20 animate-float-gentle bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-[#EDE5D6] shadow-lg max-w-[200px]"
                style={{ animationDelay: '1.2s' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#183B2D]/10 text-[#183B2D] flex items-center justify-center shrink-0">
                    <FactoryIcon size={14} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-[#242820] truncate">Precision OEM Plant</p>
                    <span className="text-[9px] font-semibold text-[#8D9874] block">Industrial Capacity</span>
                  </div>
                </div>
              </div>

              {/* Floating Node 3: Private Angel Syndicate (Bottom Right) */}
              <div
                className="absolute -bottom-3 -right-2 sm:bottom-4 sm:-right-6 z-20 animate-float-gentle bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-[#C6A66A]/50 shadow-lg max-w-[195px]"
                style={{ animationDelay: '2.4s' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#C6A66A]/20 text-[#C6A66A] flex items-center justify-center shrink-0">
                    <TrendingUpIcon size={14} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-[#242820] truncate">Angel Syndicate</p>
                    <span className="text-[9px] font-semibold text-[#C6A66A] block">Confidential Match</span>
                  </div>
                </div>
              </div>

              {/* Floating Node 4: CA / Legal Advisor (Bottom Left) */}
              <div
                className="absolute -bottom-4 -left-4 sm:bottom-6 sm:-left-8 z-20 animate-float-gentle bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-[#EDE5D6] shadow-lg max-w-[190px]"
                style={{ animationDelay: '1.8s' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#BC7556]/15 text-[#BC7556] flex items-center justify-center shrink-0">
                    <ShieldCheckIcon size={14} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-[#242820] truncate">Chartered CA Partner</p>
                    <span className="text-[9px] font-semibold text-[#BC7556] block">Verified Retainer</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          SECTION 2 – ABOUT FIC (ASYMMETRIC EDITORIAL LAYOUT)
         ======================================================== */}
      <section id="about" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#FFFDF8] border-b border-[#EDE5D6]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading & Vision Statement */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-6 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6A66A]/15 text-[#C6A66A] text-xs font-bold uppercase tracking-wider">
                <span>The Ecosystem Paradigm</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#242820] tracking-tight leading-tight">
                An Ecosystem Built to Move Businesses Forward.
              </h2>
              <p className="text-base text-[#77786E] leading-relaxed">
                FIC Business Hub is not another passive business directory. It is an active national infrastructure engineered to connect Indian entrepreneurs, industrial manufacturers, investors, and licensed professionals into a high-trust commercial network.
              </p>
              <p className="text-sm text-[#77786E] leading-relaxed">
                We operate as a central coordinator. All commercial introductions, RFQs, service quotes, and investment interests are managed with strict provider privacy — eliminating cold-call harassment and spam while ensuring serious, qualified business partnerships.
              </p>
              <div className="pt-2">
                <Link
                  to="/get-started"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#183B2D] hover:text-[#397B55] transition-colors"
                >
                  <span>Learn how FIC coordinates connections</span>
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            </motion.div>

            {/* Right Column: 3 Asymmetric Value Tiles */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-6 space-y-4"
            >
              {/* Tile 1: Intermediary Protection */}
              <div className="p-6 rounded-2xl bg-[#F6F2E9] border border-[#EDE5D6] hover:border-[#397B55]/40 transition-all duration-200 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#397B55]/15 text-[#397B55] flex items-center justify-center shrink-0">
                    <ShieldCheckIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#242820] mb-1">
                      100% Provider Contact Privacy
                    </h3>
                    <p className="text-xs text-[#77786E] leading-relaxed">
                      Provider contact numbers are never broadcast publicly. FIC acts as the coordinating intermediary so you receive verified proposals without spam.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tile 2: Cross-Sector Matchmaking */}
              <div className="p-6 rounded-2xl bg-[#F6F2E9] border border-[#EDE5D6] hover:border-[#C6A66A]/40 transition-all duration-200 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C6A66A]/20 text-[#C6A66A] flex items-center justify-center shrink-0">
                    <HandshakeIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#242820] mb-1">
                      Cross-Sector Synergy Across 10 Domains
                    </h3>
                    <p className="text-xs text-[#77786E] leading-relaxed">
                      IT ventures meet factories, farmers connect with cold chains, and inventors link with capital — breaking the boundaries of isolated business sectors.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tile 3: Verified Authenticity */}
              <div className="p-6 rounded-2xl bg-[#F6F2E9] border border-[#EDE5D6] hover:border-[#8D9874]/40 transition-all duration-200 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#8D9874]/20 text-[#183B2D] flex items-center justify-center shrink-0">
                    <CheckCircleIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#242820] mb-1">
                      Category-Specific KYC Verification
                    </h3>
                    <p className="text-xs text-[#77786E] leading-relaxed">
                      Every participant verifies legal 18+ adult age and attaches domain-specific credentials (GSTIN, Udyam, Patta, Bar council, or Student ID).
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 3 – WHO CAN BE PART OF FIC? (8 UNIQUE CARDS)
         ======================================================== */}
      <section id="who-can-join" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#F6F2E9] border-b border-[#EDE5D6]">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#397B55] uppercase tracking-wider">
              A Diverse Business Collective
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#242820] tracking-tight">
              Who Can Be Part of FIC?
            </h2>
            <p className="text-sm sm:text-base text-[#77786E] leading-relaxed">
              Designed for high-intent business contributors across 8 specialized domain categories. Explore where you fit in our interconnected national network.
            </p>
          </div>

          {/* Cards Grid with varied compositions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHO_CAN_JOIN.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`p-6 rounded-2xl bg-white border border-[#EDE5D6] hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                    item.layout === 'large' ? 'md:col-span-2 lg:col-span-2 bg-gradient-to-br from-white to-[#EDE5D6]/40' : ''
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl ${item.accentBg} flex items-center justify-center shrink-0`}>
                        <Icon size={22} className="text-[#183B2D]" />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.badgeColor}`}>
                        {item.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#242820] tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#77786E] leading-relaxed mt-1.5">
                        {item.desc}
                      </p>
                    </div>

                    {/* Features list */}
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {item.features.map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#183B2D] bg-[#F6F2E9] px-2.5 py-1 rounded-lg border border-[#EDE5D6]"
                        >
                          <span className="w-1 h-1 rounded-full bg-[#397B55]"></span>
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#EDE5D6]/80 mt-6 flex items-center justify-between">
                    <Link
                      to="/register"
                      className="text-xs font-bold text-[#183B2D] hover:text-[#397B55] inline-flex items-center gap-1.5 transition-colors"
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
      </section>

      {/* ========================================================
          SECTION 4 – WHAT CAN YOU EXPLORE? (BENTO-GRID SHOWCASE)
         ======================================================== */}
      <section id="what-you-can-do" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#FFFDF8] border-b border-[#EDE5D6]">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-bold text-[#C6A66A] uppercase tracking-wider">
                Capabilities & Workspaces
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#242820] tracking-tight">
                What Can You Explore?
              </h2>
              <p className="text-sm sm:text-base text-[#77786E]">
                A unified bento showcase of all 7 core operational avenues available once your membership and category verification are active.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#183B2D] hover:text-[#397B55] transition-colors"
            >
              <span>View Universal Marketplace</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Tile 1: Business Ideas (Span 2) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(0)}
              className={`p-7 rounded-2xl border cursor-pointer transition-all duration-200 md:col-span-2 ${
                activeCapability === 0
                  ? 'bg-[#183B2D] text-[#F8F5ED] border-[#C6A66A]'
                  : 'bg-[#F6F2E9] text-[#242820] border-[#EDE5D6] hover:border-[#183B2D]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  activeCapability === 0 ? 'bg-[#C6A66A]/20 text-[#C6A66A]' : 'bg-[#183B2D]/10 text-[#183B2D]'
                }`}>
                  Idea Validation
                </span>
                <LightbulbIcon size={22} className={activeCapability === 0 ? 'text-[#C6A66A]' : 'text-[#183B2D]'} />
              </div>
              <h3 className="text-xl font-bold mb-2">Business Ideas & Opportunities</h3>
              <p className={`text-xs leading-relaxed mb-4 ${activeCapability === 0 ? 'text-[#EDE5D6]' : 'text-[#77786E]'}`}>
                Submit concepts for confidential validation. Access our incubation desk to connect with co-founders, market experts, and operational infrastructure.
              </p>
              <div className="text-xs font-bold inline-flex items-center gap-1.5 underline decoration-[#C6A66A]">
                <span>Explore Idea Incubation</span>
                <ArrowRightIcon size={14} />
              </div>
            </motion.div>

            {/* Tile 2: Universal Services Marketplace (Span 2) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(2)}
              className={`p-7 rounded-2xl border cursor-pointer transition-all duration-200 md:col-span-2 ${
                activeCapability === 2
                  ? 'bg-[#183B2D] text-[#F8F5ED] border-[#C6A66A]'
                  : 'bg-[#F6F2E9] text-[#242820] border-[#EDE5D6] hover:border-[#183B2D]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  activeCapability === 2 ? 'bg-[#C6A66A]/20 text-[#C6A66A]' : 'bg-[#183B2D]/10 text-[#183B2D]'
                }`}>
                  Privacy-First Directory
                </span>
                <BriefcaseIcon size={22} className={activeCapability === 2 ? 'text-[#C6A66A]' : 'text-[#183B2D]'} />
              </div>
              <h3 className="text-xl font-bold mb-2">Universal Services Marketplace</h3>
              <p className={`text-xs leading-relaxed mb-4 ${activeCapability === 2 ? 'text-[#EDE5D6]' : 'text-[#77786E]'}`}>
                Discover verified vendors across manufacturing, IT, logistics, and legal services. Contact numbers remain confidential while FIC mediates all requests.
              </p>
              <div className="text-xs font-bold inline-flex items-center gap-1.5 underline decoration-[#C6A66A]">
                <span>Browse Verified Services</span>
                <ArrowRightIcon size={14} />
              </div>
            </motion.div>

            {/* Tile 3: Business Development & Scaling (Col 1-2) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(1)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 md:col-span-1 lg:col-span-1 ${
                activeCapability === 1
                  ? 'bg-[#183B2D] text-[#F8F5ED] border-[#C6A66A]'
                  : 'bg-[#F6F2E9] text-[#242820] border-[#EDE5D6] hover:border-[#183B2D]/40'
              }`}
            >
              <RocketIcon size={20} className={activeCapability === 1 ? 'text-[#C6A66A]' : 'text-[#183B2D]'} />
              <h3 className="text-base font-bold mt-3 mb-1">Development & Scaling</h3>
              <p className={`text-xs leading-relaxed ${activeCapability === 1 ? 'text-[#EDE5D6]' : 'text-[#77786E]'}`}>
                Factory modernizations, market entry strategies, and operational scaling.
              </p>
            </motion.div>

            {/* Tile 4: Investment & Funding Connections (Col 2-3) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(3)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 md:col-span-1 lg:col-span-1 ${
                activeCapability === 3
                  ? 'bg-[#183B2D] text-[#F8F5ED] border-[#C6A66A]'
                  : 'bg-[#F6F2E9] text-[#242820] border-[#EDE5D6] hover:border-[#183B2D]/40'
              }`}
            >
              <TrendingUpIcon size={20} className={activeCapability === 3 ? 'text-[#C6A66A]' : 'text-[#183B2D]'} />
              <h3 className="text-base font-bold mt-3 mb-1">Investment & Funding</h3>
              <p className={`text-xs leading-relaxed ${activeCapability === 3 ? 'text-[#EDE5D6]' : 'text-[#77786E]'}`}>
                Private deal flows between angel syndicates and vetted growth-stage enterprises.
              </p>
            </motion.div>

            {/* Tile 5: Business Partnerships & Tie-ups (Col 3-4) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(4)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 md:col-span-1 lg:col-span-1 ${
                activeCapability === 4
                  ? 'bg-[#183B2D] text-[#F8F5ED] border-[#C6A66A]'
                  : 'bg-[#F6F2E9] text-[#242820] border-[#EDE5D6] hover:border-[#183B2D]/40'
              }`}
            >
              <HandshakeIcon size={20} className={activeCapability === 4 ? 'text-[#C6A66A]' : 'text-[#183B2D]'} />
              <h3 className="text-base font-bold mt-3 mb-1">Strategic Partnerships</h3>
              <p className={`text-xs leading-relaxed ${activeCapability === 4 ? 'text-[#EDE5D6]' : 'text-[#77786E]'}`}>
                Joint ventures, regional distribution channels, and factory co-packaging.
              </p>
            </motion.div>

            {/* Tile 6: Professional Networking & Mentoring (Col 4) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveCapability(5)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 md:col-span-1 lg:col-span-1 ${
                activeCapability === 5
                  ? 'bg-[#183B2D] text-[#F8F5ED] border-[#C6A66A]'
                  : 'bg-[#F6F2E9] text-[#242820] border-[#EDE5D6] hover:border-[#183B2D]/40'
              }`}
            >
              <UsersIcon size={20} className={activeCapability === 5 ? 'text-[#C6A66A]' : 'text-[#183B2D]'} />
              <h3 className="text-base font-bold mt-3 mb-1">High-Trust Networking</h3>
              <p className={`text-xs leading-relaxed ${activeCapability === 5 ? 'text-[#EDE5D6]' : 'text-[#77786E]'}`}>
                Network with authenticated 18+ decision-makers without marketing spam.
              </p>
            </motion.div>
          </div>

          {/* Interactive Capability Detail Drawer */}
          <div className="p-6 rounded-2xl bg-[#EDE5D6]/60 border border-[#C6A66A]/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#183B2D] uppercase tracking-wider">
                Currently Selected: {CAPABILITIES[activeCapability].title}
              </span>
              <p className="text-xs text-[#242820]">
                {CAPABILITIES[activeCapability].detail}
              </p>
            </div>
            <Link
              to={CAPABILITIES[activeCapability].link}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#183B2D] text-[#F8F5ED] text-xs font-bold shrink-0 hover:bg-[#397B55] transition-colors"
            >
              <span>{CAPABILITIES[activeCapability].actionText}</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 5 – HOW FIC WORKS (ANIMATED PROCESS TIMELINE)
         ======================================================== */}
      <section id="how-it-works" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#F6F2E9] border-b border-[#EDE5D6]">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#397B55] uppercase tracking-wider">
              Streamlined 4-Step Journey
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#242820] tracking-tight">
              How FIC Works
            </h2>
            <p className="text-sm sm:text-base text-[#77786E]">
              From initial registration to coordinated business proposals — a transparent journey built for speed and trust.
            </p>
          </div>

          {/* Process Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {HOW_IT_WORKS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.12 }}
                  className="relative p-6 rounded-2xl bg-white border border-[#EDE5D6] shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Step Number + Time Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-[#183B2D] font-mono">
                        {step.step}
                      </span>
                      <span className="text-[10px] font-bold text-[#C6A66A] bg-[#C6A66A]/15 px-2 py-0.5 rounded-full">
                        {step.time}
                      </span>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-[#183B2D]/5 text-[#183B2D] flex items-center justify-center">
                      <Icon size={20} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#242820] mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs text-[#77786E] leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#EDE5D6]/80 mt-6 flex items-center gap-1.5 text-[11px] font-bold text-[#397B55]">
                    <CheckCircleIcon size={14} />
                    <span>Verified Milestone</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 6 – ONE CONNECTED ECOSYSTEM (INTERACTIVE VISUALIZATION)
         ======================================================== */}
      <section id="ecosystem" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#20251F] text-[#F8F5ED] border-b border-[#183B2D]/60 relative overflow-hidden">
        {/* Ambient Dark Forest Lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#183B2D]/40 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#C6A66A] uppercase tracking-wider">
              Network Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F8F5ED] tracking-tight">
              One Connected Ecosystem
            </h2>
            <p className="text-sm sm:text-base text-[#A7AAA0] leading-relaxed">
              Experience how diverse market participants interact through the central FIC coordination infrastructure. Click any entity to inspect value flow.
            </p>
          </div>

          {/* Interactive Central Hub & Nodes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Entity Selectors (5 Cols) */}
            <div className="lg:col-span-5 space-y-2.5">
              <span className="text-[11px] font-bold text-[#C6A66A] tracking-wider uppercase block mb-3">
                Select Active Entity:
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
                        ? 'bg-[#183B2D] border-[#C6A66A] text-[#F8F5ED] shadow-md shadow-[#183B2D]/40'
                        : 'bg-[#20251F]/80 border-[#183B2D]/60 text-[#A7AAA0] hover:bg-[#183B2D]/30 hover:text-[#F8F5ED]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-[#C6A66A] text-[#20251F]' : 'bg-[#183B2D] text-[#C6A66A]'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{entity.name}</p>
                        <p className="text-[10px] text-[#A7AAA0]">{entity.role}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-[#C6A66A] bg-[#C6A66A]/10 px-2 py-0.5 rounded-md">
                        Active Node
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Central Node Visual & Value Flow Card (7 Cols) */}
            <div className="lg:col-span-7 p-8 rounded-3xl bg-[#183B2D]/50 border border-[#397B55]/40 backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between border-b border-[#397B55]/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#C6A66A] text-[#20251F] flex items-center justify-center font-black text-xl shadow-lg">
                    FIC
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#F8F5ED]">
                      {ECOSYSTEM_ENTITIES[selectedEcosystemNode].name} Connection Vector
                    </h3>
                    <p className="text-xs text-[#C6A66A]">
                      FIC Mediated Intermediary Flow
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#8D9874] border border-[#8D9874]/40 px-2 py-0.5 rounded-full">
                  Node 0{selectedEcosystemNode + 1}
                </span>
              </div>

              <p className="text-xs text-[#F8F5ED] leading-relaxed">
                {ECOSYSTEM_ENTITIES[selectedEcosystemNode].desc}
              </p>

              {/* Two-Way Value Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#20251F]/90 border border-[#183B2D] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#397B55] uppercase tracking-wider block">
                    &uarr; Delivers to Ecosystem:
                  </span>
                  <p className="text-xs font-semibold text-[#F8F5ED]">
                    {ECOSYSTEM_ENTITIES[selectedEcosystemNode].delivers}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#20251F]/90 border border-[#183B2D] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#C6A66A] uppercase tracking-wider block">
                    &darr; Receives via FIC Coordination:
                  </span>
                  <p className="text-xs font-semibold text-[#F8F5ED]">
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C6A66A] hover:underline"
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
          SECTION 7 – MEMBERSHIP (LUXURY ₹99 PRESENTATION)
         ======================================================== */}
      <section id="membership" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#F6F2E9] border-b border-[#EDE5D6]">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-[#C6A66A] uppercase tracking-wider">
              Transparent Membership Terms
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#242820] tracking-tight">
              Fair & Predictable Membership
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
            className="p-8 sm:p-10 rounded-3xl bg-[#183B2D] text-[#F8F5ED] border border-[#C6A66A]/50 shadow-2xl relative overflow-hidden animate-zoom-in-out"
          >
            {/* Ambient Gold Radial Flare */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#C6A66A]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-8">
              {/* Top Banner: First Year vs Year 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#397B55]/40">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6A66A]/20 text-[#C6A66A] text-xs font-bold tracking-wider uppercase mb-2">
                    <SparklesIcon size={14} />
                    <span>Introductory Access Pass</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#F8F5ED]">
                    First-Year Onboarding Membership
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-[#C6A66A]">₹99</span>
                    <span className="text-xs text-[#EDE5D6] font-medium">/ first 365 days</span>
                  </div>
                  <span className="text-[11px] text-[#A7AAA0] block mt-0.5">
                    GST & payment fees included
                  </span>
                </div>
              </div>

              {/* Renewal note */}
              <div className="p-3.5 rounded-xl bg-[#20251F]/60 border border-[#397B55]/30 text-xs text-[#EDE5D6] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>Standard annual renewal from Year 2 onwards:</span>
                <span className="font-bold text-[#C6A66A]">₹5,999 / year</span>
              </div>

              {/* 6 Included Core Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-[#F8F5ED]">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                  <span>Full access to Universal Services Marketplace</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                  <span>Sector-tailored dynamic dashboard & tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                  <span>Business idea validation & incubation desk</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                  <span>Confidential investment & funding deal flows</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                  <span>FIC-mediated commercial introductions & B2B tie-ups</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                  <span>Strict privacy safeguard for provider contact data</span>
                </div>
              </div>

              {/* Legal Note & Button */}
              <div className="pt-4 border-t border-[#397B55]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[11px] text-[#A7AAA0]">
                  * Membership access requires KYC verification and legal 18+ adult age.
                </span>
                <Link
                  to="/get-started"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#C6A66A] text-[#20251F] font-bold text-sm shadow-lg hover:brightness-110 transition-all duration-200"
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
          SECTION 8 – WHY FIC? (6 PILLARS & FAQS ACCORDION)
         ======================================================== */}
      <section id="why-fic" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#FFFDF8] border-b border-[#EDE5D6]">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#397B55] uppercase tracking-wider">
              The Strategic Advantage
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#242820] tracking-tight">
              Why FIC Business Hub?
            </h2>
            <p className="text-sm sm:text-base text-[#77786E]">
              Built ground-up to solve the core failures of traditional business directories: spam, unqualified leads, and lack of accountability.
            </p>
          </div>

          {/* 6 Value Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_FIC_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-6 rounded-2xl bg-[#F6F2E9] border border-[#EDE5D6] hover:border-[#397B55]/40 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#183B2D]/10 text-[#183B2D] flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-[#242820] mb-2">
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
              <h3 className="text-2xl font-bold text-[#242820]">Frequently Asked Questions</h3>
              <p className="text-xs text-[#77786E] mt-1">
                Everything you need to know about membership, privacy, and ecosystem access.
              </p>
            </div>

            {FAQS.map((faq, fIdx) => {
              const isOpen = openFaq === fIdx;
              return (
                <div
                  key={fIdx}
                  className="rounded-2xl border border-[#EDE5D6] bg-white overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : fIdx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-[#242820] hover:text-[#183B2D]"
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
                        <div className="px-5 pb-5 pt-0 text-xs text-[#77786E] leading-relaxed border-t border-[#EDE5D6]/60 pt-3">
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
          SECTION 9 – FINAL CALL TO ACTION (FULL-WIDTH FOREST GREEN)
         ======================================================== */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#183B2D] text-[#F8F5ED] relative overflow-hidden">
        {/* Soft Gold Ambient Glow Elements */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-[#C6A66A]/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#397B55]/30 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C6A66A]/20 border border-[#C6A66A]/40 text-[#C6A66A] text-xs font-bold tracking-wider uppercase">
            <SparklesIcon size={14} />
            <span>Join the Indian Enterprise Network</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Your Next Opportunity Begins With a Connection.
          </h2>

          <p className="text-base sm:text-lg text-[#EDE5D6] max-w-2xl mx-auto font-normal leading-relaxed">
            Bring your ideas, experience and ambitions into one connected business ecosystem.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/get-started"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#C6A66A] text-[#20251F] font-bold text-sm shadow-xl hover:brightness-110 transition-all duration-200"
            >
              <span>Become a Member</span>
              <ArrowRightIcon size={16} />
            </Link>
            <Link
              to="/marketplace"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-transparent border border-[#C6A66A]/40 text-[#F8F5ED] font-bold text-sm hover:bg-[#397B55] transition-all duration-200"
            >
              <span>Explore FIC</span>
            </Link>
          </div>

          <p className="text-xs text-[#A7AAA0] pt-4">
            First-year introductory access at flat ₹99 • Verification required • 18+ Adult Policy
          </p>
        </div>
      </section>
    </div>
  );
};
