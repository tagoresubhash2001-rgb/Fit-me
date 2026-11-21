import React from 'react';
import { cn } from './cn';

/**
 * The approved FitMe logo (public/favicon.svg, the green "F with a dot"), used as-is everywhere: never redrawn,
 * recoloured or cropped. `wordmark` adds the product name beside it.
 */
export function BrandLogo({ size = 32, wordmark = true, className, textClassName }: { size?: number; wordmark?: boolean; className?: string; textClassName?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 whitespace-nowrap', className)}>
      <img src="/favicon.svg" alt={wordmark ? '' : 'FitMe'} width={size} height={size} style={{ width: size, height: size }} className="shrink-0" />
      {wordmark && <span className={cn('font-semibold tracking-tight text-ink', textClassName)}>FitMe</span>}
    </span>
  );
}
