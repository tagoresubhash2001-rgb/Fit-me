import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions/v2';
import { z } from 'zod';
import { db } from '../lib/admin';
import { localized } from '../lib/appConfig';

/**
 * Admin notifications: an in-app inbox entry for every targeted user (users/{uid}/inbox) plus a push message to
 * the devices that registered for push (users/{uid}/settings/push.tokens). Audience: everyone, one country, one
 * plan or one user. Scheduled ones are delivered by the jobs runner (scripts/run-jobs.ts).
 */
export const NotificationInput = z.object({
  audience: z.enum(['all', 'country', 'plan', 'user']),
  /** Country code, plan id or uid for the matching audience. */
  value: z.string().max(128).nullable().default(null),
  title: z.record(z.string(), z.string().min(1).max(80)),
  body: z.record(z.string(), z.string().min(1).max(400)),
  sendAt: z.string().datetime({ offset: true }).nullable().default(null),
  push: z.boolean().default(true),
}).refine((v) => v.audience === 'all' || !!v.value, { message: 'value required for this audience', path: ['value'] });
export type NotificationInput = z.infer<typeof NotificationInput>;

const MAX_USERS = 20000;

async function audienceUids(n: NotificationInput): Promise<string[]> {
  if (n.audience === 'user') return [n.value!];
  if (n.audience === 'country') return (await db().collection('users').where('country', '==', n.value).select().limit(MAX_USERS).get()).docs.map((d) => d.id);
  if (n.audience === 'plan') {
    if (n.value === 'free') {
      const all = (await db().collection('users').select().limit(MAX_USERS).get()).docs.map((d) => d.id);
      const paid = new Set((await db().collection('entitlements').where('status', 'in', ['trialing', 'active', 'grace', 'cancelled']).select().get()).docs.map((d) => d.id));
      return all.filter((u) => !paid.has(u));
    }
    return (await db().collection('entitlements').where('plan', '==', n.value).where('status', 'in', ['trialing', 'active', 'grace', 'cancelled']).select().get()).docs.map((d) => d.id);
  }
  return (await db().collection('users').select().limit(MAX_USERS).get()).docs.map((d) => d.id);
}

/** Delivers notifications/{id} now. Idempotent per user (inbox id = notification id). */
export async function deliverNotification(id: string): Promise<{ recipients: number; pushed: number; pushFailed: number }> {
  const ref = db().doc(`notifications/${id}`);
  const snap = await ref.get();
  const n = NotificationInput.parse({ ...snap.data(), sendAt: null });
  const uids = await audienceUids(n);
  let pushed = 0;
  let pushFailed = 0;
  for (let i = 0; i < uids.length; i += 400) {
    const chunk = uids.slice(i, i + 400);
    const batch = db().batch();
    for (const uid of chunk) batch.set(db().doc(`users/${uid}/inbox/${id}`), { kind: 'admin', title: n.title, body: n.body, createdAt: FieldValue.serverTimestamp(), readAt: null }, { merge: true });
    await batch.commit();
    if (!n.push) continue;
    const pushes = await db().getAll(...chunk.map((u) => db().doc(`users/${u}/settings/push`)));
    const langs = await db().getAll(...chunk.map((u) => db().doc(`users/${u}`)));
    for (let j = 0; j < chunk.length; j++) {
      const tokens = (pushes[j].get('tokens') as string[] | undefined) ?? [];
      if (!tokens.length) continue;
      const lang = String(langs[j].get('language') ?? 'en');
      try {
        const r = await getMessaging().sendEachForMulticast({ tokens, notification: { title: localized(n.title, lang) ?? 'FitMe', body: localized(n.body, lang) ?? '' }, data: { type: 'admin', id } });
        pushed += r.successCount;
        pushFailed += r.failureCount;
      } catch (e) {
        pushFailed += tokens.length;
        logger.warn('push failed', { id, e: String(e) });
      }
    }
  }
  await ref.update({ status: 'sent', sentAt: Timestamp.now(), recipients: uids.length, pushed, pushFailed });
  return { recipients: uids.length, pushed, pushFailed };
}

/** Scheduled notifications that are due (run by the jobs runner). */
export async function deliverDue(nowMs = Date.now()): Promise<number> {
  const due = await db().collection('notifications').where('status', '==', 'scheduled').where('sendAt', '<=', new Date(nowMs).toISOString()).limit(20).get();
  for (const d of due.docs) {
    await d.ref.update({ status: 'sending' });
    await deliverNotification(d.id).catch(async (e) => {
      logger.error('scheduled notification failed', { id: d.id, e: String(e) });
      await d.ref.update({ status: 'failed', error: String(e).slice(0, 300) });
    });
  }
  return due.size;
}
