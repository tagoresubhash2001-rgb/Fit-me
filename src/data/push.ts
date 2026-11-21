import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { isNative, platform } from '../lib/platform';
import { noteError } from '../lib/diagnostics';

/**
 * Push messages on the phone apps (Firebase Cloud Messaging through @capacitor-firebase/messaging). Asked only after
 * the in-app explanation (PermissionPrimer "notifications"); the device token is stored server-side so the admin
 * dashboard and reminders can reach the device. Web shows messages in the in-app inbox instead.
 */
export async function registerPush(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    const perm = await FirebaseMessaging.checkPermissions();
    if (perm.receive !== 'granted') return false;
    const { token } = await FirebaseMessaging.getToken();
    if (!token) return false;
    await httpsCallable(functions(), 'memberAction')({ action: 'push.register', data: { token, platform: platform() === 'ios' ? 'ios' : 'android' } });
    return true;
  } catch (e) {
    noteError('push.register', e);
    return false;
  }
}

/** System prompt for push (call after the in-app explanation). */
export async function requestPushPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!isNative()) return 'unsupported';
  const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
  const r = await FirebaseMessaging.requestPermissions();
  if (r.receive === 'granted') {
    await registerPush();
    return 'granted';
  }
  return 'denied';
}
