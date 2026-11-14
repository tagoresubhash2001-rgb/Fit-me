import React from 'react';
import { cn } from './cn';

export interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  /** Tailwind stroke colour class, defaults to the primary green. */
  colorClass?: string;
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  max,
  size = 120,
  stroke = 10,
  colorClass = 'stroke-primary',
  label,
  children,
  className,
}: ProgressRingProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className={cn(colorClass, 'transition-[stroke-dashoffset] duration-250 ease-out')}
        />
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  colorClass = 'bg-primary',
  label,
  className,
}: {
  value: number;
  max: number;
  colorClass?: string;
  label?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-track', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-250 ease-out', colorClass)} style={{ width: `${pct}%` }} />
    </div>
  );
}
