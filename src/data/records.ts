import {
  collection,
  doc,
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
import { localDate } from '../domain/dates';
import type { LogCollection } from '../domain/models';
import { currentUid, useSession } from './session';

export type RecordCollection = LogCollection | 'plans' | 'schedule' | 'habits' | 'savedMeals' | 'recipes' | 'customFoods';
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
