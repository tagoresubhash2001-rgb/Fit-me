import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../domain/models';
import type { Plan } from '../domain/plans';

interface SessionState {
  authReady: boolean;
  user: User | null;
  profileReady: boolean;
  profile: UserProfile | null;
  plan: Plan;
  set: (s: Partial<Omit<SessionState, 'set'>>) => void;
}

/** App-wide session: the Firebase user, their profile document and their plan (all live from Firestore). */
export const useSession = create<SessionState>((set) => ({
  authReady: false,
  user: null,
  profileReady: false,
  profile: null,
  plan: 'free',
  set: (s) => set(s),
}));

export const currentUid = () => {
  const u = useSession.getState().user;
  if (!u) throw new Error('not_signed_in');
  return u.uid;
};
