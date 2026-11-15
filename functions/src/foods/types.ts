export interface FoodDoc {
  name: string;
  names?: Record<string, string>;
  per100g: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number };
  servings: Array<{ label: string; labels?: Record<string, string>; grams: number }>;
  source: 'usda' | 'curated' | 'off';
  sourceId: string;
  category: string;
  countries: string[];
  searchTokens: string[];
  rank: number;
  reviewStatus: 'approved' | 'pending_review';
  license: string;
}

/** Micronutrients per 100 g, stored separately so Security Rules can limit them to Premium (PRD section 2). */
export interface FoodMicrosDoc {
  sugarG?: number;
  sodiumMg?: number;
  calciumMg?: number;
  ironMg?: number;
  magnesiumMg?: number;
  potassiumMg?: number;
  zincMg?: number;
  vitaminAUg?: number;
  vitaminCMg?: number;
  vitaminDUg?: number;
  vitaminB6Mg?: number;
  vitaminB12Ug?: number;
}
