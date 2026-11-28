/**
 * Screenshot mode, development and emulator builds only: `?screenshots=1` hides pricing, plans, paywalls,
 * "Upgrade" and trial banners so marketing screenshots never show them. In production builds this is always
 * false and the check is removed by the bundler.
 */
const allowed = import.meta.env.DEV || import.meta.env.MODE === 'emulators';
const KEY = 'fitme_screenshot_mode';

function detect(): boolean {
  if (!allowed || typeof window === 'undefined') return false;
  try {
    if (new URLSearchParams(window.location.search).has('screenshots')) sessionStorage.setItem(KEY, '1');
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export const screenshotMode = detect();
if (screenshotMode) document.documentElement.classList.add('screenshot-mode');
