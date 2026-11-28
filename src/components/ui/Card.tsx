import React from 'react';
import { cn } from './cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'sage' | 'subtle' | 'glass';
  padding?: 'none' | 'sm' | 'md';
  /** Makes the whole card pressable (a full-size button behind the content). */
  onPress?: () => void;
  /** Accessible name of the card's press action (required with onPress). */
  pressLabel?: string;
  /** Skip the enter animation (for cards inside sheets or lists that re-render often). */
  static?: boolean;
}

// Premium card (owner brief B1, replaces the earlier dark-border style): hairline border, 24 px radius, soft layered
// shadow, hover lift on pointer devices, press scale and a short enter animation. `glass` = frosted hero/summary card.
const base = 'rounded-card border border-card-border transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none';
const tones = {
  default: 'bg-surface shadow-card [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-card-hover',
  sage: 'bg-sage shadow-card',
  subtle: 'bg-raised',
  glass: 'glass-card shadow-card',
};
const paddings = { none: '', sm: 'p-3', md: 'p-4' };

export function Card({ tone = 'default', padding = 'md', onPress, pressLabel, static: isStatic, className, children, ...rest }: CardProps) {
  const classes = cn(base, tones[tone], paddings[padding], !isStatic && 'card-enter', className);
  if (onPress) {
    // Stretched button: one real <button> covers the card (keyboard, screen readers, focus ring), the
    // content sits above it without catching clicks, and inner controls stay separately clickable and
    // focusable (no interactive element nested inside another).
    return (
      <div
        className={cn(
          classes,
          'relative cursor-pointer text-start has-[.card-press:active]:scale-[0.98]',
          '[&>*:not(.card-press)]:pointer-events-none [&>*:not(.card-press)]:relative',
          '[&_a]:pointer-events-auto [&_button:not(.card-press)]:pointer-events-auto [&_input]:pointer-events-auto [&_select]:pointer-events-auto',
        )}
        {...rest}
      >
        <button
          type="button"
          aria-label={pressLabel}
          onClick={onPress}
          className="card-press absolute inset-0 rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        {children}
      </div>
    );
  }
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <span className="mt-0.5 shrink-0 text-primary-text">{icon}</span>}
        <div className="min-w-0">
          <h3 className="text-title text-ink">{title}</h3>
          {subtitle && <p className="text-small text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
