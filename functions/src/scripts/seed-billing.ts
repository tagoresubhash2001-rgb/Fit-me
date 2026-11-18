/**
 * Creates appConfig/pricing and appConfig/billing if they do not exist. Never overwrites: existing
 * documents are reported and left as they are.
 *   GOOGLE_APPLICATION_CREDENTIALS=<admin key> node lib/scripts/seed-billing.js --project fit-me1
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node lib/scripts/seed-billing.js --project demo-fitmeai --mode test
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { DEFAULT_PRICING, PricingConfig } from '../billing/billing';

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

async function main() {
  const project = arg('project');
  if (!project) throw new Error('--project is required');
  initializeApp({ projectId: project });
  const db = getFirestore();
  PricingConfig.parse(DEFAULT_PRICING);
  const docs: Array<[string, Record<string, unknown>]> = [
    ['appConfig/pricing', DEFAULT_PRICING as unknown as Record<string, unknown>],
    // interest = payments not launched; test = billing testers get sandbox trials; live = store checkout.
    ['appConfig/billing', { mode: arg('mode') ?? 'test' }],
  ];
  for (const [path, data] of docs) {
    try {
      await db.doc(path).create(data);
      console.log('created', path);
    } catch (e) {
      if ((e as { code?: number }).code === 6) console.log('exists, left unchanged:', path);
      else throw e;
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
