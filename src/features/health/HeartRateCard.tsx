import React from 'react';
import { useTranslation } from 'react-i18next';
import { HeartPulse } from 'lucide-react';
import { Card, CardHeader, EmptyState, LineChart } from '../../components/ui';
import { useRecords } from '../../data/useRecords';
import { useFormat, useToday } from '../../lib/hooks';
import { addDays } from '../../domain/dates';

/** Daily heart rate summary written by the health sync (healthDaily, source device). */
interface HealthDaily {
  id: string;
  date: string;
  heartRateAvg?: number;
  heartRateMin?: number;
  heartRateMax?: number;
  restingHr?: number;
}

/** Heart rate from Health Connect / Apple Health: latest day's resting, average and range, and a 7-day trend. */
export function HeartRateCard() {
  const { t } = useTranslation();
  const { n, date } = useFormat();
  const today = useToday();
  const from = addDays(today, -6);
  const days = useRecords<HealthDaily>('healthDaily', from, today);
  const withHr = days.rows.filter((d) => d.heartRateAvg || d.restingHr).sort((a, b) => a.date.localeCompare(b.date));
  const latest = withHr[withHr.length - 1];
  if (days.loading) return null;
  return (
    <Card id="heart-rate-card">
      <CardHeader title={t('heart.title')} />
      {!latest ? (
        <EmptyState icon={<HeartPulse className="h-6 w-6" strokeWidth={1.75} />} title={t('heart.emptyTitle')} description={t('heart.emptyBody')} />
      ) : (
        <>
          <p className="mb-3 text-caption text-muted">{latest.date === today ? t('heart.today') : date(latest.date)}</p>
          <dl className="grid grid-cols-3 gap-2">
            {[
              ['heart.resting', latest.restingHr],
              ['heart.average', latest.heartRateAvg],
              ['heart.range', latest.heartRateMin && latest.heartRateMax ? `${n(latest.heartRateMin)}–${n(latest.heartRateMax)}` : undefined],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-input bg-raised p-3">
                <dt className="text-caption text-muted">{t(k as string)}</dt>
                <dd className="text-body font-bold whitespace-nowrap text-heart-text tabular-nums sm:text-title">
                  {v === undefined || v === null ? '—' : typeof v === 'number' ? n(v) : v}
                  <span className="ms-1 text-caption font-medium text-muted">{t('heart.bpm')}</span>
                </dd>
              </div>
            ))}
          </dl>
          {withHr.length > 1 && (
            <div className="mt-3">
              <LineChart ariaLabel={t('heart.trend')} points={withHr.map((d) => ({ label: date(d.date), value: d.restingHr ?? d.heartRateAvg ?? 0 }))} />
              <p className="text-caption text-muted">{t('heart.trend')}</p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
