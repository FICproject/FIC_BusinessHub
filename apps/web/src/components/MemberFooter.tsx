import React from 'react';
import { Link } from 'react-router-dom';

export const MemberFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#F5EBDD]/70 border-t border-[#E8DBC8] py-4 text-xs text-[#77786E] select-none">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} FIC Business Hub. All rights reserved.</span>
          <span className="hidden sm:inline text-[#D99B43]">•</span>
          <span className="hidden sm:inline text-[11px] font-semibold text-[#B87A28] bg-[#D99B43]/15 px-2 py-0.5 rounded border border-[#D99B43]/30">
            Authenticated Workspace
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#77786E]">
          <a
            href="mailto:support@ficapp.in"
            className="hover:text-[#C66B52] transition-colors"
            title="Desk Support"
          >
            Help & Support
          </a>
          <Link to="/contact" className="hover:text-[#C66B52] transition-colors">
            Contact Support
          </Link>
          <Link to="/privacy-policy" className="hover:text-[#C66B52] transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms-and-conditions" className="hover:text-[#C66B52] transition-colors">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default MemberFooter;

