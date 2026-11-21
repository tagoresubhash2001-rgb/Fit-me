import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { HealthDataType } from '@capgo/capacitor-health';
import { db } from '../lib/firebase';
import { isNative, platform } from '../lib/platform';
import { upsertRecord, userTz } from './records';
import { currentUid } from './session';
import { addDays, localDate } from '../domain/dates';
import { byLocalDay, deviceRecordId, sleepNights, workoutName } from '../domain/healthSync';

/**
 * Apple Health (iOS, includes Apple Watch) and Health Connect (Android, includes Wear OS, Samsung Health,
 * Fitbit and other apps that write to it). Google Fit is not used: its APIs are deprecated and shutting down.
 * Browsers cannot read watch or health-platform data, so on the web this module reports "unavailable".
 */
export const HEALTH_TYPES: HealthDataType[] = ['steps', 'distance', 'calories', 'heartRate', 'sleep', 'workouts', 'weight'];

export type HealthPlatform = 'healthKit' | 'healthConnect';
export const healthAppName = (): HealthPlatform => (platform() === 'ios' ? 'healthKit' : 'healthConnect');

export interface HealthStatus {
  /** web: no health platform; missing: Health Connect not installed / not supported; ready: can connect. */
  availability: 'web' | 'missing' | 'ready';
  reason?: string;
  connected: boolean;
  granted: HealthDataType[];
  denied: HealthDataType[];
  lastSyncAt: number | null;
  lastSyncCounts?: Record<string, number>;
}

async function plugin() {
  const { Health } = await import('@capgo/capacitor-health');
  return Health;
}

const settingsRef = () => doc(db(), `users/${currentUid()}/settings/devices`);

async function saveState(patch: Record<string, unknown>) {
  await setDoc(settingsRef(), { health: { ...patch, app: healthAppName(), updatedAt: serverTimestamp() } }, { merge: true });
}

export async function healthAvailable(): Promise<boolean> {
  return (await availability()).availability === 'ready';
}

async function availability(): Promise<{ availability: HealthStatus['availability']; reason?: string }> {
  if (!isNative()) return { availability: 'web' };
  try {
    const r = await (await plugin()).isAvailable();
    return r.available ? { availability: 'ready' } : { availability: 'missing', reason: r.reason };
  } catch (e) {
    return { availability: 'missing', reason: String((e as Error)?.message ?? e) };
  }
}

/** Current connection state: stored choice plus what the platform says is granted right now (revocation aware). */
export async function healthStatus(): Promise<HealthStatus> {
  const a = await availability();
  const snap = await getDoc(settingsRef()).catch(() => null);
  const stored = (snap?.get('health') ?? {}) as { connected?: boolean; lastSyncAt?: { toMillis(): number }; lastSyncCounts?: Record<string, number> };
  let granted: HealthDataType[] = [];
  let denied: HealthDataType[] = [];
  if (a.availability === 'ready' && stored.connected) {
    try {
      const s = await (await plugin()).checkAuthorization({ read: HEALTH_TYPES });
      granted = s.readAuthorized;
      denied = s.readDenied;
    } catch {
      /* keep empty: shown as "permissions unknown" */
    }
  }
  return {
    ...a,
    // On Android a revoked permission shows up here; iOS never reveals read denials, so trust the stored choice.
    connected: !!stored.connected && (platform() === 'ios' || granted.length > 0),
    granted,
    denied,
    lastSyncAt: stored.lastSyncAt?.toMillis?.() ?? null,
    lastSyncCounts: stored.lastSyncCounts,
  };
}

export async function connectHealth(): Promise<'granted' | 'denied' | 'unavailable'> {
  if (!(await healthAvailable())) return 'unavailable';
  const res = await (await plugin()).requestAuthorization({ read: HEALTH_TYPES });
  // iOS does not reveal whether reading was allowed, so treat the completed request as connected.
  const ok = platform() === 'ios' || res.readAuthorized.length > 0;
  await saveState({ connected: ok, grantedTypes: res.readAuthorized, connectedAt: serverTimestamp() });
  return ok ? 'granted' : 'denied';
}

/** Stops syncing. Already synced records stay (the user can delete them); the platform keeps its own permission. */
export async function disconnectHealth(): Promise<void> {
  await saveState({ connected: false, disconnectedAt: serverTimestamp() });
}

/** Opens the platform screen where the user changes FitMe's health permissions. */
export async function openHealthSettings(): Promise<void> {
  const h = await plugin();
  if (platform() === 'android') await h.openHealthConnectSettings();
  else window.open('x-apple-health://', '_system');
}

export async function isHealthConnected(): Promise<boolean> {
  return (await healthStatus()).connected;
}

/**
 * Reads the last `days` days and stores them with stable ids, so syncing again updates instead of duplicating:
 * healthDaily/{date} (steps, distance, energy, heart rate), stepLogs/device-{date}, sleepLogs/device-sleep-{date},
 * weightLogs and workoutLogs by platform id.
 */
export async function syncHealth(days = 7): Promise<Record<string, number>> {
  const h = await plugin();
  const tz = userTz();
  const endDate = new Date().toISOString();
  const startDay = addDays(localDate(Date.now(), tz), -(days - 1));
  const startDate = new Date(`${startDay}T00:00:00`).toISOString();
  const deviceName = healthAppName() === 'healthKit' ? 'Apple Health' : 'Health Connect';
  const counts: Record<string, number> = {};
  const safe = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch {
      return null; // not granted or not supported on this device: skip that type
    }
  };
  const daily = async (dataType: HealthDataType) =>
    byLocalDay((await safe(() => h.queryAggregated({ dataType, startDate, endDate, bucket: 'day', aggregation: 'sum' })))?.samples ?? [], tz);

  const steps = await daily('steps');
  const distance = await daily('distance');
  const energy = await daily('calories');
  const hr = (await safe(() => h.queryAggregated({ dataType: 'heartRate', startDate, endDate, bucket: 'day', aggregation: ['average', 'min', 'max'] })))?.samples ?? [];
  const hrByDay = new Map(hr.map((s) => [localDate(new Date(s.startDate).getTime(), tz), s]));

  const dates = new Set([...steps.keys(), ...distance.keys(), ...energy.keys(), ...hrByDay.keys()]);
  for (const date of dates) {
    const hrs = hrByDay.get(date) as { values?: Record<string, number>; value?: number } | undefined;
    const summary = {
      deviceName,
      ...(steps.has(date) ? { steps: Math.round(steps.get(date)!) } : {}),
      ...(distance.has(date) ? { distanceM: Math.round(distance.get(date)!) } : {}),
      ...(energy.has(date) ? { activeKcal: Math.round(energy.get(date)!) } : {}),
      ...(hrs?.values?.average ? { heartRateAvg: Math.round(hrs.values.average), heartRateMin: Math.round(hrs.values.min ?? 0), heartRateMax: Math.round(hrs.values.max ?? 0) } : {}),
    };
    await upsertRecord('healthDaily', `device-${date}`, summary, { date, source: 'device' });
    if (steps.has(date)) await upsertRecord('stepLogs', `device-${date}`, { steps: Math.min(200000, Math.round(steps.get(date)!)), deviceName }, { date, source: 'device' });
  }
  counts.days = dates.size;

  const sleep = (await safe(() => h.readSamples({ dataType: 'sleep', startDate: new Date(Date.parse(startDate) - 86400000).toISOString(), endDate, limit: 500, ascending: true })))?.samples ?? [];
  const nights = sleepNights(
    sleep.map((s) => ({ startDate: s.startDate, endDate: s.endDate, value: s.value, sourceName: s.sourceName, state: (s as { sleepState?: string }).sleepState })),
    tz,
  );
  for (const n of nights)
    await upsertRecord('sleepLogs', `device-sleep-${n.date}`, { startMinutes: n.startMinutes, endMinutes: n.endMinutes, durationMin: n.durationMin }, { date: n.date, source: 'device' });
  counts.sleep = nights.length;

  const weights = (await safe(() => h.readSamples({ dataType: 'weight', startDate, endDate, limit: 100 })))?.samples ?? [];
  for (const w of weights) {
    if (!(w.value >= 20 && w.value <= 400)) continue;
    const date = localDate(new Date(w.startDate).getTime(), tz);
    await upsertRecord('weightLogs', deviceRecordId('weight', w.platformId, w.startDate), { kg: Math.round(w.value * 10) / 10 }, { date, source: 'device' });
  }
  counts.weight = weights.length;

  const workouts = (await safe(() => h.queryWorkouts({ startDate, endDate, limit: 100 })))?.workouts ?? [];
  for (const w of workouts) {
    const date = localDate(new Date(w.startDate).getTime(), tz);
    await upsertRecord(
      'workoutLogs',
      deviceRecordId('workout', w.platformId, w.startDate),
      { name: workoutName(String(w.workoutType)), durationMin: Math.round(w.duration / 60), sets: [], caloriesEst: Math.min(5000, Math.round(w.totalEnergyBurned ?? 0)) },
      { date, source: 'device' },
    );
  }
  counts.workouts = workouts.length;

  await saveState({ connected: true, lastSyncAt: serverTimestamp(), lastSyncCounts: counts });
  return counts;
}

/** Kept for the Health tab's step card. */
export async function syncSteps(days = 7): Promise<number> {
  return (await syncHealth(days)).days ?? 0;
}
