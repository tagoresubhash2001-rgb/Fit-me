/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FoodItem, GLOBAL_FOOD_DB } from './foodDb';
import { SupplementLog } from '../types';

export interface Recipe {
  id: string;
  name: string;
  category: string;
  cuisine: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: string[];
  instructions: string[];
  macros: { calories: number; protein: number; carbs: number; fats: number; fiber: number };
}

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sodium: number;
  additives: string[];
  ingredientsText: string;
}

export interface DiseaseTag {
  id: string;
  name: string;
  forbiddenIngredients: string[];
  recommendedNutrients: string[];
  advisoryText: string;
}

// Simulated active collections representing the requested database architecture
export const DB_COLLECTIONS = {
  foods: GLOBAL_FOOD_DB,

  recipes: [
    {
      id: 'rec-1',
      name: 'Anti-Diabetes Millet Roti',
      category: 'breakfast',
      cuisine: 'Andhra',
      prepTimeMinutes: 10,
      cookTimeMinutes: 10,
      ingredients: ['1 cup Korra Biyyalu (Foxtail Millet flour)', 'Pinch of salt', 'Hot water'],
      instructions: ['Boil water, mix with millet flour to form soft dough.', 'Roll with minimal dusting.', 'Cook on hot tawa until browned.'],
      macros: { calories: 180, protein: 5, carbs: 32, fats: 2, fiber: 6 }
    },
    {
      id: 'rec-2',
      name: 'PCOS Seed Cycling Gourd Bowl',
      category: 'lunch',
      cuisine: 'Rayalaseema',
      prepTimeMinutes: 15,
      cookTimeMinutes: 20,
      ingredients: ['1 cup Ash Gourd diced', '1 tbsp pumpkin seeds', '1 tbsp flax seeds', 'Turmeric and mustard seeds'],
      instructions: ['Steam ash gourd with turmeric.', 'Add tempered mustard seeds.', 'Top with raw pumpkin/flax seeds.'],
      macros: { calories: 140, protein: 4, carbs: 12, fats: 8, fiber: 5 }
    },
    {
      id: 'rec-3',
      name: 'High Protein Natu Kodi Pulusu Soup',
      category: 'dinner',
      cuisine: 'Telangana',
      prepTimeMinutes: 20,
      cookTimeMinutes: 45,
      ingredients: ['250g Country Chicken', 'Onions', 'Tomato', 'Garam masala', 'Ginger garlic paste'],
      instructions: ['Pressure cook chicken with water, ginger garlic, salt.', 'Sauté chopped onion and tomato with masalas.', 'Mix and simmer until thick soup consistency.'],
      macros: { calories: 310, protein: 32, carbs: 4, fats: 16, fiber: 2 }
    }
  ] as Recipe[],

  barcode_products: [
    {
      barcode: '8901234567890',
      name: 'Premium Roasted Salted Almonds',
      brand: 'NutriChoice',
      calories: 170,
      protein: 6,
      carbs: 5,
      fats: 15,
      fiber: 3,
      sodium: 140,
      additives: ['None'],
      ingredientsText: 'Whole almonds, Sea salt.'
    },
    {
      barcode: '0012345678901',
      name: 'Clean Whey Isolate Protein',
      brand: 'MuscleForce',
      calories: 120,
      protein: 26,
      carbs: 2,
      fats: 1,
      fiber: 0,
      sodium: 70,
      additives: ['Sucralose', 'Soy lecithin'],
      ingredientsText: 'Whey Protein Isolate, Natural Vanilla Flavors, Sweeteners.'
    },
    {
      barcode: '8902345678901',
      name: 'Instant Rolled Oats - Gluten Free',
      brand: 'Organica',
      calories: 150,
      protein: 5,
      carbs: 27,
      fats: 2.5,
      fiber: 4,
      sodium: 5,
      additives: ['None'],
      ingredientsText: '100% whole grain rolled oats.'
    }
  ] as BarcodeProduct[],

  disease_tags: [
    {
      id: 'diabetes',
      name: 'Diabetes Mellitus',
      forbiddenIngredients: ['Polished White Rice', 'Refined Sugar', 'All-Purpose Flour (Maida)'],
      recommendedNutrients: ['Fiber', 'Chromium', 'Magnesium'],
      advisoryText: 'Focus on Low Glycemic Index millets (Sajja, Ragi, Korra) to avoid sudden spikes.'
    },
    {
      id: 'pcos',
      name: 'PCOS / PCOD Care',
      forbiddenIngredients: ['Processed Vegetable Oils', 'Sugary Drinks', 'Excess Soy'],
      recommendedNutrients: ['Inositol', 'Zinc', 'Omega-3 Fatty Acids'],
      advisoryText: 'Maintain high fibers and essential fats. Incorporate seed cycling (pumpkin, flax).'
    },
    {
      id: 'thyroid',
      name: 'Hypothyroidism Manager',
      forbiddenIngredients: ['Raw Cruciferous Veggies', 'Unfermented Raw Soy'],
      recommendedNutrients: ['Iodine', 'Selenium', 'Zinc'],
      advisoryText: 'Ensure goitrogens are thoroughly steamed before eating. Consume selenium-rich nuts.'
    }
  ] as DiseaseTag[],

  global_cuisines: ['American', 'Italian', 'Mexican', 'Japanese', 'Korean', 'Chinese', 'Mediterranean', 'Middle Eastern', 'African', 'Vegan Premium', 'Keto', 'Paleo', 'Sports Nutrition'],
  regional_cuisines: ['Andhra', 'Telangana', 'Rayalaseema', 'General Indian']
};

export const DEFAULT_SUPPLEMENTS = [
  { name: 'Whey Protein Isolate', category: 'protein', baseDosage: '1 Scoop (approx 35g)', bestTiming: 'Post-Workout / Morning', deficiencyCorrection: 'Optimizes muscle protein synthesis and corrects protein deficits.', interactions: 'Safe when taken within limits. Best with water or milk.' },
  { name: 'Micronized Creatine Monohydrate', category: 'performance', baseDosage: '3g to 5g', bestTiming: 'Pre/Post-Workout', deficiencyCorrection: 'Boosts ATP production and physical strength reserves.', interactions: 'Requires substantial hydration. Do not take on dehydrated state.' },
  { name: 'Multivitamin Elite Tablet', category: 'vitamins', baseDosage: '1 Tablet', bestTiming: 'Morning with food', deficiencyCorrection: 'Corrects zinc, vitamin C, A, E, and general vitamin gaps.', interactions: 'May cause minor nausea if consumed completely on empty stomach.' },
  { name: 'Omega-3 Fish Oil (1000mg)', category: 'fats', baseDosage: '1 Softgel', bestTiming: 'With lunch', deficiencyCorrection: 'Supports heart, joint mobility, and hormone production.', interactions: 'Safe. Do not combine with blood thinning pills without consultation.' },
  { name: 'Vitamin D3 Cholecalciferol (2000 IU)', category: 'vitamins', baseDosage: '1 Softgel', bestTiming: 'Morning with heavy fats', deficiencyCorrection: 'Essential for immune wellness and calcium absorption.', interactions: 'Best absorbed with fatty meals. Avoid double-dosing with multivitamins.' },
  { name: 'Magnesium Bisglycinate (200mg)', category: 'minerals', baseDosage: '1 Capsule', bestTiming: '30 mins before sleep', deficiencyCorrection: 'Promotes muscle relief, sleep depth, and central nervous sync.', interactions: 'Do not consume simultaneously with high calcium dosages.' },
  { name: 'Methylcobalamin Vitamin B12 (500mcg)', category: 'vitamins', baseDosage: '1 Tablet', bestTiming: 'Morning', deficiencyCorrection: 'Rejuvenates nerve health and corrects severe vegetarian deficits.', interactions: 'Generally very safe.' },
  { name: 'Ashwagandha KSM-66 Supplement', category: 'ayurvedic', baseDosage: '1 Capsule (500mg)', bestTiming: 'Night with warm water', deficiencyCorrection: 'Dramatically regulates cortisol and hormonal stress markers.', interactions: 'Avoid taking with sleeping pills unless prescribed.' },
  { name: 'Ayurvedic Triphala Extract', category: 'ayurvedic', baseDosage: '1 Tablet', bestTiming: 'Bedtime', deficiencyCorrection: 'Enhances digestion, relieves gut toxicity, and clears bowel movements.', interactions: 'Best on an empty stomach right before bed.' },
  { name: 'Protein energy Bar (Low Sugar)', category: 'sports', baseDosage: '1 Bar', bestTiming: 'Mid-day snack', deficiencyCorrection: 'Provides active protein on the fly to prevent muscle breakdowns.', interactions: 'None.' }
];

export const getAggregatedNutrientsOfToday = (meals: any[]) => {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    sodium: 0,
    potassium: 0,
    magnesium: 0,
    calcium: 0,
    zinc: 0,
    iron: 0,
    b12: 0,
    vitaminD: 0,
    omega3: 0,
    hydrationScore: 50, // default baseline
  };

  if (!meals || meals.length === 0) return totals;

  meals.forEach((m) => {
    totals.calories += Number(m.calories || 0);
    totals.protein += Number(m.protein || 0);
    totals.carbs += Number(m.carbs || 0);
    totals.fats += Number(m.fats || 0);
    totals.fiber += Number(m.fiber || 0);
    totals.sodium += Number(m.sodium || 0);
    totals.potassium += Number(m.potassium || 0);
    totals.magnesium += Number(m.magnesium || 0);
    totals.calcium += Number(m.calcium || 0);
    totals.zinc += Number(m.zinc || 0);
    totals.iron += Number(m.iron || 0);
    totals.b12 += Number(m.b12 || 0);
    totals.vitaminD += Number(m.vitaminD || 0);
    totals.omega3 += Number(m.omega3 || 0);
    totals.hydrationScore = Math.max(totals.hydrationScore, m.hydrationScore || 50);
  });

  return totals;
};
