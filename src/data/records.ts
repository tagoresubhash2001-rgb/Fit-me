import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDocs,
  limit as qLimit,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { localDate, localMinutes } from '../domain/dates';
import type { LogCollection } from '../domain/models';
import { currentUid, useSession } from './session';

export type RecordCollection = LogCollection | 'plans' | 'schedule' | 'habits' | 'savedMeals' | 'recipes' | 'customFoods' | 'healthDaily';
type Source = 'manual' | 'ai' | 'device' | 'import';

export const userTz = () => useSession.getState().profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
export const today = () => localDate(Date.now(), userTz());

export function newId(c: RecordCollection): string {
  return doc(collection(db(), `users/${currentUid()}/${c}`)).id;
}

/**
 * Creates a record with the required base fields (PRD section 13). Writes go to the local cache
 * first and sync when online, so this resolves immediately offline.
 */
export async function createRecord<T extends object>(
  c: RecordCollection,
  data: T,
  opts: { date?: string; source?: Source; status?: string; id?: string } = {},
) {
  const uid = currentUid();
  const id = opts.id ?? newId(c);
  const rec = {
    // Local time of day (minutes) so entries can show and edit their time; callers may override.
    timeMinutes: localMinutes(Date.now(), userTz()),
    ...data,
    id,
    uid,
    date: opts.date ?? today(),
    tz: userTz(),
    source: opts.source ?? 'manual',
    status: opts.status ?? 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  void setDoc(doc(db(), `users/${uid}/${c}/${id}`), rec);
  return id;
}

/**
 * Create-or-update for records with a stable id (device sync: one record per day or per platform sample).
 * Updating keeps uid and createdAt, which Security Rules require, so a second sync does not fail.
 */
export async function upsertRecord<T extends object>(c: RecordCollection, id: string, data: T, opts: { date: string; source: Source }) {
  const uid = currentUid();
  const ref = doc(db(), `users/${uid}/${c}/${id}`);
  let exists = false;
  try {
    exists = (await getDoc(ref)).exists();
  } catch {
    /* offline and not cached: treat as new */
  }
  if (exists) await updateDoc(ref, { ...data, status: 'active', updatedAt: serverTimestamp() });
  else
    await setDoc(ref, {
      ...data,
      id,
      uid,
      date: opts.date,
      tz: userTz(),
      source: opts.source,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
}

export async function updateRecord(c: RecordCollection, id: string, patch: Record<string, unknown>) {
  void updateDoc(doc(db(), `users/${currentUid()}/${c}/${id}`), { ...patch, updatedAt: serverTimestamp() });
}

/** Soft delete so it can be undone; deleted records are hidden everywhere. */
export const softDelete = (c: RecordCollection, id: string) => updateRecord(c, id, { status: 'deleted' });
export const restore = (c: RecordCollection, id: string, status = 'active') => updateRecord(c, id, { status });

/** Live subscription to records between two local dates (inclusive), excluding deleted ones. */
export function subscribeRange<T>(
  c: RecordCollection,
  from: string,
  to: string,
  cb: (rows: T[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const q = query(collection(db(), `users/${currentUid()}/${c}`), where('date', '>=', from), where('date', '<=', to));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => d.data() as T & { status: string }).filter((r) => r.status !== 'deleted')),
    (e) => onError?.(e),
  );
}

export function subscribeAll<T>(c: RecordCollection, cb: (rows: T[]) => void, max = 200): Unsubscribe {
  const q = query(collection(db(), `users/${currentUid()}/${c}`), orderBy('date', 'desc'), qLimit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as T & { status: string }).filter((r) => r.status !== 'deleted')));
}

export async function fetchRange<T>(c: RecordCollection, from: string, to: string): Promise<T[]> {
  const q = query(collection(db(), `users/${currentUid()}/${c}`), where('date', '>=', from), where('date', '<=', to));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as T & { status: string }).filter((r) => r.status !== 'deleted');
}
