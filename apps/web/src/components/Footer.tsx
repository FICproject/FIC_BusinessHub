import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#20251F] text-[#F8F5ED] pt-16 pb-12 border-t border-[#183B2D]/60 selection:bg-[#397B55] selection:text-[#FFFDF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: About FIC */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#183B2D] border border-[#C6A66A]/40 flex items-center justify-center text-[#F8F5ED] font-black text-sm shadow-md group-hover:bg-[#397B55] transition-colors">
                FIC
              </div>
              <div>
                <span className="text-base font-black text-[#F8F5ED] tracking-tight block">
                  FIC Business Hub
                </span>
                <span className="text-[10px] text-[#C6A66A] font-semibold tracking-wider block uppercase">
                  Opportunity Ecosystem
                </span>
              </div>
            </Link>
            <p className="text-xs text-[#A7AAA0] leading-relaxed">
              Where Ideas Meet Opportunities. An enterprise-grade business ecosystem uniting entrepreneurs, enterprises, manufacturers, investors, and professionals across India.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#C6A66A] bg-[#183B2D]/50 p-2.5 rounded-xl border border-[#397B55]/40">
              <ShieldCheckIcon size={16} className="shrink-0 text-[#397B55]" />
              <span>FIC Intermediary Coordination & Privacy Safeguard</span>
            </div>
          </div>

          {/* Col 2: Business Hub */}
          <div>
            <h4 className="text-[#C6A66A] text-xs font-bold uppercase tracking-wider mb-4">
              Business Hub Capabilities
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A7AAA0]">
              <li>
                <Link to="/marketplace" className="hover:text-[#F8F5ED] hover:translate-x-1 inline-block transition-transform duration-200">
                  Universal Services Marketplace
                </Link>
              </li>
              <li>
                <Link to="/business-ideas" className="hover:text-[#F8F5ED] hover:translate-x-1 inline-block transition-transform duration-200">
                  Business Ideas & Incubation
                </Link>
              </li>
              <li>
                <Link to="/business-development" className="hover:text-[#F8F5ED] hover:translate-x-1 inline-block transition-transform duration-200">
                  Business Development & Scaling
                </Link>
              </li>
              <li>
                <Link to="/investment" className="hover:text-[#F8F5ED] hover:translate-x-1 inline-block transition-transform duration-200">
                  Private Investment & Funding
                </Link>
              </li>
              <li>
                <Link to="/partnerships" className="hover:text-[#F8F5ED] hover:translate-x-1 inline-block transition-transform duration-200">
                  Strategic B2B Partnerships
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Membership */}
          <div>
            <h4 className="text-[#C6A66A] text-xs font-bold uppercase tracking-wider mb-4">
              Membership Structure
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A7AAA0]">
              <li>
                <Link to="/get-started" className="hover:text-[#C6A66A] transition-colors flex items-center gap-2">
                  <span className="text-[#C6A66A] font-bold">First-Year Access: ₹99</span>
                  <span className="text-[10px] bg-[#C6A66A]/20 text-[#C6A66A] px-2 py-0.5 rounded-full font-semibold border border-[#C6A66A]/30">
                    Introductory
                  </span>
                </Link>
              </li>
              <li className="text-[#77786E]">Annual Renewal: ₹5,999/yr (Year 2+)</li>
              <li>
                <Link to="/get-started" className="hover:text-[#F8F5ED] transition-colors">
                  Category KYC Guidelines
                </Link>
              </li>
              <li>
                <Link to="/get-started" className="hover:text-[#F8F5ED] transition-colors">
                  18+ Legal Adult Eligibility Policy
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#397B55] font-semibold transition-colors flex items-center gap-1.5">
                  <span>Register as a Member</span>
                  <span className="text-xs">&rarr;</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Us & Operations */}
          <div>
            <h4 className="text-[#C6A66A] text-xs font-bold uppercase tracking-wider mb-4">
              Contact Us & Support
            </h4>
            <p className="text-xs text-[#A7AAA0] leading-relaxed mb-3">
              FIC acts as the central coordinator for all introductions and business proposals. Provider contact numbers remain confidential to prevent spam.
            </p>
            <div className="text-xs text-[#A7AAA0] space-y-1.5">
              <div>
                Coordination Desk:{' '}
                <a href="mailto:support@ficapp.in" className="text-[#C6A66A] hover:underline font-mono">
                  support@ficapp.in
                </a>
              </div>
              <div>Domain: <span className="text-[#F8F5ED] font-mono">www.ficapp.in</span></div>
              <div className="text-[#77786E] pt-1">
                Desk Hours: Monday – Saturday, 9:00 AM – 6:00 PM IST
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Legal Information */}
        <div className="pt-8 mt-8 border-t border-[#183B2D]/40 flex flex-col sm:flex-row items-center justify-between text-xs text-[#77786E] gap-4">
          <div>
            &copy; {new Date().getFullYear()} FIC Business Hub (www.ficapp.in). All rights reserved.
          </div>
          <div className="flex flex-wrap gap-6 text-[#A7AAA0]">
            <a href="#about" className="hover:text-[#C6A66A] transition-colors">About FIC</a>
            <a href="#marketplace" className="hover:text-[#C6A66A] transition-colors">Business Hub</a>
            <a href="#membership" className="hover:text-[#C6A66A] transition-colors">Membership</a>
            <a href="mailto:support@ficapp.in" className="hover:text-[#C6A66A] transition-colors">Contact Us</a>
            <a href="#privacy" className="hover:text-[#C6A66A] transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-[#C6A66A] transition-colors">Terms & Conditions</a>
            <a href="#legal" className="hover:text-[#C6A66A] transition-colors">Legal Information</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
