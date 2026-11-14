import { db } from '../lib/admin';
import { localDate, daysBefore } from '../lib/time';

export interface UserContext {
  profile: Record<string, unknown> | null;
  today: string;
  logs: Record<string, Array<Record<string, unknown>>>;
}

const LOG_COLLECTIONS = ['foodLogs', 'waterLogs', 'workoutLogs', 'weightLogs', 'sleepLogs', 'stepLogs'] as const;

/** Loads the user's profile and the last 7 days of logs from Firestore (never from the client). */
export async function loadUserContext(uid: string, nowMs = Date.now()): Promise<UserContext> {
  const userSnap = await db().doc(`users/${uid}`).get();
  const profile = userSnap.exists ? (userSnap.data() as Record<string, unknown>) : null;
  const tz = (profile?.timezone as string) || 'UTC';
  const today = localDate(nowMs, tz);
  const from = daysBefore(today, 6);
  const logs: UserContext['logs'] = {};
  await Promise.all(
    LOG_COLLECTIONS.map(async (c) => {
      const q = await db().collection(`users/${uid}/${c}`).where('date', '>=', from).where('date', '<=', today).limit(200).get();
      logs[c] = q.docs.map((d) => d.data()).filter((d) => d.status !== 'deleted');
    }),
  );
  return { profile, today, logs };
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Turns the context into a compact factual summary for the model. Pure; unit tested. */
export function summarizeContext(ctx: UserContext): string {
  const p = ctx.profile;
  if (!p) return 'No profile yet. The user has not finished onboarding.';
  const lines: string[] = [];
  const t = (p.targets ?? {}) as Record<string, unknown>;
  lines.push(`Name: ${p.name ?? 'unknown'}. Goal: ${p.goal ?? 'unknown'}. Diet: ${p.dietType ?? 'unknown'}. Country: ${p.country ?? 'unknown'}.`);
  if (t.calories) lines.push(`Daily targets: ${t.calories} kcal, protein ${t.proteinG} g, carbs ${t.carbsG} g, fat ${t.fatG} g, fiber ${t.fiberG} g, water ${t.waterMl} ml.`);
  const byDay = (c: string, field: string) => {
    const m = new Map<string, number>();
    for (const r of ctx.logs[c] ?? []) m.set(String(r.date), (m.get(String(r.date)) ?? 0) + num(r[field]));
    return m;
  };
  const food = byDay('foodLogs', 'calories');
  const protein = byDay('foodLogs', 'proteinG');
  const water = byDay('waterLogs', 'ml');
  lines.push(`Today (${ctx.today}): ${food.get(ctx.today) ?? 0} kcal eaten, ${protein.get(ctx.today) ?? 0} g protein, ${water.get(ctx.today) ?? 0} ml water.`);
  if (food.size) {
    const days = [...food.keys()].sort();
    lines.push(`Food logged on ${days.length} of the last 7 days. Average ${Math.round([...food.values()].reduce((a, b) => a + b, 0) / days.length)} kcal on logged days.`);
  } else {
    lines.push('No food logged in the last 7 days.');
  }
  const workouts = ctx.logs.workoutLogs ?? [];
  lines.push(workouts.length ? `Workouts in the last 7 days: ${workouts.length}, total ${workouts.reduce((a, w) => a + num(w.durationMin), 0)} minutes.` : 'No workouts logged in the last 7 days.');
  const weights = [...(ctx.logs.weightLogs ?? [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (weights.length) lines.push(`Latest weight: ${num(weights[weights.length - 1].kg)} kg on ${weights[weights.length - 1].date}.`);
  const sleep = ctx.logs.sleepLogs ?? [];
  if (sleep.length) lines.push(`Average sleep over ${sleep.length} logged nights: ${(sleep.reduce((a, s) => a + num(s.durationMin), 0) / sleep.length / 60).toFixed(1)} h.`);
  return lines.join('\n');
}
