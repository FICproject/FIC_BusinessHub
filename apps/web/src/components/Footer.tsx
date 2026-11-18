import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { fetchPlatformPricingConfig } from '../services/api';

export const Footer: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
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
    <motion.footer
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white text-[#51463F] border-t border-[#EDE2D7] pt-14 pb-8 select-none transition-colors"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Col 1: Brand & Company Identity */}
          <div className="space-y-3.5 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 group focus:outline-none">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#E8795B] flex items-center justify-center text-white font-black text-sm shadow-[0_4px_10px_rgba(109,40,217,0.2)] shrink-0 transition-transform group-hover:scale-105">
                FIC
              </div>
              <div className="flex flex-col">
                <span className="text-[17px] font-black text-[#51463F] group-hover:text-[#6D28D9] tracking-tight leading-tight transition-colors">
                  FIC Business Hub
                </span>
                <span className="text-[10px] font-semibold text-[#82776E] tracking-wide uppercase leading-none mt-0.5">
                  Forge India Connect Pvt. Ltd.
                </span>
              </div>
            </Link>
            <p className="text-xs text-[#82776E] leading-relaxed">
              A trusted business ecosystem connecting entrepreneurs, MSMEs, professionals, mentors, and students across India to discover opportunities, access services, and grow together.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#51463F] uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-[#82776E]">
              <li>
                <Link to="/" className="hover:text-[#6D28D9] transition-colors inline-block hover:translate-x-0.5 transform">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#6D28D9] transition-colors inline-block hover:translate-x-0.5 transform">
                  About Us
                </Link>
              </li>
              <li>
                <a href="/#services" className="hover:text-[#6D28D9] transition-colors inline-block hover:translate-x-0.5 transform">
                  Services
                </a>
              </li>
              <li>
                <Link to="/membership" className="hover:text-[#6D28D9] transition-colors inline-block hover:translate-x-0.5 transform">
                  Membership (₹{pricing.firstYearMembershipFee})
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#6D28D9] transition-colors inline-block hover:translate-x-0.5 transform">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Services & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#51463F] uppercase tracking-wider">
              Legal & Compliance
            </h4>
            <ul className="space-y-2 text-xs text-[#82776E]">
              <li>
                <Link to="/privacy-policy" className="hover:text-[#6D28D9] transition-colors inline-block hover:translate-x-0.5 transform">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="hover:text-[#6D28D9] transition-colors inline-block hover:translate-x-0.5 transform">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/membership" className="hover:text-[#6D28D9] transition-colors inline-block hover:translate-x-0.5 transform">
                  KYC Verification Guidelines
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-[#6D28D9] font-bold hover:underline inline-block hover:translate-x-0.5 transform">
                  Become a Member &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Connect & Social Media */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#51463F] uppercase tracking-wider">
              Connect With Us
            </h4>
            <p className="text-xs text-[#82776E] leading-relaxed">
              Have questions or want to collaborate with Forge India Connect? Reach out to our team.
            </p>
            {/* Social Media Links with micro-interactions */}
            <div className="flex items-center gap-2.5 pt-1">
              {[
                {
                  label: 'LinkedIn',
                  href: 'https://linkedin.com',
                  path: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z'
                },
                {
                  label: 'Twitter / X',
                  href: 'https://twitter.com',
                  path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
                },
                {
                  label: 'Facebook',
                  href: 'https://facebook.com',
                  path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'
                },
                {
                  label: 'Instagram',
                  href: 'https://instagram.com',
                  path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689-.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'
                }
              ].map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.12, y: -2 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.92 }}
                  className="w-8 h-8 rounded-lg border border-[#EDE2D7] flex items-center justify-center text-[#82776E] hover:text-[#6D28D9] hover:border-[#6D28D9]/40 hover:bg-[#FAF7F2] transition-colors"
                >
                  <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d={social.path} />
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright Notice */}
        <div className="pt-6 border-t border-[#EDE2D7] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#82776E]">
          <p>© {new Date().getFullYear()} Forge India Connect Pvt. Ltd. All rights reserved.</p>
          <p>CIN: Verified Indian Corporate Entity • Intermediary Platform</p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
