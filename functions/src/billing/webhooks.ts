import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { MAX_INSTANCES, LIGHT_CPU } from '../lib/callable';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../lib/admin';
import { cashfreeSignatureValid, cashfreeUid, fromCashfree, fromRevenueCat, paymentFromCashfree, paymentFromRevenueCat, revenueCatAuthorized, type CashfreeWebhook, type PaymentRecord, type RevenueCatEvent } from './mappers';
import { applyBillingEvent, loadPricing } from './store';

import { webhookSecret } from './secrets';

/** Webhook log (admin: Finance) and the payment record. A payment is created once; a refund only changes status. */
async function record(provider: string, type: string, eventId: string, applied: boolean, payment: PaymentRecord | null, uid: string | null) {
  await db().collection('webhookLogs').add({ provider, type, eventId, applied, uid, paymentId: payment?.id ?? null, at: FieldValue.serverTimestamp() });
  if (!payment) return;
  const ref = db().doc(`payments/${payment.id}`);
  await db().runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists) tx.create(ref, { ...payment, createdAt: FieldValue.serverTimestamp() });
    else if (payment.status === 'refunded' && s.get('status') !== 'refunded') tx.update(ref, { status: 'refunded', refundedAt: FieldValue.serverTimestamp() });
  });
}

const opts = { region: 'asia-south1', maxInstances: MAX_INSTANCES, cpu: LIGHT_CPU, invoker: 'public' as const };

/** RevenueCat (App Store + Google Play) -> entitlements/{uid}. app_user_id is the Firebase uid. */
export const revenuecatWebhook = onRequest(opts, async (req, res) => {
  if (req.method !== 'POST') return void res.status(405).send('method_not_allowed');
  const secret = await webhookSecret('REVENUECAT_WEBHOOK_AUTH');
  if (!secret) return void res.status(503).send('not_configured');
  if (!revenueCatAuthorized(req.get('authorization'), secret)) return void res.status(401).send('unauthorized');
  const e = (req.body?.event ?? null) as RevenueCatEvent | null;
  if (!e?.id || !e.app_user_id || e.app_user_id.startsWith('$RCAnonymousID')) return void res.status(200).send('ignored');
  const event = fromRevenueCat(e);
  if (event) await applyBillingEvent(e.app_user_id, event, `rc_${e.id}`);
  await record('revenuecat', e.type, e.id, !!event, paymentFromRevenueCat(e), e.app_user_id);
  logger.info('revenuecat event', { type: e.type, applied: !!event, env: e.environment });
  res.status(200).send('ok');
});

/** Cashfree web subscriptions -> entitlements/{uid}. Signature checked against the raw body. */
export const cashfreeWebhook = onRequest(opts, async (req, res) => {
  if (req.method !== 'POST') return void res.status(405).send('method_not_allowed');
  const raw = req.rawBody?.toString('utf8') ?? '';
  const secret = await webhookSecret('CASHFREE_CLIENT_SECRET');
  if (!secret) return void res.status(503).send('not_configured');
  if (!cashfreeSignatureValid(raw, req.get('x-webhook-timestamp'), req.get('x-webhook-signature'), secret)) return void res.status(401).send('unauthorized');
  const w = JSON.parse(raw) as CashfreeWebhook;
  const uid = cashfreeUid(w);
  if (!uid) return void res.status(200).send('ignored');
  const event = fromCashfree(w, (await loadPricing()).trialDays);
  const id = `cf_${w.data?.subscription_details?.subscription_id ?? 'x'}_${w.type}_${w.event_time ?? ''}_${w.data?.payment?.payment_id ?? ''}`;
  if (event) await applyBillingEvent(uid, event, id);
  await record('cashfree', w.type, id, !!event, paymentFromCashfree(w, uid), uid);
  logger.info('cashfree event', { type: w.type, applied: !!event });
  res.status(200).send('ok');
});
