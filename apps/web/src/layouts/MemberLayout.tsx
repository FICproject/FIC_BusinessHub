import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { MemberHeader } from '../components/MemberHeader';
import { MemberFooter } from '../components/MemberFooter';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface MemberLayoutProps {
  children?: React.ReactNode;
}

export const MemberLayout: React.FC<MemberLayoutProps> = ({ children }) => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#51463F] font-sans relative overflow-x-hidden selection:bg-[#E8795B]/20 selection:text-[#E8795B]">
      {/* ========================================================
          AMBIENT MULTICOLOUR BACKGROUND MESH GLOWS
          Subtle luxury floating glows that give the authenticated portal depth
         ======================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Left Coral/Amber Floating Glow */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, 25, 0],
                  y: [0, -20, 0]
                }
          }
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#E8795B]/10 via-[#E5A23B]/7 to-transparent blur-3xl"
        />

        {/* Top-Right Royal Violet/Lavender Floating Glow */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, -30, 0],
                  y: [0, 25, 0]
                }
          }
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-10 -right-32 w-[560px] h-[560px] rounded-full bg-gradient-to-bl from-[#8064B1]/10 via-[#F4D8D0]/8 to-transparent blur-3xl"
        />

        {/* Mid-Page Amber Glow */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 0.9, 0.7]
                }
          }
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-[35%] -left-48 w-[480px] h-[480px] rounded-full bg-gradient-to-r from-[#E5A23B]/6 to-transparent blur-3xl"
        />

        {/* Bottom Coral/Teal Glow */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, 20, 0],
                  y: [0, -25, 0]
                }
          }
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute -bottom-48 right-10 w-[640px] h-[640px] rounded-full bg-gradient-to-tl from-[#E8795B]/8 via-[#3B9C91]/6 to-transparent blur-3xl"
        />
      </div>

      {/* Global Member Header */}
      <div className="relative z-50">
        <MemberHeader />
      </div>

      {/* Protected Workspace Page Content with Instant Non-Blocking Route Entrance & Error Boundary */}
      <main className="flex-1 w-full relative z-10 flex flex-col">
        <ErrorBoundary>
          <div className="flex-1 flex flex-col w-full">
            {children || <Outlet />}
          </div>
        </ErrorBoundary>
      </main>

      {/* Clean Member Workspace Footer */}
      <div className="relative z-20">
        <MemberFooter />
      </div>
    </div>
  );
};

export default MemberLayout;
