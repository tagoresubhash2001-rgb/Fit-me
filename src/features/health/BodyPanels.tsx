import { HeartRateCard } from './HeartRateCard';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, RefreshCw } from 'lucide-react';
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  LineChart,
  ProgressRing,
  Sheet,
  Skeleton,
  Stepper,
  SwipeRow,
  cn,
  toast,
} from '../../components/ui';
import { useSession } from '../../data/session';
import { useRecords } from '../../data/useRecords';
import { createRecord, restore, softDelete, updateRecord } from '../../data/records';
import { updateProfileFields } from '../../data/auth';
import { Link } from 'react-router-dom';
import { connectHealth, healthAvailable, healthAppName, isHealthConnected, syncSteps } from '../../data/healthSync';
import { useToday, useFormat } from '../../lib/hooks';
import { addDays, formatMinutes } from '../../domain/dates';
import { rangeStart, seriesFor } from '../../domain/series';
import { useBucketLabel, useHealthRange } from './RangeFilter';
import { movingAverage, isPlateau, sleepMinutes } from '../../domain/progress';
import { kgToLb, type WeightUnit } from '../../domain/units';
import type { WeightLog, SleepLog, StepLog } from '../../domain/models';
import { MeasureInput } from '../common/fields';
import { useUnits } from '../common/useUnits';
import { TimeField } from '../onboarding/BodyFields';

const undoDelete = (c: 'weightLogs' | 'sleepLogs' | 'stepLogs', id: string, msg: string, undo: string) => {
  void softDelete(c, id);
  toast(msg, 'info', { label: undo, onClick: () => void restore(c, id) });
};

function DateField({ label, value, max, onChange }: { label: string; value: string; max: string; onChange: (d: string) => void }) {
  return <Input label={label} type="date" value={value} max={max} onChange={(e) => e.target.value && onChange(e.target.value)} />;
}

// ---------------------------------------------------------------- Weight
export function WeightPanel() {
  const { t } = useTranslation();
  const { date, n } = useFormat();
  const { prefs, wt } = useUnits();
  const profile = useSession((s) => s.profile)!;
  const today = useToday();
  const logs = useRecords<WeightLog>('weightLogs', addDays(today, -365), today);
  const [unit, setUnit] = useState<WeightUnit>(prefs.weight);
  const [kg, setKg] = useState<number | ''>(profile.weightKg);
  const [logDate, setLogDate] = useState(today);
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [hip, setHip] = useState('');
  const [editing, setEditing] = useState<WeightLog | null>(null);
  const [range] = useHealthRange();
  const sorted = [...logs.rows].sort((a, b) => a.date.localeCompare(b.date));
  const allPoints = sorted.map((l) => ({ date: l.date, value: l.kg }));
  const allAvg = movingAverage(allPoints, 7);
  const inRange = (d: string) => d >= rangeStart(range, today);
  const points = allPoints.filter((p) => inRange(p.date));
  const avg = allAvg.filter((p) => inRange(p.date));
  const latest = sorted.at(-1);
  const trend = allAvg.at(-1)?.avg;
  const monthAgo = allAvg.filter((a) => a.date <= addDays(today, -30)).at(-1)?.avg;
  const m = (v: string) => {
    const x = Number(v.replace(',', '.'));
    return v.trim() && Number.isFinite(x) && x >= 30 && x <= 250 ? Math.round(x * 10) / 10 : undefined;
  };
  const badMeasure = (v: string) => v.trim() !== '' && m(v) === undefined;
  const valid = typeof kg === 'number' && kg >= 20 && kg <= 400 && ![waist, chest, hip].some(badMeasure);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    void createRecord(
      'weightLogs',
      { kg: Math.round((kg as number) * 10) / 10, waistCm: m(waist), chestCm: m(chest), hipCm: m(hip) },
      { date: logDate },
    );
    if (logDate === today) void updateProfileFields({ weightKg: Math.round((kg as number) * 10) / 10 });
    if (unit !== prefs.weight) void updateProfileFields({ weightUnit: unit });
    toast(t('common.saved'));
    setWaist('');
    setChest('');
    setHip('');
  };
  const change30 = trend !== undefined && monthAgo !== undefined ? trend - monthAgo : null;

  return (
    <>
      <Card style={{ viewTransitionName: 'tile-weight' }}>
        <CardHeader title={t('weight.title')} subtitle={t('weight.trendNote')} />
        {logs.loading ? (
          <Skeleton className="h-32" />
        ) : !latest ? (
          <EmptyState title={t('weight.empty')} description={t('weight.emptyHint')} />
        ) : (
          <>
            <dl className="grid grid-cols-3 gap-2">
              {(
                [
                  ['weight.current', wt(latest.kg)],
                  ['weight.trend', trend !== undefined ? wt(trend) : '—'],
                  [
                    'weight.change30',
                    change30 !== null
                      ? `${change30 > 0 ? '+' : ''}${n(prefs.weight === 'kg' ? change30 : kgToLb(change30), 1)} ${prefs.weight === 'kg' ? 'kg' : 'lb'}`
                      : '—',
                  ],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="rounded-input bg-raised p-3">
                  <dt className="text-caption text-muted">{t(k)}</dt>
                  <dd className="text-body font-semibold text-ink tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3">
              <LineChart
                ariaLabel={t('weight.history')}
                points={points.map((p) => ({ label: date(p.date), value: p.value }))}
                secondary={avg.map((p) => ({ label: date(p.date), value: p.avg }))}
              />
            </div>
            {trend !== undefined && (
              <p className="mt-2 text-small text-muted">
                {t('weight.target')}: {wt(profile.targetWeightKg)} ·{' '}
                {t('weight.toGoal', { amount: wt(Math.abs(trend - profile.targetWeightKg)) })}
              </p>
            )}
            {isPlateau(points, today) && <p className="mt-2 rounded-input bg-sage p-3 text-small text-ink">{t('weight.plateau')}</p>}
          </>
        )}
      </Card>
      <Card>
        <CardHeader title={t('weight.log')} />
        <form className="flex flex-col gap-4" onSubmit={save}>
          <MeasureInput
            kind="weight"
            label={t('weight.title')}
            valueMetric={kg}
            unit={unit}
            onUnitChange={(u) => setUnit(u as WeightUnit)}
            onChange={setKg}
            error={!valid && kg !== '' ? t('onboarding.errors.weight') : undefined}
          />
          <DateField label={t('common.date')} value={logDate} max={today} onChange={setLogDate} />
          <p className="text-small font-medium text-ink">
            {t('weight.measurements')} ({t('common.optional')}, cm)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Input
              label={t('weight.waist')}
              inputMode="decimal"
              value={waist}
              error={badMeasure(waist) ? t('weight.measureRange') : undefined}
              onChange={(e) => setWaist(e.target.value)}
            />
            <Input
              label={t('weight.chest')}
              inputMode="decimal"
              value={chest}
              error={badMeasure(chest) ? t('weight.measureRange') : undefined}
              onChange={(e) => setChest(e.target.value)}
            />
            <Input
              label={t('weight.hip')}
              inputMode="decimal"
              value={hip}
              error={badMeasure(hip) ? t('weight.measureRange') : undefined}
              onChange={(e) => setHip(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={!valid}>
            {t('common.save')}
          </Button>
        </form>
      </Card>
      {sorted.length > 0 && (
        <Card>
          <CardHeader title={t('weight.history')} />
          <ul className="list-lazy -mx-2 flex flex-col divide-y divide-line md:max-h-[28rem] md:overflow-y-auto *:shrink-0">
            {[...sorted]
              .reverse()
              .slice(0, 60)
              .map((l) => (
                <SwipeRow
                  key={l.id}
                  className="px-2"
                  onEdit={() => setEditing(l)}
                  onDelete={() => undoDelete('weightLogs', l.id, t('common.deleted'), t('common.undo'))}
                  editLabel={t('common.edit')}
                  deleteLabel={t('common.delete')}
                  menuLabel={t('common.moreActions')}
                >
                  <div className="flex items-center justify-between gap-2 py-2.5">
                    <span className="text-small text-muted">{date(l.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="text-body font-medium text-ink tabular-nums">{wt(l.kg)}</span>
                  </div>
                </SwipeRow>
              ))}
          </ul>
        </Card>
      )}
      <EditWeightSheet key={editing?.id ?? 'none'} entry={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function EditWeightSheet({ entry, onClose }: { entry: WeightLog | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { prefs } = useUnits();
  const today = useToday();
  const [kg, setKg] = useState<number | ''>(() => entry?.kg ?? '');
  const [unit, setUnit] = useState<WeightUnit>(prefs.weight);
  const [d, setD] = useState(() => entry?.date ?? today);
  if (!entry) return null;
  const valid = typeof kg === 'number' && kg >= 20 && kg <= 400;
  return (
    <Sheet
      open
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('weight.editEntry')}
      footer={
        <Button
          fullWidth
          disabled={!valid}
          onClick={() => {
            void updateRecord('weightLogs', entry.id, { kg: Math.round((kg as number) * 10) / 10, date: d });
            toast(t('common.saved'));
            onClose();
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <MeasureInput
          kind="weight"
          label={t('weight.title')}
          valueMetric={kg}
          unit={unit}
          onUnitChange={(u) => setUnit(u as WeightUnit)}
          onChange={setKg}
          error={!valid ? t('onboarding.errors.weight') : undefined}
        />
        <DateField label={t('common.date')} value={d} max={today} onChange={setD} />
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- Sleep
const QUALITIES = [1, 2, 3, 4, 5];
function QualityPicker({ value, onChange }: { value: number; onChange: (q: number) => void }) {
  const { t } = useTranslation();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-small font-medium text-ink">{t('sleep.quality')}</legend>
      <div className="grid grid-cols-5 gap-1">
        {QUALITIES.map((q) => (
          <button
            key={q}
            type="button"
            aria-pressed={value === q}
            onClick={() => onChange(q)}
            className={cn(
              'min-h-12 rounded-input border px-1 text-caption transition-colors',
              value === q ? 'border-primary bg-primary-subtle text-ink' : 'border-line text-muted hover:bg-raised',
            )}
          >
            {t(`sleep.quality${q}`)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function SleepPanel() {
  const { t } = useTranslation();
  const { n, date, lang } = useFormat();
  const profile = useSession((s) => s.profile)!;
  const today = useToday();
  const [range] = useHealthRange();
  const bucketLabel = useBucketLabel();
  const from = rangeStart(range, today);
  const logs = useRecords<SleepLog>('sleepLogs', from, today);
  const [start, setStart] = useState(profile.sleepStartMinutes);
  const [end, setEnd] = useState(profile.wakeMinutes);
  const [quality, setQuality] = useState(3);
  const [night, setNight] = useState(today);
  const [editing, setEditing] = useState<SleepLog | null>(null);
  const avg = logs.rows.length ? logs.rows.reduce((a, s) => a + s.durationMin, 0) / logs.rows.length / 60 : null;
  const duration = sleepMinutes(start, end);
  return (
    <>
      <Card style={{ viewTransitionName: 'tile-sleep' }}>
        <CardHeader title={t('sleep.title')} subtitle={avg !== null ? `${t('sleep.average')}: ${n(avg, 1)} ${t('common.h')}` : undefined} />
        {logs.loading ? (
          <Skeleton className="h-32" />
        ) : logs.rows.length === 0 ? (
          <EmptyState title={t('sleep.empty')} description={t('sleep.emptyHint')} />
        ) : (
          <BarChart
            ariaLabel={t('sleep.history')}
            target={7}
            targetLabel={`7 ${t('common.h')}`}
            colorClass="fill-sleep"
            points={seriesFor(range, today, (d) => (logs.rows.find((s) => s.date === d)?.durationMin ?? 0) / 60).map((b) => ({
              label: bucketLabel(b, range),
              value: b.value,
            }))}
            formatValue={(v) => `${n(v, 1)} ${t('common.h')}`}
          />
        )}
        <ul className="list-lazy -mx-2 mt-2 flex flex-col divide-y divide-line">
          {[...logs.rows]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((s) => (
              <SwipeRow
                key={s.id}
                className="px-2"
                onEdit={s.source === 'device' ? undefined : () => setEditing(s)}
                onDelete={() => undoDelete('sleepLogs', s.id, t('common.deleted'), t('common.undo'))}
                editLabel={t('common.edit')}
                deleteLabel={t('common.delete')}
                menuLabel={t('common.moreActions')}
              >
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <span className="text-small text-muted">{date(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="text-end text-body text-ink tabular-nums">
                    {n(s.durationMin / 60, 1)} {t('common.h')} · {formatMinutes(s.startMinutes, lang)}–{formatMinutes(s.endMinutes, lang)}
                  </span>
                </div>
              </SwipeRow>
            ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title={t('sleep.log')} />
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void createRecord('sleepLogs', { startMinutes: start, endMinutes: end, durationMin: duration, quality }, { date: night });
            toast(t('common.saved'));
          }}
        >
          <DateField label={t('sleep.morningOf')} value={night} max={today} onChange={setNight} />
          <div className="grid grid-cols-2 gap-2">
            <TimeField label={t('sleep.bedtime')} minutes={start} onChange={setStart} />
            <TimeField label={t('sleep.wake')} minutes={end} onChange={setEnd} />
          </div>
          <p className={cn('text-small', duration < 180 || duration > 16 * 60 ? 'text-accent' : 'text-muted')}>
            {t('sleep.duration')}: {n(duration / 60, 1)} {t('common.h')}
            {(duration < 180 || duration > 16 * 60) && ` · ${t('sleep.checkTimes')}`}
          </p>
          <QualityPicker value={quality} onChange={setQuality} />
          <Button type="submit" disabled={duration === 0}>
            {t('common.save')}
          </Button>
        </form>
      </Card>
      <EditSleepSheet key={editing?.id ?? 'none'} entry={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function EditSleepSheet({ entry, onClose }: { entry: SleepLog | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { n } = useFormat();
  const today = useToday();
  const [s, setS] = useState(() => entry?.startMinutes ?? 0);
  const [e, setE] = useState(() => entry?.endMinutes ?? 0);
  const [q, setQ] = useState(() => entry?.quality ?? 3);
  const [d, setD] = useState(() => entry?.date ?? today);
  if (!entry) return null;
  const dur = sleepMinutes(s, e);
  return (
    <Sheet
      open
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('sleep.editEntry')}
      footer={
        <Button
          fullWidth
          disabled={dur === 0}
          onClick={() => {
            void updateRecord('sleepLogs', entry.id, { startMinutes: s, endMinutes: e, durationMin: dur, quality: q, date: d });
            toast(t('common.saved'));
            onClose();
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <DateField label={t('sleep.morningOf')} value={d} max={today} onChange={setD} />
        <div className="grid grid-cols-2 gap-2">
          <TimeField label={t('sleep.bedtime')} minutes={s} onChange={setS} />
          <TimeField label={t('sleep.wake')} minutes={e} onChange={setE} />
        </div>
        <p className="text-small text-muted">
          {t('sleep.duration')}: {n(dur / 60, 1)} {t('common.h')}
        </p>
        <QualityPicker value={q} onChange={setQ} />
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- Steps
export function StepsPanel() {
  const { t } = useTranslation();
  const { n, date } = useFormat();
  const profile = useSession((s) => s.profile)!;
  const today = useToday();
  const [range] = useHealthRange();
  const bucketLabel = useBucketLabel();
  const from = rangeStart(range, today);
  const logs = useRecords<StepLog>('stepLogs', from, today);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState<number | ''>('');
  const [manualDate, setManualDate] = useState(today);
  const [editing, setEditing] = useState<StepLog | null>(null);
  const goal = profile.stepTarget ?? 8000;
  const app = t(`steps.${healthAppName()}`);
  useEffect(() => {
    void healthAvailable().then(setAvailable);
    void isHealthConnected()
      .then(setConnected)
      .catch(() => setConnected(false));
  }, []);
  const byDay = (d: string) => logs.rows.filter((l) => l.date === d).reduce((a, l) => Math.max(a, l.steps), 0);
  const todaySteps = byDay(today);
  const todaySource = logs.rows.filter((l) => l.date === today).sort((a, b) => b.steps - a.steps)[0];

  const sync = async () => {
    setBusy(true);
    try {
      if (!connected) {
        const r = await connectHealth();
        if (r !== 'granted') {
          toast(t(r === 'denied' ? 'steps.permissionDenied' : 'steps.notAvailable'), 'error');
          return;
        }
        setConnected(true);
      }
      await syncSteps(7);
      toast(t('steps.synced'));
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card style={{ viewTransitionName: 'tile-steps' }} className="flex flex-col items-center gap-3">
        {logs.loading ? (
          <Skeleton className="h-40 w-40 rounded-full" />
        ) : (
          <ProgressRing value={todaySteps} max={goal} size={150} stroke={12} label={t('steps.title')}>
            <span className="text-title text-ink tabular-nums">{todaySteps ? n(todaySteps) : '—'}</span>
            <span className="text-caption text-muted">
              {t('common.of')} {n(goal)}
            </span>
          </ProgressRing>
        )}
        {todaySource && <Badge>{t('steps.source', { source: todaySource.deviceName ?? t('steps.manualSource') })}</Badge>}
        {available === false ? (
          <p data-screenshot-hide className="text-center text-small text-muted">
            {t('steps.webOnly')}{' '}
            <Link to="/settings#devices" className="font-semibold text-primary-text hover:underline">
              {t('devices.title')}
            </Link>
          </p>
        ) : (
          <Button
            variant="secondary"
            loading={busy}
            icon={
              connected ? (
                <RefreshCw className="h-[18px] w-[18px]" strokeWidth={1.75} />
              ) : (
                <Smartphone className="h-[18px] w-[18px]" strokeWidth={1.75} />
              )
            }
            onClick={() => void sync()}
          >
            {connected ? t('steps.sync') : t('steps.connect', { app })}
          </Button>
        )}
      </Card>
      <HeartRateCard />
      <Card>
        <CardHeader title={t('steps.title')} />
        <BarChart
          ariaLabel={t('steps.title')}
          target={goal}
          targetLabel={`${t('steps.target')}: ${n(goal)}`}
          points={seriesFor(range, today, byDay).map((b) => ({ label: bucketLabel(b, range), value: b.value }))}
          formatValue={(v) => n(Math.round(v))}
        />
        <ul className="list-lazy -mx-2 mt-2 flex flex-col divide-y divide-line">
          {[...logs.rows]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((l) => (
              <SwipeRow
                key={l.id}
                className="px-2"
                onEdit={l.source === 'device' ? undefined : () => setEditing(l)}
                onDelete={() => undoDelete('stepLogs', l.id, t('common.deleted'), t('common.undo'))}
                editLabel={t('common.edit')}
                deleteLabel={t('common.delete')}
                menuLabel={t('common.moreActions')}
              >
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <span className="text-small text-muted">{date(l.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="text-end text-body text-ink tabular-nums">
                    {n(l.steps)} <span className="text-caption text-muted">· {l.deviceName ?? t('steps.manualSource')}</span>
                  </span>
                </div>
              </SwipeRow>
            ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title={t('steps.manual')} />
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (typeof manual !== 'number' || manual <= 0 || manual > 200000) return;
            void createRecord('stepLogs', { steps: Math.round(manual) }, { id: `manual-${manualDate}`, date: manualDate });
            toast(t('common.saved'));
            setManual('');
          }}
        >
          <Stepper
            label={t('steps.count')}
            value={manual}
            onChange={setManual}
            step={500}
            min={0}
            max={200000}
            decreaseLabel={t('common.decrease')}
            increaseLabel={t('common.increase')}
          />
          <DateField label={t('common.date')} value={manualDate} max={today} onChange={setManualDate} />
          <Button type="submit" disabled={typeof manual !== 'number' || manual <= 0}>
            {t('common.save')}
          </Button>
        </form>
      </Card>
      <EditStepsSheet key={editing?.id ?? 'none'} entry={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function EditStepsSheet({ entry, onClose }: { entry: StepLog | null; onClose: () => void }) {
  const { t } = useTranslation();
  const [v, setV] = useState<number | ''>(() => entry?.steps ?? '');
  if (!entry) return null;
  const valid = typeof v === 'number' && v > 0 && v <= 200000;
  return (
    <Sheet
      open
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('steps.editEntry')}
      footer={
        <Button
          fullWidth
          disabled={!valid}
          onClick={() => {
            void updateRecord('stepLogs', entry.id, { steps: Math.round(v as number) });
            toast(t('common.saved'));
            onClose();
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <Stepper
        label={t('steps.count')}
        value={v}
        onChange={setV}
        step={500}
        min={0}
        max={200000}
        decreaseLabel={t('common.decrease')}
        increaseLabel={t('common.increase')}
      />
    </Sheet>
  );
}
