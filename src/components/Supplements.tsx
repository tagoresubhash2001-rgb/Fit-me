/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Calendar, ShieldAlert, Award, Sparkles, CheckCircle, 
  Search, Pill, TrendingUp, Info, HelpCircle 
} from 'lucide-react';
import { SupplementLog, UserProfile } from '../types';
import { DEFAULT_SUPPLEMENTS } from '../lib/dbSchema';

interface SupplementsProps {
  profile: UserProfile;
}

export default function Supplements({ profile }: SupplementsProps) {
  const [logs, setLogs] = useState<SupplementLog[]>(() => {
    const saved = localStorage.getItem('fit_me_supplements_v1');
    return saved ? JSON.parse(saved) : [
      {
        id: 'supp-init-1',
        name: 'Vitamin D3 Cholecalciferol',
        dosage: '2000 IU',
        timing: 'Morning with heavy breakfast',
        consistencyScore: 92,
        nutrientImpact: 'Enhances bone density & general metabolism',
        deficiencyCorrection: 'Corrects dark office workspace deficiency',
        interactions: 'Do not consume with excessive caffeine',
        timestamp: '08:30 AM'
      },
      {
        id: 'supp-init-2',
        name: 'Whey Protein Isolate',
        dosage: '1 scoop (35g)',
        timing: 'Immediately Post-Workout',
        consistencyScore: 85,
        nutrientImpact: 'Optimizes muscle repair & protein limits',
        deficiencyCorrection: 'Corrects vegetarian diet protein gap',
        interactions: 'Keep thoroughly hydrated throughout the day',
        timestamp: '06:15 PM'
      }
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDosage, setCustomDosage] = useState('');
  const [customTiming, setCustomTiming] = useState('Morning');
  const [showAddForm, setShowAddForm] = useState(false);

  // AI Advisor state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAdvisor, setIsLoadingAdvisor] = useState(false);

  useEffect(() => {
    localStorage.setItem('fit_me_supplements_v1', JSON.stringify(logs));
  }, [logs]);

  const handleSelectDefault = (item: typeof DEFAULT_SUPPLEMENTS[0]) => {
    const newLog: SupplementLog = {
      id: `supp-log-${Date.now()}`,
      name: item.name,
      dosage: item.baseDosage,
      timing: item.bestTiming,
      consistencyScore: Math.floor(Math.random() * 20) + 80, // 80-99
      nutrientImpact: item.interactions,
      deficiencyCorrection: item.deficiencyCorrection,
      interactions: item.interactions,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setLogs(prev => [...prev, newLog]);
    setSearchTerm('');
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newLog: SupplementLog = {
      id: `supp-log-${Date.now()}`,
      name: customName,
      dosage: customDosage || '1 Serving',
      timing: customTiming,
      consistencyScore: 100,
      nutrientImpact: 'General nutrient enhancement',
      deficiencyCorrection: 'Supports active lifestyle goals',
      interactions: 'Maintain high fresh hydration score daily',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setLogs(prev => [...prev, newLog]);
    setCustomName('');
    setCustomDosage('');
    setShowAddForm(false);
  };

  const handleRemoveLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  // Automated smart consistency score
  const averageConsistency = logs.length > 0 
    ? Math.round(logs.reduce((acc, l) => acc + l.consistencyScore, 0) / logs.length)
    : 100;

  // Smart AI Supplement Advisor
  const generateSupplementAdvise = () => {
    setIsLoadingAdvisor(true);
    setAiAnalysis(null);

    // Call simulated delay or model
    setTimeout(() => {
      let advise = '';
      if (profile.disease === 'diabetes') {
        advise = `Based on your Diabetes profile, Magnesium Bisglycinate (${logs.some(l => l.name.toLowerCase().includes('magnesium')) ? 'which you are currently tracking!' : 'which you are not tracking yet'}) is highly recommended as it plays a key role in insulin action and glucose control. Consider introducing Alpha Lipoic Acid too. Avoid sugar-sweetened protein powders. For muscle building, clean Whey Protein with zero sweeteners is safe. Take Chromium Picolinate only if checked with your physician.`;
      } else if (profile.disease === 'pcos') {
        advise = `Based on your PCOS condition, high-quality Omega-3 and Vitamin D3 are key to regulate insulin sensitivity and reduce overall inflammation. Inositol and Zinc would be excellent future additions to stabilize hormonal balances. Avoid supplements with processed vegetable oil carriers. Make sure to consume your Omega-3 with lunch for maximum absorption.`;
      } else if (profile.disease === 'thyroid') {
        advise = `For Thyroid management, ensure Selenium and Zinc are present in your multivitamin. If you use L-Thyroxine, do not consume Calcium or Iron supplements within 4 hours, as they inhibit direct hormone absorption! Ashwagandha KSM-66 supports thyroid gland output, but consult your physician if you are on medications.`;
      } else {
        advise = `With your active target (${profile.goal.replace('_', ' ')}), maintaining a high Consistency Score of Whey Protein and Creatine will dramatically accelerate your athletic adaptations. Ensure you keep your general Hydration Score above 85% when logging Creatine to safeguard electrolyte levels and avoid cramping.`;
      }
      setAiAnalysis(advise);
      setIsLoadingAdvisor(false);
    }, 1000);
  };

  const filteredDefaults = DEFAULT_SUPPLEMENTS.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.deficiencyCorrection.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-0 mt-4 space-y-6">
      
      {/* Title Card */}
      <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-[#1FA45B] font-extrabold uppercase tracking-wider font-mono">Performance & Bio-hacking</span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1 font-display">
            Active Supplement Laboratory 💊
          </h1>
          <p className="text-xs text-gray-350 mt-1 leading-relaxed">
            Monitor timing, nutrient interactions, and deficiencies to support your global metabolic goals.
          </p>
        </div>

        {/* Consistency Circle */}
        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* simple path spinner */}
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow" />
            <span className="text-xs font-black text-white font-mono">{averageConsistency}%</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-mono uppercase leading-none">Consistency</p>
            <p className="text-xs font-extrabold text-[#1FA45B] mt-1">Excellent Score</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Logging Form & Defaults Search */}
        <div className="md:col-span-2 space-y-4">
          
          {/* Quick Select Search Panel */}
          <div className="bg-white/5 p-5 rounded-[32px] border border-white/10 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-tight font-display">
                Supplement Catalog
              </h2>
              <button
                id="toggle-custom-supplement"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs text-[#FF8A24] font-bold font-mono hover:text-orange-400"
              >
                {showAddForm ? '← Search Catalog' : '+ Add Custom Pill'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!showAddForm ? (
                <motion.div
                  key="searchDefaults"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      id="supplement-search-input"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search whey, multivitamin, magnesium, ashwagandha..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#1FA45B]"
                    />
                  </div>

                  {/* Options List */}
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {filteredDefaults.map((item, idx) => (
                      <button
                        key={idx}
                        id={`add-default-supp-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => handleSelectDefault(item)}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.08] p-3 rounded-2xl border border-white/5 hover:border-white/10 text-left flex justify-between items-center text-xs transition-all"
                      >
                        <div>
                          <p className="font-bold text-gray-200">{item.name}</p>
                          <p className="text-[10px] text-[#FF8A24] mt-0.5">{item.bestTiming} • {item.baseDosage}</p>
                        </div>
                        <span className="text-[10px] bg-[#1FA45B]/10 text-[#1FA45B] border border-[#1FA45B]/20 font-mono px-2 py-0.5 rounded-full uppercase font-bold">
                          Add Log
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="customSupplementForm"
                  onSubmit={handleAddCustom}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-mono mb-1.5">Supplement Name</label>
                      <input
                        id="custom-supp-name"
                        type="text"
                        required
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="E.g., Creatine Creapure, B12..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#1FA45B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-mono mb-1.5">Dosage</label>
                      <input
                        id="custom-supp-dosage"
                        type="text"
                        placeholder="E.g., 5 grams, 1 tablet..."
                        value={customDosage}
                        onChange={(e) => setCustomDosage(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#1FA45B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-mono mb-1.5">Best Timing</label>
                    <select
                      id="custom-supp-timing"
                      value={customTiming}
                      onChange={(e) => setCustomTiming(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#1FA45B] appearance-none"
                    >
                      <option value="Morning with breakfast">Morning with breakfast</option>
                      <option value="Pre-workout">Pre-workout</option>
                      <option value="Post-workout">Post-workout</option>
                      <option value="With heavy lunch">With heavy lunch</option>
                      <option value="30 mins before sleep">30 mins before sleep</option>
                    </select>
                  </div>

                  <button
                    id="submit-custom-supp"
                    type="submit"
                    className="w-full py-2.5 bg-[#1FA45B] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors font-mono"
                  >
                    CONFIRM & LOG SUPPLEMENT
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Active Intake logs list */}
          <div className="bg-white/5 p-5 rounded-[32px] border border-white/10 shadow-lg space-y-3">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-tight font-display flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-[#1FA45B]" /> Active Logged Pills ({logs.length})
            </h2>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs">
                  No supplements logged today.<br />Search or custom log details above.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 hover:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-tight">{log.name}</h4>
                        <span className="text-[9px] bg-[#FF8A24]/10 text-[#FF8A24] border border-[#FF8A24]/20 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                          {log.dosage}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-normal">
                        <span className="text-gray-400">Timing:</span> <strong>{log.timing}</strong>
                      </p>
                      <p className="text-[10px] text-emerald-400 leading-snug">
                        💡 {log.deficiencyCorrection}
                      </p>
                      {log.interactions && (
                        <p className="text-[10px] text-orange-300 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>Interactions: {log.interactions}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 sm:self-center justify-end">
                      <div className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-right">
                        <span className="text-[9px] text-gray-500 font-mono block uppercase">Consistency</span>
                        <span className="text-xs font-black text-white font-mono">{log.consistencyScore}%</span>
                      </div>
                      <button
                        id={`delete-supp-btn-${log.id}`}
                        onClick={() => handleRemoveLog(log.id)}
                        className="p-2 bg-red-950/20 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-xl transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: AI Supplement Advisor & Interactive Analytics & Marketplace */}
        <div className="space-y-4">
          
          {/* Smart AI Consultant Card */}
          <div className="bg-white/5 p-5 rounded-[32px] border border-white/10 shadow-lg space-y-4 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-40 h-40 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="space-y-1">
              <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                Precision Biology AI
              </span>
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1 mt-1 font-display">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> AI Supplement Advisor
              </h3>
              <p className="text-[11px] text-gray-400 leading-normal">
                Analyze active dosage combinations, timing overlapping, and health program safety factors.
              </p>
            </div>

            <div className="min-h-[140px] bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-xs leading-relaxed text-gray-300 relative">
              {isLoadingAdvisor ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 bg-black/10 rounded-2xl">
                  <div className="animate-spin w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent" />
                  <span className="text-[10px] font-mono">Running molecular safety checks...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <p>{aiAnalysis}</p>
                  <p className="text-[10px] text-gray-500 italic mt-2">✨ Powered by Fit Me Precision Nutrition guidelines.</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center text-gray-500">
                  <p>Click below to run automated safety combination logs analysis. Checks cross-interactions with your listed goal ({profile.goal.toUpperCase()}) and listed condition ({profile.disease.toUpperCase()}).</p>
                </div>
              )}
            </div>

            <button
              id="run-supp-advisor-btn"
              onClick={generateSupplementAdvise}
              disabled={isLoadingAdvisor}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-mono font-extrabold text-[10px] uppercase rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
            >
              Analyze Combination Safety
            </button>
          </div>

          {/* Supplement Interaction Alerts Safety Panel */}
          <div className="bg-white/5 p-5 rounded-[32px] border border-white/10 shadow-lg space-y-3">
            <h3 className="text-xs font-mono font-extrabold text-[#FF8A24] uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 shrink-0" /> Critical Safe Rules
            </h3>
            
            <div className="space-y-2 text-[11px] text-gray-400 leading-relaxed">
              <div className="bg-orange-500/5 p-2 rounded-xl border border-orange-500/10">
                <p className="font-bold text-white uppercase text-[9px]">Calcium vs Iron</p>
                <p className="mt-0.5">Dual absorption warning: Do not swallow calcium and iron pills simultaneously. Keep a 4 hour gap.</p>
              </div>
              <div className="bg-orange-500/5 p-2 rounded-xl border border-orange-500/10">
                <p className="font-bold text-white uppercase text-[9px]">Creatine Water Demand</p>
                <p className="mt-0.5">Creatine draws water into tissue. Drink at least 3.5 Liters of water to support kidneys.</p>
              </div>
              <div className="bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
                <p className="font-bold text-white uppercase text-[9px]">Vitamin D3 Absorption</p>
                <p className="mt-0.5 text-emerald-300">D3 is intensely fat-soluble. Always swallow with milk, ghee, or eggs for 3x absorption.</p>
              </div>
            </div>
          </div>

          {/* Supplement Marketplace teaser */}
          <div className="bg-white/5 p-5 rounded-[32px] border border-white/10 shadow-lg space-y-2 text-center relative overflow-hidden">
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-[#1FA45B]/5 rounded-full blur-[80px]" />
            <Award className="w-6 h-6 text-[#1FA45B] mx-auto opacity-75 animate-bounce mb-1" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Marketplace Integration</h4>
            <p className="text-[10px] text-gray-400 leading-normal">
              Direct checkout of clinically pure, heavy-metal tested protein and multivitamins coming next quarter.
            </p>
            <span className="inline-block text-[8px] bg-[#1FA45B]/10 text-[#1FA45B] px-2 py-0.5 rounded-full font-mono uppercase font-black">
              Partnership locked with organic hubs
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
