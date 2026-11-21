import { applicationDefault } from 'firebase-admin/app';
import { HttpsError } from 'firebase-functions/v2/https';

/**
 * Integration keys, managed from the admin dashboard (API configuration). Values live only in Google Secret
 * Manager: they are written through this module, never stored in Firestore, never returned to the browser and never
 * logged. The dashboard only sees whether a key is set, its version, when it changed and a test result.
 */
export const SECRET_NAMES = ['GEMINI_API_KEY', 'CASHFREE_CLIENT_ID', 'CASHFREE_CLIENT_SECRET', 'REVENUECAT_WEBHOOK_AUTH', 'REVENUECAT_SECRET_KEY', 'OPEN_WEARABLES_API_KEY'] as const;
export type SecretName = (typeof SECRET_NAMES)[number];

const project = () => process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT ?? 'fit-me1';
const base = () => `https://secretmanager.googleapis.com/v1/projects/${project()}/secrets`;

async function sm(path: string, init: { method?: string; body?: unknown } = {}) {
  const { access_token } = await applicationDefault().getAccessToken();
  const r = await fetch(`${base()}${path}`, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(15000),
  });
  return r;
}

export interface SecretStatus {
  name: SecretName;
  set: boolean;
  version: string | null;
  updatedAt: string | null;
}

export async function secretStatus(name: SecretName): Promise<SecretStatus> {
  const r = await sm(`/${name}/versions?filter=state:ENABLED&pageSize=1`).catch(() => null);
  if (!r?.ok) return { name, set: false, version: null, updatedAt: null };
  const v = ((await r.json()) as { versions?: Array<{ name: string; createTime: string }> }).versions?.[0];
  return { name, set: !!v, version: v ? v.name.split('/').pop()! : null, updatedAt: v?.createTime ?? null };
}

export async function readSecret(name: SecretName): Promise<string> {
  const r = await sm(`/${name}/versions/latest:access`).catch(() => null);
  if (!r?.ok) return '';
  return Buffer.from(((await r.json()) as { payload: { data: string } }).payload.data, 'base64').toString('utf8').trim();
}

/** Adds a new version (older versions stay, so a bad key can be rolled back in the Cloud console). */
export async function setSecret(name: SecretName, value: string): Promise<SecretStatus> {
  const r = await sm(`/${name}:addVersion`, { method: 'POST', body: { payload: { data: Buffer.from(value.trim(), 'utf8').toString('base64') } } });
  if (r.status === 404) throw new HttpsError('failed-precondition', 'secret_missing', { name });
  if (r.status === 403) throw new HttpsError('failed-precondition', 'secret_no_access', { name });
  if (!r.ok) throw new HttpsError('internal', 'secret_write_failed', { status: r.status });
  return secretStatus(name);
}

/** Real connection test against each provider with the stored key. */
export async function testSecret(name: SecretName): Promise<{ ok: boolean; detail: string }> {
  const key = await readSecret(name);
  if (!key) return { ok: false, detail: 'not_set' };
  const t = AbortSignal.timeout(15000);
  try {
    switch (name) {
      case 'GEMINI_API_KEY': {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', { headers: { 'x-goog-api-key': key }, signal: t });
        return { ok: r.ok, detail: r.ok ? 'connected' : `http_${r.status}` };
      }
      case 'CASHFREE_CLIENT_SECRET':
      case 'CASHFREE_CLIENT_ID': {
        const id = name === 'CASHFREE_CLIENT_ID' ? key : await readSecret('CASHFREE_CLIENT_ID');
        const secret = name === 'CASHFREE_CLIENT_SECRET' ? key : await readSecret('CASHFREE_CLIENT_SECRET');
        if (!id || !secret) return { ok: false, detail: 'needs_id_and_secret' };
        const host = id.startsWith('TEST') ? 'https://sandbox.cashfree.com' : 'https://api.cashfree.com';
        const r = await fetch(`${host}/pg/orders/fitme-connection-test`, { headers: { 'x-client-id': id, 'x-client-secret': secret, 'x-api-version': '2023-08-01' }, signal: t });
        // 404 "order not found" proves the credentials were accepted; 401 means they were not.
        return { ok: r.status === 404 || r.ok, detail: r.status === 401 ? 'rejected' : `http_${r.status}` };
      }
      case 'REVENUECAT_SECRET_KEY': {
        const r = await fetch('https://api.revenuecat.com/v1/subscribers/fitme-connection-test', { headers: { Authorization: `Bearer ${key}` }, signal: t });
        return { ok: r.ok, detail: r.ok ? 'connected' : `http_${r.status}` };
      }
      case 'REVENUECAT_WEBHOOK_AUTH':
        return { ok: key.length >= 16, detail: key.length >= 16 ? 'stored (checked on each webhook)' : 'too_short' };
      case 'OPEN_WEARABLES_API_KEY':
        return { ok: true, detail: 'stored (backend not deployed)' };
    }
  } catch (e) {
    return { ok: false, detail: String((e as Error).name === 'TimeoutError' ? 'timeout' : (e as Error).message).slice(0, 80) };
  }
}
