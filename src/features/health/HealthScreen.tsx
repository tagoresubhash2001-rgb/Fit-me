import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, Smartphone, RefreshCw, Award, Lock } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconButton,
  Input,
  ProgressRing,
  Skeleton,
  Tabs,
  BarChart,
  LineChart,
  Badge,
  toast,
} from '../../components/ui';
import { useSession } from '../../data/session';
import { useRecords } from '../../data/useRecords';
import { createRecord, softDelete, restore } from '../../data/records';
import { updateProfileFields } from '../../data/auth';
import { connectHealth, healthAvailable, healthAppName, isHealthConnected, syncSteps } from '../../data/healthSync';
import { useToday, useFormat } from '../../lib/hooks';
import { addDays, dateRange } from '../../domain/dates';
import { formatVolume, formatWeight, flOzToMl, lbToKg, kgToLb } from '../../domain/units';
import { movingAverage, isPlateau, sleepMinutes, currentStreak, earnedBadges, type BadgeId } from '../../domain/progress';
import { sumNutrients } from '../../domain/nutrition';
import type { WaterLog, WeightLog, SleepLog, StepLog, FoodLog, WorkoutLog } from '../../domain/models';
import { addWater } from './waterActions';
import { TimeField } from '../onboarding/BodyFields';

type Tab = 'water' | 'weight' | 'sleep' | 'steps' | 'progress';
const TABS: Tab[] = ['water', 'weight', 'sleep', 'steps', 'progress'];

export default function HealthScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const tab = (TABS.includes(params.tab as Tab) ? params.tab : 'water') as Tab;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-display text-ink">{t('health.title')}</h1>
      <div className="-mx-4 overflow-x-auto px-4">
        <Tabs
          className="min-w-[420px]"
          value={tab}
          onChange={(v) => navigate(`/health/${v}`, { replace: true })}
          items={TABS.map((id) => ({ id, label: t(`health.tabs.${id}`) }))}
        />
      </div>
      {tab === 'water' && <WaterPanel />}
      {tab === 'weight' && <WeightPanel />}
      {tab === 'sleep' && <SleepPanel />}
      {tab === 'steps' && <StepsPanel />}
      {tab === 'progress' && <ProgressPanel />}
    </div>
  );
}

function useWeek() {
  const today = useToday();
  return { today, from: addDays(today, -6), days: dateRange(addDays(today, -6), today) };
}

function WaterPanel() {
  const { t } = useTranslation();
  const { n, lang, date } = useFormat();
  const profile = useSession((s) => s.profile)!;
  const { today, from, days } = useWeek();
  const logs = useRecords<WaterLog>('waterLogs', from, today);
  const [custom, setCustom] = useState<number | ''>('');
  const [editTarget, setEditTarget] = useState(false);
  const [target, setTarget] = useState<number | ''>(profile.waterTargetMl ?? profile.targets.waterMl);
  const goal = profile.waterTargetMl ?? profile.targets.waterMl;
  const imperial = profile.units === 'imperial';
  const todayLogs = logs.rows.filter((l) => l.date === today);
  const total = todayLogs.reduce((a, l) => a + l.ml, 0);
  const quick = imperial ? [flOzToMl(4), flOzToMl(8), flOzToMl(16)] : [100, 250, 500];
  return (
    <>
      <Card className="flex flex-col items-center gap-4">
        {logs.loading ? (
          <Skeleton className="h-40 w-40 rounded-full" />
        ) : (
          <ProgressRing value={total} max={goal} size={160} stroke={12} colorClass="stroke-water" label={t('water.title')}>
            <span className="text-title text-ink tabular-nums">{formatVolume(total, profile.units, lang)}</span>
            <span className="text-caption text-muted">
              {t('common.of')} {formatVolume(goal, profile.units, lang)}
            </span>
          </ProgressRing>
        )}
        <div className="grid w-full grid-cols-3 gap-2">
          {quick.map((ml) => (
            <Button key={ml} variant="secondary" onClick={() => void addWater(ml, t, lang, profile.units)}>
              {formatVolume(ml, profile.units, lang)}
            </Button>
          ))}
        </div>
        <form
          className="grid w-full grid-cols-[1fr_auto] items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (typeof custom !== 'number' || custom <= 0) return;
            const ml = imperial ? flOzToMl(custom) : custom;
            if (ml > 5000) return;
            void addWater(ml, t, lang, profile.units);
            setCustom('');
          }}
        >
          <Input
            label={`${t('water.custom')} (${imperial ? 'fl oz' : t('common.ml')})`}
            inputMode="decimal"
            value={custom}
            onChange={(e) => setCustom(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <Button type="submit" disabled={typeof custom !== 'number' || custom <= 0}>
            {t('common.add')}
          </Button>
        </form>
        <div className="flex w-full items-center justify-between gap-2 border-t border-line pt-3">
          <span className="text-small text-muted">
            {t('water.target')}: {formatVolume(goal, profile.units, lang)}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setEditTarget((v) => !v)}>
            {t('water.editTarget')}
          </Button>
        </div>
        {editTarget && (
          <form
            className="grid w-full grid-cols-[1fr_auto] items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (typeof target !== 'number' || target < 500 || target > 8000) return;
              void updateProfileFields({ waterTargetMl: Math.round(target) });
              toast(t('settings.targetsUpdated'));
              setEditTarget(false);
            }}
          >
            <Input
              label={`${t('water.target')} (${t('common.ml')})`}
              inputMode="numeric"
              value={target}
              onChange={(e) => setTarget(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Button type="submit">{t('common.save')}</Button>
          </form>
        )}
      </Card>
      <Card>
        <CardHeader title={t('water.history')} />
        <BarChart
          ariaLabel={t('water.history')}
          target={goal}
          colorClass="fill-water"
          points={days.map((d) => ({
            label: date(d, { weekday: 'narrow' }),
            value: logs.rows.filter((l) => l.date === d).reduce((a, l) => a + l.ml, 0),
          }))}
          formatValue={(v) => formatVolume(v, profile.units, lang)}
        />
        {todayLogs.length === 0 ? (
          <p className="mt-3 text-small text-muted">{t('water.empty')}</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {todayLogs.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2">
                <span className="text-body text-ink tabular-nums">{formatVolume(l.ml, profile.units, lang)}</span>
                <IconButton
                  label={t('common.delete')}
                  onClick={() => {
                    void softDelete('waterLogs', l.id);
                    toast(t('common.deleted'), 'info', { label: t('common.undo'), onClick: () => void restore('waterLogs', l.id) });
                  }}
                >
                  <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <span className="sr-only">{n(total)}</span>
    </>
  );
}

function WeightPanel() {
  const { t } = useTranslation();
  const { lang, date, n } = useFormat();
  const profile = useSession((s) => s.profile)!;
  const today = useToday();
  const logs = useRecords<WeightLog>('weightLogs', addDays(today, -90), today);
  const imperial = profile.units === 'imperial';
  const [kg, setKg] = useState<number | ''>('');
  const [waist, setWaist] = useState<number | ''>('');
  const [chest, setChest] = useState<number | ''>('');
  const [hip, setHip] = useState<number | ''>('');
  const sorted = [...logs.rows].sort((a, b) => a.date.localeCompare(b.date));
  const points = sorted.map((l) => ({ date: l.date, value: l.kg }));
  const avg = movingAverage(points, 7);
  const latest = sorted.at(-1);
  const trend = avg.at(-1)?.avg;
  const monthAgo = avg.filter((a) => a.date <= addDays(today, -30)).at(-1)?.avg;
  const plateau = isPlateau(points, today);
  const toGoal = trend !== undefined ? Math.abs(trend - profile.targetWeightKg) : null;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof kg !== 'number') return;
    const valueKg = imperial ? lbToKg(kg) : kg;
    if (valueKg < 20 || valueKg > 400) return;
    const m = (v: number | '') => (typeof v === 'number' && v > 0 ? v : undefined);
    void createRecord('weightLogs', { kg: Math.round(valueKg * 10) / 10, waistCm: m(waist), chestCm: m(chest), hipCm: m(hip) });
    void updateProfileFields({ weightKg: Math.round(valueKg * 10) / 10 });
    toast(t('common.saved'));
    setKg('');
    setWaist('');
    setChest('');
    setHip('');
  };

  return (
    <>
      <Card>
        <CardHeader title={t('weight.title')} subtitle={t('weight.trendNote')} />
        {logs.loading ? (
          <Skeleton className="h-32" />
        ) : !latest ? (
          <EmptyState title={t('weight.empty')} />
        ) : (
          <>
            <dl className="grid grid-cols-3 gap-2">
              <div className="rounded-input bg-raised p-3">
                <dt className="text-caption text-muted">{t('weight.current')}</dt>
                <dd className="text-body font-semibold text-ink tabular-nums">{formatWeight(latest.kg, profile.units, lang)}</dd>
              </div>
              <div className="rounded-input bg-raised p-3">
                <dt className="text-caption text-muted">{t('weight.trend')}</dt>
                <dd className="text-body font-semibold text-ink tabular-nums">
                  {trend !== undefined ? formatWeight(trend, profile.units, lang) : '—'}
                </dd>
              </div>
              <div className="rounded-input bg-raised p-3">
                <dt className="text-caption text-muted">{t('weight.change30')}</dt>
                <dd className="text-body font-semibold text-ink tabular-nums">
                  {trend !== undefined && monthAgo !== undefined
                    ? `${trend - monthAgo > 0 ? '+' : ''}${n(imperial ? kgToLb(trend - monthAgo) : trend - monthAgo, 1)}`
                    : '—'}
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <LineChart
                ariaLabel={t('weight.history')}
                points={points.map((p) => ({ label: date(p.date), value: p.value }))}
                secondary={avg.map((p) => ({ label: date(p.date), value: p.avg }))}
              />
            </div>
            {toGoal !== null && (
              <p className="mt-2 text-small text-muted">
                {t('weight.target')}: {formatWeight(profile.targetWeightKg, profile.units, lang)} ·{' '}
                {t('weight.toGoal', { amount: formatWeight(toGoal, profile.units, lang) })}
              </p>
            )}
            {plateau && <p className="mt-2 rounded-input bg-sage p-3 text-small text-ink">{t('weight.plateau')}</p>}
          </>
        )}
      </Card>
      <Card>
        <CardHeader title={t('weight.log')} />
        <form className="flex flex-col gap-3" onSubmit={save}>
          <Input
            label={`${t('weight.title')} (${imperial ? 'lb' : 'kg'})`}
            inputMode="decimal"
            value={kg}
            onChange={(e) => setKg(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <p className="text-small font-medium text-ink">
            {t('weight.measurements')} ({t('common.optional')}, cm)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Input
              label={t('weight.waist')}
              inputMode="decimal"
              value={waist}
              onChange={(e) => setWaist(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label={t('weight.chest')}
              inputMode="decimal"
              value={chest}
              onChange={(e) => setChest(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label={t('weight.hip')}
              inputMode="decimal"
              value={hip}
              onChange={(e) => setHip(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <Button type="submit" disabled={typeof kg !== 'number'}>
            {t('common.save')}
          </Button>
        </form>
      </Card>
      {sorted.length > 0 && (
        <Card>
          <CardHeader title={t('weight.history')} />
          <ul className="flex flex-col divide-y divide-line">
            {[...sorted]
              .reverse()
              .slice(0, 30)
              .map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="text-small text-muted">{date(l.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="flex-1 text-end text-body text-ink tabular-nums">{formatWeight(l.kg, profile.units, lang)}</span>
                  <IconButton label={t('common.delete')} onClick={() => void softDelete('weightLogs', l.id)}>
                    <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </IconButton>
                </li>
              ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function SleepPanel() {
  const { t } = useTranslation();
  const { n, date } = useFormat();
  const profile = useSession((s) => s.profile)!;
  const { today, from, days } = useWeek();
  const logs = useRecords<SleepLog>('sleepLogs', from, today);
  const [start, setStart] = useState(profile.sleepStartMinutes);
  const [end, setEnd] = useState(profile.wakeMinutes);
  const [quality, setQuality] = useState(3);
  const avg = logs.rows.length ? logs.rows.reduce((a, s) => a + s.durationMin, 0) / logs.rows.length / 60 : null;
  return (
    <>
      <Card>
        <CardHeader title={t('sleep.title')} subtitle={avg !== null ? `${t('sleep.average')}: ${n(avg, 1)} ${t('common.h')}` : undefined} />
        {logs.loading ? (
          <Skeleton className="h-32" />
        ) : logs.rows.length === 0 ? (
          <EmptyState title={t('sleep.empty')} />
        ) : (
          <BarChart
            ariaLabel={t('sleep.history')}
            target={7}
            colorClass="fill-sleep"
            points={days.map((d) => ({
              label: date(d, { weekday: 'narrow' }),
              value: (logs.rows.find((s) => s.date === d)?.durationMin ?? 0) / 60,
            }))}
            formatValue={(v) => `${n(v, 1)} ${t('common.h')}`}
          />
        )}
        <ul className="mt-2 flex flex-col divide-y divide-line">
          {[...logs.rows]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                <span className="text-small text-muted">{date(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className="flex-1 text-end text-body text-ink tabular-nums">
                  {n(s.durationMin / 60, 1)} {t('common.h')}
                  {s.deviceName ? ` · ${t('sleep.fromDevice', { device: s.deviceName })}` : ''}
                </span>
                <IconButton label={t('common.delete')} onClick={() => void softDelete('sleepLogs', s.id)}>
                  <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </IconButton>
              </li>
            ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title={t('sleep.log')} />
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void createRecord('sleepLogs', { startMinutes: start, endMinutes: end, durationMin: sleepMinutes(start, end), quality });
            toast(t('common.saved'));
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <TimeField label={t('sleep.bedtime')} minutes={start} onChange={setStart} />
            <TimeField label={t('sleep.wake')} minutes={end} onChange={setEnd} />
          </div>
          <p className="text-small text-muted">
            {t('sleep.duration')}: {n(sleepMinutes(start, end) / 60, 1)} {t('common.h')}
          </p>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-small font-medium text-ink">{t('sleep.quality')}</legend>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  type="button"
                  aria-pressed={quality === q}
                  onClick={() => setQuality(q)}
                  className={`min-h-12 rounded-input border px-1 text-caption ${quality === q ? 'border-primary bg-primary-subtle text-ink' : 'border-line text-muted'}`}
                >
                  {t(`sleep.quality${q}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <Button type="submit">{t('common.save')}</Button>
        </form>
      </Card>
    </>
  );
}

function StepsPanel() {
  const { t } = useTranslation();
  const { n, date } = useFormat();
  const profile = useSession((s) => s.profile)!;
  const { today, from, days } = useWeek();
  const logs = useRecords<StepLog>('stepLogs', from, today);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState<number | ''>('');
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
      <Card className="flex flex-col items-center gap-3">
        <ProgressRing value={todaySteps} max={goal} size={150} stroke={12} label={t('steps.title')}>
          <span className="text-title text-ink tabular-nums">{todaySteps ? n(todaySteps) : '—'}</span>
          <span className="text-caption text-muted">
            {t('common.of')} {n(goal)}
          </span>
        </ProgressRing>
        {todaySource && <Badge>{t('steps.source', { source: todaySource.deviceName ?? t('food.sources.custom') })}</Badge>}
        {available === false ? (
          <p className="text-center text-small text-muted">{t('steps.webOnly')}</p>
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
      <Card>
        <CardHeader title={t('steps.title')} />
        <BarChart
          ariaLabel={t('steps.title')}
          target={goal}
          points={days.map((d) => ({ label: date(d, { weekday: 'narrow' }), value: byDay(d) }))}
          formatValue={(v) => n(v)}
        />
      </Card>
      <Card>
        <form
          className="grid grid-cols-[1fr_auto] items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (typeof manual !== 'number' || manual <= 0 || manual > 200000) return;
            void createRecord('stepLogs', { steps: Math.round(manual) }, { id: `manual-${today}` });
            toast(t('common.saved'));
            setManual('');
          }}
        >
          <Input
            label={t('steps.manual')}
            inputMode="numeric"
            value={manual}
            onChange={(e) => setManual(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <Button type="submit" disabled={typeof manual !== 'number' || manual <= 0}>
            {t('common.save')}
          </Button>
        </form>
      </Card>
    </>
  );
}

const BADGES: BadgeId[] = ['first_log', 'meals_week', 'hydration_7', 'workouts_5', 'sleep_routine', 'consistency_30'];

function ProgressPanel() {
  const { t } = useTranslation();
  const { n, lang } = useFormat();
  const profile = useSession((s) => s.profile)!;
  const today = useToday();
  const from = addDays(today, -89);
  const food = useRecords<FoodLog>('foodLogs', from, today);
  const water = useRecords<WaterLog>('waterLogs', from, today);
  const workouts = useRecords<WorkoutLog>('workoutLogs', from, today);
  const sleep = useRecords<SleepLog>('sleepLogs', from, today);
  const waterGoal = profile.waterTargetMl ?? profile.targets.waterMl;

  const stats = useMemo(() => {
    const foodDays = [...new Set(food.rows.map((r) => r.date))];
    const waterByDay = new Map<string, number>();
    for (const w of water.rows) waterByDay.set(w.date, (waterByDay.get(w.date) ?? 0) + w.ml);
    const waterGoalDays = [...waterByDay].filter(([, v]) => v >= waterGoal).map(([d]) => d);
    const loggingDays = [...new Set([...foodDays, ...waterByDay.keys(), ...workouts.rows.map((w) => w.date)])];
    const week = dateRange(addDays(today, -6), today);
    const weekFood = food.rows.filter((r) => week.includes(r.date));
    const weekFoodDays = new Set(weekFood.map((r) => r.date)).size;
    return {
      foodStreak: currentStreak(foodDays, today),
      waterStreak: currentStreak(waterGoalDays, today),
      workoutStreak: currentStreak(
        workouts.rows.map((w) => w.date),
        today,
      ),
      badges: earnedBadges({
        foodDays,
        waterGoalDays,
        workoutCount: workouts.rows.length,
        loggingDays,
        sleepGoodNights: sleep.rows.filter((s) => s.durationMin >= 420).map((s) => s.date),
      }),
      avgCalories: weekFoodDays ? sumNutrients(weekFood.map((r) => r.nutrients)).calories / weekFoodDays : null,
      weekWorkouts: workouts.rows.filter((w) => week.includes(w.date)).length,
      avgWater: week.reduce((a, d) => a + (waterByDay.get(d) ?? 0), 0) / 7,
      avgSleep: (() => {
        const s = sleep.rows.filter((x) => week.includes(x.date));
        return s.length ? s.reduce((a, x) => a + x.durationMin, 0) / s.length / 60 : null;
      })(),
    };
  }, [food.rows, water.rows, workouts.rows, sleep.rows, today, waterGoal]);

  if (food.loading || water.loading) return <Skeleton className="h-48" />;
  return (
    <>
      <Card>
        <CardHeader title={t('progress.title')} />
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['progress.streakFood', stats.foodStreak],
              ['progress.streakWater', stats.waterStreak],
              ['progress.streakWorkout', stats.workoutStreak],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-input bg-raised p-3">
              <p className="text-title text-ink tabular-nums">{n(v)}</p>
              <p className="text-caption text-muted">{t(k)}</p>
            </div>
          ))}
        </div>
        {stats.foodStreak === 0 && <p className="mt-3 text-small text-muted">{t('progress.keepGoing')}</p>}
      </Card>
      <Card>
        <CardHeader title={t('progress.weekSummary')} />
        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-input bg-raised p-3">
            <dt className="text-caption text-muted">{t('progress.avgCalories')}</dt>
            <dd className="text-body font-semibold text-ink tabular-nums">
              {stats.avgCalories !== null ? `${n(stats.avgCalories)} ${t('common.kcal')}` : '—'}
            </dd>
          </div>
          <div className="rounded-input bg-raised p-3">
            <dt className="text-caption text-muted">{t('progress.workouts')}</dt>
            <dd className="text-body font-semibold text-ink tabular-nums">{n(stats.weekWorkouts)}</dd>
          </div>
          <div className="rounded-input bg-raised p-3">
            <dt className="text-caption text-muted">{t('progress.avgWater')}</dt>
            <dd className="text-body font-semibold text-ink tabular-nums">{formatVolume(stats.avgWater, profile.units, lang)}</dd>
          </div>
          <div className="rounded-input bg-raised p-3">
            <dt className="text-caption text-muted">{t('progress.avgSleep')}</dt>
            <dd className="text-body font-semibold text-ink tabular-nums">
              {stats.avgSleep !== null ? `${n(stats.avgSleep, 1)} ${t('common.h')}` : '—'}
            </dd>
          </div>
        </dl>
      </Card>
      <Card>
        <CardHeader title={t('progress.badges')} />
        <ul className="grid grid-cols-2 gap-2">
          {BADGES.map((b) => {
            const earned = stats.badges[b];
            return (
              <li
                key={b}
                className={`flex items-center gap-2 rounded-input border p-3 ${earned ? 'border-primary/30 bg-primary-subtle' : 'border-line'}`}
              >
                {earned ? (
                  <Award className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                ) : (
                  <Lock className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} />
                )}
                <span className="min-w-0">
                  <span className="block text-small text-ink">{t(`progress.badge.${b}`)}</span>
                  <span className="block text-caption text-muted">{earned ? t('progress.earned') : t('progress.locked')}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
