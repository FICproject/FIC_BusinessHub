import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  maxWidth = '7xl'
}) => {
  const maxClass = {
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full'
  }[maxWidth];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`min-h-[calc(100vh-72px)] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 relative z-10 ${className}`}
    >
      <div className={`mx-auto ${maxClass} space-y-8`}>
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
  accent?: 'coral' | 'violet' | 'amber' | 'rose' | 'charcoal';
}

export const WorkspaceHero: React.FC<WorkspaceHeroProps> = ({
  badge,
  title,
  subtitle,
  rightActions,
  accent = 'coral'
}) => {
  const accentGradients = {
    coral: 'from-[#FFFBF8] via-[#FCFAF6] to-[#FFF4F0] border-[#E58C72]/30 shadow-[0_4px_24px_-4px_rgba(229,140,114,0.12)]',
    violet: 'from-[#FAF7FD] via-[#FCFAF6] to-[#F3EEFA] border-[#8064A9]/30 shadow-[0_4px_24px_-4px_rgba(128,100,169,0.12)]',
    amber: 'from-[#FCFAF5] via-[#FCFAF6] to-[#FDF5E6] border-[#D99B43]/30 shadow-[0_4px_24px_-4px_rgba(217,155,67,0.12)]',
    rose: 'from-[#FCF7F8] via-[#FCFAF6] to-[#FDEEF1] border-[#D78E9A]/30 shadow-[0_4px_24px_-4px_rgba(215,142,154,0.12)]',
    charcoal: 'from-[#29302D] via-[#222725] to-[#1A1E1C] border-[#D99B43]/30 text-white shadow-[0_10px_30px_-6px_rgba(41,48,45,0.25)]'
  }[accent];

  const isDark = accent === 'charcoal';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${accentGradients} p-6 sm:p-8 backdrop-blur-sm transition-all`}
    >
      {/* Subtle decorative mesh blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-3xl">
          {badge && <div className="flex flex-wrap items-center gap-2">{badge}</div>}
          <h1
            className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
              isDark ? 'text-white' : 'text-[#29302D]'
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`text-xs sm:text-sm leading-relaxed ${
                isDark ? 'text-white/80' : 'text-[#77786E]'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        {rightActions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {rightActions}
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================================
// 3. WORKSPACE CARD
// ========================================================
export interface WorkspaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'coral' | 'violet' | 'amber' | 'rose' | 'charcoal' | 'glass';
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
    default: 'bg-white/90 border-[#EADFCF] shadow-[0_4px_20px_-4px_rgba(41,48,45,0.05)] text-[#29302D]',
    glass: 'bg-white/70 backdrop-blur-md border-[#EADFCF]/80 shadow-[0_4px_24px_-4px_rgba(41,48,45,0.04)] text-[#29302D]',
    coral: 'bg-gradient-to-br from-white via-[#FFFBF9] to-[#FFF4F0] border-[#E58C72]/30 shadow-[0_4px_24px_-4px_rgba(229,140,114,0.1)] text-[#29302D]',
    violet: 'bg-gradient-to-br from-white via-[#FAF8FD] to-[#F4EEFB] border-[#8064A9]/30 shadow-[0_4px_24px_-4px_rgba(128,100,169,0.1)] text-[#29302D]',
    amber: 'bg-gradient-to-br from-white via-[#FCFAF6] to-[#FDF6E9] border-[#D99B43]/30 shadow-[0_4px_24px_-4px_rgba(217,155,67,0.1)] text-[#29302D]',
    rose: 'bg-gradient-to-br from-white via-[#FCF8F9] to-[#FDEFF2] border-[#D78E9A]/30 shadow-[0_4px_24px_-4px_rgba(215,142,154,0.1)] text-[#29302D]',
    charcoal: 'bg-gradient-to-br from-[#29302D] to-[#1E2422] border-[#D99B43]/30 shadow-[0_10px_30px_-6px_rgba(41,48,45,0.25)] text-white'
  }[variant];

  const hoverClass = hoverable
    ? 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300'
    : '';

  const paddingClass = padded ? 'p-6 sm:p-7' : '';

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
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: 'coral' | 'violet' | 'amber' | 'rose' | 'emerald';
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
    coral: 'from-[#C66B52] to-[#E58C72] text-white shadow-[#C66B52]/20',
    violet: 'from-[#8064A9] to-[#9B7CC6] text-white shadow-[#8064A9]/20',
    amber: 'from-[#D99B43] to-[#F5B453] text-white shadow-[#D99B43]/20',
    rose: 'from-[#D78E9A] to-[#F0A8B5] text-white shadow-[#D78E9A]/20',
    emerald: 'from-[#2E7D32] to-[#4CAF50] text-white shadow-[#2E7D32]/20'
  }[accent];

  const borderAccents = {
    coral: 'hover:border-[#E58C72]/50',
    violet: 'hover:border-[#8064A9]/50',
    amber: 'hover:border-[#D99B43]/50',
    rose: 'hover:border-[#D78E9A]/50',
    emerald: 'hover:border-[#4CAF50]/50'
  }[accent];

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`bg-white/95 rounded-2xl border border-[#EADFCF] p-5 shadow-[0_4px_20px_-4px_rgba(41,48,45,0.04)] ${borderAccents} transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#77786E]">
          {title}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconGradients} flex items-center justify-center shadow-md`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-black text-[#29302D] tracking-tight">
          {value}
        </div>
        {trend && (
          <span className="text-[11px] font-bold text-[#C66B52] bg-[#C66B52]/10 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="text-xs text-[#77786E] mt-1 font-medium">
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
  variant?: 'primary' | 'violet' | 'amber' | 'charcoal' | 'outline' | 'ghost' | 'rose';
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
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-sm sm:text-base rounded-2xl gap-2.5 font-bold'
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-[#C66B52] via-[#D87D63] to-[#E58C72] text-white font-bold shadow-md hover:shadow-lg hover:from-[#B85C43] hover:to-[#D87D63] border border-transparent',
    violet:
      'bg-gradient-to-r from-[#8064A9] via-[#8E72B7] to-[#9B7CC6] text-white font-bold shadow-md hover:shadow-lg hover:from-[#72549C] hover:to-[#8E72B7] border border-transparent',
    amber:
      'bg-gradient-to-r from-[#D99B43] via-[#E2A64E] to-[#F5B453] text-[#29302D] font-extrabold shadow-md hover:shadow-lg hover:from-[#C88A32] hover:to-[#E2A64E] border border-transparent',
    rose:
      'bg-gradient-to-r from-[#D78E9A] via-[#E298A4] to-[#F0A8B5] text-white font-bold shadow-md hover:shadow-lg hover:from-[#C87F8B] hover:to-[#E298A4] border border-transparent',
    charcoal:
      'bg-[#29302D] text-[#FCFAF6] font-bold shadow-md hover:bg-[#1E2422] border border-[#D99B43]/30',
    outline:
      'bg-white/80 hover:bg-white text-[#29302D] font-bold border border-[#EADFCF] hover:border-[#C66B52] shadow-xs',
    ghost:
      'bg-transparent hover:bg-[#F5EBDD]/60 text-[#29302D] font-bold border border-transparent'
  }[variant];

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none ${sizeStyles} ${variantStyles} ${className}`}
      {...(props as any)}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
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
    sm: 'text-[10px] px-2 py-0.5 rounded-md font-bold',
    md: 'text-xs px-2.5 py-1 rounded-lg font-bold'
  }[size];

  const variantStyles = {
    active: 'bg-[#2E7D32]/12 text-[#1B5E20] border border-[#2E7D32]/30',
    pending: 'bg-[#D99B43]/15 text-[#9C6818] border border-[#D99B43]/40',
    proposal: 'bg-[#8064A9]/15 text-[#5B3E84] border border-[#8064A9]/40',
    urgent: 'bg-[#C66B52]/15 text-[#A34A32] border border-[#C66B52]/40',
    luxury: 'bg-gradient-to-r from-[#D99B43]/20 to-[#E58C72]/20 text-[#29302D] border border-[#D99B43]/50 font-black',
    neutral: 'bg-[#FAF6F0] text-[#77786E] border border-[#EADFCF]'
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 uppercase tracking-wide leading-none ${sizeStyles} ${variantStyles} ${className}`}>
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
  accent?: 'coral' | 'violet' | 'amber' | 'charcoal' | 'rose';
}

export const WorkspaceEmptyState: React.FC<WorkspaceEmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  accent = 'coral'
}) => {
  const iconGradients = {
    coral: 'from-[#FFF4F0] to-[#FFE8E2] text-[#C66B52] border-[#E58C72]/30',
    violet: 'from-[#F3EEFA] to-[#E9DFF5] text-[#8064A9] border-[#8064A9]/30',
    amber: 'from-[#FDF6E9] to-[#FAEDD1] text-[#D99B43] border-[#D99B43]/30',
    charcoal: 'from-[#FAF7F2] to-[#EADFCF] text-[#29302D] border-[#29302D]/30',
    rose: 'from-[#FCF3F5] to-[#FADBE2] text-[#D78E9A] border-[#D78E9A]/30'
  }[accent];

  return (
    <div className="bg-white/80 rounded-2xl border border-dashed border-[#EADFCF] p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
      {icon && (
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconGradients} border flex items-center justify-center mx-auto shadow-sm`}
        >
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-black text-[#29302D]">{title}</h3>
        <p className="text-xs sm:text-sm text-[#77786E] max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <div className="pt-2">
          <WorkspaceButton variant="primary" size="sm" onClick={onAction}>
            {actionText}
          </WorkspaceButton>
        </div>
      )}
    </div>
  );
};

