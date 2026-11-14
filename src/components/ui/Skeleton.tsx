import React from 'react';
import { cn } from './cn';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-[10px] bg-raised', className)} />;
}
