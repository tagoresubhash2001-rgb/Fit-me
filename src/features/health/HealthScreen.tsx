import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, Lock } from 'lucide-react';
import { Card, CardHeader, Skeleton, Tabs } from '../../components/ui';
import { useSession } from '../../data/session';
import { useRecords } from '../../data/useRecords';
import { useToday, useFormat } from '../../lib/hooks';
import { addDays, dateRange } from '../../domain/dates';
import { currentStreak, earnedBadges, type BadgeId } from '../../domain/progress';
import { sumNutrients } from '../../domain/nutrition';
import type { WaterLog, FoodLog, WorkoutLog, SleepLog } from '../../domain/models';
import { useUnits } from '../common/useUnits';
import { WaterPanel } from './WaterPanel';
import { WeightPanel, SleepPanel, StepsPanel } from './BodyPanels';
import { RangeFilter } from './RangeFilter';

type Tab = 'water' | 'weight' | 'sleep' | 'steps' | 'progress';
const TABS: Tab[] = ['water', 'weight', 'sleep', 'steps', 'progress'];

export default function HealthScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const tab = (TABS.includes(params.tab as Tab) ? params.tab : 'water') as Tab;
  return (
    <div className="stagger flex flex-col gap-4">
      <h1 className="card-enter text-display text-ink">{t('health.title')}</h1>
      <div className="card-enter flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs className="md:min-w-0 md:flex-1 xl:max-w-xl" ariaLabel={t('health.title')} value={tab} onChange={(v) => navigate({ pathname: `/health/${v}`, search: location.search }, { replace: true })} items={TABS.map((id) => ({ id, label: t(`health.tabs.${id}`) }))} />
        {tab !== 'progress' && <RangeFilter className="md:w-80 md:shrink-0" />}
      </div>
      <div key={tab} className="stagger page-enter grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-5">
        {tab === 'water' && <WaterPanel />}
        {tab === 'weight' && <WeightPanel />}
        {tab === 'sleep' && <SleepPanel />}
        {tab === 'steps' && <StepsPanel />}
        {tab === 'progress' && <ProgressPanel />}
      </div>
    </div>
  );
}

const BADGES: BadgeId[] = ['first_log', 'meals_week', 'hydration_7', 'workouts_5', 'sleep_routine', 'consistency_30'];

function ProgressPanel() {
  const { t } = useTranslation();
  const { n } = useFormat();
  const { vol } = useUnits();
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
            <dd className="text-body font-semibold text-ink tabular-nums">{vol(stats.avgWater)}</dd>
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
                  <Award className="h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
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
