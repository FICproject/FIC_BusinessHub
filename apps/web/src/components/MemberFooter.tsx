import React from 'react';
import { Link } from 'react-router-dom';

export const MemberFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#FAF7F2] border-t border-[#EDE2D7] py-3.5 text-xs text-[#82776E] select-none">
      <div className="w-full px-3.5 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} FIC Business Hub. All rights reserved.</span>
          <span className="hidden sm:inline text-[#E5A23B]">•</span>
          <span className="hidden sm:inline text-[11px] font-semibold text-[#8064B1] bg-[#8064B1]/10 px-2.5 py-0.5 rounded-full border border-[#8064B1]/20">
            Authenticated Workspace
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#82776E]">
          <a
            href="mailto:support@ficapp.in"
            className="hover:text-[#E8795B] transition-colors"
            title="Desk Support"
          >
            Help & Support
          </a>
          <Link to="/contact" className="hover:text-[#E8795B] transition-colors">
            Contact Support
          </Link>
          <Link to="/privacy-policy" className="hover:text-[#E8795B] transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms-and-conditions" className="hover:text-[#E8795B] transition-colors">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default MemberFooter;

