import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Button, Card, CardHeader, Skeleton } from '../../components/ui';
import { downloadCsv, useAction } from './api';
import { Field, FilterBar, inputCls } from './ui';

interface Summary {
  series: Array<{ date: string; signups: number; scans: number }>;
  signupsByCountry: Record<string, number>;
  aiUsage: Record<string, number>;
  activity: { stepDays: number; workouts: number; foodLogs: number };
  revenue: Record<string, { amount: number; count: number }>;
  testimonialsPending: number;
}

/** Live analytics with date and country filters, charts and CSV export (real counts from Firestore). */
export function Analytics() {
  const { t, i18n } = useTranslation();
  const [days, setDays] = useState(30);
  const [country, setCountry] = useState('');
  const c = /^[A-Z]{2}$/.test(country) ? country : null;
  const r = useAction<Summary>('analytics.summary', { days, country: c }, [days, c]);
  const d = r.data;
  const short = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(new Date(`${iso}T12:00:00Z`));
  return (
    <Card className="flex flex-col gap-4" id="admin-analytics">
      <CardHeader title={t('admin.analytics.title')} subtitle={t('admin.analytics.body')} />
      <FilterBar
        actions={
          <Button
            variant="secondary"
            disabled={!d}
            onClick={() => d && downloadCsv(`fitme-analytics-${days}d${c ? `-${c}` : ''}`, d.series)}
          >
            {t('admin.exportCsv')}
          </Button>
        }
      >
        <Field label={t('admin.analytics.range')}>
          <select className={inputCls} value={days} onChange={(e) => setDays(Number(e.target.value))} id="analytics-days">
            {[7, 30, 90, 365].map((n) => (
              <option key={n} value={n}>
                {t('admin.analytics.lastDays', { count: n })}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('admin.finance.country')}>
          <input
            className={inputCls}
            maxLength={2}
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder={t('admin.plans.allCountries')}
          />
        </Field>
      </FilterBar>
      {!d ? (
        r.error ? (
          <p className="text-small text-danger-text">{r.error}</p>
        ) : (
          <Skeleton className="h-48" />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-small font-medium text-ink">{t('admin.analytics.signups')}</p>
              <BarChart
                points={d.series.slice(-31).map((p) => ({ label: short(p.date), value: p.signups }))}
                ariaLabel={t('admin.analytics.signups')}
              />
            </div>
            <div>
              <p className="mb-2 text-small font-medium text-ink">{t('admin.analytics.scans')}</p>
              <BarChart
                points={d.series.slice(-31).map((p) => ({ label: short(p.date), value: p.scans }))}
                ariaLabel={t('admin.analytics.scans')}
                colorClass="fill-accent"
              />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              [t('admin.analytics.stepDays'), d.activity.stepDays],
              [t('admin.analytics.workouts'), d.activity.workouts],
              [t('admin.analytics.foodLogs'), d.activity.foodLogs],
              [t('admin.analytics.aiCalls'), Object.values(d.aiUsage).reduce((a, b) => a + b, 0)],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-input border border-line p-3">
                <dt className="text-caption text-muted">{k}</dt>
                <dd className="text-title text-ink tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-small font-medium text-ink">{t('admin.analytics.byCountry')}</p>
              <ul className="flex flex-col divide-y divide-line text-small">
                {Object.entries(d.signupsByCountry)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 12)
                  .map(([k, v]) => (
                    <li key={k} className="flex justify-between py-1.5">
                      <span>{k}</span>
                      <span className="tabular-nums">{v}</span>
                    </li>
                  ))}
                {!Object.keys(d.signupsByCountry).length && <li className="py-1.5 text-muted">{t('admin.empty')}</li>}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-small font-medium text-ink">{t('admin.analytics.revenue')}</p>
              <ul className="flex flex-col divide-y divide-line text-small">
                {Object.entries(d.revenue).map(([k, v]) => {
                  const [cc, cur] = k.split(':');
                  let amount = `${cur} ${v.amount}`;
                  try {
                    amount = new Intl.NumberFormat(i18n.language, { style: 'currency', currency: cur }).format(v.amount);
                  } catch {
                    /* unknown currency code: plain text */
                  }
                  return (
                    <li key={k} className="flex justify-between py-1.5">
                      <span>{cc}</span>
                      <span className="tabular-nums">
                        {amount} · {v.count}
                      </span>
                    </li>
                  );
                })}
                {!Object.keys(d.revenue).length && <li className="py-1.5 text-muted">{t('admin.analytics.noRevenue')}</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
