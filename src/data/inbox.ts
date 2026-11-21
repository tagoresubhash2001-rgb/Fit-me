import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSession } from './session';

export interface InboxItem {
  id: string;
  kind: string;
  title: Record<string, string>;
  body: Record<string, string>;
  createdAt: number | null;
  readAt: number | null;
}

/** The member's inbox (admin messages, support replies, reminders), newest first, live. */
export function useInbox(): InboxItem[] {
  const uid = useSession((s) => s.user?.uid);
  const [items, setItems] = useState<InboxItem[]>([]);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(collection(db(), `users/${uid}/inbox`), orderBy('createdAt', 'desc'), limit(50)),
      (snap) =>
        setItems(
          snap.docs.map((d) => {
            const x = d.data();
            return { id: d.id, kind: String(x.kind ?? 'admin'), title: x.title ?? {}, body: x.body ?? {}, createdAt: x.createdAt?.toMillis?.() ?? null, readAt: x.readAt?.toMillis?.() ?? null };
          }),
        ),
      () => setItems([]),
    );
  }, [uid]);
  return items;
}

export const markRead = (uid: string, id: string) => updateDoc(doc(db(), `users/${uid}/inbox/${id}`), { readAt: serverTimestamp() });
export const removeInboxItem = (uid: string, id: string) => deleteDoc(doc(db(), `users/${uid}/inbox/${id}`));
