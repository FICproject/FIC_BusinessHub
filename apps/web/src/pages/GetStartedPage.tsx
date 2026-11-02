import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@fic/ui';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  LockIcon,
  BriefcaseIcon
} from '../components/Icons';

export const GetStartedPage: React.FC = () => {
  // Scroll progress for the tree animation (0 to 1)
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Simple 4 Steps definition with their matching tree colors (Aligned with new KYC -> Membership flow)
  const STEPS = [
    {
      num: 1,
      title: 'Basic Account & Age 18+ Verification',
      oneLiner: 'Enter your name, mobile, and confirm 18+ legal adult status.',
      colorHex: '#C66B52', // Terracotta
      textActiveColor: 'text-[#C66B52]',
      titleActiveColor: 'text-[#29302D]',
      bgActiveColor: 'bg-[#C66B52]',
      ringActiveColor: 'ring-[#C66B52]/20',
      shadowActiveColor: 'shadow-[#C66B52]/25',
      threshold: 0.1
    },
    {
      num: 2,
      title: 'Primary Sector & Role Selection',
      oneLiner: 'Choose 1 of 10 business categories and answer dynamic questions.',
      colorHex: '#8064A9', // Royal Violet
      textActiveColor: 'text-[#8064A9]',
      titleActiveColor: 'text-[#29302D]',
      bgActiveColor: 'bg-[#8064A9]',
      ringActiveColor: 'ring-[#8064A9]/20',
      shadowActiveColor: 'shadow-[#8064A9]/25',
      threshold: 0.35
    },
    {
      num: 3,
      title: 'Category KYC & Supporting Documents',
      oneLiner: 'Attach required sector proof and any additional business documents.',
      colorHex: '#D99B43', // Amber Gold
      textActiveColor: 'text-[#D99B43]',
      titleActiveColor: 'text-[#29302D]',
      bgActiveColor: 'bg-[#D99B43]',
      ringActiveColor: 'ring-[#D99B43]/20',
      shadowActiveColor: 'shadow-[#D99B43]/25',
      threshold: 0.62
    },
    {
      num: 4,
      title: 'First-Year Membership Pass (₹99) & Activation',
      oneLiner: 'Complete the transparent ₹99 introductory pass to activate application review.',
      colorHex: '#E58C72', // Coral
      textActiveColor: 'text-[#E58C72]',
      titleActiveColor: 'text-[#29302D]',
      bgActiveColor: 'bg-[#E58C72]',
      ringActiveColor: 'ring-[#E58C72]/20',
      shadowActiveColor: 'shadow-[#E58C72]/25',
      threshold: 0.85
    }
  ];

  // Scroll listener to update scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!treeContainerRef.current) return;
      const rect = treeContainerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start calculating when container enters viewport
      const startPoint = windowHeight * 0.75;
      const totalScrollableDistance = rect.height;
      const currentScroll = startPoint - rect.top;

      let progress = currentScroll / totalScrollableDistance;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-slate-50/80 min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
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
            CLEAN SCROLL-DRIVEN TREE ROADMAP (NO BOXES)
            Color of tree branch lights up each step as user scrolls!
           ======================================================== */}
        <div
          ref={treeContainerRef}
          className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-12 space-y-10 relative overflow-hidden"
        >
          {/* Simple Clean Header (No verbose badges or redundant subtitles) */}
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Simple 4-Step Onboarding Journey
            </h2>
          </div>

          {/* TREE CANVAS */}
          <div className="relative py-6">
            {/* 
              DESKTOP S-CURVE TREE STEM (Centered at x = 300)
              Passes through Node 1 (Blue) -> sways right -> Node 2 (Indigo) 
              -> sways left -> Node 3 (Amber) -> sways right -> Node 4 (Emerald).
              Fills in real-time as user scrolls!
            */}
            <div className="absolute inset-0 pointer-events-none hidden md:block">
              <svg
                className="w-full h-full"
                viewBox="0 0 600 640"
                fill="none"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Multi-color gradient matching each step's exact color */}
                  <linearGradient id="treeScrollGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="25%" stopColor="#2563eb" />
                    <stop offset="45%" stopColor="#6366f1" />
                    <stop offset="70%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {/* Base subtle guide track */}
                <path
                  d="M 300 0 C 300 40, 300 50, 300 70 C 370 120, 370 190, 300 240 C 230 290, 230 360, 300 410 C 370 460, 370 530, 300 580 C 300 600, 300 620, 300 640"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Scroll-driven colored fill path */}
                <path
                  d="M 300 0 C 300 40, 300 50, 300 70 C 370 120, 370 190, 300 240 C 230 290, 230 360, 300 410 C 370 460, 370 530, 300 580 C 300 600, 300 620, 300 640"
                  stroke="url(#treeScrollGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 900,
                    strokeDashoffset: 900 * (1 - scrollProgress),
                    transition: 'stroke-dashoffset 0.15s ease-out'
                  }}
                />
              </svg>
            </div>

            {/* MOBILE GUIDE STEM */}
            <div className="absolute top-2 bottom-2 left-5 w-1 bg-slate-200 rounded-full md:hidden">
              <div
                className="w-full bg-gradient-to-b from-blue-600 via-indigo-600 via-amber-500 to-emerald-600 rounded-full transition-all duration-150"
                style={{ height: `${scrollProgress * 100}%` }}
              ></div>
            </div>

            {/* 4 SIMPLE STEPS (NO BOXES, SIMPLE 1-LINERS WITH SCROLL COLOR SYNC) */}
            <div className="space-y-16 sm:space-y-24 relative z-10">
              {STEPS.map((step, idx) => {
                const isReached = scrollProgress >= step.threshold;
                const isLeft = idx % 2 === 0; // Steps 1 and 3 on Left, Steps 2 and 4 on Right

                return (
                  <div key={step.num} className="transition-all duration-300">
                    {/* DESKTOP LAYOUT (Clean typography with NO BOXES) */}
                    <div className="hidden md:grid md:grid-cols-12 items-center gap-6">
                      {/* Left Column */}
                      <div className="col-span-5">
                        {isLeft ? (
                          /* Step 1 or Step 3 Text (Right-aligned, NO BOX) */
                          <div
                            className={`text-right transition-all duration-500 ${isReached
                                ? 'opacity-100 translate-x-0'
                                : 'opacity-30 -translate-x-3'
                              }`}
                          >
                            <span
                              className={`text-xs font-black uppercase tracking-wider block mb-1 transition-colors duration-300 ${isReached ? step.textActiveColor : 'text-slate-400'
                                }`}
                            >
                              Step 0{step.num}
                            </span>

                            <h3
                              className={`text-lg sm:text-xl font-bold leading-snug transition-colors duration-300 ${isReached ? step.titleActiveColor : 'text-slate-400'
                                }`}
                            >
                              {step.title}
                            </h3>

                            <p
                              className={`text-xs sm:text-sm mt-1 transition-colors duration-300 ${isReached ? 'text-slate-600 font-normal' : 'text-slate-400'
                                }`}
                            >
                              {step.oneLiner}
                            </p>
                          </div>
                        ) : (
                          /* Empty spacer for Steps 2 & 4 */
                          <div></div>
                        )}
                      </div>

                      {/* Center Column: Node Circle (Directly on S-curve) */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-sm transition-all duration-500 select-none ${isReached
                              ? `${step.bgActiveColor} text-white ring-4 ${step.ringActiveColor} ${step.shadowActiveColor} shadow-lg scale-110`
                              : 'bg-white text-slate-400 border-2 border-slate-300 scale-90'
                            }`}
                        >
                          <span className="text-xs font-black">
                            {isReached && scrollProgress >= step.threshold + 0.15
                              ? '✓'
                              : step.num}
                          </span>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="col-span-5">
                        {!isLeft ? (
                          /* Step 2 or Step 4 Text (Left-aligned, NO BOX) */
                          <div
                            className={`text-left transition-all duration-500 ${isReached
                                ? 'opacity-100 translate-x-0'
                                : 'opacity-30 translate-x-3'
                              }`}
                          >
                            <span
                              className={`text-xs font-black uppercase tracking-wider block mb-1 transition-colors duration-300 ${isReached ? step.textActiveColor : 'text-slate-400'
                                }`}
                            >
                              Step 0{step.num}
                            </span>

                            <h3
                              className={`text-lg sm:text-xl font-bold leading-snug transition-colors duration-300 ${isReached ? step.titleActiveColor : 'text-slate-400'
                                }`}
                            >
                              {step.title}
                            </h3>

                            <p
                              className={`text-xs sm:text-sm mt-1 transition-colors duration-300 ${isReached ? 'text-slate-600 font-normal' : 'text-slate-400'
                                }`}
                            >
                              {step.oneLiner}
                            </p>
                          </div>
                        ) : (
                          /* Empty spacer for Steps 1 & 3 */
                          <div></div>
                        )}
                      </div>
                    </div>

                    {/* MOBILE LAYOUT (< md screens: Simple clean text, NO BOX) */}
                    <div className="md:hidden flex items-start gap-4 pl-1">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${isReached
                            ? `${step.bgActiveColor} text-white shadow-md ring-4 ${step.ringActiveColor} scale-105`
                            : 'bg-white text-slate-400 border border-slate-300'
                          }`}
                      >
                        {step.num}
                      </div>

                      <div
                        className={`flex-1 transition-all duration-300 ${isReached ? 'opacity-100' : 'opacity-35'
                          }`}
                      >
                        <span
                          className={`text-[10px] font-black uppercase block ${isReached ? step.textActiveColor : 'text-slate-400'
                            }`}
                        >
                          Step 0{step.num}
                        </span>

                        <h3
                          className={`text-sm font-bold leading-tight ${isReached ? 'text-slate-900' : 'text-slate-400'
                            }`}
                        >
                          {step.title}
                        </h3>

                        <p
                          className={`text-xs mt-0.5 ${isReached ? 'text-slate-600' : 'text-slate-400'
                            }`}
                        >
                          {step.oneLiner}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simple Bottom Action Button */}
          <div className="text-center pt-4">
            <Link to="/register">
              <Button size="lg" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20">
                Continue to Registration
                <ArrowRightIcon className="ml-2" size={16} />
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
