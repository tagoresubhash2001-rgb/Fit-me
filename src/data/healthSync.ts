import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isNative, platform } from '../lib/platform';
import { createRecord, userTz } from './records';
import { currentUid } from './session';
import { addDays, localDate } from '../domain/dates';

/** Steps and sleep from Apple Health (iOS) or Health Connect (Android). Opt-in; web has no device data. */
export const healthAppName = () => (platform() === 'ios' ? 'healthKit' : 'healthConnect');

async function plugin() {
  const { Health } = await import('@capgo/capacitor-health');
  return Health;
}

export async function healthAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    return (await (await plugin()).isAvailable()).available;
  } catch {
    return false;
  }
}

export async function connectHealth(): Promise<'granted' | 'denied' | 'unavailable'> {
  if (!(await healthAvailable())) return 'unavailable';
  const res = await (await plugin()).requestAuthorization({ read: ['steps', 'sleep'] });
  const ok = res.readAuthorized.includes('steps');
  await setDoc(
    doc(db(), `users/${currentUid()}/settings/devices`),
    { health: { connected: ok, app: healthAppName(), updatedAt: serverTimestamp() } },
    { merge: true },
  );
  return ok ? 'granted' : 'denied';
}

export async function isHealthConnected(): Promise<boolean> {
  const snap = await getDoc(doc(db(), `users/${currentUid()}/settings/devices`));
  return !!snap.get('health.connected');
}

/** Reads daily step totals for the last `days` days and stores one device record per day (idempotent ids). */
export async function syncSteps(days = 7): Promise<number> {
  const tz = userTz();
  const end = new Date();
  const startDate = addDays(localDate(Date.now(), tz), -(days - 1));
  const { samples } = await (
    await plugin()
  ).queryAggregated({
    dataType: 'steps',
    startDate: new Date(`${startDate}T00:00:00`).toISOString(),
    endDate: end.toISOString(),
    bucket: 'day',
    aggregation: 'sum',
  });
  const deviceName = healthAppName() === 'healthKit' ? 'Apple Health' : 'Health Connect';
  for (const s of samples) {
    const date = localDate(new Date(s.startDate), tz);
    await createRecord('stepLogs', { steps: Math.round(s.value), deviceName }, { date, source: 'device', id: `device-${date}` });
  }
  return samples.length;
}
