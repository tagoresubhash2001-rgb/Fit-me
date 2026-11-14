/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { validateSteps } from '../validators/workout.validator';

interface WorkoutState {
  steps: number;
  workoutDuration: number;
  workoutActive: boolean;
  activeTimer: number;
  incrementSteps: (amount: number) => void;
  setSteps: (steps: number) => void;
  setWorkoutActive: (active: boolean) => void;
  tickTimer: () => void;
  resetTimer: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  steps: (() => {
    const saved = localStorage.getItem('fit_me_steps_v2');
    return saved ? Number(saved) : 8420;
  })(),
  workoutDuration: 0,
  workoutActive: false,
  activeTimer: 0,

  incrementSteps: (amount) => {
    set((state) => {
      const updated = validateSteps(state.steps + amount);
      localStorage.setItem('fit_me_steps_v2', updated.toString());
      return { steps: updated };
    });
  },

  setSteps: (steps) => {
    const validated = validateSteps(steps);
    localStorage.setItem('fit_me_steps_v2', validated.toString());
    set({ steps: validated });
  },

  setWorkoutActive: (workoutActive) => set({ workoutActive }),
  tickTimer: () => set((state) => ({ activeTimer: state.activeTimer + 1 })),
  resetTimer: () => set({ activeTimer: 0 })
}));
