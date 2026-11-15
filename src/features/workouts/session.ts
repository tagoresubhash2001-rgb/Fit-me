import { create } from 'zustand';

export interface SessionSet {
  reps?: number;
  weightKg?: number;
  seconds?: number;
  done: boolean;
}
export interface SessionExercise {
  exerciseId: string;
  name: string;
  category: string;
  sets: SessionSet[];
}
interface WorkoutSessionState {
  active: { name: string; startedAt: number; pausedMs: number; pausedAt: number | null; exercises: SessionExercise[] } | null;
  restEndsAt: number | null;
  start: (name: string) => void;
  addExercise: (e: Omit<SessionExercise, 'sets'>) => void;
  addSet: (i: number) => void;
  updateSet: (i: number, j: number, patch: Partial<SessionSet>) => void;
  removeExercise: (i: number) => void;
  togglePause: () => void;
  startRest: (seconds: number) => void;
  clearRest: () => void;
  end: () => void;
}

const KEY = 'fit_me_active_workout';
const load = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
};

/** The in-progress workout (kept in session storage so a reload does not lose it). Saved to Firestore on finish. */
export const useWorkoutSession = create<WorkoutSessionState>((set, get) => {
  const persist = () => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(get().active));
    } catch {
      /* ignore */
    }
  };
  const mut = (fn: (a: NonNullable<WorkoutSessionState['active']>) => void) => {
    const a = get().active;
    if (!a) return;
    const copy = structuredClone(a);
    fn(copy);
    set({ active: copy });
    persist();
  };
  return {
    active: load(),
    restEndsAt: null,
    start: (name) => {
      set({ active: { name, startedAt: Date.now(), pausedMs: 0, pausedAt: null, exercises: [] } });
      persist();
    },
    addExercise: (e) => mut((a) => a.exercises.push({ ...e, sets: [{ done: false }] })),
    addSet: (i) => mut((a) => a.exercises[i].sets.push({ ...a.exercises[i].sets.at(-1), done: false })),
    updateSet: (i, j, patch) => mut((a) => Object.assign(a.exercises[i].sets[j], patch)),
    removeExercise: (i) => mut((a) => a.exercises.splice(i, 1)),
    togglePause: () =>
      mut((a) => {
        if (a.pausedAt) {
          a.pausedMs += Date.now() - a.pausedAt;
          a.pausedAt = null;
        } else a.pausedAt = Date.now();
      }),
    startRest: (seconds) => set({ restEndsAt: Date.now() + seconds * 1000 }),
    clearRest: () => set({ restEndsAt: null }),
    end: () => {
      set({ active: null, restEndsAt: null });
      persist();
    },
  };
});

export function elapsedMs(a: NonNullable<WorkoutSessionState['active']>, now = Date.now()): number {
  const pausedNow = a.pausedAt ? now - a.pausedAt : 0;
  return Math.max(0, now - a.startedAt - a.pausedMs - pausedNow);
}

export function formatClock(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}
