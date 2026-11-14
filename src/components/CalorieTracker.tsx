/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, ClipboardList, Flame, Zap, Trash2, ArrowRight, Sparkles, 
  ChevronRight, ArrowLeft 
} from 'lucide-react';
import { Meal } from '../types';

interface CalorieTrackerProps {
  mealLogs: Meal[];
  addMealLog: (meal: Omit<Meal, 'id' | 'timestamp'>) => void;
  removeMealLog: (id: string) => void;
}

const LOCAL_FOOD_DB = [
  { name: 'Hyderabadi Chicken Biryani', calories: 620, protein: 22, carbs: 70, fats: 18, typicalPortion: '1 medium plate (350g)', category: 'lunch' },
  { name: 'Gongura Pappu with 1 Cup Rice', calories: 450, protein: 11, carbs: 75, fats: 6, typicalPortion: '1 bowl of pappu + rice', category: 'lunch' },
  { name: 'Pesara Dosa / Pesarattu (2 pieces)', calories: 240, protein: 8, carbs: 36, fats: 5, typicalPortion: '2 medium pesarattus', category: 'breakfast' },
  { name: 'Ragi Mudda / Sangati with Ghee', calories: 290, protein: 5, carbs: 55, fats: 4, typicalPortion: '1 medium ball + 1 tsp ghee', category: 'lunch' },
  { name: 'Idly Steamed (3 pieces with chutney)', calories: 220, protein: 6, carbs: 42, fats: 4, typicalPortion: '3 idlies + 2 tbsp coconut chutney', category: 'breakfast' },
  { name: 'Medu Vada (2 pieces with sambar)', calories: 280, protein: 6, carbs: 28, fats: 14, typicalPortion: '2 standard vadas', category: 'breakfast' },
  { name: 'Pappu Charu with Rice', calories: 380, protein: 9, carbs: 65, fats: 3, typicalPortion: '1 cup Charu + rice', category: 'lunch' },
  { name: 'Natu Kodi Pulusu (Country Chicken)', calories: 340, protein: 28, carbs: 6, fats: 18, typicalPortion: '1 medium bowl (180g)', category: 'dinner' },
  { name: 'Curd Rice (Annam with ginger & spices)', calories: 250, protein: 5, carbs: 35, fats: 8, typicalPortion: '1 bowl (200g)', category: 'dinner' },
  { name: 'Tomato Pappu (Lentil Tomato Stew)', calories: 180, protein: 8, carbs: 24, fats: 4, typicalPortion: '1 standard bowl', category: 'lunch' },
  { name: 'Upma with Peanuts and ghee', calories: 260, protein: 6, carbs: 40, fats: 7, typicalPortion: '1 cup cooked upma', category: 'breakfast' },
  { name: 'Dibba Rotti (Andhra Thick Minapattu)', calories: 320, protein: 8, carbs: 48, fats: 8, typicalPortion: '1 thick wedge', category: 'breakfast' },
  { name: 'Gongura Mutton (Andhra Special)', calories: 410, protein: 32, carbs: 5, fats: 24, typicalPortion: '1 medium cup', category: 'lunch' },
  { name: 'Poori with potato Curry', calories: 380, protein: 6, carbs: 46, fats: 16, typicalPortion: '2 standard pooris with subji', category: 'breakfast' },
  { name: 'Mirchi Bajji (Andhra Street Style)', calories: 210, protein: 3, carbs: 18, fats: 12, typicalPortion: '2 medium bajjis', category: 'snacks' },
  { name: 'Bobbatlu / Polelu (Sweet flatbread)', calories: 280, protein: 4, carbs: 54, fats: 6, typicalPortion: '1 medium sweet flatbread', category: 'snacks' },
  { name: 'Majjiga Charu (Tempered Buttermilk Soup)', calories: 130, protein: 3, carbs: 12, fats: 5, typicalPortion: '1 bowl', category: 'dinner' },
  { name: 'Plain Cooked White Sona Masuri Rice', calories: 200, protein: 4, carbs: 45, fats: 0.5, typicalPortion: '1 cooked cup', category: 'lunch' },
  { name: 'Whole Wheat Chapati (2 pieces)', calories: 180, protein: 6, carbs: 36, fats: 1.5, typicalPortion: '2 chapatis without oil', category: 'dinner' }
];

export default function CalorieTracker({ 
  mealLogs, 
  addMealLog, 
  removeMealLog 
}: CalorieTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState<typeof LOCAL_FOOD_DB[0] | null>(null);
  
  // Custom portion multiplier
  const [portionScalar, setPortionScalar] = useState<number>(1); // e.g., 1.5 portions
  const [logCategory, setLogCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('breakfast');

  // Custom Food Form Toggle
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState<number>(250);
  const [customProtein, setCustomProtein] = useState<number>(10);
  const [customCarbs, setCustomCarbs] = useState<number>(30);
  const [customFats, setCustomFats] = useState<number>(5);
  const [customPortion, setCustomPortion] = useState('1 plate');

  // High precision optional mineral + vitamin logs
  const [customFiber, setCustomFiber] = useState<number>(4);
  const [customSodium, setCustomSodium] = useState<number>(220);
  const [customPotassium, setCustomPotassium] = useState<number>(340);
  const [customMagnesium, setCustomMagnesium] = useState<number>(45);
  const [customCalcium, setCustomCalcium] = useState<number>(80);
  const [customZinc, setCustomZinc] = useState<number>(2);
  const [customIron, setCustomIron] = useState<number>(1.5);
  const [customB12, setCustomB12] = useState<number>(0.4);
  const [customVitaminD, setCustomVitaminD] = useState<number>(50);
  const [customOmega3, setCustomOmega3] = useState<number>(120);

  const filteredFoods = LOCAL_FOOD_DB.filter(food => 
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectFood = (food: typeof LOCAL_FOOD_DB[0]) => {
    setSelectedFood(food);
    setLogCategory(food.category as any);
    setPortionScalar(1);
  };

  const handleAddSelectedLog = () => {
    if (!selectedFood) return;
    addMealLog({
      name: selectedFood.name,
      calories: Math.round(selectedFood.calories * portionScalar),
      protein: Math.round(selectedFood.protein * portionScalar),
      carbs: Math.round(selectedFood.carbs * portionScalar),
      fats: Math.round(selectedFood.fats * portionScalar),
      portion: portionScalar === 1 ? selectedFood.typicalPortion : `${portionScalar}x (${selectedFood.typicalPortion})`,
      category: logCategory,
      fiber: 4,
      sodium: 180,
      potassium: 320,
      magnesium: 40,
      calcium: 60,
      zinc: 1.2,
      iron: 1.1,
      b12: 0.2,
      vitaminD: 20,
      omega3: 80,
      hydrationScore: 65,
    });
    setSelectedFood(null);
  };

  const handleAddCustomLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    
    addMealLog({
      name: customName,
      calories: Number(customCalories || 0),
      protein: Number(customProtein || 0),
      carbs: Number(customCarbs || 0),
      fats: Number(customFats || 0),
      portion: customPortion || '1 serving',
      category: logCategory,
      fiber: Number(customFiber || 0),
      sodium: Number(customSodium || 0),
      potassium: Number(customPotassium || 0),
      magnesium: Number(customMagnesium || 0),
      calcium: Number(customCalcium || 0),
      zinc: Number(customZinc || 0),
      iron: Number(customIron || 0),
      b12: Number(customB12 || 0),
      vitaminD: Number(customVitaminD || 0),
      omega3: Number(customOmega3 || 0),
      hydrationScore: 70,
    });

    // Reset Form
    setCustomName('');
    setCustomCalories(250);
    setCustomProtein(10);
    setCustomCarbs(30);
    setCustomFats(5);
    setCustomPortion('1 plate');
    setShowCustomForm(false);
  };

  // Aggregated logged stats
  const aggregateCalories = mealLogs.reduce((acc, m) => acc + m.calories, 0);
  const aggregateProtein = mealLogs.reduce((acc, m) => acc + m.protein, 0);

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-0 mt-4 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-[#0F1720]/40 p-5 rounded-3xl border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <span className="text-xs text-[#FF8A24] font-bold uppercase tracking-wider font-mono">Calorie & Macro Library</span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Clinical Nutrient Intake & Macro Database
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Log global health staples, raw ingredients, or regional meals to track macro and micro-nutrient splits.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-right min-w-[140px] flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto">
          <span className="text-[10px] text-gray-500 font-mono">Logged Today</span>
          <span className="text-xl font-bold text-white font-mono">{aggregateCalories} kcal</span>
          <span className="text-[10px] text-emerald-400 font-semibold">{aggregateProtein}g Protein</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Search and Database Selection */}
        <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 space-y-4">
          
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-white uppercase tracking-tight font-mono">
              {showCustomForm ? 'Clinical Custom Sheet' : 'Clinical Database Search'}
            </h2>
            <button
              id="custom-food-toggle"
              onClick={() => {
                setShowCustomForm(!showCustomForm);
                setSelectedFood(null);
              }}
              className="text-xs text-[#1FA45B] hover:text-emerald-400 font-mono font-bold"
            >
              {showCustomForm ? '← Database Search' : '+ Custom Composition'}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!showCustomForm && !selectedFood && (
              <motion.div
                key="dbSearch"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    id="food-db-search-input"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search global foods, raw ingredients, or regional Andhra meals..."
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#1FA45B]"
                  />
                </div>

                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {filteredFoods.map((food, idx) => (
                    <button
                      key={idx}
                      id={`db-food-item-${food.name.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => handleSelectFood(food)}
                      className="w-full bg-slate-900/50 hover:bg-slate-850 p-2.5 rounded-xl border border-slate-850 hover:border-slate-800 text-left flex justify-between items-center text-xs transition-colors"
                    >
                      <div>
                        <p className="font-bold text-gray-200">{food.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{food.typicalPortion}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-gray-300 font-medium">{food.calories} kcal</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-500 inline ml-1.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Selected Food Logging Controls */}
            {selectedFood && (
              <motion.div
                key="loggingControls"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-xs text-white uppercase tracking-tight">{selectedFood.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Base Portion: {selectedFood.typicalPortion}</p>
                    </div>
                    <button 
                      id="selected-food-back"
                      onClick={() => setSelectedFood(null)} 
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-gray-500 font-mono">Protein</span>
                      <p className="text-xs font-bold text-white mt-0.5">{Math.round(selectedFood.protein * portionScalar)}g</p>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-gray-500 font-mono">Carbs</span>
                      <p className="text-xs font-bold text-white mt-0.5">{Math.round(selectedFood.carbs * portionScalar)}g</p>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-gray-500 font-mono">Fats</span>
                      <p className="text-xs font-bold text-white mt-0.5">{Math.round(selectedFood.fats * portionScalar)}g</p>
                    </div>
                  </div>
                </div>

                {/* Multiplier Portion Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-gray-400">
                    <span>Estimate Portion / Multiplier</span>
                    <span className="text-white font-bold">{portionScalar}x Portions</span>
                  </div>
                  <input
                    id="food-portion-slider"
                    type="range"
                    min="0.25"
                    max="4.0"
                    step="0.25"
                    value={portionScalar}
                    onChange={(e) => setPortionScalar(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#1FA45B]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>Min (0.25)</span>
                    <span>Std (1.0)</span>
                    <span>Max (4.0)</span>
                  </div>
                </div>

                {/* Category selectors */}
                <div className="space-y-2">
                  <span className="block text-[11px] text-gray-400 font-mono uppercase">Add to meal category</span>
                  <div className="grid grid-cols-4 gap-1">
                    {['breakfast', 'lunch', 'dinner', 'snacks'].map((cat) => (
                      <button
                        key={cat}
                        id={`category-btn-${cat}`}
                        type="button"
                        onClick={() => setLogCategory(cat as any)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          logCategory === cat 
                            ? 'bg-[#1FA45B]/10 border-[#1FA45B] text-white' 
                            : 'bg-slate-850 border-slate-805 text-gray-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Total Est. Calorie Intake</span>
                    <span className="text-lg font-black font-mono text-white">{Math.round(selectedFood.calories * portionScalar)} kcal</span>
                  </div>

                  <button
                    id="save-selected-meal-btn"
                    onClick={handleAddSelectedLog}
                    className="bg-[#1FA45B] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1"
                  >
                    Confirm & Save Log <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Custom Food Form with Micro Parameters */}
            {showCustomForm && (
              <motion.form
                key="customFoodForm"
                onSubmit={handleAddCustomLog}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3.5 overflow-y-auto max-h-[460px] pr-1"
              >
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-mono mb-1">Recipe / Item Name</label>
                  <input
                    id="custom-food-name-input"
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="E.g., Low Sodium Oats or Greek Salad..."
                    className="w-full bg-slate-850 border border-slate-705 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#1FA45B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-mono mb-1">Calories (Kcal)</label>
                    <input
                      id="custom-food-calories-input"
                      type="number"
                      value={customCalories || ''}
                      onChange={(e) => setCustomCalories(Number(e.target.value))}
                      className="w-full bg-slate-850 border border-slate-705 rounded-xl py-2 px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-mono mb-1">Typical Portion</label>
                    <input
                      id="custom-food-portion-input"
                      type="text"
                      value={customPortion}
                      onChange={(e) => setCustomPortion(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-705 rounded-xl py-2 px-3 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Macro metrics */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <div>
                    <label className="block text-[9px] text-gray-400 uppercase font-mono mb-1 text-center">Protein (g)</label>
                    <input
                      id="custom-food-protein-input"
                      type="number"
                      value={customProtein || ''}
                      onChange={(e) => setCustomProtein(Number(e.target.value))}
                      className="w-full bg-slate-850 border border-slate-705 rounded-xl py-1 px-2 text-xs text-center text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-400 uppercase font-mono mb-1 text-center">Carbs (g)</label>
                    <input
                      id="custom-food-carbs-input"
                      type="number"
                      value={customCarbs || ''}
                      onChange={(e) => setCustomCarbs(Number(e.target.value))}
                      className="w-full bg-slate-850 border border-slate-705 rounded-xl py-1 px-2 text-xs text-center text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-400 uppercase font-mono mb-1 text-center">Fats (g)</label>
                    <input
                      id="custom-food-fats-input"
                      type="number"
                      value={customFats || ''}
                      onChange={(e) => setCustomFats(Number(e.target.value))}
                      className="w-full bg-slate-850 border border-slate-705 rounded-xl py-1 px-2 text-xs text-center text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-400 uppercase font-mono mb-1 text-center font-bold">Fiber (g)</label>
                    <input
                      id="custom-food-fiber-input"
                      type="number"
                      value={customFiber || ''}
                      onChange={(e) => setCustomFiber(Number(e.target.value))}
                      className="w-full bg-slate-850 border border-slate-705 rounded-xl py-1 px-2 text-xs text-center text-white font-mono text-emerald-400 font-bold"
                    />
                  </div>
                </div>

                {/* Clinical Micro/Mineral metrics - UNLOCKED MANUAL REGISTRY */}
                <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-850 space-y-2">
                  <span className="block text-[9px] text-emerald-400 font-bold font-mono uppercase tracking-widest">Clinical Mineral & Vitamin Sheet (Optional)</span>
                  
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <span className="text-[8px] text-gray-400 block font-mono">Sodium (mg)</span>
                      <input
                        type="number"
                        value={customSodium || ''}
                        onChange={(e) => setCustomSodium(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-white text-center font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 block font-mono">Potassium (mg)</span>
                      <input
                        type="number"
                        value={customPotassium || ''}
                        onChange={(e) => setCustomPotassium(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-white text-center font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 block font-mono">Magnesium (mg)</span>
                      <input
                        type="number"
                        value={customMagnesium || ''}
                        onChange={(e) => setCustomMagnesium(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-white text-center font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <span className="text-[8px] text-gray-400 block font-mono">Calcium (mg)</span>
                      <input
                        type="number"
                        value={customCalcium || ''}
                        onChange={(e) => setCustomCalcium(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-white text-center font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 block font-mono">Zinc (mg)</span>
                      <input
                        type="number"
                        value={customZinc || ''}
                        onChange={(e) => setCustomZinc(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-white text-center font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 block font-mono">Iron (mg)</span>
                      <input
                        type="number"
                        value={customIron || ''}
                        onChange={(e) => setCustomIron(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-white text-center font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <span className="text-[8px] text-gray-400 block font-mono font-bold text-sky-400">Vit D3 (IU)</span>
                      <input
                        type="number"
                        value={customVitaminD || ''}
                        onChange={(e) => setCustomVitaminD(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-white text-center font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 block font-mono font-bold text-sky-400">Vit B12 (mcg)</span>
                      <input
                        type="number"
                        value={customB12 || ''}
                        onChange={(e) => setCustomB12(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-white text-center font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 block font-mono font-bold text-emerald-400">Omega3 (mg)</span>
                      <input
                        type="number"
                        value={customOmega3 || ''}
                        onChange={(e) => setCustomOmega3(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-white text-center font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] text-gray-400 font-mono uppercase">Log to category</span>
                  <div className="grid grid-cols-4 gap-1">
                    {['breakfast', 'lunch', 'dinner', 'snacks'].map((cat) => (
                      <button
                        key={cat}
                        id={`custom-category-btn-${cat}`}
                        type="button"
                        onClick={() => setLogCategory(cat as any)}
                        className={`py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${
                          logCategory === cat 
                            ? 'bg-[#1FA45B]/10 border-[#1FA45B] text-white' 
                            : 'bg-slate-850 border-slate-805 text-gray-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  id="custom-food-submit-btn"
                  type="submit"
                  className="w-full py-2.5 bg-[#1FA45B] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors uppercase font-mono"
                >
                  Save Standardized Recipe Composition
                </button>
              </motion.form>
            )}
          </AnimatePresence>

        </div>

        {/* Log History list */}
        <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-[#1FA45B]" />
                Daily Log History
              </h2>
              <span className="text-[10px] text-gray-400 font-mono">
                {mealLogs.length} logged
              </span>
            </div>

            <div className="mt-4 space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {mealLogs.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs italic">
                  Nothing logged today.<br />Search the clinical database library to add.
                </div>
              ) : (
                mealLogs.map((meal) => (
                  <div key={meal.id} className="bg-slate-850 p-3 rounded-xl border border-slate-850 hover:border-slate-800 flex items-center justify-between transition-all">
                    <div>
                      <p className="text-xs font-bold text-white uppercase">{meal.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 capitalize font-mono">
                        {meal.category} • {meal.portion}
                      </p>
                      <p className="text-[10px] text-emerald-400 mt-0.5">
                        P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-1 text-gray-200 rounded-lg">
                        {meal.calories} kcal
                      </span>
                      <button
                        id={`delete-meal-btn-${meal.id}`}
                        onClick={() => removeMealLog(meal.id)}
                        className="p-1.5 hover:bg-red-950/20 text-gray-500 hover:text-red-400 rounded-md transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center text-[11px] text-gray-400/80 leading-normal mt-4">
            <span className="text-[#FF8A24] font-bold uppercase mr-1 font-mono">Clinical Note:</span> 
            Combine high fiber sides like cabbage, salad greens, or bitter gourd with standard carbohydrates to maintain constant metabolic activity.
          </div>
        </div>

      </div>

    </div>
  );
}
