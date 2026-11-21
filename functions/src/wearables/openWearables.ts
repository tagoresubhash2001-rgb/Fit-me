import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../lib/admin';
import { callableOptions, requireAuth } from '../lib/callable';
import { webhookSecret } from '../billing/secrets';

/**
 * Cloud wearables through a self-hosted Open Wearables deployment (MIT, github.com/the-momentum/open-wearables).
 * Open Wearables holds the provider apps and OAuth tokens (Garmin, Oura, WHOOP, Polar, Suunto, Strava, Google
 * Health / Fitbit, Withings); FitMe talks to it only from these functions, maps each Firebase user to an Open
 * Wearables user (external_user_id = uid) and writes normalised daily summaries into Firestore, so the app reads one
 * data source. Until the deployment exists (serverConfig/openWearables.baseUrl + OPEN_WEARABLES_API_KEY in Secret
 * Manager), every call reports "not_configured" and the app shows the providers as not available yet.
 */
export const CLOUD_PROVIDERS = ['garmin', 'oura', 'whoop', 'polar', 'suunto', 'strava', 'google', 'withings'] as const;
export type CloudProvider = (typeof CLOUD_PROVIDERS)[number];

interface OwConfig {
  baseUrl: string;
  apiKey: string;
}

export async function owConfig(): Promise<OwConfig | null> {
  const snap = await db().doc('serverConfig/openWearables').get();
  const baseUrl = String(snap.get('baseUrl') ?? '').replace(/\/+$/, '');
  if (!/^https:\/\//.test(baseUrl)) return null;
  const apiKey = await webhookSecret('OPEN_WEARABLES_API_KEY');
  return apiKey ? { baseUrl, apiKey } : null;
}

export async function ow<T>(cfg: OwConfig, path: string, init: { method?: string; body?: unknown; query?: Record<string, string> } = {}): Promise<T> {
  const url = new URL(cfg.baseUrl + path);
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method: init.method ?? 'GET',
    headers: { 'X-Open-Wearables-API-Key': cfg.apiKey, 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`open_wearables_${res.status}`);
  return (res.status === 204 ? null : await res.json()) as T;
}

async function requireConfig(): Promise<OwConfig> {
  const cfg = await owConfig();
  if (!cfg) throw new HttpsError('failed-precondition', 'not_configured');
  return cfg;
}

/** The Open Wearables user for this Firebase user (created once; the mapping is server-only). */
async function owUser(cfg: OwConfig, uid: string): Promise<string> {
  const ref = db().doc(`wearableLinks/${uid}`);
  const known = (await ref.get()).get('owUserId') as string | undefined;
  if (known) return known;
  const found = await ow<{ items?: Array<{ id: string }> }>(cfg, '/api/v1/users', { query: { external_user_id: uid, limit: '1' } });
  let id = found.items?.[0]?.id;
  if (!id) id = (await ow<{ id: string }>(cfg, '/api/v1/users', { method: 'POST', body: { external_user_id: uid } })).id;
  await ref.set({ uid, owUserId: id, createdAt: FieldValue.serverTimestamp() });
  return id;
}

export const wearablesStatus = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  const cfg = await owConfig();
  if (!cfg) return { configured: false, providers: CLOUD_PROVIDERS.map((id) => ({ id, connected: false })) };
  try {
    const user = await owUser(cfg, uid);
    const conns = await ow<Array<{ provider: string; status?: string; last_synced_at?: string | null }>>(cfg, `/api/v1/users/${user}/connections`);
    return {
      configured: true,
      providers: CLOUD_PROVIDERS.map((id) => {
        const c = conns.find((x) => x.provider === id);
        return { id, connected: !!c && c.status !== 'revoked', lastSyncAt: c?.last_synced_at ? Date.parse(c.last_synced_at) : null };
      }),
    };
  } catch (e) {
    logger.warn('open wearables status failed', { error: (e as Error).message });
    throw new HttpsError('unavailable', 'wearables_unavailable');
  }
});

const ProviderInput = z.object({ provider: z.enum(CLOUD_PROVIDERS), returnUrl: z.string().url().max(300).optional() });

/** Returns the provider's sign-in page (OAuth through Open Wearables); the app opens it in the browser. */
export const wearablesConnect = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  const parsed = ProviderInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const cfg = await requireConfig();
  const user = await owUser(cfg, uid);
  const r = await ow<{ authorization_url: string }>(cfg, `/api/v1/oauth/${parsed.data.provider}/authorize`, { query: { user_id: user, ...(parsed.data.returnUrl ? { redirect_uri: parsed.data.returnUrl } : {}) } });
  if (!/^https:\/\//.test(r.authorization_url)) throw new HttpsError('unavailable', 'bad_authorize_url');
  return { url: r.authorization_url };
});

export const wearablesDisconnect = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  const parsed = ProviderInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const cfg = await requireConfig();
  await ow(cfg, `/api/v1/users/${await owUser(cfg, uid)}/connections/${parsed.data.provider}`, { method: 'DELETE' });
  return { ok: true };
});

interface Activity {
  date: string;
  source?: { provider?: string } | string | null;
  steps?: number | null;
  distance_meters?: number | null;
  active_calories_kcal?: number | null;
  total_calories_kcal?: number | null;
  heart_rate?: { avg_bpm?: number | null; min_bpm?: number | null; max_bpm?: number | null } | null;
}
interface Sleep {
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  stages?: Record<string, number | null> | null;
  avg_hrv_rmssd_ms?: number | null;
  avg_spo2_percent?: number | null;
}
interface Recovery {
  date: string;
  resting_heart_rate_bpm?: number | null;
  avg_hrv_rmssd_ms?: number | null;
  avg_spo2_percent?: number | null;
}

/** Normalised FitMe day from Open Wearables summaries (pure; unit tested). Missing values are left out, never 0. */
export function toDay(a: Activity | undefined, s: Sleep | undefined, r: Recovery | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const put = (k: string, v: number | null | undefined, round = true) => {
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = round ? Math.round(v) : Math.round(v * 10) / 10;
  };
  put('steps', a?.steps);
  put('distanceM', a?.distance_meters);
  put('activeKcal', a?.active_calories_kcal);
  put('totalKcal', a?.total_calories_kcal);
  put('heartRateAvg', a?.heart_rate?.avg_bpm);
  put('heartRateMin', a?.heart_rate?.min_bpm);
  put('heartRateMax', a?.heart_rate?.max_bpm);
  put('restingHr', r?.resting_heart_rate_bpm);
  put('hrvMs', r?.avg_hrv_rmssd_ms ?? s?.avg_hrv_rmssd_ms, false);
  put('spo2', r?.avg_spo2_percent ?? s?.avg_spo2_percent, false);
  put('sleepMin', s?.duration_minutes);
  if (s?.stages) for (const [k, v] of Object.entries(s.stages)) put(`sleep_${k}`, v);
  const src = typeof a?.source === 'string' ? a.source : a?.source?.provider;
  if (src) out.provider = src;
  return out;
}

/** Pulls the last days from Open Wearables into Firestore (one record per day; re-sync updates, never duplicates). */
export const wearablesSync = onCall(callableOptions({ timeoutSeconds: 60 }), async (req) => {
  const uid = await requireAuth(req);
  const cfg = await requireConfig();
  const user = await owUser(cfg, uid);
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 86_400_000);
  const q = { start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10), limit: '50' };
  const [act, sleep, rec] = await Promise.all([
    ow<{ data?: Activity[] }>(cfg, `/api/v1/users/${user}/summaries/activity`, { query: q }),
    ow<{ data?: Sleep[] }>(cfg, `/api/v1/users/${user}/summaries/sleep`, { query: q }),
    ow<{ data?: Recovery[] }>(cfg, `/api/v1/users/${user}/summaries/recovery`, { query: q }),
  ]);
  const dates = new Set([...(act.data ?? []), ...(sleep.data ?? []), ...(rec.data ?? [])].map((x) => x.date.slice(0, 10)));
  const profile = (await db().doc(`users/${uid}`).get()).data() ?? {};
  const tz = typeof profile.timezone === 'string' ? profile.timezone : 'UTC';
  const batch = db().batch();
  for (const date of dates) {
    const day = toDay(
      act.data?.find((x) => x.date.startsWith(date)),
      sleep.data?.find((x) => x.date.startsWith(date)),
      rec.data?.find((x) => x.date.startsWith(date)),
    );
    const base = { id: `cloud-${date}`, uid, date, tz, source: 'device', status: 'active', updatedAt: FieldValue.serverTimestamp() };
    batch.set(db().doc(`users/${uid}/healthDaily/cloud-${date}`), { ...base, ...day, createdAt: FieldValue.serverTimestamp() }, { merge: true });
    if (typeof day.steps === 'number' && day.steps > 0)
      batch.set(db().doc(`users/${uid}/stepLogs/cloud-${date}`), { ...base, id: `cloud-${date}`, steps: Math.min(200000, day.steps as number), deviceName: String(day.provider ?? 'Wearable'), createdAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  await batch.commit();
  return { days: dates.size };
});
