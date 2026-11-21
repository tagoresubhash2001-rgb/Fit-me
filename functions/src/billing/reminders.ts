import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';
import { db } from '../lib/admin';
import { reminderDue } from './billing';
import { readEntitlement } from './store';

/**
 * Daily: users whose trial ends within three days get one reminder (PRD section 2): an in-app
 * notification record, plus a push message when the device registered for push. Email needs a mail
 * provider and is listed as pending in docs/BILLING_SETUP.md.
 */
export const trialReminders = onSchedule({ schedule: 'every day 10:00', timeZone: 'Asia/Kolkata', region: 'asia-south1', maxInstances: 1 }, async () => {
  const now = Date.now();
  const snap = await db()
    .collection('entitlements')
    .where('status', '==', 'trialing')
    .where('trialEndsAt', '<=', Timestamp.fromMillis(now + 3 * 86400000))
    .where('trialEndsAt', '>', Timestamp.fromMillis(now))
    .get();
  let sent = 0;
  for (const doc of snap.docs) {
    const uid = doc.id;
    const ent = readEntitlement(doc.data());
    const end = ent?.trialEndsAt ?? 0;
    const billing = db().doc(`billing/${uid}`);
    const already = (await billing.get()).get('reminderSentFor') === end;
    if (!reminderDue(ent, now, already)) continue;
    await db().doc(`users/${uid}/notifications/trial-${end}`).set({
      id: `trial-${end}`,
      uid,
      type: 'trial_ending',
      plan: ent?.plan,
      trialEndsAt: Timestamp.fromMillis(end),
      createdAt: FieldValue.serverTimestamp(),
      read: false,
    });
    const tokens = ((await db().doc(`users/${uid}/settings/push`).get()).get('tokens') as string[] | undefined) ?? [];
    if (tokens.length) {
      await getMessaging()
        .sendEachForMulticast({ tokens, notification: { title: 'FitMe', body: 'Your free trial ends in 3 days. You can cancel anytime in Settings.' }, data: { type: 'trial_ending' } })
        .catch((e) => logger.warn('push failed', { uid, e: String(e) }));
    }
    await billing.set({ reminderSentFor: end }, { merge: true });
    sent++;
  }
  logger.info('trial reminders', { candidates: snap.size, sent });
});
