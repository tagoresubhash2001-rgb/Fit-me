import { healthStatus, syncHealth } from './healthSync';
import { phoneStepsStatus, syncPhoneSteps } from './steps';

let last = 0;

/** On app open (at most every 10 minutes): phone steps and the connected health platform. Errors are silent. */
export async function autoSyncDevices(): Promise<void> {
  if (Date.now() - last < 10 * 60_000) return;
  last = Date.now();
  try {
    if ((await phoneStepsStatus()).enabled) await syncPhoneSteps(7);
  } catch {
    /* shown in Settings > Connected devices */
  }
  try {
    if ((await healthStatus()).connected) await syncHealth(3);
  } catch {
    /* shown in Settings > Connected devices */
  }
}
