import { isNative, platform } from './platform';

/**
 * How this build is distributed (VITE_DISTRIBUTION): decides the payment path.
 *  - web      the website / web app: Cashfree (server-verified)
 *  - direct   the Android APK from the website: Cashfree; Google Play Billing does not work outside the Play Store
 *  - play     a Google Play build: store billing through RevenueCat (when that build exists)
 *  - appstore an App Store build: Apple in-app purchase through RevenueCat (when that build exists)
 * Default: web in a browser, direct on Android, appstore on iOS.
 */
export type Distribution = 'web' | 'direct' | 'play' | 'appstore';

export function distribution(): Distribution {
  const v = import.meta.env.VITE_DISTRIBUTION as string | undefined;
  if (v === 'web' || v === 'direct' || v === 'play' || v === 'appstore') return v;
  if (!isNative()) return 'web';
  return platform() === 'ios' ? 'appstore' : 'direct';
}

export const paysWithCashfree = (d: Distribution = distribution()) => d === 'web' || d === 'direct';
