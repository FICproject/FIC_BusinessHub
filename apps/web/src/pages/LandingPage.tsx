import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser, fetchPlatformPricingConfig } from '../services/api';
import {
  BriefcaseIcon,
  LightbulbIcon,
  TrendingUpIcon,
  GraduationCapIcon,
  HandshakeIcon,
  ShieldCheckIcon,
  UserIcon,
  RocketIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '../components/Icons';

export const LandingPage: React.FC = () => {
  const user = getStoredUser();

  const [platformPricing, setPlatformPricing] = useState({
    firstYearMembershipFee: 99,
    renewalMembershipFee: 5999
  });

  useEffect(() => {
    fetchPlatformPricingConfig()
      .then((cfg) => {
        if (cfg) {
          setPlatformPricing({
            firstYearMembershipFee: cfg.firstYearMembershipFee,
            renewalMembershipFee: cfg.renewalMembershipFee
          });
        }
      })
      .catch((err) => console.warn('Pricing config load note:', err));
  }, []);

  return (
    <div id="home" className="w-full bg-[#FAF8F5] text-[#2D2520] selection:bg-[#4F46E5] selection:text-white">
      {/* =========================================================================
          SECTION 1: HERO SECTION
          Two-column simple layout communicating the core purpose of FIC immediately
         ========================================================================= */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden border-b border-[#E8E2D9]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Heading, Description & Action Buttons */}
            <div className="lg:col-span-7 space-y-6">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E2D9] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse" />
                <span className="text-[11.5px] font-bold text-[#574D45] tracking-wide uppercase">
                  Verified B2B & Opportunity Ecosystem
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-[#2D2520] tracking-tight leading-[1.15]">
                Grow Your Business with{' '}
                <span className="text-[#4F46E5]">FIC Business Hub</span>
              </h1>

              {/* Core Description */}
              <p className="text-base sm:text-lg text-[#574D45] leading-relaxed max-w-2xl font-normal">
                A trusted business ecosystem connecting entrepreneurs, MSMEs, professionals, mentors, and students to discover opportunities, access services, and grow together.
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to={user ? '/dashboard' : '/register'}>
                  <button
                    type="button"
                    className="px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{user ? 'Go to Dashboard' : 'Become a Member'}</span>
                    <ArrowRightIcon size={16} />
                  </button>
                </Link>

                <a href="#services">
                  <button
                    type="button"
                    className="px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-[#2D2520] bg-white border border-[#E8E2D9] hover:bg-[#FAF8F5] hover:border-[#D9D1C5] transition-all cursor-pointer"
                  >
                    Learn More
                  </button>
                </a>
              </div>

              {/* Trust & Verification Safeguards */}
              <div className="pt-4 border-t border-[#E8E2D9]/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#73685F]">
                <div className="flex items-center gap-1.5">
                  <CheckCircleIcon size={15} className="text-[#15803D]" />
                  <span>Mandatory Sector KYC Verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheckIcon size={15} className="text-[#4F46E5]" />
                  <span>Confidential Intermediary Privacy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircleIcon size={15} className="text-[#15803D]" />
                  <span>Indian MSME & Enterprise Network</span>
                </div>
              </div>
            </div>

            {/* Right Column: Clean, Single Business Image */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E8E2D9] bg-white shadow-sm">
                <img
                  src="/hero-business.jpg"
                  alt="Entrepreneurs and professionals collaborating at FIC Business Hub"
                  className="w-full h-[320px] sm:h-[400px] lg:h-[440px] object-cover object-center"
                  loading="eager"
                  onError={(e) => {
                    // Fallback to collab option if first image fails
                    const target = e.currentTarget;
                    if (!target.src.includes('hero-business-collab')) {
                      target.src = '/hero-business-collab.jpg';
                    }
                  }}
                />
                {/* Subtle Clean Caption */}
                <div className="p-4 bg-white/95 backdrop-blur-xs border-t border-[#E8E2D9] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#2D2520]">FIC Ecosystem Collaboration</p>
                    <p className="text-[11px] text-[#73685F]">Verified Indian entrepreneurs, MSMEs & advisors</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5] bg-[#4F46E5]/10 px-2.5 py-1 rounded-full border border-[#4F46E5]/20">
                    Trusted Hub
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: WHAT YOU CAN DO ON FIC
          Six simple, clean service cards accurately representing project modules
         ========================================================================= */}
      <section id="services" className="py-16 md:py-24 bg-white border-b border-[#E8E2D9]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="max-w-2xl mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">
              Core Ecosystem Services
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#2D2520] tracking-tight mt-1.5">
              What You Can Do on FIC
            </h2>
            <p className="text-sm sm:text-base text-[#574D45] mt-2.5 leading-relaxed">
              Explore six core capability areas designed to connect, validate, and scale your business ventures within a structured, confidential ecosystem.
            </p>
          </div>

          {/* 6 Simple Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Marketplace */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs hover:shadow-md hover:border-[#D9D1C5] transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#4F46E5]">
                  <BriefcaseIcon size={22} />
                </div>
                <h3 className="text-lg font-bold text-[#2D2520]">Marketplace</h3>
                <p className="text-xs sm:text-sm text-[#574D45] leading-relaxed">
                  Discover products and professional services.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-[#E8E2D9]/60">
                <Link
                  to={user ? '/marketplace' : '/register'}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                >
                  <span>Learn More</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>
            </div>

            {/* 2. Business Ideas */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs hover:shadow-md hover:border-[#D9D1C5] transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#D97706]">
                  <LightbulbIcon size={22} />
                </div>
                <h3 className="text-lg font-bold text-[#2D2520]">Business Ideas</h3>
                <p className="text-xs sm:text-sm text-[#574D45] leading-relaxed">
                  Submit ideas and explore incubation support.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-[#E8E2D9]/60">
                <Link
                  to={user ? '/business-ideas' : '/register'}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                >
                  <span>Learn More</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>
            </div>

            {/* 3. Business Growth */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs hover:shadow-md hover:border-[#D9D1C5] transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#15803D]">
                  <TrendingUpIcon size={22} />
                </div>
                <h3 className="text-lg font-bold text-[#2D2520]">Business Growth</h3>
                <p className="text-xs sm:text-sm text-[#574D45] leading-relaxed">
                  Explore business development and scaling support.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-[#E8E2D9]/60">
                <Link
                  to={user ? '/business-development' : '/register'}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                >
                  <span>Learn More</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>
            </div>

            {/* 4. Funding & Investment */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs hover:shadow-md hover:border-[#D9D1C5] transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#6D28D9]">
                  <svg className="w-5 h-5 text-[#6D28D9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#2D2520]">Funding & Investment</h3>
                <p className="text-xs sm:text-sm text-[#574D45] leading-relaxed">
                  Explore funding and investment opportunities through FIC.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-[#E8E2D9]/60">
                <Link
                  to={user ? '/investment' : '/register'}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                >
                  <span>Learn More</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>
            </div>

            {/* 5. Skill Development */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs hover:shadow-md hover:border-[#D9D1C5] transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#0284C7]">
                  <GraduationCapIcon size={22} />
                </div>
                <h3 className="text-lg font-bold text-[#2D2520]">Skill Development</h3>
                <p className="text-xs sm:text-sm text-[#574D45] leading-relaxed">
                  Discover training, masterclasses, and mentorship.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-[#E8E2D9]/60">
                <Link
                  to={user ? '/skill-development' : '/register'}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                >
                  <span>Learn More</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>
            </div>

            {/* 6. Meetings */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs hover:shadow-md hover:border-[#D9D1C5] transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#E06D53]">
                  <HandshakeIcon size={22} />
                </div>
                <h3 className="text-lg font-bold text-[#2D2520]">Meetings</h3>
                <p className="text-xs sm:text-sm text-[#574D45] leading-relaxed">
                  Participate in FIC-coordinated business consultations.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-[#E8E2D9]/60">
                <Link
                  to={user ? '/meetings' : '/register'}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                >
                  <span>Learn More</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: HOW IT WORKS
          Three simple connected steps for first-time visitors
         ========================================================================= */}
      <section id="how-it-works" className="py-16 md:py-24 bg-[#FAF8F5] border-b border-[#E8E2D9]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">
              Quick Onboarding Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#2D2520] tracking-tight mt-1.5">
              How It Works
            </h2>
            <p className="text-sm sm:text-base text-[#574D45] mt-2 leading-relaxed">
              Join the ecosystem in three transparent steps designed to safeguard authentic businesses.
            </p>
          </div>

          {/* Three Connected Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1: Register */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs relative text-center flex flex-col items-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center font-bold text-lg border border-[#4F46E5]/20">
                <UserIcon size={26} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#4F46E5] bg-[#4F46E5]/10 px-3 py-0.5 rounded-full">
                Step 1
              </span>
              <h3 className="text-xl font-bold text-[#2D2520]">Register</h3>
              <p className="text-xs sm:text-sm text-[#574D45] leading-relaxed max-w-xs">
                Create your FIC account.
              </p>
            </div>

            {/* Step 2: Verify */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs relative text-center flex flex-col items-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#15803D]/10 text-[#15803D] flex items-center justify-center font-bold text-lg border border-[#15803D]/20">
                <ShieldCheckIcon size={26} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#15803D] bg-[#15803D]/10 px-3 py-0.5 rounded-full">
                Step 2
              </span>
              <h3 className="text-xl font-bold text-[#2D2520]">Verify</h3>
              <p className="text-xs sm:text-sm text-[#574D45] leading-relaxed max-w-xs">
                Complete your KYC verification.
              </p>
            </div>

            {/* Step 3: Explore */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs relative text-center flex flex-col items-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center font-bold text-lg border border-[#D97706]/20">
                <RocketIcon size={26} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#D97706] bg-[#D97706]/10 px-3 py-0.5 rounded-full">
                Step 3
              </span>
              <h3 className="text-xl font-bold text-[#2D2520]">Explore</h3>
              <p className="text-xs sm:text-sm text-[#574D45] leading-relaxed max-w-xs">
                Access available services and opportunities.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: MEMBERSHIP PLANS
          Three cards: Silver, Gold, Diamond (utilizing real platform pricing)
         ========================================================================= */}
      <section id="membership" className="py-16 md:py-24 bg-white border-b border-[#E8E2D9]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">
              Straightforward Membership
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#2D2520] tracking-tight mt-1.5">
              Membership Plans
            </h2>
            <p className="text-sm sm:text-base text-[#574D45] mt-2 leading-relaxed">
              Transparent access designed for verified business operators. Compare plans and choose your gateway into the FIC ecosystem.
            </p>
          </div>

          {/* Three Membership Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* Card 1: Silver Plan */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-[#2D2520]">Silver</h3>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#73685F] border border-[#E8E2D9]">
                    Introductory
                  </span>
                </div>
                <p className="text-xs text-[#574D45] leading-relaxed">
                  Essential entry access for new entrepreneurs and emerging enterprises.
                </p>
                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#2D2520]">
                    ₹{platformPricing.firstYearMembershipFee}
                  </span>
                  <span className="text-xs text-[#73685F] font-medium">/ 1st year access</span>
                </div>

                <div className="pt-4 border-t border-[#E8E2D9] space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#73685F] block">
                    Included Benefits:
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#574D45]">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Full access across all 10 core business sectors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Confidential service requests via FIC intermediary desk</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Business ideas submission & validation support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Standard sector KYC verification & profile credentials</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Link to="/register">
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white border border-[#2D2520] text-[#2D2520] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    Get Started (₹{platformPricing.firstYearMembershipFee})
                  </button>
                </Link>
                <div className="text-center">
                  <Link
                    to="/membership"
                    className="text-[11.5px] font-bold text-[#4F46E5] hover:underline"
                  >
                    View Benefits &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Gold Plan (Highlighted / Most Popular) */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#FAF8F5] border-2 border-[#4F46E5] shadow-sm flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4F46E5] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                Most Popular
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-[#2D2520]">Gold</h3>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#4F46E5]/10 text-[#4F46E5]">
                    Growth & Scaling
                  </span>
                </div>
                <p className="text-xs text-[#574D45] leading-relaxed">
                  Comprehensive scaling support for active commercial entities and growing MSMEs.
                </p>
                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#2D2520]">
                    ₹{platformPricing.renewalMembershipFee.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#73685F] font-medium">/ year annual renewal</span>
                </div>

                <div className="pt-4 border-t border-[#E8E2D9] space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#73685F] block">
                    Everything in Silver, plus:
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#574D45]">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Priority queue in FIC proposal & meeting coordination</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Direct incubation roadmap & consultation advisory</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Unlimited proposal submissions & verified investor queries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Priority discovery status across universal marketplace</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Link to="/register">
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-xs transition-colors cursor-pointer"
                  >
                    Join as Gold Member
                  </button>
                </Link>
                <div className="text-center">
                  <Link
                    to="/membership"
                    className="text-[11.5px] font-bold text-[#4F46E5] hover:underline"
                  >
                    View Benefits &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 3: Diamond Plan */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-[#2D2520]">Diamond</h3>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#73685F] border border-[#E8E2D9]">
                    Enterprise Tier
                  </span>
                </div>
                <p className="text-xs text-[#574D45] leading-relaxed">
                  Tailored corporate ecosystem coordination for high-growth enterprises and investors.
                </p>
                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#2D2520]">
                    Enterprise
                  </span>
                  <span className="text-xs text-[#73685F] font-medium">/ custom onboarding</span>
                </div>

                <div className="pt-4 border-t border-[#E8E2D9] space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#73685F] block">
                    Everything in Gold, plus:
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#574D45]">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Dedicated senior FIC relationship coordinator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Priority private funding & investor desk facilitation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Specialized enterprise scaling & strategic advisory</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                      <span>Institutional onboarding & corporate governance support</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Link to="/contact">
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white border border-[#2D2520] text-[#2D2520] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    Contact Enterprise Desk
                  </button>
                </Link>
                <div className="text-center">
                  <Link
                    to="/membership"
                    className="text-[11.5px] font-bold text-[#4F46E5] hover:underline"
                  >
                    View Benefits &rarr;
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: SIMPLE PRE-FOOTER CALL TO ACTION
         ========================================================================= */}
      <section className="py-14 sm:py-16 bg-[#FAF8F5]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E8E2D9] text-center max-w-3xl mx-auto shadow-xs space-y-5">
            <h2 className="text-2xl sm:text-3xl font-black text-[#2D2520] tracking-tight">
              Ready to Join the FIC Business Ecosystem?
            </h2>
            <p className="text-sm sm:text-base text-[#574D45] leading-relaxed max-w-xl mx-auto">
              Connect with verified entrepreneurs, access essential business services, and discover new commercial opportunities.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/register">
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-xs transition-colors cursor-pointer"
                >
                  Become a Member
                </button>
              </Link>
              <Link to="/contact">
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl font-bold text-sm text-[#2D2520] bg-white border border-[#E8E2D9] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
