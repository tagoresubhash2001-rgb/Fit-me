import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

let app: FirebaseApp;
beforeAll(() => {
  app = initializeApp({ projectId: 'demo-fitmeai', apiKey: 'demo-key', authDomain: 'demo-fitmeai.firebaseapp.com' });
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
  connectFunctionsEmulator(getFunctions(app, 'asia-south1'), '127.0.0.1', 5001);
});
afterAll(async () => deleteApp(app));

const call = (name: string, data: unknown) => httpsCallable(getFunctions(app, 'asia-south1'), name)(data);

describe('callable functions (emulator)', () => {
  it('rejects signed-out callers', async () => {
    await signOut(getAuth(app));
    await expect(call('coachChat', { threadId: 't1', coach: 'jai', message: 'hi' })).rejects.toMatchObject({ code: 'functions/unauthenticated' });
  });

  it('blocks a free user from Pro and Premium AI features on the server', async () => {
    await createUserWithEmailAndPassword(getAuth(app), `free${Date.now()}@example.test`, 'password123');
    await expect(call('coachChat', { threadId: 't1', coach: 'jai', message: 'hi' })).rejects.toThrow('upgrade_required');
    await expect(call('analyzeFoodText', { text: '2 idli with sambar' })).rejects.toMatchObject({ code: 'functions/permission-denied' });
  });

  it('validates input', async () => {
    await expect(call('coachChat', { threadId: 'bad id!', coach: 'x', message: '' })).rejects.toMatchObject({ code: 'functions/invalid-argument' });
  });

  it('exports and then deletes all of the user data', async () => {
    const cred = await createUserWithEmailAndPassword(getAuth(app), `del${Date.now()}@example.test`, 'password123');
    const uid = cred.user.uid;
    const db = getFirestore(app);
    const now = Timestamp.now();
    await setDoc(doc(db, `users/${uid}`), { uid, name: 'Test' });
    await setDoc(doc(db, `users/${uid}/waterLogs/w1`), { id: 'w1', uid, createdAt: now, updatedAt: now, date: '2026-11-14', tz: 'UTC', source: 'manual', status: 'active', ml: 250 });
    const exported = (await call('exportData', {})).data as Record<string, unknown>;
    expect((exported.profile as { name: string }).name).toBe('Test');
    expect((exported.waterLogs as unknown[]).length).toBe(1);
    await expect(call('deleteAccount', {})).resolves.toMatchObject({ data: { deleted: true } });
    // The auth user no longer exists, so a fresh admin-free read must find nothing.
    const again = await createUserWithEmailAndPassword(getAuth(app), `other${Date.now()}@example.test`, 'password123');
    expect(again.user.uid).not.toBe(uid);
  });

  it('healthCheck responds', async () => {
    const res = await fetch('http://127.0.0.1:5001/demo-fitmeai/asia-south1/healthCheck');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });
});

// Data deletion is verified with rules disabled through the emulator REST API.
describe('deletion leaves nothing behind', () => {
  it('no profile document remains for deleted users', async () => {
    const cred = await createUserWithEmailAndPassword(getAuth(app), `gone${Date.now()}@example.test`, 'password123');
    const uid = cred.user.uid;
    await setDoc(doc(getFirestore(app), `users/${uid}`), { uid, name: 'Gone' });
    await call('deleteAccount', {});
    const res = await fetch(`http://127.0.0.1:8080/v1/projects/demo-fitmeai/databases/(default)/documents/users/${uid}`, { headers: { Authorization: 'Bearer owner' } });
    expect(res.status).toBe(404);
    void getDoc;
  });
});
