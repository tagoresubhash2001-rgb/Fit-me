import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Sheet } from '../../components/ui';
import { cn } from '../../components/ui/cn';

const text = (n: React.ReactNode): string => (typeof n === 'string' || typeof n === 'number' ? String(n) : '');

/** Gives each cell its column name, so phones can show every row as a labelled card. */
function labelRows(children: React.ReactNode, labels: string[]): React.ReactNode {
  return React.Children.map(children, (row) => {
    if (!React.isValidElement(row)) return row;
    if (row.type === React.Fragment)
      return <React.Fragment key={row.key}>{labelRows((row.props as { children?: React.ReactNode }).children, labels)}</React.Fragment>;
    if (row.type !== 'tr') return row;
    let i = 0;
    const cells = React.Children.map((row.props as { children?: React.ReactNode }).children, (cell) => {
      if (!React.isValidElement(cell)) return cell;
      const label = labels[i++] ?? '';
      return cell.type === Td ? React.cloneElement(cell as React.ReactElement<{ label?: string }>, { label }) : cell;
    });
    return React.cloneElement(row as React.ReactElement<{ children?: React.ReactNode }>, {}, cells);
  });
}

/**
 * Data table. Phones (under 768 px): each row becomes a stacked card with labelled fields. Tablet and desktop: a
 * table that scrolls sideways only inside its own container (the page itself never scrolls sideways).
 */
export function Table({ head, children, label }: { head: React.ReactNode[]; children: React.ReactNode; label: string }) {
  const labels = head.map(text);
  return (
    <div className="admin-table -mx-4 overflow-x-auto overscroll-x-contain px-4">
      <table className="w-max min-w-full border-collapse text-start text-small" aria-label={label}>
        <thead>
          <tr className="border-b border-line text-caption text-muted">
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-2 py-2 text-start font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{labelRows(children, labels)}</tbody>
      </table>
    </div>
  );
}

export const Td = ({ children, className, label }: { children: React.ReactNode; className?: string; label?: string }) => (
  <td data-label={label ?? ''} className={cn('px-2 py-2.5 align-middle text-ink', className)}>
    {children}
  </td>
);

/** Filters: inline from 768 px; on phones a "Filters" button opens them in a bottom sheet. */
export function FilterBar({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="hidden flex-wrap items-end gap-2 md:flex">
        {children}
        {actions}
      </div>
      <div className="flex flex-wrap gap-2 md:hidden">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)} id="filters-open">
          {t('admin.filters')}
        </Button>
        {actions}
      </div>
      <Sheet
        className="admin-touch"
        open={open}
        onClose={() => setOpen(false)}
        closeLabel={t('common.close')}
        title={t('admin.filters')}
        footer={
          <Button fullWidth onClick={() => setOpen(false)}>
            {t('admin.applyFilters')}
          </Button>
        }
      >
        <div className="flex flex-col gap-3 md:hidden">{children}</div>
      </Sheet>
    </>
  );
}

/** Confirmation for sensitive actions; the reason, when asked for, is stored in the activity log. */
export function Confirm({
  open,
  title,
  body,
  confirmLabel,
  destructive,
  askReason,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  askReason?: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  return (
    <Sheet
      className="admin-touch"
      open={open}
      onClose={() => !busy && onClose()}
      closeLabel={t('common.close')}
      title={title}
      footer={
        <div className="flex gap-2">
          <Button
            id="admin-confirm"
            fullWidth
            variant={destructive ? 'destructive' : 'primary'}
            loading={busy}
            disabled={askReason && !reason.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm(reason.trim());
                setReason('');
                onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      }
    >
      <p className="text-body text-ink">{body}</p>
      {askReason && (
        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-small font-medium text-ink">{t('admin.reason')}</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
      )}
    </Sheet>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-small font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="text-caption text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'h-11 w-full rounded-input border border-line bg-surface px-3 text-body text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
