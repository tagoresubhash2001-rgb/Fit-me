import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Droplet, Footprints, Dumbbell, Moon, Scale, CalendarDays, Flame, ChevronRight } from 'lucide-react';
import { Button, Card, ProgressRing, ProgressBar, Skeleton, PlanBadge, CountUp } from '../../components/ui';
import { useSession } from '../../data/session';
import { useRecords } from '../../data/useRecords';
import { useToday, useFormat, nowMinutes } from '../../lib/hooks';
import { sumNutrients } from '../../domain/nutrition';
import { addDays } from '../../domain/dates';
import { useUnits } from '../common/useUnits';
import { currentStreak } from '../../domain/progress';
import type { FoodLog, WaterLog, WorkoutLog, SleepLog, WeightLog, StepLog } from '../../domain/models';
import { addWater } from '../health/waterActions';

function greetingKey(m: number) {
  if (m < 12 * 60) return 'greeting.morning';
  if (m < 17 * 60) return 'greeting.afternoon';
  return 'greeting.evening';
}

function StatCard({
  icon,
  title,
  value,
  sub,
  onPress,
  children,
  id,
}: {
  icon: React.ReactNode;
  title: string;
  value?: React.ReactNode;
  sub?: React.ReactNode;
  onPress: () => void;
  children?: React.ReactNode;
  id?: string;
}) {
  return (
    <Card onPress={onPress} className="flex min-w-0 flex-col gap-2" id={id}>
      <div className="flex items-center justify-between gap-2 text-muted">
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-primary">{icon}</span>
          <span className="truncate text-small font-medium text-ink">{title}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 rtl:rotate-180" strokeWidth={1.75} />
      </div>
      {value !== undefined && <div className="text-title text-ink tabular-nums">{value}</div>}
      {sub && <div className="text-small text-muted">{sub}</div>}
      {children}
    </Card>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { n, lang } = useFormat();
  const { vol, wt } = useUnits();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile)!;
  const plan = useSession((s) => s.plan);
  const today = useToday();
  const weekAgo = addDays(today, -29);

  const food = useRecords<FoodLog>('foodLogs', weekAgo, today);
  const water = useRecords<WaterLog>('waterLogs', today, today);
  const workouts = useRecords<WorkoutLog>('workoutLogs', today, today);
  const sleep = useRecords<SleepLog>('sleepLogs', today, today);
  const weights = useRecords<WeightLog>('weightLogs', addDays(today, -365), today);
  const steps = useRecords<StepLog>('stepLogs', today, today);

  const todayFood = useMemo(() => food.rows.filter((r) => r.date === today), [food.rows, today]);
  const totals = sumNutrients(todayFood.map((r) => r.nutrients));
  const burned = workouts.rows.reduce((a, w) => a + w.caloriesEst, 0);
  const target = profile.targets.calories;
  const remaining = target - totals.calories + burned;
  const waterMl = water.rows.reduce((a, w) => a + w.ml, 0);
  const waterTarget = profile.waterTargetMl ?? profile.targets.waterMl;
  const stepCount = steps.rows.reduce((a, s) => Math.max(a, s.steps), 0);
  const stepTarget = profile.stepTarget ?? 8000;
  const lastSleep = [...sleep.rows].sort((a, b) => b.durationMin - a.durationMin)[0];
  const latestWeight = [...weights.rows].sort((a, b) => b.date.localeCompare(a.date))[0];
  const foodStreak = currentStreak(
    food.rows.map((r) => r.date),
    today,
  );
  const loading = food.loading || water.loading;
  const nothingToday = !loading && todayFood.length === 0 && waterMl === 0 && workouts.rows.length === 0;

  const macro = (key: 'proteinG' | 'carbsG' | 'fatG' | 'fiberG', label: string, targetG: number, color: string) => (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-caption text-muted">{label}</span>
        <span className="text-caption text-ink tabular-nums">
          {n(totals[key])}/{n(targetG)} {t('common.g')}
        </span>
      </div>
      <ProgressBar value={totals[key]} max={targetG} colorClass={color} label={label} />
    </div>
  );

  return (
    <div className="stagger flex flex-col gap-4">
      <div className="card-enter">
        <h1 className="text-display text-ink">{t(greetingKey(nowMinutes()), { name: profile.name })}</h1>
        <p className="text-small text-muted">
          {new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
            new Date(`${today}T00:00:00Z`),
          )}
        </p>
      </div>

      {nothingToday && (
        <Card tone="sage">
          <p className="text-small text-ink">{t('home.emptyDay')}</p>
        </Card>
      )}

      <Card id="card-calories">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-title text-ink">{t('home.caloriesCard')}</h2>
          <Button size="sm" onClick={() => navigate('/food')}>
            {t('home.logFood')}
          </Button>
        </div>
        {loading ? (
          <Skeleton className="h-36 w-full" />
        ) : (
          <div className="flex items-center gap-4">
            <ProgressRing
              value={totals.calories}
              max={target + burned}
              size={128}
              stroke={11}
              label={t('home.caloriesCard')}
              colorClass={remaining < 0 ? 'stroke-accent-fill' : 'stroke-primary'}
            >
              <span className="text-title text-ink">
                <CountUp value={Math.abs(remaining)} format={(v) => n(Math.round(v))} />
              </span>
              <span className="text-caption text-muted">{remaining >= 0 ? t('home.remaining') : t('home.overBy')}</span>
            </ProgressRing>
            <dl className="flex min-w-0 flex-1 flex-col gap-2">
              {(
                [
                  ['home.target', target],
                  ['home.eaten', totals.calories],
                  ['home.burned', burned],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2">
                  <dt className="truncate text-small text-muted">{t(k)}</dt>
                  <dd className="text-body font-semibold text-ink">
                    <CountUp value={v} format={(x) => n(Math.round(x))} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          {macro('proteinG', t('onboarding.protein'), profile.targets.proteinG, 'bg-protein')}
          {macro('carbsG', t('onboarding.carbs'), profile.targets.carbsG, 'bg-carbs')}
          {macro('fatG', t('onboarding.fat'), profile.targets.fatG, 'bg-fat')}
          {macro('fiberG', t('onboarding.fiber'), profile.targets.fiberG, 'bg-primary')}
        </div>
      </Card>

      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          id="card-water"
          icon={<Droplet className="h-[18px] w-[18px] text-water" strokeWidth={1.75} />}
          title={t('home.waterCard')}
          value={vol(waterMl)}
          sub={`${t('common.of')} ${vol(waterTarget)}`}
          onPress={() => navigate('/health/water')}
        >
          <ProgressBar value={waterMl} max={waterTarget} colorClass="bg-water" label={t('home.waterCard')} />
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              void addWater(250, t, vol);
            }}
          >
            {t('water.add', { amount: vol(250) })}
          </Button>
        </StatCard>

        <StatCard
          id="card-steps"
          icon={<Footprints className="h-[18px] w-[18px]" strokeWidth={1.75} />}
          title={t('home.stepsCard')}
          value={stepCount ? n(stepCount) : '—'}
          sub={stepCount ? `${t('common.of')} ${n(stepTarget)}` : t('home.noSteps')}
          onPress={() => navigate('/health/steps')}
        >
          {stepCount > 0 && <ProgressBar value={stepCount} max={stepTarget} label={t('home.stepsCard')} />}
        </StatCard>

        <StatCard
          icon={<Dumbbell className="h-[18px] w-[18px]" strokeWidth={1.75} />}
          title={t('home.workoutCard')}
          value={
            workouts.rows.length
              ? t('home.minutesToday', { count: Math.round(workouts.rows.reduce((a, w) => a + w.durationMin, 0)) })
              : undefined
          }
          sub={workouts.rows.length ? `${n(burned)} ${t('common.kcal')}` : t('home.noWorkout')}
          onPress={() => navigate('/workouts')}
        />

        <StatCard
          icon={<Moon className="h-[18px] w-[18px] text-sleep" strokeWidth={1.75} />}
          title={t('home.sleepCard')}
          value={lastSleep ? `${n(lastSleep.durationMin / 60, 1)} ${t('common.h')}` : undefined}
          sub={lastSleep ? undefined : t('home.noSleep')}
          onPress={() => navigate('/health/sleep')}
        />

        <StatCard
          icon={<Scale className="h-[18px] w-[18px]" strokeWidth={1.75} />}
          title={t('home.weightCard')}
          value={latestWeight ? wt(latestWeight.kg) : undefined}
          sub={latestWeight ? `${t('weight.target')}: ${wt(profile.targetWeightKg)}` : t('home.noWeight')}
          onPress={() => navigate('/health/weight')}
        />

        <StatCard
          icon={<Flame className="h-[18px] w-[18px] text-accent" strokeWidth={1.75} />}
          title={t('home.progressCard')}
          value={foodStreak ? t('progress.streak', { count: foodStreak }) : undefined}
          sub={foodStreak ? t('progress.streakFood') : t('progress.keepGoing')}
          onPress={() => navigate('/health/progress')}
        />
      </div>

      <Card onPress={() => navigate('/planner')} className="flex items-center gap-3">
        <CalendarDays className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium text-ink">{t('home.scheduleCard')}</p>
          <p className="text-small text-muted">{t('home.scheduleLocked')}</p>
        </div>
        {plan !== 'pro' && <PlanBadge plan="pro" label={t('plans.pro')} ariaLabel={t('plans.seePlans')} />}
      </Card>
    </div>
  );
}
