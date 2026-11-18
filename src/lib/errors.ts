import { env } from './env';
import { isNative } from './platform';

/**
 * Error reporting. Web: Firebase Analytics `app_exception` events (loaded only when the first error happens,
 * so it costs nothing on a healthy session). Native: the same event; Crashlytics joins when its Capacitor
 * plugin is added (docs/PERFORMANCE.md). Messages are trimmed and never include user data.
 */
let pending: Promise<((e: { description: string; fatal: boolean }) => void) | null> | null = null;
const seen = new Set<string>();

function loader() {
  if (pending) return pending;
  pending = (async () => {
    if (env.useEmulators || !env.firebase.measurementId) return null;
    const [{ getAnalytics, isSupported, logEvent }, { firebase }] = await Promise.all([import('firebase/analytics'), import('./firebase')]);
    if (!(await isSupported())) return null;
    const analytics = getAnalytics(firebase().app);
    return (e: { description: string; fatal: boolean }) => logEvent(analytics, 'exception', { ...e, platform: isNative() ? 'native' : 'web' });
  })().catch(() => null);
  return pending;
}

export function reportError(error: unknown, context: string, fatal = false) {
  const description = `${context}: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`.slice(0, 150);
  if (seen.has(description)) return;
  seen.add(description);
  void loader().then((log) => log?.({ description, fatal }));
}

/** Errors nothing else caught. Installed once at start-up. */
export function installGlobalErrorHandlers() {
  window.addEventListener('error', (e) => reportError(e.error ?? e.message, 'window'));
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason, 'promise'));
}

/** A lazy chunk failed to load (usually: a new release replaced the files this tab was started with). */
export const isChunkLoadError = (e: unknown) => /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(String((e as Error)?.message ?? e));
