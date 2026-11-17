import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tabs } from '../../components/ui';
import { RANGES, parseRange, type Bucket, type RangeDays } from '../../domain/series';
import { useFormat } from '../../lib/hooks';

/** Time range shared by every Health chart, kept in the URL (?range=30) so it survives tab switches. */
export function useHealthRange(): [RangeDays, (r: RangeDays) => void] {
  const [params, setParams] = useSearchParams();
  const range = parseRange(params.get('range'));
  const set = (r: RangeDays) => {
    const next = new URLSearchParams(params);
    if (r === 7) next.delete('range');
    else next.set('range', String(r));
    setParams(next, { replace: true });
  };
  return [range, set];
}

export function RangeFilter({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [range, setRange] = useHealthRange();
  return (
    <Tabs
      className={className}
      ariaLabel={t('health.rangeLabel')}
      value={String(range)}
      onChange={(v) => setRange(Number(v) as RangeDays)}
      items={RANGES.map((r) => ({ id: String(r), label: t(`health.range.${r}`) }))}
    />
  );
}

/** Axis label for a bucket: weekday for a week, day for a month, week start for 90 days, month for a year. */
export function useBucketLabel() {
  const { date } = useFormat();
  return (b: Bucket, range: RangeDays) =>
    b.kind === 'month'
      ? date(b.start, { month: 'short' })
      : b.kind === 'week'
        ? date(b.start, { day: 'numeric', month: 'short' })
        : range === 7
          ? date(b.start, { weekday: 'narrow' })
          : date(b.start, { day: 'numeric' });
}
