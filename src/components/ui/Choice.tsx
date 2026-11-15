import React from 'react';
import { Check } from 'lucide-react';
import { cn } from './cn';

/** A selectable option card (radio or checkbox semantics). */
export function Choice({
  selected,
  onSelect,
  title,
  description,
  icon,
  multi,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  multi?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex min-h-12 w-full items-center gap-3 rounded-input border p-3 text-start transition-colors duration-150',
        selected ? 'border-primary bg-primary-subtle' : 'border-line bg-surface hover:bg-raised',
        className,
      )}
    >
      {icon && <span className={cn('shrink-0', selected ? 'text-primary' : 'text-muted')}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-body font-medium text-ink">{title}</span>
        {description && <span className="block text-small text-muted">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center border',
          multi ? 'rounded-[6px]' : 'rounded-full',
          selected ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface',
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={2.25} />}
      </span>
    </button>
  );
}
