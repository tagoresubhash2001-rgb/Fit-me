/**
 * Hourly jobs without Cloud Scheduler (no Scheduler permission and no extra cost): run by the GitHub Actions
 * workflow .github/workflows/jobs.yml with the deploy service account.
 *   - Access-stage reminders 3 days and 1 day before the Welcome Unlock or the free trial ends (once each).
 *   - Store-trial reminders (entitlements in "trialing").
 *   - Scheduled admin notifications that are due.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=<key> node lib/scripts/run-jobs.js --project fit-me1
 */
import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { stageAt, stageReminderDue } from '../lib/access';
import { toRecord, type AccessDoc } from '../account/access';
import { deliverDue } from '../admin/notify';
import { storeTrialReminders } from '../billing/reminders';
import { freeLaunchFor } from '../lib/policy';
import { AccessPolicy } from '../lib/policySchema';

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

const TEXT = {
  welcome: { 3: 'Your Welcome Unlock ends in 3 days. Your free trial starts after that.', 1: 'Your Welcome Unlock ends tomorrow. Your free trial starts after that.' },
  trial: { 3: 'Your free trial ends in 3 days. Choose a plan to keep your premium features.', 1: 'Your free trial ends tomorrow. Choose a plan to keep your premium features.' },
} as const;

export async function stageReminders(nowMs = Date.now()): Promise<number> {
  const db = getFirestore();
  const policy = AccessPolicy.parse((await db.doc('appConfig/policy').get()).data() ?? {});
  const soon = Timestamp.fromMillis(nowMs + 4 * 86_400_000);
  const now = Timestamp.fromMillis(nowMs);
  const [w, t] = await Promise.all([
    db.collection('access').where('eligible', '==', true).where('welcomeEndsAt', '>', now).where('welcomeEndsAt', '<=', soon).get(),
    db.collection('access').where('eligible', '==', true).where('trialEndsAt', '>', now).where('trialEndsAt', '<=', soon).get(),
  ]);
  let sent = 0;
  const seen = new Set<string>();
  for (const doc of [...w.docs, ...t.docs]) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);
    const data = doc.data() as AccessDoc;
    const info = stageAt(toRecord(data), nowMs);
    const due = stageReminderDue(info);
    if (!due || data.remindersSent?.[due.key]) continue;
    const profile = await db.doc(`users/${doc.id}`).get();
    // During Free Launch Mode nothing ends for this user, so no "ends soon" message.
    if (freeLaunchFor(policy, profile.get('country') as string | undefined)) continue;
    const stage = info.stage as 'welcome' | 'trial';
    const body = TEXT[stage][due.daysLeft];
    await db.doc(`users/${doc.id}/inbox/stage-${due.key}`).set({ kind: 'stage', title: { en: 'FitMe' }, body: { en: body }, createdAt: FieldValue.serverTimestamp(), readAt: null });
    const tokens = ((await db.doc(`users/${doc.id}/settings/push`).get()).get('tokens') as string[] | undefined) ?? [];
    if (tokens.length) await getMessaging().sendEachForMulticast({ tokens, notification: { title: 'FitMe', body }, data: { type: 'stage_ending' } }).catch(() => null);
    await doc.ref.update({ [`remindersSent.${due.key}`]: true });
    sent++;
  }
  return sent;
}

async function main() {
  const project = arg('project');
  if (!project) throw new Error('--project is required');
  // lib/admin (imported by the job modules) may already have created the default app from the environment.
  if (!getApps().length) initializeApp({ projectId: project });
  const reminders = await stageReminders();
  const notifications = await deliverDue();
  const storeTrials = await storeTrialReminders();
  console.log(JSON.stringify({ reminders, storeTrials, notifications, at: new Date().toISOString() }));
}

if (require.main === module) main().catch((e) => {
  console.error(e);
  process.exit(1);
});
