import { Capacitor } from '@capacitor/core';

/** Light tap feedback on iOS / Android; no-op on the web. */
export function haptic(kind: 'light' | 'medium' = 'light') {
  if (!Capacitor.isNativePlatform()) return;
  void import('@capacitor/haptics')
    .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: kind === 'light' ? ImpactStyle.Light : ImpactStyle.Medium }))
    .catch(() => undefined);
}
