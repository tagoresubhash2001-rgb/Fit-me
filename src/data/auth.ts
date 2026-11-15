import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  updateProfile,
  type ConfirmationResult,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../lib/firebase';
import { isNative, platform } from '../lib/platform';
import { useSession } from './session';
import { effectivePlan } from '../domain/plans';
import type { UserProfile } from '../domain/models';

let profileUnsub: (() => void) | null = null;
let entUnsub: (() => void) | null = null;

/** Starts listening to auth, the user's profile document and their entitlement. Call once at startup. */
export function watchSession() {
  const set = useSession.getState().set;
  return onAuthStateChanged(auth(), (user) => {
    profileUnsub?.();
    entUnsub?.();
    profileUnsub = entUnsub = null;
    set({ user, authReady: true, profile: null, profileReady: !user, plan: 'free' });
    if (!user) return;
    profileUnsub = onSnapshot(
      doc(db(), `users/${user.uid}`),
      (snap) => {
        const data = snap.data() as UserProfile | undefined;
        set({ profile: data && data.targets ? data : null, profileReady: true });
      },
      () => set({ profileReady: true }),
    );
    entUnsub = onSnapshot(
      doc(db(), `entitlements/${user.uid}`),
      (snap) => set({ plan: effectivePlan(snap.data() as never, Date.now()) }),
      () => set({ plan: 'free' }),
    );
  });
}

async function nativeAuth() {
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
  return FirebaseAuthentication;
}

export async function signInWithGoogle() {
  if (isNative()) {
    const FA = await nativeAuth();
    const r = await FA.signInWithGoogle({ skipNativeAuth: true });
    if (!r.credential?.idToken) throw new Error('auth/cancelled');
    return signInWithCredential(auth(), GoogleAuthProvider.credential(r.credential.idToken, r.credential.accessToken));
  }
  return signInWithPopup(auth(), new GoogleAuthProvider());
}

export async function signInWithApple() {
  if (isNative() && platform() === 'ios') {
    const FA = await nativeAuth();
    const r = await FA.signInWithApple({ skipNativeAuth: true });
    if (!r.credential?.idToken) throw new Error('auth/cancelled');
    const cred = new OAuthProvider('apple.com').credential({ idToken: r.credential.idToken, rawNonce: r.credential.nonce });
    return signInWithCredential(auth(), cred);
  }
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return signInWithPopup(auth(), provider);
}

export const signInWithEmail = (email: string, password: string) => signInWithEmailAndPassword(auth(), email.trim(), password);

export async function signUpWithEmail(email: string, password: string, name?: string) {
  const cred = await createUserWithEmailAndPassword(auth(), email.trim(), password);
  if (name) await updateProfile(cred.user, { displayName: name });
  return cred;
}

export const resetPassword = (email: string) => sendPasswordResetEmail(auth(), email.trim());

export interface PhoneVerification {
  confirm: (code: string) => Promise<unknown>;
}

/** Sends an SMS code. On web, an invisible reCAPTCHA is attached to `recaptchaContainerId`. */
export async function startPhoneSignIn(phoneE164: string, recaptchaContainerId: string): Promise<PhoneVerification> {
  if (isNative()) {
    const FA = await nativeAuth();
    const verificationId = await new Promise<string>((resolve, reject) => {
      FA.addListener('phoneCodeSent', (e) => resolve(e.verificationId));
      FA.addListener('phoneVerificationFailed', (e) => reject(new Error(e.message)));
      FA.signInWithPhoneNumber({ phoneNumber: phoneE164, skipNativeAuth: true }).catch(reject);
    });
    return { confirm: (code) => signInWithCredential(auth(), PhoneAuthProvider.credential(verificationId, code)) };
  }
  const verifier = new RecaptchaVerifier(auth(), recaptchaContainerId, { size: 'invisible' });
  const result: ConfirmationResult = await signInWithPhoneNumber(auth(), phoneE164, verifier);
  return { confirm: (code) => result.confirm(code) };
}

export async function signOut() {
  if (isNative()) {
    try {
      (await nativeAuth()).signOut();
    } catch {
      /* native session may not exist */
    }
  }
  await fbSignOut(auth());
}

/** Deletes every piece of the user's data on the server, then signs out locally. */
export async function deleteAccount() {
  await httpsCallable(functions(), 'deleteAccount')({});
  await signOut().catch(() => undefined);
}

export async function exportData(): Promise<Blob> {
  const res = await httpsCallable(functions(), 'exportData')({});
  return new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
}

export async function saveProfile(profile: UserProfile, isNew: boolean) {
  const uid = useSession.getState().user!.uid;
  await setDoc(
    doc(db(), `users/${uid}`),
    { ...profile, uid, updatedAt: serverTimestamp(), ...(isNew ? { createdAt: serverTimestamp(), onboardedAt: serverTimestamp() } : {}) },
    { merge: true },
  );
}

export async function updateProfileFields(patch: Partial<UserProfile>) {
  const uid = useSession.getState().user!.uid;
  void setDoc(doc(db(), `users/${uid}`), { ...patch, uid, updatedAt: serverTimestamp() }, { merge: true });
}

export function authErrorKey(e: unknown): string {
  const code = (e as { code?: string; message?: string })?.code ?? (e as Error)?.message ?? '';
  const map: Record<string, string> = {
    'auth/invalid-email': 'auth.errors.invalidEmail',
    'auth/invalid-credential': 'auth.errors.wrongCredentials',
    'auth/wrong-password': 'auth.errors.wrongCredentials',
    'auth/user-not-found': 'auth.errors.wrongCredentials',
    'auth/email-already-in-use': 'auth.errors.emailInUse',
    'auth/weak-password': 'auth.errors.weakPassword',
    'auth/popup-closed-by-user': 'auth.errors.cancelled',
    'auth/cancelled': 'auth.errors.cancelled',
    'auth/invalid-phone-number': 'auth.errors.invalidPhone',
    'auth/invalid-verification-code': 'auth.errors.invalidCode',
    'auth/too-many-requests': 'auth.errors.tooMany',
    'auth/network-request-failed': 'auth.errors.network',
    'auth/requires-recent-login': 'auth.errors.recentLogin',
  };
  return map[code] ?? 'auth.errors.generic';
}
