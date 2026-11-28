/**
 * Firestore for the marketing website, loaded on demand: the website's first paint ships no Firebase code.
 * Only the few website reads and writes (release info, testimonials, contact, account deletion) use it.
 */
export async function siteDb() {
  const [{ db }, fs] = await Promise.all([import('../../lib/firebase'), import('firebase/firestore')]);
  return { db: db(), fs };
}
