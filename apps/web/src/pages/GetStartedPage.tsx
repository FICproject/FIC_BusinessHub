import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@fic/ui';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  LockIcon,
  BriefcaseIcon,
  SparklesIcon,
  FileTextIcon,
  UserIcon,
  CodeIcon,
  TrendingUpIcon
} from '../components/Icons';

export const GetStartedPage: React.FC = () => {
  // Tree structure step animation state: 0 = Phase 1, 1 = Phase 2, 2 = Phase 3, 3 = Phase 4, 4 = All Complete
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Auto-play the tree animation step one by one every 3.8 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 3800);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Phase metadata for the tree branches
  const TREE_STEPS = [
    {
      num: 1,
      phaseCode: 'Phase 01',
      title: 'Basic Account & Age 18+ Verification',
      subtitle: 'Identity & Legal Eligibility • ~45 secs',
      desc: 'Enter your primary credentials (full name, email, 10-digit mobile number) and legally confirm you are 18 years or older to enter enterprise contracts.',
      tags: ['18+ Legal Eligibility', '10-Digit Mobile OTP', 'Zero Spam Guarantee'],
      icon: UserIcon,
      accentColor: 'blue',
      preview: {
        title: 'Identity Verification Pass',
        badge: '18+ Eligible',
        item1: 'Legal Name: Verified Member ✓',
        item2: 'Mobile: +91 98765 43210 ✓'
      }
    },
    {
      num: 2,
      phaseCode: 'Phase 02',
      title: 'Primary Sector & Dynamic Profile',
      subtitle: 'Industry Tailoring • ~60 secs',
      desc: 'Choose 1 of the 10 distinct industry categories (e.g. Technology, Manufacturing, Agriculture) and select multiple relevant subcategory roles.',
      tags: ['10 Core Indian Sectors', 'Multi-Role Specialization', 'Domain Attributes'],
      icon: BriefcaseIcon,
      accentColor: 'indigo',
      preview: {
        title: '10-Sector Explorer Hub',
        badge: 'Multi-Role',
        item1: 'Active: Technology & Digital',
        item2: 'Roles: Founder, AI Specialist ✓'
      }
    },
    {
      num: 3,
      phaseCode: 'Phase 03',
      title: 'First-Year Membership Pass (₹99)',
      subtitle: 'Transparent Pricing • ~30 secs',
      desc: 'Complete the transparent ₹99 introductory pass payment for a full 365 days of universal ecosystem access. Standard renewal of ₹5,999/yr applies from year 2.',
      tags: ['Flat ₹99 for Year 1', 'GST & Platform Fee Included', 'Simulated Instant UPI'],
      icon: SparklesIcon,
      accentColor: 'amber',
      preview: {
        title: '1-Year Ecosystem Pass',
        badge: 'Flat ₹99',
        item1: 'Validity: 365 Full Days',
        item2: 'GST & Processing: Included ✓'
      }
    },
    {
      num: 4,
      phaseCode: 'Phase 04',
      title: 'Category KYC & Dashboard Activation',
      subtitle: 'Trust Verification • ~2 mins',
      desc: 'Attach your category verification document (Aadhaar, GSTIN, Student ID, or Land record). Reviewed by FIC Verification Executives within 24 business hours.',
      tags: ['Real File Attachment (PDF/JPG)', '24h Review SLA', 'Instant Dev Shortcut'],
      icon: ShieldCheckIcon,
      accentColor: 'emerald',
      preview: {
        title: 'KYC Document Scanner',
        badge: '24h SLA',
        item1: 'File: Registration_Proof.pdf',
        item2: 'Status: Attached & Validated ✓'
      }
    }
  ];

  return (
    <div className="bg-slate-50/80 min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-14">
        {/* Executive Hero Header */}
        <div className="text-center space-y-3.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Official Member Onboarding • FIC Ecosystem
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Welcome to <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600">
              FIC Business Hub
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Your gateway to verified business networking, dynamic sector workspaces, and FIC-facilitated commercial opportunities across India.
          </p>
        </div>

        {/* 3 Executive Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3 hover:border-blue-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheckIcon size={20} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Verified 18+ Trust</h2>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Category-specific KYC verification ensures an authenticated, genuine business community.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3 hover:border-emerald-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <LockIcon size={20} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">100% Privacy Safeguard</h2>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Provider contact numbers are never exposed to public spam. Requests are coordinated by FIC.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3 hover:border-purple-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
              <BriefcaseIcon size={20} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">FIC Coordination</h2>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Dedicated FIC officers review specifications, contact providers, and monitor proposal execution.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================
            TREE STRUCTURE ANIMATION ONBOARDING JOURNEY
            Winding SVG Tree Stem with Sequential Step-by-Step Reveal
           ======================================================== */}
        <div
          className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-10 space-y-8 relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Tree Header & Dynamic Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                  Sequential Ecosystem Tree
                </span>
                <span className="text-xs text-slate-400">• 3-5 Mins Journey</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                4-Phase Onboarding Tree Journey
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Watch the tree path illuminate step one by one, or click any node to explore that phase.
              </p>
            </div>

            {/* Interactive Control Pill */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all shadow-xs ${
                  isPaused
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                }`}
                title="Click to toggle auto-animation"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                  }`}
                ></span>
                <span>{isPaused ? 'Animation Paused' : 'Auto Flowing (1 by 1)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Step Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50/90 p-1.5 rounded-2xl border border-slate-200/80">
            {TREE_STEPS.map((s, idx) => {
              const isSelected = activeStep === idx;
              const isPast = activeStep > idx;

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                      isSelected
                        ? 'bg-white text-blue-600'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPast ? '✓' : s.num}
                  </span>
                  <span>Step 0{s.num}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 ${
                activeStep === 4
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>🌟 Full Tree</span>
            </button>
          </div>

          {/* ========================================================
              TREE CANVAS: WINDING SVG TRUNK & ALTERNATING BRANCHES
             ======================================================== */}
          <div className="relative py-4">
            {/* 
              DESKTOP WINDING SVG STEM (Visible on md and up)
              Matches the exact curved zigzag line drawn by user in red ink:
              Starts top-center, curves to Node 1 (left), crosses to Node 2 (right),
              crosses back to Node 3 (left), crosses to Node 4 (right), and exits bottom-center.
            */}
            <div className="absolute inset-0 pointer-events-none hidden md:block">
              <svg
                className="w-full h-full"
                viewBox="0 0 600 860"
                fill="none"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Flowing animated gradient along the tree trunk */}
                  <linearGradient id="treeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="35%" stopColor="#4f46e5" />
                    <stop offset="68%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>

                  {/* Pulsing glow filter */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Base subtle guide trunk */}
                <path
                  d="M 300 20 C 300 60, 230 60, 230 115 C 230 200, 370 230, 370 325 C 370 410, 230 440, 230 535 C 230 620, 370 650, 370 745 C 370 800, 300 815, 300 855"
                  stroke="#e2e8f0"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Animated active energy trunk */}
                <path
                  d="M 300 20 C 300 60, 230 60, 230 115 C 230 200, 370 230, 370 325 C 370 410, 230 440, 230 535 C 230 620, 370 650, 370 745 C 370 800, 300 815, 300 855"
                  stroke="url(#treeGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="animate-tree-flow"
                  filter="url(#glow)"
                />

                {/* Horizontal branch offshoots to the cards */}
                {/* Branch 1 to Left Card */}
                <path
                  d="M 230 115 L 180 115"
                  stroke={activeStep === 0 || activeStep === 4 ? '#2563eb' : '#cbd5e1'}
                  strokeWidth="3"
                  strokeDasharray="4 3"
                />
                {/* Branch 2 to Right Card */}
                <path
                  d="M 370 325 L 420 325"
                  stroke={activeStep === 1 || activeStep === 4 ? '#4f46e5' : '#cbd5e1'}
                  strokeWidth="3"
                  strokeDasharray="4 3"
                />
                {/* Branch 3 to Left Card */}
                <path
                  d="M 230 535 L 180 535"
                  stroke={activeStep === 2 || activeStep === 4 ? '#d97706' : '#cbd5e1'}
                  strokeWidth="3"
                  strokeDasharray="4 3"
                />
                {/* Branch 4 to Right Card */}
                <path
                  d="M 370 745 L 420 745"
                  stroke={activeStep === 3 || activeStep === 4 ? '#059669' : '#cbd5e1'}
                  strokeWidth="3"
                  strokeDasharray="4 3"
                />
              </svg>
            </div>

            {/* MOBILE GUIDE LINE (Visible on screens < md) */}
            <div className="absolute top-4 bottom-4 left-6 w-1 bg-gradient-to-b from-blue-600 via-indigo-600 via-amber-500 to-emerald-600 rounded-full md:hidden"></div>

            {/* 4 SEQUENTIAL TREE BRANCH NODES & CARDS */}
            <div className="space-y-10 sm:space-y-12 relative z-10">
              {TREE_STEPS.map((stepItem, idx) => {
                const isCurrent = activeStep === idx;
                const isPassed = activeStep > idx;
                const isAll = activeStep === 4;
                const isHighlighted = isCurrent || isAll;
                const IconComponent = stepItem.icon;
                const isLeft = idx % 2 === 0; // Steps 1 and 3 on Left, Steps 2 and 4 on Right

                return (
                  <div
                    key={stepItem.num}
                    onClick={() => setActiveStep(idx)}
                    className="cursor-pointer transition-all duration-300"
                  >
                    {/* DESKTOP LAYOUT (Alternating Left & Right Tree Branches) */}
                    <div className="hidden md:grid md:grid-cols-12 items-center gap-4">
                      {/* LEFT COLUMN: Card for Steps 1 & 3, Preview Badge for Steps 2 & 4 */}
                      <div className="col-span-5">
                        {isLeft ? (
                          /* Card on Left (Step 1 or 3) */
                          <div
                            className={`p-5 rounded-2xl border-2 transition-all duration-300 relative text-left ${
                              isHighlighted
                                ? 'bg-gradient-to-br from-blue-50/80 via-white to-white border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]'
                                : isPassed
                                ? 'bg-white border-emerald-300/80 shadow-xs'
                                : 'bg-white/80 border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                            }`}
                          >
                            {/* Step Badge */}
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isHighlighted
                                    ? 'bg-blue-600 text-white'
                                    : isPassed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {stepItem.phaseCode}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {stepItem.subtitle.split('•')[1] || ''}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 leading-snug">
                              {stepItem.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                              {stepItem.desc}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                              {stepItem.tags.map((t, i) => (
                                <span
                                  key={i}
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                                    isHighlighted
                                      ? 'bg-blue-100/70 text-blue-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  <CheckCircleIcon size={11} className={isHighlighted ? 'text-blue-600' : 'text-slate-400'} />
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* Mini Interactive Preview on Left (for Step 2 or 4) */
                          <div
                            className={`p-4 rounded-2xl border transition-all duration-300 ${
                              isHighlighted
                                ? 'bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-indigo-400 shadow-md scale-[1.02]'
                                : 'bg-slate-900/90 text-slate-300 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                              <span className="text-[11px] font-bold text-indigo-300">
                                {stepItem.preview.title}
                              </span>
                              <span className="text-[10px] bg-indigo-900/60 text-indigo-200 px-2 py-0.5 rounded-full font-semibold">
                                {stepItem.preview.badge}
                              </span>
                            </div>
                            <div className="text-[11px] space-y-1">
                              <div className="text-slate-300">{stepItem.preview.item1}</div>
                              <div className="text-emerald-400 font-medium">{stepItem.preview.item2}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CENTER COLUMN: Central Tree Node Indicator (1, 2, 3, 4) */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all duration-300 relative select-none ${
                            isCurrent
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/30 scale-110 animate-tree-node-active ring-4 ring-blue-300'
                              : isAll
                              ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg scale-105 ring-4 ring-emerald-200'
                              : isPassed
                              ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-100'
                              : 'bg-white text-slate-400 border-2 border-slate-300 shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <IconComponent size={18} />
                            <span className="text-[11px] leading-tight mt-0.5 font-black">
                              {isPassed ? '✓' : stepItem.num}
                            </span>
                          </div>

                          {/* Branch indicator beacon */}
                          {isCurrent && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white animate-ping"></span>
                          )}
                        </div>
                      </div>

                      {/* RIGHT COLUMN: Card for Steps 2 & 4, Preview Badge for Steps 1 & 3 */}
                      <div className="col-span-5">
                        {!isLeft ? (
                          /* Card on Right (Step 2 or 4) */
                          <div
                            className={`p-5 rounded-2xl border-2 transition-all duration-300 relative text-left ${
                              isHighlighted
                                ? 'bg-gradient-to-br from-blue-50/80 via-white to-white border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]'
                                : isPassed
                                ? 'bg-white border-emerald-300/80 shadow-xs'
                                : 'bg-white/80 border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isHighlighted
                                    ? 'bg-blue-600 text-white'
                                    : isPassed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {stepItem.phaseCode}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {stepItem.subtitle.split('•')[1] || ''}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 leading-snug">
                              {stepItem.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                              {stepItem.desc}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                              {stepItem.tags.map((t, i) => (
                                <span
                                  key={i}
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                                    isHighlighted
                                      ? 'bg-blue-100/70 text-blue-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  <CheckCircleIcon size={11} className={isHighlighted ? 'text-blue-600' : 'text-slate-400'} />
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* Mini Interactive Preview on Right (for Step 1 or 3) */
                          <div
                            className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                              isHighlighted
                                ? 'bg-gradient-to-br from-slate-900 to-blue-950 text-white border-blue-400 shadow-md scale-[1.02]'
                                : 'bg-slate-900/90 text-slate-300 border-slate-800'
                            }`}
                          >
                            {/* Moving shimmer for Step 3 */}
                            {idx === 2 && isHighlighted && (
                              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer-beam pointer-events-none"></div>
                            )}

                            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                              <span className="text-[11px] font-bold text-blue-300">
                                {stepItem.preview.title}
                              </span>
                              <span className="text-[10px] bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded-full font-semibold">
                                {stepItem.preview.badge}
                              </span>
                            </div>
                            <div className="text-[11px] space-y-1">
                              <div className="text-slate-300">{stepItem.preview.item1}</div>
                              <div className="text-emerald-400 font-medium">{stepItem.preview.item2}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* MOBILE LAYOUT (< md screens: Vertical Connected Tree) */}
                    <div className="md:hidden flex items-start gap-4 pl-2">
                      {/* Mobile Node Circle */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-200 scale-110'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-slate-400 border-2 border-slate-300'
                        }`}
                      >
                        {isPassed ? '✓' : stepItem.num}
                      </div>

                      {/* Mobile Card */}
                      <div
                        className={`flex-1 p-4 rounded-2xl border transition-all ${
                          isHighlighted
                            ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-blue-600 uppercase">
                            {stepItem.phaseCode}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {stepItem.subtitle.split('•')[1] || ''}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900">{stepItem.title}</h3>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                          {stepItem.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Road Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <SparklesIcon size={16} />
              </span>
              <div>
                <span className="font-bold text-slate-900 block">
                  {activeStep === 4
                    ? 'All 4 Phases Complete & Road Ready!'
                    : `Currently Revealing: Phase 0${activeStep + 1} (${TREE_STEPS[activeStep]?.title})`}
                </span>
                <span className="text-slate-500 text-[11px]">
                  Seamless single-page flow with instant document attachment and gateway validation.
                </span>
              </div>
            </div>

            <Link to="/register" className="shrink-0 w-full sm:w-auto">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-5">
                Begin Step 1 Now
                <ArrowRightIcon className="ml-1.5" size={14} />
              </Button>
            </Link>
          </div>
        </div>

        {/* ========================================================
            PRICING TRANSPARENCY & VALUE MATRIX
            WITH LIGHT ZOOM-IN ZOOM-OUT BREATHING ANIMATION ON ₹99 CARD
           ======================================================== */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Transparent Fee Structure
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Fair & Predictable Membership Terms
              </h2>
            </div>
            <Badge variant="success">All 10 Sectors</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 
              FIRST-YEAR INTRODUCTORY ACCESS CARD:
              Features subtle smooth zoom-in zoom-out breathing animation (animate-zoom-in-out)
              with soft amber glow, as requested!
            */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-850 via-slate-900 to-blue-950/90 border-2 border-amber-400/60 shadow-xl relative overflow-hidden animate-zoom-in-out cursor-pointer group">
              <div className="absolute top-3.5 right-3.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-sm">
                  Recommended
                </span>
              </div>

              <span className="text-xs text-amber-300 block font-bold uppercase tracking-wider">
                First-Year Introductory Access
              </span>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-amber-400 drop-shadow-sm">
                  ₹99
                </span>
                <span className="text-xs text-slate-300 font-medium">/ first 365 days</span>
              </div>

              <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                Special introductory ecosystem onboarding fee. Identical across all categories. Includes full marketplace and dynamic dashboard tools.
              </p>

              <div className="mt-3.5 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-amber-300/90 font-medium">
                <span>✨ 365 Days Full Validity</span>
                <span>Renewal: ₹5,999/yr</span>
              </div>
            </div>

            {/* Standard Annual Renewal Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">
                  Annual Renewal (Year 2 onwards)
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">₹5,999</span>
                  <span className="text-xs text-slate-400">/ year</span>
                </div>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  Standard annual membership renewal. No fake countdown timers, surge pricing, or hidden costs.
                </p>
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
                <span>🛡 Predictable transparent enterprise pricing</span>
              </div>
            </div>
          </div>

          {/* Value Checklist */}
          <div className="pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Included in Your ₹99 Membership:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                <span>Full access to Universal Services Marketplace</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                <span>Sector-tailored dynamic dashboard & tools</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                <span>Business idea validation & incubation desk</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                <span>Confidential investment & funding channel</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                <span>FIC-mediated commercial introductions & B2B tie-ups</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                <span>Strict privacy safeguard for provider contact data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Section */}
        <div className="text-center space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-10 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30">
                Continue to Registration
                <ArrowRightIcon className="ml-2" size={18} />
              </Button>
            </Link>

            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-3.5 text-slate-700 bg-white border-slate-300 hover:bg-slate-50 font-semibold text-sm">
                Already a Member? Sign In
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            Questions? Contact our coordination desk at{' '}
            <a href="mailto:support@ficapp.in" className="text-blue-600 hover:underline">
              support@ficapp.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
