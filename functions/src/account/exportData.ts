import { onCall } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../lib/admin';
import { callableOptions, requireAuth } from '../lib/callable';

/** Converts Firestore values into plain JSON (timestamps → ISO strings). */
export function toPlain(v: unknown): unknown {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(toPlain);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toPlain(x)]));
  return v;
}

/** Data export (GDPR art. 20, DPDP): returns every document the user owns as JSON. */
export const exportData = onCall(callableOptions({ timeoutSeconds: 120 }), async (req) => {
  const uid = requireAuth(req);
  const userRef = db().doc(`users/${uid}`);
  const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), uid };
  const profile = await userRef.get();
  out.profile = profile.exists ? toPlain(profile.data()) : null;
  const collections = await userRef.listCollections();
  for (const c of collections) {
    const snap = await c.get();
    out[c.id] = snap.docs.map((d) => ({ id: d.id, ...(toPlain(d.data()) as object) }));
    if (c.id === 'aiThreads') {
      for (const t of snap.docs) {
        const msgs = await t.ref.collection('messages').orderBy('createdAt').get();
        (out[`aiThreads/${t.id}/messages`] = msgs.docs.map((m) => toPlain(m.data())));
      }
    }
  }
  const ent = await db().doc(`entitlements/${uid}`).get();
  out.entitlement = ent.exists ? toPlain(ent.data()) : null;
  return out;
});
