import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Droplet, Dumbbell, Lock, Moon, Utensils } from 'lucide-react';
import { Button, Card, EmptyState, IconButton, Input, ListDetail, PlanBadge, Sheet, Skeleton, Tabs, cn, toast } from '../../components/ui';
import { useSession } from '../../data/session';
import { useRecords } from '../../data/useRecords';
import { updateRecord } from '../../data/records';
import { useFormat, useToday } from '../../lib/hooks';
import { useMediaQuery } from '../../lib/breakpoints';
import { addDays, dateRange, startOfWeek } from '../../domain/dates';
import { planAllows } from '../../domain/plans';
import type { FoodLog, SleepLog, WaterLog, WorkoutLog } from '../../domain/models';
import { useUnits } from '../common/useUnits';

type View = 'week' | 'month';

interface DaySummary {
  kcal: number;
  waterMl: number;
  sleepMin: number;
  workouts: WorkoutLog[];
}

const monthStart = (d: string) => `${d.slice(0, 7)}-01`;
const addMonths = (d: string, n: number) => {
  const dt = new Date(`${monthStart(d)}T00:00:00Z`);
  dt.setUTCMonth(dt.getUTCMonth() + n);
  return dt.toISOString().slice(0, 10);
};

/**
 * Planner (PRD module 8). Week and month calendars show the user's real logged days (food, water,
 * workouts, sleep); workouts can be dragged to another day. Planning ahead (adding activities,
 * the AI auto-planner) is Pro and arrives in Phase 4; nothing here is sample data.
 */
export default function PlannerScreen() {
  const { t } = useTranslation();
  const { date } = useFormat();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile)!;
  const plan = useSession((s) => s.plan);
  const today = useToday();
  const [params, setParams] = useSearchParams();
  const view: View = params.get('view') === 'month' ? 'month' : 'week';
  const anchor = params.get('d') ?? today;
  const [selected, setSelected] = useState(today);
  const [moving, setMoving] = useState<WorkoutLog | null>(null);
  const split = useMediaQuery('(min-width: 1024px)');
  const set = (p: Record<string, string>) => setParams({ view, d: anchor, ...p }, { replace: true });

  // Visible days: one week, or the month padded to whole weeks.
  const days = useMemo(() => {
    if (view === 'week') {
      const s = startOfWeek(anchor, profile.weekStart);
      return dateRange(s, addDays(s, 6));
    }
    const first = startOfWeek(monthStart(anchor), profile.weekStart);
    const last = addDays(addMonths(anchor, 1), -1);
    const end = addDays(startOfWeek(last, profile.weekStart), 6);
    return dateRange(first, end);
  }, [view, anchor, profile.weekStart]);
  const from = days[0];
  const to = days[days.length - 1] > today ? today : days[days.length - 1];

  const food = useRecords<FoodLog>('foodLogs', from, to);
  const water = useRecords<WaterLog>('waterLogs', from, to);
  const workouts = useRecords<WorkoutLog>('workoutLogs', from, to);
  const sleep = useRecords<SleepLog>('sleepLogs', from, to);
  const loading = food.loading || water.loading || workouts.loading;

  const byDay = useMemo(() => {
    const m = new Map<string, DaySummary>();
    for (const d of days) m.set(d, { kcal: 0, waterMl: 0, sleepMin: 0, workouts: [] });
    for (const f of food.rows) {
      const x = m.get(f.date);
      if (x) x.kcal += f.nutrients.calories;
    }
    for (const w of water.rows) {
      const x = m.get(w.date);
      if (x) x.waterMl += w.ml;
    }
    for (const sl of sleep.rows) {
      const x = m.get(sl.date);
      if (x) x.sleepMin = Math.max(x.sleepMin, sl.durationMin);
    }
    for (const w of workouts.rows) m.get(w.date)?.workouts.push(w);
    return m;
  }, [days, food.rows, water.rows, sleep.rows, workouts.rows]);

  const move = async (w: WorkoutLog, to: string) => {
    if (to === w.date || to > today) return;
    const from = w.date;
    await updateRecord('workoutLogs', w.id, { date: to });
    toast(t('planner.moved', { name: w.name, day: date(to, { weekday: 'short', day: 'numeric', month: 'short' }) }), 'success', {
      label: t('common.undo'),
      onClick: () => void updateRecord('workoutLogs', w.id, { date: from }),
    });
  };

  const step = (dir: 1 | -1) => set({ d: view === 'week' ? addDays(anchor, 7 * dir) : addMonths(anchor, dir) });
  const title =
    view === 'week'
      ? `${date(days[0], { day: 'numeric', month: 'short' })} – ${date(days[6], { day: 'numeric', month: 'short', year: 'numeric' })}`
      : date(monthStart(anchor), { month: 'long', year: 'numeric' });
  const canNext = (view === 'week' ? addDays(days[0], 7) : addMonths(anchor, 1)) <= today;
  const weekdays = days.slice(0, 7).map((d) => date(d, { weekday: 'short' }));

  const calendar = (
    <Card className="flex flex-col gap-3" static>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <IconButton label={t('planner.prev')} onClick={() => step(-1)}>
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" strokeWidth={1.75} />
          </IconButton>
          <h2 className="min-w-0 text-title text-ink" aria-live="polite">
            {title}
          </h2>
          <IconButton label={t('planner.next')} disabled={!canNext} onClick={() => step(1)}>
            <ChevronRight className="h-5 w-5 rtl:rotate-180" strokeWidth={1.75} />
          </IconButton>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            set({ d: today });
            setSelected(today);
          }}
        >
          {t('common.today')}
        </Button>
      </div>
      <div role="grid" aria-label={title} className="grid grid-cols-7 gap-1 md:gap-2">
        <div role="row" className="contents">
          {weekdays.map((w, i) => (
            <div key={i} role="columnheader" className="truncate text-center text-caption text-muted">
              {w}
            </div>
          ))}
        </div>
        {days.map((d) => {
          const s = byDay.get(d)!;
          const out = view === 'month' && d.slice(0, 7) !== anchor.slice(0, 7);
          const future = d > today;
          const waterGoal = profile.waterTargetMl ?? profile.targets.waterMl;
          return (
            <div
              key={d}
              role="gridcell"
              aria-selected={selected === d}
              onDragOver={(e) => !future && e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('text/workout');
                const w = workouts.rows.find((x) => x.id === id);
                if (w && !future) void move(w, d);
              }}
              className={cn(
                'flex min-w-0 flex-col rounded-input border p-1 transition-colors md:p-2',
                view === 'week' ? 'min-h-28 md:min-h-44' : 'min-h-14 md:min-h-24',
                selected === d ? 'border-primary bg-primary-subtle/60' : 'border-line hover:bg-raised',
                (out || future) && 'opacity-50',
              )}
            >
              <button
                type="button"
                disabled={future}
                onClick={() => setSelected(d)}
                aria-label={date(d, { weekday: 'long', day: 'numeric', month: 'long' })}
                className={cn(
                  'self-start rounded-full px-1.5 text-small font-semibold tabular-nums',
                  d === today ? 'bg-primary text-on-primary' : 'text-ink',
                )}
              >
                {date(d, { day: 'numeric' })}
              </button>
              {!future && !loading && (
                <div className="mt-1 flex min-w-0 flex-col gap-1">
                  {view === 'week' ? (
                    <>
                      {s.kcal > 0 && (
                        <span className="flex items-center gap-1 truncate text-caption text-muted">
                          <Utensils className="hidden h-3 w-3 shrink-0 md:block" strokeWidth={2} />
                          {Math.round(s.kcal)}
                        </span>
                      )}
                      {s.waterMl > 0 && (
                        <span
                          className={cn('h-1.5 rounded-full bg-water', s.waterMl < waterGoal && 'opacity-50')}
                          style={{ width: `${Math.min(100, (s.waterMl / waterGoal) * 100)}%` }}
                          aria-hidden
                        />
                      )}
                      {s.workouts.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/workout', w.id)}
                          onClick={() => setMoving(w)}
                          title={t('planner.dragHint')}
                          className="truncate rounded-[8px] bg-primary px-1.5 py-0.5 text-start text-caption font-medium text-on-primary hover:bg-primary-pressed"
                        >
                          {w.name}
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-1" aria-hidden>
                      {s.kcal > 0 && <span className="h-2 w-2 rounded-full bg-primary" />}
                      {s.waterMl >= waterGoal && <span className="h-2 w-2 rounded-full bg-water" />}
                      {s.workouts.length > 0 && <span className="h-2 w-2 rounded-full bg-accent-fill" />}
                      {s.sleepMin > 0 && <span className="h-2 w-2 rounded-full bg-sleep" />}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted" aria-label={t('planner.legend')}>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
          {t('planner.food')}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-water" aria-hidden />
          {t('planner.waterGoal')}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-fill" aria-hidden />
          {t('planner.workout')}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sleep" aria-hidden />
          {t('planner.sleep')}
        </li>
      </ul>
      <p className="hidden text-caption text-muted md:block">{t('planner.dragHint')}</p>
    </Card>
  );

  const dayPanel = <DayPanel day={selected} summary={byDay.get(selected)} loading={loading} onMove={setMoving} />;

  return (
    <div className="stagger flex flex-col gap-4">
      <div className="card-enter flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display text-ink">{t('planner.title')}</h1>
        <Tabs
          className="w-56"
          ariaLabel={t('planner.view')}
          value={view}
          onChange={(v) => setParams({ view: v, d: anchor }, { replace: true })}
          items={[
            { id: 'week', label: t('planner.week') },
            { id: 'month', label: t('planner.month') },
          ]}
        />
      </div>
      <ListDetail
        detailLabel={t('planner.dayTitle')}
        list={
          <div className="flex flex-col gap-4">
            {calendar}
            {!split && dayPanel}
            <Card className="flex items-center gap-3">
              {planAllows(plan, 'pro') ? (
                <CalendarDays className="h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
              ) : (
                <Lock className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium text-ink">{t('planner.lockedTitle')}</p>
                <p className="text-small text-muted">{t('planner.lockedBody')}</p>
              </div>
              {plan !== 'pro' ? (
                <Button id="planner-upgrade" size="sm" onClick={() => navigate('/plans?highlight=pro')}>
                  {t('plans.seePlans')}
                </Button>
              ) : (
                <PlanBadge plan="pro" label={t('plans.pro')} ariaLabel={t('plans.pro')} />
              )}
            </Card>
          </div>
        }
        detail={split ? dayPanel : undefined}
      />
      <MoveSheet workout={moving} onClose={() => setMoving(null)} onMove={(w, d) => void move(w, d).then(() => setMoving(null))} />
    </div>
  );
}

function DayPanel({
  day,
  summary,
  loading,
  onMove,
}: {
  day: string;
  summary?: DaySummary;
  loading: boolean;
  onMove: (w: WorkoutLog) => void;
}) {
  const { t } = useTranslation();
  const { date, n } = useFormat();
  const { vol } = useUnits();
  const navigate = useNavigate();
  const empty = summary && !summary.kcal && !summary.waterMl && !summary.sleepMin && !summary.workouts.length;
  return (
    <Card id="planner-day" className="flex flex-col gap-3" static>
      <h2 className="text-title text-ink">{date(day, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
      {loading || !summary ? (
        <Skeleton className="h-24" />
      ) : empty ? (
        <EmptyState title={t('planner.noData')} />
      ) : (
        <dl className="flex flex-col divide-y divide-line">
          <button
            type="button"
            onClick={() => navigate(`/food?date=${day}`)}
            className="flex items-center justify-between gap-3 py-2.5 text-start hover:bg-raised"
          >
            <dt className="flex items-center gap-2 text-body text-ink">
              <Utensils className="h-4 w-4 text-primary-text" strokeWidth={1.75} />
              {t('planner.food')}
            </dt>
            <dd className="text-body font-semibold text-ink tabular-nums">
              {n(summary.kcal)} {t('common.kcal')}
            </dd>
          </button>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="flex items-center gap-2 text-body text-ink">
              <Droplet className="h-4 w-4 text-water" strokeWidth={1.75} />
              {t('water.title')}
            </dt>
            <dd className="text-body font-semibold text-ink tabular-nums">{vol(summary.waterMl)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="flex items-center gap-2 text-body text-ink">
              <Moon className="h-4 w-4 text-sleep" strokeWidth={1.75} />
              {t('sleep.title')}
            </dt>
            <dd className="text-body font-semibold text-ink tabular-nums">
              {summary.sleepMin ? `${n(summary.sleepMin / 60, 1)} ${t('common.h')}` : '—'}
            </dd>
          </div>
          {summary.workouts.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-3 py-2.5">
              <dt className="flex min-w-0 items-center gap-2 text-body text-ink">
                <Dumbbell className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
                <span className="truncate">{w.name}</span>
              </dt>
              <dd className="flex items-center gap-2">
                <span className="text-small text-muted tabular-nums">
                  {n(w.durationMin)} {t('common.min')}
                </span>
                <Button size="sm" variant="ghost" onClick={() => onMove(w)}>
                  {t('planner.move')}
                </Button>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}

/** Keyboard and touch alternative to drag and drop: pick the new day. */
function MoveSheet({
  workout,
  onClose,
  onMove,
}: {
  workout: WorkoutLog | null;
  onClose: () => void;
  onMove: (w: WorkoutLog, d: string) => void;
}) {
  const { t } = useTranslation();
  const today = useToday();
  const [d, setD] = useState('');
  if (!workout) return null;
  const value = d || workout.date;
  return (
    <Sheet
      open
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('planner.moveWorkout', { name: workout.name })}
      footer={
        <Button fullWidth disabled={value === workout.date} onClick={() => onMove(workout, value)}>
          {t('planner.move')}
        </Button>
      }
    >
      <Input
        id="move-date"
        label={t('planner.moveTo')}
        type="date"
        value={value}
        max={today}
        onChange={(e) => e.target.value && setD(e.target.value)}
      />
    </Sheet>
  );
}
