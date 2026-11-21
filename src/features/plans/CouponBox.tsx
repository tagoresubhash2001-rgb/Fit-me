import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { Button, Card } from '../../components/ui';
import { functions } from '../../lib/firebase';
import type { Period } from '../../domain/billing';

type Result = { ok: true; total: number; discount: number; currency: string; before: number } | { ok: false; reason: string };

/** Discount code from the admin's Coupons page, checked on the server against plan, period, country and limits. */
export function CouponBox({ period, country, format }: { period: Period; country: string; format: (amount: number, currency: string) => string }) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Record<string, Result> | null>(null);
  return (
    <Card padding="sm" className="flex flex-col gap-2" id="coupon-box">
      <label className="flex flex-col gap-1.5">
        <span className="text-small font-medium text-ink">{t('coupon.label')}</span>
        <div className="flex gap-2">
          <input id="coupon-input" className="h-11 min-w-0 flex-1 rounded-input border border-line bg-surface px-3 text-body uppercase text-ink" value={code} maxLength={24} onChange={(e) => setCode(e.target.value.toUpperCase())} autoCapitalize="characters" />
          <Button
            variant="secondary"
            loading={busy}
            disabled={code.trim().length < 3}
            onClick={async () => {
              setBusy(true);
              try {
                const call = httpsCallable<unknown, Result>(functions(), 'memberAction', { timeout: 20000 });
                const [premium, pro] = await Promise.all(['premium', 'pro'].map((plan) => call({ action: 'coupon.check', data: { code: code.trim(), plan, period, country } }).then((r) => r.data)));
                setRes({ premium, pro });
              } catch {
                setRes({ premium: { ok: false, reason: 'failed' }, pro: { ok: false, reason: 'failed' } });
              } finally {
                setBusy(false);
              }
            }}
          >
            {t('coupon.apply')}
          </Button>
        </div>
      </label>
      {res && (
        <ul className="flex flex-col gap-1 text-small" role="status">
          {(['premium', 'pro'] as const).map((p) => {
            const r = res[p];
            return (
              <li key={p} className={r.ok ? 'text-primary-text' : 'text-muted'}>
                {t(`plans.${p}`)}: {r.ok ? t('coupon.newPrice', { price: format(r.total, r.currency), before: format(r.before, r.currency) }) : t(`coupon.reasons.${(r as { reason: string }).reason}`, { defaultValue: t('coupon.reasons.not_found') })}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-caption text-muted">{t('coupon.note')}</p>
    </Card>
  );
}
