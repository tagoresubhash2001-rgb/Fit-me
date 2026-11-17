/**
 * EMULATOR ONLY: adds 60 days of history for a test user so charts and calendars have data in screenshots.
 * Refuses to run unless FIRESTORE_EMULATOR_HOST is set. Usage: node e2e/seed-history.cjs <uid>
 */
if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('emulator only');
const req = require('module').createRequire(require('path').join(__dirname, '..', 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getFirestore, FieldValue } = req('firebase-admin/firestore');
initializeApp({ projectId: 'demo-fitmeai' });
const db = getFirestore();
const uid = process.argv[2];
const tz = 'Asia/Kolkata';
const day = (i) => new Date(Date.now() - i * 86400000 + 5.5 * 3600000).toISOString().slice(0, 10);
(async () => {
  const batch = db.batch();
  const base = (c, id, date, data) =>
    batch.set(db.doc(`users/${uid}/${c}/${id}`), { id, uid, date, tz, source: 'manual', status: 'active', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), ...data });
  for (let i = 1; i <= 60; i++) {
    const d = day(i);
    if (i % 3 !== 0) base('weightLogs', `w${i}`, d, { kg: Math.round((78 - (60 - i) * 0.04 + Math.sin(i) * 0.3) * 10) / 10 });
    base('waterLogs', `h${i}`, d, { ml: 1500 + ((i * 137) % 1200) });
    base('sleepLogs', `s${i}`, d, { startMinutes: 1350, endMinutes: 390 + (i % 4) * 15, durationMin: 420 + (i % 4) * 15, quality: 3 + (i % 3) });
    if (i % 2) base('workoutLogs', `k${i}`, d, { name: 'Strength', durationMin: 30 + (i % 3) * 10, sets: [], caloriesEst: 180 + (i % 3) * 40 });
    base('foodLogs', `f${i}`, d, { slot: 'lunch', foodId: null, name: 'Dal and rice', servingLabel: '1 plate', servings: 1, grams: 350, nutrients: { calories: 1500 + ((i * 97) % 700), proteinG: 70, carbsG: 200, fatG: 50, fiberG: 25 } });
  }
  await batch.commit();
  console.log('seeded history for', uid);
})();
