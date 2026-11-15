import { useEffect, useState } from 'react';
import { subscribeRange, subscribeAll, type RecordCollection } from './records';
import { useSession } from './session';

export interface LiveState<T> {
  rows: T[];
  loading: boolean;
  error: Error | null;
}

/** React hook: live records for a local date range. Re-subscribes when the range or user changes. */
export function useRecords<T>(c: RecordCollection, from: string, to: string): LiveState<T> {
  const uid = useSession((s) => s.user?.uid);
  const [state, setState] = useState<LiveState<T>>({ rows: [], loading: true, error: null });
  useEffect(() => {
    if (!uid) return;
    setState((s) => ({ ...s, loading: true }));
    return subscribeRange<T>(
      c,
      from,
      to,
      (rows) => setState({ rows, loading: false, error: null }),
      (error) => setState({ rows: [], loading: false, error }),
    );
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
