import React, { useEffect, useId, useState } from 'react';

/** Starts at 0 and moves to the real value on the next frame, so rings and bars fill in when they appear. */
function useFillIn(target: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setV(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  return v;
}
import { cn } from './cn';

/** Gradient for a ring from its colour class (stroke-water -> water, stroke-sleep -> sleep, ...). */
export function ringTone(colorClass: string): 'steps' | 'water' | 'sleep' | 'calories' | 'heart' {
  if (/water/.test(colorClass)) return 'water';
  if (/sleep/.test(colorClass)) return 'sleep';
  if (/accent|calor|carbs/.test(colorClass)) return 'calories';
  if (/heart|danger/.test(colorClass)) return 'heart';
  return 'steps';
}

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
  const ratio = useFillIn(max > 0 ? Math.min(1, Math.max(0, value / max)) : 0);
  // Thick rounded strokes with a metric-colour gradient (tokens --grad-<metric>-from/to).
  const id = useId().replace(/:/g, '');
  const tone = ringTone(colorClass);
  stroke = Math.round(stroke * 1.25);
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
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: `var(--grad-${tone}-from)` }} />
            <stop offset="100%" style={{ stopColor: `var(--grad-${tone}-to)` }} />
          </linearGradient>
        </defs>
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
          stroke={`url(#ring-${id})`}
          className="transition-[stroke-dashoffset] duration-1000 ease-[var(--ease-emphasized)] motion-reduce:transition-none"
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
  const pct = useFillIn(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-track', className)}
    >
      <div
        className={cn(
          'h-full w-full rounded-full transition-transform duration-500 ease-[var(--ease-emphasized)] rtl:[transform:translateX(var(--fill-rtl))]',
          colorClass,
        )}
        style={{ transform: `translateX(${pct - 100}%)`, ['--fill-rtl' as string]: `${100 - pct}%` }}
      />
    </div>
  );
}
