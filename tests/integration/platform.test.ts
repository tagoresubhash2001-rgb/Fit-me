import { gzipSync } from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { getStorage, connectStorageEmulator, ref, uploadBytes } from 'firebase/storage';
import { legacyCuratedFoods } from '../../functions/src/foods/catalog';
import { accessAt, DAY, setClaims, upload, writeDoc } from './emulator';

let app: FirebaseApp;
beforeAll(async () => {
  app = initializeApp({ projectId: 'demo-fitmeai', apiKey: 'demo-key', authDomain: 'demo-fitmeai.firebaseapp.com', storageBucket: 'demo-fitmeai.appspot.com' }, 'platform');
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
  connectFunctionsEmulator(getFunctions(app, 'asia-south1'), '127.0.0.1', 5001);
  connectStorageEmulator(getStorage(app), '127.0.0.1', 9199);
});
afterAll(async () => deleteApp(app));

const call = <T = unknown>(name: string, data: unknown = {}) => httpsCallable(getFunctions(app, 'asia-south1'), name)(data).then((r) => r.data as T);
const auth = () => getAuth(app);
const newUser = async (tag: string) => (await createUserWithEmailAndPassword(auth(), `${tag}${Date.now()}${Math.floor(Math.random() * 1e6)}@example.test`, 'password123')).user;
const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1]);

describe('food search function (index in Cloud Storage)', () => {
  beforeAll(async () => {
    const index = legacyCuratedFoods().map((f) => ({ id: f.id, name: f.name, names: f.names, aliases: f.aliases, category: f.category, countries: f.countries, source: f.source, dataset: f.dataset, rank: f.rank, per100g: f.per100g, servings: f.servings, micros: { ironMg: 1.2 } }));
    await upload('catalog/foods-index.json.gz', gzipSync(Buffer.from(JSON.stringify(index))), 'application/gzip');
    await writeDoc('appConfig/foodIndex', { path: 'catalog/foods-index.json.gz', builtAt: new Date(), count: index.length });
  });

  it('finds spelling variants, ranks, pages, and needs sign-in', async () => {
    await signOut(auth());
    await expect(call('searchFoods', { q: 'idli' })).rejects.toMatchObject({ code: 'functions/unauthenticated' });
    const u = await newUser('search');
    await writeDoc(`access/${u.uid}`, accessAt(u.uid, Date.now() - 40 * DAY)); // free plan
    const r = await call<{ items: Array<{ name: string; per100g: Record<string, number> }>; total: number }>('searchFoods', { q: 'idly', country: 'IN' });
    expect(r.items[0].name).toBe('Idli');
    // Micronutrients only for plans that include them (server decides): free user gets none.
    expect(r.items[0].per100g.ironMg).toBeUndefined();
    const dosa = await call<{ items: Array<{ name: string }>; total: number }>('searchFoods', { q: 'dosai', country: 'IN', limit: 2 });
    expect(dosa.items).toHaveLength(2);
    expect(dosa.total).toBeGreaterThanOrEqual(3);
    await expect(call('searchFoods', { q: '' })).rejects.toMatchObject({ code: 'functions/invalid-argument' });
  });

  it('attaches micronutrients during the free stages (premium access)', async () => {
    await newUser('micro'); // a new account starts in Welcome Unlock
    const r = await call<{ items: Array<{ name: string; per100g: Record<string, number> }> }>('searchFoods', { q: 'idli', country: 'IN' });
    expect(r.items[0].per100g.ironMg).toBe(1.2);
  });
});

describe('access lifecycle on the server', () => {
  it('a new account gets its access record from the sign-up time, readable by the owner only', async () => {
    const u = await newUser('stage');
    const a = await call<{ stage: string; plan: string; welcomeEndsAtMs: number; createdAtMs: number }>('getAccess');
    expect(a).toMatchObject({ stage: 'welcome', plan: 'pro' });
    expect(a.welcomeEndsAtMs - a.createdAtMs).toBe(7 * DAY);
    const snap = await getDoc(doc(getFirestore(app), `access/${u.uid}`));
    expect(snap.get('eligible')).toBe(true);
    // Signing out and in again (another device, reinstall) returns the same dates.
    await signOut(auth());
    await signInWithEmailAndPassword(auth(), u.email!, 'password123');
    const b = await call<{ welcomeEndsAtMs: number }>('getAccess');
    expect(b.welcomeEndsAtMs).toBe(a.welcomeEndsAtMs);
  });

  it.each([
    ['Day 1', 0, 'allowed'],
    ['Day 8', 7.5, 'allowed'],
    ['Day 38', 37.5, 'upgrade_required'],
  ])('%s: Premium feature gate (AI estimate) is %s', async (_l, daysAgo, expected) => {
    const u = await newUser('gate');
    await writeDoc(`access/${u.uid}`, accessAt(u.uid, Date.now() - (daysAgo as number) * DAY));
    const p = call('analyzeFoodText', { text: '2 idli with sambar' });
    if (expected === 'allowed') await expect(p).rejects.not.toThrow('upgrade_required'); // gets past the gate; the emulator has no real AI key
    else await expect(p).rejects.toThrow('upgrade_required');
  });
});

describe('admin APIs are server-enforced', () => {
  it('regular users are refused by every admin function', async () => {
    await newUser('regular');
    for (const name of ['adminOverview', 'adminListUsers', 'adminSetUserDisabled', 'adminSetRole', 'adminSavePricing', 'adminSaveFeatures', 'adminSaveContent', 'adminSaveAccess', 'adminSaveFood', 'reviewTestimonial'])
      await expect(call(name, {})).rejects.toMatchObject({ code: 'functions/permission-denied' });
  });

  it('a moderator can read the overview but not change users or prices', async () => {
    const m = await newUser('mod');
    await setClaims(m.uid, { role: 'moderator' });
    await m.getIdToken(true);
    const o = await call<{ totalUsers: number; revenue: unknown }>('adminOverview');
    expect(o.totalUsers).toBeGreaterThan(0);
    expect(o.revenue).toBeNull(); // no verified payments exist: no number is shown
    await expect(call('adminSetUserDisabled', { uid: 'x'.repeat(28), disabled: true })).rejects.toMatchObject({ code: 'functions/permission-denied' });
    await expect(call('adminSaveFeatures', { config: {} })).rejects.toMatchObject({ code: 'functions/permission-denied' });
  });

  it('deactivation blocks the user at once, is logged, and reactivation restores access', async () => {
    const target = await newUser('target');
    const targetEmail = target.email!;
    const admin = await newUser('admin');
    await setClaims(admin.uid, { role: 'admin' });
    await admin.getIdToken(true);
    await call('adminSetUserDisabled', { uid: target.uid, disabled: true, reason: 'test' });
    // The target cannot sign in any more.
    await signOut(auth());
    await expect(signInWithEmailAndPassword(auth(), targetEmail, 'password123')).rejects.toMatchObject({ code: 'auth/user-disabled' });
    // The change is in the immutable activity log with before and after values.
    await signInWithEmailAndPassword(auth(), admin.email!, 'password123');
    await admin.getIdToken(true);
    const logs = await getDocs(collection(getFirestore(app), 'adminLogs'));
    const entry = logs.docs.map((d) => d.data()).find((d) => d.targetId === target.uid && d.action === 'user.deactivate');
    expect(entry).toMatchObject({ before: { disabled: false }, after: { disabled: true }, note: 'test' });
    await call('adminSetUserDisabled', { uid: target.uid, disabled: false });
    await signOut(auth());
    await expect(signInWithEmailAndPassword(auth(), targetEmail, 'password123')).resolves.toBeTruthy();
  });

  it('a still-valid token of a deactivated user is refused by callables', async () => {
    const target = await newUser('token');
    await writeDoc(`userStatus/${target.uid}`, { disabled: true });
    await new Promise((r) => setTimeout(r, 200));
    await expect(call('getAccess')).rejects.toThrow('account_disabled');
  });
});

describe('testimonials: never public until approved', () => {
  it('submit -> pending (private) -> changes requested -> resubmit -> approved (public) -> withdrawn (removed)', async () => {
    const author = await newUser('author');
    const id = `t${Date.now()}`;
    const s = getStorage(app);
    await uploadBytes(ref(s, `testimonials/${author.uid}/${id}/before.jpg`), jpg, { contentType: 'image/jpeg' });
    const input = { id, displayName: 'Ravi', testimonial: 'FitMe helped me eat better every single day.', experience: 'I logged every meal for three months and lost six kilograms.', hasBefore: true, hasAfter: false, consent: true };
    await expect(call('submitTestimonial', { ...input, consent: false })).rejects.toMatchObject({ code: 'functions/invalid-argument' });
    await expect(call('submitTestimonial', { ...input, hasAfter: true })).rejects.toThrow('photos_missing');
    await expect(call('submitTestimonial', input)).resolves.toMatchObject({ status: 'pending' });
    expect((await getDoc(doc(getFirestore(app), `publicTestimonials/${id}`))).exists()).toBe(false);
    await expect(call('reviewTestimonial', { id, decision: 'approve' })).rejects.toMatchObject({ code: 'functions/permission-denied' });

    const mod = await newUser('moderator');
    await setClaims(mod.uid, { role: 'moderator' });
    await mod.getIdToken(true);
    await expect(call('reviewTestimonial', { id, decision: 'request_changes' })).rejects.toThrow('note_required');
    await call('reviewTestimonial', { id, decision: 'request_changes', note: 'Please add how long it took.' });

    await signOut(auth());
    await signInWithEmailAndPassword(auth(), author.email!, 'password123');
    const mine = await getDoc(doc(getFirestore(app), `testimonials/${id}`));
    expect(mine.data()).toMatchObject({ status: 'changes_requested', adminNote: 'Please add how long it took.' });
    await call('submitTestimonial', { ...input, details: { durationWeeks: 12 } });

    await signOut(auth());
    await signInWithEmailAndPassword(auth(), mod.email!, 'password123');
    await mod.getIdToken(true);
    await call('reviewTestimonial', { id, decision: 'approve', edits: { displayName: 'Ravi K.' } });
    await signOut(auth());
    const pub = await getDoc(doc(getFirestore(app), `publicTestimonials/${id}`)); // signed out: public read
    expect(pub.data()).toMatchObject({ displayName: 'Ravi K.', beforeURL: `public/testimonials/${id}/before.jpg`, afterURL: null });
    expect(pub.data()?.uid).toBeUndefined(); // no account id on the public copy

    await signInWithEmailAndPassword(auth(), author.email!, 'password123');
    await call('withdrawTestimonial', { id });
    expect((await getDoc(doc(getFirestore(app), `publicTestimonials/${id}`))).exists()).toBe(false);
    expect((await getDoc(doc(getFirestore(app), `testimonials/${id}`))).data()).toMatchObject({ status: 'withdrawn', consent: false });
  });
});

describe('AI-estimated foods go to the review queue', () => {
  it('only a real AI custom food of the caller is queued', async () => {
    const u = await newUser('aifood');
    const { setDoc, Timestamp } = await import('firebase/firestore');
    const now = Timestamp.now();
    const base = { uid: u.uid, createdAt: now, updatedAt: now, date: '2026-11-21', tz: 'UTC', status: 'active', name: 'Ragi ambali', servingLabel: '1 glass', grams: 250, nutrients: { calories: 120, proteinG: 3, carbsG: 24, fatG: 1, fiberG: 3 } };
    await setDoc(doc(getFirestore(app), `users/${u.uid}/customFoods/aifood01`), { ...base, id: 'aifood01', source: 'ai', origin: 'ai' });
    await setDoc(doc(getFirestore(app), `users/${u.uid}/customFoods/manual01`), { ...base, id: 'manual01', source: 'manual' });
    await expect(call('reportAiFood', { customFoodId: 'aifood01' })).resolves.toMatchObject({ queued: true });
    await expect(call('reportAiFood', { customFoodId: 'aifood01' })).resolves.toMatchObject({ queued: false });
    await expect(call('reportAiFood', { customFoodId: 'manual01' })).rejects.toThrow('not_ai_food');
    await expect(call('reportAiFood', { customFoodId: 'missing01' })).rejects.toThrow('not_ai_food');
  });
});
