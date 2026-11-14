import React from 'react';
import { cn } from './cn';

export type BadgeTone = 'neutral' | 'primary' | 'accent' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-raised text-muted',
  primary: 'bg-primary-subtle text-primary',
  accent: 'bg-accent-subtle text-accent',
  danger: 'bg-danger-subtle text-danger',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-0.5 text-caption', tones[tone], className)}>
      <span className="truncate">{children}</span>
    </span>
  );
}
