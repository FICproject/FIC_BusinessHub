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
  UploadIcon,
  UserIcon,
  CodeIcon,
  TrendingUpIcon
} from '../components/Icons';

export const GetStartedPage: React.FC = () => {
  // Animated Interactive Journey Stepper State
  const [activePhase, setActivePhase] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Auto-play the 4 phases every 4.5 seconds (pauses on hover)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActivePhase((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Phase metadata for the interactive animated journey
  const PHASES_DATA = [
    {
      phase: '01',
      title: 'Basic Account & Legal 18+ Verification',
      badge: 'Phase 1: Member Identity',
      duration: '45 seconds',
      description:
        'Set up your authenticated login credentials and verify legal adult status (18+) to ensure high-trust enterprise interactions across the FIC ecosystem.',
      highlights: [
        'Full legal name and 10-digit Indian mobile verification',
        'Mandatory 18+ legal contract eligibility confirmation',
        'Strict zero-spam privacy safeguard from Day 1'
      ],
      type: 'identity'
    },
    {
      phase: '02',
      title: 'Primary Sector & Dynamic Profile',
      badge: 'Phase 2: Sector Tailoring',
      duration: '60 seconds',
      description:
        'Select the single core industry that defines your enterprise and choose your specific subcategory roles with configuration-driven business attributes.',
      highlights: [
        '10 Dedicated business sectors (Tech, Manufacturing, Agri, etc.)',
        'Custom subcategory roles with multi-select capability',
        'Dynamic profile fields adapted to your specific industry'
      ],
      type: 'sector'
    },
    {
      phase: '03',
      title: 'First-Year Membership Pass (₹99)',
      badge: 'Phase 3: ₹99 Annual Pass',
      duration: '30 seconds',
      description:
        'Activate 365 full days of universal ecosystem access at the transparent ₹99 introductory price. Equal pricing across all 10 sectors with no hidden platform fees.',
      highlights: [
        'Flat ₹99 introductory onboarding pass for 1 full year',
        'GST & transaction fees completely included',
        'Instant server-side payment confirmation & invoice'
      ],
      type: 'pricing'
    },
    {
      phase: '04',
      title: 'Category KYC & Dashboard Activation',
      badge: 'Phase 4: Trust Verification',
      duration: '2 minutes',
      description:
        'Attach your sector proof document (Aadhaar, GSTIN, Student ID, or Land record). Once verified, your personalized Member Dashboard is fully activated.',
      highlights: [
        'Real file upload attachment supporting PDF, JPG, and PNG',
        'FIC Verification Officers review documents within 24 hours',
        'Developer simulation shortcut available for immediate access'
      ],
      type: 'kyc'
    }
  ];

  const currentPhase = PHASES_DATA[activePhase];

  return (
    <div className="bg-slate-50/80 min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
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

        {/* 3 Executive Pillars */}
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
            REPLACED 4 STATIC CARDS WITH DYNAMIC ANIMATED JOURNEY SHOWCASE
           ======================================================== */}
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Header & Status Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Interactive Journey
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span className="text-xs text-slate-500 font-medium">3-5 Mins Total</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                4-Phase Onboarding Experience
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                {isPaused ? 'Paused (Hovering)' : 'Auto-Playing Flow'}
              </span>
            </div>
          </div>

          {/* Interactive Stepper Navigation Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/90 p-1.5 rounded-xl border border-slate-200/80">
            {PHASES_DATA.map((p, idx) => {
              const isActive = activePhase === idx;

              return (
                <button
                  key={p.phase}
                  type="button"
                  onClick={() => setActivePhase(idx)}
                  className={`relative p-3 rounded-lg text-left transition-all duration-200 flex flex-col justify-between ${
                    isActive
                      ? 'bg-white shadow-sm border border-blue-200/80 text-blue-900'
                      : 'hover:bg-white/60 text-slate-600 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      P0{idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {idx === 0 ? '45s' : idx === 1 ? '60s' : idx === 2 ? '30s' : '2m'}
                    </span>
                  </div>

                  <span className={`text-xs font-bold truncate block ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                    {idx === 0
                      ? 'Identity & 18+'
                      : idx === 1
                      ? 'Sector & Roles'
                      : idx === 2
                      ? '₹99 Access Pass'
                      : 'KYC Document'}
                  </span>

                  {/* Animated Active Progress Line */}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full animate-progress-fill"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* DYNAMIC ANIMATED SHOWCASE CANVAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
            {/* Left Content (Phase Details) */}
            <div className="lg:col-span-7 space-y-4 animate-step-in" key={`content-${activePhase}`}>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                  {currentPhase.badge}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  ⏱ Est. {currentPhase.duration}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {currentPhase.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {currentPhase.description}
              </p>

              {/* Highlights Checklist */}
              <div className="space-y-2 pt-1">
                {currentPhase.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircleIcon size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Navigation Controls */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActivePhase((prev) => (prev === 0 ? 3 : prev - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhase((prev) => (prev + 1) % 4)}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-sm"
                >
                  Next Phase →
                </button>

                <span className="text-[11px] text-slate-400 pl-2">
                  Step {activePhase + 1} of 4
                </span>
              </div>
            </div>

            {/* Right Content (Animated Micro-Interactive Visual Preview) */}
            <div className="lg:col-span-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white shadow-xl relative overflow-hidden min-h-[260px] flex flex-col justify-center">
                {/* Ambient glow effect */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                {/* ANIMATION PREVIEW 1: IDENTITY & 18+ */}
                {activePhase === 0 && (
                  <div className="space-y-3.5 animate-step-in" key="preview-0">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          <UserIcon size={14} />
                        </div>
                        <span className="text-xs font-bold">Identity Pass</span>
                      </div>
                      <Badge variant="success">18+ Eligible</Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                        <span className="text-slate-400">Legal Name</span>
                        <span className="font-semibold text-blue-300">Verified Member ✓</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                        <span className="text-slate-400">Mobile (10 digits)</span>
                        <span className="font-semibold text-emerald-400">OTP Verified ✓</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                      <ShieldCheckIcon size={14} className="text-emerald-400 shrink-0" />
                      <span>Legal adult commercial binding agreement</span>
                    </div>
                  </div>
                )}

                {/* ANIMATION PREVIEW 2: SECTOR & ROLES */}
                {activePhase === 1 && (
                  <div className="space-y-3 animate-step-in" key="preview-1">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <span className="text-xs font-bold text-blue-300">10 Core Sectors</span>
                      <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700/40 font-semibold">
                        Multi-Role Selection
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-blue-600/30 border border-blue-500 text-blue-200 font-semibold flex items-center gap-1.5 shadow-xs">
                        <CodeIcon size={14} />
                        <span>Technology</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                        <BriefcaseIcon size={14} />
                        <span>Manufacturing</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                        <TrendingUpIcon size={14} />
                        <span>Investment</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                        <SparklesIcon size={14} />
                        <span>Education</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-blue-950/50 border border-blue-500/30 text-[11px] text-blue-200">
                      <span className="text-slate-400 block text-[10px]">Active Roles Selected:</span>
                      <strong className="text-blue-300">✓ Software Founder, AI Specialist</strong>
                    </div>
                  </div>
                )}

                {/* ANIMATION PREVIEW 3: ₹99 ACCESS PASS */}
                {activePhase === 2 && (
                  <div className="space-y-3 animate-step-in relative overflow-hidden" key="preview-2">
                    {/* Moving Shimmer Beam */}
                    <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer-beam pointer-events-none"></div>

                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        1-Year Member Pass
                      </span>
                      <Badge variant="warning">Transparent</Badge>
                    </div>

                    <div className="text-center py-2 bg-gradient-to-r from-slate-800/80 to-blue-950/80 rounded-xl border border-amber-400/30">
                      <div className="text-3xl font-extrabold text-amber-400">₹99</div>
                      <span className="text-[11px] text-slate-300">for complete 365 days</span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span>GST & Platform Fee</span>
                        <strong className="text-emerald-400">Included</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>All 10 Sectors Access</span>
                        <strong className="text-blue-300">Enabled</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* ANIMATION PREVIEW 4: REAL KYC SCANNER */}
                {activePhase === 3 && (
                  <div className="space-y-3 animate-step-in relative" key="preview-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <span className="text-xs font-bold text-slate-200">KYC Verification</span>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-500/30">
                        24h Review SLA
                      </span>
                    </div>

                    {/* Animated Document Scan Box */}
                    <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 relative overflow-hidden">
                      {/* Laser scanning beam */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400/80 animate-laser-scan pointer-events-none"></div>

                      <div className="flex items-center gap-2.5 text-xs text-slate-200">
                        <div className="w-8 h-8 rounded bg-cyan-950 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-800/50">
                          <FileTextIcon size={16} />
                        </div>
                        <div className="truncate">
                          <span className="font-semibold block truncate">Registration_Doc.pdf</span>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <CheckCircleIcon size={11} /> File Attached & Validated
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-blue-950/50 border border-blue-500/30 text-[11px] text-blue-200 text-center font-medium">
                      Instant Member Dashboard Activation
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            PRICING TRANSPARENCY & VALUE MATRIX
            WITH LIGHT ZOOM-IN ZOOM-OUT BREATHING ANIMATION ON ₹99 CARD
           ======================================================== */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
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
