import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge, Card } from '@fic/ui';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  LockIcon,
  BriefcaseIcon,
  TrendingUpIcon
} from '../components/Icons';

export const GetStartedPage: React.FC = () => {
  return (
    <div className="bg-slate-50/80 min-h-screen py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Executive Hero Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
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
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
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

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
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

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
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

        {/* 4-Step Onboarding Journey */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Simple 4-Phase Onboarding Journey
              </h2>
              <p className="text-xs text-slate-500">
                Registration takes approximately 3-5 minutes from start to finish.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full shrink-0">
              Step-by-Step Guidance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phase 1 */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2 hover:border-blue-400 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Phase 01</span>
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center">1</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Basic Account & Age Eligibility</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your full name, email, 10-digit mobile number, and confirm legal adult eligibility (18+).
              </p>
            </div>

            {/* Phase 2 */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2 hover:border-blue-400 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Phase 02</span>
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center">2</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Primary Sector & Dynamic Profile</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose 1 of the 10 business categories and answer configuration-driven questions customized to your domain.
              </p>
            </div>

            {/* Phase 3 */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2 hover:border-blue-400 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Phase 03</span>
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center">3</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">First-Year Membership Pass (₹99)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete the ₹99 introductory fee payment for a full 365 days of universal ecosystem access.
              </p>
            </div>

            {/* Phase 4 */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2 hover:border-blue-400 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Phase 04</span>
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center">4</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Category KYC & Dashboard Activation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your sector proof (e.g. Aadhaar, GSTIN, Student ID) to activate your live personalized dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Transparency & Value Matrix */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <span className="text-xs text-slate-400 block font-medium">First-Year Introductory Access</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-amber-400">₹99</span>
                <span className="text-xs text-slate-400">/ first 365 days</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Special introductory ecosystem onboarding fee. Identical across all categories.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <span className="text-xs text-slate-400 block font-medium">Annual Renewal (Year 2 onwards)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">₹5,999</span>
                <span className="text-xs text-slate-400">/ year</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Standard annual membership renewal. No fake countdown timers or hidden costs.
              </p>
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
