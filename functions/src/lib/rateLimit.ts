import { HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './admin';

/** UTC day key, e.g. 20261114. */
export function dayKey(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10).replace(/-/g, '');
}

export function overLimit(used: number, limit: number): boolean {
  return limit >= 0 && used >= limit;
}

/**
 * Atomically counts one use of `key` for `uid` today and throws resource-exhausted over the limit.
 * Counters live in `usage/{uid}_{key}_{day}`, which Security Rules deny to clients.
 */
export async function consume(uid: string, key: string, dailyLimit: number, nowMs = Date.now()): Promise<number> {
  const ref = db().doc(`usage/${uid}_${key}_${dayKey(nowMs)}`);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const used = (snap.exists ? (snap.get('count') as number) : 0) || 0;
    if (overLimit(used, dailyLimit)) {
      throw new HttpsError('resource-exhausted', 'daily_limit_reached', { key, limit: dailyLimit });
    }
    tx.set(ref, { uid, key, day: dayKey(nowMs), count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return used + 1;
  });
}
