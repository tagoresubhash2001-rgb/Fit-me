/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { UserProfile } from '../types';

interface UserState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: 26,
  gender: 'other',
  height: 172,
  weight: 68,
  targetWeight: 65,
  activity: 'lightly_active',
  goal: 'fat_loss',
  disease: 'none',
  foodPreference: 'veg',
  region: 'general_indian',
  lifestyle: 'busy_professional',
  hasOnboarded: false,
  selectedCoach: 'jai',
  theme: 'dark'
};

export const useUserStore = create<UserState>((set) => ({
  profile: (() => {
    const saved = localStorage.getItem('fit_me_profile_v2');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  })(),

  updateProfile: (updates) => {
    set((state) => {
      const updatedProfile = { ...state.profile, ...updates };
      localStorage.setItem('fit_me_profile_v2', JSON.stringify(updatedProfile));
      return { profile: updatedProfile };
    });
  },

  resetProfile: () => {
    localStorage.removeItem('fit_me_profile_v2');
    set({ profile: DEFAULT_PROFILE });
  }
}));
