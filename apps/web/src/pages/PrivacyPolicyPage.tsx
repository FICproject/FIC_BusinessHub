import React from 'react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="bg-[#FCFAF6] text-[#29302D] py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-[#E8DBC8] shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C66B52]">
            FIC Legal Governance
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-[#29302D] mt-1">
            Privacy Safeguard Policy
          </h1>
          <p className="text-xs text-[#77786E] mt-2">
            Last Updated: 2026 &bull; Domain: www.ficapp.in
          </p>
        </div>

        <section className="space-y-3 text-xs sm:text-sm text-[#29302D]/85 leading-relaxed">
          <h2 className="text-base sm:text-lg font-bold text-[#29302D]">1. Intermediary Privacy Protection</h2>
          <p>
            FIC Business Hub operates under a strict intermediary protocol. Unlike conventional public directories, your mobile phone number, personal identification, and proprietary contact details are not published on open web pages or indexed by external search engines.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-[#29302D]/85 leading-relaxed">
          <h2 className="text-base sm:text-lg font-bold text-[#29302D]">2. Collection of KYC Credentials</h2>
          <p>
            To eliminate fake accounts and spam brokers, members are required to submit identity documents (such as Aadhaar, PAN, GSTIN, or Udyam certificate). These files are processed through encrypted channels and verified exclusively by authorized FIC compliance officers.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-[#29302D]/85 leading-relaxed">
          <h2 className="text-base sm:text-lg font-bold text-[#29302D]">3. Facilitated Commercial Matchmaking</h2>
          <p>
            When a verified member expresses interest in another provider's listing or proposal, the introduction is reviewed and facilitated by an assigned FIC Coordinator. Direct contact information is disclosed only upon mutual authorization of both commercial parties.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-[#29302D]/85 leading-relaxed">
          <h2 className="text-base sm:text-lg font-bold text-[#29302D]">4. Data Security & Storage</h2>
          <p>
            We deploy multi-tier database encryption and industry-standard security protocols to prevent unauthorized access, alteration, or disclosure of member credentials and commercial submissions.
          </p>
        </section>

        <div className="pt-4 border-t border-[#E8DBC8] text-xs text-[#77786E]">
          For privacy inquiries or data requests, contact our privacy desk at{' '}
          <a href="mailto:support@ficapp.in" className="text-[#C66B52] underline font-medium">
            support@ficapp.in
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
