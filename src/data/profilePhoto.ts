import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { useSession } from './session';

/** Profile photos are stored at users/{uid}/profile/avatar-{time}.jpg (owner-only write, see storage.rules). */
export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

export async function saveProfilePhoto(jpeg: Blob): Promise<string> {
  const { user, profile } = useSession.getState();
  if (!user) throw new Error('auth/no-user');
  const { ref, uploadBytes, getDownloadURL, deleteObject } = await import('firebase/storage');
  const s = await storage();
  const path = `users/${user.uid}/profile/avatar-${Date.now()}.jpg`;
  const r = ref(s, path);
  await uploadBytes(r, jpeg, { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' });
  const url = await getDownloadURL(r);
  await setDoc(doc(db(), `users/${user.uid}`), { uid: user.uid, photoURL: url, photoPath: path, updatedAt: serverTimestamp() }, { merge: true });
  const old = (profile as { photoPath?: string } | null)?.photoPath;
  if (old && old !== path) await deleteObject(ref(s, old)).catch(() => undefined);
  return url;
}

export async function removeProfilePhoto(): Promise<void> {
  const { user, profile } = useSession.getState();
  if (!user) return;
  const { ref, deleteObject } = await import('firebase/storage');
  const old = (profile as { photoPath?: string } | null)?.photoPath;
  await setDoc(doc(db(), `users/${user.uid}`), { uid: user.uid, photoURL: null, photoPath: null, updatedAt: serverTimestamp() }, { merge: true });
  if (old) await deleteObject(ref(await storage(), old)).catch(() => undefined);
}
