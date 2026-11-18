import { useEffect, useState } from 'react';
import { subscribeRange, subscribeAll, type RecordCollection } from './records';
import { useSession } from './session';

export interface LiveState<T> {
  rows: T[];
  loading: boolean;
  error: Error | null;
}

interface Shared {
  state: LiveState<unknown>;
  subs: Set<(s: LiveState<unknown>) => void>;
  unsub: () => void;
  linger?: ReturnType<typeof setTimeout>;
}
const shared = new Map<string, Shared>();

/**
 * One Firestore listener per user + collection + date range, shared by every component that asks for it
 * (Home, the Nova Bar and Food all read today's food logs). A listener stays open 30 s after its last
 * reader leaves, so going back to a screen shows data at once instead of a skeleton.
 */
function subscribeShared<T>(uid: string, c: RecordCollection, from: string, to: string, cb: (s: LiveState<T>) => void): () => void {
  const key = `${uid}|${c}|${from}|${to}`;
  let entry = shared.get(key);
  if (!entry) {
    const e: Shared = { state: { rows: [], loading: true, error: null }, subs: new Set(), unsub: () => {} };
    const emit = (state: LiveState<unknown>) => {
      e.state = state;
      e.subs.forEach((f) => f(state));
    };
    e.unsub = subscribeRange<unknown>(c, from, to, (rows) => emit({ rows, loading: false, error: null }), (error) => emit({ rows: [], loading: false, error }));
    shared.set(key, e);
    entry = e;
  }
  const en = entry;
  if (en.linger) clearTimeout(en.linger);
  en.linger = undefined;
  const f = cb as (s: LiveState<unknown>) => void;
  en.subs.add(f);
  if (!en.state.loading || en.state.rows.length) cb(en.state as LiveState<T>);
  return () => {
    en.subs.delete(f);
    if (en.subs.size === 0)
      en.linger = setTimeout(() => {
        if (en.subs.size) return;
        en.unsub();
        shared.delete(key);
      }, 30000);
  };
}

/** Close every shared listener (sign-out). */
export function closeSharedListeners() {
  shared.forEach((e) => {
    if (e.linger) clearTimeout(e.linger);
    e.unsub();
  });
  shared.clear();
}

/** React hook: live records for a local date range. Re-subscribes when the range or user changes. */
export function useRecords<T>(c: RecordCollection, from: string, to: string): LiveState<T> {
  const uid = useSession((s) => s.user?.uid);
  const [state, setState] = useState<LiveState<T>>({ rows: [], loading: true, error: null });
  useEffect(() => {
    if (!uid) return;
    setState((s) => (s.loading ? s : { ...s, loading: true }));
    return subscribeShared<T>(uid, c, from, to, setState);
  }, [uid, c, from, to]);
  return state;
}

export function useAllRecords<T>(c: RecordCollection, max = 200): LiveState<T> {
  const uid = useSession((s) => s.user?.uid);
  const [state, setState] = useState<LiveState<T>>({ rows: [], loading: true, error: null });
  useEffect(() => {
    if (!uid) return;
    return subscribeAll<T>(c, (rows) => setState({ rows, loading: false, error: null }), max);
  }, [uid, c, max]);
  return state;
}
