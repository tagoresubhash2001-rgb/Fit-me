/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

interface UserAuth {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  name: string;
}

interface AuthState {
  user: UserAuth | null;
  isAuthenticated: boolean;
  login: (uid: string, email: string, name: string, emailVerified?: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    const saved = localStorage.getItem('fit_me_auth_user');
    return saved ? JSON.parse(saved) : { uid: 'temporary-guest-id', email: 'user@example.com', name: 'Buddy', emailVerified: true };
  })(),
  isAuthenticated: !!localStorage.getItem('fit_me_auth_user') || true, // Default to true as a guest OS user
  
  login: (uid, email, name, emailVerified = true) => {
    const user = { uid, email, name, emailVerified };
    localStorage.setItem('fit_me_auth_user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('fit_me_auth_user');
    set({ user: null, isAuthenticated: false });
  }
}));
