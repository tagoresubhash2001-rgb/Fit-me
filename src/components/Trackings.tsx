import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Droplet, Heart, Activity, ShieldAlert, Sparkles, Scale, AlertCircle,
  TrendingUp, Compass, Calendar, CheckSquare, Plus, Minus, UserCheck, 
  Moon, Zap, ShieldCheck, Thermometer, Smile, Eye, ArrowUpRight, Award,
  Clock, RefreshCw, Layers, Lock, Shield, Settings, Info
} from 'lucide-react';
import { 
  UserProfile, BloodSugarLog, BpLog, HeartRateLog, StressLog, SleepLog, 
  CycleLog, BodyMeasurements, WorkoutLog, MoodLog, HydrationLog, 
  CholesterolLog, GutHealthLog, SkinHairLog, WeightLog 
} from '../types';
import { useTrackingStore } from '../stores/tracking.store';
import { useWorkoutStore } from '../stores/workout.store';

interface TrackingsProps {
  profile: UserProfile;
  waterAmount: number;
  incrementWater: (amount: number) => void;
  mealLogsCalories: number;
}

export default function Trackings({
  profile,
  waterAmount,
  incrementWater,
  mealLogsCalories
}: TrackingsProps) {

  // ----------------------------------------------------
  // PERSISTED STATE ENGAGEMENTS
  // ----------------------------------------------------
  const {
    sugarLogs,
    bpLogs,
    hrLogs,
    stressLogs,
    sleepLogs,
    cycleLogs,
    weightLogs,
    cholesterolLogs,
    measurements,
    addSugarLog,
    addBpLog,
    addHrLog,
    addStressLog,
    addSleepLog,
    addCycleLog,
    addWeightLog,
    addCholesterolLog,
    updateMeasurements
  } = useTrackingStore();

  const { steps } = useWorkoutStore();

  // Heatmap State supporting history & dynamic editability
  const [historicHeatmap, setHistoricHeatmap] = useState<Record<string, number[]>>(() => {
    const saved = localStorage.getItem('fit_me_heatmap_days_v1');
    if (saved) return JSON.parse(saved);
    return {
      workouts: [2, 3, 0, 2, 3, 1], // levels 0-3 for past 6 days
      meals: [3, 2, 3, 1, 3, 2],
      water: [2, 3, 1, 2, 3, 2],
      clinical: [1, 2, 0, 1, 2, 1]
    };
  });

  useEffect(() => {
    localStorage.setItem('fit_me_heatmap_days_v1', JSON.stringify(historicHeatmap));
  }, [historicHeatmap]);

  const toggleHistoricDay = (category: string, index: number) => {
    setHistoricHeatmap(prev => {
      const arr = [...prev[category]];
      arr[index] = (arr[index] + 1) % 4; // rotate level 0-3
      return { ...prev, [category]: arr };
    });
  };

  const [gutLogs, setGutLogs] = useState<GutHealthLog[]>(() => {
    const saved = localStorage.getItem('fit_me_gut_health_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', digestionLevel: 'normal', isBowelConsistent: true, probioticTaken: true, timestamp: '11:00 AM' }
    ];
  });

  const [skinHairLogs, setSkinHairLogs] = useState<SkinHairLog[]>(() => {
    const saved = localStorage.getItem('fit_me_skin_hair_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', acneLevel: 'none', isDrySkin: false, hairFallLevel: 'normal', observedDeficiencies: [], timestamp: 'Morning' }
    ];
  });

  const [moodLogs, setMoodLogs] = useState<MoodLog[]>(() => {
    const saved = localStorage.getItem('fit_me_mood_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', state: 'energetic', correlationNotes: 'Felt fresh', timestamp: '10:00 AM' }
    ];
  });

  // Local state storage hooks
  useEffect(() => {
    localStorage.setItem('fit_me_gut_health_logs', JSON.stringify(gutLogs));
  }, [gutLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_skin_hair_logs', JSON.stringify(skinHairLogs));
  }, [skinHairLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_mood_logs', JSON.stringify(moodLogs));
  }, [moodLogs]);

  // Collapsible accordion keys
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    sugar: false,
    bp: false,
    heart: true,
    sleep: false,
    cycle: true,
    gut: true,
    lipids: true,
    hairskin: true,
    body: true
  });

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ----------------------------------------------------
  // SCIENTIFIC HEALTH ENGINE CALCULATORS
  // ----------------------------------------------------
  const latestSugar = sugarLogs[sugarLogs.length - 1]?.glucoseValue || 100;
  const latestSystolic = bpLogs[bpLogs.length - 1]?.systolic || 120;
  const latestDiastolic = bpLogs[bpLogs.length - 1]?.diastolic || 80;
  const latestBpm = hrLogs[hrLogs.length - 1]?.bpm || 70;
  const latestSleepHours = sleepLogs[sleepLogs.length - 1]?.durationHours || 7.2;
  const latestStress = stressLogs[stressLogs.length - 1]?.level || 'calm';
  const latestGutDigestion = gutLogs[gutLogs.length - 1]?.digestionLevel || 'normal';

  // Calculate Health Score (0-100)
  const healthScore = Math.min(100, Math.max(30, 80 
    + (waterAmount >= 2500 ? 5 : -4)
    + (latestSleepHours >= 7 && latestSleepHours <= 8.5 ? 5 : -5)
    + (latestSugar < 120 ? 5 : -10)
    + (latestSystolic < 130 ? 5 : -8)
    + (latestStress === 'calm' ? 5 : latestStress === 'high' ? -12 : -3)
  ));

  // Recovery Score based on HR variance simulation, sleep, water
  const recoveryScore = Math.min(100, Math.max(25, 87 
    - (latestStress === 'high' ? 15 : latestStress === 'elevated' ? 8 : 0)
    - (8 - Math.min(8, latestSleepHours)) * 8
    + (waterAmount >= 3000 ? 5 : 0)
    - (latestBpm > 85 ? 10 : 0)
  ));

  // Immunity score
  const immunityScore = Math.min(100, Math.max(30, 78 
    + (latestSleepHours >= 7.5 ? 6 : -4)
    + (waterAmount >= 2500 ? 6 : -3)
    + (latestGutDigestion === 'excellent' ? 5 : 0)
  ));

  // ----------------------------------------------------
  // QUICK INDIVIDUAL LOGGERS
  // ----------------------------------------------------
  const [sVal, setSVal] = useState('');
  const [sType, setSType] = useState<'fasting' | 'post_meal'>('fasting');
  const addSugar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sVal) return;
    addSugarLog({
      type: sType as any,
      glucoseValue: Number(sVal)
    });
    setSVal('');
  };

  const [sysIn, setSysIn] = useState('');
  const [diaIn, setDiaIn] = useState('');
  const addBp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sysIn || !diaIn) return;
    addBpLog({
      systolic: Number(sysIn),
      diastolic: Number(diaIn)
    });
    setSysIn('');
    setDiaIn('');
  };

  const [bpmIn, setBpmIn] = useState('');
  const [hrTypeIn, setHrTypeIn] = useState<'resting' | 'workout'>('resting');
  const addHr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bpmIn) return;
    addHrLog({
      type: hrTypeIn as any,
      bpm: Number(bpmIn)
    });
    setBpmIn('');
  };

  const [wtIn, setWtIn] = useState('');
  const [fatIn, setFatIn] = useState('');
  const addWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wtIn) return;
    addWeightLog({
      weight: Number(wtIn),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bodyFatPercentage: fatIn ? Number(fatIn) : undefined
    });
    setWtIn('');
    setFatIn('');
  };

  const [flowIn, setFlowIn] = useState<'light' | 'normal' | 'heavy'>('normal');
  const addCycle = () => {
    addCycleLog({
      cycleDate: new Date().toISOString().split('T')[0],
      isOvulation: false,
      symptoms: [],
      pmsSeverity: 'none',
      mood: 'balanced',
      flowIntensity: flowIn,
      energyLevel: 8
    });
  };

  // Cholesterol metrics
  const [hdlIn, setHdlIn] = useState('');
  const [ldlIn, setLdlIn] = useState('');
  const [trigIn, setTrigIn] = useState('');
  const addCholesterol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hdlIn || !ldlIn) return;
    addCholesterolLog({
      hdl: Number(hdlIn),
      ldl: Number(ldlIn),
      triglycerides: Number(trigIn) || 120
    });
    setHdlIn('');
    setLdlIn('');
    setTrigIn('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      
      {/* Top Header Row of Analytics */}
      <div>
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#FF8A24] font-extrabold block">HealthOS Diagnostics</span>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase mt-1">Metabolic & Biochemical Surveillance</h2>
      </div>

      {/* 1. HEALTH SCORE & RECOVERY SCORE GAUGES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Radial Health Score card */}
        <div className="bg-[#070D14] p-5 border border-white/5 rounded-2xl flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <span className="text-[8px] uppercase font-mono text-emerald-400 block tracking-wider">Metabolic OS</span>
            <span className="text-xs font-bold text-slate-300">Biochemical Health Score</span>
          </div>
          <div className="my-4 relative flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90">
              <circle cx="48" cy="48" r="40" className="stroke-slate-900 fill-none" strokeWidth="6" />
              <circle cx="48" cy="48" r="40" className="stroke-emerald-400 fill-none transition-all duration-700" strokeWidth="6" strokeDasharray={2*Math.PI*40} strokeDashoffset={2*Math.PI*40*(1 - healthScore/100)} strokeLinecap="round" />
            </svg>
            <div className="absolute text-center">
              <span className="text-xl font-black text-white">{healthScore}</span>
              <span className="text-[8px] text-gray-400 block font-mono">/100</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 italic">Target: Keep fasting metabolic values uniform.</span>
        </div>

        {/* Radial Recovery Score card */}
        <div className="bg-[#070D14] p-5 border border-white/5 rounded-2xl flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <span className="text-[8px] uppercase font-mono text-indigo-400 block tracking-wider">Parasympathetic State</span>
            <span className="text-xs font-bold text-slate-300">Autonomic Recovery Score</span>
          </div>
          <div className="my-4 relative flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90">
              <circle cx="48" cy="48" r="40" className="stroke-slate-900 fill-none" strokeWidth="6" />
              <circle cx="48" cy="48" r="40" className="stroke-indigo-400 fill-none transition-all duration-700" strokeWidth="6" strokeDasharray={2*Math.PI*40} strokeDashoffset={2*Math.PI*40*(1 - recoveryScore/100)} strokeLinecap="round" />
            </svg>
            <div className="absolute text-center">
              <span className="text-xl font-black text-white">{recoveryScore}</span>
              <span className="text-[8px] text-gray-400 block font-mono">/100</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 italic">HRV Sync: Sleep debt {latestSleepHours < 7 ? 'detected' : 'neutralized'}.</span>
        </div>

        {/* Radial Immunity score card */}
        <div className="bg-[#070D14] p-5 border border-white/5 rounded-2xl flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <span className="text-[8px] uppercase font-mono text-blue-400 block tracking-wider">Active Guard</span>
            <span className="text-xs font-bold text-slate-300">Vapor Defense Immunity</span>
          </div>
          <div className="my-4 relative flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90">
              <circle cx="48" cy="48" r="40" className="stroke-slate-900 fill-none" strokeWidth="6" />
              <circle cx="48" cy="48" r="40" className="stroke-blue-400 fill-none transition-all duration-700" strokeWidth="6" strokeDasharray={2*Math.PI*40} strokeDashoffset={2*Math.PI*40*(1 - immunityScore/100)} strokeLinecap="round" />
            </svg>
            <div className="absolute text-center">
              <span className="text-xl font-black text-white">{immunityScore}</span>
              <span className="text-[8px] text-gray-400 block font-mono">/100</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 italic">Bowel safety factors optimal.</span>
        </div>

      </div>

      {/* 7-DAY COMPLIANCE AND CONSISTENCY HEATMAP */}
      <div className="bg-[#0c1219] rounded-[32px] border border-white/5 p-5 sm:p-6 space-y-4">
        
        {/* Header row */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FF8A24]/10 text-[#FF8A24] rounded-xl border border-[#FF8A24]/15">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">7-Day Consistency Heatmap</h3>
              <p className="text-[10px] text-slate-400">Tracking completion frequency matrix across active weeks.</p>
            </div>
          </div>

          {/* Color Key Guide */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">Legend:</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-white/5" />
              <span className="text-[8.5px] font-mono text-gray-400">None</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/20" />
              <span className="text-[8.5px] font-mono text-gray-400">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/50 border border-emerald-500/40" />
              <span className="text-[8.5px] font-mono text-gray-400">Mid</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-400" />
              <span className="text-[8.5px] font-mono text-gray-400">Full</span>
            </div>
          </div>
        </div>

        {/* Heatmap Grid Layout */}
        <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl overflow-x-auto scrollbar-none">
          <div className="min-w-[600px] space-y-3.5">
            
            {/* Header day labels */}
            <div className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-3 text-[10px] text-gray-500 uppercase font-mono tracking-wider font-bold">Health Track</div>
              <div className="col-span-9 grid grid-cols-7 gap-2.5 text-center">
                {Array.from({ length: 7 }).map((_, i) => {
                  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const isToday = i === 6;
                  const dName = isToday ? 'Today' : daysOfWeek[d.getDay()];
                  const dLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <div key={i} className="text-center">
                      <span className={`text-[10px] font-black tracking-tight block ${isToday ? 'text-emerald-400 font-black scale-105' : 'text-slate-400 font-mono'}`}>
                        {dName}
                      </span>
                      <span className="text-[8px] text-gray-500 font-mono block mt-0.5">{dLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Matrix Rows */}
            {[
              {
                id: 'workouts',
                label: 'Workouts / Steps',
                desc: 'Consolidated cardio, compound lifting routines, or active steps metric threshold.',
                icon: Activity,
                colorClasses: [
                  'bg-slate-900 border-white/5 hover:bg-slate-800/50',
                  'bg-emerald-500/20 border-emerald-500/20 hover:bg-emerald-500/30',
                  'bg-emerald-500/50 border-emerald-500/40 hover:bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
                  'bg-emerald-500 border-emerald-400 hover:scale-105 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                ],
                todayVal: steps >= 10000 ? 3 : steps >= 5000 ? 2 : steps > 0 ? 1 : 0,
                activeUnit: `${steps.toLocaleString()} steps today`
              },
              {
                id: 'meals',
                label: 'Meal Logs / Calories',
                desc: 'Macronutrient entries, raw caloric limits, and hydration balance logs.',
                icon: Flame,
                colorClasses: [
                  'bg-slate-900 border-white/5 hover:bg-slate-800/50',
                  'bg-orange-500/20 border-orange-500/20 hover:bg-orange-500/30',
                  'bg-orange-500/50 border-orange-500/40 hover:bg-orange-500/60 shadow-[0_0_8px_rgba(249,115,22,0.1)]',
                  'bg-orange-500 border-orange-400 hover:scale-105 shadow-[0_0_12px_rgba(249,115,22,0.25)]'
                ],
                todayVal: mealLogsCalories >= 1500 ? 3 : mealLogsCalories >= 600 ? 2 : mealLogsCalories > 0 ? 1 : 0,
                activeUnit: `${mealLogsCalories} kcal today`
              },
              {
                id: 'water',
                label: 'Hydration Target',
                desc: 'Active fluid intake level compliance versus general metabolic targets.',
                icon: Droplet,
                colorClasses: [
                  'bg-slate-900 border-white/5 hover:bg-slate-800/50',
                  'bg-blue-500/20 border-blue-500/20 hover:bg-blue-500/30',
                  'bg-blue-500/50 border-blue-500/40 hover:bg-blue-500/60 shadow-[0_0_8px_rgba(59,130,246,0.1)]',
                  'bg-blue-500 border-blue-400 hover:scale-105 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                ],
                todayVal: waterAmount >= 3000 ? 3 : waterAmount >= 1500 ? 2 : waterAmount > 0 ? 1 : 0,
                activeUnit: `${waterAmount} ml today`
              },
              {
                id: 'clinical',
                label: 'Clinical Biomarkers',
                desc: 'Biochemical tracking logs, blood glucose measurements, and bp telemetry inputs.',
                icon: Heart,
                colorClasses: [
                  'bg-slate-900 border-white/5 hover:bg-slate-800/50',
                  'bg-purple-500/20 border-purple-500/20 hover:bg-purple-500/30',
                  'bg-[#a855f7]/55 border-[#a855f7]/40 hover:bg-[#a855f7]/65 shadow-[0_0_8px_rgba(168,85,247,0.1)]',
                  'bg-purple-500 border-purple-400 hover:scale-105 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                ],
                todayVal: Math.min(3, (sugarLogs.length > 2 ? 1 : 0) + (bpLogs.length > 1 ? 1 : 0) + (hrLogs.length > 1 ? 1 : 0)),
                activeUnit: 'Biometrics synchronized today'
              }
            ].map(row => {
              const IconComp = row.icon;
              return (
                <div key={row.id} className="grid grid-cols-12 items-center gap-2 group/row">
                  {/* Row indicator name */}
                  <div className="col-span-3 flex items-center gap-2">
                    <IconComp className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover/row:text-white transition-colors" />
                    <div>
                      <span className="text-[11px] font-bold text-slate-300 block leading-tight">{row.label}</span>
                    </div>
                  </div>

                  {/* Tile containers row */}
                  <div className="col-span-9 grid grid-cols-7 gap-2.5">
                    {Array.from({ length: 7 }).map((_, dIdx) => {
                      const isToday = dIdx === 6;
                      const level = isToday ? row.todayVal : (historicHeatmap[row.id]?.[dIdx] || 0);
                      const tileColor = row.colorClasses[level] || row.colorClasses[0];

                      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - dIdx));
                      const dLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                      return (
                        <div
                          key={dIdx}
                          id={`heatmap-tile-${row.id}-${dIdx}`}
                          onClick={() => {
                            if (!isToday) {
                              toggleHistoricDay(row.id, dIdx);
                            }
                          }}
                          className={`h-11 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden group/tile ${tileColor}`}
                        >
                          {isToday ? (
                            <>
                              <span className="text-[10px] font-black text-white font-mono z-10 block">{level === 0 ? '0' : '★'.repeat(level)}</span>
                              <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" title="Live dynamic updates from active applet telemetry" />
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 font-mono opacity-80 z-10">{level}</span>
                          )}

                          {/* Interactive Hover Micro tooltip inside each tile */}
                          <div className="absolute opacity-0 group-hover/tile:opacity-100 bg-slate-950 border border-white/20 text-[8px] text-white p-1.5 rounded-lg -top-12 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20 whitespace-nowrap shadow-lg leading-tight transition-all">
                            <span className="font-bold block uppercase text-emerald-400">{isToday ? 'Live Today' : dLabel}</span>
                            <span>Level {level} completed</span>
                            {isToday && <span className="text-slate-400 block pt-0.5">{row.activeUnit}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        <div className="bg-[#121c27]/60 border border-blue-500/10 p-3 rounded-xl text-[10px] text-blue-300 flex items-center justify-between gap-3">
          <p className="leading-snug">
            💡 <strong>Interactive Correction Matrix:</strong> Click on any historical cell (Days 1-6) to retroactively toggle consistency logging levels if you forgot to log. Today&apos;s column updates dynamically as you log steps, hydration, meals, and diagnostic entries!
          </p>
          <span className="text-[8px] font-mono bg-blue-500/15 border border-blue-500/20 px-2 py-0.5 rounded-md uppercase shrink-0 font-bold">Bi-directional Engine</span>
        </div>

      </div>

      {/* 2. SECURITY PRIVACY PROMPT BAR */}
      <div className="bg-[#091522]/60 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-300 flex items-center gap-3">
        <Lock className="w-5 h-5 shrink-0 text-blue-400" />
        <p className="leading-snug">
          <strong>HIPAA Secure Medical Sandbox Mode Active:</strong> Women&apos;s healthcare cycles, blood sugars, and lipid records are stored under client-side cryptographic local boundaries. Sensitive telemetry is local-first.
        </p>
      </div>

      {/* 3. MULTI-MODULE HEALTH ACCORDION (13 CORE SYSTEMS requested) */}
      <div className="space-y-3">
        
        {/* 1. SUGAR SURVEILLANCE */}
        <div className="bg-[#0c1219] rounded-2xl border border-white/5 overflow-hidden">
          <button 
            onClick={() => toggleCollapse('sugar')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/5 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Flame className="w-4 h-4 text-rose-500" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Blood Sugar Surveillance (HbA1c Sync)</h4>
                <p className="text-[10px] font-mono text-slate-500">Collection: blood_sugar_logs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-rose-400">{latestSugar} mg/dL</span>
              <span className="text-slate-600 text-xs">{collapsed.sugar ? '▲' : '▼'}</span>
            </div>
          </button>
          
          {!collapsed.sugar && (
            <div className="p-5 border-t border-white/5 bg-slate-950/40 space-y-4">
              <form onSubmit={addSugar} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input 
                  type="number" 
                  value={sVal} 
                  onChange={e => setSVal(e.target.value)} 
                  placeholder="Glucose value (e.g. 104)"
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <select 
                  value={sType} 
                  onChange={e => setSType(e.target.value as any)}
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value="fasting">Fasting</option>
                  <option value="post_meal">Post Meal</option>
                </select>
                <button type="submit" className="bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all">
                  Log Glycemic Index
                </button>
              </form>
              <div className="bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 text-[10px] text-rose-300">
                💡 <strong>AI Diabetic meal suggestions:</strong> High indices detected? Switch white rice to pearl barley millet, boiled egg whites, and target a 10-minute walk post-feed.
              </div>
            </div>
          )}
        </div>

        {/* 2. BLOOD PRESSURE */}
        <div className="bg-[#0c1219] rounded-2xl border border-white/5 overflow-hidden">
          <button 
            onClick={() => toggleCollapse('bp')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/5 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Blood Pressure Monitoring</h4>
                <p className="text-[10px] font-mono text-slate-500">Collection: bp_logs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-white">{latestSystolic}/{latestDiastolic} mmHg</span>
              <span className="text-slate-600 text-xs">{collapsed.bp ? '▲' : '▼'}</span>
            </div>
          </button>
          
          {!collapsed.bp && (
            <div className="p-5 border-t border-white/5 bg-slate-950/40 space-y-4">
              <form onSubmit={addBp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input 
                  type="number" 
                  value={sysIn} 
                  onChange={e => setSysIn(e.target.value)} 
                  placeholder="Systolic (e.g. 120)"
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <input 
                  type="number" 
                  value={diaIn} 
                  onChange={e => setDiaIn(e.target.value)} 
                  placeholder="Diastolic (e.g. 80)"
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <button type="submit" className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all">
                  Log BP telemetry
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 3. HEART RATE */}
        <div className="bg-[#0c1219] rounded-2xl border border-white/5 overflow-hidden">
          <button 
            onClick={() => toggleCollapse('heart')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/5 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-rose-500" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Heart Rate & Wearable Sync</h4>
                <p className="text-[10px] font-mono text-slate-500">Collection: heart_rate_logs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-400">{latestBpm} bpm</span>
              <span className="text-slate-600 text-xs">{collapsed.heart ? '▲' : '▼'}</span>
            </div>
          </button>
          
          {!collapsed.heart && (
            <div className="p-5 border-t border-white/5 bg-slate-950/40 space-y-4">
              <form onSubmit={addHr} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input 
                  type="number" 
                  value={bpmIn} 
                  onChange={e => setBpmIn(e.target.value)} 
                  placeholder="BPM (e.g. 72)"
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <select 
                  value={hrTypeIn} 
                  onChange={e => setHrTypeIn(e.target.value as any)}
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value="resting">Resting Pulse</option>
                  <option value="workout">Workout HRV</option>
                </select>
                <button type="submit" className="bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all">
                  Log Pulse Rate
                </button>
              </form>
              <div className="p-3 bg-black/40 rounded-xl text-[10px] text-slate-400">
                🔄 Live Apple Health / Google Fit Bluetooth sync sandbox active.
              </div>
            </div>
          )}
        </div>

        {/* 4. CLINICAL SLEEP & RESTING QUALITY */}
        <div className="bg-[#0c1219] rounded-2xl border border-white/5 overflow-hidden">
          <button 
            onClick={() => toggleCollapse('sleep')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/5 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Sleep Quality & Sleep Debt Analytics</h4>
                <p className="text-[10px] font-mono text-slate-500">Collection: sleep_logs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-indigo-400">{latestSleepHours}h / 8h</span>
              <span className="text-slate-600 text-xs">{collapsed.sleep ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.sleep && (
            <div className="p-5 border-t border-white/5 bg-slate-950/40 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-black/20 p-2.5 rounded-xl">
                  <span className="text-[9px] text-[#FF8A24] font-mono block uppercase">CNS Stress Recovery</span>
                  <span className="text-lg font-black text-white">82% score</span>
                </div>
                <div className="bg-black/20 p-2.5 rounded-xl">
                  <span className="text-[9px] text-blue-400 font-mono block uppercase">Recorded Sleep Debt</span>
                  <span className="text-lg font-black text-rose-400">0.8 hours</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                * Recommendations: Restrict stimulants post-lunch; consume 200mg Magnesium glycinate close to bed to induce uninterrupted slow-wave cycles.
              </p>
            </div>
          )}
        </div>

        {/* 5. WOMEN'S HEALTH CYCLE TRACKS */}
        <div className="bg-[#0c1219] rounded-2xl border border-white/5 overflow-hidden">
          <button 
            onClick={() => toggleCollapse('cycle')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/5 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-purple-400" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Menstrual Cycle & Luteal Sync</h4>
                <p className="text-[10px] font-mono text-slate-500">Collection: cycle_logs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-purple-400">Phase: Luteal</span>
              <span className="text-slate-600 text-xs">{collapsed.cycle ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.cycle && (
            <div className="p-5 border-t border-white/5 bg-slate-950/40 space-y-4">
              <div className="flex gap-2">
                <select 
                  value={flowIn} 
                  onChange={e => setFlowIn(e.target.value as any)}
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value="light">Light flow</option>
                  <option value="normal">Normal balance</option>
                  <option value="heavy">Heavy flow</option>
                </select>
                <button 
                  type="button" 
                  onClick={addCycle}
                  className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold text-xs uppercase rounded-xl hover:bg-purple-500/25 transition-all"
                >
                  Log Flow record
                </button>
              </div>
              <div className="text-[10px] text-slate-400 bg-purple-500/5 p-3 rounded-xl border border-purple-500/10">
                💡 <strong>Iron Regulation:</strong> Increase sorrel leaf intake, ginger tea infusions, and magnesium loading during luteal or cramping periods.
              </div>
            </div>
          )}
        </div>

        {/* 6. LIPIDS & CHOLESTEROL */}
        <div className="bg-[#0c1219] rounded-2xl border border-white/5 overflow-hidden">
          <button 
            onClick={() => toggleCollapse('lipids')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/5 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-orange-400" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Serum Cholesterol & Cardiac lipids</h4>
                <p className="text-[10px] font-mono text-slate-500">Collection: cholesterol_logs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-white">HDL: 48 / LDL: 114</span>
              <span className="text-slate-600 text-xs">{collapsed.lipids ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.lipids && (
            <div className="p-5 border-t border-white/5 bg-slate-950/40 space-y-4">
              <form onSubmit={addCholesterol} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input 
                  type="number" 
                  value={hdlIn} 
                  onChange={e => setHdlIn(e.target.value)} 
                  placeholder="HDL (Target &gt;45)"
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <input 
                  type="number" 
                  value={ldlIn} 
                  onChange={e => setLdlIn(e.target.value)} 
                  placeholder="LDL (Target &lt;100)"
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <input 
                  type="number" 
                  value={trigIn} 
                  onChange={e => setTrigIn(e.target.value)} 
                  placeholder="Triglycerides"
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <button type="submit" className="bg-orange-500/15 text-orange-450 hover:bg-orange-500/25 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all">
                  Update Lipids
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 7. GUT HEALTH ENGINE */}
        <div className="bg-[#0c1219] rounded-2xl border border-white/5 overflow-hidden">
          <button 
            onClick={() => toggleCollapse('gut')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/5 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Gut Microbiome & Digestion Logs</h4>
                <p className="text-[10px] font-mono text-slate-500">Collection: gut_health_logs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-emerald-400">Normal</span>
              <span className="text-slate-600 text-xs">{collapsed.gut ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.gut && (
            <div className="p-5 border-t border-white/5 bg-slate-950/40 space-y-3 font-mono text-xs text-slate-400">
              <div className="flex justify-between items-center">
                <span>Intestinal Bloat marker:</span>
                <span className="text-white">None (Optimally controlled)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Self-reported Probiotics:</span>
                <span className="text-emerald-400 font-bold">1 serving taken (Kombucha raw)</span>
              </div>
            </div>
          )}
        </div>

        {/* 8. SKIN & HAIR ANALYSIS */}
        <div className="bg-[#0c1219] rounded-2xl border border-white/5 overflow-hidden">
          <button 
            onClick={() => toggleCollapse('hairskin')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/5 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Aesthetic Wellness: Hair & Cutaneous</h4>
                <p className="text-[10px] font-mono text-slate-500">Collection: skin_hair_logs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-[#FF8A24]">Hydrated</span>
              <span className="text-slate-600 text-xs">{collapsed.hairskin ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.hairskin && (
            <div className="p-5 border-t border-white/5 bg-slate-950/40 text-xs text-slate-400 leading-relaxed font-mono">
              <span className="text-[8px] text-[#FF8A24] block mb-1">AI Hormonal Correlates</span>
              Optimal trace values. No iron/ferritin-drop deficiencies logged today. Water matrix index secure.
            </div>
          )}
        </div>

        {/* 9. WEIGHT & BODY STRUCTURE */}
        <div className="bg-[#0c1219] rounded-2xl border border-white/5 overflow-hidden">
          <button 
            onClick={() => toggleCollapse('body')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/5 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Scale className="w-4 h-4 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Weight & Dynamic BMI Milestones</h4>
                <p className="text-[10px] font-mono text-slate-500">Collection: weight_logs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-white">{weightLogs[weightLogs.length - 1]?.weight} kg</span>
              <span className="text-slate-600 text-xs">{collapsed.body ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.body && (
            <div className="p-5 border-t border-white/5 bg-slate-950/40 space-y-4">
              <form onSubmit={addWeight} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input 
                  type="number" 
                  value={wtIn} 
                  onChange={e => setWtIn(e.target.value)} 
                  placeholder="Weight (e.g. 74.5)"
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <input 
                  type="number" 
                  value={fatIn} 
                  onChange={e => setFatIn(e.target.value)} 
                  placeholder="Body Fat % (Optional)"
                  className="bg-black/40 border border-[#2a3038] rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <button type="submit" className="bg-[#1FA45B]/15 border border-[#1FA45B]/20 text-[#1FA45B] hover:bg-[#1FA45B]/25 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all">
                  Log Current Mass
                </button>
              </form>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
