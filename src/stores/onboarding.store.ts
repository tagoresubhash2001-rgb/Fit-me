/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  totalSteps: 6,
  nextStep: () => set((state) => ({ currentStep: Math.min(state.totalSteps, state.currentStep + 1) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
  setStep: (step) => set({ currentStep: step }),
  resetOnboarding: () => set({ currentStep: 1 }),
}));
