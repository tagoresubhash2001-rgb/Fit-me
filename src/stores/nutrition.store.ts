/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Meal } from '../types';
import { validateCalories, validateMacros } from '../validators/calories.validator';

interface NutritionState {
  mealLogs: Meal[];
  addMealLog: (meal: Omit<Meal, 'id' | 'timestamp'>) => void;
  removeMealLog: (id: string) => void;
  clearMealLogs: () => void;
  getCategoryCalories: (category: string) => number;
  getTotalCalories: () => number;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  mealLogs: (() => {
    const saved = localStorage.getItem('fit_me_meals_v1');
    return saved ? JSON.parse(saved) : [];
  })(),

  addMealLog: (meal) => {
    const validatedKcal = validateCalories(meal.calories);
    const validatedMacrosObj = validateMacros(meal.protein || 0, meal.carbs || 0, meal.fats || 0);

    const newMeal: Meal = {
      ...meal,
      id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      calories: validatedKcal,
      protein: validatedMacrosObj.protein,
      carbs: validatedMacrosObj.carbs,
      fats: validatedMacrosObj.fats,
      fiber: Math.max(0, Number(meal.fiber) || 0),
      sodium: Math.max(0, Number(meal.sodium) || 0),
      potassium: Math.max(0, Number(meal.potassium) || 0),
      magnesium: Math.max(0, Number(meal.magnesium) || 0),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => {
      const updated = [...state.mealLogs, newMeal];
      localStorage.setItem('fit_me_meals_v1', JSON.stringify(updated));
      return { mealLogs: updated };
    });
  },

  removeMealLog: (id) => {
    set((state) => {
      const updated = state.mealLogs.filter((m) => m.id !== id);
      localStorage.setItem('fit_me_meals_v1', JSON.stringify(updated));
      return { mealLogs: updated };
    });
  },

  clearMealLogs: () => {
    localStorage.removeItem('fit_me_meals_v1');
    set({ mealLogs: [] });
  },

  getCategoryCalories: (category) => {
    return get()
      .mealLogs.filter((m) => m.category === category)
      .reduce((sum, m) => sum + m.calories, 0);
  },

  getTotalCalories: () => {
    return get().mealLogs.reduce((sum, m) => sum + m.calories, 0);
  },
}));
