import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ========================================================
// 1. WORKSPACE CONTAINER / SHELL
// ========================================================
export interface WorkspaceShellProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  children,
  className = '',
  maxWidth = 'full'
}) => {
  const maxClass = {
    '4xl': 'max-w-4xl mx-auto',
    '5xl': 'max-w-5xl mx-auto',
    '6xl': 'w-full',
    '7xl': 'w-full',
    'full': 'w-full'
  }[maxWidth];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`min-h-[calc(100vh-64px)] w-full py-4 sm:py-5 lg:py-6 px-3.5 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12 relative z-10 ${className}`}
    >
      <div className={`w-full ${maxClass} space-y-4 sm:space-y-5 lg:space-y-6`}>
        {children}
      </div>
    </motion.div>
  );
};

// ========================================================
// 2. WORKSPACE HERO / PAGE HEADER
// ========================================================
export interface WorkspaceHeroProps {
  badge?: React.ReactNode;
  title: string;
  subtitle?: string;
  rightActions?: React.ReactNode;
  accent?: 'coral' | 'violet' | 'amber' | 'rose' | 'teal' | 'charcoal';
}

export const WorkspaceHero: React.FC<WorkspaceHeroProps> = ({
  badge,
  title,
  subtitle,
  rightActions,
  accent = 'coral'
}) => {
  const accentGradients = {
    coral: 'from-[#FFFBF8] via-[#FFFFFF] to-[#FFF0EB] border-[#E8795B]/30 shadow-[0_2px_14px_-2px_rgba(232,121,91,0.08)]',
    violet: 'from-[#FAF8FD] via-[#FFFFFF] to-[#EAE3F4] border-[#8064B1]/30 shadow-[0_2px_14px_-2px_rgba(128,100,177,0.08)]',
    amber: 'from-[#FCFAF6] via-[#FFFFFF] to-[#F8EBD0] border-[#E5A23B]/30 shadow-[0_2px_14px_-2px_rgba(229,162,59,0.08)]',
    rose: 'from-[#FCF8F9] via-[#FFFFFF] to-[#F4D8D0] border-[#E8795B]/30 shadow-[0_2px_14px_-2px_rgba(232,121,91,0.08)]',
    teal: 'from-[#F5FBFA] via-[#FFFFFF] to-[#E3F5F2] border-[#3B9C91]/30 shadow-[0_2px_14px_-2px_rgba(59,156,145,0.08)]',
    charcoal: 'from-[#FFFBF8] via-[#FFFFFF] to-[#FFF0EB] border-[#E8795B]/30 shadow-[0_2px_14px_-2px_rgba(232,121,91,0.08)]'
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${accentGradients} p-4 sm:p-5 lg:p-6 backdrop-blur-sm transition-all`}
    >
      {/* Subtle floating mesh decorative element */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.25, 0.4, 0.25]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-2xl pointer-events-none"
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className={`space-y-1.5 sm:space-y-2 ${rightActions ? 'max-w-4xl lg:max-w-5xl' : 'w-full'}`}>
          {badge && <div className="flex flex-wrap items-center gap-2">{badge}</div>}
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight text-[#51463F] leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-[13px] leading-relaxed text-[#5A4F47] font-medium max-w-5xl">
              {subtitle}
            </p>
          )}
        </div>

        {rightActions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {rightActions}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ========================================================
// 3. WORKSPACE CARD
// ========================================================
export interface WorkspaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'coral' | 'violet' | 'amber' | 'rose' | 'teal' | 'charcoal' | 'glass';
  hoverable?: boolean;
  padded?: boolean;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverable = false,
  padded = true,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white/95 border-[#EDE2D7] shadow-[0_2px_12px_-2px_rgba(81,70,63,0.04)] text-[#51463F]',
    glass: 'bg-white/85 backdrop-blur-md border-[#EDE2D7]/90 shadow-[0_2px_12px_-2px_rgba(81,70,63,0.04)] text-[#51463F]',
    coral: 'bg-gradient-to-br from-white via-[#FFFBF9] to-[#FFF0EB] border-[#E8795B]/30 shadow-[0_2px_12px_-2px_rgba(232,121,91,0.08)] text-[#51463F]',
    violet: 'bg-gradient-to-br from-white via-[#FAF8FD] to-[#EAE3F4] border-[#8064B1]/30 shadow-[0_2px_12px_-2px_rgba(128,100,177,0.08)] text-[#51463F]',
    amber: 'bg-gradient-to-br from-white via-[#FCFAF6] to-[#F8EBD0] border-[#E5A23B]/30 shadow-[0_2px_12px_-2px_rgba(229,162,59,0.08)] text-[#51463F]',
    teal: 'bg-gradient-to-br from-white via-[#F5FBFA] to-[#E3F5F2] border-[#3B9C91]/30 shadow-[0_2px_12px_-2px_rgba(59,156,145,0.08)] text-[#51463F]',
    rose: 'bg-gradient-to-br from-white via-[#FCF8F9] to-[#F4D8D0] border-[#E8795B]/30 shadow-[0_2px_12px_-2px_rgba(232,121,91,0.08)] text-[#51463F]',
    charcoal: 'bg-gradient-to-br from-white via-[#F5FBFA] to-[#E3F5F2] border-[#3B9C91]/30 shadow-[0_2px_12px_-2px_rgba(59,156,145,0.08)] text-[#51463F]'
  }[variant];

  const hoverClass = hoverable
    ? 'hover:-translate-y-0.5 hover:shadow-md transition-all duration-200'
    : '';

  const paddingClass = padded ? 'p-4 sm:p-5' : '';

  return (
    <div
      className={`rounded-2xl border ${variantStyles} ${hoverClass} ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ========================================================
// 4. WORKSPACE KPI STAT CARD
// ========================================================
export interface WorkspaceKpiProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: 'coral' | 'violet' | 'amber' | 'rose' | 'teal' | 'emerald';
  trend?: string;
  onClick?: () => void;
}

export const WorkspaceKpi: React.FC<WorkspaceKpiProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent = 'coral',
  trend,
  onClick
}) => {
  const iconGradients = {
    coral: 'from-[#E8795B] to-[#D96B4E] text-white shadow-[#E8795B]/20',
    violet: 'from-[#8064B1] to-[#6E529F] text-white shadow-[#8064B1]/20',
    amber: 'from-[#E5A23B] to-[#D08E27] text-white shadow-[#E5A23B]/20',
    rose: 'from-[#D77B8B] to-[#C66879] text-white shadow-[#D77B8B]/20',
    teal: 'from-[#3B9C91] to-[#2E847A] text-white shadow-[#3B9C91]/20',
    emerald: 'from-[#2E7D32] to-[#4CAF50] text-white shadow-[#2E7D32]/20'
  }[accent];

  const borderAccents = {
    coral: 'hover:border-[#E8795B]/50',
    violet: 'hover:border-[#8064B1]/50',
    amber: 'hover:border-[#E5A23B]/50',
    rose: 'hover:border-[#D77B8B]/50',
    teal: 'hover:border-[#3B9C91]/50',
    emerald: 'hover:border-[#4CAF50]/50'
  }[accent];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={onClick}
      className={`bg-white/95 rounded-xl sm:rounded-2xl border border-[#EDE2D7] p-3.5 sm:p-4 shadow-[0_2px_10px_-2px_rgba(81,70,63,0.03)] ${borderAccents} transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#5A4F47] truncate">
          {title}
        </span>
        {icon && (
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${iconGradients} flex items-center justify-center shadow-xs shrink-0`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xl sm:text-2xl font-black text-[#51463F] tracking-tight">
          {value}
        </div>
        {trend && (
          <span className="text-[10px] font-black text-[#B34327] bg-[#FDECE7] border border-[#E8795B]/30 px-1.5 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="text-[11px] text-[#5A4F47] mt-1 font-semibold truncate">
          {subtitle}
        </div>
      )}
    </motion.div>
  );
};

// ========================================================
// 5. WORKSPACE BUTTON
// ========================================================
export interface WorkspaceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'violet' | 'amber' | 'teal' | 'charcoal' | 'outline' | 'ghost' | 'rose';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const WorkspaceButton: React.FC<WorkspaceButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs rounded-lg gap-1.5 font-bold',
    md: 'px-3.5 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-xl gap-2 font-bold',
    lg: 'px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl gap-2 font-bold'
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-[#E8795B] via-[#E27052] to-[#D96B4E] text-white shadow-[0_2px_10px_rgba(232,121,91,0.22)] hover:shadow-md hover:from-[#D96B4E] hover:to-[#C85C3F] border border-transparent',
    violet:
      'bg-gradient-to-r from-[#8064B1] via-[#7559A6] to-[#6E529F] text-white shadow-[0_2px_10px_rgba(128,100,177,0.22)] hover:shadow-md hover:from-[#6E529F] hover:to-[#5D428E] border border-transparent',
    amber:
      'bg-gradient-to-r from-[#E5A23B] via-[#DB9831] to-[#D08E27] text-white shadow-[0_2px_10px_rgba(229,162,59,0.22)] hover:shadow-md hover:from-[#D08E27] hover:to-[#BD7D18] border border-transparent',
    teal:
      'bg-gradient-to-r from-[#3B9C91] via-[#348E84] to-[#2E847A] text-white shadow-[0_2px_10px_rgba(59,156,145,0.22)] hover:shadow-md hover:from-[#2E847A] hover:to-[#227269] border border-transparent',
    rose:
      'bg-gradient-to-r from-[#D77B8B] via-[#CE7282] to-[#C66879] text-white shadow-[0_2px_10px_rgba(215,123,139,0.22)] hover:shadow-md hover:from-[#C66879] hover:to-[#B55A6B] border border-transparent',
    charcoal:
      'bg-gradient-to-r from-[#8064B1] to-[#6E529F] text-white shadow-[0_2px_10px_rgba(128,100,177,0.22)] hover:from-[#6E529F] hover:to-[#5D428E] border border-transparent',
    outline:
      'bg-white/90 hover:bg-[#FFF0EB] text-[#51463F] hover:text-[#E8795B] border border-[#EDE2D7] hover:border-[#E8795B] shadow-2xs',
    ghost:
      'bg-transparent hover:bg-[#FFF0EB] text-[#51463F] hover:text-[#E8795B] border border-transparent'
  }[variant];

  return (
    <motion.button
      whileHover={{ y: -0.5 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeStyles} ${variantStyles} ${className}`}
      {...(props as any)}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
};

// ========================================================
// 6. WORKSPACE STATUS BADGE
// ========================================================
export interface WorkspaceBadgeProps {
  variant?: 'active' | 'pending' | 'proposal' | 'urgent' | 'neutral' | 'luxury';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const WorkspaceBadge: React.FC<WorkspaceBadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  size = 'md'
}) => {
  const sizeStyles = {
    sm: 'text-[9.5px] px-1.5 py-0.5 rounded-md font-bold',
    md: 'text-[10.5px] px-2 py-0.5 rounded-lg font-bold'
  }[size];

  const variantStyles = {
    active: 'bg-[#E0F4F0] text-[#1C6960] border border-[#2C857B]/45 font-bold',
    pending: 'bg-[#FEF3DC] text-[#8F550A] border border-[#D99B43]/50 font-bold',
    proposal: 'bg-[#EAE1F5] text-[#5B3F8C] border border-[#8064B1]/45 font-bold',
    urgent: 'bg-[#FDECE7] text-[#B34327] border border-[#E8795B]/45 font-bold',
    luxury: 'bg-gradient-to-r from-[#F8EBD0] to-[#FFF0EB] text-[#3D332D] border border-[#D99B43]/50 font-black',
    neutral: 'bg-[#F3ECE2] text-[#4A3F37] border border-[#D5C7B7] font-bold'
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1 uppercase tracking-wide leading-none ${sizeStyles} ${variantStyles} ${className}`}>
      {children}
    </span>
  );
};

// ========================================================
// 7. WORKSPACE EMPTY STATE
// ========================================================
export interface WorkspaceEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  accent?: 'coral' | 'violet' | 'amber' | 'teal' | 'charcoal' | 'rose';
}

export const WorkspaceEmptyState: React.FC<WorkspaceEmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  accent = 'coral'
}) => {
  const iconColors = {
    coral: 'bg-[#FFF0EB] text-[#E8795B] border-[#E8795B]/30',
    violet: 'bg-[#EAE3F4] text-[#8064B1] border-[#8064B1]/30',
    amber: 'bg-[#F8EBD0] text-[#E5A23B] border-[#E5A23B]/30',
    teal: 'bg-[#E3F5F2] text-[#3B9C91] border-[#3B9C91]/30',
    charcoal: 'bg-[#FAF7F2] text-[#51463F] border-[#EDE2D7]',
    rose: 'bg-[#F4D8D0] text-[#E8795B] border-[#E8795B]/30'
  }[accent];

  return (
    <div className="py-8 sm:py-10 px-4 text-center space-y-3">
      {icon && (
        <div
          className={`w-11 h-11 rounded-xl border ${iconColors} flex items-center justify-center mx-auto shadow-2xs`}
        >
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-sm mx-auto">
        <h4 className="text-sm sm:text-base font-black text-[#51463F]">{title}</h4>
        <p className="text-xs text-[#5A4F47] leading-relaxed font-medium">{description}</p>
      </div>
      {actionText && onAction && (
        <div className="pt-2">
          <WorkspaceButton
            variant={accent === 'violet' ? 'violet' : accent === 'amber' ? 'amber' : accent === 'teal' ? 'teal' : 'primary'}
            size="sm"
            onClick={onAction}
          >
            {actionText}
          </WorkspaceButton>
        </div>
      )}
    </div>
  );
};

