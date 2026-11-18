import React, { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from './cn';
import { haptic } from './haptics';

export interface StepperProps {
  value: number | '';
  onChange: (v: number | '') => void;
  step?: number;
  min?: number;
  max?: number;
  label?: string;
  decreaseLabel: string;
  increaseLabel: string;
  size?: 'md' | 'lg';
  className?: string;
  inputClassName?: string;
  error?: string;
  id?: string;
}

const round = (n: number, step: number) => {
  const decimals = (String(step).split('.')[1] ?? '').length;
  return Number(n.toFixed(decimals));
};

/** Number input with − / + buttons (owner corrections 8, 9; sweep: every numeric input has a stepper). */
export function Stepper({ value, onChange, step = 1, min = 0, max = 100000, label, decreaseLabel, increaseLabel, size = 'md', className, inputClassName, error, id }: StepperProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const num = typeof value === 'number' ? value : 0;
  const set = (n: number) => {
    haptic();
    onChange(round(Math.min(max, Math.max(min, n)), step));
  };
  const btn = cn(
    'flex shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink transition-[background-color,transform] duration-150 hover:bg-raised active:scale-90 disabled:opacity-40',
    size === 'lg' ? 'h-14 w-14' : 'h-11 w-11',
  );
  const icon = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-small font-medium text-ink">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <button type="button" className={btn} aria-label={decreaseLabel} disabled={num <= min} onClick={() => set(num - step)}>
          <Minus className={icon} strokeWidth={1.75} />
        </button>
        <input
          id={inputId}
          inputMode="decimal"
          value={value}
          aria-invalid={!!error || undefined}
          onChange={(e) => {
            const v = e.target.value.replace(',', '.');
            if (v === '') return onChange('');
            const n = Number(v);
            if (Number.isFinite(n)) onChange(n);
          }}
          onBlur={() => typeof value === 'number' && onChange(round(Math.min(max, Math.max(min, value)), step))}
          className={cn(
            'h-12 w-full min-w-0 rounded-input border bg-surface px-2 text-center text-body font-semibold tabular-nums text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            error ? 'border-danger' : 'border-line',
            size === 'lg' && 'h-14 text-title',
            inputClassName,
          )}
        />
        <button type="button" className={btn} aria-label={increaseLabel} disabled={num >= max} onClick={() => set(num + step)}>
          <Plus className={icon} strokeWidth={1.75} />
        </button>
      </div>
      {error && (
        <p role="alert" className="text-caption text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
