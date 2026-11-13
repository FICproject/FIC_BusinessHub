import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, CheckCircleIcon } from '../components/Icons';
import { fetchPlatformPricingConfig } from '../services/api';

export const MembershipInfoPage: React.FC = () => {
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
    <div className="bg-[#FCFAF6] text-[#29302D] py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D99B43] bg-[#D99B43]/15 rounded-full">
            Transparent Membership Structure
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-[#29302D] tracking-tight">
            Membership Plans & Access Guidelines
          </h1>
          <p className="text-sm sm:text-base text-[#77786E] max-w-2xl mx-auto leading-relaxed">
            FIC Business Hub provides verified commercial opportunities under transparent terms designed to protect legitimate business operators.
          </p>
        </div>

        {/* Pricing Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: 1st Year Access */}
          <div className="bg-[#F5EBDD] p-8 rounded-3xl border-2 border-[#D99B43] shadow-md space-y-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-[#D99B43] text-[#29302D] font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
              Introductory Pass
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C66B52]">
                Phase 1 Onboarding
              </span>
              <h3 className="text-2xl font-black text-[#29302D] mt-1">First-Year Access Pass</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-[#29302D]">₹{pricing.firstYearMembershipFee}</span>
                <span className="text-xs text-[#77786E] font-medium">/ 365 days full access</span>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-[#29302D]/90">
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                <span>Full access across all 10 Core Business Sectors</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                <span>Confidential service requests via FIC intermediary desk</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                <span>Business ideas submission & validation support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                <span>Sector KYC verification & Adult eligibility (18+)</span>
              </li>
            </ul>

            <Link
              to="/get-started"
              className="block w-full py-3 text-center rounded-xl font-bold text-sm bg-[#C66B52] hover:bg-[#D99B43] text-white shadow-md transition-all"
            >
              Get Started for ₹{pricing.firstYearMembershipFee} &rarr;
            </Link>
          </div>

          {/* Card 2: Annual Renewal */}
          <div className="bg-white p-8 rounded-3xl border border-[#E8DBC8] shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#77786E]">
                Sustainable Growth
              </span>
              <h3 className="text-2xl font-black text-[#29302D] mt-1">Annual Renewal (Year 2+)</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-[#29302D]">₹{pricing.renewalMembershipFee.toLocaleString('en-IN')}</span>
                <span className="text-xs text-[#77786E] font-medium">/ year standard renewal</span>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-[#77786E]">
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                <span>Maintains active verified status across network</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                <span>Priority queue in FIC proposal coordination</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                <span>Unlimited proposals, partnerships, and investor queries</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-[#397B55] shrink-0" />
                <span>Dedicated relationship coordinator desk</span>
              </li>
            </ul>

            <div className="pt-2 text-[11px] text-[#77786E] italic">
              * Renewal fee applies only after completing your first year of ₹{pricing.firstYearMembershipFee} introductory access.
            </div>
          </div>
        </div>

        {/* KYC Guidelines Card */}
        <div className="bg-white p-8 rounded-3xl border border-[#E8DBC8] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon size={24} className="text-[#397B55]" />
            <h3 className="text-lg font-bold text-[#29302D]">KYC & Eligibility Requirements</h3>
          </div>
          <p className="text-xs text-[#77786E] leading-relaxed">
            To maintain zero broker spam, all applicants must submit official proof of legal age (18+) and sector credentials (Aadhaar, PAN, GST, Udyam, or trade registration). Documents are strictly reviewed by FIC verification officers and never sold or shared publicly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembershipInfoPage;

