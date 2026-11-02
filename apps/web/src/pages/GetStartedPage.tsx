import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@fic/ui';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  LockIcon,
  BriefcaseIcon,
  SparklesIcon,
  UserIcon
} from '../components/Icons';

export const GetStartedPage: React.FC = () => {
  // Scroll progress for the tree animation (0 to 1)
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Simple 4 Steps definition
  const STEPS = [
    {
      num: 1,
      title: 'Basic Account & Age 18+ Verification',
      duration: '~45 seconds',
      desc: 'Enter your full name, email, 10-digit mobile number, and legally confirm you are 18+ years of age for verified enterprise access.',
      keyTakeaway: 'Identity verified with legal adult (18+) eligibility guarantee',
      icon: UserIcon,
      threshold: 0.12
    },
    {
      num: 2,
      title: 'Primary Sector & Dynamic Profile',
      duration: '~60 seconds',
      desc: 'Choose 1 of the 10 business categories (e.g. Technology, Manufacturing, Agriculture) and select your specialized subcategory roles.',
      keyTakeaway: 'Tailored dynamic form customized to your specific industry',
      icon: BriefcaseIcon,
      threshold: 0.38
    },
    {
      num: 3,
      title: 'First-Year Membership Pass (₹99)',
      duration: '~30 seconds',
      desc: 'Pay the transparent ₹99 introductory fee for 365 full days of universal ecosystem access. Standard renewal of ₹5,999/yr from year 2.',
      keyTakeaway: 'Flat ₹99 with GST & platform processing completely included',
      icon: SparklesIcon,
      threshold: 0.64
    },
    {
      num: 4,
      title: 'Category KYC & Dashboard Activation',
      duration: '~2 minutes',
      desc: 'Attach your sector verification document (PDF, JPG, or PNG). Verified by FIC executives within 24 hours to unlock your full dashboard.',
      keyTakeaway: 'Reviewed within 24 hours with instant developer testing shortcut',
      icon: ShieldCheckIcon,
      threshold: 0.88
    }
  ];

  // Scroll listener to update scroll progress and animate steps one by one
  useEffect(() => {
    const handleScroll = () => {
      if (!treeContainerRef.current) return;
      const rect = treeContainerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start calculating when container enters upper half of viewport
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
            SCROLL-DRIVEN TREE ANIMATION (SIMPLE & CLEAN)
            Reveals Step One by One as the user scrolls down!
           ======================================================== */}
        <div
          ref={treeContainerRef}
          className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-10 space-y-8 relative overflow-hidden"
        >
          {/* Section Header */}
          <div className="text-center max-w-xl mx-auto space-y-2 pb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Scroll Down to Reveal Steps
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Simple 4-Step Onboarding Journey
            </h2>

            <p className="text-xs sm:text-sm text-slate-500">
              Scroll down to watch each step activate one by one along the ecosystem path.
            </p>
          </div>

          {/* TREE CANVAS */}
          <div className="relative py-4">
            {/* 
              DESKTOP WINDING SVG STEM (Visible on md and up)
              Curves to Node 1 (Left), then Node 2 (Right), then Node 3 (Left), then Node 4 (Right)
              Draws down in real-time as user scrolls!
            */}
            <div className="absolute inset-0 pointer-events-none hidden md:block">
              <svg
                className="w-full h-full"
                viewBox="0 0 600 760"
                fill="none"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="scrollTreeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="35%" stopColor="#4f46e5" />
                    <stop offset="68%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {/* Base subtle guide path */}
                <path
                  d="M 300 10 C 300 50, 200 50, 200 95 C 200 170, 400 200, 400 275 C 400 350, 200 380, 200 455 C 200 530, 400 560, 400 635 C 400 690, 300 710, 300 750"
                  stroke="#e2e8f0"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Real-time scroll-driven path fill */}
                <path
                  d="M 300 10 C 300 50, 200 50, 200 95 C 200 170, 400 200, 400 275 C 400 350, 200 380, 200 455 C 200 530, 400 560, 400 635 C 400 690, 300 710, 300 750"
                  stroke="url(#scrollTreeGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 1200,
                    strokeDashoffset: 1200 * (1 - scrollProgress),
                    transition: 'stroke-dashoffset 0.15s ease-out'
                  }}
                />

                {/* Horizontal branch offshoots */}
                <path
                  d="M 200 95 L 140 95"
                  stroke={scrollProgress >= 0.12 ? '#2563eb' : '#cbd5e1'}
                  strokeWidth="3"
                  strokeDasharray="4 3"
                />
                <path
                  d="M 400 275 L 460 275"
                  stroke={scrollProgress >= 0.38 ? '#4f46e5' : '#cbd5e1'}
                  strokeWidth="3"
                  strokeDasharray="4 3"
                />
                <path
                  d="M 200 455 L 140 455"
                  stroke={scrollProgress >= 0.64 ? '#d97706' : '#cbd5e1'}
                  strokeWidth="3"
                  strokeDasharray="4 3"
                />
                <path
                  d="M 400 635 L 460 635"
                  stroke={scrollProgress >= 0.88 ? '#059669' : '#cbd5e1'}
                  strokeWidth="3"
                  strokeDasharray="4 3"
                />
              </svg>
            </div>

            {/* MOBILE GUIDE STEM */}
            <div className="absolute top-4 bottom-4 left-6 w-1 bg-slate-200 rounded-full md:hidden">
              <div
                className="w-full bg-gradient-to-b from-blue-600 via-indigo-600 via-amber-500 to-emerald-600 rounded-full transition-all duration-150"
                style={{ height: `${scrollProgress * 100}%` }}
              ></div>
            </div>

            {/* 4 SIMPLE STEPS (Alternating along the tree path) */}
            <div className="space-y-12 sm:space-y-14 relative z-10">
              {STEPS.map((step, idx) => {
                const isReached = scrollProgress >= step.threshold;
                const isLeft = idx % 2 === 0; // Steps 1 and 3 on Left, Steps 2 and 4 on Right
                const IconComponent = step.icon;

                return (
                  <div key={step.num} className="transition-all duration-300">
                    {/* DESKTOP LAYOUT (Alternating) */}
                    <div className="hidden md:grid md:grid-cols-12 items-center gap-6">
                      {/* Left Column */}
                      <div className="col-span-5">
                        {isLeft ? (
                          /* Card on Left (Step 1 or 3) */
                          <div
                            className={`p-5 sm:p-6 rounded-2xl border transition-all duration-500 ${
                              isReached
                                ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/10 translate-y-0 opacity-100 scale-100'
                                : 'bg-white/40 border-slate-200/60 translate-y-3 opacity-35 scale-98'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                                Phase 0{step.num}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                {step.duration}
                              </span>
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                              {step.title}
                            </h3>

                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                              {step.desc}
                            </p>

                            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                              <CheckCircleIcon
                                size={15}
                                className={isReached ? 'text-emerald-500' : 'text-slate-300'}
                              />
                              <span className="font-medium">{step.keyTakeaway}</span>
                            </div>
                          </div>
                        ) : (
                          /* Clean empty spacer on Left for Steps 2 & 4 */
                          <div className="hidden md:block"></div>
                        )}
                      </div>

                      {/* Center Column: Tree Node (1, 2, 3, 4) */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div
                          className={`w-13 h-13 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all duration-500 relative select-none ${
                            isReached
                              ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 scale-110 ring-4 ring-blue-200'
                              : 'bg-white text-slate-400 border-2 border-slate-300 scale-90'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <IconComponent size={18} />
                            <span className="text-[11px] leading-tight mt-0.5 font-black">
                              {step.num}
                            </span>
                          </div>

                          {/* Pulsing indicator when just reached */}
                          {isReached && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white animate-ping"></span>
                          )}
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="col-span-5">
                        {!isLeft ? (
                          /* Card on Right (Step 2 or 4) */
                          <div
                            className={`p-5 sm:p-6 rounded-2xl border transition-all duration-500 ${
                              isReached
                                ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/10 translate-y-0 opacity-100 scale-100'
                                : 'bg-white/40 border-slate-200/60 translate-y-3 opacity-35 scale-98'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                                Phase 0{step.num}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                {step.duration}
                              </span>
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                              {step.title}
                            </h3>

                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                              {step.desc}
                            </p>

                            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                              <CheckCircleIcon
                                size={15}
                                className={isReached ? 'text-emerald-500' : 'text-slate-300'}
                              />
                              <span className="font-medium">{step.keyTakeaway}</span>
                            </div>
                          </div>
                        ) : (
                          /* Clean empty spacer on Right for Steps 1 & 3 */
                          <div className="hidden md:block"></div>
                        )}
                      </div>
                    </div>

                    {/* MOBILE LAYOUT (< md screens) */}
                    <div className="md:hidden flex items-start gap-4 pl-2">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                          isReached
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100 scale-105'
                            : 'bg-white text-slate-400 border-2 border-slate-200'
                        }`}
                      >
                        {step.num}
                      </div>

                      <div
                        className={`flex-1 p-4 rounded-2xl border transition-all duration-300 ${
                          isReached
                            ? 'bg-white border-blue-400 shadow-sm opacity-100'
                            : 'bg-white/50 border-slate-200 opacity-40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-blue-600 uppercase">
                            Phase 0{step.num}
                          </span>
                          <span className="text-[10px] text-slate-400">{step.duration}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simple Bottom Road Action Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Ready to start? Registration takes approximately 3-5 minutes.</span>
            </div>

            <Link to="/register" className="w-full sm:w-auto">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                Start Step 1 Now
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
