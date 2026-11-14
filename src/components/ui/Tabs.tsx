import React from 'react';
import { cn } from './cn';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

/** Segmented control. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex w-full gap-1 rounded-button bg-raised p-1', className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 text-small font-medium transition-colors duration-150',
              active ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
            )}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
