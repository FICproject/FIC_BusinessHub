import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from './Icons';
import { fetchPlatformPricingConfig } from '../services/api';

export const Footer: React.FC = () => {
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
    <footer className="bg-[#29302D] text-[#FCFAF6] pt-16 pb-12 border-t border-[#D99B43]/20 selection:bg-[#C66B52] selection:text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: About FIC */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#29302D] border border-[#D99B43]/50 flex items-center justify-center text-[#FCFAF6] font-black text-sm shadow-md group-hover:bg-[#8064A9] transition-colors">
                FIC
              </div>
              <div>
                <span className="text-base font-black text-[#FCFAF6] tracking-tight block">
                  FIC Business Hub
                </span>
                <span className="text-[10px] text-[#D99B43] font-semibold tracking-wider block uppercase">
                  Opportunity Ecosystem
                </span>
              </div>
            </Link>
            <p className="text-xs text-[#E8DBC8] leading-relaxed">
              Where Ideas Meet Opportunities. An enterprise-grade business ecosystem uniting entrepreneurs, enterprises, manufacturers, investors, and professionals across India.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#D99B43] bg-[#29302D]/80 p-2.5 rounded-xl border border-[#D99B43]/30">
              <ShieldCheckIcon size={16} className="shrink-0 text-[#E58C72]" />
              <span>FIC Intermediary Coordination & Privacy Safeguard</span>
            </div>
          </div>

          {/* Col 2: Business Hub */}
          <div>
            <h4 className="text-[#D99B43] text-xs font-bold uppercase tracking-wider mb-4">
              Business Hub Capabilities
            </h4>
            <ul className="space-y-2.5 text-xs text-[#E8DBC8]">
              <li>
                <Link to="/marketplace" className="hover:text-[#E58C72] hover:translate-x-1 inline-block transition-transform duration-200">
                  Universal Services Marketplace
                </Link>
              </li>
              <li>
                <Link to="/business-ideas" className="hover:text-[#E58C72] hover:translate-x-1 inline-block transition-transform duration-200">
                  Business Ideas & Incubation
                </Link>
              </li>
              <li>
                <Link to="/business-development" className="hover:text-[#E58C72] hover:translate-x-1 inline-block transition-transform duration-200">
                  Business Development & Scaling
                </Link>
              </li>
              <li>
                <Link to="/investment" className="hover:text-[#E58C72] hover:translate-x-1 inline-block transition-transform duration-200">
                  Private Investment & Funding
                </Link>
              </li>
              <li>
                <Link to="/business-development" className="hover:text-[#E58C72] hover:translate-x-1 inline-block transition-transform duration-200">
                  Enterprise Scaling & Advisory
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Membership */}
          <div>
            <h4 className="text-[#D99B43] text-xs font-bold uppercase tracking-wider mb-4">
              Membership Structure
            </h4>
            <ul className="space-y-2.5 text-xs text-[#E8DBC8]">
              <li>
                <Link to="/membership" className="hover:text-[#D99B43] transition-colors flex items-center gap-2">
                  <span className="text-[#D99B43] font-bold">First-Year Access: ₹{pricing.firstYearMembershipFee}</span>
                  <span className="text-[10px] bg-[#D99B43]/20 text-[#D99B43] px-2 py-0.5 rounded-full font-semibold border border-[#D99B43]/30">
                    Introductory
                  </span>
                </Link>
              </li>
              <li className="text-[#A7AAA0]">Annual Renewal: ₹{pricing.renewalMembershipFee.toLocaleString('en-IN')}/yr (Year 2+)</li>
              <li>
                <Link to="/membership" className="hover:text-[#FCFAF6] transition-colors">
                  Category KYC Guidelines
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="hover:text-[#FCFAF6] transition-colors">
                  18+ Legal Adult Eligibility Policy
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#C66B52] font-semibold transition-colors flex items-center gap-1.5">
                  <span>Register as a Member</span>
                  <span className="text-xs">&rarr;</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Us & Operations */}
          <div>
            <h4 className="text-[#D99B43] text-xs font-bold uppercase tracking-wider mb-4">
              Contact Us & Support
            </h4>
            <p className="text-xs text-[#E8DBC8] leading-relaxed mb-3">
              FIC acts as the central coordinator for all introductions and business proposals. Provider contact numbers remain confidential to prevent spam.
            </p>
            <div className="text-xs text-[#E8DBC8] space-y-1.5">
              <div>
                Coordination Desk:{' '}
                <a href="mailto:support@ficapp.in" className="text-[#D99B43] hover:underline font-mono">
                  support@ficapp.in
                </a>
              </div>
              <div>Domain: <span className="text-[#FCFAF6] font-mono">www.ficapp.in</span></div>
              <div className="text-[#A7AAA0] pt-1">
                Desk Hours: Monday – Saturday, 9:00 AM – 6:00 PM IST
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Legal & Informational Navigation */}
        <div className="pt-8 mt-8 border-t border-[#D99B43]/20 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A7AAA0] gap-4">
          <div>
            &copy; {new Date().getFullYear()} FIC Business Hub (www.ficapp.in). All rights reserved.
          </div>
          <div className="flex flex-wrap gap-5 sm:gap-6 text-[#E8DBC8]">
            <Link to="/about" className="hover:text-[#D99B43] transition-colors">About FIC</Link>
            <Link to="/marketplace" className="hover:text-[#D99B43] transition-colors">Business Hub</Link>
            <Link to="/membership" className="hover:text-[#D99B43] transition-colors">Membership</Link>
            <Link to="/contact" className="hover:text-[#D99B43] transition-colors">Contact Us</Link>
            <Link to="/privacy-policy" className="hover:text-[#D99B43] transition-colors">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-[#D99B43] transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
