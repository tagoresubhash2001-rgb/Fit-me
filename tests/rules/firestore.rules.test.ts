import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp, collection, getDocs } from 'firebase/firestore';

let env: RulesTestEnvironment;

const now = Timestamp.now();
const record = (uid: string, id: string, extra: Record<string, unknown> = {}) => ({
  id,
  uid,
  createdAt: now,
  updatedAt: now,
  date: '2026-11-14',
  tz: 'Asia/Kolkata',
  source: 'manual',
  status: 'active',
  ...extra,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-fitmeai',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(async () => env.cleanup());
beforeEach(async () => env.clearFirestore());

const alice = () => env.authenticatedContext('alice').firestore();
const bob = () => env.authenticatedContext('bob').firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe('users/{uid} profile', () => {
  it('owner can create, read and update own profile', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice'), { uid: 'alice', name: 'Alice' }));
    await assertSucceeds(getDoc(doc(alice(), 'users/alice')));
    await assertSucceeds(updateDoc(doc(alice(), 'users/alice'), { name: 'Al' }));
  });
  it('other users and signed-out users cannot read or write it', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'users/alice'), { uid: 'alice' }));
    await assertFails(getDoc(doc(bob(), 'users/alice')));
    await assertFails(getDoc(doc(anon(), 'users/alice')));
    await assertFails(setDoc(doc(bob(), 'users/alice'), { uid: 'alice' }));
  });
  it('client cannot grant itself a plan or role', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice'), { uid: 'alice', plan: 'pro' }));
    await assertFails(setDoc(doc(alice(), 'users/alice'), { uid: 'alice', role: 'admin' }));
  });
  it('uid field must match the document id', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice'), { uid: 'bob' }));
  });
});

describe('health records', () => {
  it('owner can create a valid food log, read, update and delete it', async () => {
    const ref = doc(alice(), 'users/alice/foodLogs/f1');
    await assertSucceeds(setDoc(ref, record('alice', 'f1', { calories: 220 })));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { calories: 230, updatedAt: Timestamp.now() }));
    await assertSucceeds(deleteDoc(ref));
  });
  it('rejects records missing required fields or with a bad date / source', async () => {
    const ref = doc(alice(), 'users/alice/waterLogs/w1');
    const { tz: _tz, ...noTz } = record('alice', 'w1');
    await assertFails(setDoc(ref, noTz));
    await assertFails(setDoc(ref, record('alice', 'w1', { date: '14/11/2026' })));
    await assertFails(setDoc(ref, record('alice', 'w1', { source: 'hacker' })));
    await assertFails(setDoc(ref, record('alice', 'other-id')));
  });
  it('cannot write records into another user or with another uid', async () => {
    await assertFails(setDoc(doc(bob(), 'users/alice/foodLogs/f1'), record('alice', 'f1')));
    await assertFails(setDoc(doc(alice(), 'users/alice/foodLogs/f1'), record('bob', 'f1')));
  });
  it('cannot change uid or createdAt on update', async () => {
    const ref = doc(alice(), 'users/alice/weightLogs/x');
    await assertSucceeds(setDoc(ref, record('alice', 'x', { kg: 70 })));
    await assertFails(updateDoc(ref, { createdAt: Timestamp.fromMillis(0) }));
  });
  it('unknown subcollections are denied', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice/secrets/x'), record('alice', 'x')));
  });
  it('other users cannot list my logs', async () => {
    await assertFails(getDocs(collection(bob(), 'users/alice/foodLogs')));
    await assertSucceeds(getDocs(collection(alice(), 'users/alice/foodLogs')));
  });
});

describe('AI threads', () => {
  it('client can read but not write messages', async () => {
    await assertSucceeds(getDocs(collection(alice(), 'users/alice/aiThreads/t1/messages')));
    await assertFails(setDoc(doc(alice(), 'users/alice/aiThreads/t1/messages/m1'), { text: 'hi' }));
    await assertFails(getDocs(collection(bob(), 'users/alice/aiThreads/t1/messages')));
  });
});

describe('server-only collections', () => {
  it('entitlements: owner reads, nobody writes', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'entitlements/alice'), { plan: 'free' }));
    await assertSucceeds(getDoc(doc(alice(), 'entitlements/alice')));
    await assertFails(getDoc(doc(bob(), 'entitlements/alice')));
    await assertFails(setDoc(doc(alice(), 'entitlements/alice'), { plan: 'pro' }));
  });
  it('foods, exercises, appConfig: signed-in read only', async () => {
    for (const c of ['foods', 'exercises', 'appConfig']) {
      await assertSucceeds(getDoc(doc(alice(), `${c}/x`)));
      await assertFails(getDoc(doc(anon(), `${c}/x`)));
      await assertFails(setDoc(doc(alice(), `${c}/x`), { a: 1 }));
    }
  });
  it('unknown top-level collections are denied', async () => {
    await assertFails(getDoc(doc(alice(), 'anything/x')));
    await assertFails(setDoc(doc(alice(), 'anything/x'), { a: 1 }));
  });
});

describe('premium micronutrients', () => {
  it('only active Premium / Pro users can read foodMicros', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const d = ctx.firestore();
      await setDoc(doc(d, 'foodMicros/usda-1'), { sodiumMg: 1 });
      await setDoc(doc(d, 'entitlements/alice'), { plan: 'premium', expiresAt: Timestamp.fromMillis(Date.now() + 86400000) });
      await setDoc(doc(d, 'entitlements/bob'), { plan: 'pro', expiresAt: Timestamp.fromMillis(Date.now() - 1000) });
    });
    await assertSucceeds(getDoc(doc(alice(), 'foodMicros/usda-1')));
    await assertFails(getDoc(doc(bob(), 'foodMicros/usda-1'))); // expired
    await assertFails(getDoc(doc(env.authenticatedContext('carol').firestore(), 'foodMicros/usda-1'))); // free
    await assertFails(setDoc(doc(alice(), 'foodMicros/usda-1'), { sodiumMg: 0 }));
  });
  it('trial and cancelled entitlements keep access until they end; expired never does', async () => {
    const soon = Timestamp.fromMillis(Date.now() + 86400000);
    await env.withSecurityRulesDisabled(async (ctx) => {
      const d = ctx.firestore();
      await setDoc(doc(d, 'foodMicros/usda-2'), { sodiumMg: 1 });
      await setDoc(doc(d, 'entitlements/dan'), { plan: 'pro', status: 'trialing', expiresAt: soon });
      await setDoc(doc(d, 'entitlements/eve'), { plan: 'premium', status: 'cancelled', expiresAt: soon });
      await setDoc(doc(d, 'entitlements/fay'), { plan: 'premium', status: 'expired', expiresAt: soon });
    });
    const as = (u: string) => env.authenticatedContext(u).firestore();
    await assertSucceeds(getDoc(doc(as('dan'), 'foodMicros/usda-2')));
    await assertSucceeds(getDoc(doc(as('eve'), 'foodMicros/usda-2')));
    await assertFails(getDoc(doc(as('fay'), 'foodMicros/usda-2')));
  });
});

describe('billing records', () => {
  it('billing/{uid} (trial history, store events) is server-only', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'billing/alice'), { trialUsedAt: now }));
    await assertFails(getDoc(doc(alice(), 'billing/alice')));
    await assertFails(setDoc(doc(alice(), 'billing/alice'), { trialUsedAt: null }));
    await assertFails(setDoc(doc(alice(), 'entitlements/alice'), { plan: 'pro', status: 'trialing' }));
  });
});

describe('plan interest', () => {
  it('owner records interest in a paid plan only, with allowed fields', async () => {
    const ok = { uid: 'alice', plan: 'pro', currency: 'INR', country: 'IN', updatedAt: now };
    await assertSucceeds(setDoc(doc(alice(), 'planInterest/alice'), ok));
    await assertSucceeds(setDoc(doc(alice(), 'planInterest/alice'), { ...ok, plan: 'premium' }));
    await assertSucceeds(setDoc(doc(alice(), 'planInterest/alice'), { ...ok, period: 'yearly' }));
    await assertFails(setDoc(doc(alice(), 'planInterest/alice'), { ...ok, period: 'weekly' }));
    await assertFails(setDoc(doc(alice(), 'planInterest/alice'), { ...ok, plan: 'free' }));
    await assertFails(setDoc(doc(alice(), 'planInterest/alice'), { ...ok, paid: true }));
    await assertFails(setDoc(doc(bob(), 'planInterest/alice'), ok));
    await assertFails(getDoc(doc(bob(), 'planInterest/alice')));
  });
});

describe('store waitlist', () => {
  it('owner can join once with allowed fields only', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'storeWaitlist/alice'), { uid: 'alice', createdAt: now, country: 'IN', language: 'te' }));
    await assertFails(setDoc(doc(alice(), 'storeWaitlist/bob'), { uid: 'bob', createdAt: now }));
    await assertFails(setDoc(doc(bob(), 'storeWaitlist/bob'), { uid: 'bob', createdAt: now, email: 'x' }));
  });
});

// ---------------------------------------------------------------- Added with the access lifecycle, admin and testimonials
const DAYMS = 86_400_000;
const staffCtx = (uid: string, role: string) => env.authenticatedContext(uid, { role }).firestore();
const seed = (path: string, data: Record<string, unknown>) => env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), path), data));
const accessDoc = (signUpMs: number) => ({
  uid: 'alice',
  createdAt: Timestamp.fromMillis(signUpMs),
  welcomeEndsAt: Timestamp.fromMillis(signUpMs + 7 * DAYMS),
  trialEndsAt: Timestamp.fromMillis(signUpMs + 37 * DAYMS),
  welcomePlan: 'pro',
  trialPlan: 'premium',
  eligible: true,
  configVersion: 1,
});

describe('access/{uid} free stages', () => {
  it('the owner can read but never write their access record', async () => {
    await seed('access/alice', accessDoc(Date.now()));
    await assertSucceeds(getDoc(doc(alice(), 'access/alice')));
    await assertFails(getDoc(doc(bob(), 'access/alice')));
    await assertFails(setDoc(doc(alice(), 'access/alice'), accessDoc(Date.now() + 1000 * DAYMS)));
    await assertFails(updateDoc(doc(alice(), 'access/alice'), { eligible: true }));
  });
  it.each([
    ['Day 1', 0, true],
    ['Day 7', 6.5, true],
    ['Day 8', 7.5, true],
    ['Day 37', 36.5, true],
    ['Day 38', 37.5, false],
  ])('%s: premium micronutrients readable = %s', async (_label, daysAgo, allowed) => {
    await seed('access/alice', accessDoc(Date.now() - (daysAgo as number) * DAYMS));
    await seed('foodMicros/x', { ironMg: 1 });
    const read = getDoc(doc(alice(), 'foodMicros/x'));
    await (allowed ? assertSucceeds(read) : assertFails(read));
  });
  it('someone who already had free stages (eligible false) gets nothing from them', async () => {
    await seed('access/alice', { ...accessDoc(Date.now()), eligible: false });
    await seed('foodMicros/x', { ironMg: 1 });
    await assertFails(getDoc(doc(alice(), 'foodMicros/x')));
  });
});

describe('profile photo URL', () => {
  it('may only point at the user own profile file', async () => {
    const own = 'https://firebasestorage.googleapis.com/v0/b/fit-me1.firebasestorage.app/o/users%2Falice%2Fprofile%2Favatar-1794900000000.jpg?alt=media&token=abc';
    await assertSucceeds(setDoc(doc(alice(), 'users/alice'), { uid: 'alice', photoURL: own, photoPath: 'users/alice/profile/avatar-1794900000000.jpg' }));
    await assertSucceeds(updateDoc(doc(alice(), 'users/alice'), { photoURL: null, photoPath: null }));
    await assertFails(updateDoc(doc(alice(), 'users/alice'), { photoURL: own.replace('users%2Falice', 'users%2Fbob') }));
    await assertFails(updateDoc(doc(alice(), 'users/alice'), { photoURL: 'https://evil.example.com/x.jpg' }));
    await assertFails(updateDoc(doc(alice(), 'users/alice'), { photoPath: 'users/bob/profile/avatar-1794900000000.jpg' }));
  });
});

describe('device summaries (healthDaily)', () => {
  it('owner can create and update a daily summary; others cannot read it', async () => {
    const ref = doc(alice(), 'users/alice/healthDaily/device-2026-11-21');
    await assertSucceeds(setDoc(ref, record('alice', 'device-2026-11-21', { source: 'device', steps: 8000, heartRateAvg: 72 })));
    await assertSucceeds(updateDoc(ref, { steps: 9000, updatedAt: Timestamp.now() }));
    await assertFails(getDoc(doc(bob(), 'users/alice/healthDaily/device-2026-11-21')));
  });
});

describe('testimonials', () => {
  beforeEach(async () => {
    await seed('testimonials/t1', { id: 't1', uid: 'alice', status: 'pending', testimonial: 'x' });
    await seed('publicTestimonials/t2', { id: 't2', displayName: 'Ravi', testimonial: 'Great' });
  });
  it('pending submissions: the author and staff only, never public', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'testimonials/t1')));
    await assertSucceeds(getDoc(doc(staffCtx('mod', 'moderator'), 'testimonials/t1')));
    await assertFails(getDoc(doc(bob(), 'testimonials/t1')));
    await assertFails(getDoc(doc(anon(), 'testimonials/t1')));
    await assertFails(getDocs(collection(anon(), 'testimonials')));
  });
  it('nobody writes submissions from a client (Cloud Functions validate and publish)', async () => {
    await assertFails(setDoc(doc(alice(), 'testimonials/t3'), { uid: 'alice', status: 'approved' }));
    await assertFails(updateDoc(doc(alice(), 'testimonials/t1'), { status: 'approved' }));
    await assertFails(setDoc(doc(staffCtx('adm', 'admin'), 'publicTestimonials/t9'), { id: 't9' }));
  });
  it('approved copies are public', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'publicTestimonials/t2')));
    await assertSucceeds(getDocs(collection(anon(), 'publicTestimonials')));
  });
});

describe('admin data', () => {
  it('activity log: staff read, nobody writes, changes or deletes', async () => {
    await seed('adminLogs/l1', { action: 'x' });
    await assertSucceeds(getDoc(doc(staffCtx('mod', 'moderator'), 'adminLogs/l1')));
    await assertFails(getDoc(doc(alice(), 'adminLogs/l1')));
    await assertFails(setDoc(doc(staffCtx('sa', 'superAdmin'), 'adminLogs/l2'), { action: 'forged' }));
    await assertFails(updateDoc(doc(staffCtx('sa', 'superAdmin'), 'adminLogs/l1'), { action: 'changed' }));
    await assertFails(deleteDoc(doc(staffCtx('sa', 'superAdmin'), 'adminLogs/l1')));
  });
  it('a made-up role claim gives no staff access', async () => {
    await seed('adminLogs/l1', { action: 'x' });
    await assertFails(getDoc(doc(staffCtx('x', 'owner'), 'adminLogs/l1')));
  });
  it('config, staff list, suggestions: staff read only; config writes only through Functions', async () => {
    await seed('staff/s1', { role: 'admin' });
    await seed('foodSuggestions/f1', { status: 'pending' });
    await assertSucceeds(getDoc(doc(staffCtx('mod', 'moderator'), 'staff/s1')));
    await assertSucceeds(getDoc(doc(staffCtx('mod', 'moderator'), 'foodSuggestions/f1')));
    await assertFails(getDoc(doc(alice(), 'foodSuggestions/f1')));
    await assertFails(setDoc(doc(staffCtx('sa', 'superAdmin'), 'appConfig/pricing'), { version: 99 }));
    await assertFails(setDoc(doc(staffCtx('sa', 'superAdmin'), 'staff/alice'), { role: 'superAdmin' }));
  });
  it('trial registry and user status cannot be written by clients', async () => {
    await assertFails(setDoc(doc(alice(), 'trialRegistry/abc'), { uid: 'alice' }));
    await assertFails(setDoc(doc(alice(), 'userStatus/alice'), { disabled: false }));
    await seed('userStatus/alice', { disabled: true });
    await assertSucceeds(getDoc(doc(alice(), 'userStatus/alice')));
  });
  it('wearable links and server config are server-only (no client read or write, not even staff)', async () => {
    await seed('wearableLinks/alice', { uid: 'alice', owUserId: 'ow-1' });
    await seed('serverConfig/openWearables', { baseUrl: 'https://ow.example' });
    await assertFails(getDoc(doc(alice(), 'wearableLinks/alice')));
    await assertFails(setDoc(doc(alice(), 'wearableLinks/alice'), { owUserId: 'other' }));
    await assertFails(getDoc(doc(staffCtx('sa', 'superAdmin'), 'serverConfig/openWearables')));
    await assertFails(setDoc(doc(alice(), 'serverConfig/openWearables'), { baseUrl: 'https://evil.example' }));
  });
  it('cloud wearable days are readable only by their owner', async () => {
    await seed('users/alice/healthDaily/cloud-2026-11-20', { uid: 'alice', steps: 9000 });
    await assertSucceeds(getDoc(doc(alice(), 'users/alice/healthDaily/cloud-2026-11-20')));
    await assertFails(getDoc(doc(bob(), 'users/alice/healthDaily/cloud-2026-11-20')));
  });
});
