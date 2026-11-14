/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

export interface Activity {
  id: string;
  type: 'routine' | 'meal' | 'workout' | 'hydration' | 'meeting' | 'supplement' | 'sleep' | 'recovery';
  label: string;
  subtext: string;
  completed: boolean;
  isAiOptimized: boolean;
}

interface PlannerState {
  slotsToday: Record<string, Activity | null>;
  selectedDate: 'yesterday' | 'today' | 'tomorrow';
  activeFilter: 'all' | 'filled';
  isOptimizing: boolean;
  aiOptimizedMessage: string;

  setSelectedDate: (date: 'yesterday' | 'today' | 'tomorrow') => void;
  setActiveFilter: (filter: 'all' | 'filled') => void;
  toggleSlotCompleted: (time: string) => void;
  saveSlotActivity: (time: string, type: Activity['type'], label: string, subtext: string) => void;
  deleteActivity: (time: string) => void;
  optimizeCircadianSlots: (goal: string, illness: string) => void;
}

const INITIAL_ACTIVITIES: Record<string, Activity | null> = {
  '06:00 AM': {
    id: 'Wake-Up',
    type: 'routine',
    label: 'Wake Up & Sunlight prep',
    subtext: 'Circadian rhythm lock. Expose retinas to natural morning ambient photons',
    completed: true,
    isAiOptimized: false,
  },
  '06:30 AM': {
    id: 'Warm-lemon',
    type: 'hydration',
    label: 'Spiced Tamarind & Lime Water',
    subtext: '500ml pure alkaline mineral fluid mapping metabolic triggers',
    completed: true,
    isAiOptimized: false,
  },
  '07:00 AM': null,
  '07:30 AM': null,
  '08:00 AM': {
    id: 'Fibers-meal',
    type: 'meal',
    label: 'Anti-Spike Breakfast Fuel',
    subtext: 'Sprouted grains or Ragi malt with steamed double-egg whites',
    completed: true,
    isAiOptimized: false,
  },
  '08:30 AM': null,
  '09:00 AM': null,
  '09:30 AM': null,
  '10:00 AM': null,
  '10:30 AM': {
    id: 'Deep-work',
    type: 'meeting',
    label: 'Core Professional Focus Block',
    subtext: 'Align targets with focus intervals. Keep absolute hydration limits',
    completed: false,
    isAiOptimized: false,
  },
  '11:00 AM': null,
  '11:30 AM': null,
  '12:00 PM': null,
  '12:30 PM': null,
  '01:00 PM': {
    id: 'Insulin-lunch',
    type: 'meal',
    label: 'Glycemic-Control Lunch Plate',
    subtext: 'Tenerely cooked Gongura Pappu + 1 cup organic red rice + green leafy stir fry',
    completed: false,
    isAiOptimized: false,
  },
  '01:30 PM': null,
  '02:00 PM': null,
  '02:30 PM': null,
  '03:00 PM': null,
  '03:30 PM': null,
  '04:00 PM': null,
  '04:30 PM': {
    id: 'Fluid-hydrate',
    type: 'hydration',
    label: 'Pre-Workout Trace Hydration',
    subtext: 'Electrolytes loaded shaker (citrus water + raw sea-salt)',
    completed: false,
    isAiOptimized: false,
  },
  '05:00 PM': null,
  '05:30 PM': null,
  '06:00 PM': {
    id: 'Kinetic-gym',
    type: 'workout',
    label: 'Strength & Hypertrophy Session',
    subtext: '35 mins targeted compound lifting or zone 2 kinetic treadmill work',
    completed: false,
    isAiOptimized: false,
  },
  '06:30 PM': null,
  '07:00 PM': null,
  '07:30 PM': null,
  '08:00 PM': null,
  '08:30 PM': null,
  '09:00 PM': {
    id: 'Sensory-winddown',
    type: 'routine',
    label: 'Blue Light Cutoff winddown',
    subtext: 'Shut down phone/laptop displays. Warm light environment initialized',
    completed: false,
    isAiOptimized: false,
  },
  '09:30 PM': null,
  '10:00 PM': null,
  '10:30 PM': {
    id: 'Nrem-delta',
    type: 'sleep',
    label: 'Deep restorative NREM rest',
    subtext: 'Wind-down tea + Ashwagandha capsule for cortisol reduction',
    completed: false,
    isAiOptimized: false,
  },
  '11:00 PM': null,
  '11:30 PM': null,
};

export const usePlannerStore = create<PlannerState>((set, get) => ({
  slotsToday: (() => {
    const saved = localStorage.getItem('fit_me_planner_slots_v2');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  })(),
  selectedDate: 'today',
  activeFilter: 'filled',
  isOptimizing: false,
  aiOptimizedMessage: '',

  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),

  toggleSlotCompleted: (time) => {
    if (get().selectedDate === 'yesterday') return; // historical logs are immutable
    set((state) => {
      const current = state.slotsToday[time];
      if (!current) return state;
      const updated = {
        ...state.slotsToday,
        [time]: { ...current, completed: !current.completed },
      };
      localStorage.setItem('fit_me_planner_slots_v2', JSON.stringify(updated));
      return { slotsToday: updated };
    });
  },

  saveSlotActivity: (time, type, label, subtext) => {
    set((state) => {
      const updated = {
        ...state.slotsToday,
        [time]: {
          id: `custom-${Date.now()}`,
          type,
          label,
          subtext: subtext || 'Custom configured block sync',
          completed: false,
          isAiOptimized: false,
        },
      };
      localStorage.setItem('fit_me_planner_slots_v2', JSON.stringify(updated));
      return { slotsToday: updated };
    });
  },

  deleteActivity: (time) => {
    set((state) => {
      const updated = { ...state.slotsToday, [time]: null };
      localStorage.setItem('fit_me_planner_slots_v2', JSON.stringify(updated));
      return { slotsToday: updated };
    });
  },

  optimizeCircadianSlots: (goal, illness) => {
    set({ isOptimizing: true, aiOptimizedMessage: '' });

    setTimeout(() => {
      const currentSlots = { ...get().slotsToday };

      let message = '';
      if (illness === 'diabetes') {
        message =
          'AI Circadian Optimizer Applied (Biochemical Sync): Aligned active post-meal glucose walk protocols. Inserted zone 1 oxygenation pacing post-feedings and added metabolic protective buffers.';
        currentSlots['07:00 AM'] = {
          id: 'opt-dm-1',
          type: 'recovery',
          label: 'Cortisol Balanced Morning Walk',
          subtext: '15 mins slow zone 1 air immersion to prime muscle insulin gates',
          completed: false,
          isAiOptimized: true,
        };
        currentSlots['08:30 AM'] = {
          id: 'opt-dm-2',
          type: 'recovery',
          label: '10-Min Post-Breakfast Stroll',
          subtext: 'Insulin spike clearance. Walk steadily at 4.2 km/h',
          completed: false,
          isAiOptimized: true,
        };
        currentSlots['11:30 AM'] = {
          id: 'opt-dm-3',
          type: 'supplement',
          label: 'Green Tea & Amla Extracts',
          subtext: 'Trace bioflavonoids to support cellular antioxidant pathways',
          completed: false,
          isAiOptimized: true,
        };
        currentSlots['01:30 PM'] = {
          id: 'opt-dm-4',
          type: 'recovery',
          label: '10-Min Post-Lunch Active pacing',
          subtext: 'Reduces post-prandial glycemic rise by up to 34%',
          completed: false,
          isAiOptimized: true,
        };
        currentSlots['08:00 PM'] = {
          id: 'opt-dm-5',
          type: 'recovery',
          label: 'Calm Post-Dinner Mindful Walk',
          subtext: 'Excretes blood glucose safely into skeletal frame before bed',
          completed: false,
          isAiOptimized: true,
        };
      } else if (illness === 'pcos') {
        message =
          'AI Circadian Optimizer Applied (Hormonal Sync): Shifed anaerobic hypertrophy stresses away from circadian sunsets. Inserted Myo-Inositol & spearmint triggers.';
        currentSlots['09:30 AM'] = {
          id: 'opt-pc-1',
          type: 'supplement',
          label: 'Myo-Inositol & Spear-mint solution',
          subtext: 'PCOS insulin sensitivity primer block',
          completed: false,
          isAiOptimized: true,
        };
        currentSlots['11:30 AM'] = {
          id: 'opt-pc-2',
          type: 'recovery',
          label: 'Androgen Regulation Green Break',
          subtext: 'Vagus nerve deep parasympathetic breathwork',
          completed: false,
          isAiOptimized: true,
        };
        currentSlots['05:00 PM'] = {
          id: 'opt-pc-3',
          type: 'workout',
          label: 'Steady-State Resistance Pacing',
          subtext: 'Lower late cortisol spike risk with low-inflammatory weight splits',
          completed: false,
          isAiOptimized: true,
        };
      } else {
        message =
          'AI Circadian Optimizer Applied (Metabolic Sync): Accelerated lean tissue recovery timeline. Synchronized evening protein splits and aligned twilight sleep gates.';
        currentSlots['07:30 AM'] = {
          id: 'opt-gen-1',
          type: 'recovery',
          label: 'Breathing & Core mobilization',
          subtext: '5 cycles of pranayama for optimal systemic oxygenation',
          completed: false,
          isAiOptimized: true,
        };
        currentSlots['05:00 PM'] = {
          id: 'opt-gen-2',
          type: 'hydration',
          label: 'Pre-Workout Amino hydration',
          subtext: '500ml water infused with raw minerals and electrolytes',
          completed: false,
          isAiOptimized: true,
        };
        currentSlots['07:00 PM'] = {
          id: 'opt-gen-3',
          type: 'supplement',
          label: 'High Absorption Protein Intake',
          subtext: '30g grass-fed whey isolate shake for lean fiber restoration',
          completed: false,
          isAiOptimized: true,
        };
      }

      localStorage.setItem('fit_me_planner_slots_v2', JSON.stringify(currentSlots));
      set({ slotsToday: currentSlots, isOptimizing: false, aiOptimizedMessage: message });
    }, 1500);
  },
}));
