/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';

export type Goal = 'fat_loss' | 'weight_gain' | 'maintenance' | 'muscle_building';

export type DiseaseCondition = 'none' | 'diabetes' | 'pcos' | 'thyroid' | 'hypertension' | 'fatty_liver';

export type FoodPreference = 'veg' | 'non_veg' | 'eggetarian' | 'vegan';

export type Region = 'andhra' | 'telangana' | 'rayalaseema' | 'general_indian';

export type Lifestyle = 'busy_professional' | 'homemaker' | 'student' | 'athlete' | 'shift_worker';

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  height: number; // in cm
  weight: number; // in kg
  targetWeight?: number; // in kg
  activity: ActivityLevel;
  goal: Goal;
  disease: DiseaseCondition;
  foodPreference: FoodPreference;
  region: Region;
  lifestyle: Lifestyle;
  hasOnboarded: boolean;
  selectedCoach: 'jai' | 'jaya';
  theme?: 'light' | 'dark' | 'system';
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number; // g
  carbs: number; // g
  fats: number; // g
  fiber: number; // g
  sodium: number; // mg
  potassium: number; // mg
  magnesium: number; // mg
  calcium: number; // mg
  zinc: number; // mg
  iron: number; // mg
  b12: number; // mcg
  vitaminD: number; // IU
  omega3: number; // mg
  hydrationScore: number; // 1-100 score influence
  portion: string;
  category: 'breakfast' | 'morning_snack' | 'lunch' | 'evening_snack' | 'dinner' | 'flexible_meal';
  timestamp: string;
}

export interface SupplementLog {
  id: string;
  name: string;
  dosage: string;
  timing: string; // e.g. 'Morning with breakfast', 'Pre-workout', etc.
  consistencyScore: number; // 0-100
  nutrientImpact: string;
  deficiencyCorrection: string;
  interactions: string;
  timestamp: string;
}

export interface WaterLog {
  amount: number; // ml
  timestamp: string;
}

export interface WeightLog {
  id: string;
  weight: number;
  date: string;
  bodyFatPercentage?: number;
  timestamp: string;
}

export interface BloodSugarLog {
  id: string;
  type: 'fasting' | 'post_meal' | 'random';
  glucoseValue: number; // mg/dL
  hbA1c?: number; // %
  timestamp: string;
  notes?: string;
}

export interface BpLog {
  id: string;
  systolic: number; // mmHg
  diastolic: number; // mmHg
  pulse?: number; // bpm
  timestamp: string;
}

export interface HeartRateLog {
  id: string;
  type: 'resting' | 'workout' | 'recovery' | 'resting_abnormal';
  bpm: number;
  timestamp: string;
}

export interface StressLog {
  id: string;
  level: 'calm' | 'moderate' | 'elevated' | 'high';
  emotionalLoad: number; // 1-10 scale
  burnoutRisk: boolean;
  timestamp: string;
}

export interface SleepLog {
  id: string;
  durationHours: number;
  bedtimeConsistency: number; // percentage
  recoveryQuality: 'poor' | 'fair' | 'good' | 'optimal';
  sleepDebt: number; // hours of gap from target (e.g. 8h)
  sleepScore: number; // 0-100
  timestamp: string;
}

export interface CycleLog {
  id: string;
  cycleDate: string; // YYYY-MM-DD
  isOvulation: boolean;
  symptoms: ('cramps' | 'bloating' | 'headache' | 'fatigue')[];
  pmsSeverity: 'none' | 'mild' | 'severe';
  mood: string;
  flowIntensity: 'light' | 'normal' | 'heavy';
  energyLevel: number; // 1-10
  timestamp: string;
}

export interface BodyMeasurements {
  id: string;
  waist?: number; // cm
  chest?: number; // cm
  arms?: number; // cm
  thighs?: number; // cm
  muscleMass?: number; // kg
  timestamp: string;
}

export interface WorkoutLog {
  id: string;
  type: 'gym' | 'cardio' | 'yoga' | 'walking' | 'cycling' | 'home_workout';
  durationMinutes: number;
  caloriesBurned: number;
  intensity: 'low' | 'moderate' | 'high';
  recoveryScore: number; // 1-100
  timestamp: string;
}

export interface StepLog {
  id: string;
  steps: number;
  distanceKm: number;
  caloriesBurned: number;
  sedentaryMinutes: number;
  timestamp: string;
}

export interface MoodLog {
  id: string;
  state: 'happy' | 'stressed' | 'tired' | 'anxious' | 'energetic' | 'calm';
  correlationNotes?: string;
  timestamp: string;
}

export interface HydrationLog {
  id: string;
  amountMl: number;
  containerType: 'glass' | 'bottle' | 'shaker' | 'custom';
  timestamp: string;
}

export interface CholesterolLog {
  id: string;
  hdl: number; // mg/dL
  ldl: number; // mg/dL
  triglycerides: number; // mg/dL
  timestamp: string;
}

export interface GutHealthLog {
  id: string;
  digestionLevel: 'excellent' | 'normal' | 'bloated' | 'acidic';
  isBowelConsistent: boolean;
  probioticTaken: boolean;
  timestamp: string;
}

export interface SkinHairLog {
  id: string;
  acneLevel: 'none' | 'mild' | 'moderate';
  isDrySkin: boolean;
  hairFallLevel: 'normal' | 'noticeable' | 'heavy';
  observedDeficiencies?: string[];
  timestamp: string;
}

export interface ImmunityScore {
  score: number; // 0-100
  factors: {
    sleepRating: number;
    nutritionRating: number;
    hydrationRating: number;
    activityRating: number;
    stressRating: number;
  };
  timestamp: string;
}

export interface HealthScore {
  score: number; // 0-100
  breakdown: string;
  suggestions: string[];
  timestamp: string;
}

export interface Habit {
  id: string;
  title: string;
  category: 'nutrition' | 'activity' | 'sleep' | 'mindfulness';
  icon: string;
  completedDays: string[]; // dates e.g., '2026-05-25'
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
  audioBase64?: string; // voice audio from Jai/Jaya
}

export interface SubscriptionPlan {
  id: 'base' | 'premium' | 'luxury';
  name: string;
  price: number;
  billing: string;
  features: string[];
  badge?: string;
}

export interface CustomFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sodium: number;
  potassium: number;
  magnesium: number;
  calcium: number;
  zinc: number;
  iron: number;
  b12: number;
  vitaminD: number;
  omega3: number;
  portion: string;
  regionCode: string;
}
