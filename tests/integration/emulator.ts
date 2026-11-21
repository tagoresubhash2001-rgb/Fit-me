import { expect } from 'vitest';

/** Writes a document through the Firestore emulator REST API as the owner (rules bypassed, like the server). */
export async function writeDoc(path: string, data: Record<string, unknown>) {
  const enc = (v: unknown): Record<string, unknown> => {
    if (v === null) return { nullValue: null };
    if (v instanceof Date) return { timestampValue: v.toISOString() };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
    return { mapValue: { fields: Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, enc(x)])) } };
  };
  const r = await fetch(`http://127.0.0.1:8080/v1/projects/demo-fitmeai/databases/(default)/documents/${path}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, enc(v)])) }),
  });
  expect(r.ok, await r.clone().text()).toBe(true);
}

/** Sets custom claims on an Auth emulator user (as the server would with setCustomUserClaims). */
export async function setClaims(uid: string, claims: Record<string, unknown>) {
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-fitmeai/accounts:update', {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify(claims) }),
  });
  expect(r.ok, await r.clone().text()).toBe(true);
}

/** Uploads a file to the Storage emulator's default bucket as the owner. */
export async function upload(path: string, body: Uint8Array, contentType: string, bucket = 'demo-fitmeai.appspot.com') {
  const r = await fetch(`http://127.0.0.1:9199/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': contentType },
    body,
  });
  expect(r.ok, await r.clone().text()).toBe(true);
}

export async function readDoc(path: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(`http://127.0.0.1:8080/v1/projects/demo-fitmeai/databases/(default)/documents/${path}`, { headers: { Authorization: 'Bearer owner' } });
  if (r.status === 404) return null;
  return (await r.json()) as Record<string, unknown>;
}

export const DAY = 86_400_000;
export const accessAt = (uid: string, signUpMs: number, eligible = true) => ({
  uid,
  createdAt: new Date(signUpMs),
  welcomeEndsAt: new Date(signUpMs + 7 * DAY),
  trialEndsAt: new Date(signUpMs + 37 * DAY),
  welcomePlan: 'pro',
  trialPlan: 'premium',
  eligible,
  configVersion: 1,
});
