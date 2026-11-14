import React from 'react';
import { cn } from './cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'sage' | 'subtle';
  padding?: 'none' | 'sm' | 'md';
  /** Renders the card as a button with pressed and focus states. */
  onPress?: () => void;
}

const tones = {
  default: 'bg-surface border border-line shadow-card',
  sage: 'bg-sage border border-line',
  subtle: 'bg-raised border border-line',
};
const paddings = { none: '', sm: 'p-3', md: 'p-4' };

export function Card({ tone = 'default', padding = 'md', onPress, className, children, ...rest }: CardProps) {
  const classes = cn('rounded-card', tones[tone], paddings[padding], className);
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
        className={cn(classes, 'text-start transition-transform duration-150 ease-out active:scale-[0.99]')}
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
