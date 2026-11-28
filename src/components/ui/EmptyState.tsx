import React from 'react';
import { cn } from './cn';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-4 py-8 text-center', className)}>
      {icon && (
        // Small illustration: a soft brand blob with two orbit rings and dots around the icon.
        <div className="relative mb-2 flex h-24 w-24 items-center justify-center" aria-hidden>
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--mesh-2),var(--mesh-1)_60%,transparent_72%)]" />
          <span className="absolute inset-2 rounded-full border border-dashed border-primary-text/25" />
          <span className="absolute top-2 right-3 h-2 w-2 rounded-full bg-water/60" />
          <span className="absolute bottom-3 left-2 h-1.5 w-1.5 rounded-full bg-accent-fill/70" />
          <span className="absolute top-5 left-1 h-1 w-1 rounded-full bg-sleep/70" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-primary-text shadow-card">{icon}</div>
        </div>
      )}
      <p className="text-body font-semibold text-ink">{title}</p>
      {description && <p className="max-w-xs text-small text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
