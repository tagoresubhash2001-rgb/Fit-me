import React from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from './cn';

/** Small lock + plan badge on Premium / Pro features; tapping it opens the Plans screen (owner correction 6). */
export function PlanBadge({
  plan,
  label,
  ariaLabel,
  className,
}: {
  plan: 'premium' | 'pro';
  label: string;
  ariaLabel: string;
  className?: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/plans?highlight=${plan}`);
      }}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-accent-subtle px-2.5 text-caption font-semibold text-accent transition-transform duration-150 active:scale-95',
        className,
      )}
    >
      <Lock className="h-3 w-3" strokeWidth={2.25} />
      {label}
    </button>
  );
}
