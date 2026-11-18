import { FieldValue, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { db } from '../lib/admin';
import { DEFAULT_PRICING, PricingConfig, applyEvent, type BillingEvent, type Entitlement } from './billing';

/** Billing mode from appConfig/billing: interest (no payments yet), test (sandbox trials for testers), live. */
export type BillingMode = 'interest' | 'test' | 'live';

export async function loadPricing(): Promise<PricingConfig> {
  const snap = await db().doc('appConfig/pricing').get();
  const parsed = snap.exists ? PricingConfig.safeParse(snap.data()) : null;
  return parsed?.success ? parsed.data : DEFAULT_PRICING;
}

export async function loadBillingMode(): Promise<BillingMode> {
  const mode = (await db().doc('appConfig/billing').get()).get('mode');
  return mode === 'test' || mode === 'live' ? mode : 'interest';
}

const toMs = (v: unknown): number | null => (v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : null);
const toTs = (ms: number | null | undefined) => (ms === null || ms === undefined ? null : Timestamp.fromMillis(ms));

export function readEntitlement(d: DocumentData | undefined): Entitlement | null {
  if (!d || (d.plan !== 'premium' && d.plan !== 'pro')) return null;
  return {
    plan: d.plan,
    status: d.status ?? 'active', // documents written before states existed were plain grants
    period: d.period,
    source: d.source ?? 'admin',
    expiresAt: toMs(d.expiresAt),
    trialEndsAt: toMs(d.trialEndsAt),
    willRenew: d.willRenew ?? false,
  };
}

/**
 * Applies a billing event to entitlements/{uid} in a transaction. Store events are idempotent by id
 * (billing/{uid}/events/{eventId}); the trial is recorded once per account in billing/{uid}.
 */
export async function applyBillingEvent(uid: string, event: BillingEvent, eventId?: string): Promise<Entitlement | null> {
  const entRef = db().doc(`entitlements/${uid}`);
  const billRef = db().doc(`billing/${uid}`);
  const evRef = eventId ? billRef.collection('events').doc(eventId.replace(/\//g, '_')) : null;
  return db().runTransaction(async (tx) => {
    if (evRef && (await tx.get(evRef)).exists) return readEntitlement((await tx.get(entRef)).data());
    const current = readEntitlement((await tx.get(entRef)).data());
    const next = applyEvent(current, event);
    if (!next) return current;
    tx.set(entRef, {
      plan: next.plan,
      status: next.status,
      period: next.period ?? null,
      source: next.source,
      expiresAt: toTs(next.expiresAt),
      trialEndsAt: toTs(next.trialEndsAt),
      willRenew: next.willRenew ?? false,
      ...(event.type === 'trial_started' ? { trialUsed: true } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (event.type === 'trial_started') tx.set(billRef, { trialUsedAt: Timestamp.fromMillis(event.at) }, { merge: true });
    if (evRef) tx.set(evRef, { type: event.type, at: Timestamp.fromMillis(event.at), receivedAt: FieldValue.serverTimestamp() });
    return next;
  });
}

export async function trialUsedAt(uid: string): Promise<number | null> {
  return toMs((await db().doc(`billing/${uid}`).get()).get('trialUsedAt'));
}
