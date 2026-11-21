import { useEffect, useState } from 'react';
import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isNative } from '../lib/platform';
import { upsertRecord, userTz } from './records';
import { currentUid } from './session';

/**
 * This phone's own step counter (FitMe native plugin "FitMeSteps"): Android uses the Google Recording API on mobile
 * (or the hardware step counter with a persisted baseline), iOS uses Core Motion. Both keep counting while FitMe is
 * closed; the app reads the daily totals when it opens and stores one record per day (phone-YYYY-MM-DD).
 */
type Perm = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';
interface FitMeStepsPlugin {
  isAvailable(): Promise<{ available: boolean; sensor: boolean; recordingApi: boolean }>;
  checkPermissions(): Promise<{ activity: Perm }>;
  requestPermissions(): Promise<{ activity: Perm }>;
  start(o: { timeZone: string }): Promise<{ source: string }>;
  stop(): Promise<void>;
  getDailySteps(o: { days: number }): Promise<{ days: Array<{ date: string; steps: number; distanceM?: number; source: string }> }>;
  startLive(): Promise<void>;
  batteryStatus(): Promise<{ optimised: boolean }>;
  openBatterySettings(): Promise<void>;
  stopLive(): Promise<void>;
  addListener(e: 'step', fn: (d: { sensorStepsToday: number }) => void): Promise<PluginListenerHandle>;
}
const Native = registerPlugin<FitMeStepsPlugin>('FitMeSteps');

export interface PhoneStepsStatus {
  supported: boolean;
  permission: Perm | 'unsupported';
  enabled: boolean;
  lastSyncAt: number | null;
}

const ref = () => doc(db(), `users/${currentUid()}/settings/devices`);

export async function phoneStepsStatus(): Promise<PhoneStepsStatus> {
  if (!isNative()) return { supported: false, permission: 'unsupported', enabled: false, lastSyncAt: null };
  const [avail, perm, snap] = await Promise.all([
    Native.isAvailable().catch(() => ({ available: false })),
    Native.checkPermissions().catch(() => ({ activity: 'denied' as Perm })),
    getDoc(ref()).catch(() => null),
  ]);
  const p = (snap?.get('phoneSteps') ?? {}) as { enabled?: boolean; lastSyncAt?: { toMillis(): number } };
  return { supported: avail.available, permission: avail.available ? perm.activity : 'unsupported', enabled: !!p.enabled && perm.activity === 'granted', lastSyncAt: p.lastSyncAt?.toMillis?.() ?? null };
}

/** Asks for motion permission (after the in-app explanation) and starts background counting. */
export async function enablePhoneSteps(): Promise<'granted' | 'denied' | 'unavailable'> {
  if (!isNative() || !(await Native.isAvailable()).available) return 'unavailable';
  let perm = (await Native.checkPermissions()).activity;
  if (perm !== 'granted') perm = (await Native.requestPermissions()).activity;
  if (perm !== 'granted') return 'denied';
  await Native.start({ timeZone: userTz() });
  await setDoc(ref(), { phoneSteps: { enabled: true, updatedAt: serverTimestamp() } }, { merge: true });
  await syncPhoneSteps(7);
  return 'granted';
}

export async function disablePhoneSteps(): Promise<void> {
  if (isNative()) await Native.stop().catch(() => undefined);
  await setDoc(ref(), { phoneSteps: { enabled: false, updatedAt: serverTimestamp() } }, { merge: true });
}

/** Stores the phone's daily totals (stable ids: a re-sync updates, never duplicates). */
export async function syncPhoneSteps(days = 7): Promise<number> {
  if (!isNative()) return 0;
  await Native.start({ timeZone: userTz() }).catch(() => undefined);
  const { days: list } = await Native.getDailySteps({ days });
  for (const d of list) {
    if (!(d.steps > 0)) continue;
    await upsertRecord('stepLogs', `phone-${d.date}`, { steps: Math.min(200000, Math.round(d.steps)), deviceName: 'This phone' }, { date: d.date, source: 'device' });
  }
  await setDoc(ref(), { phoneSteps: { enabled: true, lastSyncAt: serverTimestamp() } }, { merge: true });
  return list.length;
}

/** Live count from the phone while the app is open (null on web or when not enabled). */
export function useLivePhoneSteps(enabled: boolean): number | null {
  const [steps, setSteps] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled || !isNative()) return;
    let handle: PluginListenerHandle | null = null;
    let stopped = false;
    void (async () => {
      try {
        handle = await Native.addListener('step', (d) => !stopped && setSteps(d.sensorStepsToday));
        await Native.startLive();
        const today = (await Native.getDailySteps({ days: 1 })).days[0];
        if (!stopped && today) setSteps((s) => Math.max(s ?? 0, today.steps));
      } catch {
        /* not available: the stored daily totals are shown instead */
      }
    })();
    return () => {
      stopped = true;
      void handle?.remove();
      void Native.stopLive().catch(() => undefined);
    };
  }, [enabled]);
  return steps;
}

/** Android battery optimisation can delay background syncs; null on the web or when unknown. */
export async function batteryOptimised(): Promise<boolean | null> {
  if (!isNative()) return null;
  return Native.batteryStatus()
    .then((r) => r.optimised)
    .catch(() => null);
}
export const openBatterySettings = () => Native.openBatterySettings();
