import React, { useState } from 'react';
import { cn } from './cn';

/** The one avatar used everywhere a person appears: their photo, or their initial when there is none. */
export function Avatar({ name, photoURL, size = 40, className }: { name?: string | null; photoURL?: string | null; size?: number; className?: string }) {
  const [broken, setBroken] = useState(false);
  const initial = (name ?? '').trim()[0]?.toUpperCase() ?? '?';
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-on-primary', className)}
      style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.4)) }}
      aria-hidden
    >
      {photoURL && !broken ? <img src={photoURL} alt="" width={size} height={size} className="h-full w-full object-cover" onError={() => setBroken(true)} /> : initial}
    </span>
  );
}
