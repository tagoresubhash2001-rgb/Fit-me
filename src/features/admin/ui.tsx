import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Sheet } from '../../components/ui';
import { cn } from '../../components/ui/cn';

/** Data table: scrolls sideways inside its card on small screens (the page itself never scrolls sideways). */
export function Table({ head, children, label }: { head: React.ReactNode[]; children: React.ReactNode; label: string }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[640px] border-collapse text-start text-small" aria-label={label}>
        <thead>
          <tr className="border-b border-line text-caption text-muted">
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-2 py-2 text-start font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => <td className={cn('px-2 py-2.5 align-middle text-ink', className)}>{children}</td>;

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
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
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

export const inputCls = 'h-11 w-full rounded-input border border-line bg-surface px-3 text-body text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
