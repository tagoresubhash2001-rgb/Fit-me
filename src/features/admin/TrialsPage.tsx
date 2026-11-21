import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardHeader, PageHeader, Skeleton, toast } from '../../components/ui';
import type { AccessPolicy } from '../../domain/policy';
import { act, errorCode, useAction } from './api';
import { inputCls, Table, Td } from './ui';
import { AccessCard } from './PricingPage';

/** Welcome Unlock and trial length per country (new sign-ups). One user's trial is changed from Users. */
function CountryDaysCard({ policy, onSaved }: { policy: AccessPolicy; onSaved: () => void }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(Object.entries(policy.stageDays).map(([c, d]) => ({ c, ...d })));
  const [busy, setBusy] = useState(false);
  return (
    <Card className="flex flex-col gap-4" id="country-days">
      <CardHeader title={t('admin.trials.countryTitle')} subtitle={t('admin.trials.countryBody')} />
      {rows.length > 0 && (
        <Table head={[t('admin.finance.country'), t('admin.pricing.welcomeDays'), t('admin.pricing.trialDays'), '']} label={t('admin.trials.countryTitle')}>
          {rows.map((r, i) => (
            <tr key={i}>
              <Td>
                <input className={inputCls} maxLength={2} value={r.c} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, c: e.target.value.toUpperCase() } : x)))} aria-label={t('admin.finance.country')} />
              </Td>
              <Td>
                <input type="number" min={0} max={90} className={inputCls} value={r.welcomeDays} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, welcomeDays: Number(e.target.value) } : x)))} aria-label={t('admin.pricing.welcomeDays')} />
              </Td>
              <Td>
                <input type="number" min={0} max={365} className={inputCls} value={r.trialDays} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, trialDays: Number(e.target.value) } : x)))} aria-label={t('admin.pricing.trialDays')} />
              </Td>
              <Td>
                <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                  {t('admin.remove')}
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" id="add-country-days" onClick={() => setRows([...rows, { c: '', welcomeDays: 7, trialDays: 30 }])}>
          {t('admin.finance.addCountry')}
        </Button>
        <Button
          id="save-country-days"
          loading={busy}
          disabled={rows.some((r) => !/^[A-Z]{2}$/.test(r.c))}
          onClick={async () => {
            setBusy(true);
            try {
              const stageDays = Object.fromEntries(rows.map((r) => [r.c, { welcomeDays: r.welcomeDays, trialDays: r.trialDays }]));
              const r = await act<{ version: number }>('policy.stageDays', { stageDays });
              toast(t('admin.savedVersion', { version: r.version }), 'success');
              onSaved();
            } catch (e) {
              toast(errorCode(e), 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          {t('admin.save')}
        </Button>
      </div>
      <p className="text-caption text-muted">{t('admin.trials.oneUserHint')}</p>
    </Card>
  );
}

export default function TrialsPage() {
  const { t } = useTranslation();
  const p = useAction<AccessPolicy>('policy.get', {});
  return (
    <div className="flex flex-col gap-4" id="admin-trials">
      <PageHeader title={t('admin.nav.trials')} />
      <AccessCard />
      {p.data ? <CountryDaysCard policy={p.data} onSaved={p.reload} /> : p.error ? <p className="text-small text-danger-text">{p.error}</p> : <Skeleton className="h-40" />}
    </div>
  );
}
