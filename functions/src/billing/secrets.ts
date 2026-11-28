import { applicationDefault } from 'firebase-admin/app';
import { logger } from 'firebase-functions';
import { isEmulator } from '../lib/admin';

/**
 * Webhook secrets are read from Secret Manager when a webhook is called (cached for five minutes), so the
 * functions deploy before the owner has created them. Missing secret or missing access = empty string,
 * and the webhook then rejects every call: nothing can grant a plan until billing is configured.
 * Setup (secret names and the access grant): docs/BILLING_SETUP.md.
 */
const cache = new Map<string, { value: string; at: number }>();

export async function webhookSecret(name: 'REVENUECAT_WEBHOOK_AUTH' | 'CASHFREE_CLIENT_SECRET' | 'CASHFREE_APP_ID' | 'CASHFREE_ENV' | 'OPEN_WEARABLES_API_KEY'): Promise<string> {
  if (isEmulator()) return process.env[name] ?? '';
  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.value;
  let value = '';
  try {
    const project = process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT;
    const { access_token } = await applicationDefault().getAccessToken();
    const r = await fetch(`https://secretmanager.googleapis.com/v1/projects/${project}/secrets/${name}/versions/latest:access`, { headers: { Authorization: `Bearer ${access_token}` } });
    if (r.ok) value = Buffer.from(((await r.json()) as { payload: { data: string } }).payload.data, 'base64').toString('utf8').trim();
    else logger.warn('webhook secret not available', { name, status: r.status });
  } catch (e) {
    logger.warn('webhook secret lookup failed', { name, e: String(e) });
  }
  cache.set(name, { value, at: Date.now() });
  return value;
}
