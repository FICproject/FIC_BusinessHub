import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                FIC
              </div>
              <span className="text-lg font-bold text-white">FIC Business Hub</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              One Platform. Unlimited Business Opportunities. An elite membership ecosystem bringing eligible individuals, businesses, manufacturers, and professionals together through FIC-mediated trust.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <ShieldCheckIcon size={16} />
              <span>FIC-Mediated Intermediary Coordination</span>
            </div>
          </div>

          {/* Col 2: Core Sectors */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Key Sectors
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Business & Entrepreneurship</li>
              <li>Manufacturing & Industrial</li>
              <li>Technology & Digital</li>
              <li>Education & Knowledge</li>
              <li>Professional & CA Services</li>
              <li>Agriculture & Natural Resources</li>
              <li>Investment & Private Funding</li>
            </ul>
          </div>

          {/* Col 3: Membership & Features */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Membership & Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <span className="text-amber-400 font-medium">First-Year Offer: ₹99</span>
              </li>
              <li>Annual Renewal: ₹5,999/yr</li>
              <li>Universal Privacy Marketplace</li>
              <li>Business Ideas & Scaling</li>
              <li>Confidential Funding Connections</li>
              <li>B2B Tie-ups & Partnerships</li>
              <li>Category-Tailored KYC Verification</li>
            </ul>
          </div>

          {/* Col 4: Legal & Operations */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Trust & Governance
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              FIC acts as the central coordinator for introductions and service requests. Public listings do not reveal provider contact details. 18+ membership verification applies.
            </p>
            <div className="text-xs text-slate-400 space-y-1">
              <div>Email: <a href="mailto:support@ficapp.in" className="text-blue-400 hover:underline">support@ficapp.in</a></div>
              <div>Web: <span className="text-slate-300">www.ficapp.in</span></div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} FIC Business Hub. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#terms" className="hover:text-slate-400">Terms of Service</a>
            <a href="#privacy" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#compliance" className="hover:text-slate-400">Compliance & KYC Guidelines</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

