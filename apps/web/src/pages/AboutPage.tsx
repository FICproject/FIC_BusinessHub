import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, CheckCircleIcon } from '../components/Icons';
import { fetchPlatformPricingConfig } from '../services/api';

export const AboutPage: React.FC = () => {
  const [fee, setFee] = useState<number>(99);

  useEffect(() => {
    fetchPlatformPricingConfig().then((cfg) => {
      if (cfg?.firstYearMembershipFee) setFee(cfg.firstYearMembershipFee);
    });
  }, []);
  return (
    <div className="bg-[#FCFAF6] text-[#29302D] py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#C66B52] bg-[#C66B52]/10 rounded-full">
            Ecosystem Vision & Governance
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-[#29302D] tracking-tight">
            About FIC Business Hub
          </h1>
          <p className="text-sm sm:text-base text-[#77786E] max-w-2xl mx-auto leading-relaxed">
            FIC Business Hub is India's dedicated enterprise-grade matchmaking and commercial growth ecosystem uniting entrepreneurs, manufacturers, investors, and licensed professionals.
          </p>
        </div>

        {/* Mission Card */}
        <div className="bg-[#F5EBDD] p-8 sm:p-10 rounded-3xl border border-[#E8DBC8] shadow-sm space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-[#29302D]">
            Our Core Mission: Opportunity Discovery Without Spam
          </h2>
          <p className="text-sm text-[#29302D]/80 leading-relaxed">
            In standard directories, contact details are openly scraped, leading to unsolicited calls, broker spam, and privacy exposure. FIC Business Hub operates on an <strong>intermediary privacy safeguard model</strong>: provider identities remain protected, proposals are verified, and introductions are facilitated through structured FIC desks.
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8DBC8] shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#D99B43]/15 text-[#B87A28] flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="font-bold text-base text-[#29302D]">10 Core Sectors</h3>
            <p className="text-xs text-[#77786E] leading-relaxed">
              Dedicated ecosystems across Technology, Manufacturing, Agriculture, Healthcare, Legal, and Finance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DBC8] shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#C66B52]/15 text-[#C66B52] flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="font-bold text-base text-[#29302D]">KYC Verification</h3>
            <p className="text-xs text-[#77786E] leading-relaxed">
              Every member verifies Aadhaar/PAN, business credentials, and adult eligibility (18+) for legitimate commerce.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DBC8] shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#8064A9]/15 text-[#8064A9] flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="font-bold text-base text-[#29302D]">Intermediary Guarantee</h3>
            <p className="text-xs text-[#77786E] leading-relaxed">
              FIC Coordinators curate introductions, preventing untrusted spam or unverified commercial claims.
            </p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-[#29302D] text-[#FCFAF6] p-8 sm:p-10 rounded-3xl text-center space-y-5">
          <h2 className="text-2xl font-black text-[#FCFAF6]">Ready to build your business network?</h2>
          <p className="text-xs sm:text-sm text-[#E8DBC8] max-w-lg mx-auto">
            Get first-year access for introductory ₹{fee} and unlock verified discovery across all 10 sectors.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/get-started"
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#C66B52] hover:bg-[#D99B43] text-white shadow-md transition-all"
            >
              Become a Member (₹{fee})
            </Link>
            <Link
              to="/contact"
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-[#FCFAF6] border border-white/20 transition-all"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

