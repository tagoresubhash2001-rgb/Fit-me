import React from 'react';
import { cn } from './cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'sage' | 'subtle';
  padding?: 'none' | 'sm' | 'md';
  /** Renders the card as a button with pressed and focus states. */
  onPress?: () => void;
  /** Skip the enter animation (for cards inside sheets or lists that re-render often). */
  static?: boolean;
}

// Owner correction 7 (PRD section 12): 1 px brand-dark border, 20 px radius, layered raised shadow,
// hover lift on pointer devices, press scale, and a short enter animation.
const base = 'rounded-card border border-card-border transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none';
const tones = {
  default: 'bg-surface shadow-card [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-card-hover',
  sage: 'bg-sage shadow-card',
  subtle: 'bg-raised',
};
const paddings = { none: '', sm: 'p-3', md: 'p-4' };

export function Card({ tone = 'default', padding = 'md', onPress, static: isStatic, className, children, ...rest }: CardProps) {
  const classes = cn(base, tones[tone], paddings[padding], !isStatic && 'card-enter', className);
  if (onPress) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onPress}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPress();
          }
        }}
        className={cn(classes, 'cursor-pointer text-start active:scale-[0.98]')}
        {...rest}
      >
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

export function CardHeader({ title, subtitle, action, icon }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <span className="mt-0.5 shrink-0 text-primary">{icon}</span>}
        <div className="min-w-0">
          <h3 className="text-title text-ink">{title}</h3>
          {subtitle && <p className="text-small text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
