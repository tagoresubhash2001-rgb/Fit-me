import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { isNative, platform } from '../lib/platform';
import { noteError } from '../lib/diagnostics';

let initialized = false;

/**
 * Push messages on the phone apps (Firebase Cloud Messaging through @capacitor-firebase/messaging).
 * Asked only after the in-app explanation (PermissionPrimer "notifications"); the device token is stored
 * server-side so the admin dashboard, coach, and reminders can reach the device.
 */
export async function registerPush(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    const perm = await FirebaseMessaging.checkPermissions();
    if (perm.receive !== 'granted') return false;
    const { token } = await FirebaseMessaging.getToken();
    if (!token) return false;
    await httpsCallable(functions(), 'memberAction')({
      action: 'push.register',
      data: { token, platform: platform() === 'ios' ? 'ios' : 'android' },
    });

    if (!initialized) {
      initialized = true;
      // Handle background/foreground notification actions / taps
      await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
        const data = event.notification.data as Record<string, string> | undefined;
        const target = data?.route || data?.url || data?.path;
        if (target && typeof window !== 'undefined') {
          if (target.startsWith('/')) {
            window.location.hash = '';
            window.location.pathname = target;
          } else {
            window.location.href = target;
          }
        }
      });

      // Handle token refreshes
      await FirebaseMessaging.addListener('tokenReceived', async (res) => {
        if (res.token) {
          await httpsCallable(functions(), 'memberAction')({
            action: 'push.register',
            data: { token: res.token, platform: platform() === 'ios' ? 'ios' : 'android' },
          }).catch((err) => noteError('push.refreshToken', err));
        }
      });
    }

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
