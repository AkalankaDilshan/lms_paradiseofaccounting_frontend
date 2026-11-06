import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '../lib/utils';
import { Card, CardContent } from './ui/card';

/** Title block at the top of every page: optional eyebrow, title, description, actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

/** Counts up to `value` the first time it scrolls into view. */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

const toneClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
  accent: 'bg-accent/10 text-accent',
} as const;

const barClasses = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  accent: 'bg-accent',
} as const;

export type Tone = keyof typeof toneClasses;

/** KPI tile: label + icon chip, a big (animated) number, a hint line and optional progress bar. */
export function StatCard({
  label,
  icon: Icon,
  value,
  decimals,
  suffix,
  hint,
  tone = 'primary',
  progress,
  onClick,
  className,
}: {
  label: string;
  icon: LucideIcon;
  value: number | null | undefined;
  decimals?: number;
  suffix?: string;
  hint?: ReactNode;
  tone?: Tone;
  /** 0–100; renders a thin animated bar under the number */
  progress?: number | null;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Card
      className={cn('py-4', onClick && 'interactive cursor-pointer', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
    >
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
          <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8', toneClasses[tone])}>
            <Icon className="size-4" />
          </span>
        </div>
        <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {value === null || value === undefined ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
          )}
        </p>
        {progress !== undefined && progress !== null && (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn('h-full rounded-full', barClasses[tone])}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        )}
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

/** Friendly placeholder for an empty list or section. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
        className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
      >
        <Icon className="size-5" />
      </motion.div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Shimmering placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

/** A page-shaped loading state: header + a few blocks. */
export function PageSkeleton({ blocks = 3 }: { blocks?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      {Array.from({ length: blocks }, (_, i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  );
}

/** Small pill showing a live/open state with a pulsing dot. */
export function LiveDot({ className }: { className?: string }) {
  return <span className={cn('live-dot inline-block size-2 rounded-full bg-success', className)} />;
}
