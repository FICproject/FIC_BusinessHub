import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform, useMotionValueEvent } from 'motion/react';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  LockIcon,
  BriefcaseIcon,
  FileTextIcon,
  SparklesIcon
} from '../components/Icons';
import { fetchPlatformPricingConfig } from '../services/api';

// ========================================================
// 1. SHARED STEP & COLOUR CONFIGURATION
// Exactly shared across SVG path, circular markers and step cards.
// ========================================================
const ONBOARDING_STEPS = [
  {
    num: '01',
    number: 1,
    title: 'Basic Account & Age 18+ Verification',
    description: 'Enter your name, mobile number, and confirm your legal adult status.',
    colorHex: '#C66B52', // Terracotta / Coral
    tagColor: 'text-[#C66B52]',
    tagBg: 'bg-[#C66B52]/15',
    tagBorder: 'border-[#C66B52]/30',
    completedTagBg: 'bg-[#C66B52]/10',
    completedTagBorder: 'border-[#C66B52]/20',
    circleRing: 'ring-[#C66B52]/30',
    circleShadow: 'shadow-[#C66B52]/30',
    activeBg: 'bg-[#FFF7F4]',
    activeBorder: 'border-[#C66B52]',
    completedBorder: 'border-[#C66B52]/50',
    activeShadow: 'shadow-[0_12px_28px_-6px_rgba(198,107,82,0.28)]',
    markerOffset: -32,
    icon: ShieldCheckIcon
  },
  {
    num: '02',
    number: 2,
    title: 'Dynamic Sector & Role Selection',
    description: 'Choose one of the available business categories and answer the relevant questions.',
    colorHex: '#8064A9', // Royal Violet / Purple
    tagColor: 'text-[#8064A9]',
    tagBg: 'bg-[#8064A9]/15',
    tagBorder: 'border-[#8064A9]/30',
    completedTagBg: 'bg-[#8064A9]/10',
    completedTagBorder: 'border-[#8064A9]/20',
    circleRing: 'ring-[#8064A9]/30',
    circleShadow: 'shadow-[#8064A9]/30',
    activeBg: 'bg-[#FAF8FD]',
    activeBorder: 'border-[#8064A9]',
    completedBorder: 'border-[#8064A9]/50',
    activeShadow: 'shadow-[0_12px_28px_-6px_rgba(128,100,169,0.28)]',
    markerOffset: 32,
    icon: BriefcaseIcon
  },
  {
    num: '03',
    number: 3,
    title: 'Category KYC & Supporting Documents',
    description: 'Upload the required documents based on your selected category.',
    colorHex: '#D99B43', // Golden Orange / Amber
    tagColor: 'text-[#D99B43]',
    tagBg: 'bg-[#D99B43]/15',
    tagBorder: 'border-[#D99B43]/30',
    completedTagBg: 'bg-[#D99B43]/10',
    completedTagBorder: 'border-[#D99B43]/20',
    circleRing: 'ring-[#D99B43]/30',
    circleShadow: 'shadow-[#D99B43]/30',
    activeBg: 'bg-[#FDFBF6]',
    activeBorder: 'border-[#D99B43]',
    completedBorder: 'border-[#D99B43]/50',
    activeShadow: 'shadow-[0_12px_28px_-6px_rgba(217,155,67,0.28)]',
    markerOffset: -32,
    icon: FileTextIcon
  },
  {
    num: '04',
    number: 4,
    title: 'First-Year Membership Pass (₹99) & Activation',
    description: 'Complete the introductory membership payment to activate the application review process.',
    colorHex: '#E8795B', // Coral-Red
    tagColor: 'text-[#E8795B]',
    tagBg: 'bg-[#E8795B]/15',
    tagBorder: 'border-[#E8795B]/30',
    completedTagBg: 'bg-[#E8795B]/10',
    completedTagBorder: 'border-[#E8795B]/20',
    circleRing: 'ring-[#E8795B]/30',
    circleShadow: 'shadow-[#E8795B]/30',
    activeBg: 'bg-[#FFF7F5]',
    activeBorder: 'border-[#E8795B]',
    completedBorder: 'border-[#E8795B]/50',
    activeShadow: 'shadow-[0_12px_28px_-6px_rgba(232,121,91,0.28)]',
    markerOffset: 32,
    icon: SparklesIcon
  }
];

// ========================================================
// 2. REUSABLE COMPONENT: TimelinePath
// S-shaped Bezier curved SVG path matching the 800px vertical corridor.
// ========================================================
interface TimelinePathProps {
  progress: any; // MotionValue
}

export const TimelinePath: React.FC<TimelinePathProps> = ({ progress }) => {
  return (
    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[800px] pointer-events-none hidden md:block">
      <svg className="w-full h-full" viewBox="0 0 200 800" fill="none">
        <defs>
          <linearGradient id="curvedTimelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C66B52" />
            <stop offset="25%" stopColor="#C66B52" />
            <stop offset="42%" stopColor="#8064A9" />
            <stop offset="68%" stopColor="#D99B43" />
            <stop offset="92%" stopColor="#E8795B" />
            <stop offset="100%" stopColor="#E8795B" />
          </linearGradient>
        </defs>

        {/* Base subtle guide track (smooth Bezier S-curve) */}
        <path
          d="M 100 0 C 100 40, 68 55, 68 100 C 68 180, 132 220, 132 300 C 132 380, 68 420, 68 500 C 68 580, 132 620, 132 700 C 132 745, 100 760, 100 800"
          stroke="#E8DBC8"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.5"
          fill="none"
        />

        {/* Scroll-driven animated colored path */}
        <motion.path
          d="M 100 0 C 100 40, 68 55, 68 100 C 68 180, 132 220, 132 300 C 132 380, 68 420, 68 500 C 68 580, 132 620, 132 700 C 132 745, 100 760, 100 800"
          stroke="url(#curvedTimelineGradient)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          style={{ pathLength: progress }}
        />
      </svg>
    </div>
  );
};

// ========================================================
// 3. REUSABLE COMPONENT: TimelineMarker
// Always displays the original step number 1, 2, 3, 4 (NO ticks).
// ========================================================
interface TimelineMarkerProps {
  stepNumber: number;
  colorHex: string;
  circleRing: string;
  circleShadow: string;
  state: 'upcoming' | 'active' | 'completed';
  offsetX?: number;
}

export const TimelineMarker: React.FC<TimelineMarkerProps> = ({
  stepNumber,
  colorHex,
  circleRing,
  circleShadow,
  state,
  offsetX = 0
}) => {
  const isActive = state === 'active';
  const isCompleted = state === 'completed';
  const isUpcoming = state === 'upcoming';

  return (
    <motion.div
      animate={{
        scale: isActive ? 1.14 : isCompleted ? 1.0 : 0.88,
        opacity: isUpcoming ? 0.35 : 1.0
      }}
      transition={{
        duration: 0.35,
        type: 'spring',
        stiffness: 260,
        damping: 18
      }}
      style={{
        x: offsetX,
        backgroundColor: isUpcoming ? '#E5E0D8' : colorHex
      }}
      className={`w-12 h-12 rounded-full text-white flex items-center justify-center font-black text-sm select-none z-10 transition-shadow duration-300 ${
        isActive
          ? `ring-4 ${circleRing} ${circleShadow} shadow-lg ring-offset-2 ring-offset-white`
          : isCompleted
          ? 'shadow-md'
          : 'border-2 border-white'
      }`}
    >
      <span className={isUpcoming ? 'text-slate-500 font-bold' : 'text-white font-black'}>
        {stepNumber}
      </span>
    </motion.div>
  );
};

// ========================================================
// 4. REUSABLE COMPONENT: TimelineStep
// Adheres strictly to the 3-state visibility and color matrix:
// - Upcoming: 0.30 opacity, 4px blur, 0.97 scale, faded
// - Active: 1.00 opacity, 0px blur, 1.02 scale, marker-colour highlight (2px border, tint, subtle shadow)
// - Completed: 1.00 opacity, 0px blur, 1.00 scale, retains marker colour theme (1px border, clear card)
// ========================================================
interface TimelineStepProps {
  step: typeof ONBOARDING_STEPS[0];
  state: 'upcoming' | 'active' | 'completed';
  align: 'left' | 'right';
}

export const TimelineStep: React.FC<TimelineStepProps> = ({ step, state, align }) => {
  const isRightAligned = align === 'right'; // For desktop left column
  const isActive = state === 'active';
  const isCompleted = state === 'completed';
  const isUpcoming = state === 'upcoming';

  let containerClasses = '';
  if (isActive) {
    containerClasses = `${step.activeBg} ${step.activeBorder} ${step.activeShadow} shadow-lg border-2`;
  } else if (isCompleted) {
    containerClasses = `bg-white ${step.completedBorder} shadow-2xs border`;
  } else {
    containerClasses = 'bg-[#FCFAF7]/70 border-[#E8DBC8]/50 shadow-2xs border';
  }

  return (
    <motion.div
      animate={{
        opacity: isUpcoming ? 0.30 : 1.0,
        filter: isUpcoming ? 'blur(4px)' : 'blur(0px)',
        scale: isActive ? 1.02 : isUpcoming ? 0.97 : 1.0
      }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`p-5 sm:p-6 rounded-2xl transition-all duration-300 ${containerClasses} ${
        isRightAligned ? 'text-right' : 'text-left'
      }`}
    >
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider mb-2 transition-colors duration-300 ${
          isActive
            ? `${step.tagColor} ${step.tagBg} border ${step.tagBorder}`
            : isCompleted
            ? `${step.tagColor} ${step.completedTagBg} border ${step.completedTagBorder}`
            : 'text-slate-400 bg-slate-100 border border-slate-200'
        }`}
      >
        STEP {step.num}
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse ml-0.5" />
        )}
      </span>

      <h3
        className={`text-base sm:text-lg font-black leading-snug transition-colors duration-300 ${
          isActive || isCompleted ? 'text-[#29302D]' : 'text-slate-500'
        }`}
      >
        {step.title}
      </h3>

      <p
        className={`text-xs sm:text-[13px] font-medium mt-1.5 leading-relaxed transition-colors duration-300 ${
          isActive ? 'text-[#4A4036]' : isCompleted ? 'text-[#5A5047]' : 'text-slate-400'
        }`}
      >
        {step.description}
      </p>
    </motion.div>
  );
};

// ========================================================
// 5. REUSABLE COMPONENT: OnboardingTimeline
// Controls activeStep strictly synchronized with the S-curve drawing progress.
// Curve-to-marker positions along the 850.10px S-curve path:
// Marker 1 center: 106.37px / 850.10px = 0.125
// Marker 2 center: 318.82px / 850.10px = 0.375
// Marker 3 center: 531.27px / 850.10px = 0.625
// Marker 4 center: 743.72px / 850.10px = 0.875
// ========================================================
const TIMELINE_THRESHOLDS = [0.125, 0.375, 0.625, 0.875] as const;

export const OnboardingTimeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 60%', 'end 75%']
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    restDelta: 0.001
  });

  const mobileTimelineHeight = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  const calculateStep = (progressVal: number): number => {
    if (progressVal >= TIMELINE_THRESHOLDS[3]) return 4;
    if (progressVal >= TIMELINE_THRESHOLDS[2]) return 3;
    if (progressVal >= TIMELINE_THRESHOLDS[1]) return 2;
    if (progressVal >= TIMELINE_THRESHOLDS[0]) return 1;
    return 0;
  };

  // 0: before Step 1, 1: Step 1 active, 2: Step 2 active, 3: Step 3 active, 4: Step 4 active
  const [activeStep, setActiveStep] = useState<number>(() => calculateStep(smoothProgress.get()));

  // Card reveal is strictly bound to the animated curve stroke crossing each marker
  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    const nextStep = calculateStep(latest);
    setActiveStep((prev) => (prev !== nextStep ? nextStep : prev));
  });

  // Check initial state on mount
  useEffect(() => {
    setActiveStep(calculateStep(smoothProgress.get()));
  }, [smoothProgress]);

  const getStepState = (stepNumber: number): 'upcoming' | 'active' | 'completed' => {
    if (activeStep === 0) return 'upcoming';
    if (stepNumber === activeStep) return 'active';
    if (stepNumber < activeStep) return 'completed';
    return 'upcoming';
  };

  return (
    <div ref={containerRef} className="relative py-4 sm:py-6">
      {/* DESKTOP CURVED S-TIMELINE SVG */}
      <TimelinePath progress={smoothProgress} />

      {/* MOBILE VERTICAL TIMELINE LINE */}
      <div className="absolute top-4 bottom-4 left-6 -translate-x-1/2 w-1 md:hidden">
        <div className="w-full h-full bg-[#E8DBC8]/50 rounded-full" />
        <motion.div
          className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#C66B52] via-[#8064A9] via-[#D99B43] to-[#E8795B] rounded-full origin-top"
          style={{ height: mobileTimelineHeight }}
        />
      </div>

      {/* DESKTOP 4 ROWS (800px TOTAL CORRIDOR) */}
      <div className="hidden md:block relative z-10">
        {/* STEP 01 ROW */}
        <div className="h-[200px] grid grid-cols-12 items-center gap-6 relative">
          <div className="col-span-5">
            <TimelineStep
              step={ONBOARDING_STEPS[0]}
              state={getStepState(1)}
              align="right"
            />
          </div>

          <div className="col-span-2 flex items-center justify-center relative">
            <TimelineMarker
              stepNumber={1}
              colorHex={ONBOARDING_STEPS[0].colorHex}
              circleRing={ONBOARDING_STEPS[0].circleRing}
              circleShadow={ONBOARDING_STEPS[0].circleShadow}
              state={getStepState(1)}
              offsetX={ONBOARDING_STEPS[0].markerOffset}
            />
          </div>

          <div className="col-span-5" />
        </div>

        {/* STEP 02 ROW */}
        <div className="h-[200px] grid grid-cols-12 items-center gap-6 relative">
          <div className="col-span-5" />

          <div className="col-span-2 flex items-center justify-center relative">
            <TimelineMarker
              stepNumber={2}
              colorHex={ONBOARDING_STEPS[1].colorHex}
              circleRing={ONBOARDING_STEPS[1].circleRing}
              circleShadow={ONBOARDING_STEPS[1].circleShadow}
              state={getStepState(2)}
              offsetX={ONBOARDING_STEPS[1].markerOffset}
            />
          </div>

          <div className="col-span-5">
            <TimelineStep
              step={ONBOARDING_STEPS[1]}
              state={getStepState(2)}
              align="left"
            />
          </div>
        </div>

        {/* STEP 03 ROW */}
        <div className="h-[200px] grid grid-cols-12 items-center gap-6 relative">
          <div className="col-span-5">
            <TimelineStep
              step={ONBOARDING_STEPS[2]}
              state={getStepState(3)}
              align="right"
            />
          </div>

          <div className="col-span-2 flex items-center justify-center relative">
            <TimelineMarker
              stepNumber={3}
              colorHex={ONBOARDING_STEPS[2].colorHex}
              circleRing={ONBOARDING_STEPS[2].circleRing}
              circleShadow={ONBOARDING_STEPS[2].circleShadow}
              state={getStepState(3)}
              offsetX={ONBOARDING_STEPS[2].markerOffset}
            />
          </div>

          <div className="col-span-5" />
        </div>

        {/* STEP 04 ROW */}
        <div className="h-[200px] grid grid-cols-12 items-center gap-6 relative">
          <div className="col-span-5" />

          <div className="col-span-2 flex items-center justify-center relative">
            <TimelineMarker
              stepNumber={4}
              colorHex={ONBOARDING_STEPS[3].colorHex}
              circleRing={ONBOARDING_STEPS[3].circleRing}
              circleShadow={ONBOARDING_STEPS[3].circleShadow}
              state={getStepState(4)}
              offsetX={ONBOARDING_STEPS[3].markerOffset}
            />
          </div>

          <div className="col-span-5">
            <TimelineStep
              step={ONBOARDING_STEPS[3]}
              state={getStepState(4)}
              align="left"
            />
          </div>
        </div>
      </div>

      {/* MOBILE SINGLE-COLUMN TIMELINE (< md) */}
      <div className="md:hidden space-y-7 relative z-10">
        {ONBOARDING_STEPS.map((step) => {
          const stepState = getStepState(step.number);

          return (
            <div
              key={step.num}
              className="flex items-start gap-4 pl-1"
            >
              <div className="mt-1 shrink-0">
                <TimelineMarker
                  stepNumber={step.number}
                  colorHex={step.colorHex}
                  circleRing={step.circleRing}
                  circleShadow={step.circleShadow}
                  state={stepState}
                />
              </div>

              <div className="flex-1">
                <TimelineStep
                  step={step}
                  state={stepState}
                  align="left"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ========================================================
// 6. MAIN PAGE COMPONENT
// ========================================================
export const GetStartedPage: React.FC = () => {
  const [pricing, setPricing] = useState({ firstYearMembershipFee: 99, renewalMembershipFee: 5999 });

  useEffect(() => {
    fetchPlatformPricingConfig().then((cfg) => {
      if (cfg) {
        setPricing({
          firstYearMembershipFee: cfg.firstYearMembershipFee,
          renewalMembershipFee: cfg.renewalMembershipFee
        });
      }
    });
  }, []);
  return (
    <div className="w-full min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#C66B52] selection:text-white">
      <div className="max-w-[880px] mx-auto space-y-6 sm:space-y-8">
        {/* ========================================================
            SECTION 1: UNIFIED WELCOME SECTION
           ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl border border-[#E8DBC8] shadow-sm p-6 sm:p-8 md:p-10 text-center space-y-5"
        >
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8064A9]/10 border border-[#8064A9]/20 text-[#8064A9] text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#8064A9] animate-pulse"></span>
            Official Member Onboarding • FIC Ecosystem
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-[42px] font-black text-[#29302D] tracking-tight leading-tight">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-[#8064A9] via-[#C66B52] to-[#D99B43] bg-clip-text text-transparent">
              FIC Business Hub
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-xs sm:text-sm md:text-base text-[#5A5047] leading-relaxed max-w-2xl mx-auto font-medium">
            Your gateway to verified business networking, dynamic sector workspaces, and FIC-facilitated commercial opportunities across India.
          </p>

          {/* 3 Executive Trust Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 pt-3 text-left">
            {/* Pillar 1: Verified 18+ Trust */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FCFAF7] border border-[#E8DBC8]/70 hover:border-[#8064A9]/40 transition-colors flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#8064A9]/10 text-[#8064A9] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <ShieldCheckIcon size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black text-[#29302D]">Verified 18+ Trust</h2>
                <p className="text-[11px] sm:text-[11.5px] text-[#6E6359] mt-0.5 leading-relaxed font-medium">
                  Category-specific KYC verification ensures an authenticated, genuine business community.
                </p>
              </div>
            </div>

            {/* Pillar 2: 100% Privacy Safeguard */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FCFAF7] border border-[#E8DBC8]/70 hover:border-[#3B9C91]/40 transition-colors flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#3B9C91]/10 text-[#3B9C91] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <LockIcon size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black text-[#29302D]">100% Privacy Safeguard</h2>
                <p className="text-[11px] sm:text-[11.5px] text-[#6E6359] mt-0.5 leading-relaxed font-medium">
                  Provider contact numbers are never exposed to public spam. Requests are coordinated by FIC.
                </p>
              </div>
            </div>

            {/* Pillar 3: FIC Coordination */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FCFAF7] border border-[#E8DBC8]/70 hover:border-[#D99B43]/40 transition-colors flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D99B43]/10 text-[#D99B43] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <BriefcaseIcon size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black text-[#29302D]">FIC Coordination</h2>
                <p className="text-[11px] sm:text-[11.5px] text-[#6E6359] mt-0.5 leading-relaxed font-medium">
                  Dedicated FIC officers review specifications, contact providers, and monitor proposal execution.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================
            SECTION 2: 4-STEP ONBOARDING JOURNEY WITH CURVED S-TIMELINE
            AND SYNCHRONIZED SCROLL COLOR REVEAL & BLUR ANIMATION
           ======================================================== */}
        <div className="bg-white rounded-3xl border border-[#E8DBC8] shadow-sm p-6 sm:p-10 md:p-12 space-y-8 sm:space-y-12 relative overflow-hidden">
          {/* Section Header */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#29302D] tracking-tight">
              Simple 4-Step Onboarding Journey
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6359] font-medium leading-relaxed">
              Scroll down to explore how verification, dynamic category selection, and pass activation work.
            </p>
          </div>

          {/* ONBOARDING TIMELINE CONTAINER */}
          <OnboardingTimeline />

          {/* ACTION BUTTON RIGHT AFTER STEP 04 */}
          <div className="pt-6 sm:pt-8 text-center border-t border-[#E8DBC8]/60 relative z-10 space-y-3">
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-[#8064A9] via-[#C66B52] to-[#E8795B] hover:opacity-95 text-white font-black text-sm sm:text-base shadow-lg shadow-[#C66B52]/25 inline-flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <span>Continue to Registration</span>
                <ArrowRightIcon size={18} />
              </motion.button>
            </Link>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#6E6359]">
              <span>Already a member?</span>
              <Link to="/login" className="text-[#C66B52] hover:underline font-bold">
                Sign In to Member Portal →
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================
            SECTION 3: TRANSPARENT MEMBERSHIP TERMS (FIC BRANDED)
            WITH ₹99 PASS SPRING ZOOM-IN & SUBTLE BREATHING HIGHLIGHT
           ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gradient-to-br from-[#29302D] via-[#20251F] to-[#29302D] text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl space-y-6 border border-[#E8DBC8]/30 relative overflow-hidden"
        >
          {/* Subtle warm golden ambient backdrop glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D99B43]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2 relative z-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D99B43]">
                Transparent Fee Structure
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Fair & Predictable Membership Terms
              </h2>
            </div>
            <div className="self-start sm:self-auto px-3 py-1 rounded-full bg-[#3B9C91]/20 border border-[#3B9C91]/40 text-[#54C7B8] text-xs font-bold">
              All 10 Sectors
            </div>
          </div>

          {/* 2 Plan Cards: ₹99 First-Year vs ₹5,999 Annual Renewal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative z-10 items-stretch">
            {/* FIRST-YEAR INTRODUCTORY ACCESS CARD (₹99) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.90, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{
                duration: 0.7,
                type: 'spring',
                stiffness: 160,
                damping: 18
              }}
              className="p-5 sm:p-7 rounded-2xl bg-gradient-to-br from-[#332A24] via-[#28221D] to-[#221C18] border-2 border-[#D99B43] shadow-2xl relative overflow-hidden animate-zoom-in-out cursor-pointer group flex flex-col justify-between"
            >
              <div className="absolute top-3.5 right-3.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#D99B43] text-[#1E1728] px-2.5 py-0.5 rounded-full shadow-sm">
                  Introductory Pass
                </span>
              </div>

              <div>
                <span className="text-xs text-[#EADFCF] block font-bold uppercase tracking-wider">
                  First-Year Ecosystem Access
                </span>

                {/* ₹99 AMOUNT WITH SPRING SCALE HIGHLIGHT */}
                <div className="flex items-baseline gap-2 mt-2.5">
                  <motion.span
                    initial={{ scale: 0.85, opacity: 0 }}
                    whileInView={{ scale: [0.85, 1.12, 1], opacity: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.2,
                      type: 'spring',
                      stiffness: 260,
                      damping: 15
                    }}
                    className="text-4xl sm:text-5xl font-black text-[#D99B43] drop-shadow-md tracking-tight inline-block"
                  >
                    ₹{pricing.firstYearMembershipFee}
                  </motion.span>
                  <span className="text-xs text-[#EADFCF]/80 font-medium">/ first 365 days</span>
                </div>

                <p className="text-xs text-[#EADFCF]/85 mt-3 leading-relaxed font-medium">
                  Complete introductory onboarding pass. Identical across all categories. Includes full marketplace and dynamic workspace tools.
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-[#D99B43] font-bold">
                <span className="flex items-center gap-1.5">
                  <SparklesIcon size={14} /> 365 Days Full Access
                </span>
                <span className="text-[#EADFCF]/70 font-medium">Renewal: ₹{pricing.renewalMembershipFee.toLocaleString('en-IN')}/yr</span>
              </div>
            </motion.div>

            {/* Standard Annual Renewal Card */}
            <div className="p-5 sm:p-7 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs text-[#EADFCF]/60 block font-bold uppercase tracking-wider">
                  Annual Renewal (Year 2 onwards)
                </span>
                <div className="flex items-baseline gap-2 mt-2.5">
                  <span className="text-3xl sm:text-4xl font-black text-white">₹{pricing.renewalMembershipFee.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-[#EADFCF]/60 font-medium">/ year</span>
                </div>
                <p className="text-xs text-[#EADFCF]/70 mt-3 leading-relaxed font-medium">
                  Standard annual membership renewal for active verified accounts. No surge fees, fake countdowns, or surprise charges.
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/10 text-[11px] text-[#EADFCF]/60 font-medium flex items-center gap-1.5">
                <ShieldCheckIcon size={14} className="text-[#3B9C91]" />
                <span>Predictable transparent enterprise governance</span>
              </div>
            </div>
          </div>

          {/* Included Features Grid */}
          <div className="pt-2 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#EADFCF]/70 block mb-3">
              Included in Your ₹{pricing.firstYearMembershipFee} Membership:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#EADFCF]/90">
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#3B9C91] shrink-0" />
                <span>Full access to Universal Services Marketplace</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#3B9C91] shrink-0" />
                <span>Sector-tailored dynamic dashboard & workspace</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#3B9C91] shrink-0" />
                <span>Business idea validation & incubation desk</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#3B9C91] shrink-0" />
                <span>Confidential investment & funding channel</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#3B9C91] shrink-0" />
                <span>FIC-mediated commercial introductions & B2B tie-ups</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#3B9C91] shrink-0" />
                <span>Strict privacy safeguard for contact data</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================
            FINAL BOTTOM ACTIONS
           ======================================================== */}
        <div className="text-center space-y-3 pt-2 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/register" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="w-full sm:w-auto px-9 py-3.5 rounded-xl bg-[#29302D] hover:bg-[#1C1824] text-white font-black text-sm shadow-md inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Proceed to Registration</span>
                <ArrowRightIcon size={16} />
              </motion.button>
            </Link>

            <Link to="/login" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-[#29302D] bg-white border border-[#E8DBC8] hover:bg-[#FCFAF7] font-bold text-sm shadow-2xs transition-colors cursor-pointer"
              >
                Already a Member? Sign In
              </button>
            </Link>
          </div>

          <p className="text-xs text-[#6E6359] font-medium">
            Questions? Contact our coordination desk at{' '}
            <a href="mailto:support@ficapp.in" className="text-[#C66B52] hover:underline font-bold">
              support@ficapp.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
