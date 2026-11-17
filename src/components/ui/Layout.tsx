import React from 'react';
import { cn } from './cn';

/** Screen title row: title (and optional subtitle) with actions that wrap below on narrow screens. */
export function PageHeader({ title, subtitle, actions, className }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('card-enter flex flex-wrap items-end justify-between gap-x-4 gap-y-2', className)}>
      <div className="min-w-0">
        <h1 className="text-display text-ink">{title}</h1>
        {subtitle && <p className="text-small text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const MD = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' } as const;
const XL = { 1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4' } as const;

/** One column on phones, `md` columns on tablet, `xl` columns on desktop. */
export function ResponsiveGrid({ md = 2, xl = 3, className, children, as: As = 'div' }: { md?: keyof typeof MD; xl?: keyof typeof XL; className?: string; children: React.ReactNode; as?: 'div' | 'ul' }) {
  return <As className={cn('stagger grid grid-cols-1 gap-4 md:gap-5', MD[md], XL[xl], className)}>{children}</As>;
}

/**
 * Master-detail: on phones and tablet portrait only the list shows (details open as sheets / dialogs);
 * from 1024 px (tablet landscape, desktop) the detail panel sits beside the list and stays in view.
 */
export function ListDetail({ list, detail, detailLabel, className }: { list: React.ReactNode; detail?: React.ReactNode; detailLabel: string; className?: string }) {
  return (
    <div className={cn('lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:items-start lg:gap-6', className)}>
      <div className="min-w-0">{list}</div>
      {detail && (
        <aside aria-label={detailLabel} className="sticky top-24 hidden flex-col lg:flex">
          {detail}
        </aside>
      )}
    </div>
  );
}
