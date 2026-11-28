import { isNative } from './platform';

/**
 * The member app lives at /app/* on the web (its own router with basename /app) and at the root in the
 * native shells. The marketing website owns every other path. Crossing between the two is a full page load.
 */
export const APP_BASE = '/app';

/** Paths the member app used before it moved under /app; they redirect there. */
export const LEGACY_APP_PATHS = ['food', 'planner', 'health', 'workouts', 'store', 'settings', 'plans', 'stories', 'help', 'onboarding', 'sign-in', 'login'];

export const isAppPath = (pathname: string) => pathname === APP_BASE || pathname.startsWith(`${APP_BASE}/`);

/** True when this page load renders the member app (always in the native shells). */
export function rendersMemberApp(pathname = typeof window === 'undefined' ? '/' : window.location.pathname): boolean {
  return isNative() || isAppPath(pathname);
}

/** Browser path for a member-app route ('/food' -> '/app/food' on the web, unchanged in the native shells). */
export function appPath(route = '/'): string {
  if (isNative()) return route;
  const r = route.startsWith('/') ? route : `/${route}`;
  return r === '/' ? `${APP_BASE}/` : `${APP_BASE}${r}`;
}

/** Absolute URL of a member-app route (return URLs for payments and device connections). */
export const appUrl = (route = '/') => `${window.location.origin}${appPath(route)}`;

/** Where an old member-app path now lives, or null when it is not one ('/health/water' -> '/app/health/water'). */
export function legacyTarget(pathname: string): string | null {
  const first = pathname.split('/')[1] ?? '';
  if (!LEGACY_APP_PATHS.includes(first)) return null;
  if (first === 'sign-in' || first === 'login' || first === 'onboarding') return `${APP_BASE}/`;
  return `${APP_BASE}${pathname}`;
}

/** Native deep links may carry the web path ('/app/food'); the native router has no /app prefix. */
export function nativeRoute(target: string): string {
  return isAppPath(target) ? target.slice(APP_BASE.length) || '/' : target;
}
