export type Device = 'android' | 'iphone' | 'ipad' | 'desktop';

/**
 * Device for the download page. iPadOS 13+ reports a desktop Mac user agent, so a "Macintosh" with a touch
 * screen is an iPad.
 */
export function detectDevice(ua: string, maxTouchPoints = 0): Device {
  if (/android/i.test(ua)) return 'android';
  if (/iPad/.test(ua)) return 'ipad';
  if (/iPhone|iPod/.test(ua)) return 'iphone';
  if (/Macintosh/.test(ua) && maxTouchPoints > 0) return 'ipad';
  return 'desktop';
}

export function currentDevice(): Device {
  if (typeof navigator === 'undefined') return 'desktop';
  return detectDevice(navigator.userAgent || '', navigator.maxTouchPoints || 0);
}

export const isApple = (d: Device) => d === 'iphone' || d === 'ipad';
