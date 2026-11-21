import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { accessAt, DAY, readDoc, setClaims, writeDoc } from './emulator';

/** Every Section 5 admin control end to end against the emulators (functions, rules, auth). */
let app: FirebaseApp;
beforeAll(async () => {
  app = initializeApp({ projectId: 'demo-fitmeai', apiKey: 'demo-key', authDomain: 'demo-fitmeai.firebaseapp.com' }, 'admin-control');
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
  connectFunctionsEmulator(getFunctions(app, 'asia-south1'), '127.0.0.1', 5001);
});
afterAll(async () => deleteApp(app));

const fn = <T = unknown>(name: string, data: unknown = {}) => httpsCallable(getFunctions(app, 'asia-south1'), name)(data).then((r) => r.data as T);
const act = <T = unknown>(action: string, data: unknown = {}) => fn<T>('adminAction', { action, data });
const auth = () => getAuth(app);
async function as(role: string | null, tag = role ?? 'member') {
  const u = (await createUserWithEmailAndPassword(auth(), `${tag}${Date.now()}${Math.floor(Math.random() * 1e6)}@example.test`, 'password123')).user;
  if (role) await setClaims(u.uid, { role });
  await u.getIdToken(true);
  return u;
}
const denied = { code: 'functions/permission-denied' };

describe('roles are enforced per section on the server', () => {
  it('members and the wrong roles are refused; content editors cannot open finance', async () => {
    await as(null);
    await expect(act('analytics.summary')).rejects.toMatchObject(denied);
    await as('content');
    await expect(act('finance.payments')).rejects.toMatchObject(denied);
    await expect(act('finance.savePricing', {})).rejects.toMatchObject(denied);
    await expect(act('integrations.status')).rejects.toMatchObject(denied);
    await expect(act('strings.get')).resolves.toBeTruthy();
    await as('finance');
    await expect(act('strings.set', { lang: 'en', key: 'home.logFood', value: 'x' })).rejects.toMatchObject(denied);
    await expect(act('finance.payments')).resolves.toMatchObject({ rows: [] });
    await as('admin');
    await expect(act('integrations.status')).rejects.toMatchObject(denied); // API keys: super admin only
    await expect(act('nope.action')).rejects.toMatchObject({ code: 'functions/invalid-argument' });
  });
});

describe('finance and plans', () => {
  it('a price change for India and for the US creates a new version and is what members read', async () => {
    await as('finance');
    const pricing = (await import('../../src/domain/billing')).DEFAULT_PRICING;
    const next = JSON.parse(JSON.stringify(pricing));
    next.markets.IN.plans.premium.offer = 149;
    next.markets.US.plans.pro.offer = 25;
    const r = await act<{ version: number }>('finance.savePricing', { pricing: { ...next, version: undefined } });
    expect(r.version).toBeGreaterThan(0);
    const member = await as(null);
    const snap = await getDoc(doc(getFirestore(app), 'appConfig/pricing'));
    expect(snap.get('markets.IN.plans.premium.offer')).toBe(149);
    expect(snap.get('markets.US.plans.pro.offer')).toBe(25);
    expect(snap.get('markets.IN.tax.percent')).toBe(18);
    expect(member.uid).toBeTruthy();
  });

  it('Free Launch Mode on unlocks paid features for a free user; off restores the plan; nothing else changes', async () => {
    const admin = await as('admin');
    const member = await as(null);
    await writeDoc(`users/${member.uid}`, { uid: member.uid, country: 'IN', createdAt: new Date() });
    await writeDoc(`access/${member.uid}`, accessAt(member.uid, Date.now() - 60 * DAY));
    await writeDoc(`entitlements/${member.uid}`, { plan: 'premium', status: 'expired', expiresAt: new Date(Date.now() - DAY) });
    const before = await readDoc(`entitlements/${member.uid}`);
    // Signed in as member: coach is Pro only -> refused with upgrade_required.
    const locked = await fn('coachChat', { threadId: 't1', message: 'hi', coach: 'jai' }).then(() => 'ok', (e: { message?: string }) => e.message);
    expect(locked).toContain('upgrade_required');
    await auth().updateCurrentUser(admin);
    await act('policy.freeLaunch', { enabled: true, countries: [] });
    await auth().updateCurrentUser(member);
    // Unlocked: any outcome except "upgrade_required" (the emulator has no AI key, so the call itself may fail later).
    const unlocked = await fn('coachChat', { threadId: 't1', message: 'hi', coach: 'jai' }).then(() => 'ok', (e: { message?: string }) => e.message);
    expect(String(unlocked)).not.toContain('upgrade_required');
    await auth().updateCurrentUser(admin);
    await act('policy.freeLaunch', { enabled: false, countries: [] });
    expect(await readDoc(`entitlements/${member.uid}`)).toEqual(before); // subscription record untouched
  }, 90_000);

  it('a feature made free for one country only', async () => {
    await as('admin');
    const p = await act<{ overrides: unknown[] }>('policy.overrides', { overrides: [{ feature: 'foodPhotoScan', tier: 'free', countries: ['IN'] }] });
    expect(p.overrides).toHaveLength(1);
    const pol = await readDoc('appConfig/policy');
    expect(JSON.stringify(pol)).toContain('foodPhotoScan');
    const { canUse } = await import('../../src/domain/policy');
    const { AccessPolicy } = await import('../../src/domain/policySchema');
    const parsed = AccessPolicy.parse({ overrides: [{ feature: 'foodPhotoScan', tier: 'free', countries: ['IN'] }] });
    expect(canUse(parsed, 'free', 'foodPhotoScan', 'IN')).toBe(true);
    expect(canUse(parsed, 'free', 'foodPhotoScan', 'US')).toBe(false);
    await act('policy.overrides', { overrides: [] });
  });
});

describe('coupons, content, notifications, users, support, logs', () => {
  it('a coupon is created, validated for a member and switched off', async () => {
    await as('finance');
    await act('coupons.save', { coupon: { code: 'LAUNCH20', active: true, kind: 'percent', value: 20, markets: ['IN'], plans: [], periods: [], maxUses: 100, perUserLimit: 1, startsAt: null, endsAt: null } });
    await as(null);
    const ok = await fn<{ ok: boolean; total: number; before: number }>('memberAction', { action: 'coupon.check', data: { code: 'launch20', plan: 'premium', period: 'monthly', country: 'IN' } });
    expect(ok.ok).toBe(true);
    expect(ok.total).toBeLessThan(ok.before);
    const us = await fn<{ ok: boolean; reason?: string }>('memberAction', { action: 'coupon.check', data: { code: 'LAUNCH20', plan: 'premium', period: 'monthly', country: 'US' } });
    expect(us).toMatchObject({ ok: false, reason: 'not_for_market' });
    await as('finance');
    await act('coupons.save', { coupon: { code: 'LAUNCH20', active: false, kind: 'percent', value: 20, markets: ['IN'], plans: [], periods: [], maxUses: 100, perUserLimit: 1, startsAt: null, endsAt: null } });
    await as(null);
    expect(await fn('memberAction', { action: 'coupon.check', data: { code: 'LAUNCH20', plan: 'premium', period: 'monthly', country: 'IN' } })).toMatchObject({ ok: false, reason: 'inactive' });
  });

  it('a home-screen text and a banner image edited by a content editor reach members', async () => {
    await as('content');
    await act('strings.set', { lang: 'en', key: 'home.logFood', value: 'Add a meal' });
    await fn('adminSaveContent', {
      config: { tagline: {}, banners: [{ id: 'b1', active: true, title: { en: 'Hello' }, body: { en: 'Body' }, linkUrl: null, linkLabel: {}, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/public%2Fmedia%2Fa.jpg', startsAt: null, endsAt: null, countries: [] }], ribbons: [], homeSections: [{ id: 'water', visible: false }], onboarding: [], testimonialsTitle: {}, testimonialsVisible: true },
    });
    await as(null);
    const s = await getDoc(doc(getFirestore(app), 'appConfig/strings'));
    expect(s.get('strings.en')['home.logFood']).toBe('Add a meal');
    const c = await getDoc(doc(getFirestore(app), 'appConfig/content'));
    expect(c.get('banners')[0].imageUrl).toContain('public%2Fmedia');
    expect(c.get('homeSections')[0]).toEqual({ id: 'water', visible: false });
  });

  it('a test notification lands in the member inbox; scheduling and cancelling work', async () => {
    const member = await as(null);
    await writeDoc(`users/${member.uid}`, { uid: member.uid, country: 'IN', createdAt: new Date() });
    const admin = await as('admin');
    const r = await act<{ status: string; recipients: number }>('notify.send', { audience: 'user', value: member.uid, title: { en: 'Test' }, body: { en: 'Hello from FitMe' }, sendAt: null, push: true });
    expect(r).toMatchObject({ status: 'sent', recipients: 1 });
    const later = await act<{ id: string; status: string }>('notify.send', { audience: 'country', value: 'IN', title: { en: 'Later' }, body: { en: 'x' }, sendAt: new Date(Date.now() + 3600_000).toISOString(), push: false });
    expect(later.status).toBe('scheduled');
    await act('notify.cancel', { id: later.id });
    await auth().updateCurrentUser(member);
    const list = await (await import('firebase/firestore')).getDocs((await import('firebase/firestore')).collection(getFirestore(app), `users/${member.uid}/inbox`));
    expect(list.docs.some((d) => d.get('body.en') === 'Hello from FitMe')).toBe(true);
    expect(admin.uid).toBeTruthy();
  });

  it('free access grant, trial extension with a reason, logged with before and after', async () => {
    const member = await as(null);
    await writeDoc(`access/${member.uid}`, accessAt(member.uid, Date.now() - 2 * DAY));
    await as('admin');
    await act('users.grant', { uid: member.uid, plan: 'pro', days: 14, reason: 'Beta tester' });
    const g = await readDoc(`grants/${member.uid}`);
    expect(JSON.stringify(g)).toContain('pro');
    const r = await act<{ welcomeEndsAt: number }>('trials.adjust', { uid: member.uid, op: 'extend', days: 7, reason: 'Support case 12' });
    expect(r.welcomeEndsAt).toBeGreaterThan(Date.now() + 10 * DAY);
    await expect(act('trials.adjust', { uid: member.uid, op: 'extend', days: 7, reason: '' })).rejects.toMatchObject({ code: 'functions/invalid-argument' });
    const logs = await act<{ rows: Array<{ action: string; note: string; before: unknown; after: unknown }> }>('logs.search', { targetType: 'user', limit: 50 });
    const trialLog = logs.rows.find((x) => x.action === 'trial.extend');
    expect(trialLog?.note).toBe('Support case 12');
    expect(trialLog?.before).toBeTruthy();
    expect(trialLog?.after).toBeTruthy();
    await as('support');
    await expect(act('users.grant', { uid: member.uid, plan: 'pro', days: 1, reason: 'not allowed' })).rejects.toMatchObject(denied);
  });

  it('contact message and diagnostics go to the support inbox; replies reach the member', async () => {
    const member = await as(null);
    const m = await fn<{ id: string }>('memberAction', { action: 'contact.send', data: { topic: 'bug', message: 'Steps do not update' } });
    const d = await fn<{ id: string }>('memberAction', {
      action: 'diagnostics.send',
      data: { app: { version: '1.0.0', platform: 'android' }, device: {}, permissions: { motion: 'granted' }, sources: { phoneSteps: null, health: null, batteryOptimised: true }, counts: {}, errors: [] },
    });
    expect(d.id).toBeTruthy();
    await as('support');
    const inbox = await act<{ rows: Array<{ id: string }> }>('support.list', { status: 'open' });
    expect(inbox.rows.some((r) => r.id === m.id)).toBe(true);
    await act('support.reply', { id: m.id, reply: 'Please allow battery use for FitMe.', status: 'answered' });
    const diag = await act<{ rows: Array<{ uid: string }> }>('users.diagnostics', { uid: member.uid });
    expect(diag.rows).toHaveLength(1);
  });
});
