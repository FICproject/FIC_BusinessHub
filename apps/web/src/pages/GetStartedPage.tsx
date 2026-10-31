import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge, Card } from '@fic/ui';
import { ShieldCheckIcon, CheckCircleIcon, ArrowRightIcon } from '../components/Icons';

export const GetStartedPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge variant="info" className="mb-3">Ecosystem Onboarding</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome to FIC Business Hub
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Your next business opportunity starts here.
          </p>
        </div>

        <Card className="shadow-lg border border-slate-200 mb-8 p-6 sm:p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                What to expect during onboarding:
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                FIC Business Hub operates with verified trust. Registration takes about 3-5 minutes across these simple phases:
              </p>
            </div>

            {/* Stepper overview */}
            <div className="space-y-4 border-l-2 border-blue-500 pl-4 my-6">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">Phase 1</span>
                <h3 className="text-sm font-semibold text-slate-900">Basic Account & Age Eligibility</h3>
                <p className="text-xs text-slate-500">Provide name, email, 10-digit mobile, and confirm you are 18 years or older.</p>
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">Phase 2</span>
                <h3 className="text-sm font-semibold text-slate-900">Primary Category & Dynamic Details</h3>
                <p className="text-xs text-slate-500">Choose 1 of the 10 business sectors and answer category-specific profile questions.</p>
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">Phase 3</span>
                <h3 className="text-sm font-semibold text-slate-900">First-Year Membership Checkout (₹99)</h3>
                <p className="text-xs text-slate-500">Complete the ₹99 introductory fee payment for 1 full year access.</p>
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">Phase 4</span>
                <h3 className="text-sm font-semibold text-slate-900">Category KYC Document Upload</h3>
                <p className="text-xs text-slate-500">Submit required documents for your category. Full dashboard unlocks upon verification.</p>
              </div>
            </div>

            {/* Pricing transparency box */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-900 uppercase">Membership Fee Structure</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">All Sectors</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                <div>
                  <span className="block text-slate-500">First-Year Introductory Fee:</span>
                  <strong className="text-lg text-slate-900">₹99 for Year 1</strong>
                </div>
                <div>
                  <span className="block text-slate-500">Annual Renewal (Year 2 onwards):</span>
                  <strong className="text-lg text-slate-900">₹5,999 / year</strong>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-blue-200/60">
                Payment does not itself grant instant full access. KYC approval is required to activate the active member dashboard.
              </p>
            </div>

            {/* Terms and compliance */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheckIcon size={16} className="text-emerald-600 shrink-0" />
              <span>FIC conducts verification to protect provider privacy and business legitimacy.</span>
            </div>

            {/* CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <Link to="/register" className="w-full sm:w-auto flex-1">
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
                  Continue Registration
                  <ArrowRightIcon className="ml-2" size={18} />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full">
                  Already a Member? Login
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
