import React from 'react';
import { cn } from '../../components/ui/cn';

export const fieldCls =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-body text-ink placeholder:text-muted transition-[border-color,box-shadow] focus:border-brand focus:shadow-[0_0_0_4px_var(--mesh-1)] focus:outline-none disabled:opacity-60';

export function Field({ id, label, hint, children, className }: { id: string; label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-small font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-caption text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export const emailValid = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim()) && e.trim().length < 254;
