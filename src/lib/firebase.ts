import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  type Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  setLogLevel,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';
import type { FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, CustomProvider } from 'firebase/app-check';
import { env } from './env';
import { isNative } from './platform';

let app: FirebaseApp | null = null;
let _auth: Auth;
let _db: Firestore;
let _functions: Functions;

function setupAppCheck(a: FirebaseApp) {
  if (env.useEmulators) return;
  if (env.appEnv === 'dev' && env.appCheckDebugToken) {
    // Debug provider for development builds only (PRD: App Check with debug provider in dev).
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: string }).FIREBASE_APPCHECK_DEBUG_TOKEN = env.appCheckDebugToken;
  }
  if (isNative()) {
    // Native attestation (App Attest / Play Integrity) through the Capacitor plugin.
    initializeAppCheck(a, {
      provider: new CustomProvider({
        getToken: async () => {
          const { FirebaseAppCheck } = await import('@capacitor-firebase/app-check');
          const r = await FirebaseAppCheck.getToken();
          return { token: r.token, expireTimeMillis: r.expireTimeMillis ?? Date.now() + 30 * 60 * 1000 };
        },
      }),
      isTokenAutoRefreshEnabled: true,
    });
    return;
  }
  if (env.recaptchaEnterpriseSiteKey) {
    initializeAppCheck(a, { provider: new ReCaptchaEnterpriseProvider(env.recaptchaEnterpriseSiteKey), isTokenAutoRefreshEnabled: true });
  }
}

export function firebase() {
  if (app) return { app, auth: _auth, db: _db, functions: _functions };
  app = initializeApp(env.firebase);
  setupAppCheck(app);

  _auth = isNative()
    ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
    : initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
        popupRedirectResolver: browserPopupRedirectResolver,
      });

  let cache;
  try {
    // Offline cache: logs stay readable and writable without a connection and sync later.
    cache = persistentLocalCache({ tabManager: persistentMultipleTabManager() });
  } catch {
    cache = memoryLocalCache();
  }
  _db = initializeFirestore(app, { localCache: cache, ignoreUndefinedProperties: true });
  // Production: the SDK's connectivity notices (e.g. "transport errored" while offline) are expected and handled
  // by the offline banner and queued writes; keep only real errors in the console.
  if (import.meta.env.PROD) setLogLevel('error');
  _functions = getFunctions(app, env.functionsRegion);

  if (env.useEmulators) {
    const h = env.emulatorHost;
    connectAuthEmulator(_auth, `http://${h}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(_db, h, 8080);
    connectFunctionsEmulator(_functions, h, 5001);
  }
  return { app, auth: _auth, db: _db, functions: _functions };
}

export const auth = () => firebase().auth;
export const db = () => firebase().db;
export const functions = () => firebase().functions;
/** Storage is loaded on first use (photo uploads) so it is not part of the start-up bundle. */
let _storage: Promise<FirebaseStorage> | null = null;
export const storage = () =>
  (_storage ??= import('firebase/storage').then(({ getStorage, connectStorageEmulator }) => {
    const s = getStorage(firebase().app);
    if (env.useEmulators) connectStorageEmulator(s, env.emulatorHost, 9199);
    return s;
  }));
export { getAuth };
