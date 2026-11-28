/**
 * DEMO DATA, EMULATOR ONLY. Fills one demo account with a realistic week (meals with photos, water, steps, heart
 * rate, sleep, weight, workouts with a GPS route, a coach chat) for website and store screenshots.
 *
 * Refuses to run unless FIRESTORE_EMULATOR_HOST is set and the project id starts with "demo-", so it can never
 * touch fit-me1 or any real project. Never imported by the app.
 *
 * Usage (emulators running, account created through the app first):
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/seed-demo.ts <uid>
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';

const PROJECT = process.env.GCLOUD_PROJECT || 'demo-fitmeai';
if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('seed-demo: FIRESTORE_EMULATOR_HOST is not set; this script only runs against the emulator.');
if (!PROJECT.startsWith('demo-')) throw new Error(`seed-demo: project "${PROJECT}" is not a demo- project; refusing.`);

const req = createRequire(join(process.cwd(), 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = req('firebase-admin/firestore');

const uid = process.argv[2];
if (!uid) throw new Error('usage: npx tsx scripts/seed-demo.ts <uid>');
initializeApp({ projectId: PROJECT });
const db = getFirestore();

const TZ = 'Asia/Kolkata';
const OFFSET_MS = 5.5 * 3600_000;
/** Local date (Asia/Kolkata) i days ago. */
const day = (i: number) => new Date(Date.now() + OFFSET_MS - i * 86_400_000).toISOString().slice(0, 10);
/** UTC timestamp for a local date and minute of the day. */
const at = (date: string, minutes: number) => Timestamp.fromMillis(Date.parse(`${date}T00:00:00Z`) - OFFSET_MS + minutes * 60_000);
const nowMinutes = Math.floor(((Date.now() + OFFSET_MS) % 86_400_000) / 60_000);

type Meal = { slot: 'breakfast' | 'lunch' | 'snack' | 'dinner'; name: string; serving: string; grams: number; kcal: number; p: number; c: number; f: number; fib: number; img?: string; time: number };
const MEALS: Meal[][] = [
  [
    { slot: 'breakfast', name: 'Idli with sambar', serving: '3 idli and 1 katori sambar', grams: 320, kcal: 330, p: 12, c: 62, f: 4, fib: 6, img: '/e2e/demo-assets/idli.jpg', time: 480 },
    { slot: 'lunch', name: 'Dal, rice and vegetables', serving: '1 plate', grams: 420, kcal: 560, p: 20, c: 92, f: 12, fib: 11, time: 780 },
    { slot: 'snack', name: 'Greek yogurt with banana', serving: '1 bowl', grams: 220, kcal: 210, p: 14, c: 30, f: 4, fib: 3, time: 1020 },
    { slot: 'dinner', name: 'Paneer tikka with roti', serving: '6 pieces and 2 roti', grams: 340, kcal: 610, p: 32, c: 48, f: 30, fib: 7, img: '/e2e/demo-assets/paneer.jpg', time: 1230 },
  ],
  [
    { slot: 'breakfast', name: 'Poha with peanuts', serving: '1 plate', grams: 250, kcal: 340, p: 8, c: 58, f: 9, fib: 4, img: '/e2e/demo-assets/poha.jpg', time: 500 },
    { slot: 'lunch', name: 'Grilled chicken salad', serving: '1 large bowl', grams: 380, kcal: 450, p: 42, c: 18, f: 22, fib: 6, img: '/e2e/demo-assets/salad.jpg', time: 790 },
    { slot: 'snack', name: 'Roasted chana', serving: '1 handful', grams: 40, kcal: 150, p: 9, c: 22, f: 3, fib: 7, time: 1000 },
    { slot: 'dinner', name: 'Chapati with mixed veg curry', serving: '3 chapati and 1 katori curry', grams: 360, kcal: 520, p: 15, c: 76, f: 16, fib: 10, time: 1215 },
  ],
];

const base = (id: string, date: string, created: unknown, source: 'manual' | 'device' = 'manual') => ({ id, uid, date, tz: TZ, source, status: 'active', createdAt: created, updatedAt: created });

async function main() {
  const batch = db.batch();
  const put = (c: string, id: string, data: Record<string, unknown>) => batch.set(db.doc(`users/${uid}/${c}/${id}`), data);

  for (let i = 0; i < 7; i++) {
    const d = day(i);
    const isToday = i === 0;
    // Food: a full day, or the meals so far today.
    MEALS[i % 2].forEach((m, k) => {
      if (isToday && m.time > Math.max(nowMinutes, 800)) return;
      const id = `demo-food-${d}-${k}`;
      put('foodLogs', id, {
        ...base(id, d, at(d, m.time)),
        slot: m.slot,
        foodId: null,
        name: m.name,
        servingLabel: m.serving,
        servings: 1,
        grams: m.grams,
        nutrients: { calories: m.kcal, proteinG: m.p, carbsG: m.c, fatG: m.f, fiberG: m.fib },
        foodSource: 'curated',
        timeMinutes: m.time,
        ...(m.img ? { imageUrl: m.img } : {}),
      });
    });
    // Water: 250-500 ml through the day (today about 1.8 L).
    const sips = isToday ? [500, 250, 500, 300, 250] : [500, 500, 500, 500, 500, 500, 250 + (i % 3) * 100];
    sips.forEach((ml, k) => {
      const id = `demo-water-${d}-${k}`;
      put('waterLogs', id, { ...base(id, d, at(d, 450 + k * 120)), ml });
    });
    // Steps and heart rate from a watch (Health Connect).
    const steps = isToday ? 8240 : [10420, 7350, 11980, 6890, 9510, 12340][i - 1];
    put('stepLogs', `device-${d}`, { ...base(`device-${d}`, d, at(d, 1300), 'device'), steps, deviceName: 'Pixel Watch', sources: ['Health Connect'] });
    put('healthDaily', `device-${d}`, {
      ...base(`device-${d}`, d, at(d, 1300), 'device'),
      deviceName: 'Pixel Watch',
      sources: ['Health Connect'],
      steps,
      distanceM: Math.round(steps * 0.74),
      activeKcal: Math.round(steps * 0.045),
      heartRateAvg: 71 + (i % 3),
      heartRateMin: 54 + (i % 2),
      heartRateMax: [148, 132, 156, 128, 151, 139, 160][i],
      restingHr: [58, 59, 57, 60, 58, 59, 61][i],
    });
    // Sleep (the night before each day).
    const sleepMin = [460, 432, 478, 405, 450, 488, 441][i];
    put('sleepLogs', `demo-sleep-${d}`, { ...base(`demo-sleep-${d}`, d, at(d, 400)), startMinutes: 1390, endMinutes: (1390 + sleepMin) % 1440, durationMin: sleepMin, quality: [4, 3, 5, 3, 4, 5, 4][i] });
    // Weight trend: 78.4 -> 77.6 kg over the week.
    put('weightLogs', `demo-weight-${d}`, { ...base(`demo-weight-${d}`, d, at(d, 430)), kg: Math.round((77.6 + i * 0.13 + (i % 2) * 0.05) * 10) / 10 });
  }

  // Workouts: three GPS runs and two strength sessions.
  const park = { lat: 17.4239, lng: 78.4255 }; // a park loop, Hyderabad
  const loop = Array.from({ length: 60 }, (_, k) => {
    const a = (k / 60) * Math.PI * 2;
    return { lat: Math.round((park.lat + 0.0062 * Math.sin(a) + 0.0011 * Math.sin(3 * a)) * 1e6) / 1e6, lng: Math.round((park.lng + 0.0081 * Math.cos(a)) * 1e6) / 1e6 };
  });
  for (const [i, km, min] of [[0, 5.1, 31], [2, 4.2, 26], [5, 6.0, 37]] as const) {
    const d = day(i);
    const id = `demo-run-${d}`;
    put('workoutLogs', id, { ...base(id, d, at(d, 375)), name: 'Morning run', activity: 'run', distanceKm: km, durationMin: min, sets: [], caloriesEst: Math.round(km * 62), route: loop });
  }
  for (const i of [1, 4]) {
    const d = day(i);
    const id = `demo-strength-${d}`;
    put('workoutLogs', id, {
      ...base(id, d, at(d, 1110)),
      name: 'Full body strength',
      durationMin: 40,
      caloriesEst: 230,
      sets: [
        { exerciseId: 'bodyweight-squat', reps: 12, weightKg: 40 },
        { exerciseId: 'bodyweight-squat', reps: 10, weightKg: 45 },
        { exerciseId: 'push-up', reps: 15 },
        { exerciseId: 'push-up', reps: 12 },
        { exerciseId: 'plank', seconds: 60 },
      ],
    });
  }

  // Coach chat with Jai (written as the coach function would).
  const thread = db.doc(`users/${uid}/aiThreads/jai`);
  batch.set(thread, { coach: 'jai', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  const chat = [
    ['user', 'I ran 5 km this morning in 31 minutes. What should I focus on this week?'],
    ['assistant', 'Great run, that is a 6:05 per km pace and your fastest 5 km this month. This week: one easy 4 km run, one session of 6 x 400 m at a slightly faster pace, and a strength day for your legs. Keep protein near 120 g a day to recover well.'],
    ['user', 'What can I eat after my run tomorrow?'],
    ['assistant', 'Within an hour, try poha with peanuts and a glass of milk, or idli with sambar and a boiled egg. Both give you carbs to refill and about 20 g of protein. And drink 500 ml of water when you get home.'],
  ];
  chat.forEach(([role, text], k) => batch.set(thread.collection('messages').doc(`demo-${k}`), { role, text, coach: 'jai', status: 'ok', createdAt: Timestamp.fromMillis(Date.now() - (chat.length - k) * 90_000) }));

  // Pro access for the demo account so no lock or upgrade screens appear (grants are server-write only).
  batch.set(db.doc(`grants/${uid}`), { plan: 'pro', expiresAtMs: null, reason: 'demo account (emulator)', createdAt: FieldValue.serverTimestamp() });

  await batch.commit();
  console.log(`seed-demo: a week of demo data for ${uid} in ${PROJECT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
