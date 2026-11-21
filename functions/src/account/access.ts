import { createHash } from 'node:crypto';
import * as functionsV1 from 'firebase-functions/v1';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminAuth, db } from '../lib/admin';
import { callableOptions, requireAuth } from '../lib/callable';
import { buildAccess, DEFAULT_ACCESS, stageAt, type AccessConfig as AccessConfigType, type AccessRecord } from '../lib/access';
import { AccessConfig } from '../lib/accessSchema';
import { loadPolicy, userCountry } from '../lib/policyStore';

const DAY = 86_400_000;

/** Firestore shape of access/{uid} (server-write only; the owner can read it). */
export interface AccessDoc {
  uid: string;
  createdAt: Timestamp;
  welcomeEndsAt: Timestamp;
  trialEndsAt: Timestamp;
  welcomePlan: AccessRecord['welcomePlan'];
  trialPlan: AccessRecord['trialPlan'];
  eligible: boolean;
  configVersion: number;
  remindersSent?: Record<string, boolean>;
}

export function toRecord(d: AccessDoc): AccessRecord {
  return {
    createdAtMs: d.createdAt.toMillis(),
    welcomeEndsAtMs: d.welcomeEndsAt.toMillis(),
    trialEndsAtMs: d.trialEndsAt.toMillis(),
    welcomePlan: d.welcomePlan,
    trialPlan: d.trialPlan,
    eligible: d.eligible,
    configVersion: d.configVersion,
  };
}

export function toDoc(uid: string, r: AccessRecord): AccessDoc {
  return {
    uid,
    createdAt: Timestamp.fromMillis(r.createdAtMs),
    welcomeEndsAt: Timestamp.fromMillis(r.welcomeEndsAtMs),
    trialEndsAt: Timestamp.fromMillis(r.trialEndsAtMs),
    welcomePlan: r.welcomePlan,
    trialPlan: r.trialPlan,
    eligible: r.eligible,
    configVersion: r.configVersion,
  };
}

export async function loadAccessConfig(): Promise<AccessConfigType> {
  const snap = await db().doc('appConfig/access').get();
  const parsed = snap.exists ? AccessConfig.safeParse(snap.data()) : null;
  return parsed?.success ? parsed.data : DEFAULT_ACCESS;
}

/** One set of free stages per person: a salted hash of the verified email or phone, never the address itself. */
export function identityKey(user: { email?: string | null; phoneNumber?: string | null; emailVerified?: boolean; providerData?: Array<{ providerId: string }> }): string | null {
  const trustedEmail = user.email && (user.emailVerified || user.providerData?.some((p) => p.providerId === 'google.com' || p.providerId === 'apple.com'));
  const raw = trustedEmail ? `email:${user.email!.trim().toLowerCase()}` : user.phoneNumber ? `phone:${user.phoneNumber}` : null;
  if (!raw) return null;
  return createHash('sha256').update(`fitme-trial-v1|${raw}`).digest('hex');
}

/**
 * Returns the user's access record, creating it on first use from the Firebase Auth creation time (so it can
 * never be reset by reinstalling or by another device). Existing accounts get theirs on first call.
 */
export async function ensureAccess(uid: string): Promise<AccessRecord> {
  const ref = db().doc(`access/${uid}`);
  const snap = await ref.get();
  if (snap.exists) return toRecord(snap.data() as AccessDoc);
  const [user, cfg] = await Promise.all([adminAuth().getUser(uid), loadAccessConfig()]);
  const createdAtMs = Date.parse(user.metadata.creationTime) || Date.now();
  const key = identityKey(user);
  return db().runTransaction(async (tx) => {
    const again = await tx.get(ref);
    if (again.exists) return toRecord(again.data() as AccessDoc);
    let eligible = true;
    if (key) {
      const reg = db().doc(`trialRegistry/${key}`);
      const prior = await tx.get(reg);
      if (prior.exists && prior.get('uid') !== uid) eligible = false;
      else if (!prior.exists) tx.create(reg, { uid, at: FieldValue.serverTimestamp() });
    }
    const record = buildAccess(createdAtMs, cfg, eligible);
    tx.create(ref, { ...toDoc(uid, record), createdByFunctionAt: FieldValue.serverTimestamp() });
    return record;
  });
}

/** New accounts get their access record straight away. */
export const onUserCreated = functionsV1
  .region('asia-south1')
  .auth.user()
  .onCreate(async (user) => {
    try {
      await ensureAccess(user.uid);
    } catch (e) {
      logger.error('access record not created', { uid: user.uid, error: (e as Error).message });
    }
  });

/** The app calls this once after sign-in (covers accounts created before the access lifecycle existed). */
export const getAccess = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  const record = await applyCountryStages(uid, await ensureAccess(uid));
  return { ...record, ...stageAt(record, Date.now()) };
});

/**
 * Country-specific stage lengths (admin: Trials, per country). The country is only known after onboarding, so the
 * first time it is known, a still-running Welcome Unlock is re-timed from the sign-up time with that country's
 * days. Done once per account (countryApplied); later policy changes never move an existing user's dates.
 */
export async function applyCountryStages(uid: string, record: AccessRecord): Promise<AccessRecord> {
  const ref = db().doc(`access/${uid}`);
  const snap = await ref.get();
  if (!snap.exists || snap.get('countryApplied')) return record;
  const country = await userCountry(uid);
  if (!country) return record;
  const days = (await loadPolicy()).stageDays[country];
  if (!days || !record.eligible || Date.now() >= record.welcomeEndsAtMs) {
    await ref.update({ countryApplied: country });
    return record;
  }
  const welcomeEndsAtMs = record.createdAtMs + days.welcomeDays * DAY;
  const next: AccessRecord = { ...record, welcomeEndsAtMs, trialEndsAtMs: welcomeEndsAtMs + days.trialDays * DAY };
  await ref.update({ welcomeEndsAt: Timestamp.fromMillis(next.welcomeEndsAtMs), trialEndsAt: Timestamp.fromMillis(next.trialEndsAtMs), countryApplied: country });
  return next;
}
