import { registerPlugin } from '@capacitor/core';
import { isNative, platform } from '../lib/platform';

/**
 * Every device permission FitMe uses, in one place: what it is for, its current state and how to ask. The app
 * always shows its own explanation (PermissionPrimer) before the system prompt, and sends people to the system
 * settings when a permission was denied permanently.
 */
export const PERMISSIONS = ['motion', 'location', 'camera', 'photos', 'health', 'notifications'] as const;
export type PermissionKind = (typeof PERMISSIONS)[number];
/** granted | limited (iOS partial photos) | prompt (can ask) | denied (ask again) | blocked (only in system settings) | unsupported */
export type PermissionState = 'granted' | 'limited' | 'prompt' | 'denied' | 'blocked' | 'unsupported';

const NativeApp = registerPlugin<{ openAppSettings(): Promise<void> }>('FitMeSteps');

type CapState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'limited';
/** Capacitor: "denied" without a rationale prompt means the system will no longer show a prompt on Android. */
function fromCap(s: CapState | undefined): PermissionState {
  if (s === 'granted') return 'granted';
  if (s === 'limited') return 'limited';
  if (s === 'prompt') return 'prompt';
  if (s === 'prompt-with-rationale') return 'denied'; // declined once; the system can ask again
  if (s === 'denied') return 'blocked';
  return 'unsupported';
}

async function webQuery(name: string): Promise<PermissionState> {
  try {
    const r = await navigator.permissions.query({ name: name as PermissionName });
    return r.state === 'granted' ? 'granted' : r.state === 'denied' ? 'blocked' : 'prompt';
  } catch {
    return 'prompt';
  }
}

export async function permissionState(kind: PermissionKind): Promise<PermissionState> {
  try {
    if (!isNative()) {
      if (kind === 'location') return 'geolocation' in navigator ? webQuery('geolocation') : 'unsupported';
      if (kind === 'camera') return navigator.mediaDevices?.getUserMedia ? webQuery('camera') : 'unsupported';
      if (kind === 'notifications') return 'Notification' in window ? (Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'blocked' : 'prompt') : 'unsupported';
      if (kind === 'photos') return 'granted'; // the browser file picker needs no permission
      return 'unsupported'; // motion and health data are not available to websites
    }
    switch (kind) {
      case 'location': {
        const { Geolocation } = await import('@capacitor/geolocation');
        return fromCap((await Geolocation.checkPermissions()).location as CapState);
      }
      case 'camera':
      case 'photos': {
        const { Camera } = await import('@capacitor/camera');
        const r = await Camera.checkPermissions();
        return fromCap((kind === 'camera' ? r.camera : r.photos) as CapState);
      }
      case 'motion': {
        const p = registerPlugin<{ checkPermissions(): Promise<{ activity: CapState }> }>('FitMeSteps');
        return fromCap((await p.checkPermissions()).activity);
      }
      case 'notifications': {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        return fromCap((await LocalNotifications.checkPermissions()).display as CapState);
      }
      case 'health': {
        const { healthStatus } = await import('./healthSync');
        const s = await healthStatus();
        if (s.availability !== 'ready') return 'unsupported';
        return s.connected ? (s.denied.length && s.granted.length ? 'limited' : 'granted') : 'prompt';
      }
    }
  } catch {
    return 'unsupported';
  }
  return 'unsupported';
}

/** Shows the system prompt (call only after the in-app explanation). Returns the new state. */
export async function requestPermission(kind: PermissionKind): Promise<PermissionState> {
  try {
    if (!isNative()) {
      if (kind === 'location')
        return await new Promise((resolve) =>
          navigator.geolocation.getCurrentPosition(
            () => resolve('granted'),
            (e) => resolve(e.code === e.PERMISSION_DENIED ? 'blocked' : 'prompt'),
            { timeout: 15000 },
          ),
        );
      if (kind === 'camera') {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        s.getTracks().forEach((t) => t.stop());
        return 'granted';
      }
      if (kind === 'notifications') {
        const r = await Notification.requestPermission();
        return r === 'granted' ? 'granted' : r === 'denied' ? 'blocked' : 'prompt';
      }
      return permissionState(kind);
    }
    switch (kind) {
      case 'location': {
        const { Geolocation } = await import('@capacitor/geolocation');
        return fromCap((await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] })).location as CapState);
      }
      case 'camera':
      case 'photos': {
        const { Camera } = await import('@capacitor/camera');
        const r = await Camera.requestPermissions({ permissions: [kind === 'camera' ? 'camera' : 'photos'] });
        return fromCap((kind === 'camera' ? r.camera : r.photos) as CapState);
      }
      case 'motion': {
        const { enablePhoneSteps } = await import('./steps');
        const r = await enablePhoneSteps();
        return r === 'granted' ? 'granted' : r === 'denied' ? 'blocked' : 'unsupported';
      }
      case 'notifications': {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        return fromCap((await LocalNotifications.requestPermissions()).display as CapState);
      }
      case 'health': {
        const { connectHealth } = await import('./healthSync');
        const r = await connectHealth();
        return r === 'granted' ? 'granted' : r === 'denied' ? 'blocked' : 'unsupported';
      }
    }
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).toLowerCase();
    return msg.includes('denied') || msg.includes('notallowed') ? 'blocked' : 'prompt';
  }
  return 'unsupported';
}

/** Opens FitMe in the system settings (Android app info, iOS Settings). On the web, the browser site settings. */
export async function openSystemSettings(): Promise<boolean> {
  if (!isNative()) return false;
  if (platform() === 'android' || platform() === 'ios') {
    await NativeApp.openAppSettings();
    return true;
  }
  return false;
}
