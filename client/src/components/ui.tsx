import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

export function cn(...inputs: (string | undefined | null | boolean | Record<string, unknown>)[]) {
  return twMerge(clsx(inputs));
}

/* ===== BUTTONS ===== */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'electric' | 'saffron' | 'peacock' | 'gold';
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
    transition-all duration-200 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-peacock focus-visible:ring-offset-2 focus-visible:ring-offset-void
    disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
    cut-card relative overflow-hidden
  `;

  const variants = {
    primary: `
      bg-saffron text-void hover:bg-saffron-light 
      shadow-lg shadow-saffron-20 hover:shadow-saffron-30
      active:scale-[0.98]
    `,
    saffron: `
      bg-gradient-to-r from-saffron to-saffron-light text-void
      hover:shadow-lg hover:shadow-saffron-30 hover:-translate-y-0.5
      active:translate-y-0
    `,
    peacock: `
      bg-peacock text-cream
      hover:bg-peacock-light hover:shadow-lg hover:shadow-peacock-20 hover:-translate-y-0.5
      active:translate-y-0
    `,
    gold: `
      bg-gold text-void font-semibold
      hover:bg-gold-light hover:shadow-lg hover:shadow-gold-20 hover:-translate-y-0.5
      active:translate-y-0
    `,
    secondary: `
      bg-graphite text-chalk border border-smoke
      hover:bg-smoke hover:border-ash
      active:scale-[0.98]
    `,
    ghost: `
      text-silver hover:text-chalk hover:bg-smoke/50
    `,
    danger: `
      bg-error text-white hover:bg-red-600
    `,
    electric: `
      bg-peacock text-void font-semibold
      hover:shadow-lg hover:shadow-peacock-20 hover:-translate-y-0.5
      active:translate-y-0
    `,
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg gap-1.5',
    md: 'px-5 py-3 text-sm rounded-xl gap-2',
    lg: 'px-8 py-4 text-base rounded-xl gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
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

      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.5 }}
      />
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
        <label className="block text-sm font-medium text-silver mb-2 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ash">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full px-4 py-3 bg-slate border border-smoke rounded-xl',
            'text-chalk placeholder:text-ash',
            'focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-10',
            'transition-all duration-200',
            icon ? 'pl-11' : '',
            error ? 'border-error focus:border-error focus:ring-error-10' : '',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
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
    default: 'bg-slate border border-smoke',
    elevated: 'bg-graphite border border-smoke shadow-2xl shadow-black/30',
    glass: 'glass border border-smoke/50',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        variants[variant],
        hover && 'card-hover cursor-pointer',
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
  variant?: 'default' | 'success' | 'warning' | 'error' | 'peacock' | 'saffron' | 'gold' | 'indus' | 'electric' | 'flame' | 'silver';
  children: React.ReactNode;
}) {
  const variants: Record<string, string> = {
    default: 'bg-smoke text-silver border border-smoke',
    success: 'bg-peacock/10 text-peacock border border-peacock/20',
    warning: 'bg-marigold/10 text-marigold border border-marigold/20',
    error: 'bg-saffron/10 text-saffron border border-saffron/20',
    peacock: 'bg-peacock/10 text-peacock border border-peacock/20',
    saffron: 'bg-saffron/10 text-saffron border border-saffron/20',
    gold: 'bg-gold/10 text-gold border border-gold/20',
    indus: 'bg-indus/10 text-indus border border-indus/20',
    electric: 'bg-peacock/10 text-peacock border border-peacock/20',
    flame: 'bg-saffron/10 text-saffron border border-saffron/20',
    silver: 'bg-ash/10 text-ash border border-ash/20',
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
export function ProgressBar({ progress, variant = 'saffron', className }: { progress: number; variant?: 'saffron' | 'peacock' | 'gold', className?: string }) {
  const colors = {
    saffron: 'bg-gradient-to-r from-saffron to-vibrant',
    peacock: 'bg-gradient-to-r from-peacock to-peacock-light',
    gold: 'bg-gradient-to-r from-gold to-saffron',
  };

  return (
    <div className={cn("w-full h-1.5 bg-slate rounded-full overflow-hidden", className)}>
      <motion.div
        className={cn('h-full rounded-full', colors[variant])}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}

/* ===== SPINNER ===== */
export function Spinner({ size = 'md', variant = 'saffron' }: { size?: 'sm' | 'md' | 'lg'; variant?: 'saffron' | 'peacock' | 'chalk' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  };

  const colors = {
    saffron: 'text-saffron',
    peacock: 'text-peacock',
    chalk: 'text-chalk',
  };

  return (
    <svg className={cn('animate-spin', sizes[size], colors[variant])} fill="none" viewBox="0 0 24 24">
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
  return <div className={cn('h-px bg-smoke', className)} />;
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
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  return (
    <div className={cn('relative', sizes[size], className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-saffron" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-peacock" />
        <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gold" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="50"
            y1="50"
            x2={50 + 45 * Math.cos((angle * Math.PI) / 180)}
            y2={50 + 45 * Math.sin((angle * Math.PI) / 180)}
            stroke="currentColor"
            strokeWidth="0.3"
            className="text-saffron"
          />
        ))}
      </svg>
    </div>
  );
}

/* ===== DIVYA SPARKLE ===== */
export function DivyaSparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('w-4 h-4', className)}
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
        'relative px-8 py-4 rounded-xl font-display font-bold transition-all duration-300',
        'hover:-translate-y-1 active:translate-y-0 active:scale-95',
        'cut-card cut-border',
        variant === 'primary'
          ? 'bg-gradient-to-r from-saffron to-gold text-void shadow-xl shadow-saffron/20'
          : variant === 'outline'
            ? 'bg-transparent text-saffron border-saffron/40 hover:border-saffron'
            : variant === 'ghost'
              ? 'bg-transparent text-silver hover:text-chalk hover:bg-smoke/30'
              : 'bg-graphite text-chalk border border-smoke hover:border-ash',
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
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
