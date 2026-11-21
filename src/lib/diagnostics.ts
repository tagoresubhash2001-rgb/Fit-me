import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { isNative, platform } from './platform';

/**
 * Settings → Send diagnostics. Collects only technical state: app version, platform, permission states, which step
 * and health sources are connected and when they last synced, record counts and recent error messages. No health
 * values, no food names, no location. The report lands in the admin dashboard (Support → Diagnostics).
 */
const errors: Array<{ at: number; where: string; message: string }> = [];
export function noteError(where: string, e: unknown) {
  const message = String((e as Error)?.message ?? e).slice(0, 300);
  errors.push({ at: Date.now(), where: where.slice(0, 60), message });
  if (errors.length > 30) errors.shift();
}
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => noteError('window', e.message));
  window.addEventListener('unhandledrejection', (e) => noteError('promise', (e as PromiseRejectionEvent).reason));
}

export async function collectDiagnostics(): Promise<Record<string, unknown>> {
  const [{ PERMISSIONS, permissionState }, steps, health] = await Promise.all([import('../data/permissions'), import('../data/steps'), import('../data/healthSync')]);
  const permissions: Record<string, string> = {};
  for (const k of PERMISSIONS) permissions[k] = await permissionState(k).catch(() => 'unknown');
  const [phone, h, battery] = await Promise.all([steps.phoneStepsStatus().catch(() => null), health.healthStatus().catch(() => null), steps.batteryOptimised()]);
  let version = import.meta.env.VITE_APP_VERSION ?? 'web';
  let model: string | undefined;
  let os: string | undefined;
  if (isNative()) {
    const [{ App }, { Device }] = await Promise.all([import('@capacitor/app'), import('@capacitor/device').catch(() => ({ Device: null }))]);
    version = (await App.getInfo().catch(() => ({ version }))).version;
    const info = Device ? await Device.getInfo().catch(() => null) : null;
    model = info?.model;
    os = info ? `${info.operatingSystem} ${info.osVersion}` : undefined;
  } else os = navigator.userAgent.slice(0, 40);
  return {
    app: { version: String(version).slice(0, 20), platform: platform() === 'ios' ? 'ios' : platform() === 'android' ? 'android' : 'web' },
    device: { model, os, language: navigator.language.slice(0, 12), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    permissions,
    sources: {
      phoneSteps: phone ? { supported: phone.supported, enabled: phone.enabled, backend: null, lastSyncAt: phone.lastSyncAt } : null,
      health: h ? { availability: h.availability, connected: h.connected, granted: h.granted.slice(0, 30), lastSyncAt: h.lastSyncAt } : null,
      batteryOptimised: battery,
    },
    counts: h?.lastSyncCounts ?? {},
    errors: errors.slice(-30),
  };
}

export async function sendDiagnostics(note?: string): Promise<string> {
  const data = { ...(await collectDiagnostics()), ...(note ? { note: note.slice(0, 500) } : {}) };
  const r = await httpsCallable<unknown, { id: string }>(functions(), 'memberAction', { timeout: 30000 })({ action: 'diagnostics.send', data });
  return r.data.id;
}
