import { noteError } from '../lib/diagnostics';
import { healthStatus, syncHealth } from './healthSync';
import { phoneStepsStatus, syncPhoneSteps } from './steps';

let last = 0;

/** On app open (at most every 10 minutes): phone steps and the connected health platform. Errors are silent. */
export async function autoSyncDevices(): Promise<void> {
  if (Date.now() - last < 10 * 60_000) return;
  last = Date.now();
  try {
    if ((await phoneStepsStatus()).enabled) await syncPhoneSteps(7);
  } catch (e) {
    noteError('sync.phone', e); // shown in Settings > Connected devices and in diagnostics
  }
  try {
    if ((await healthStatus()).connected) await syncHealth(3);
  } catch (e) {
    noteError('sync.health', e);
  }
  // Refresh the push token (tokens rotate); only when the user already allowed notifications.
  void import('./push').then((m) => m.registerPush()).catch(() => undefined);
}
