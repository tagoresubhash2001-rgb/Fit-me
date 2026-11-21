import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Announcement, liveFor } from '../domain/appConfig';
import { useSession } from './session';

/** Live in-app announcements for this member (dates, country and plan targeting applied). */
export function useAnnouncements(): Array<Announcement & { id: string }> {
  const user = useSession((s) => s.user);
  const country = useSession((s) => s.profile?.country);
  const plan = useSession((s) => s.plan);
  const [rows, setRows] = useState<Array<Announcement & { id: string }>>([]);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      collection(db(), 'announcements'),
      (snap) =>
        setRows(
          snap.docs
            .map((d) => ({ id: d.id, parsed: Announcement.safeParse(d.data()) }))
            .filter((x) => x.parsed.success)
            .map((x) => ({ id: x.id, ...x.parsed.data! })),
        ),
      () => setRows([]),
    );
  }, [user]);
  const now = Date.now();
  return rows.filter((a) => liveFor(a, now, country) && (a.plans.length === 0 || a.plans.includes(plan)));
}
