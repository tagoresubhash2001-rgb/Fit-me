/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, ShieldAlert, Sparkles, CheckCircle, Flame, Dumbbell, Zap, 
  BookOpen, ChevronRight, Apple, Activity, RefreshCw 
} from 'lucide-react';
import { UserProfile, DiseaseCondition } from '../types';

interface DiseaseProgramsProps {
  profile: UserProfile;
}

export default function DiseasePrograms({ profile }: DiseaseProgramsProps) {
  const [selectedDisease, setSelectedDisease] = useState<DiseaseCondition>(
    profile.disease !== 'none' ? profile.disease : 'diabetes'
  );

  // PCOS specific interactive state
  const [pcosCycleDay, setPcosCycleDay] = useState<number>(14);
  const [seedCheckboxes, setSeedCheckboxes] = useState({
    pumpkin: true,
    flax: true,
    sunflower: false,
    sesame: false
  });

  // Diabetes white rice calculator
  const [whiteRiceCups, setWhiteRiceCups] = useState<number>(1.5);

  const programsMap = {
    diabetes: {
      title: 'Diabetes Management Program',
      desc: 'Controls glycemic variability and blood sugar spikes by exchanging traditional white rice with low-glycemic, high-fiber millets.',
      metrics: 'HbA1c / Active Glucose focus',
      badges: ['Low Glycemic', 'High Fiber', 'Beta-Glucan Rich'],
      superfoods: [
        { name: 'Organic Ragi Flour', desc: 'Finger millet grain. Rich in calcium and digested extremely slowly.' },
        { name: 'Bitter Gourd Extracts', desc: 'Contains Charantin compounds which naturally assist insulin pathways.' },
        { name: 'Soaked Fenugreek Seeds', desc: 'Soluble fiber stabilizes early morning fasting glucose parameters.' },
        { name: 'Foxtail Millet Steamed', desc: 'Excellent replacement for white rice, keeps fullness long and prevents spikes.' }
      ]
    },
    pcos: {
      title: 'Hormonal Balance & PCOS/PCOD Care',
      desc: 'Regulates hormonal cycles, limits insulin resistance, and facilitates weight balance via micro-seed nutritional cycling and healthy fats.',
      metrics: 'LH / FSH ratio & Insulin sensitivity focus',
      badges: ['Estrogen Regulator', 'Anti-Inflammatory', 'Zinc Rich'],
      superfoods: [
        { name: 'Seed Cycling Protocol', desc: 'Consuming organic raw seeds daily to naturally feed estrogen and progesterone phases.' },
        { name: 'Virgin Coconut Oil', desc: 'Provides medium-chain triglycerides (MCTs) to build healthy hormones.' },
        { name: 'Sweet Yam and Tubers', desc: 'Completes complex carb demands, preventing cortisol / stress surges.' },
        { name: 'Fresh Amla Infusions', desc: 'High dose natural vitamin C reduces active cellular inflammation.' }
      ]
    },
    thyroid: {
      title: 'Thyroid Boost & Metabolic Care',
      desc: 'Optimizes natural T3/T4 conversion rates. Keeps clinical goitrogens under strict checks while supplying selenium, iodine, and zinc.',
      metrics: 'TSH & Basal Metabolic focus',
      badges: ['Selenium Rich', 'Gluten conscious', 'Goitrogen Safe'],
      superfoods: [
        { name: 'Selenium Seeds (Almonds & Pumpkin)', desc: 'Almonds supply tyrosine minerals which synthesizes thyroid hormones directly.' },
        { name: 'Probiotic Buttermilk', desc: 'Improves slow gut absorption, supporting active conversion processes.' },
        { name: 'Drumstick Leaf / Moringa', desc: 'Highly bioactive leaf extract boosting poor thyroid function.' },
        { name: 'Steamed Brassica Greens', desc: 'Steaming destroys goitrogenic acids, making spinach, cabbage totally safe.' }
      ]
    },
    hypertension: {
      title: 'Hypertension program',
      desc: 'Balances fluid retention and arterial tension using high potassium local ingredients, strictly managing hidden tablesalt levels.',
      metrics: 'Systolic / Diastolic fluid balance focus',
      badges: ['Low Sodium', 'Potassium Boost', 'Magnesium Rich'],
      superfoods: [
        { name: 'Banana Stem Extracts', desc: 'Supercharged natural diuretic which washes excess sodium out.' },
        { name: 'Snake Gourd Steamed', desc: 'Highly hydrating vegetable, high potassium and relaxes vessels.' },
        { name: 'Millet Broth / Kanji', desc: 'Provides sustained magnesium to relax tight cardiac smooth muscles.' },
        { name: 'Garlic bulb Cloves', desc: 'Allicin compounds prompt natural vasodilation immediately.' }
      ]
    },
    fatty_liver: {
      title: 'Fatty Liver Reversal & Gut Rehab',
      desc: 'Reverses hepatic lipid accumulation (fat cells in liver) by removing processed seed oils and simple refined sugars.',
      metrics: 'SGOT / SGPT & Liver enzyme focus',
      badges: ['Hepatic Detox', 'Zero Seed Oils', 'Lipid Flush'],
      superfoods: [
        { name: 'Fresh Sorrel Leafs', desc: 'Highly packed with organic iron and antioxidants to flush out hepatic lipids.' },
        { name: 'Lemon warm Water infusion', desc: 'Stimulates bile production and aids initial hepatic clearance.' },
        { name: 'Amla Lentils pure', desc: 'High concentration of vitamin C blocks further hepatic cell damage.' },
        { name: 'Buttermilk with Jeera powder', desc: 'Eradicates gut endotoxins that trigger liver inflammation.' }
      ]
    }
  };

  const activeData = programsMap[selectedDisease as keyof typeof programsMap] || programsMap.diabetes;

  // Render glycemic white rice calculator math
  const calculatedRiceCalories = Math.round(whiteRiceCups * 200);
  const calculatedRiceGlycemicLoad = Math.round(whiteRiceCups * 22);

  const estimatedMilletCalories = Math.round(whiteRiceCups * 160);
  const estimatedMilletGlycemicLoad = Math.round(whiteRiceCups * 11);

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-0 mt-4 space-y-6">
      
      {/* Title Header */}
      <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#1FA45B] animate-pulse" />
          <span className="text-xs text-[#1FA45B] font-bold uppercase tracking-wider font-mono">Therapeutic Specialty Care</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mt-1 font-display">
          Disease Reversal Eco-Drive 🩺
        </h1>
        <p className="text-xs text-gray-350 mt-1 leading-relaxed">
          We combine medical nutritional science with authentic South Indian home cooking recipes to tackle metabolic issues.
        </p>

        {/* Selected Disease program alert badge */}
        {profile.disease !== 'none' && (
          <div className="mt-4 bg-[#FF8A24]/10 border border-[#FF8A24]/25 p-4 rounded-2xl flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#FF8A24]" />
            <span className="text-xs text-gray-200 leading-normal">
              Your profile is matched with the <strong>{profile.disease.toUpperCase()} Program</strong>. Curated menu limits are automatically integrated.
            </span>
          </div>
        )}
      </div>

      {/* Disease Selection horizontal bar */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 shrink-0 no-scrollbar relative z-10">
        {[
          { id: 'diabetes', label: 'Diabetes', icon: Heart },
          { id: 'pcos', label: 'PCOS / PCOD', icon: Sparkles },
          { id: 'thyroid', label: 'Thyroid Boost', icon: Zap },
          { id: 'hypertension', label: 'BP / Hypertension', icon: Activity },
          { id: 'fatty_liver', label: 'Fatty Liver', icon: Apple }
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = selectedDisease === item.id;
          return (
            <button
              key={item.id}
              id={`disease-select-${item.id}`}
              onClick={() => setSelectedDisease(item.id as DiseaseCondition)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold shrink-0 border transition-all ${
                isSelected 
                  ? 'bg-white/10 border-white/20 text-white font-black shadow-md scale-102' 
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#1FA45B]' : 'text-gray-500'}`} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Specialty Details & Badges */}
        <div className="md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] space-y-5 shadow-lg">
          <div>
            <span className="text-[10px] text-[#1FA45B] font-mono block uppercase font-bold tracking-wider">{activeData.metrics}</span>
            <h2 className="text-xl font-extrabold text-white mt-1 uppercase flex items-center justify-between font-display">
              <span>{activeData.title}</span>
            </h2>
            <p className="text-xs text-gray-350 mt-2.5 leading-relaxed">{activeData.desc}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {activeData.badges.map((b) => (
              <span key={b} className="text-[10px] bg-white/5 border border-white/5 text-gray-300 font-mono px-3.5 py-1 rounded-full uppercase font-medium">
                {b}
              </span>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">Top Regional Micro-Superfoods</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeData.superfoods.map((food, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                  <h4 className="text-xs font-bold text-[#FF8A24] uppercase tracking-wide">{food.name}</h4>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">{food.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Disease Tools */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] flex flex-col justify-between shadow-lg">
          
          {selectedDisease === 'diabetes' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Apple className="w-4 h-4 text-[#1FA45B]" />
                Glycemic Swap Calculator
              </h3>
              <p className="text-[11px] text-gray-400">
                White Sona Masuri has index 72. Millets are index 50. Calculate your glycemic load savings:
              </p>

              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-500 font-mono">Cups of White Rice per day</span>
                <div className="flex items-center justify-between">
                  <input
                    id="white-rice-cups-input"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="5"
                    value={whiteRiceCups}
                    onChange={(e) => setWhiteRiceCups(Number(e.target.value))}
                    className="bg-transparent border-0 font-bold text-white text-lg w-16 focus:outline-none focus:ring-0"
                  />
                  <span className="text-xs text-gray-400">({whiteRiceCups} standard cups)</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Sona Masuri Rice load:</span>
                  <span className="text-red-400 font-bold">{calculatedRiceGlycemicLoad} GL ({calculatedRiceCalories} kcal)</span>
                </div>
                <div className="flex justify-between items-center text-gray-200">
                  <span>Pesarattu / Korra Swap:</span>
                  <span className="text-[#1FA45B] font-bold">{estimatedMilletGlycemicLoad} GL ({estimatedMilletCalories} kcal)</span>
                </div>
                <div className="bg-emerald-950/10 border border-emerald-900/30 p-2 text-[10px] rounded-lg text-emerald-400 font-mono leading-normal">
                  SAVED: {calculatedRiceGlycemicLoad - estimatedMilletGlycemicLoad} Glycemic Load units! That reduces liver glucose synthesis by 45%.
                </div>
              </div>
            </div>
          )}

          {selectedDisease === 'pcos' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="text-[#FF8A24] w-4 h-4" />
                Seed Cycling Protocol Controller
              </h3>
              <p className="text-[11px] text-gray-400">
                Track seed intakes relative to current menstrual days to naturally support estrogen & progesterone balances:
              </p>

              <div className="space-y-1 bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-[11px] font-mono text-gray-400">
                  <span>Cycle Day Focus</span>
                  <span className="text-[#FF8A24] font-bold">Day {pcosCycleDay}</span>
                </div>
                <input
                  id="pcos-day-slider"
                  type="range"
                  min="1"
                  max="28"
                  value={pcosCycleDay}
                  onChange={(e) => setPcosCycleDay(Number(e.target.value))}
                  className="w-full accent-[#FF8A24] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                  <span>Follicular (Estrogen)</span>
                  <span>Day 14 (Luteal)</span>
                  <span>Progesterone</span>
                </div>
              </div>

              {/* Seed Phase Checklist */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] text-gray-500 uppercase font-mono">Suggested Seeds Checklist:</span>
                
                {pcosCycleDay <= 14 ? (
                  <div className="space-y-1.5 p-2 bg-[#1FA45B]/5 border border-[#1FA45B]/15 rounded-xl">
                    <p className="text-[10px] text-[#1FA45B] font-mono leading-none">Estrogen Boost Phase (pumpkin + flax):</p>
                    <label className="flex items-center gap-2.5 text-gray-300">
                      <input 
                        id="seed-checkbox-pumpkin"
                        type="checkbox" 
                        checked={seedCheckboxes.pumpkin}
                        onChange={(e) => setSeedCheckboxes({...seedCheckboxes, pumpkin: e.target.checked})}
                        className="rounded accent-[#1FA45B]" 
                      />
                      <span>1 tbsp Powdered Flaxseeds</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-gray-300">
                      <input 
                        id="seed-checkbox-flax"
                        type="checkbox" 
                        checked={seedCheckboxes.flax}
                        onChange={(e) => setSeedCheckboxes({...seedCheckboxes, flax: e.target.checked})}
                        className="rounded accent-[#1FA45B]" 
                      />
                      <span>1 tbsp Organic Pumpkin seeds</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-1.5 p-2 bg-[#FF8A24]/5 border border-[#FF8A24]/15 rounded-xl">
                    <p className="text-[10px] text-[#FF8A24] font-mono leading-none">Progesterone Boost Phase (sesame + sunflower):</p>
                    <label className="flex items-center gap-2.5 text-gray-300">
                      <input 
                        id="seed-checkbox-sunflower"
                        type="checkbox" 
                        checked={seedCheckboxes.sunflower}
                        onChange={(e) => setSeedCheckboxes({...seedCheckboxes, sunflower: e.target.checked})}
                        className="rounded accent-[#FF8A24]" 
                      />
                      <span>1 tbsp Raw Sunflower seeds</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-gray-300">
                      <input 
                        id="seed-checkbox-sesame"
                        type="checkbox" 
                        checked={seedCheckboxes.sesame}
                        onChange={(e) => setSeedCheckboxes({...seedCheckboxes, sesame: e.target.checked})}
                        className="rounded accent-[#FF8A24]" 
                      />
                      <span>1 tbsp Unpolished Sesame seeds (Nuvvulu)</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedDisease === 'thyroid' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Zap className="text-amber-400 w-4 h-4" />
                Goitrogens Steam Assistant
              </h3>
              <p className="text-[11px] text-gray-400">
                Goitrogens block iodine absorption in your thyroid gland. Boiling, steaming, or cooking degrades this block:
              </p>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-red-400 font-bold uppercase">Raw Cauliflower</span>
                  <span className="text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded font-mono">100% active block</span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-800 pt-2">
                  <span className="text-emerald-400 font-bold uppercase">Steamed / boiled (15 min)</span>
                  <span className="text-[#1FA45B] bg-emerald-950/20 px-1.5 py-0.5 rounded font-mono">90% neutralized</span>
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 text-[10px] rounded-lg text-slate-400 text-center font-mono leading-normal">
                Avoid uncooked cabbage salad, multi-raw leafy smoothies. Safe cooked Gongura, Pappu, and Curry items are totally safe.
              </div>
            </div>
          )}

          {selectedDisease !== 'diabetes' && selectedDisease !== 'pcos' && selectedDisease !== 'thyroid' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Heart className="text-[#1FA45B] w-4 h-4" />
                Regional Sodium Guard
              </h3>
              <p className="text-[11px] text-gray-400 text-left leading-normal">
                Standard Andhra pickle / Avakaya contains over 800mg sodium in 1 tablespoon! 
              </p>

              <div className="bg-red-950/10 border border-red-900/30 p-2.5 rounded-xl text-[11px] leading-relaxed text-red-400">
                Pickles, dehydrated chips (Arati Vayalu), and store-bought papads should be locked up. Switch to active ginger-allam chutneys.
              </div>

              <div className="bg-slate-850 p-3 rounded-xl text-[10px] text-gray-200">
                <strong>Salt Reduction Alternative:</strong><br />
                Use rock salt / saindhava lavanam sparingly. Squeeze fresh lemon juice (nimmakaya) to recreate standard salty tartness.
              </div>
            </div>
          )}

          <div className="text-[10px] text-gray-500 font-mono text-center border-t border-slate-800/80 pt-4">
            Consult Jai/Jaya for exact dosage suggestions matching your latest blood panel!
          </div>
        </div>

      </div>

    </div>
  );
}
