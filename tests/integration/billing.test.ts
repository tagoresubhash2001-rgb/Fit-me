import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { accessAt, DAY, writeDoc } from './emulator';

// Server-only config is written through the emulator REST API with the owner token (rules bypassed).
async function setConfig(id: string, fields: Record<string, unknown>) {
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, { stringValue: String(v) }])) };
  const r = await fetch(`http://127.0.0.1:8080/v1/projects/demo-fitmeai/databases/(default)/documents/appConfig/${id}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  expect(r.ok).toBe(true);
}

let app: FirebaseApp;
beforeAll(() => {
  app = initializeApp({ projectId: 'demo-fitmeai', apiKey: 'demo-key', authDomain: 'demo-fitmeai.firebaseapp.com' }, 'billing');
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
  connectFunctionsEmulator(getFunctions(app, 'asia-south1'), '127.0.0.1', 5001);
});
afterAll(async () => deleteApp(app));
const call = (name: string, data: unknown) => httpsCallable(getFunctions(app, 'asia-south1'), name)(data);

describe('free trial and entitlements (emulator, test mode)', () => {
  it('after the free stages: a subscription unlocks Pro on the server, and cancelling keeps it to the end', async () => {
    await setConfig('billing', { mode: 'test' });
    const cred = await createUserWithEmailAndPassword(getAuth(app), `trial${Date.now()}@example.test`, 'password123');
    const uid = cred.user.uid;
    // This account is past its free stages (day 38+), so only a subscription unlocks paid features.
    await writeDoc(`access/${uid}`, accessAt(uid, Date.now() - 40 * DAY));
    // Before: Pro features are refused.
    await expect(call('coachChat', { threadId: 'jai', coach: 'jai', message: 'hi' })).rejects.toThrow('upgrade_required');

    // The free stages were this account's free trial: choosing a plan now is a purchase, not a second trial.
    const res = (await call('startTrial', { plan: 'pro', period: 'yearly' })).data as { status: string; trialEndsAt: number | null };
    expect(res.status).toBe('active');
    expect(res.trialEndsAt).toBeNull();
    const ent = (await getDoc(doc(getFirestore(app), `entitlements/${uid}`))).data()!;
    expect(ent).toMatchObject({ plan: 'pro', status: 'active', period: 'yearly', source: 'test', willRenew: true });
    expect(ent.expiresAt.toMillis() - Date.now()).toBeGreaterThan(364 * DAY);

    // After: the server gate lets the Pro feature through (it then fails only for lack of an AI key).
    await expect(call('coachChat', { threadId: 'jai', coach: 'jai', message: 'hi' })).rejects.not.toThrow('upgrade_required');
    // A second trial while subscribed is refused.
    await expect(call('startTrial', { plan: 'premium', period: 'monthly' })).rejects.toThrow('already_subscribed');

    // Cancel: stays active until the trial ends.
    await expect(call('manageSubscription', { action: 'cancel' })).resolves.toMatchObject({ data: { status: 'cancelled' } });
    const after = (await getDoc(doc(getFirestore(app), `entitlements/${uid}`))).data()!;
    expect(after).toMatchObject({ status: 'cancelled', willRenew: false });
    expect(after.expiresAt.toMillis()).toBe(ent.expiresAt.toMillis());
    await expect(call('coachChat', { threadId: 'jai', coach: 'jai', message: 'hi' })).rejects.not.toThrow('upgrade_required');
    // Resume and change plan.
    await expect(call('manageSubscription', { action: 'resume' })).resolves.toMatchObject({ data: { status: 'active' } });
    await expect(call('manageSubscription', { action: 'change', plan: 'premium', period: 'quarterly' })).resolves.toBeTruthy();
    expect((await getDoc(doc(getFirestore(app), `entitlements/${uid}`))).data()).toMatchObject({ plan: 'premium', period: 'quarterly' });
  });

  it('during a free stage: choosing a plan keeps the free days, first charge when the stage ends', async () => {
    const cred = await createUserWithEmailAndPassword(getAuth(app), `stage${Date.now()}@example.test`, 'password123');
    const uid = cred.user.uid;
    const signUp = Date.now() - 10 * DAY; // day 11: in the free trial until day 37
    await writeDoc(`access/${uid}`, accessAt(uid, signUp));
    const res = (await call('startTrial', { plan: 'pro', period: 'monthly' })).data as { status: string; trialEndsAt: number };
    expect(res.status).toBe('trialing');
    expect(Math.abs(res.trialEndsAt - (signUp + 37 * DAY))).toBeLessThan(2000);
  });

  it('validates the plan and period', async () => {
    await expect(call('startTrial', { plan: 'gold', period: 'weekly' })).rejects.toMatchObject({ code: 'functions/invalid-argument' });
  });

  it('records interest while payments are not launched', async () => {
    await setConfig('billing', { mode: 'interest' });
    const cred = await createUserWithEmailAndPassword(getAuth(app), `interest${Date.now()}@example.test`, 'password123');
    await expect(call('startTrial', { plan: 'premium', period: 'quarterly' })).resolves.toMatchObject({ data: { status: 'interest' } });
    expect((await getDoc(doc(getFirestore(app), `planInterest/${cred.user.uid}`))).data()).toMatchObject({ plan: 'premium', period: 'quarterly' });
    expect((await getDoc(doc(getFirestore(app), `entitlements/${cred.user.uid}`))).exists()).toBe(false);
    await expect(call('manageSubscription', { action: 'cancel' })).rejects.toThrow('no_subscription');
    await setConfig('billing', { mode: 'test' });
  });

  it('rejects store webhooks until billing secrets are configured, and unsigned calls always', async () => {
    for (const name of ['revenuecatWebhook', 'cashfreeWebhook']) {
      const r = await fetch(`http://127.0.0.1:5001/demo-fitmeai/asia-south1/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"event":{"id":"x","type":"INITIAL_PURCHASE","app_user_id":"someone"}}' });
      expect([401, 503]).toContain(r.status);
    }
  });
});
