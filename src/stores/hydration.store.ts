/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { validateWaterAmount } from '../validators/hydration.validator';

interface HydrationState {
  waterAmount: number;
  incrementWater: (amount: number) => void;
  resetWater: () => void;
}

export const useHydrationStore = create<HydrationState>((set) => ({
  waterAmount: (() => {
    const saved = localStorage.getItem('fit_me_water_v1');
    return saved ? Number(saved) : 1250; // default initial hydration
  })(),

  incrementWater: (amount) => {
    set((state) => {
      const updated = validateWaterAmount(state.waterAmount + amount);
      localStorage.setItem('fit_me_water_v1', updated.toString());
      return { waterAmount: updated };
    });
  },

  resetWater: () => {
    localStorage.removeItem('fit_me_water_v1');
    set({ waterAmount: 0 });
  }
}));
