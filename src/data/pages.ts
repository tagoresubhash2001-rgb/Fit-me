import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PageDoc } from '../domain/appConfig';

/** Published pages (FAQ, help, legal, tips) from the admin's page editor. */
export async function getPage(slug: string): Promise<PageDoc | null> {
  const snap = await getDoc(doc(db(), `pages/${slug}`));
  const parsed = snap.exists() ? PageDoc.safeParse(snap.data()) : null;
  return parsed?.success && parsed.data.published ? parsed.data : null;
}

export async function listPages(kind?: PageDoc['kind']): Promise<PageDoc[]> {
  const q = kind ? query(collection(db(), 'pages'), where('published', '==', true), where('kind', '==', kind)) : query(collection(db(), 'pages'), where('published', '==', true));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => PageDoc.safeParse(d.data()))
    .filter((r) => r.success)
    .map((r) => r.data!)
    .sort((a, b) => a.order - b.order);
}
