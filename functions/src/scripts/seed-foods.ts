/**
 * Loads the catalogue from scripts/build-foods.ts into Firestore and Cloud Storage.
 *   GOOGLE_APPLICATION_CREDENTIALS=<key> node lib/scripts/seed-foods.js --project fit-me1 --catalog catalog.json [--dry-run]
 *   (emulator: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 ... --project demo-fitmeai)
 * Safety: new foods are created; existing food documents only receive the new search fields (aliases,
 * keywords, dataset, search tokens) and keep their nutrition values. Nothing is deleted.
 */
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { CatalogFood } from '../foods/catalog';
import { fold, normalize } from '../foods/search';
import { INDEX_META, INDEX_PATH, type IndexFood } from '../foods/indexMeta';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const DRY = process.argv.includes('--dry-run');

/** Prefix tokens (2..15 characters) of every word, raw and folded: the offline fallback search uses them. */
export function tokensFor(f: Pick<CatalogFood, 'name' | 'aliases' | 'names' | 'brand'>): string[] {
  const set = new Set<string>();
  const texts = [f.name, ...f.aliases, ...Object.values(f.names ?? {}), ...(f.brand ? [f.brand] : [])];
  for (const t of texts)
    for (const w of normalize(t).split(' '))
      for (const v of new Set([w, fold(w)])) {
        const chars = [...v];
        for (let i = 2; i <= Math.min(15, chars.length); i++) set.add(chars.slice(0, i).join(''));
      }
  return [...set].slice(0, 400);
}

async function main() {
  const project = arg('project');
  const catalogPath = arg('catalog');
  if (!project || !catalogPath) throw new Error('--project and --catalog are required');
  if (/prod/i.test(project)) throw new Error('refusing to seed a production project');
  const bucketName = arg('bucket') ?? (project.startsWith('demo-') ? `${project}.appspot.com` : `${project}.firebasestorage.app`);
  initializeApp({ projectId: project, storageBucket: bucketName });
  const db = getFirestore();
  const foods = JSON.parse(readFileSync(catalogPath, 'utf8')) as CatalogFood[];

  const existing = new Set((await db.collection('foods').select().get()).docs.map((d) => d.id));
  const existingMicros = new Set((await db.collection('foodMicros').select().get()).docs.map((d) => d.id));
  let created = 0;
  let enriched = 0;
  let micros = 0;
  const writer = db.bulkWriter();
  writer.onWriteError((e) => e.failedAttempts < 5);
  for (const f of foods) {
    const searchTokens = tokensFor(f);
    const extra = {
      aliases: f.aliases,
      ...(f.keywords?.length ? { keywords: f.keywords } : {}),
      ...(f.cuisine ? { cuisine: f.cuisine } : {}),
      dataset: f.dataset,
      searchTokens,
    };
    if (existing.has(f.id)) {
      enriched++;
      if (!DRY) writer.set(db.doc(`foods/${f.id}`), extra, { merge: true });
    } else {
      created++;
      const doc = {
        name: f.name,
        ...(f.names ? { names: f.names } : {}),
        ...extra,
        category: f.category,
        countries: f.countries,
        source: f.source,
        sourceId: f.sourceId,
        ...(f.brand ? { brand: f.brand } : {}),
        per100g: f.per100g,
        servings: f.servings,
        rank: f.rank,
        reviewStatus: f.reviewStatus,
        license: f.license,
        createdAt: FieldValue.serverTimestamp(),
      };
      if (!DRY) writer.create(db.doc(`foods/${f.id}`), doc);
    }
    if (Object.keys(f.micros).length && !existingMicros.has(f.id)) {
      micros++;
      if (!DRY) writer.create(db.doc(`foodMicros/${f.id}`), f.micros);
    }
  }
  if (!DRY) await writer.close();
  console.log(`${DRY ? '[dry run] ' : ''}foods created ${created}, existing enriched ${enriched}, micronutrient docs created ${micros}`);

  // Search index: existing foods keep their stored values, so read them back for the index.
  const stored = new Map<string, FirebaseFirestore.DocumentData>();
  if (!DRY) {
    const snap = await db.collection('foods').select('per100g', 'servings', 'name', 'names').get();
    for (const d of snap.docs) stored.set(d.id, d.data());
  }
  const index: IndexFood[] = foods.map((f) => {
    const s = stored.get(f.id);
    return {
      id: f.id,
      name: s?.name ?? f.name,
      ...(s?.names ?? f.names ? { names: s?.names ?? f.names } : {}),
      aliases: f.aliases,
      ...(f.keywords?.length ? { keywords: f.keywords } : {}),
      ...(f.brand ? { brand: f.brand } : {}),
      category: f.category,
      ...(f.cuisine ? { cuisine: f.cuisine } : {}),
      countries: f.countries,
      source: f.source,
      dataset: f.dataset,
      rank: f.rank,
      per100g: s?.per100g ?? f.per100g,
      servings: s?.servings ?? f.servings,
      reviewStatus: f.reviewStatus,
      ...(Object.keys(f.micros).length ? { micros: f.micros as Record<string, number> } : {}),
    };
  });
  const gz = gzipSync(Buffer.from(JSON.stringify(index)));
  console.log(`index: ${index.length} foods, ${(gz.length / 1e6).toFixed(1)} MB gzipped`);
  if (DRY) return;
  await getStorage().bucket().file(INDEX_PATH).save(gz, { contentType: 'application/gzip', resumable: false, metadata: { cacheControl: 'no-cache' } });
  const counts: Record<string, number> = {};
  for (const f of foods) counts[f.dataset] = (counts[f.dataset] ?? 0) + 1;
  await db.doc(INDEX_META).set({ path: INDEX_PATH, builtAt: FieldValue.serverTimestamp(), count: index.length, datasets: counts });
  console.log(`uploaded gs://${bucketName}/${INDEX_PATH} and ${INDEX_META}`);
}

if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
