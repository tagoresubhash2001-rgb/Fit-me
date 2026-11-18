import React from 'react';
import { cn } from './cn';

/** Loading placeholder with a soft shimmer sweep (transform only; still under reduced motion). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('relative overflow-hidden rounded-[10px] bg-raised', className)}>
      <div className="absolute inset-0 animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-surface/70 to-transparent motion-reduce:hidden" />
    </div>
  );
}
