import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@fic/ui';
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
  UserIcon
} from '../components/Icons';

export const LandingPage: React.FC = () => {
  // State for interactive capabilities tab/preview in Section 4
  const [activeCapability, setActiveCapability] = useState<number>(0);
  // State for FAQs accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // 8 Target Audiences (Section 3)
  const WHO_CAN_JOIN = [
    {
      title: 'Entrepreneurs & Startup Founders',
      desc: 'Validate business ideas, incubate ventures, and connect with early-stage business growth infrastructure.',
      icon: RocketIcon,
      badge: 'Startups & Ventures',
      accent: 'border-blue-500/30 bg-blue-500/5'
    },
    {
      title: 'Business Owners & Retailers',
      desc: 'Discover verified B2B vendors, scale operations, expand supply chains, and build distribution channels.',
      icon: BriefcaseIcon,
      badge: 'Commercial Enterprise',
      accent: 'border-indigo-500/30 bg-indigo-500/5'
    },
    {
      title: 'Manufacturers & Industrialists',
      desc: 'Connect with bulk buyers, industrial suppliers, raw material partners, and production scale opportunities.',
      icon: FactoryIcon,
      badge: 'Production & Supply',
      accent: 'border-sky-500/30 bg-sky-500/5'
    },
    {
      title: 'Investors & Funding Seekers',
      desc: 'Confidential deal-flow channels for angel investors, syndicates, and capital seekers with zero public exposure.',
      icon: TrendingUpIcon,
      badge: 'Private Capital',
      accent: 'border-amber-500/30 bg-amber-500/5'
    },
    {
      title: 'Professionals & Freelancers',
      desc: 'Chartered Accountants, legal advocates, software developers, and consultants seeking verified corporate contracts.',
      icon: CodeIcon,
      badge: 'Specialized Expertise',
      accent: 'border-purple-500/30 bg-purple-500/5'
    },
    {
      title: 'Students & Job Seekers (18+)',
      desc: 'Direct career guidance, university incubation channels, and professional networking for adult students.',
      icon: GraduationCapIcon,
      badge: 'Academic & Talent',
      accent: 'border-emerald-500/30 bg-emerald-500/5'
    },
    {
      title: 'Teachers & Industry Mentors',
      desc: 'Academic leaders, domain experts, and industry veterans guiding the next generation of Indian enterprises.',
      icon: UsersIcon,
      badge: 'Strategic Guidance',
      accent: 'border-teal-500/30 bg-teal-500/5'
    },
    {
      title: 'Consultants & Domain Specialists',
      desc: 'Turn specialized domain expertise into high-value institutional consulting and advisory assignments.',
      icon: LightbulbIcon,
      badge: 'Advisory Assignments',
      accent: 'border-rose-500/30 bg-rose-500/5'
    }
  ];

  // 7 Major Ecosystem Capabilities (Section 4)
  const CAPABILITIES = [
    {
      id: 0,
      title: 'Business Ideas & Opportunities',
      shortDesc: 'Pitch ideas, receive structured validation feedback, and access the FIC incubation desk.',
      detail:
        'Members can submit innovative concepts or browse FIC-published commercial opportunities. Dedicated coordinators help evaluate viability, structure business models, and connect you with incubation support.',
      icon: LightbulbIcon,
      actionText: 'Explore Incubation Desk',
      link: '/business-ideas',
      highlightBadge: 'Idea Validation'
    },
    {
      id: 1,
      title: 'Business Development & Scaling',
      shortDesc: 'Market research, technology development, expansion strategy, and institutional matchmaking.',
      detail:
        'Transform an operational business into a market leader. Access structured consulting for factory expansion, technology modernizations, branding overhauls, and corporate partnerships.',
      icon: RocketIcon,
      actionText: 'Request Scaling Support',
      link: '/business-development',
      highlightBadge: 'Growth & Expansion'
    },
    {
      id: 2,
      title: 'Universal Services Marketplace',
      shortDesc: 'Discover verified corporate services across all 10 sectors with 100% provider contact privacy.',
      detail:
        'Every verified member can browse listings across manufacturing, legal, IT, logistics, and agriculture. FIC coordinates all quotes and proposals, protecting provider numbers from spam.',
      icon: BriefcaseIcon,
      actionText: 'Browse Universal Marketplace',
      link: '/marketplace',
      highlightBadge: 'Privacy-First Marketplace'
    },
    {
      id: 3,
      title: 'Investment & Funding Connections',
      shortDesc: 'Private capital matching for growth-stage ventures, angel syndicates, and seed seekers.',
      detail:
        'Privately submit funding appetite or investment criteria. FIC Verification Executives facilitate confidential introductions between vetted investors and promising enterprises with zero public exposure.',
      icon: TrendingUpIcon,
      actionText: 'Explore Private Funding',
      link: '/investment',
      highlightBadge: 'Confidential Syndicates'
    },
    {
      id: 4,
      title: 'Business Partnerships & Tie-ups',
      shortDesc: 'Strategic joint ventures, distribution tie-ups, manufacturing agreements, and B2B introductions.',
      detail:
        'Find regional distributors, factory co-packers, wholesale partners, and authorized franchisees through FIC-verified corporate matchmaking.',
      icon: HandshakeIcon,
      actionText: 'Explore Strategic Tie-ups',
      link: '/partnerships',
      highlightBadge: 'B2B Collaborations'
    },
    {
      id: 5,
      title: 'Professional Networking',
      shortDesc: 'High-trust ecosystem access connecting genuine decision-makers without unsolicited marketing spam.',
      detail:
        'Every participating member is authenticated with verified identity and legal 18+ eligibility. Network with verified founders, CAs, engineers, and executives with confidence.',
      icon: UsersIcon,
      actionText: 'Connect with Members',
      link: '/get-started',
      highlightBadge: 'Authenticated Members'
    },
    {
      id: 6,
      title: 'Mentoring & Knowledge Sharing',
      shortDesc: 'Connect with experienced business leaders for strategic guidance and industry mentorship.',
      detail:
        'Bridge knowledge gaps with industry veterans, senior researchers, and corporate advisors who provide structured consultations to scale your operations.',
      icon: GraduationCapIcon,
      actionText: 'Find Industry Mentors',
      link: '/get-started',
      highlightBadge: 'Executive Advisory'
    }
  ];

  // 4-Step Process (Section 5)
  const HOW_IT_WORKS_STEPS = [
    {
      step: '01',
      title: 'Join FIC Business Hub',
      desc: 'Sign up in 45 seconds, confirm 18+ legal adult eligibility, and configure your credentials.',
      time: '~45 secs',
      icon: UserIcon
    },
    {
      step: '02',
      title: 'Complete Membership & Verification',
      desc: 'Activate 365 days of full ecosystem access with the transparent ₹99 pass and attach category proof.',
      time: '~2 mins',
      icon: ShieldCheckIcon
    },
    {
      step: '03',
      title: 'Explore Opportunities & Submit Requests',
      desc: 'Browse privacy-safe services, pitch business concepts, or indicate funding requirements.',
      time: 'Instant',
      icon: SparklesIcon
    },
    {
      step: '04',
      title: 'FIC Coordinates Relevant Connections',
      desc: 'Dedicated FIC officers review requirements, coordinate with providers, and track proposal execution.',
      time: '24h SLA',
      icon: HandshakeIcon
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
      title: 'Multiple Business Opportunities',
      desc: 'Cross-pollination of B2B tie-ups, commercial contracts, private investments, and strategic mentorship all under one roof.',
      icon: RocketIcon
    },
    {
      title: 'Cross-Category Discovery',
      desc: 'Every verified member can freely discover services and suppliers across all 10 sectors, regardless of their own primary domain.',
      icon: SparklesIcon
    },
    {
      title: 'Coordinated Business Connections',
      desc: 'Dedicated FIC officers mediate communications and proposals, ensuring serious requirements and zero unsolicited spam.',
      icon: HandshakeIcon
    },
    {
      title: 'Professional Networking',
      desc: 'An authenticated, high-trust directory where every participant is legally verified and identity-confirmed.',
      icon: UsersIcon
    },
    {
      title: 'Verified Member Participation',
      desc: 'Strict category-specific KYC verification safeguards legitimate business enterprises and ensures peace of mind.',
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
    <div className="bg-[#0B1020] text-slate-100 min-h-screen selection:bg-blue-600 selection:text-white">
      {/* ========================================================
          SECTION 1 – HERO (FULL-SCREEN & VISUALLY IMPRESSIVE)
         ======================================================== */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0B1020] via-[#111B35] to-[#0B1020] pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Subtle animated background grid & glowing ambient lighting */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#5278FF_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Abstract 3D Network Connecting SVG Lines in Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            <line x1="150" y1="200" x2="400" y2="350" stroke="#5278FF" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="400" y1="350" x2="800" y2="250" stroke="#315BDB" strokeWidth="1" strokeDasharray="6 6" />
            <line x1="800" y1="250" x2="1050" y2="450" stroke="#D6AE55" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="400" y1="350" x2="600" y2="550" stroke="#5278FF" strokeWidth="1" />
            <line x1="600" y1="550" x2="900" y2="600" stroke="#315BDB" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="150" cy="200" r="4" fill="#5278FF" className="animate-pulse" />
            <circle cx="400" cy="350" r="6" fill="#315BDB" />
            <circle cx="800" cy="250" r="5" fill="#D6AE55" />
            <circle cx="1050" cy="450" r="4" fill="#5278FF" />
            <circle cx="600" cy="550" r="5" fill="#5278FF" />
            <circle cx="900" cy="600" r="4" fill="#315BDB" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8 animate-in fade-in duration-700">
          {/* Executive Introductory Pass Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/40 border border-blue-500/40 text-blue-300 text-xs font-semibold tracking-wider uppercase shadow-lg shadow-blue-900/20">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span>First-Year Introductory Access • Flat ₹99 / Year</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Connect. Collaborate. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-[#D6AE55]">
              Build Your Business Future.
            </span>
          </h1>

          {/* Supporting Subtitle */}
          <p className="text-base sm:text-xl text-[#AAB4C8] max-w-3xl mx-auto font-normal leading-relaxed">
            One powerful ecosystem connecting entrepreneurs, businesses, investors, professionals, mentors and opportunities — all through FIC Business Hub.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a href="#capabilities">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-4 bg-[#315BDB] hover:bg-[#5278FF] text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
              >
                Explore Business Hub
                <ArrowRightIcon className="ml-2" size={18} />
              </Button>
            </a>

            <Link to="/get-started">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 py-4 text-white border-slate-700 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-500 font-semibold text-sm transition-all"
              >
                Become a Member
              </Button>
            </Link>
          </div>

          {/* Floating Professional Network Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-10 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheckIcon size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Verified 18+ Trust</span>
                <span className="text-[11px] text-slate-400">KYC Authenticated</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                <BriefcaseIcon size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">10 Core Sectors</span>
                <span className="text-[11px] text-slate-400">Indian Industries</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                <LockIcon size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">100% Privacy</span>
                <span className="text-[11px] text-slate-400">Zero Unsolicited Spam</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <SparklesIcon size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-400 block">₹99 First Year</span>
                <span className="text-[11px] text-slate-400">Transparent Access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 2 – ABOUT FIC BUSINESS HUB
         ======================================================== */}
      <section id="about" className="py-20 sm:py-28 bg-[#111B35]/70 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                Ecosystem Architecture
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
                More Than a Platform. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                  A Complete Business Ecosystem.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-[#AAB4C8] leading-relaxed">
                FIC Business Hub is not another unmoderated social network or static classifieds board. We are a coordinated, verified ecosystem that unifies enterprise opportunities across 10 vital sectors of the Indian economy.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <HandshakeIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Central Intermediary Coordination</h3>
                    <p className="text-xs text-[#AAB4C8] mt-0.5 leading-relaxed">
                      FIC dedicated officers actively review service requests, qualify specifications, and mediate introductions to protect members from unsolicited spam.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <BriefcaseIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Category-Specific Workspaces</h3>
                    <p className="text-xs text-[#AAB4C8] mt-0.5 leading-relaxed">
                      Whether you operate a textile factory, run a tech startup, or practice as a Chartered Accountant, your member dashboard adapts to your specific industry requirements.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <LockIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Universal Discovery with Strict Privacy</h3>
                    <p className="text-xs text-[#AAB4C8] mt-0.5 leading-relaxed">
                      Every verified member can freely discover services across all sectors, but provider personal contacts and financial amounts are never disclosed to the public.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual Ecosystem Graphic */}
            <div className="lg:col-span-6">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0B1020] via-slate-900 to-[#111B35] border border-slate-700/80 shadow-2xl relative overflow-hidden text-center space-y-6">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-600/30 font-black text-xl">
                  FIC
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">Central Ecosystem Nexus</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Verified governance ensuring authenticated interactions between all stakeholders.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-left">
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[10px] text-blue-400 font-bold uppercase block mb-1">01 • Verification</span>
                    <strong className="text-white block">Identity & 18+ Adult KYC</strong>
                    <span className="text-slate-400 text-[11px]">Authenticated business members</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">02 • Access</span>
                    <strong className="text-white block">10 Integrated Sectors</strong>
                    <span className="text-slate-400 text-[11px]">Universal service exploration</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">03 • Coordination</span>
                    <strong className="text-white block">FIC Mediated Deals</strong>
                    <span className="text-slate-400 text-[11px]">Proposals & requirements matched</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[10px] text-purple-400 font-bold uppercase block mb-1">04 • Capital</span>
                    <strong className="text-white block">Confidential Funding</strong>
                    <span className="text-slate-400 text-[11px]">Private investment connections</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to="/get-started">
                    <span className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors">
                      Learn how FIC coordinates connections <ArrowRightIcon size={14} />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 3 – WHO CAN JOIN?
         ======================================================== */}
      <section id="who-can-join" className="py-20 sm:py-28 bg-[#0B1020] border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/20">
              Community Inclusivity
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Who Can Join FIC Business Hub?
            </h2>
            <p className="text-sm sm:text-base text-[#AAB4C8] leading-relaxed">
              An authenticated, legal-adult (18+) ecosystem engineered for 8 key economic segments across India.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHO_CAN_JOIN.map((item, idx) => {
              const IconComp = item.icon;

              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 ${item.accent} flex flex-col justify-between`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 text-blue-400 flex items-center justify-center shadow-sm">
                        <IconComp size={22} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-[#AAB4C8] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80">
                    <Link to="/get-started" className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition-colors">
                      Explore Segment Opportunities <ArrowRightIcon size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 4 – WHAT CAN YOU DO? (MAJOR CAPABILITIES)
         ======================================================== */}
      <section id="capabilities" className="py-20 sm:py-28 bg-[#111B35]/70 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/20">
              Ecosystem Features
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              What Can You Do in FIC Business Hub?
            </h2>
            <p className="text-sm sm:text-base text-[#AAB4C8] leading-relaxed">
              Seven core capabilities empowering members to grow, partner, and capitalize on opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES.map((cap) => {
              const IconComp = cap.icon;
              const isActive = activeCapability === cap.id;

              return (
                <div
                  key={cap.id}
                  onClick={() => setActiveCapability(cap.id)}
                  className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-gradient-to-br from-slate-900 to-blue-950/80 border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.01]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <IconComp size={22} />
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {cap.highlightBadge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {cap.title}
                    </h3>

                    <p className="text-xs text-[#AAB4C8] leading-relaxed">
                      {cap.shortDesc}
                    </p>

                    <p className="text-xs text-slate-300/80 leading-relaxed border-t border-slate-800/80 pt-3">
                      {cap.detail}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                    <Link to={cap.link} className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors">
                      {cap.actionText} <ArrowRightIcon size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 5 – HOW FIC WORKS (4-STEP PROCESS)
         ======================================================== */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-[#0B1020] border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/20">
              Structured Journey
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              How FIC Works
            </h2>
            <p className="text-sm sm:text-base text-[#AAB4C8] leading-relaxed">
              A structured 4-step journey ensuring trust, privacy, and successful business connections.
            </p>
          </div>

          {/* Desktop Horizontal Timeline & Mobile Vertical Timeline */}
          <div className="relative">
            {/* Horizontal timeline connector bar on desktop */}
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 -translate-y-1/2 hidden lg:block -z-0"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {HOW_IT_WORKS_STEPS.map((s, idx) => {
                const IconComp = s.icon;

                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-[#111B35] border border-slate-800 shadow-lg hover:border-blue-500/50 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                          Step {s.step}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">{s.time}</span>
                      </div>

                      <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                        <IconComp size={22} />
                      </div>

                      <h3 className="text-base font-bold text-white leading-snug">
                        {s.title}
                      </h3>

                      <p className="text-xs text-[#AAB4C8] leading-relaxed">
                        {s.desc}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
                      ✓ Coordinated via FIC Ecosystem
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center pt-2">
            <Link to="/get-started">
              <Button size="lg" className="px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/20">
                Begin Onboarding Journey
                <ArrowRightIcon className="ml-2" size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 6 – ONE ECOSYSTEM, MULTIPLE OPPORTUNITIES
         ======================================================== */}
      <section id="ecosystem" className="py-20 sm:py-28 bg-[#111B35]/70 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/20">
              Interconnected Network
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              One Ecosystem. Multiple Opportunities.
            </h2>
            <p className="text-sm sm:text-base text-[#AAB4C8] leading-relaxed">
              Entrepreneurs, businesses, investors, professionals, mentors, and opportunities — collaborating in one mutual growth cycle.
            </p>
          </div>

          {/* Interconnected Modern Ecosystem Diagram */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0B1020] via-slate-900 to-[#0B1020] border border-slate-700/80 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto font-bold text-xs">
                  01
                </div>
                <h3 className="text-xs font-bold text-white">Entrepreneurs</h3>
                <p className="text-[11px] text-slate-400">Pitch ideas & seek early validation</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto font-bold text-xs">
                  02
                </div>
                <h3 className="text-xs font-bold text-white">Businesses</h3>
                <p className="text-[11px] text-slate-400">Scale operations & supply chains</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto font-bold text-xs">
                  03
                </div>
                <h3 className="text-xs font-bold text-white">Investors</h3>
                <p className="text-[11px] text-slate-400">Confidential growth capital deals</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto font-bold text-xs">
                  04
                </div>
                <h3 className="text-xs font-bold text-white">Professionals</h3>
                <p className="text-[11px] text-slate-400">Execute verified corporate services</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                <div className="w-10 h-10 rounded-full bg-teal-600/20 text-teal-400 flex items-center justify-center mx-auto font-bold text-xs">
                  05
                </div>
                <h3 className="text-xs font-bold text-white">Mentors</h3>
                <p className="text-[11px] text-slate-400">Strategic advisory & guidance</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center mx-auto font-bold text-xs">
                  ★
                </div>
                <h3 className="text-xs font-bold text-emerald-300">Opportunities</h3>
                <p className="text-[11px] text-emerald-400/80">Continuous ecosystem growth</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <span className="text-xs text-slate-400">
                Coordinated by FIC Verification Executives • Zero Spam • Guaranteed Privacy
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 7 – MEMBERSHIP (HONEST & TRANSPARENT PRICING)
         ======================================================== */}
      <section id="membership" className="py-20 sm:py-28 bg-[#0B1020] border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D6AE55] bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/20">
              Fair & Predictable Terms
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Membership Structure
            </h2>
            <p className="text-sm sm:text-base text-[#AAB4C8] leading-relaxed">
              Transparent access across all 10 business sectors. No fake discounts, countdown timers, or hidden platform fees.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* First-Year Introductory Pass (with subtle breathing zoom animation) */}
            <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#111B35] to-slate-900 border-2 border-[#D6AE55]/60 shadow-2xl relative overflow-hidden animate-zoom-in-out flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#D6AE55]">
                    Introductory Access Pass
                  </span>
                  <Badge variant="warning">All 10 Sectors</Badge>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-[#D6AE55]">₹99</span>
                  <span className="text-xs text-slate-300 font-medium">/ first 365 days</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Special introductory ecosystem onboarding pass. Universal discovery across all 10 sectors with full member privileges.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>Universal Services Marketplace Discovery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>Business Ideas & Incubation Desk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>Confidential Investment & Funding Channel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>GST and transaction fee included</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <Link to="/get-started" className="block">
                  <Button size="lg" className="w-full bg-[#315BDB] hover:bg-[#5278FF] text-white font-bold text-sm shadow-xl shadow-blue-600/30">
                    Get Started at ₹99
                    <ArrowRightIcon className="ml-2" size={16} />
                  </Button>
                </Link>
                <span className="text-[11px] text-slate-400 block text-center mt-2">
                  Subject to 18+ adult confirmation & category KYC approval
                </span>
              </div>
            </div>

            {/* Standard Annual Renewal */}
            <div className="p-7 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Standard Renewal
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Year 2 Onwards</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white">₹5,999</span>
                  <span className="text-xs text-slate-400 font-medium">/ year</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Predictable annual membership renewal. Sustains ongoing FIC coordination, KYC verification maintenance, and enterprise tools.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-slate-500 shrink-0" />
                    <span>Continued Universal Services Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-slate-500 shrink-0" />
                    <span>Dedicated Institutional Introductions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-slate-500 shrink-0" />
                    <span>No surprise price escalations or lock-ins</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800 text-xs text-slate-400 text-center">
                <span>🛡 Predictable enterprise governance terms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 8 – WHY CHOOSE FIC?
         ======================================================== */}
      <section id="why-fic" className="py-20 sm:py-28 bg-[#111B35]/70 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/20">
              Institutional Advantage
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Why Choose FIC Business Hub?
            </h2>
            <p className="text-sm sm:text-base text-[#AAB4C8] leading-relaxed">
              Engineered from the ground up for privacy, authenticated trust, and verified commercial success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_FIC_PILLARS.map((pillar, idx) => {
              const IconComp = pillar.icon;

              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconComp size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-[#AAB4C8] leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQs Accordion within Trust Section */}
          <div className="max-w-3xl mx-auto pt-10 space-y-4">
            <h3 className="text-xl font-bold text-white text-center mb-6">
              Frequently Asked Questions
            </h3>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;

              return (
                <div
                  key={idx}
                  className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 text-sm font-bold text-white hover:text-blue-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-blue-400 text-lg font-mono">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-[#AAB4C8] leading-relaxed border-t border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 9 – FINAL CTA
         ======================================================== */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-[#0B1020] via-slate-950 to-[#0B1020] border-t border-slate-800 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            Official Access Invitation
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Your Next Business Opportunity <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#D6AE55]">
              Starts Here.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-[#AAB4C8] max-w-2xl mx-auto leading-relaxed">
            Join a growing ecosystem designed to connect people, ideas, businesses and opportunities.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/get-started">
              <Button
                size="lg"
                className="w-full sm:w-auto px-10 py-4 bg-[#315BDB] hover:bg-[#5278FF] text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
              >
                Get Started
                <ArrowRightIcon className="ml-2" size={18} />
              </Button>
            </Link>

            <a href="#capabilities">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 py-4 text-white border-slate-700 bg-slate-900/60 hover:bg-slate-800 font-semibold text-sm transition-all"
              >
                Explore FIC Business Hub
              </Button>
            </a>
          </div>

          <p className="text-xs text-slate-500 pt-4">
            Questions? Contact our coordination desk at{' '}
            <a href="mailto:support@ficapp.in" className="text-blue-400 hover:underline">
              support@ficapp.in
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};
