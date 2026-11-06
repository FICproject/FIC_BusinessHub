import React, { useEffect, useState, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  animate,
  type HTMLMotionProps
} from 'motion/react';
import {
  fadeIn,
  fadeUp,
  fadeDown,
  slideLeft,
  slideRight,
  scaleIn,
  blurReveal,
  staggerChildren,
  staggerItem,
  springEntrance,
  modalBackdrop,
  modalEntrance,
  pageEnter,
  scrollReveal
} from './variants';
import { motionEasing, motionSprings, motionDurations, motionStaggers } from './tokens';

// ========================================================
// 1. PAGE TRANSITION COMPONENT
// ========================================================
export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={pageEnter}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ========================================================
// 2. SCROLL REVEAL COMPONENT
// ========================================================
export interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  once = true
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const getOffset = () => {
    switch (direction) {
      case 'up':
        return { y: 28, x: 0 };
      case 'down':
        return { y: -28, x: 0 };
      case 'left':
        return { x: 28, y: 0 };
      case 'right':
        return { x: -28, y: 0 };
      case 'none':
      default:
        return { x: 0, y: 0 };
    }
  };

  const offset = getOffset();

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{
        duration: motionDurations.slow,
        delay,
        ease: motionEasing.premium
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ========================================================
// 3. STAGGER CONTAINER & ITEM
// ========================================================
export interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  staggerDelay = motionStaggers.normal
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={staggerChildren(staggerDelay)}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({ children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
};

// ========================================================
// 4. FADE IN & SLIDE REVEAL
// ========================================================
export interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = '',
  delay = 0,
  duration = motionDurations.normal,
  direction = 'none'
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const initialProps: any = { opacity: 0 };
  if (direction === 'up') initialProps.y = 16;
  if (direction === 'down') initialProps.y = -16;
  if (direction === 'left') initialProps.x = 20;
  if (direction === 'right') initialProps.x = -20;

  return (
    <motion.div
      initial={initialProps}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: motionEasing.premium }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface SlideRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
}

export const SlideReveal: React.FC<SlideRevealProps> = ({
  children,
  className = '',
  direction = 'up',
  delay = 0
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  let selectedVariant = fadeUp;
  if (direction === 'down') selectedVariant = fadeDown;
  if (direction === 'left') selectedVariant = slideLeft;
  if (direction === 'right') selectedVariant = slideRight;

  return (
    <motion.div
      variants={selectedVariant}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ========================================================
// 5. SCALE REVEAL
// ========================================================
export interface ScaleRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const ScaleReveal: React.FC<ScaleRevealProps> = ({
  children,
  className = '',
  delay = 0
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ========================================================
// 6. ANIMATED COUNTER (NUMERIC MOTION ENGINE)
// ========================================================
export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1.2,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatter,
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    if (!isInView) return;

    const controls = animate(0, value, {
      duration,
      ease: motionEasing.premium,
      onUpdate: (latest) => {
        setDisplayValue(latest);
      }
    });

    return () => controls.stop();
  }, [value, duration, isInView, shouldReduceMotion]);

  const formatted = formatter
    ? formatter(displayValue)
    : decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString('en-IN');

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

// ========================================================
// 7. ANIMATED PROGRESS BAR
// ========================================================
export interface AnimatedProgressProps {
  value: number; // 0 to 100
  height?: string;
  barColor?: string;
  trackColor?: string;
  className?: string;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  height = 'h-2',
  barColor = 'bg-gradient-to-r from-[#C66B52] to-[#E58C72]',
  trackColor = 'bg-[#FAF7F2]',
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const shouldReduceMotion = useReducedMotion();
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      ref={ref}
      className={`w-full ${height} ${trackColor} rounded-full overflow-hidden ${className}`}
    >
      <motion.div
        className={`h-full ${barColor} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: isInView || shouldReduceMotion ? `${clampedValue}%` : '0%' }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.9,
          ease: motionEasing.premium
        }}
      />
    </div>
  );
};

// ========================================================
// 8. ANIMATED MODAL
// ========================================================
export interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-xl',
  className = ''
}) => {
  const resolvedMaxWidth = maxWidth.startsWith('max-w-') ? maxWidth : `max-w-${maxWidth}`;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalBackdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            variants={modalEntrance}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={`bg-[#FAF7F2] border border-[#EDE2D7] rounded-2xl ${resolvedMaxWidth} w-full p-4 sm:p-5 lg:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto ${className}`}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-[#EDE2D7] pb-3 mb-3.5">
                <div className="font-black text-base sm:text-lg text-[#51463F]">{title}</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white border border-[#EDE2D7] text-[#82776E] hover:text-[#51463F] flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ========================================================
// 9. ANIMATED DRAWER
// ========================================================
export interface AnimatedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'right' | 'left';
}

export const AnimatedDrawer: React.FC<AnimatedDrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'right'
}) => {
  const isRight = position === 'right';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalBackdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: isRight ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRight ? '100%' : '-100%' }}
            transition={motionSprings.drawer}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md h-full bg-[#FAF7F2] border-l border-[#EADFCF] p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ========================================================
// 10. ANIMATED TABS (GLIDING SELECTION INDICATOR)
// ========================================================
export interface TabItem {
  id: string;
  label: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  layoutId?: string;
  className?: string;
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  layoutId = 'activeTabIndicator',
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-1.5 p-1.5 bg-white/70 border border-[#EADFCF] rounded-2xl overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors duration-200 flex items-center gap-2 shrink-0 cursor-pointer ${
              isActive ? 'text-white' : 'text-[#82776E] hover:text-[#51463F]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={motionSprings.snappy}
                className="absolute inset-0 bg-gradient-to-r from-[#E8795B] to-[#D95F3F] rounded-xl shadow-[0_2px_8px_rgba(232,121,91,0.25)] -z-0"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#EDE2D7] text-[#51463F]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ========================================================
// 11. ANIMATED DROPDOWN
// ========================================================
export interface AnimatedDropdownProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedDropdown: React.FC<AnimatedDropdownProps> = ({
  isOpen,
  children,
  className = ''
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ========================================================
// 12. ANIMATED NOTIFICATION TOAST
// ========================================================
export interface AnimatedNotificationProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedNotification: React.FC<AnimatedNotificationProps> = ({
  show,
  children,
  className = ''
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`fixed bottom-6 right-6 z-50 ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ========================================================
// 13. ANIMATED LIST (LAYOUT TRANSITIONS)
// ========================================================
export interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({ children, className = '' }) => {
  return (
    <motion.div layout className={className}>
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </motion.div>
  );
};

// ========================================================
// 14. ANIMATED CARD (PHYSICS & TACTILE GESTURES)
// ========================================================
export interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  interactive = true,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion || !interactive) {
    return (
      <div className={className} {...(props as any)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={springEntrance}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={motionSprings.cardHover}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ========================================================
// 15. ANIMATED SVG (PATH DRAWING ANIMATION)
// ========================================================
export interface AnimatedSVGProps {
  path: string;
  size?: number;
  strokeColor?: string;
  strokeWidth?: number;
  duration?: number;
  className?: string;
}

export const AnimatedSVG: React.FC<AnimatedSVGProps> = ({
  path,
  size = 24,
  strokeColor = '#C66B52',
  strokeWidth = 2,
  duration = 1.2,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      className={className}
    >
      <motion.path
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration, ease: motionEasing.premium }}
      />
    </svg>
  );
};

