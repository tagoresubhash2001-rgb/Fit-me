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
import { closeSharedListeners } from './useRecords';
import { effectivePlan } from '../domain/plans';
import { combinedPlan, stageAt } from '../domain/access';
import type { UserProfile } from '../domain/models';

let profileUnsub: (() => void) | null = null;
let entUnsub: (() => void) | null = null;
let accessUnsub: (() => void) | null = null;
let stageTimer: ReturnType<typeof setTimeout> | null = null;

/** Recomputes the usable plan, and again the moment the current free stage ends. */
function recomputePlan() {
  const { subscriptionPlan, access, set } = useSession.getState();
  const now = Date.now();
  const info = stageAt(access, now);
  set({ plan: combinedPlan(subscriptionPlan, info.plan) });
  if (stageTimer) clearTimeout(stageTimer);
  stageTimer = null;
  const next = Math.min(info.endsAtMs ?? Infinity, useSession.getState().entitlement?.expiresAt ?? Infinity);
  if (Number.isFinite(next) && next > now) stageTimer = setTimeout(recomputePlan, Math.min(next - now + 1000, 2 ** 31 - 1));
}

const tsMs = (v: unknown) => (v && typeof (v as { toMillis?: unknown }).toMillis === 'function' ? (v as { toMillis(): number }).toMillis() : 0);

/** Starts listening to auth, the user's profile document and their entitlement. Call once at startup. */
export function watchSession() {
  const set = useSession.getState().set;
  return onAuthStateChanged(auth(), (user) => {
    profileUnsub?.();
    entUnsub?.();
    accessUnsub?.();
    profileUnsub = entUnsub = accessUnsub = null;
    if (stageTimer) clearTimeout(stageTimer);
    set({ user, authReady: true, profile: null, profileReady: !user, plan: 'free', subscriptionPlan: 'free', access: null, entitlement: null });
    if (!user) return;
    let requested = false;
    accessUnsub = onSnapshot(
      doc(db(), `access/${user.uid}`),
      (snap) => {
        const d = snap.data();
        if (!d) {
          // Accounts from before the free stages, or the sign-up trigger has not run yet: ask the server once.
          if (!requested && !snap.metadata.fromCache) {
            requested = true;
            void httpsCallable(functions(), 'getAccess')({}).catch(() => undefined);
          }
          return;
        }
        set({
          access: {
            createdAtMs: tsMs(d.createdAt),
            welcomeEndsAtMs: tsMs(d.welcomeEndsAt),
            trialEndsAtMs: tsMs(d.trialEndsAt),
            welcomePlan: d.welcomePlan,
            trialPlan: d.trialPlan,
            eligible: d.eligible === true,
            configVersion: Number(d.configVersion ?? 1),
          },
        });
        recomputePlan();
      },
      () => undefined,
    );
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
      (snap) => {
        const d = snap.data();
        const ms = (v: unknown) => (v && typeof (v as { toMillis?: unknown }).toMillis === 'function' ? (v as { toMillis(): number }).toMillis() : null);
        const entitlement =
          d && (d.plan === 'premium' || d.plan === 'pro')
            ? { plan: d.plan, status: d.status ?? 'active', period: d.period ?? null, source: d.source ?? 'admin', expiresAt: ms(d.expiresAt), trialEndsAt: ms(d.trialEndsAt), willRenew: !!d.willRenew, trialUsed: !!d.trialUsed }
            : null;
        set({ subscriptionPlan: effectivePlan(d as never, Date.now()), entitlement });
        recomputePlan();
      },
      () => {
        set({ subscriptionPlan: 'free', entitlement: null });
        recomputePlan();
      },
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
  // Stop live listeners first so none of them fires a permission error after the user is gone.
  closeSharedListeners();
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

/** True when a Cloud Function cannot be reached or is not deployed (the rest of the app keeps working). */
export function isServerUnavailable(e: unknown): boolean {
  const code = (e as { code?: string })?.code ?? '';
  return [
    'functions/unavailable',
    'functions/not-found',
    'functions/internal',
    'functions/deadline-exceeded',
    'functions/unknown',
  ].includes(code);
}

export function authErrorKey(e: unknown): string {
  if (isServerUnavailable(e)) return 'common.serverUnavailable';
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
    'auth/configuration-not-found': 'auth.notConfigured',
    'auth/operation-not-allowed': 'auth.notConfigured',
  };
  return map[code] ?? 'auth.errors.generic';
}
