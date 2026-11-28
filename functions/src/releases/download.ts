import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { MAX_INSTANCES, LIGHT_CPU } from '../lib/callable';
import { db } from '../lib/admin';

/** Hosts an APK may be served from (app_config/android.apkUrl is set from Admin -> Releases). */
const APK_HOSTS = ['firebasestorage.googleapis.com', 'storage.googleapis.com', 'fit-me1.web.app', 'fit-me1.firebaseapp.com'];

export function allowedApkUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && APK_HOSTS.includes(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Public download URL of a Storage object (storage.rules: releases/ is public-read). */
export const storageMediaUrl = (bucket: string, path: string) => `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;

/**
 * /download/android (Hosting rewrite): redirects to the current signed APK. The version is never hard-coded:
 * app_config/android.apkUrl wins; otherwise the newest file in Storage releases/. Counts downloads per day.
 */
export const androidDownload = onRequest({ region: 'asia-south1', maxInstances: MAX_INSTANCES, cpu: LIGHT_CPU, invoker: 'public' }, async (req, res) => {
  let target: string | null = null;
  try {
    target = allowedApkUrl((await db().doc('app_config/android').get()).get('apkUrl'));
    if (!target) {
      const bucket = getStorage().bucket();
      const [files] = await bucket.getFiles({ prefix: 'releases/' });
      const apks = files.filter((f) => f.name.endsWith('.apk')).sort((a, b) => String(b.metadata.updated ?? '').localeCompare(String(a.metadata.updated ?? '')));
      if (apks[0]) target = storageMediaUrl(bucket.name, apks[0].name);
    }
  } catch (e) {
    logger.error('apk lookup failed', { e: String(e) });
  }
  if (!target) return void res.status(503).set('Cache-Control', 'no-store').send('The Android download is not available right now. Please try again later.');
  const day = new Date().toISOString().slice(0, 10);
  await db()
    .doc(`app_downloads/${day}`)
    .set({ date: day, android: FieldValue.increment(1) }, { merge: true })
    .catch(() => undefined);
  res.set('Cache-Control', 'no-store').redirect(302, target);
});
