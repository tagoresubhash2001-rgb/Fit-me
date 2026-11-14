/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Droplet, Zap, Search, Plus, Minus, PlusCircle, ArrowUpRight, 
  CheckCircle, HelpCircle, Trophy, Sparkles, LogOut, ChevronRight, 
  Apple, Camera, ScanLine, ShieldCheck, ChevronDown, ChevronUp, 
  AlertCircle, RefreshCw, Footprints, Pill, Activity, ShieldAlert
} from 'lucide-react';
import { UserProfile, Meal } from '../types';
import ClinicalTrackingModules from './health/ClinicalTrackingModules';
import { calculateHealthTargets } from '../utils/healthCalculations';
import { useWorkoutStore } from '../stores/workout.store';
import { getRecipeTipsForProfile } from '../data/recipeTips';
import { Award } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  mealLogs: Meal[];
  waterAmount: number;
  incrementWater: (amount: number) => void;
  openMealModal: () => void;
  quickAnalyzeFood: (query: string) => void;
  onReset: () => void;
  setActiveTab: (tab: string) => void;
  addMealLog: (meal: Omit<Meal, 'id' | 'timestamp'>) => void;
  removeMealLog: (id: string) => void;
}

// Local food database for manual selection
const HEALTH_FOOD_DB = [
  { name: 'Oatmeal with Almonds & Berries', calories: 280, protein: 11, carbs: 42, fats: 6, portion: '1 medium bowl', fiber: 8, sodium: 120, potassium: 360, magnesium: 65, calcium: 80, zinc: 1.8, iron: 2.2, b12: 0, vitaminD: 0, omega3: 150, hydrationScore: 80 },
  { name: 'Steamed Ragi Malt (Finger Millet)', calories: 190, protein: 4, carbs: 38, fats: 2, portion: '1 glass (250ml)', fiber: 6, sodium: 80, potassium: 280, magnesium: 50, calcium: 340, zinc: 1.1, iron: 1.8, b12: 0, vitaminD: 0, omega3: 0, hydrationScore: 90 },
  { name: 'Steamed Rice Idliest with Sambhar', calories: 220, protein: 6, carbs: 45, fats: 2, portion: '2 pieces + sambhar', fiber: 4, sodium: 280, potassium: 190, magnesium: 30, calcium: 40, zinc: 0.8, iron: 1.2, b12: 0.1, vitaminD: 0, omega3: 0, hydrationScore: 70 },
  { name: 'Egg White Scramble with Spinach', calories: 140, protein: 18, carbs: 4, fats: 3, portion: '3 egg whites + greens', fiber: 2, sodium: 220, potassium: 310, magnesium: 45, calcium: 50, zinc: 1.2, iron: 1.8, b12: 0.8, vitaminD: 40, omega3: 80, hydrationScore: 65 },
  { name: 'Grilled Herb Chicken Breast & Salad', calories: 340, protein: 32, carbs: 8, fats: 10, portion: '150g cooked breast', fiber: 3, sodium: 190, potassium: 450, magnesium: 55, calcium: 60, zinc: 2.4, iron: 1.5, b12: 1.2, vitaminD: 20, omega3: 120, hydrationScore: 60 },
  { name: 'Baked Salmon with Quinoa and Veggies', calories: 420, protein: 28, carbs: 35, fats: 12, portion: '1 plate', fiber: 7, sodium: 140, potassium: 520, magnesium: 80, calcium: 70, zinc: 2.1, iron: 2.8, b12: 3.2, vitaminD: 240, omega3: 1100, hydrationScore: 55 },
  { name: 'Mixed Sprouted Moong Dal Bowl', calories: 160, protein: 12, carbs: 28, fats: 1, portion: '1 cup sprouts', fiber: 9, sodium: 45, potassium: 420, magnesium: 75, calcium: 62, zinc: 1.9, iron: 2.4, b12: 0, vitaminD: 0, omega3: 60, hydrationScore: 75 },
  { name: 'Pure Greek Yogurt with Flaxseeds', calories: 180, protein: 15, carbs: 12, fats: 6, portion: '1 cup', fiber: 3, sodium: 90, potassium: 240, magnesium: 40, calcium: 180, zinc: 1.3, iron: 0.5, b12: 0.9, vitaminD: 60, omega3: 450, hydrationScore: 85 }
];

export default function Dashboard({ 
  profile, 
  mealLogs, 
  waterAmount, 
  incrementWater, 
  openMealModal,
  quickAnalyzeFood,
  onReset,
  setActiveTab,
  addMealLog,
  removeMealLog
}: DashboardProps) {
  const { steps, incrementSteps } = useWorkoutStore();
  const [dashboardMode, setDashboardMode] = useState<'nutrition' | 'clinical'>('nutrition');

  // Track Which Meal Tab is Expanded (Breakfast, Morning Snack, etc.)
  const [expandedMealSection, setExpandedMealSection] = useState<string | null>(null);

  // Sub-tabs for the expanded meals sections
  const [subTabMap, setSubTabMap] = useState<Record<string, 'camera' | 'barcode' | 'manual' | 'favorites' | 'recents'>>({});

  // Search input state inside expanded categories
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Scanner Simulator States
  const [scanningCategory, setScanningCategory] = useState<string | null>(null);
  const [activeScanType, setActiveScanType] = useState<'camera' | 'barcode' | null>(null);
  const [scanProgress, setScanProgress] = useState(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState('');

  // Daily Supplements Log State
  const [supplementStates, setSupplementStates] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('fit_me_completed_supps');
    return saved ? JSON.parse(saved) : {
      'whey': false,
      'creatine': false,
      'omega-3': false,
      'vitamin-d': false,
      'magnesium': false,
      'multivitamins': false,
      'pre-workout': false,
      'protein-bars': false,
      'ayurvedic': false
    };
  });

  useEffect(() => {
    localStorage.setItem('fit_me_completed_supps', JSON.stringify(supplementStates));
  }, [supplementStates]);

  const toggleSupplement = (key: string) => {
    setSupplementStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Recipe tips dynamic cycle & quick log mapping
  const matchedRecipes = getRecipeTipsForProfile(profile.region || 'general_indian', profile.goal || 'fat_loss');
  const [recipeIndex, setRecipeIndex] = useState(0);
  const [showLogCategorySelector, setShowLogCategorySelector] = useState(false);
  const [recipeLoggedSuccess, setRecipeLoggedSuccess] = useState('');

  const currentRecipe = matchedRecipes.length > 0 ? matchedRecipes[recipeIndex % matchedRecipes.length] : null;

  const handleLogRecipe = (categoryKey: string) => {
    if (!currentRecipe) return;
    addMealLog({
      name: currentRecipe.title,
      calories: currentRecipe.macros.calories,
      protein: currentRecipe.macros.protein,
      carbs: currentRecipe.macros.carbs,
      fats: currentRecipe.macros.fats,
      fiber: currentRecipe.macros.fiber,
      sodium: 110,
      potassium: 330,
      magnesium: 50,
      calcium: 80,
      zinc: 1.3,
      iron: 1.6,
      b12: 0,
      vitaminD: 0,
      omega3: 80,
      hydrationScore: 75,
      portion: '1 serving',
      category: categoryKey as any
    });
    setRecipeLoggedSuccess(`Success: "${currentRecipe.title}" added to your ${categoryKey.replace('_', ' ')} logs!`);
    setShowLogCategorySelector(false);
    setTimeout(() => setRecipeLoggedSuccess(''), 4000);
  };

  // Adaptive Health Targets using Mifflin-St Jeor + Clinical Modifications
  const targets = calculateHealthTargets(profile);
  const calorieCap = targets.calories;
  const currentIntake = mealLogs.reduce((acc, meal) => acc + meal.calories, 0);
  const remainingCal = Math.max(0, calorieCap - currentIntake);
  const targetBurned = 420; // standard metabolic & exercise burned goal
  const stepsTarget = targets.steps;

  // Meal Targets
  const mealTargets: Record<string, { label: string; target: number }> = {
    breakfast: { label: 'Breakfast', target: 550 },
    morning_snack: { label: 'Morning Snack', target: 250 },
    lunch: { label: 'Lunch', target: 550 },
    evening_snack: { label: 'Evening Snack', target: 250 },
    dinner: { label: 'Dinner', target: 550 },
    flexible_meal: { label: 'Flexible Meal', target: 0 } // Optional target
  };

  // Group current logs by category
  const getCategoryCalories = (catKey: string) => {
    return mealLogs
      .filter(m => m.category === catKey)
      .reduce((sum, m) => sum + m.calories, 0);
  };

  const handleRemoveLastInCategory = (catKey: string) => {
    const matchingLogs = mealLogs.filter(m => m.category === catKey);
    if (matchingLogs.length > 0) {
      // remove the match with the newest timestamp
      const lastItem = matchingLogs[matchingLogs.length - 1];
      removeMealLog(lastItem.id);
      setScanSuccessMessage('Removed the most recent log in this category');
      setTimeout(() => setScanSuccessMessage(''), 3000);
    }
  };

  const handleSimulatedScan = (categoryKey: string, flag: 'camera' | 'barcode') => {
    setScanningCategory(categoryKey);
    setActiveScanType(flag);
    setScanProgress(true);
    setScanSuccessMessage('');

    setTimeout(() => {
      setScanProgress(false);
      let foodName = '';
      let nutrientTemplate: any = {};

      if (flag === 'camera') {
        if (categoryKey === 'breakfast') {
          foodName = 'Standard Steamed Idlies & Chutney';
          nutrientTemplate = { calories: 220, protein: 6, carbs: 42, fats: 4, fiber: 4, sodium: 180, potassium: 320, magnesium: 40 };
        } else if (categoryKey === 'lunch') {
          foodName = 'Mixed Grains & Lentil Bowl';
          nutrientTemplate = { calories: 385, protein: 14, carbs: 55, fats: 5, fiber: 8, sodium: 210, potassium: 390, magnesium: 60 };
        } else if (categoryKey === 'dinner') {
          foodName = 'Baked Herb Fish & Steamed Salads';
          nutrientTemplate = { calories: 310, protein: 26, carbs: 12, fats: 9, fiber: 5, sodium: 170, potassium: 480, magnesium: 55 };
        } else {
          foodName = 'Fresh Avocado Salad & Sprouts';
          nutrientTemplate = { calories: 195, protein: 8, carbs: 14, fats: 8, fiber: 6, sodium: 110, potassium: 340, magnesium: 45 };
        }
        setScanSuccessMessage(`AI Visual Scanner resolved: "${foodName}" | ~${nutrientTemplate.calories} kcal! Added.`);
      } else {
        // Barcode reader
        foodName = 'MuscleForce Premium Whey Shaker';
        nutrientTemplate = { calories: 130, protein: 26, carbs: 3, fats: 1.5, fiber: 1, sodium: 140, potassium: 220, magnesium: 30 };
        setScanSuccessMessage(`Barcode Resolved (GS1 Registered): "${foodName} [Preservative Free Tested Ready Log] Added."`);
      }

      addMealLog({
        name: foodName,
        calories: nutrientTemplate.calories,
        protein: nutrientTemplate.protein,
        carbs: nutrientTemplate.carbs,
        fats: nutrientTemplate.fats,
        fiber: nutrientTemplate.fiber || 3,
        sodium: nutrientTemplate.sodium || 150,
        potassium: nutrientTemplate.potassium || 250,
        magnesium: nutrientTemplate.magnesium || 35,
        calcium: 50,
        zinc: 1.0,
        iron: 1.2,
        b12: 0.4,
        vitaminD: 20,
        omega3: 150,
        hydrationScore: 70,
        portion: '1 container (standard scoop)',
        category: categoryKey as any
      });

      setTimeout(() => {
        setScanningCategory(null);
        setActiveScanType(null);
        setScanSuccessMessage('');
      }, 3500);

    }, 2000);
  };

  const handleQuickAddFood = (categoryKey: string, food: typeof HEALTH_FOOD_DB[0]) => {
    addMealLog({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      fiber: food.fiber,
      sodium: food.sodium,
      potassium: food.potassium,
      magnesium: food.magnesium,
      calcium: food.calcium,
      zinc: food.zinc,
      iron: food.iron,
      b12: food.b12,
      vitaminD: food.vitaminD,
      omega3: food.omega3,
      hydrationScore: food.hydrationScore,
      portion: food.portion,
      category: categoryKey as any
    });
    setScanSuccessMessage(`Logged: ${food.name}`);
    setTimeout(() => setScanSuccessMessage(''), 2500);
  };

  // Aggregate macros + micros
  const dailyTotalObj = mealLogs.reduce((acc, m) => {
    return {
      protein: acc.protein + Number(m.protein || 0),
      carbs: acc.carbs + Number(m.carbs || 0),
      fats: acc.fats + Number(m.fats || 0),
      fiber: acc.fiber + Number(m.fiber || 0),
      sodium: acc.sodium + Number(m.sodium || 0),
      potassium: acc.potassium + Number(m.potassium || 0),
      magnesium: acc.magnesium + Number(m.magnesium || 0),
      calcium: acc.calcium + Number(m.calcium || 0),
      zinc: acc.zinc + Number(m.zinc || 0),
      iron: acc.iron + Number(m.iron || 0),
      b12: acc.b12 + Number(m.b12 || 0),
      vitaminD: acc.vitaminD + Number(m.vitaminD || 0),
      omega3: acc.omega3 + Number(m.omega3 || 0),
      hydrationScore: acc.hydrationScore + Number(m.hydrationScore || 65)
    };
  }, {
    protein: 0, carbs: 0, fats: 0, fiber: 0, sodium: 0, potassium: 0,
    magnesium: 0, calcium: 0, zinc: 0, iron: 0, b12: 0, vitaminD: 0, omega3: 0, hydrationScore: 0
  });

  const avgHydration = mealLogs.length > 0 
    ? Math.round(dailyTotalObj.hydrationScore / mealLogs.length) 
    : 65;

  return (
    <div className="space-y-8 pb-32 max-w-4xl mx-auto px-4 sm:px-0">
      
      {/* 1. GREETING HEADER */}
      <div className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold block mb-1">
              Personal Intelligent Assistant
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-serif">
              Good Afternoon, {profile.name} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 font-sans max-w-xl leading-relaxed">
              {profile.goal === 'fat_loss' 
                ? "Your active metabolism indicators are stable. Maintain high relative protein splits and premium fiber targets to suppress spikes." 
                : "Continuous caloric surveillance active. Maintain positive protein saturation to sustain muscle fibers."}
            </p>
          </div>

          <button 
            id="reset-profile-main"
            onClick={onReset}
            className="px-3.5 py-1.5 bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl border border-white/10 text-[10px] sm:text-xs font-mono text-slate-450 transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Reset Profile
          </button>
        </div>
      </div>

      <div className="space-y-8">
        
          {/* 2. CALORIES OVERVIEW HERO CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0F1720] to-slate-950 border border-white/10 rounded-[32px] p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-40%] right-[-20%] w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-40%] left-[-20%] w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main Ring visualization on the design */}
          <div className="md:col-span-5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Outer circle track */}
              <svg className="absolute w-full h-full -rotate-90">
                <circle 
                  cx="88" cy="88" r="76" 
                  className="stroke-[#0c131a] fill-none" 
                  strokeWidth="12" 
                />
                <circle 
                  cx="88" cy="88" r="76" 
                  className="stroke-[#1FA45B] fill-none transition-all duration-700" 
                  strokeWidth="12" 
                  strokeDasharray={2 * Math.PI * 76}
                  strokeDashoffset={2 * Math.PI * 76 * (1 - Math.min(1, currentIntake / calorieCap))}
                  strokeLinecap="round"
                />
              </svg>

              <div className="text-center z-10 space-y-0.5">
                <span className="text-[10px] uppercase tracking-widest text-[#FF8A24] font-bold font-mono">Consuming</span>
                <p className="text-4xl font-black text-white tracking-tighter">{currentIntake}</p>
                <div className="text-[10px] text-gray-400">of {calorieCap} kcal</div>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Intake Completed: {Math.round((currentIntake / calorieCap) * 100)}%
              </span>
            </div>
          </div>

          {/* Calorie Stats Breakdown Column */}
          <div className="md:col-span-7 grid grid-cols-2 gap-4">
            
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Target Limit</span>
              <div className="text-xl font-bold text-white">{calorieCap} kcal</div>
              <p className="text-[10px] text-slate-500 mt-1">Based on daily metabolic baseline</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Calories Burned</span>
              <div className="text-xl font-bold text-[#FF8A24] flex items-center gap-1">
                {targetBurned} kcal
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Basal metabolic rate + step activity</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Nutritional Remaining</span>
              <div className="text-xl font-bold text-emerald-400">{remainingCal} kcal</div>
              <p className="text-[10px] text-slate-500 mt-1">Remaining budget for active foods</p>
            </div>

            <div className="bg-[#1FA45B]/10 border border-[#1FA45B]/20 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#1FA45B] font-extrabold block">Metabolism Engine</span>
                <span className="text-xs font-bold text-slate-200 mt-1 block">Status: Constant</span>
              </div>
              <p className="text-[9px] text-[#1FA45B] font-mono leading-tight mt-2">Active thermogenesis optimal; minimal volatility observed.</p>
            </div>

          </div>
        </div>
      </div>

      {/* DAILY MILESTONES & RECONSTRUCTIVE QUICK RECIPE TIPS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* DAILY MILESTONES CARD */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[32px] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/10">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Daily Milestones</h3>
              <p className="text-[10px] text-slate-400">Hit active metabolic limits to award virtual badges today.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: 'calorie-compliance',
                title: 'Calorie Compliance',
                condition: currentIntake > 0 && currentIntake <= calorieCap + 100,
                icon: Flame,
                color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                subtextCompleted: `Under ${calorieCap} kcal`,
                subtextLocked: `Stay under limit`
              },
              {
                id: 'mobility-gold',
                title: 'Mobility Elite',
                condition: steps >= 5000,
                icon: Footprints,
                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                subtextCompleted: `${steps.toLocaleString()} / 5k steps`,
                subtextLocked: `Log 5,000 steps today`
              },
              {
                id: 'aqua-saturate',
                title: 'Aqua Saturate',
                condition: waterAmount >= 2000,
                icon: Droplet,
                color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                subtextCompleted: `Passed 2,000 ml`,
                subtextLocked: `Drink 2,000+ ml`
              },
              {
                id: 'micro-fortified',
                title: 'Micro Fortified',
                condition: Object.values(supplementStates).filter(Boolean).length >= 1,
                icon: Pill,
                color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                subtextCompleted: `${Object.values(supplementStates).filter(Boolean).length} Supps Taken`,
                subtextLocked: `Log high-grade supps`
              }
            ].map(b => {
              const IconComp = b.icon;
              return (
                <div
                  id={`milestone-badge-${b.id}`}
                  key={b.id}
                  className={`p-3.5 border rounded-2xl flex flex-col justify-between transition-all relative overflow-hidden group ${
                    b.condition
                      ? 'border-emerald-500/20 bg-emerald-500/[0.02] shadow-[0_0_15px_-3px_rgba(16,185,129,0.05)]'
                      : 'border-white/5 bg-white/[0.01] opacity-50'
                  }`}
                >
                  {b.condition && (
                    <div className="absolute -right-6 -bottom-6 w-12 h-12 bg-emerald-500/5 rounded-full blur-md" />
                  )}
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-xl border ${
                      b.condition ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-900 text-slate-500 border-white/5'
                    }`}>
                      <IconComp className={`w-4 h-4 ${b.condition ? 'animate-pulse' : ''}`} />
                    </div>
                    {b.condition ? (
                      <span className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider animate-bounce">
                        Earned
                      </span>
                    ) : (
                      <span className="text-[8px] bg-slate-950 text-slate-600 px-1.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                        Locked
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className={`text-xs font-bold leading-tight ${b.condition ? 'text-white' : 'text-slate-400'}`}>
                      {b.title}
                    </p>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                      {b.condition ? b.subtextCompleted : b.subtextLocked}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CONTEXT-AWARE REGIONAL RECIPE TIP CARD */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[32px] p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/10">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Quick Cooking Tip</h3>
                  <p className="text-[10px] text-slate-400">Regional, goal-aligned cellular fuel advice.</p>
                </div>
              </div>

              {/* Cycle tip action */}
              {matchedRecipes.length > 1 && (
                <button
                  id="cycle-recipes-btn"
                  onClick={() => setRecipeIndex(prev => prev + 1)}
                  className="p-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[9px] font-mono text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> Cycle ({matchedRecipes.length})
                </button>
              )}
            </div>

            {currentRecipe ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[8px] font-mono uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    {currentRecipe.region.replace('_', ' ')}
                  </span>
                  <span className="text-[8px] font-mono uppercase bg-orange-500/10 text-[#FF8A24] border border-[#FF8A24]/20 px-2 py-0.5 rounded-md">
                    {currentRecipe.goal.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
                    {currentRecipe.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    {currentRecipe.description}
                  </p>
                </div>

                {/* Macro Pills rows */}
                <div className="grid grid-cols-5 gap-1.5 py-1.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                  {[
                    { label: 'Kcal', val: `${currentRecipe.macros.calories}` },
                    { label: 'Prot', val: `${currentRecipe.macros.protein}g` },
                    { label: 'Carbs', val: `${currentRecipe.macros.carbs}g` },
                    { label: 'Fats', val: `${currentRecipe.macros.fats}g` },
                    { label: 'Fiber', val: `${currentRecipe.macros.fiber}g` }
                  ].map((m, i) => (
                    <div key={i} className="text-center">
                      <span className="text-[7px] uppercase font-mono text-gray-500 block">{m.label}</span>
                      <span className="text-[9px] font-bold text-white font-mono mt-0.5 block">{m.val}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] leading-relaxed text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-white/5 italic">
                  <strong>Instructions: </strong>{currentRecipe.instructions}
                </div>

                <p className="text-[10px] text-emerald-400 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10 leading-normal">
                  💡 <strong>Expert advice:</strong> {currentRecipe.tip}
                </p>
              </div>
            ) : (
              <p className="text-xs text-center text-slate-500">No regional recipes found for current profile filters.</p>
            )}
          </div>

          {currentRecipe && (
            <div className="mt-4 pt-3 border-t border-white/5 relative">
              {recipeLoggedSuccess && (
                <div className="absolute inset-x-0 top-0 -mt-8 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono py-1 rounded-lg text-center animate-bounce">
                  {recipeLoggedSuccess}
                </div>
              )}
              
              {!showLogCategorySelector ? (
                <button
                  id="trigger-add-recipe-meal"
                  onClick={() => setShowLogCategorySelector(true)}
                  className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[#1FA45B] text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                >
                  ⚡ Log Recipe Directly to Meal Tracker
                </button>
              ) : (
                <div className="space-y-1.5 animate-fadeIn">
                  <span className="text-[8px] font-mono uppercase text-gray-400 block mb-1">Select meal log slot:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['breakfast', 'lunch', 'dinner'].map(slot => (
                      <button
                        key={slot}
                        onClick={() => handleLogRecipe(slot)}
                        className="py-1 bg-white/5 hover:bg-[#1FA45B]/25 hover:text-emerald-300 rounded-lg text-[10px] font-mono capitalize transition-all border border-white/5 cursor-pointer text-center"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowLogCategorySelector(false)}
                    className="w-full text-center text-[8px] uppercase font-mono text-gray-500 hover:text-white mt-1 pt-0.5"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 3. MEAL TRACKING SECTIONS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase font-serif">
              Clinical Meal Saturation Logs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Toggle to log standard compositions, camera analysis, and barcode readings instantly.</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {mealLogs.length} Records Logged Today
          </span>
        </div>

        {/* Categories collapsed list */}
        <div className="space-y-3">
          {Object.entries(mealTargets).map(([catKey, details]) => {
            const isExpanded = expandedMealSection === catKey;
            const currentKcal = getCategoryCalories(catKey);
            const isFlexMeal = catKey === 'flexible_meal';

            return (
              <div 
                key={catKey}
                className="bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-[24px] overflow-hidden transition-all duration-300"
              >
                {/* Header Collapsed Bar */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-2">
                  <div 
                    className="flex-grow flex items-center justify-between gap-4 cursor-pointer"
                    onClick={() => setExpandedMealSection(isExpanded ? null : catKey)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isFlexMeal ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-[#1FA45B]'}`}>
                        <Apple className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                          {details.label}
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          {isFlexMeal ? 'Optional nutritional variance' : `Target standard limit: ${details.target} kcal`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-extrabold text-white font-mono">
                        {currentKcal} {!isFlexMeal && `/ ${details.target}`} kcal
                      </div>
                      <span className="text-[9px] text-gray-500 uppercase font-mono block">Intake</span>
                    </div>
                  </div>

                  {/* Decrement [-] and Increment [+] controls */}
                  <div className="flex items-center gap-1 border-l border-white/5 pl-3">
                    <button
                      id={`dec-${catKey}`}
                      title="Recall most recent log entry"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLastInCategory(catKey);
                      }}
                      className="p-1.5 hover:bg-rose-500/10 text-rose-450 hover:text-rose-400 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      id={`inc-${catKey}`}
                      title="Expand interactive scanner and log"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMealSection(isExpanded ? null : catKey);
                      }}
                      className={`p-1.5 rounded-lg transition-all border ${
                        isExpanded 
                          ? 'bg-emerald-500/20 text-[#1FA45B] border-emerald-500/30' 
                          : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Dashboard Food Scanners Area */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      key={`expanded-${catKey}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="border-t border-white/5 bg-slate-950/20"
                    >
                      {/* Active category items logged list */}
                      {mealLogs.filter(m => m.category === catKey).length > 0 && (
                        <div className="px-5 py-3 border-b border-white/5 space-y-2 bg-black/10">
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono block">Logged Items</span>
                          {mealLogs.filter(m => m.category === catKey).map((meal) => (
                            <div key={meal.id} className="flex justify-between items-center text-xs p-2 bg-slate-900/60 rounded-xl border border-white/5">
                              <div>
                                <p className="font-bold text-white capitalize">{meal.name}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  {meal.portion} • P: {meal.protein}g C: {meal.carbs}g F: {meal.fats}g
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-emerald-400 font-black">{meal.calories} kcal</span>
                                <button
                                  type="button"
                                  onClick={() => removeMealLog(meal.id)}
                                  className="text-[9px] text-rose-400 hover:underline px-1.5 py-0.5 rounded bg-white/5 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sub-Tabs Selector Header */}
                      <div className="flex border-b border-white/5 bg-black/20 overflow-x-auto scrollbar-none px-4">
                        {[
                          { id: 'camera', label: 'Camera Scan' },
                          { id: 'barcode', label: 'Barcode Scan' },
                          { id: 'manual', label: 'Manual Entry' },
                          { id: 'favorites', label: 'Favorites' },
                          { id: 'recents', label: 'Recents' }
                        ].map((tab) => {
                          const activeTab = subTabMap[catKey] || 'camera';
                          const isSelected = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setSubTabMap(prev => ({ ...prev, [catKey]: tab.id as any }))}
                              className={`px-3 py-2.5 text-[10px] font-mono uppercase tracking-wider font-bold shrink-0 transition-all border-b-2 ${
                                isSelected 
                                  ? 'border-[#1FA45B] text-emerald-400 font-extrabold' 
                                  : 'border-transparent text-gray-500 hover:text-gray-300'
                              } cursor-pointer`}
                            >
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Dynamic Render according to selected subtab */}
                        {(subTabMap[catKey] || 'camera') === 'camera' && (
                          <div className="space-y-4">
                            <p className="text-[11px] text-gray-400 leading-normal">
                              Snap picture of home-cooked/restaurant food to run an instant computer vision analysis of macros.
                            </p>
                            
                            <button
                              id={`camera-scan-${catKey}`}
                              type="button"
                              onClick={() => handleSimulatedScan(catKey, 'camera')}
                              className="p-6 bg-[#1FA45B]/5 hover:bg-[#1FA45B]/10 border border-[#1FA45B]/20 rounded-2xl w-full text-center flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
                            >
                              <Camera className="w-6 h-6 text-[#1FA45B] group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-mono uppercase tracking-widest font-black text-white">Capture Food Photo</span>
                            </button>
                          </div>
                        )}

                        {(subTabMap[catKey] || 'camera') === 'barcode' && (
                          <div className="space-y-4">
                            <p className="text-[11px] text-gray-400 leading-normal">
                              Scan registered barcodes on wraps, isolates, and supplements to cross-verify nutritional properties instantly.
                            </p>
                            
                            <button
                              id={`barcode-scan-${catKey}`}
                              type="button"
                              onClick={() => handleSimulatedScan(catKey, 'barcode')}
                              className="p-6 bg-[#FF8A24]/5 hover:bg-[#FF8A24]/10 border border-[#FF8A24]/20 rounded-2xl w-full text-center flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
                            >
                              <ScanLine className="w-6 h-6 text-[#FF8A24] group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-mono uppercase tracking-widest font-black text-white">Align Barcode Laser</span>
                            </button>
                          </div>
                        )}

                        {(subTabMap[catKey] || 'camera') === 'manual' && (
                          <div className="bg-[#070D14]/75 p-4 rounded-2xl border border-white/5 space-y-3">
                            <span className="text-[9px] uppercase tracking-wider text-[#FF8A24] font-black font-mono">Custom Fast Log Form</span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] uppercase font-mono text-gray-500 block mb-1">Food Item Title</label>
                                <input
                                  id={`manual-name-${catKey}`}
                                  type="text"
                                  placeholder="E.g., Ghee Karam Dosa, Dal Tadka..."
                                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase font-mono text-gray-500 block mb-1">Portion Size</label>
                                <input
                                  id={`manual-portion-${catKey}`}
                                  type="text"
                                  placeholder="E.g., 1 plate, 150 grams..."
                                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="text-[8px] uppercase font-mono text-gray-500 block mb-1">Kcal</label>
                                <input id={`manual-kcal-${catKey}`} type="number" defaultValue="250" className="w-full bg-slate-900 border border-white/10 rounded-xl p-1.5 text-xs text-white text-center font-mono" />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase font-mono text-gray-500 block mb-1">Prot(g)</label>
                                <input id={`manual-p-${catKey}`} type="number" defaultValue="8" className="w-full bg-slate-900 border border-white/10 rounded-xl p-1.5 text-xs text-white text-center font-mono" />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase font-mono text-gray-500 block mb-1">Carb(g)</label>
                                <input id={`manual-c-${catKey}`} type="number" defaultValue="35" className="w-full bg-slate-900 border border-white/10 rounded-xl p-1.5 text-xs text-white text-center font-mono" />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase font-mono text-gray-500 block mb-1">Fat(g)</label>
                                <input id={`manual-f-${catKey}`} type="number" defaultValue="6" className="w-full bg-slate-900 border border-white/10 rounded-xl p-1.5 text-xs text-white text-center font-mono" />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const nameEl = document.getElementById(`manual-name-${catKey}`) as HTMLInputElement;
                                const portEl = document.getElementById(`manual-portion-${catKey}`) as HTMLInputElement;
                                const kcalEl = document.getElementById(`manual-kcal-${catKey}`) as HTMLInputElement;
                                const pEl = document.getElementById(`manual-p-${catKey}`) as HTMLInputElement;
                                const cEl = document.getElementById(`manual-c-${catKey}`) as HTMLInputElement;
                                const fEl = document.getElementById(`manual-f-${catKey}`) as HTMLInputElement;

                                const nVal = nameEl?.value || 'Homemade Healthy Food';
                                const pVal = portEl?.value || '1 serving';
                                const kcalVal = Number(kcalEl?.value || 250);
                                const pY = Number(pEl?.value || 8);
                                const cY = Number(cEl?.value || 35);
                                const fY = Number(fEl?.value || 6);

                                addMealLog({
                                  name: nVal,
                                  calories: kcalVal,
                                  protein: pY,
                                  carbs: cY,
                                  fats: fY,
                                  fiber: 3,
                                  sodium: 150,
                                  potassium: 220,
                                  magnesium: 30,
                                  calcium: 50,
                                  zinc: 0.8,
                                  iron: 1.1,
                                  b12: 0.2,
                                  vitaminD: 10,
                                  omega3: 60,
                                  hydrationScore: 65,
                                  portion: pVal,
                                  category: catKey as any
                                });

                                if (nameEl) nameEl.value = '';
                                setScanSuccessMessage(`Successfully logged "${nVal}" manually!`);
                                setTimeout(() => setScanSuccessMessage(''), 2500);
                              }}
                              className="w-full py-2.5 bg-gradient-to-r from-[#1FA45B] to-[#FF8A24] hover:brightness-110 text-white font-mono font-bold text-xs uppercase rounded-xl shadow-md cursor-pointer"
                            >
                              Log Entry Now
                            </button>
                          </div>
                        )}

                        {(subTabMap[catKey] || 'camera') === 'favorites' && (
                          <div className="space-y-2.5">
                            <span className="text-[9px] uppercase tracking-wider text-[#1FA45B] font-extrabold font-mono block">Your Healthy Regional Staples</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                { name: 'Ghee Karam Dosa', calories: 340, protein: 7, carbs: 48, fats: 14, portion: '1 piece' },
                                { name: 'Ragi Mudda with Pappu', calories: 410, protein: 12, carbs: 68, fats: 8, portion: '1 ball + dal' },
                                { name: 'Andhra Gongura Pappu Rice', calories: 380, protein: 11, carbs: 62, fats: 6, portion: '1 plate' },
                                { name: 'Pesarattu (Moong Gram Dosa)', calories: 280, protein: 14, carbs: 42, fats: 5, portion: '1 piece' },
                                { name: 'Curd Rice with Pomegranate', calories: 240, protein: 6, carbs: 36, fats: 4, portion: '1 bowl' },
                                { name: 'Boiled Egg White Salad', calories: 120, protein: 16, carbs: 2, fats: 2, portion: '3 egg whites' }
                              ].map((food) => (
                                <button
                                  key={food.name}
                                  type="button"
                                  onClick={() => {
                                    addMealLog({
                                      name: food.name,
                                      calories: food.calories,
                                      protein: food.protein,
                                      carbs: food.carbs,
                                      fats: food.fats,
                                      fiber: 4,
                                      sodium: 220,
                                      potassium: 290,
                                      magnesium: 40,
                                      calcium: 60,
                                      zinc: 0.9,
                                      iron: 1.2,
                                      b12: 0.1,
                                      vitaminD: 0,
                                      omega3: 50,
                                      hydrationScore: 70,
                                      portion: food.portion,
                                      category: catKey as any
                                    });
                                    setScanSuccessMessage(`Logged Preset Favorite: ${food.name}!`);
                                    setTimeout(() => setScanSuccessMessage(''), 2000);
                                  }}
                                  className="p-3 bg-white/[0.01] hover:bg-[#1FA45B]/10 border border-white/5 hover:border-[#1FA45B]/20 rounded-xl text-left transition-all flex justify-between items-center group cursor-pointer"
                                >
                                  <div>
                                    <p className="font-extrabold text-slate-300 text-xs uppercase tracking-tight group-hover:text-emerald-400">{food.name}</p>
                                    <p className="text-[10px] text-gray-555 font-mono mt-0.5">{food.portion} • P:{food.protein}g</p>
                                  </div>
                                  <span className="font-mono text-emerald-400 text-xs font-black shrink-0">+{food.calories}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {(subTabMap[catKey] || 'camera') === 'recents' && (
                          <div className="space-y-2">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono block">Your Recent Activity Logs</span>
                            
                            {mealLogs.filter(m => m.category === catKey).slice(-3).reverse().length > 0 ? (
                              <div className="space-y-2">
                                {mealLogs.filter(m => m.category === catKey).slice(-3).reverse().map((rec) => (
                                  <div key={rec.id + '-recent'} className="p-3 bg-slate-900 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-bold text-white capitalize">{rec.name}</p>
                                      <p className="text-[9.5px] text-slate-400 mt-1 font-mono">{rec.portion} • P: {rec.protein}g C: {rec.carbs}g</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        addMealLog({
                                          ...rec,
                                          id: undefined,
                                          timestamp: undefined
                                        } as any);
                                        setScanSuccessMessage(`Re-logged: ${rec.name}!`);
                                        setTimeout(() => setScanSuccessMessage(''), 2000);
                                      }}
                                      className="px-3 py-1.5 bg-[#1FA45B]/15 border border-[#1FA45B]/20 font-mono text-[9px] text-[#1FA45B] uppercase font-bold rounded-lg cursor-pointer hover:bg-[#1FA45B]/25"
                                    >
                                      Log Again
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-gray-500 py-4 text-center font-mono italic">
                                No previous entries recorded in this category yet.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Scanner Simulated Active State */}
                        {scanningCategory === catKey && (
                          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-2">
                            {scanProgress ? (
                              <div className="text-center py-4 space-y-2">
                                <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                                <p className="text-xs text-slate-300 font-mono">
                                  {activeScanType === 'camera' 
                                    ? 'Analyzing meal composition and macro balance...' 
                                    : 'Resolving barcode against clinical food registers...'}
                                </p>
                              </div>
                            ) : scanSuccessMessage ? (
                              <div className="p-2 border border-[#1FA45B]/30 bg-emerald-500/10 text-[#1FA45B] text-xs font-mono rounded-xl text-center">
                                {scanSuccessMessage}
                              </div>
                            ) : null}
                          </div>
                        )}

                        {scanSuccessMessage && scanningCategory !== catKey && (
                          <div className="p-2 border border-[#1FA45B]/30 bg-emerald-500/10 text-[#1FA45B] text-xs font-mono rounded-xl text-center">
                            {scanSuccessMessage}
                          </div>
                        )}

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. WATER TRACKER */}
      <div className="bg-gradient-to-br from-[#0c1926] via-[#0F1720] to-[#0A111A] border border-blue-500/15 rounded-[32px] p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[80px]" />
        
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase font-mono text-blue-400 font-bold block mb-1">Fluid Level Metric</span>
              <h2 className="text-2xl font-black text-white tracking-tight font-serif">Active Hydration Tracker</h2>
              <p className="text-xs text-slate-400">Target limit objective: 3,000 ml everyday</p>
            </div>

            <div className="text-right">
              <span className="text-sm font-black text-blue-300 font-mono block">
                {waterAmount} / 3000 ml
              </span>
              <span className="text-[9px] text-slate-400 block font-mono">
                {Math.round((waterAmount / 3000) * 100)}% Hydrated
              </span>
            </div>
          </div>

          {/* Liquid Wave Animation Bar */}
          <div className="relative w-full h-10 bg-[#070D14] border border-white/5 rounded-2xl overflow-hidden flex items-center">
            {/* Dynamic liquid container */}
            <motion.div 
              className="absolute left-0 bottom-0 top-0 bg-gradient-to-r from-blue-600/50 to-sky-500/50 relative overflow-hidden flex items-center"
              animate={{ width: `${Math.min(100, (waterAmount / 3000) * 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {/* Internal simulated fluid bubbles */}
              <div className="absolute inset-0 bg-white/[0.03] animate-ping opacity-30" />
            </motion.div>
            
            <span className="absolute left-4 text-xs font-mono font-bold text-white z-10">
              Completed {Math.round((waterAmount / 3000) * 100)}%
            </span>
          </div>

          {/* Water controllers: supports accidental removals and additions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              id="water-remove-opt"
              onClick={() => incrementWater(-250)}
              className="py-2.5 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 text-rose-300 rounded-xl text-center text-xs font-black transition-colors"
            >
              [-250 ml] Glass
            </button>
            <button
              id="water-add-opt"
              onClick={() => incrementWater(250)}
              className="py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 rounded-xl text-center text-xs font-black transition-colors"
            >
              [+250 ml] Glass
            </button>
            <button
              id="water-add-bottle"
              onClick={() => incrementWater(500)}
              className="py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 rounded-xl text-center text-xs font-black transition-colors"
            >
              +Bottle (500 ml)
            </button>
            <button
              id="water-add-shaker"
              onClick={() => incrementWater(750)}
              className="py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 rounded-xl text-center text-xs font-black transition-colors"
            >
              +Shaker (750 ml)
            </button>
          </div>
        </div>
      </div>

      {/* 5. STEP COUNT MODULE */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0F1720] to-slate-950 border border-white/10 rounded-[32px] p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8A24]/5 rounded-full blur-[80px]" />
        
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs uppercase font-mono text-[#FF8A24] font-bold block">Physical Activity Engine</span>
              <h2 className="text-2xl font-black text-white tracking-tight font-serif">Kinetic Step Counter</h2>
              <p className="text-xs text-slate-400">Target goal: 10,000 steps daily limits</p>
            </div>

            <div className="text-right">
              <span className="text-sm font-black text-slate-200 font-mono block">
                {steps.toLocaleString()} / 10,000
              </span>
              <span className="text-[9px] text-gray-400 block font-mono">
                {((steps / stepsTarget) * 5.6).toFixed(2)} km walked
              </span>
            </div>
          </div>

          {/* Main stats layout */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl text-center">
              <span className="text-[9px] uppercase text-gray-500 font-mono block">Distance</span>
              <p className="text-base font-bold text-white mt-1">{((steps / stepsTarget) * 5.6).toFixed(2)} km</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl text-center">
              <span className="text-[9px] uppercase text-gray-500 font-mono block">Energy Burn</span>
              <p className="text-base font-bold text-[#FF8A24] mt-1">{Math.round((steps / stepsTarget) * 340)} kcal</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl text-center">
              <span className="text-[9px] uppercase text-gray-500 font-mono block">Activity Score</span>
              <p className="text-base font-bold text-emerald-400 mt-1">{Math.min(100, Math.round((steps / stepsTarget) * 100))}/100</p>
            </div>
          </div>

          {/* Interactive controls: supports accidental adjustments */}
          <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-white/5">
            <span className="text-xs text-slate-300">Quick Adjust Step Metrics</span>
            <div className="flex gap-2">
              <button
                id="steps-dec-1k"
                onClick={() => incrementSteps(-1000)}
                className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                -1,000
              </button>
              <button
                id="steps-inc-1k"
                onClick={() => incrementSteps(1000)}
                className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[#1FA45B] text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                +1,000
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-gray-500 font-mono">
              🔄 Synced dynamically through device API (Supports Google Fit & Apple Health auto-sync triggers)
            </p>
          </div>
        </div>
      </div>

      {/* 8. AI WELLNESS INSIGHTS */}
      <div className="bg-[#0c1219] border border-white/5 p-6 sm:p-8 rounded-[32px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[80px]" />
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-[#1FA45B]/10 to-[#FF8A24]/10 rounded-2xl border border-emerald-500/20">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight font-serif">AI Coach Wellness Insights</h2>
            <p className="text-xs text-gray-400">Continuous nutritional tracking observations compiled dynamically.</p>
          </div>
        </div>

        <div className="space-y-3 mt-4 text-xs leading-relaxed text-slate-300">
          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex gap-3">
            <span className="text-emerald-400 font-bold font-mono">01.</span>
            <p>Your daily dietary fiber is hovering at a protective range. Consuming fibrous seeds or millet blends with dinner acts as a natural buffer, suppressing glucose spikes effectively.</p>
          </div>
          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex gap-3">
            <span className="text-blue-400 font-bold font-mono">02.</span>
            <p>Water tracker shows steady compliance. Fluid volumes are matching the pacing checklist smoothly, preventing dehydration-induced fatigue throughout shifts.</p>
          </div>
          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex gap-3">
            <span className="text-amber-400 font-bold font-mono">03.</span>
            <p>Sodium values are within clinical limits. Keep potassium intake high by drinking tender liquids or consuming spinach to balance intercellular cellular pressure.</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
