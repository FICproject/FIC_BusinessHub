import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, LockIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B1020] text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: About FIC */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                FIC
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                FIC Business Hub
              </span>
            </Link>
            <p className="text-xs text-[#AAB4C8] leading-relaxed">
              Connect. Collaborate. Build Your Business Future. An enterprise-grade ecosystem uniting individuals, entrepreneurs, manufacturers, and professionals across India.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <ShieldCheckIcon size={16} className="shrink-0" />
              <span>FIC Intermediary Coordination & Privacy Safeguard</span>
            </div>
          </div>

          {/* Col 2: Business Hub */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">
              Business Hub Capabilities
            </h4>
            <ul className="space-y-2 text-xs text-[#AAB4C8]">
              <li>
                <Link to="/marketplace" className="hover:text-blue-400 transition-colors">
                  Universal Services Marketplace
                </Link>
              </li>
              <li>
                <Link to="/business-ideas" className="hover:text-blue-400 transition-colors">
                  Business Ideas & Incubation
                </Link>
              </li>
              <li>
                <Link to="/business-development" className="hover:text-blue-400 transition-colors">
                  Business Development & Scaling
                </Link>
              </li>
              <li>
                <Link to="/investment" className="hover:text-blue-400 transition-colors">
                  Private Investment & Funding
                </Link>
              </li>
              <li>
                <Link to="/partnerships" className="hover:text-blue-400 transition-colors">
                  Strategic B2B Partnerships
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Membership */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">
              Membership Structure
            </h4>
            <ul className="space-y-2 text-xs text-[#AAB4C8]">
              <li>
                <Link to="/get-started" className="hover:text-[#D6AE55] transition-colors flex items-center gap-2">
                  <span className="text-[#D6AE55] font-bold">First-Year Access: ₹99</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                    Introductory
                  </span>
                </Link>
              </li>
              <li className="text-slate-400">Annual Renewal: ₹5,999/yr</li>
              <li>
                <Link to="/get-started" className="hover:text-blue-400 transition-colors">
                  KYC Verification Guidelines
                </Link>
              </li>
              <li>
                <Link to="/get-started" className="hover:text-blue-400 transition-colors">
                  18+ Adult Eligibility Policy
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-400 transition-colors">
                  Register as a Member
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Us & Operations */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">
              Contact Us & Support
            </h4>
            <p className="text-xs text-[#AAB4C8] leading-relaxed mb-3">
              FIC acts as the central coordinator for all introductions and business proposals. Provider contact numbers are protected from public exposure.
            </p>
            <div className="text-xs text-[#AAB4C8] space-y-1.5">
              <div>
                Coordination Desk:{' '}
                <a href="mailto:support@ficapp.in" className="text-blue-400 hover:underline">
                  support@ficapp.in
                </a>
              </div>
              <div>Domain: <span className="text-white font-mono">www.ficapp.in</span></div>
              <div className="text-slate-500 pt-1">
                Hours: Monday – Saturday, 9:00 AM – 6:00 PM IST
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Legal Information */}
        <div className="pt-8 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} FIC Business Hub (www.ficapp.in). All rights reserved.
          </div>
          <div className="flex flex-wrap gap-6">
            <a href="#about" className="hover:text-slate-300 transition-colors">About FIC</a>
            <a href="#privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-300 transition-colors">Terms & Conditions</a>
            <a href="#legal" className="hover:text-slate-300 transition-colors">Legal Information</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
