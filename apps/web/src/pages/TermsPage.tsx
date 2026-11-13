import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="bg-[#FCFAF6] text-[#29302D] py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-[#E8DBC8] shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#397B55]">
            Terms of Service
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-[#29302D] mt-1">
            Terms & Conditions of Membership
          </h1>
          <p className="text-xs text-[#77786E] mt-2">
            Effective Date: 2026 &bull; FIC Business Hub (www.ficapp.in)
          </p>
        </div>

        <section className="space-y-3 text-xs sm:text-sm text-[#29302D]/85 leading-relaxed">
          <h2 className="text-base sm:text-lg font-bold text-[#29302D]">1. Adult Eligibility (18+ Requirement)</h2>
          <p>
            Participation in FIC Business Hub is restricted strictly to legal adults of eighteen (18) years of age or older capable of entering legally binding commercial contracts under applicable Indian law.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-[#29302D]/85 leading-relaxed">
          <h2 className="text-base sm:text-lg font-bold text-[#29302D]">2. Membership Fees & Validity</h2>
          <p>
            First-year onboarding access is granted at the prevailing introductory rate (published under Membership Pricing) for a period of 365 calendar days following account activation and successful KYC verification. Renewal for subsequent years is billed at the standard annual rate as configured under platform pricing. Membership fees are non-refundable once verification processing commences.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-[#29302D]/85 leading-relaxed">
          <h2 className="text-base sm:text-lg font-bold text-[#29302D]">3. Commercial Code of Conduct</h2>
          <p>
            Members agree to conduct all commercial interactions in good faith. False representation of manufacturing capacities, financial credentials, fraudulent patent/idea claims, or circumventing FIC intermediary guidelines to solicit unsolicited commercial spam will result in immediate membership revocation without notice.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-[#29302D]/85 leading-relaxed">
          <h2 className="text-base sm:text-lg font-bold text-[#29302D]">4. Role as Intermediary Coordinator</h2>
          <p>
            FIC Business Hub acts as an opportunity discoverability facilitator and intermediary platform. FIC does not hold custody of investment capital, nor does it guarantee specific return-on-investment figures. Members are advised to conduct standard commercial due diligence before executing financial transactions.
          </p>
        </section>

        <div className="pt-4 border-t border-[#E8DBC8] text-xs text-[#77786E]">
          For commercial compliance or legal inquiries, email{' '}
          <a href="mailto:support@ficapp.in" className="text-[#397B55] underline font-medium">
            support@ficapp.in
          </a>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;

