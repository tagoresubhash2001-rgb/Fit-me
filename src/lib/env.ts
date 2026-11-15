/**
 * Runtime environment. Firebase web config values are public identifiers (not secrets);
 * they come from .env.<mode> files per Firebase project (dev, staging, prod).
 * With VITE_USE_EMULATORS=true the app runs fully against the local Emulator Suite
 * using the demo project, so no real Firebase project is needed for local development.
 */
export type AppEnv = 'dev' | 'staging' | 'prod';

const e = import.meta.env;

export const env = {
  appEnv: (e.VITE_ENV as AppEnv) || 'dev',
  // Production builds can never talk to the emulators, even if the flag is set by mistake.
  useEmulators: e.VITE_USE_EMULATORS === 'true' && !e.PROD,
  emulatorHost: (e.VITE_EMULATOR_HOST as string) || '127.0.0.1',
  functionsRegion: (e.VITE_FUNCTIONS_REGION as string) || 'asia-south1',
  firebase: {
    apiKey: (e.VITE_FIREBASE_API_KEY as string) || 'demo-key',
    authDomain: (e.VITE_FIREBASE_AUTH_DOMAIN as string) || 'demo-fitmeai.firebaseapp.com',
    projectId: (e.VITE_FIREBASE_PROJECT_ID as string) || 'demo-fitmeai',
    storageBucket: (e.VITE_FIREBASE_STORAGE_BUCKET as string) || 'demo-fitmeai.appspot.com',
    messagingSenderId: (e.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '',
    appId: (e.VITE_FIREBASE_APP_ID as string) || '',
    measurementId: (e.VITE_FIREBASE_MEASUREMENT_ID as string) || undefined,
  },
  recaptchaEnterpriseSiteKey: (e.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as string) || '',
  appCheckDebugToken: (e.VITE_APPCHECK_DEBUG_TOKEN as string) || '',
};

export const isConfigured = () => env.useEmulators || (!!env.firebase.appId && env.firebase.apiKey !== 'demo-key');
