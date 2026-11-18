import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
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
  const shouldReduceMotion = useReducedMotion();

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

  // Standard animation ease and durations
  const transitionSmooth = {
    duration: 0.55,
    ease: [0.22, 1, 0.36, 1] as const
  };

  return (
    <div
      id="home"
      className="w-full bg-[#FAF7F2] text-[#51463F] selection:bg-[#6D28D9] selection:text-white relative overflow-hidden"
    >
      {/* =========================================================================
          BACKGROUND AMBIENT GLOWS & MESH (Phase 9)
          Light, subtle, non-intrusive ambient radial glows to make page feel premium
         ========================================================================= */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#EDE5FF]/50 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-48 right-[-100px] w-[450px] h-[450px] bg-[#E8795B]/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-[1200px] left-[-150px] w-[500px] h-[500px] bg-[#E5A23B]/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-[2200px] right-[-100px] w-[550px] h-[550px] bg-[#EDE5FF]/40 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* =========================================================================
          SECTION 1: HERO SECTION
          Two-column simple layout with professional page load animations
         ========================================================================= */}
      <section className="relative pt-12 pb-16 md:pt-18 md:pb-24 overflow-hidden border-b border-[#EDE2D7]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Heading, Description & Action Buttons */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Trust Badge with subtle pop entrance */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#EDE2D7] shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-[#1C6960] animate-pulse" />
                <span className="text-[11.5px] font-bold text-[#51463F] tracking-wide uppercase">
                  Verified B2B & Opportunity Ecosystem
                </span>
              </motion.div>

              {/* Main Heading with line-by-line reveal */}
              <motion.h1
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-3xl sm:text-5xl lg:text-5xl font-black text-[#51463F] tracking-tight leading-[1.15]"
              >
                <span>Grow Your Business with </span>
                <span className="bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#E8795B] bg-clip-text text-transparent">
                  FIC Business Hub
                </span>
              </motion.h1>

              {/* Core Description */}
              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="text-base sm:text-lg text-[#82776E] leading-relaxed max-w-2xl font-normal"
              >
                A trusted business ecosystem connecting entrepreneurs, MSMEs, professionals, mentors, and students to discover opportunities, access services, and grow together.
              </motion.p>

              {/* Primary Call to Action Buttons */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap items-center gap-3.5 pt-2"
              >
                <Link to={user ? '/dashboard' : '/register'}>
                  <motion.button
                    whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -1 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    type="button"
                    className="group px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#E8795B] text-white shadow-[0_4px_16px_rgba(109,40,217,0.25)] hover:shadow-[0_10px_25px_-4px_rgba(109,40,217,0.4)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{user ? 'Go to Dashboard' : 'Become a Member'}</span>
                    <ArrowRightIcon
                      size={16}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </motion.button>
                </Link>

                <a href="#services">
                  <motion.button
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -1 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    type="button"
                    className="px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-[#51463F] bg-white border border-[#EDE2D7] hover:border-[#6D28D9]/40 hover:bg-[#FAF7F2] hover:text-[#6D28D9] shadow-xs hover:shadow-sm transition-all cursor-pointer"
                  >
                    Learn More
                  </motion.button>
                </a>
              </motion.div>

              {/* Trust & Verification Safeguards */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="pt-4 border-t border-[#EDE2D7] flex flex-wrap items-center gap-y-2.5 gap-x-6 text-xs text-[#82776E]"
              >
                <div className="flex items-center gap-1.5 hover:text-[#51463F] transition-colors">
                  <CheckCircleIcon size={15} className="text-[#1C6960]" />
                  <span>Mandatory Sector KYC Verification</span>
                </div>
                <div className="flex items-center gap-1.5 hover:text-[#51463F] transition-colors">
                  <ShieldCheckIcon size={15} className="text-[#6D28D9]" />
                  <span>Confidential Intermediary Privacy</span>
                </div>
                <div className="flex items-center gap-1.5 hover:text-[#51463F] transition-colors">
                  <CheckCircleIcon size={15} className="text-[#1C6960]" />
                  <span>Indian MSME & Enterprise Network</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Clean, Single Business Image with entrance & hover reveal */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5"
            >
              <div className="group relative rounded-3xl overflow-hidden border border-[#EDE2D7] bg-white shadow-sm hover:shadow-xl transition-shadow duration-300">
                {/* Floating ambient badge in corner */}
                <div className="absolute top-3.5 right-3.5 z-10 bg-white/90 backdrop-blur-md border border-[#EDE2D7] px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E5A23B]" />
                  <span className="text-[10.5px] font-bold text-[#51463F] uppercase tracking-wider">
                    Verified Network
                  </span>
                </div>

                <div className="overflow-hidden">
                  <img
                    src="/hero-business.jpg"
                    alt="Entrepreneurs and professionals collaborating at FIC Business Hub"
                    className="w-full h-[320px] sm:h-[400px] lg:h-[440px] object-cover object-center group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                    loading="eager"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('hero-business-collab')) {
                        target.src = '/hero-business-collab.jpg';
                      }
                    }}
                  />
                </div>

                {/* Subtle Clean Caption */}
                <div className="p-4 bg-white/95 backdrop-blur-xs border-t border-[#EDE2D7] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#51463F]">FIC Ecosystem Collaboration</p>
                    <p className="text-[11px] text-[#82776E]">Verified Indian entrepreneurs, MSMEs & advisors</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D28D9] bg-[#EDE5FF] px-2.5 py-1 rounded-full border border-[#6D28D9]/20">
                    Trusted Hub
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: WHAT YOU CAN DO ON FIC (Phase 5)
          Six interactive service cards with entrance and micro-interactions
         ========================================================================= */}
      <section id="services" className="py-16 md:py-24 bg-white border-b border-[#EDE2D7] relative">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header with decorative underline reveal */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={transitionSmooth}
            className="max-w-2xl mb-12 sm:mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-[#6D28D9]">
              Core Ecosystem Services
            </span>
            <div className="relative inline-block mt-1.5">
              <h2 className="text-2xl sm:text-4xl font-black text-[#51463F] tracking-tight">
                What You Can Do on FIC
              </h2>
              {/* Subtle decorative underline reveal */}
              <motion.div
                initial={shouldReduceMotion ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0 }}
                className="h-[3px] bg-gradient-to-r from-[#6D28D9] to-[#E8795B] rounded-full mt-2 w-28"
              />
            </div>
            <p className="text-sm sm:text-base text-[#82776E] mt-3 leading-relaxed">
              Explore six core capability areas designed to connect, validate, and scale your business ventures within a structured, confidential ecosystem.
            </p>
          </motion.div>

          {/* 6 Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {[
              {
                id: 'marketplace',
                title: 'Marketplace',
                desc: 'Discover products and professional services.',
                route: '/marketplace',
                icon: <BriefcaseIcon size={22} />,
                accentColor: '#6D28D9',
                softBg: 'bg-[#EDE5FF]',
                borderColor: 'hover:border-[#6D28D9]/40',
                glowColor: 'group-hover:shadow-[rgba(109,40,217,0.08)]'
              },
              {
                id: 'business-ideas',
                title: 'Business Ideas',
                desc: 'Submit ideas and explore incubation support.',
                route: '/business-ideas',
                icon: <LightbulbIcon size={22} />,
                accentColor: '#E5A23B',
                softBg: 'bg-[#FEF3C7]',
                borderColor: 'hover:border-[#E5A23B]/50',
                glowColor: 'group-hover:shadow-[rgba(229,162,59,0.08)]'
              },
              {
                id: 'business-development',
                title: 'Business Growth',
                desc: 'Explore business development and scaling support.',
                route: '/business-development',
                icon: <TrendingUpIcon size={22} />,
                accentColor: '#1C6960',
                softBg: 'bg-[#CCFBF1]',
                borderColor: 'hover:border-[#1C6960]/40',
                glowColor: 'group-hover:shadow-[rgba(28,105,96,0.08)]'
              },
              {
                id: 'investment',
                title: 'Funding & Investment',
                desc: 'Explore funding and investment opportunities through FIC.',
                route: '/investment',
                icon: (
                  <svg className="w-5 h-5 text-[#6D28D9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                accentColor: '#6D28D9',
                softBg: 'bg-[#EDE5FF]',
                borderColor: 'hover:border-[#6D28D9]/40',
                glowColor: 'group-hover:shadow-[rgba(109,40,217,0.08)]'
              },
              {
                id: 'skill-development',
                title: 'Skill Development',
                desc: 'Discover training, masterclasses, and mentorship.',
                route: '/skill-development',
                icon: <GraduationCapIcon size={22} />,
                accentColor: '#E8795B',
                softBg: 'bg-[#FFE4E6]',
                borderColor: 'hover:border-[#E8795B]/40',
                glowColor: 'group-hover:shadow-[rgba(232,121,91,0.08)]'
              },
              {
                id: 'meetings',
                title: 'Meetings',
                desc: 'Participate in FIC-coordinated business consultations.',
                route: '/meetings',
                icon: <HandshakeIcon size={22} />,
                accentColor: '#51463F',
                softBg: 'bg-[#EDE5FF]',
                borderColor: 'hover:border-[#51463F]/40',
                glowColor: 'group-hover:shadow-[rgba(81,70,63,0.08)]'
              }
            ].map((card, idx) => (
              <motion.div
                key={card.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.45,
                  delay: idx * 0.08,
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={shouldReduceMotion ? {} : { y: -6 }}
                className={`group p-6 rounded-2xl bg-white border border-[#EDE2D7] ${card.borderColor} shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden`}
              >
                {/* Top Subtle Accent Strip on hover */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundColor: card.accentColor }}
                />

                <div className="space-y-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl ${card.softBg} border border-[#EDE2D7] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-1`}
                    style={{ color: card.accentColor }}
                  >
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#51463F] group-hover:text-[#6D28D9] transition-colors duration-200">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#82776E] leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-[#EDE2D7]">
                  <Link
                    to={user ? card.route : '/register'}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D28D9] hover:text-[#5B21B6] transition-colors"
                  >
                    <span>Learn More</span>
                    <ArrowRightIcon
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-1.5"
                    />
                  </Link>
                </div>
              </motion.div>
            ))}

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: HOW IT WORKS (Phase 6)
          Three connected steps with smooth flow line & sequential entrance
         ========================================================================= */}
      <section id="how-it-works" className="py-16 md:py-24 bg-[#FAF7F2] border-b border-[#EDE2D7] relative">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={transitionSmooth}
            className="text-center max-w-xl mx-auto mb-12 sm:mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8795B]">
              Quick Onboarding Process
            </span>
            <div className="relative inline-block mt-1.5">
              <h2 className="text-2xl sm:text-4xl font-black text-[#51463F] tracking-tight">
                How It Works
              </h2>
              {/* Centered decorative underline */}
              <motion.div
                initial={shouldReduceMotion ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="h-[3px] bg-gradient-to-r from-[#E8795B] via-[#E5A23B] to-[#6D28D9] rounded-full mt-2 w-20 mx-auto"
              />
            </div>
            <p className="text-sm sm:text-base text-[#82776E] mt-3 leading-relaxed">
              Join the ecosystem in three transparent steps designed to safeguard authentic businesses.
            </p>
          </motion.div>

          {/* Connected Steps Container */}
          <div className="relative">
            {/* Desktop Horizontal Connecting Progress Line (fills left-to-right) */}
            <div className="hidden md:block absolute top-[52px] left-[16%] right-[16%] h-[2px] bg-[#EDE2D7] -z-0">
              <motion.div
                initial={shouldReduceMotion ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0 }}
                className="h-full bg-gradient-to-r from-[#6D28D9] via-[#1C6960] to-[#E5A23B]"
              />
            </div>

            {/* Three Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              
              {/* Step 1: Register */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={shouldReduceMotion ? {} : { y: -5 }}
                className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EDE2D7] hover:border-[#6D28D9]/40 shadow-xs hover:shadow-lg transition-all duration-300 relative text-center flex flex-col items-center space-y-4 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#EDE5FF] text-[#6D28D9] flex items-center justify-center font-bold text-lg border border-[#6D28D9]/20 transition-transform duration-300 group-hover:scale-110 shadow-xs">
                  <UserIcon size={26} />
                </div>
                <motion.span
                  initial={shouldReduceMotion ? false : { scale: 0.8 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
                  className="text-[11px] font-black uppercase tracking-wider text-[#6D28D9] bg-[#EDE5FF] px-3 py-0.5 rounded-full"
                >
                  Step 1
                </motion.span>
                <h3 className="text-xl font-bold text-[#51463F] group-hover:text-[#6D28D9] transition-colors">
                  Register
                </h3>
                <p className="text-xs sm:text-sm text-[#82776E] leading-relaxed max-w-xs">
                  Create your FIC account.
                </p>
              </motion.div>

              {/* Step 2: Verify */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                whileHover={shouldReduceMotion ? {} : { y: -5 }}
                className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EDE2D7] hover:border-[#1C6960]/40 shadow-xs hover:shadow-lg transition-all duration-300 relative text-center flex flex-col items-center space-y-4 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#CCFBF1] text-[#1C6960] flex items-center justify-center font-bold text-lg border border-[#1C6960]/20 transition-transform duration-300 group-hover:scale-110 shadow-xs">
                  <ShieldCheckIcon size={26} />
                </div>
                <motion.span
                  initial={shouldReduceMotion ? false : { scale: 0.8 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.35 }}
                  className="text-[11px] font-black uppercase tracking-wider text-[#1C6960] bg-[#CCFBF1] px-3 py-0.5 rounded-full"
                >
                  Step 2
                </motion.span>
                <h3 className="text-xl font-bold text-[#51463F] group-hover:text-[#1C6960] transition-colors">
                  Verify
                </h3>
                <p className="text-xs sm:text-sm text-[#82776E] leading-relaxed max-w-xs">
                  Complete your KYC verification.
                </p>
              </motion.div>

              {/* Step 3: Explore */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                whileHover={shouldReduceMotion ? {} : { y: -5 }}
                className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EDE2D7] hover:border-[#E5A23B]/40 shadow-xs hover:shadow-lg transition-all duration-300 relative text-center flex flex-col items-center space-y-4 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FEF3C7] text-[#E5A23B] flex items-center justify-center font-bold text-lg border border-[#E5A23B]/30 transition-transform duration-300 group-hover:scale-110 shadow-xs">
                  <RocketIcon size={26} />
                </div>
                <motion.span
                  initial={shouldReduceMotion ? false : { scale: 0.8 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.5 }}
                  className="text-[11px] font-black uppercase tracking-wider text-[#E5A23B] bg-[#FEF3C7] px-3 py-0.5 rounded-full"
                >
                  Step 3
                </motion.span>
                <h3 className="text-xl font-bold text-[#51463F] group-hover:text-[#E5A23B] transition-colors">
                  Explore
                </h3>
                <p className="text-xs sm:text-sm text-[#82776E] leading-relaxed max-w-xs">
                  Access available services and opportunities.
                </p>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: MEMBERSHIP PLANS (Phase 7)
          Three cards: Silver, Gold, Diamond with real platform pricing & premium feel
         ========================================================================= */}
      <section id="membership" className="py-16 md:py-24 bg-white border-b border-[#EDE2D7]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={transitionSmooth}
            className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-[#6D28D9]">
              Straightforward Membership
            </span>
            <div className="relative inline-block mt-1.5">
              <h2 className="text-2xl sm:text-4xl font-black text-[#51463F] tracking-tight">
                Membership Plans
              </h2>
              {/* Centered decorative underline */}
              <motion.div
                initial={shouldReduceMotion ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="h-[3px] bg-gradient-to-r from-[#6D28D9] via-[#E8795B] to-[#E5A23B] rounded-full mt-2 w-24 mx-auto"
              />
            </div>
            <p className="text-sm sm:text-base text-[#82776E] mt-3 leading-relaxed">
              Transparent access designed for verified business operators. Compare plans and choose your gateway into the FIC ecosystem.
            </p>
          </motion.div>

          {/* Three Membership Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* Card 1: Silver Plan */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={shouldReduceMotion ? {} : { y: -6 }}
              className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EDE2D7] hover:border-[#51463F]/30 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-[#51463F]">Silver</h3>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#82776E] border border-[#EDE2D7]">
                    Introductory
                  </span>
                </div>
                <p className="text-xs text-[#82776E] leading-relaxed">
                  Essential entry access for new entrepreneurs and emerging enterprises.
                </p>
                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#51463F]">
                    ₹{platformPricing.firstYearMembershipFee}
                  </span>
                  <span className="text-xs text-[#82776E] font-medium">/ 1st year access</span>
                </div>

                <div className="pt-4 border-t border-[#EDE2D7] space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#82776E] block">
                    Included Benefits:
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#51463F]">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Full access across all 10 core business sectors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Confidential service requests via FIC intermediary desk</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Business ideas submission & validation support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Standard sector KYC verification & profile credentials</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Link to="/register">
                  <motion.button
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    type="button"
                    className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white border border-[#51463F] text-[#51463F] hover:bg-[#FAF7F2] hover:border-[#6D28D9] hover:text-[#6D28D9] transition-all cursor-pointer shadow-xs"
                  >
                    Get Started (₹{platformPricing.firstYearMembershipFee})
                  </motion.button>
                </Link>
                <div className="text-center">
                  <Link
                    to="/membership"
                    className="text-[11.5px] font-bold text-[#6D28D9] hover:underline"
                  >
                    View Benefits &rarr;
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Gold Plan (Highlighted / Most Popular) */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              whileHover={shouldReduceMotion ? {} : { y: -7 }}
              className="p-6 sm:p-8 rounded-2xl bg-[#FAF7F2] border-2 border-[#6D28D9] shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6 relative"
            >
              {/* Premium Most Popular Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#E8795B] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-[0_2px_8px_rgba(109,40,217,0.3)]">
                Most Popular
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-[#51463F]">Gold</h3>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EDE5FF] text-[#6D28D9] border border-[#6D28D9]/20">
                    Growth & Scaling
                  </span>
                </div>
                <p className="text-xs text-[#82776E] leading-relaxed">
                  Comprehensive scaling support for active commercial entities and growing MSMEs.
                </p>
                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#51463F]">
                    ₹{platformPricing.renewalMembershipFee.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#82776E] font-medium">/ year annual renewal</span>
                </div>

                <div className="pt-4 border-t border-[#EDE2D7] space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#82776E] block">
                    Everything in Silver, plus:
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#51463F]">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Priority queue in FIC proposal & meeting coordination</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Direct incubation roadmap & consultation advisory</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Unlimited proposal submissions & verified investor queries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Priority discovery status across universal marketplace</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Link to="/register">
                  <motion.button
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    type="button"
                    className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#E8795B] text-white shadow-[0_4px_14px_rgba(109,40,217,0.25)] hover:shadow-[0_8px_20px_-4px_rgba(109,40,217,0.4)] transition-all cursor-pointer"
                  >
                    Join as Gold Member
                  </motion.button>
                </Link>
                <div className="text-center">
                  <Link
                    to="/membership"
                    className="text-[11.5px] font-bold text-[#6D28D9] hover:underline"
                  >
                    View Benefits &rarr;
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Diamond Plan */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
              whileHover={shouldReduceMotion ? {} : { y: -6 }}
              className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EDE2D7] hover:border-[#51463F]/30 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-[#51463F]">Diamond</h3>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#82776E] border border-[#EDE2D7]">
                    Enterprise Tier
                  </span>
                </div>
                <p className="text-xs text-[#82776E] leading-relaxed">
                  Tailored corporate ecosystem coordination for high-growth enterprises and investors.
                </p>
                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#51463F]">
                    Enterprise
                  </span>
                  <span className="text-xs text-[#82776E] font-medium">/ custom onboarding</span>
                </div>

                <div className="pt-4 border-t border-[#EDE2D7] space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#82776E] block">
                    Everything in Gold, plus:
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#51463F]">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Dedicated senior FIC relationship coordinator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Priority private funding & investor desk facilitation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Specialized enterprise scaling & strategic advisory</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon size={15} className="text-[#1C6960] shrink-0 mt-0.5" />
                      <span>Institutional onboarding & corporate governance support</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Link to="/contact">
                  <motion.button
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    type="button"
                    className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white border border-[#51463F] text-[#51463F] hover:bg-[#FAF7F2] hover:border-[#6D28D9] hover:text-[#6D28D9] transition-all cursor-pointer shadow-xs"
                  >
                    Contact Enterprise Desk
                  </motion.button>
                </Link>
                <div className="text-center">
                  <Link
                    to="/membership"
                    className="text-[11.5px] font-bold text-[#6D28D9] hover:underline"
                  >
                    View Benefits &rarr;
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: SIMPLE PRE-FOOTER CALL TO ACTION (Phase 8 & 9)
         ========================================================================= */}
      <section className="py-14 sm:py-18 bg-[#FAF7F2] relative">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={transitionSmooth}
            className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-white to-[#EDE5FF]/30 border border-[#EDE2D7] text-center max-w-3xl mx-auto shadow-sm space-y-5 relative overflow-hidden"
          >
            {/* Ambient decorative glow inside CTA card */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8795B]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#6D28D9]/10 rounded-full blur-2xl pointer-events-none" />

            <h2 className="text-2xl sm:text-3xl font-black text-[#51463F] tracking-tight relative z-10">
              Ready to Join the FIC Business Ecosystem?
            </h2>
            <p className="text-sm sm:text-base text-[#82776E] leading-relaxed max-w-xl mx-auto relative z-10">
              Connect with verified entrepreneurs, access essential business services, and discover new commercial opportunities.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2 relative z-10">
              <Link to="/register">
                <motion.button
                  whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -1 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  type="button"
                  className="group px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#E8795B] text-white shadow-[0_4px_14px_rgba(109,40,217,0.25)] hover:shadow-[0_8px_20px_-4px_rgba(109,40,217,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Become a Member</span>
                  <ArrowRightIcon
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </motion.button>
              </Link>
              <Link to="/contact">
                <motion.button
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -1 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  type="button"
                  className="px-6 py-3 rounded-xl font-bold text-sm text-[#51463F] bg-white border border-[#EDE2D7] hover:border-[#6D28D9]/40 hover:bg-[#FAF7F2] hover:text-[#6D28D9] shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                  Contact Us
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
