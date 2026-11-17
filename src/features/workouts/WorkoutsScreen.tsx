import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { Play, Pause, Plus, Trash2, Timer, Search, Lock, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, EmptyState, IconButton, Input, Sheet, Skeleton, Tabs, Badge, PlanBadge, toast } from '../../components/ui';
import { db } from '../../lib/firebase';
import { useSession } from '../../data/session';
import { useAllRecords } from '../../data/useRecords';
import { createRecord, softDelete, restore } from '../../data/records';
import { useFormat } from '../../lib/hooks';
import { normalize } from '../../domain/nutrition';
import { estimateSessionKcal } from '../../domain/workouts';
import type { WorkoutLog } from '../../domain/models';
import { useWorkoutSession, elapsedMs, formatClock } from './session';

export interface Exercise {
  id: string;
  name: string;
  names?: Record<string, string>;
  category: string;
  muscles: string[];
  equipment: string;
  level: string;
  instructions: string;
  instructionsI18n?: Record<string, string>;
  trackBy: 'reps' | 'time';
}

let cache: Exercise[] | null = null;
function useExercises() {
  const [state, setState] = useState<{ rows: Exercise[]; loading: boolean; error: boolean }>({
    rows: cache ?? [],
    loading: !cache,
    error: false,
  });
  useEffect(() => {
    if (cache) return;
    getDocs(query(collection(db(), 'exercises'), limit(500)))
      .then((s) => {
        cache = s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Exercise, 'id'>) })).sort((a, b) => a.name.localeCompare(b.name));
        setState({ rows: cache, loading: false, error: false });
      })
      .catch(() => setState({ rows: [], loading: false, error: true }));
  }, []);
  return state;
}

const CATEGORIES = ['all', 'strength', 'bodyweight', 'cardio', 'hiit', 'walking', 'running', 'cycling', 'yoga', 'stretching'];

export default function WorkoutsScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'session' | 'library' | 'history'>('session');
  const active = useWorkoutSession((s) => s.active);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-display text-ink">{t('workouts.title')}</h1>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'session', label: active ? t('workouts.inProgress') : t('workouts.start') },
          { id: 'library', label: t('workouts.library') },
          { id: 'history', label: t('workouts.history') },
        ]}
      />
      {tab === 'session' && <SessionPanel />}
      {tab === 'library' && <LibraryPanel />}
      {tab === 'history' && <HistoryPanel />}
    </div>
  );
}

function ExercisePicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (e: Exercise) => void }) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onClose={onClose} closeLabel={t('common.close')} title={t('workouts.addExercise')}>
      <ExerciseList
        onPick={(e) => {
          onPick(e);
          onClose();
        }}
      />
    </Sheet>
  );
}

function ExerciseList({ onPick }: { onPick?: (e: Exercise) => void }) {
  const { t, i18n } = useTranslation();
  const { rows, loading, error } = useExercises();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [detail, setDetail] = useState<Exercise | null>(null);
  const list = useMemo(() => {
    const nq = normalize(q);
    return rows.filter(
      (e) => (cat === 'all' || e.category === cat) && (!nq || normalize([e.name, ...Object.values(e.names ?? {})].join(' ')).includes(nq)),
    );
  }, [rows, q, cat]);
  if (loading) return <Skeleton className="h-40" />;
  if (error) return <p className="text-small text-danger">{t('errors.loadFailed')}</p>;
  if (!rows.length) return <EmptyState title={t('workouts.libraryEmpty')} />;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
          strokeWidth={1.75}
        />
        <input
          type="search"
          aria-label={t('workouts.searchExercises')}
          placeholder={t('workouts.searchExercises')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 w-full rounded-input border border-line bg-surface ps-11 pe-3 text-body text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cat === c}
            onClick={() => setCat(c)}
            className={`h-9 shrink-0 rounded-full border px-3 text-small ${cat === c ? 'border-primary bg-primary-subtle text-primary' : 'border-line text-muted'}`}
          >
            {c === 'all' ? t('workouts.all') : t(`workoutCategory.${c}`, { defaultValue: c })}
          </button>
        ))}
      </div>
      <ul className="flex flex-col divide-y divide-line">
        {list.map((e) => (
          <li key={e.id} className="flex items-center gap-2 py-2.5">
            <button type="button" className="min-w-0 flex-1 text-start" onClick={() => setDetail(e)}>
              <span className="block truncate text-body text-ink">{e.names?.[i18n.language] ?? e.name}</span>
              <span className="block truncate text-caption text-muted">
                {t(`workoutCategory.${e.category}`, { defaultValue: e.category })} · {e.muscles.join(', ')}
              </span>
            </button>
            {onPick && (
              <IconButton label={t('workouts.addExercise')} onClick={() => onPick(e)}>
                <Plus className="h-5 w-5 text-primary" strokeWidth={1.75} />
              </IconButton>
            )}
          </li>
        ))}
      </ul>
      <Sheet
        open={!!detail}
        onClose={() => setDetail(null)}
        closeLabel={t('common.close')}
        title={detail ? (detail.names?.[i18n.language] ?? detail.name) : ''}
      >
        {detail && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="primary">{t(`workoutCategory.${detail.category}`, { defaultValue: detail.category })}</Badge>
              <Badge>{t(`experience.${detail.level}`, { defaultValue: detail.level })}</Badge>
              <Badge>{t(`equipment.${detail.equipment}`, { defaultValue: detail.equipment })}</Badge>
            </div>
            <p className="text-small font-medium text-ink">{t('workouts.muscles')}</p>
            <p className="text-small text-muted">{detail.muscles.join(', ')}</p>
            <p className="text-small font-medium text-ink">{t('workouts.howTo')}</p>
            <p className="text-body text-ink">{detail.instructionsI18n?.[i18n.language] ?? detail.instructions}</p>
            {onPick && (
              <Button
                onClick={() => {
                  onPick(detail);
                  setDetail(null);
                }}
              >
                {t('workouts.addExercise')}
              </Button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function LibraryPanel() {
  return (
    <Card>
      <ExerciseList />
    </Card>
  );
}

function RestTimer() {
  const { t } = useTranslation();
  const restEndsAt = useWorkoutSession((s) => s.restEndsAt);
  const clearRest = useWorkoutSession((s) => s.clearRest);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!restEndsAt) return;
    const id = setInterval(() => {
      tick((x) => x + 1);
      if (Date.now() >= restEndsAt) {
        clearRest();
        if ('vibrate' in navigator) navigator.vibrate?.(200);
      }
    }, 500);
    return () => clearInterval(id);
  }, [restEndsAt, clearRest]);
  if (!restEndsAt) return null;
  return (
    <div role="timer" className="flex items-center justify-between rounded-input bg-sage px-4 py-3">
      <span className="flex items-center gap-2 text-small text-ink">
        <Timer className="h-4 w-4" strokeWidth={1.75} />
        {t('workouts.rest')}
      </span>
      <span className="text-title text-ink tabular-nums">{formatClock(Math.max(0, restEndsAt - Date.now()))}</span>
      <Button size="sm" variant="ghost" onClick={clearRest}>
        {t('common.done')}
      </Button>
    </div>
  );
}

function SessionPanel() {
  const { t, i18n } = useTranslation();
  const { n } = useFormat();
  const profile = useSession((s) => s.profile)!;
  const plan = useSession((s) => s.plan);
  const s = useWorkoutSession();
  const navigate = useNavigate();
  const [picker, setPicker] = useState(false);
  const [name, setName] = useState('');
  const [, tick] = useState(0);
  useEffect(() => {
    if (!s.active) return;
    const id = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [s.active]);

  if (!s.active) {
    return (
      <>
        <Card className="flex flex-col gap-3">
          <Input
            label={t('workouts.workoutName')}
            value={name}
            placeholder={t('workouts.title')}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            icon={<Play className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            onClick={() => s.start(name.trim() || t('workouts.title'))}
          >
            {t('workouts.start')}
          </Button>
        </Card>
        <Card onPress={() => navigate('/plans?highlight=pro')} className="flex items-center gap-3">
          <Lock className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <p className="text-body font-medium text-ink">{t('workouts.generator')}</p>
            <p className="text-small text-muted">{plan === 'pro' ? t('workouts.generatorSoon') : t('workouts.generatorLocked')}</p>
          </div>
          {plan !== 'pro' && <PlanBadge plan="pro" label={t('plans.pro')} ariaLabel={t('plans.seePlans')} />}
        </Card>
        <p className="text-center text-caption text-muted">{t('workouts.trainers')}</p>
      </>
    );
  }

  const a = s.active;
  const minutes = elapsedMs(a) / 60000;
  const setsByCat: Record<string, number> = {};
  for (const e of a.exercises) setsByCat[e.category] = (setsByCat[e.category] ?? 0) + e.sets.filter((x) => x.done).length;
  const kcal = estimateSessionKcal(setsByCat, minutes, profile.weightKg);

  const finish = async () => {
    const sets = a.exercises.flatMap((e) =>
      e.sets.filter((x) => x.done).map(({ reps, weightKg, seconds }) => ({ exerciseId: e.exerciseId, reps, weightKg, seconds })),
    );
    if (!a.exercises.length) {
      toast(t('workouts.noExercises'), 'error');
      return;
    }
    await createRecord('workoutLogs', {
      name: a.name,
      durationMin: Math.round(minutes * 10) / 10,
      sets,
      caloriesEst: kcal,
      exercises: a.exercises.map((e) => ({ exerciseId: e.exerciseId, name: e.name, category: e.category })),
    });
    s.end();
    toast(t('workouts.saved'));
  };

  return (
    <>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-title text-ink">{a.name}</p>
            <p className="text-small text-muted">
              {t('workouts.caloriesEst')}: ~{n(kcal)} {t('common.kcal')}
            </p>
          </div>
          <span className="text-display text-ink tabular-nums" role="timer">
            {formatClock(elapsedMs(a))}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            icon={
              a.pausedAt ? (
                <Play className="h-[18px] w-[18px]" strokeWidth={1.75} />
              ) : (
                <Pause className="h-[18px] w-[18px]" strokeWidth={1.75} />
              )
            }
            onClick={s.togglePause}
          >
            {a.pausedAt ? t('common.resume') : t('common.pause')}
          </Button>
          <Button variant="secondary" icon={<Timer className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => s.startRest(90)}>
            {t('workouts.restTimer')}
          </Button>
        </div>
        <RestTimer />
        <p className="text-caption text-muted">{t('workouts.estimateNote')}</p>
      </Card>

      {a.exercises.map((e, i) => (
        <Card key={`${e.exerciseId}-${i}`}>
          <CardHeader
            title={e.name}
            action={
              <IconButton label={t('common.delete')} onClick={() => s.removeExercise(i)}>
                <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </IconButton>
            }
          />
          <div className="flex flex-col gap-2">
            {e.sets.map((set, j) => (
              <div key={j} className="grid grid-cols-[auto_1fr_1fr_auto] items-end gap-2">
                <span className="pb-3 text-caption text-muted">{t('workouts.set', { n: j + 1 })}</span>
                {e.category === 'cardio' ||
                e.category === 'yoga' ||
                e.category === 'stretching' ||
                e.category === 'walking' ||
                e.category === 'running' ||
                e.category === 'cycling' ? (
                  <Input
                    aria-label={t('workouts.seconds')}
                    placeholder={t('workouts.seconds')}
                    inputMode="numeric"
                    value={set.seconds ?? ''}
                    onChange={(ev) => s.updateSet(i, j, { seconds: ev.target.value === '' ? undefined : Number(ev.target.value) })}
                  />
                ) : (
                  <Input
                    aria-label={t('workouts.reps')}
                    placeholder={t('workouts.reps')}
                    inputMode="numeric"
                    value={set.reps ?? ''}
                    onChange={(ev) => s.updateSet(i, j, { reps: ev.target.value === '' ? undefined : Number(ev.target.value) })}
                  />
                )}
                <Input
                  aria-label={t('workouts.weightKg')}
                  placeholder={t('workouts.weightKg')}
                  inputMode="decimal"
                  value={set.weightKg ?? ''}
                  onChange={(ev) => s.updateSet(i, j, { weightKg: ev.target.value === '' ? undefined : Number(ev.target.value) })}
                />
                <button
                  type="button"
                  aria-pressed={set.done}
                  aria-label={t('common.done')}
                  onClick={() => {
                    s.updateSet(i, j, { done: !set.done });
                    if (!set.done) s.startRest(60);
                  }}
                  className={`mb-0.5 h-11 w-11 rounded-input border text-small font-semibold ${set.done ? 'border-primary bg-primary text-on-primary' : 'border-line text-muted'}`}
                >
                  ✓
                </button>
              </div>
            ))}
            <Button size="sm" variant="ghost" icon={<Plus className="h-4 w-4" strokeWidth={1.75} />} onClick={() => s.addSet(i)}>
              {t('workouts.addSet')}
            </Button>
          </div>
        </Card>
      ))}

      <Button variant="secondary" icon={<Dumbbell className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => setPicker(true)}>
        {t('workouts.addExercise')}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="destructive" onClick={s.end}>
          {t('workouts.discard')}
        </Button>
        <Button onClick={() => void finish()}>{t('workouts.finish')}</Button>
      </div>
      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(e) => s.addExercise({ exerciseId: e.id, name: e.names?.[i18n.language] ?? e.name, category: e.category })}
      />
    </>
  );
}

function HistoryPanel() {
  const { t } = useTranslation();
  const { n, date } = useFormat();
  const logs = useAllRecords<WorkoutLog & { exercises?: Array<{ name: string }> }>('workoutLogs', 100);
  if (logs.loading) return <Skeleton className="h-32" />;
  if (!logs.rows.length) return <EmptyState icon={<Dumbbell className="h-6 w-6" strokeWidth={1.75} />} title={t('workouts.empty')} />;
  return (
    <ul className="flex flex-col gap-2">
      {logs.rows.map((w) => (
        <li key={w.id}>
          <Card padding="sm" className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium text-ink">{w.name}</p>
              <p className="truncate text-caption text-muted">
                {date(w.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {n(w.durationMin)} {t('common.min')} · ~
                {n(w.caloriesEst)} {t('common.kcal')}
              </p>
              {w.exercises && <p className="truncate text-caption text-muted">{w.exercises.map((e) => e.name).join(', ')}</p>}
            </div>
            <IconButton
              label={t('common.delete')}
              onClick={() => {
                void softDelete('workoutLogs', w.id);
                toast(t('common.deleted'), 'info', { label: t('common.undo'), onClick: () => void restore('workoutLogs', w.id) });
              }}
            >
              <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </IconButton>
          </Card>
        </li>
      ))}
    </ul>
  );
}
