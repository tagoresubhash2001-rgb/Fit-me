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
      {icon && <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary-subtle text-primary">{icon}</div>}
      <p className="text-body font-semibold text-ink">{title}</p>
      {description && <p className="max-w-xs text-small text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
