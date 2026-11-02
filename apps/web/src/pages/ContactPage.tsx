import React from 'react';
import { ShieldCheckIcon } from '../components/Icons';

export const ContactPage: React.FC = () => {
  return (
    <div className="bg-[#FCFAF6] text-[#29302D] py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#8064A9] bg-[#8064A9]/10 rounded-full">
            Help Desk & Intermediary Support
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-[#29302D] tracking-tight">
            Contact FIC Coordination Desk
          </h1>
          <p className="text-sm sm:text-base text-[#77786E] max-w-2xl mx-auto leading-relaxed">
            Need assistance with verification, member onboarding, or an active business proposal? Our coordination desk is at your service.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-[#F5EBDD] p-8 rounded-3xl border border-[#E8DBC8] shadow-xs space-y-4">
            <h3 className="font-bold text-lg text-[#29302D]">Coordination & Help Desk</h3>
            <p className="text-xs text-[#77786E] leading-relaxed">
              Official email for proposal tracking, KYC verification queries, and platform support.
            </p>
            <div className="pt-2">
              <span className="text-xs text-[#77786E] block font-medium">Direct Email:</span>
              <a
                href="mailto:support@ficapp.in"
                className="text-base font-bold text-[#C66B52] hover:underline"
              >
                support@ficapp.in
              </a>
            </div>
            <div>
              <span className="text-xs text-[#77786E] block font-medium">Working Hours:</span>
              <span className="text-xs font-bold text-[#29302D]">
                Monday – Saturday: 9:00 AM – 6:00 PM IST
              </span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#E8DBC8] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#397B55]">
              <ShieldCheckIcon size={18} />
              <span>Privacy Safeguard Notice</span>
            </div>
            <h3 className="font-bold text-lg text-[#29302D]">Intermediary Protection</h3>
            <p className="text-xs text-[#77786E] leading-relaxed">
              In accordance with FIC privacy charter, telephone numbers of registered members are never publicly disclosed. All direct commercial communications are handled through verified proposals via FIC desk officers.
            </p>
            <div className="pt-2 text-xs text-[#77786E]">
              Domain: <span className="font-mono font-bold text-[#29302D]">www.ficapp.in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

