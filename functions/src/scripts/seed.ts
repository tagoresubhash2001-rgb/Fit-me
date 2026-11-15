/**
 * Seeds global reference data: foods (USDA subset + curated dishes), foodMicros, exercises and appConfig.
 *
 *   # local emulator (safe):
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node lib/scripts/seed.js --project demo-fitmeai --usda /path/to/sr_legacy_csv_dir
 *   # dev / staging (needs Application Default Credentials and --yes):
 *   node lib/scripts/seed.js --project fitmeai-dev --usda <dir> --yes
 *
 * It only creates or merges documents with deterministic ids; it never deletes anything (CLAUDE.md rule 4).
 * Production is refused.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type WriteBatch } from 'firebase-admin/firestore';
import { buildUsdaFoods } from '../foods/usda';
import { curatedFoods } from '../foods/curated';
import { exerciseLibrary } from '../exercises/library';
import { DEFAULT_LIMITS } from '../lib/limitDefaults';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const project = arg('project');
  if (!project) throw new Error('Pass --project <id>');
  if (/prod/.test(project)) throw new Error('Refusing to seed a production project.');
  if (!process.env.FIRESTORE_EMULATOR_HOST && !flag('yes'))
    throw new Error('Not using the emulator: pass --yes to confirm seeding a real project.');
  initializeApp({ projectId: project });
  const db = getFirestore();
  const only = (arg('only') ?? 'foods,exercises,config').split(',');

  let batch: WriteBatch = db.batch();
  let n = 0;
  let total = 0;
  const put = async (path: string, data: object) => {
    batch.set(db.doc(path), data, { merge: true });
    n++;
    total++;
    if (n === 400) {
      await batch.commit();
      batch = db.batch();
      n = 0;
    }
  };

  if (only.includes('foods')) {
    for (const f of curatedFoods()) await put(`foods/${f.id}`, f.doc);
    const usdaDir = arg('usda');
    if (usdaDir) {
      const max = Number(arg('max') ?? 5000);
      for (const f of buildUsdaFoods(usdaDir, max)) {
        await put(`foods/${f.id}`, f.doc);
        await put(`foodMicros/${f.id}`, f.micros);
      }
    } else console.warn('No --usda folder given: only curated dishes were seeded.');
  }
  if (only.includes('exercises')) for (const e of exerciseLibrary()) await put(`exercises/${e.id}`, e.doc);
  if (only.includes('config')) {
    await put('appConfig/targets', {
      loseDeltaKcal: 500,
      gainDeltaKcal: 300,
      floorFemaleKcal: 1200,
      floorMaleKcal: 1500,
      proteinGPerKg: 1.6,
      fatShare: 0.275,
      fiberGPer1000Kcal: 14,
      waterMlPerKg: 35,
    });
    await put('appConfig/limits', DEFAULT_LIMITS);
  }
  if (n) await batch.commit();
  console.log(`Seeded ${total} documents into ${project}.`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
