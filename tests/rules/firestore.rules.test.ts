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

describe('store waitlist', () => {
  it('owner can join once with allowed fields only', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'storeWaitlist/alice'), { uid: 'alice', createdAt: now, country: 'IN', language: 'te' }));
    await assertFails(setDoc(doc(alice(), 'storeWaitlist/bob'), { uid: 'bob', createdAt: now }));
    await assertFails(setDoc(doc(bob(), 'storeWaitlist/bob'), { uid: 'bob', createdAt: now, email: 'x' }));
  });
});
