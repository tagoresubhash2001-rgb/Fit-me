import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../domain/models';
import type { Plan } from '../domain/plans';
import type { AccessRecord } from '../domain/access';
import type { EntitlementStatus, PaidPlan, Period } from '../domain/billing';

/** Client view of entitlements/{uid} (written only by Cloud Functions). Times in epoch ms. */
export interface EntitlementView {
  plan: PaidPlan;
  status: EntitlementStatus;
  period: Period | null;
  source: string;
  expiresAt: number | null;
  trialEndsAt: number | null;
  willRenew: boolean;
  trialUsed: boolean;
}

interface SessionState {
  authReady: boolean;
  user: User | null;
  profileReady: boolean;
  profile: UserProfile | null;
  /** What the user can use now: the better of their subscription and their free stage. */
  plan: Plan;
  /** Plan from the subscription alone (entitlements/{uid}). */
  subscriptionPlan: Plan;
  entitlement: EntitlementView | null;
  /** Free-stage record (access/{uid}, server-written); null until loaded. */
  access: AccessRecord | null;
  set: (s: Partial<Omit<SessionState, 'set'>>) => void;
}

/** App-wide session: the Firebase user, their profile document and their plan (all live from Firestore). */
export const useSession = create<SessionState>((set) => ({
  authReady: false,
  user: null,
  profileReady: false,
  profile: null,
  plan: 'free',
  subscriptionPlan: 'free',
  entitlement: null,
  access: null,
  set: (s) => set(s),
}));

export const currentUid = () => {
  const u = useSession.getState().user;
  if (!u) throw new Error('not_signed_in');
  return u.uid;
};
