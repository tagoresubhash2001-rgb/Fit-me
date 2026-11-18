import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

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
  it('starts a 30-day Pro trial that unlocks Pro on the server, once per account', async () => {
    await setConfig('billing', { mode: 'test' });
    const cred = await createUserWithEmailAndPassword(getAuth(app), `trial${Date.now()}@example.test`, 'password123');
    const uid = cred.user.uid;
    // Before: Pro features are refused.
    await expect(call('coachChat', { threadId: 'jai', coach: 'jai', message: 'hi' })).rejects.toThrow('upgrade_required');

    const res = (await call('startTrial', { plan: 'pro', period: 'yearly' })).data as { status: string; trialEndsAt: number };
    expect(res.status).toBe('trialing');
    expect(res.trialEndsAt - Date.now()).toBeGreaterThan(29.9 * 86400000);
    const ent = (await getDoc(doc(getFirestore(app), `entitlements/${uid}`))).data()!;
    expect(ent).toMatchObject({ plan: 'pro', status: 'trialing', period: 'yearly', source: 'test', trialUsed: true, willRenew: true });

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
    // Resume, change plan, cancel again; still no second trial.
    await expect(call('manageSubscription', { action: 'resume' })).resolves.toMatchObject({ data: { status: 'trialing' } });
    await expect(call('manageSubscription', { action: 'change', plan: 'premium', period: 'quarterly' })).resolves.toBeTruthy();
    expect((await getDoc(doc(getFirestore(app), `entitlements/${uid}`))).data()).toMatchObject({ plan: 'premium', period: 'quarterly' });
    await call('manageSubscription', { action: 'cancel' });
    await expect(call('startTrial', { plan: 'pro', period: 'monthly' })).rejects.toThrow('trial_used');
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

  it('rejects unsigned store webhooks', async () => {
    for (const name of ['revenuecatWebhook', 'cashfreeWebhook']) {
      const r = await fetch(`http://127.0.0.1:5001/demo-fitmeai/asia-south1/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"event":{"id":"x","type":"INITIAL_PURCHASE","app_user_id":"someone"}}' });
      expect(r.status).toBe(401);
    }
  });
});
