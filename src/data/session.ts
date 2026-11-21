import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../domain/models';
import type { Plan } from '../domain/plans';
import type { AccessRecord } from '../domain/access';
import { canUse, EMPTY_POLICY, freeLaunchFor, type AccessPolicy, type GatedFeature, type Grant } from '../domain/policy';
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
  /** Admin grant of free access (grants/{uid}). */
  grant: Grant | null;
  /** Admin access policy (Free Launch Mode, feature tiers per country). */
  policy: AccessPolicy;
  /** Subscription + stage + grant, before Free Launch Mode (what feature tiers compare against). */
  basePlan: Plan;
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
  grant: null,
  policy: EMPTY_POLICY,
  basePlan: 'free',
  set: (s) => set(s),
}));

export const currentUid = () => {
  const u = useSession.getState().user;
  if (!u) throw new Error('not_signed_in');
  return u.uid;
};

/** Can the signed-in user use this feature (tier, per-country override, Free Launch Mode)? Display only. */
export function useCanUse(feature: GatedFeature): boolean {
  return useSession((s) => canUse(s.policy, s.basePlan, feature, s.profile?.country));
}
/** True while Free Launch Mode applies to the user's country. */
export function useFreeLaunch(): boolean {
  return useSession((s) => freeLaunchFor(s.policy, s.profile?.country));
}
