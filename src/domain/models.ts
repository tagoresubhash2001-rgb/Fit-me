/**
 * Data model (PRD section 13). Every record stored under users/{uid}/<collection>/{id}
 * has id, uid, createdAt, updatedAt, date (user's local date), tz, source and status.
 */
import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from './locale';

export const RecordSource = z.enum(['manual', 'ai', 'device', 'import']);
export const RecordStatus = z.enum(['active', 'deleted', 'planned', 'completed', 'skipped']);
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const BaseRecord = z.object({
  id: z.string().min(1),
  uid: z.string().min(1),
  date: IsoDate,
  tz: z.string().min(1),
  source: RecordSource,
  status: RecordStatus,
});
export type BaseRecord = z.infer<typeof BaseRecord> & { createdAt?: unknown; updatedAt?: unknown };

export const MealSlot = z.enum(['breakfast', 'morning_snack', 'lunch', 'evening_snack', 'dinner', 'other']);
export type MealSlot = z.infer<typeof MealSlot>;
export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'morning_snack', 'lunch', 'evening_snack', 'dinner', 'other'];

/** Nutrients for the logged quantity. Micronutrients are optional and shown only to Premium. */
export const Nutrients = z.object({
  calories: z.number().min(0).max(10000),
  proteinG: z.number().min(0).max(1000),
  carbsG: z.number().min(0).max(2000),
  fatG: z.number().min(0).max(1000),
  fiberG: z.number().min(0).max(500),
  sugarG: z.number().min(0).max(2000).optional(),
  sodiumMg: z.number().min(0).max(100000).optional(),
});
export type Nutrients = z.infer<typeof Nutrients>;

export const FoodLog = BaseRecord.extend({
  slot: MealSlot,
  foodId: z.string().nullable(),
  name: z.string().min(1).max(160),
  servingLabel: z.string().max(80),
  servings: z.number().positive().max(100),
  grams: z.number().min(0).max(5000).nullable(),
  nutrients: Nutrients,
  foodSource: z.string().max(40).optional(), // usda | off | curated | custom | ai
  /** Kept so an entry can be edited exactly later (owner corrections 8 and 10). */
  per100g: Nutrients.optional(),
  unitId: z.string().max(20).optional(),
  unitGrams: z.number().positive().max(5000).optional(),
  servingsOptions: z.array(z.object({ label: z.string(), grams: z.number() })).max(8).optional(),
  timeMinutes: z.number().int().min(0).max(1439).optional(),
  /** Product photo when the food has one (Open Food Facts), shown as a rounded thumbnail. */
  imageUrl: z.string().max(400).regex(/^(https:\/\/(images\.openfoodfacts\.org|firebasestorage\.googleapis\.com)\/|\/[\w/.-]+$)/).optional(),
});
export type FoodLog = z.infer<typeof FoodLog>;

export const WaterLog = BaseRecord.extend({ ml: z.number().int().min(1).max(5000) });
export type WaterLog = z.infer<typeof WaterLog>;

export const WeightLog = BaseRecord.extend({
  kg: z.number().min(20).max(400),
  waistCm: z.number().min(30).max(250).optional(),
  chestCm: z.number().min(30).max(250).optional(),
  hipCm: z.number().min(30).max(250).optional(),
});
export type WeightLog = z.infer<typeof WeightLog>;

export const SleepLog = BaseRecord.extend({
  startMinutes: z.number().int().min(0).max(1439), // local minutes of bedtime
  endMinutes: z.number().int().min(0).max(1439),
  durationMin: z
    .number()
    .int()
    .min(0)
    .max(24 * 60),
  quality: z.number().int().min(1).max(5).optional(),
  deviceName: z.string().max(80).optional(),
});
export type SleepLog = z.infer<typeof SleepLog>;

export const StepLog = BaseRecord.extend({ steps: z.number().int().min(0).max(200000), deviceName: z.string().max(80).optional(), sources: z.array(z.string().max(40)).max(6).optional() });
export type StepLog = z.infer<typeof StepLog>;

export const WorkoutSet = z.object({
  exerciseId: z.string(),
  reps: z.number().int().min(0).max(1000).optional(),
  weightKg: z.number().min(0).max(1000).optional(),
  seconds: z.number().int().min(0).max(36000).optional(),
});
export const WorkoutLog = BaseRecord.extend({
  name: z.string().min(1).max(120),
  durationMin: z.number().min(0).max(1440),
  sets: z.array(WorkoutSet).max(200),
  caloriesEst: z.number().min(0).max(5000),
  /** GPS-tracked walks, runs and rides (RouteTracker). */
  activity: z.enum(['walk', 'run', 'ride']).optional(),
  distanceKm: z.number().min(0).max(1000).optional(),
  route: z.array(z.object({ lat: z.number(), lng: z.number() })).max(400).optional(),
});
export type WorkoutLog = z.infer<typeof WorkoutLog>;

export const Sex = z.enum(['male', 'female']);
export const UserProfile = z.object({
  uid: z.string(),
  name: z.string().trim().min(1).max(60),
  birthYear: z.number().int().min(1900).max(2100),
  /** ISO yyyy-mm-dd (owner correction 1). birthYear is kept for older profiles and server summaries. */
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sex: Sex,
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(25).max(350),
  targetWeightKg: z.number().min(25).max(350),
  activity: z.enum(['sedentary', 'light', 'moderate', 'very', 'extra']),
  /** Calorie goal derived from the primary goal. */
  goal: z.enum(['lose', 'gain', 'maintain', 'build_muscle', 'improve_fitness', 'wellness', 'eating_habits']),
  /** All selected goals (owner correction 3); primaryGoal drives the calorie target. */
  goals: z.array(z.string()).max(9).optional(),
  primaryGoal: z.string().optional(),
  dietType: z.enum(['vegetarian', 'non_vegetarian', 'eggetarian', 'vegan', 'pescatarian']),
  allergies: z.array(z.string().max(40)).max(30),
  restrictions: z.array(z.string().max(40)).max(10).optional(),
  equipment: z.enum(['none', 'home_basic', 'gym']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  workStartMinutes: z.number().int().min(0).max(1439).nullable(),
  workEndMinutes: z.number().int().min(0).max(1439).nullable(),
  sleepStartMinutes: z.number().int().min(0).max(1439),
  wakeMinutes: z.number().int().min(0).max(1439),
  country: z.string().length(2),
  region: z.string().max(80).optional(),
  regionCode: z.string().max(10).optional(),
  city: z.string().max(80).optional(),
  language: z.enum(SUPPORTED_LANGUAGES),
  currency: z.string().length(3),
  units: z.enum(['metric', 'imperial']),
  /** Display units per measure (owner correction 2). Firestore always stores metric. */
  heightUnit: z.enum(['cm', 'ftin']).optional(),
  weightUnit: z.enum(['kg', 'lb', 'stlb']).optional(),
  volumeUnit: z.enum(['ml', 'l', 'floz', 'cup']).optional(),
  timezone: z.string().min(1),
  weekStart: z.union([z.literal(0), z.literal(1), z.literal(6)]),
  coach: z.enum(['jai', 'jaya']),
  waterTargetMl: z.number().int().min(500).max(8000).optional(),
  stepTarget: z.number().int().min(1000).max(50000).optional(),
  targets: z.object({
    bmi: z.number(),
    bmr: z.number(),
    tdee: z.number(),
    calories: z.number(),
    proteinG: z.number(),
    fatG: z.number(),
    carbsG: z.number(),
    fiberG: z.number(),
    waterMl: z.number(),
  }),
  onboardedAt: z.unknown().optional(),
  /** Profile photo (Storage users/{uid}/profile/...), shown by the shared Avatar. */
  photoURL: z.string().url().nullable().optional(),
  photoPath: z.string().max(200).nullable().optional(),
});
export type UserProfile = z.infer<typeof UserProfile>;

export const LOG_COLLECTIONS = ['foodLogs', 'waterLogs', 'workoutLogs', 'weightLogs', 'sleepLogs', 'stepLogs'] as const;
export type LogCollection = (typeof LOG_COLLECTIONS)[number];
