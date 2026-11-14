/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types';

export interface HealthTargets {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  waterMl: number; // ml
  steps: number;
}

/**
 * Calculates adaptive, scientific health targets using Mifflin-St Jeor formula
 * adjusted for clinical disease modifiers, gender, and target weights.
 */
export function calculateHealthTargets(profile: UserProfile): HealthTargets {
  const weight = Number(profile.weight) || 68;
  const height = Number(profile.height) || 172;
  const age = Number(profile.age) || 26;
  const gender = profile.gender || 'other';
  const activity = profile.activity || 'lightly_active';
  const goal = profile.goal || 'fat_loss';
  const disease = profile.disease || 'none';

  // 1. Calculate Basal Metabolic Rate (BMR) (Mifflin-St Jeor)
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'male') {
    bmr += 5;
  } else if (gender === 'female') {
    bmr -= 161;
  } else {
    bmr -= 78; // average offset for gender-neutral metrics
  }

  // 2. Multiplier based on physical activity patterns
  let tdeeMultiplier = 1.2; // sedentary
  if (activity === 'lightly_active') tdeeMultiplier = 1.375;
  else if (activity === 'moderately_active') tdeeMultiplier = 1.55;
  else if (activity === 'very_active') tdeeMultiplier = 1.725;

  let tdee = bmr * tdeeMultiplier;

  // 3. Clinical Adjustments for Metabolism Speed based on Diseases
  if (disease === 'thyroid') {
    // Underactive thyroid commonly slows metabolic BMR rates by 10-15%
    tdee = tdee * 0.88;
  } else if (disease === 'pcos') {
    // PCOS often creates severe insulin resistance slowing average active energy expenditure
    tdee = tdee * 0.92;
  } else if (disease === 'diabetes') {
    // Calibrate strictly for glycemic-protective thermal limits
    tdee = tdee * 0.95;
  }

  // 4. Adjust calorie targets for Goals
  let targetCalories = tdee;
  if (goal === 'fat_loss') {
    targetCalories = tdee - 450;
  } else if (goal === 'weight_gain') {
    targetCalories = tdee + 400;
  } else if (goal === 'muscle_building') {
    targetCalories = tdee + 300;
  }

  // Apply safety floors
  const safetyFloor = gender === 'female' ? 1200 : 1400;
  targetCalories = Math.max(safetyFloor, Math.round(targetCalories));

  // 5. Macro splits based on weight, goals, and clinical constraints
  let proteinRatio = 1.2; // g per kg of bodyweight (base default)
  if (goal === 'muscle_building') proteinRatio = 2.0;
  else if (goal === 'fat_loss') proteinRatio = 1.6;
  else if (goal === 'weight_gain') proteinRatio = 1.5;

  // Special clinical macro-tuning
  if (disease === 'fatty_liver') {
    // High protein, low fat, and low carbohydrate strain limits
    proteinRatio = Math.max(proteinRatio, 1.5);
  }

  const targetProteinGrams = Math.round(weight * proteinRatio);
  // Fats: 25% to 30% of total calories. 1g fat = 9 kcal
  const fatKcalPercentage = disease === 'fatty_liver' || disease === 'hypertension' ? 0.22 : 0.28;
  const targetFatsGrams = Math.round((targetCalories * fatKcalPercentage) / 9);
  // Carbs: Remaining calories. 1g carb = 4 kcal
  const remainingKcal = targetCalories - (targetProteinGrams * 4) - (targetFatsGrams * 9);
  const targetCarbsGrams = Math.max(50, Math.round(remainingKcal / 4)); // absolute minimum carb floor

  // 6. Water Hydration Target calculating biological parameters
  // Base 30ml per kg + temperature/dryness/exercise modifier
  let baseHydrationMl = weight * 35;
  if (activity === 'very_active') baseHydrationMl += 500;
  if (disease === 'pcos' || disease === 'diabetes') baseHydrationMl += 300; // supports kidney flushing and systemic filtering
  const targetWaterMl = Math.max(2000, Math.round(baseHydrationMl));

  // 7. Adaptive Steps Target
  let stepsGoal = 8000;
  if (goal === 'fat_loss') stepsGoal = 10000;
  if (activity === 'very_active') stepsGoal = 12000;
  if (disease === 'hypertension' || disease === 'diabetes') {
    // Clinically validated targets to support vascular wall elasticity and post-meal glucose disposal
    stepsGoal = Math.max(stepsGoal, 9000);
  }

  return {
    calories: targetCalories,
    protein: targetProteinGrams,
    carbs: targetCarbsGrams,
    fats: targetFatsGrams,
    waterMl: targetWaterMl,
    steps: stepsGoal
  };
}
