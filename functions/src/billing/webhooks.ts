import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { MAX_INSTANCES } from '../lib/callable';
import { cashfreeSignatureValid, cashfreeUid, fromCashfree, fromRevenueCat, revenueCatAuthorized, type CashfreeWebhook, type RevenueCatEvent } from './mappers';
import { applyBillingEvent, loadPricing } from './store';

/**
 * Secrets live only in Secret Manager. Until the owner stores the real values (docs/BILLING_SETUP.md) they
 * hold random placeholders, so every webhook call is rejected: nothing can grant a plan by accident.
 */
export const REVENUECAT_WEBHOOK_AUTH = defineSecret('REVENUECAT_WEBHOOK_AUTH');
export const CASHFREE_CLIENT_SECRET = defineSecret('CASHFREE_CLIENT_SECRET');

const opts = { region: 'asia-south1', maxInstances: MAX_INSTANCES, invoker: 'public' as const };

/** RevenueCat (App Store + Google Play) -> entitlements/{uid}. app_user_id is the Firebase uid. */
export const revenuecatWebhook = onRequest({ ...opts, secrets: [REVENUECAT_WEBHOOK_AUTH] }, async (req, res) => {
  if (req.method !== 'POST') return void res.status(405).send('method_not_allowed');
  if (!revenueCatAuthorized(req.get('authorization'), REVENUECAT_WEBHOOK_AUTH.value())) return void res.status(401).send('unauthorized');
  const e = (req.body?.event ?? null) as RevenueCatEvent | null;
  if (!e?.id || !e.app_user_id || e.app_user_id.startsWith('$RCAnonymousID')) return void res.status(200).send('ignored');
  const event = fromRevenueCat(e);
  if (event) await applyBillingEvent(e.app_user_id, event, `rc_${e.id}`);
  logger.info('revenuecat event', { type: e.type, applied: !!event, env: e.environment });
  res.status(200).send('ok');
});

/** Cashfree web subscriptions -> entitlements/{uid}. Signature checked against the raw body. */
export const cashfreeWebhook = onRequest({ ...opts, secrets: [CASHFREE_CLIENT_SECRET] }, async (req, res) => {
  if (req.method !== 'POST') return void res.status(405).send('method_not_allowed');
  const raw = req.rawBody?.toString('utf8') ?? '';
  if (!cashfreeSignatureValid(raw, req.get('x-webhook-timestamp'), req.get('x-webhook-signature'), CASHFREE_CLIENT_SECRET.value())) return void res.status(401).send('unauthorized');
  const w = JSON.parse(raw) as CashfreeWebhook;
  const uid = cashfreeUid(w);
  if (!uid) return void res.status(200).send('ignored');
  const event = fromCashfree(w, (await loadPricing()).trialDays);
  const id = `cf_${w.data?.subscription_details?.subscription_id ?? 'x'}_${w.type}_${w.event_time ?? ''}_${w.data?.payment?.payment_id ?? ''}`;
  if (event) await applyBillingEvent(uid, event, id);
  logger.info('cashfree event', { type: w.type, applied: !!event });
  res.status(200).send('ok');
});
