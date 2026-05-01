import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

export function cn(...inputs: (string | undefined | null | boolean | Record<string, unknown>)[]) {
  return twMerge(clsx(inputs));
}

/* ===== BUTTONS ===== */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'social';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center font-medium
    transition-all duration-150 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2
    disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
  `;

  const variants = {
    primary: `
      bg-[var(--color-accent)] text-white hover:opacity-90
      active:scale-[0.98]
    `,
    secondary: `
      bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)]
      hover:bg-[var(--color-bg-tertiary)]
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent text-[var(--color-text-secondary)]
      hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]
    `,
    social: `
      bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)]
      hover:bg-[var(--color-bg-tertiary)]
    `,
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-[4px] gap-1.5',
    md: 'h-10 px-4 text-sm rounded-[4px] gap-2',
    lg: 'h-12 px-6 text-base rounded-[4px] gap-2.5',
  };

  const textStyles = 'text-sm font-medium uppercase tracking-[0.05em]';

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], textStyles, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? icon : null}
      {children}
    </button>
  );
}

/* ===== INPUT ===== */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ className, label, error, icon, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[0.75rem] font-medium text-[var(--color-text-secondary)] uppercase tracking-[0.05em] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full px-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-[4px]',
            'h-11',
            'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]',
            'focus:outline-none focus:border-[var(--color-border-focus)]',
            'transition-colors duration-150',
            icon ? 'pl-10' : '',
            error ? 'border-[var(--color-accent)]' : '',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-2 text-sm text-[var(--color-accent)]">{error}</p>}
    </div>
  );
}

/* ===== TEXTAREA ===== */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ className, label, error, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-silver mb-2 tracking-wide">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-4 py-3 bg-slate border border-smoke rounded-xl min-h-[120px]',
          'text-chalk placeholder:text-ash',
          'focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-10',
          'transition-all duration-200 resize-y',
          error ? 'border-error focus:border-error focus:ring-error-10' : '',
          className
        )}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}

/* ===== CARD ===== */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  hover?: boolean;
}

export function Card({ className, variant = 'default', hover = false, children, ...props }: CardProps) {
  const variants = {
    default: 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)]',
    elevated: 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
    glass: 'bg-[var(--color-bg-secondary)]/80 border border-[var(--color-border)] backdrop-blur-sm',
  };

  return (
    <div
      className={cn(
        'rounded-lg p-6',
        variants[variant],
        hover && 'hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ===== CARD HEADER ===== */
export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pb-4', className)} {...props}>
      {children}
    </div>
  );
}

/* ===== CARD TITLE ===== */
export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-xl font-semibold text-chalk', className)} {...props}>
      {children}
    </h3>
  );
}

/* ===== CARD CONTENT ===== */
export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

/* ===== BADGE ===== */
export function Badge({
  className,
  variant = 'default',
  children
}: {
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}) {
  const variants: Record<string, string> = {
    default: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20',
    warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20',
    error: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

/* ===== PROGRESS BAR ===== */
export function ProgressBar({ progress, className }: { progress: number; className?: string }) {
  return (
    <div className={cn("w-full h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden", className)}>
      <motion.div
        className={cn('h-full rounded-full bg-[var(--color-accent)]')}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}

/* ===== SPINNER ===== */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  };

  return (
    <svg className={cn('animate-spin', sizes[size])} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ===== AVATAR ===== */
export function Avatar({
  src,
  fallback,
  size = 'md',
  className
}: {
  src?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={fallback}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div className={cn(
      'rounded-full bg-peacock/20 text-peacock flex items-center justify-center font-semibold',
      sizes[size],
      className
    )}>
      {fallback?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

/* ===== DIVIDER ===== */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px bg-[var(--color-border)]', className)} />;
}

/* ===== SKELETON ===== */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'animate-pulse bg-smoke rounded-lg',
      className
    )} />
  );
}

/* ===== TABS ===== */
interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-slate rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'bg-graphite text-chalk shadow-lg'
              : 'text-ash hover:text-silver'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ===== TOGGLE ===== */
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-peacock' : 'bg-smoke'
        )}
      >
        <motion.span
          className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md"
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
      {label && <span className="text-sm text-silver group-hover:text-chalk transition-colors">{label}</span>}
    </label>
  );
}

/* ===== MANDALA DECORATION ===== */
export function Mandala({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className={cn('relative', sizes[size], className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-10">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[var(--color-accent)]" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[var(--color-accent)]" />
        <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[var(--color-accent)]" />
      </svg>
    </div>
  );
}

/* ===== DIVYA SPARKLE ===== */
export function DivyaSparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('w-3 h-3', className)}
      fill="currentColor"
    >
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

/* ===== SANSKRIT BUTTON ===== */
interface SanskritButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export function SanskritButton({
  className,
  variant = 'primary',
  children,
  ...props
}: SanskritButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium h-10 px-4 text-sm rounded-[4px]',
        'transition-all duration-150 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variant === 'primary'
          ? 'bg-[var(--color-accent)] text-white'
          : variant === 'outline'
            ? 'bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
            : variant === 'ghost'
              ? 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ===== HOVER CARD ===== */
interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
}

export function HoverCard({ children, className, gradient = "from-saffron/20 to-peacock/20" }: HoverCardProps) {
  return (
    <motion.div
      className={cn('relative group', className)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className={cn(
        'absolute -inset-px rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm',
        gradient
      )} />
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}

/* ===== SPOTLIGHT ===== */
interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
}

export function Spotlight({ children, className }: SpotlightProps) {
  return (
    <div className={cn('relative group', className)}>
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-saffron/10 via-gold/10 to-peacock/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md" />
      {children}
    </div>
  );
}
