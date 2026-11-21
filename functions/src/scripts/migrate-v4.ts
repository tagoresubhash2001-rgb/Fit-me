/**
 * v4 config migration (never touches user data, payments or subscriptions):
 *  - appConfig/pricing: adds tax, payment methods and on/off to each market where missing (prices unchanged).
 *  - appConfig/policy: created if missing; Free Launch Mode switched on (launch decision), all countries.
 * Each change is versioned in appConfigVersions and written to adminLogs as "system-migration".
 * Usage: node lib/scripts/migrate-v4.js --project fit-me1 [--apply]   (without --apply it only prints the diff)
 */
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { DEFAULT_PRICING } from '../billing/billing';
import { AccessPolicy } from '../lib/policy';

const arg = (n: string) => process.argv.includes(`--${n}`);
const val = (n: string) => process.argv[process.argv.indexOf(`--${n}`) + 1];

export function migratePricing(current: Record<string, unknown>): { next: Record<string, unknown>; changed: string[] } {
  const next = JSON.parse(JSON.stringify(current)) as { markets?: Record<string, Record<string, unknown>> };
  const changed: string[] = [];
  for (const [key, m] of Object.entries(next.markets ?? {})) {
    const def = (DEFAULT_PRICING.markets as Record<string, Record<string, unknown>>)[key];
    for (const field of ['tax', 'methods', 'enabled'] as const) {
      if (m[field] === undefined) {
        m[field] = def?.[field] ?? (field === 'enabled' ? true : field === 'tax' ? { name: 'Tax', percent: 0, inclusive: true } : { appStore: true, playStore: true, cashfreeWeb: true });
        changed.push(`${key}.${field}`);
      }
    }
  }
  return { next: next as Record<string, unknown>, changed };
}

async function main() {
  const project = val('project');
  if (!project) throw new Error('--project is required');
  initializeApp({ projectId: project });
  const db = getFirestore();
  const apply = arg('apply');
  const log = (action: string, id: string, before: unknown, after: unknown) =>
    db.collection('adminLogs').add({ actorUid: 'system-migration', actorRole: 'superAdmin', actorEmail: null, action, targetType: 'appConfig', targetId: id, before, after, note: 'v4 migration', at: FieldValue.serverTimestamp() });
  const save = async (id: string, before: Record<string, unknown> | null, value: Record<string, unknown>, action: string) => {
    const version = Number(before?.version ?? 0) + 1;
    await db.doc(`appConfigVersions/${id}_${String(version).padStart(5, '0')}`).set({ id, version, value, previous: before, by: 'system-migration', at: FieldValue.serverTimestamp() });
    await db.doc(`appConfig/${id}`).set({ ...value, version, updatedAt: FieldValue.serverTimestamp(), updatedBy: 'system-migration' });
    await log(action, id, before, value);
  };

  const p = await db.doc('appConfig/pricing').get();
  if (p.exists) {
    const { next, changed } = migratePricing(p.data()!);
    console.log('pricing: add', changed.length ? changed.join(', ') : 'nothing');
    if (apply && changed.length) {
      delete (next as { updatedAt?: unknown }).updatedAt;
      await save('pricing', p.data()!, next, 'pricing.migrate');
    }
  } else console.log('pricing: no document (defaults in code apply; seed with the admin)');

  const pol = await db.doc('appConfig/policy').get();
  const current = AccessPolicy.parse(pol.data() ?? {});
  const nextPolicy = { ...current, freeLaunch: { enabled: true, countries: [] } };
  console.log('policy:', pol.exists ? 'exists' : 'missing', '-> freeLaunch', JSON.stringify(nextPolicy.freeLaunch));
  if (apply && !current.freeLaunch.enabled) await save('policy', pol.data() ?? null, nextPolicy as unknown as Record<string, unknown>, 'freeLaunch.on');
  console.log(apply ? 'applied' : 'dry run (add --apply)');
}

if (require.main === module) main().catch((e) => {
  console.error(e);
  process.exit(1);
});
