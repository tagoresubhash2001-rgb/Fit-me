import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Droplet,
  Heart,
  Activity,
  ShieldAlert,
  Sparkles,
  Scale,
  AlertCircle,
  TrendingUp,
  Compass,
  Calendar,
  CheckSquare,
  Plus,
  Minus,
  UserCheck,
  Moon,
  Zap,
  ShieldCheck,
  Thermometer,
  Smile,
  Eye,
  ArrowUpRight,
  Award,
  Clock,
  RefreshCw,
  Layers,
  Lock,
  Shield,
  Settings,
  Info,
} from 'lucide-react';
import {
  UserProfile,
  BloodSugarLog,
  BpLog,
  HeartRateLog,
  StressLog,
  SleepLog,
  CycleLog,
  BodyMeasurements,
  WorkoutLog,
  MoodLog,
  HydrationLog,
  CholesterolLog,
  GutHealthLog,
  SkinHairLog,
  WeightLog,
} from '../types';
import { useTrackingStore } from '../stores/tracking.store';
import { useWorkoutStore } from '../stores/workout.store';

interface TrackingsProps {
  profile: UserProfile;
  waterAmount: number;
  incrementWater: (amount: number) => void;
  mealLogsCalories: number;
}

export default function Trackings({ profile, waterAmount, incrementWater, mealLogsCalories }: TrackingsProps) {
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
    updateMeasurements,
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
      clinical: [1, 2, 0, 1, 2, 1],
    };
  });

  useEffect(() => {
    localStorage.setItem('fit_me_heatmap_days_v1', JSON.stringify(historicHeatmap));
  }, [historicHeatmap]);

  const toggleHistoricDay = (category: string, index: number) => {
    setHistoricHeatmap((prev) => {
      const arr = [...prev[category]];
      arr[index] = (arr[index] + 1) % 4; // rotate level 0-3
      return { ...prev, [category]: arr };
    });
  };

  const [gutLogs, setGutLogs] = useState<GutHealthLog[]>(() => {
    const saved = localStorage.getItem('fit_me_gut_health_logs');
    return saved
      ? JSON.parse(saved)
      : [{ id: '1', digestionLevel: 'normal', isBowelConsistent: true, probioticTaken: true, timestamp: '11:00 AM' }];
  });

  const [skinHairLogs, setSkinHairLogs] = useState<SkinHairLog[]>(() => {
    const saved = localStorage.getItem('fit_me_skin_hair_logs');
    return saved
      ? JSON.parse(saved)
      : [{ id: '1', acneLevel: 'none', isDrySkin: false, hairFallLevel: 'normal', observedDeficiencies: [], timestamp: 'Morning' }];
  });

  const [moodLogs, setMoodLogs] = useState<MoodLog[]>(() => {
    const saved = localStorage.getItem('fit_me_mood_logs');
    return saved ? JSON.parse(saved) : [{ id: '1', state: 'energetic', correlationNotes: 'Felt fresh', timestamp: '10:00 AM' }];
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
    body: true,
  });

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
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
  const healthScore = Math.min(
    100,
    Math.max(
      30,
      80 +
        (waterAmount >= 2500 ? 5 : -4) +
        (latestSleepHours >= 7 && latestSleepHours <= 8.5 ? 5 : -5) +
        (latestSugar < 120 ? 5 : -10) +
        (latestSystolic < 130 ? 5 : -8) +
        (latestStress === 'calm' ? 5 : latestStress === 'high' ? -12 : -3),
    ),
  );

  // Recovery Score based on HR variance simulation, sleep, water
  const recoveryScore = Math.min(
    100,
    Math.max(
      25,
      87 -
        (latestStress === 'high' ? 15 : latestStress === 'elevated' ? 8 : 0) -
        (8 - Math.min(8, latestSleepHours)) * 8 +
        (waterAmount >= 3000 ? 5 : 0) -
        (latestBpm > 85 ? 10 : 0),
    ),
  );

  // Immunity score
  const immunityScore = Math.min(
    100,
    Math.max(30, 78 + (latestSleepHours >= 7.5 ? 6 : -4) + (waterAmount >= 2500 ? 6 : -3) + (latestGutDigestion === 'excellent' ? 5 : 0)),
  );

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
      glucoseValue: Number(sVal),
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
      diastolic: Number(diaIn),
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
      bpm: Number(bpmIn),
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
      bodyFatPercentage: fatIn ? Number(fatIn) : undefined,
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
      energyLevel: 8,
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
      triglycerides: Number(trigIn) || 120,
    });
    setHdlIn('');
    setLdlIn('');
    setTrigIn('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Top Header Row of Analytics */}
      <div>
        <span className="text-caption text-accent font-semibold block">Overview</span>
        <h2 className="text-display font-semibold text-ink mt-1">Your health</h2>
      </div>

      {/* 1. HEALTH SCORE & RECOVERY SCORE GAUGES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Radial Health Score card */}
        <div className="bg-canvas p-5 border border-line rounded-2xl flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <span className="text-caption text-primary block">Health</span>
            <span className="text-caption font-semibold text-ink">Wellness score</span>
          </div>
          <div className="my-4 relative flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90">
              <circle cx="48" cy="48" r="40" className="stroke-track fill-none" strokeWidth="6" />
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-primary fill-none transition-all duration-700"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - healthScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-title font-semibold text-ink">{healthScore}</span>
              <span className="text-caption text-muted block">/100</span>
            </div>
          </div>
          <span className="text-caption text-muted italic">Target: Keep fasting metabolic values uniform.</span>
        </div>

        {/* Radial Recovery Score card */}
        <div className="bg-canvas p-5 border border-line rounded-2xl flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <span className="text-caption text-primary block">Recovery</span>
            <span className="text-caption font-semibold text-ink">Recovery score</span>
          </div>
          <div className="my-4 relative flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90">
              <circle cx="48" cy="48" r="40" className="stroke-track fill-none" strokeWidth="6" />
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-primary fill-none transition-all duration-700"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - recoveryScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-title font-semibold text-ink">{recoveryScore}</span>
              <span className="text-caption text-muted block">/100</span>
            </div>
          </div>
          <span className="text-caption text-muted italic">Sleep debt {latestSleepHours < 7 ? 'detected' : 'neutralized'}.</span>
        </div>

        {/* Radial Immunity score card */}
        <div className="bg-canvas p-5 border border-line rounded-2xl flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <span className="text-caption text-water block">Habits</span>
            <span className="text-caption font-semibold text-ink">Healthy habits score</span>
          </div>
          <div className="my-4 relative flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90">
              <circle cx="48" cy="48" r="40" className="stroke-track fill-none" strokeWidth="6" />
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-water fill-none transition-all duration-700"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - immunityScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-title font-semibold text-ink">{immunityScore}</span>
              <span className="text-caption text-muted block">/100</span>
            </div>
          </div>
          <span className="text-caption text-muted italic">Bowel safety factors optimal.</span>
        </div>
      </div>

      {/* 7-DAY COMPLIANCE AND CONSISTENCY HEATMAP */}
      <div className="bg-surface rounded-card border border-line p-5 sm:p-6 space-y-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent-subtle text-accent rounded-xl border border-accent-fill/40">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-small font-semibold text-ink">7-Day Consistency Heatmap</h3>
              <p className="text-caption text-muted">How often you logged each area this week.</p>
            </div>
          </div>

          {/* Color Key Guide */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-caption text-muted">Legend:</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-surface border border-line" />
              <span className="text-caption text-muted">None</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-primary-subtle border border-primary/30" />
              <span className="text-caption text-muted">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-primary-subtle border border-primary/30" />
              <span className="text-caption text-muted">Mid</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-primary border border-primary" />
              <span className="text-caption text-muted">Full</span>
            </div>
          </div>
        </div>

        {/* Heatmap Grid Layout */}
        <div className="p-4 bg-raised border border-line rounded-2xl overflow-x-auto scrollbar-none">
          <div className="min-w-[600px] space-y-3.5">
            {/* Header day labels */}
            <div className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-3 text-caption text-muted font-semibold">Health Track</div>
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
                      <span
                        className={`text-caption font-semibold  block ${isToday ? 'text-primary font-semibold scale-105' : 'text-muted '}`}
                      >
                        {dName}
                      </span>
                      <span className="text-caption text-muted block mt-0.5">{dLabel}</span>
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
                  'bg-surface border-line hover:bg-raised',
                  'bg-primary-subtle border-primary/30 hover:bg-primary-subtle',
                  'bg-primary-subtle border-primary/30 hover:bg-primary-subtle shadow-card',
                  'bg-primary border-primary hover:scale-105 shadow-card',
                ],
                todayVal: steps >= 10000 ? 3 : steps >= 5000 ? 2 : steps > 0 ? 1 : 0,
                activeUnit: `${steps.toLocaleString()} steps today`,
              },
              {
                id: 'meals',
                label: 'Meal Logs / Calories',
                desc: 'Macronutrient entries, raw caloric limits, and hydration balance logs.',
                icon: Flame,
                colorClasses: [
                  'bg-surface border-line hover:bg-raised',
                  'bg-accent-subtle border-accent-fill/40 hover:bg-accent-subtle',
                  'bg-accent-subtle border-accent-fill/40 hover:bg-accent-subtle shadow-card',
                  'bg-accent-fill border-accent-fill/40 hover:scale-105 shadow-card',
                ],
                todayVal: mealLogsCalories >= 1500 ? 3 : mealLogsCalories >= 600 ? 2 : mealLogsCalories > 0 ? 1 : 0,
                activeUnit: `${mealLogsCalories} kcal today`,
              },
              {
                id: 'water',
                label: 'Hydration Target',
                desc: 'Active fluid intake level compliance versus general metabolic targets.',
                icon: Droplet,
                colorClasses: [
                  'bg-surface border-line hover:bg-raised',
                  'bg-raised border-line hover:bg-raised',
                  'bg-raised border-line hover:bg-raised shadow-card',
                  'bg-water border-line hover:scale-105 shadow-card',
                ],
                todayVal: waterAmount >= 3000 ? 3 : waterAmount >= 1500 ? 2 : waterAmount > 0 ? 1 : 0,
                activeUnit: `${waterAmount} ml today`,
              },
              {
                id: 'clinical',
                label: 'Health logs',
                desc: 'Blood sugar and blood pressure entries inputs.',
                icon: Heart,
                colorClasses: [
                  'bg-surface border-line hover:bg-raised',
                  'bg-raised border-line hover:bg-raised',
                  'bg-sleep border-line hover:bg-sleep shadow-card',
                  'bg-primary border-line hover:scale-105 shadow-card',
                ],
                todayVal: Math.min(3, (sugarLogs.length > 2 ? 1 : 0) + (bpLogs.length > 1 ? 1 : 0) + (hrLogs.length > 1 ? 1 : 0)),
                activeUnit: 'Biometrics synchronized today',
              },
            ].map((row) => {
              const IconComp = row.icon;
              return (
                <div key={row.id} className="grid grid-cols-12 items-center gap-2 group/row">
                  {/* Row indicator name */}
                  <div className="col-span-3 flex items-center gap-2">
                    <IconComp className="w-3.5 h-3.5 text-muted shrink-0 group-hover/row:text-ink transition-colors" />
                    <div>
                      <span className="text-caption font-semibold text-ink block leading-tight">{row.label}</span>
                    </div>
                  </div>

                  {/* Tile containers row */}
                  <div className="col-span-9 grid grid-cols-7 gap-2.5">
                    {Array.from({ length: 7 }).map((_, dIdx) => {
                      const isToday = dIdx === 6;
                      const level = isToday ? row.todayVal : historicHeatmap[row.id]?.[dIdx] || 0;
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
                              <span className="text-caption font-semibold text-ink z-10 block">{level === 0 ? '0' : ''.repeat(level)}</span>
                              <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-water" title="Updates as you log" />
                            </>
                          ) : (
                            <span className="text-caption font-semibold text-muted opacity-80 z-10">{level}</span>
                          )}

                          {/* Interactive Hover Micro tooltip inside each tile */}
                          <div className="absolute opacity-0 group-hover/tile:opacity-100 bg-surface border border-line text-caption text-ink p-1.5 rounded-lg -top-12 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20 whitespace-nowrap shadow-card leading-tight transition-all">
                            <span className="font-semibold block text-primary">{isToday ? 'Live Today' : dLabel}</span>
                            <span>Level {level} completed</span>
                            {isToday && <span className="text-muted block pt-0.5">{row.activeUnit}</span>}
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

        <div className="bg-raised border border-line p-3 rounded-xl text-caption text-water flex items-center justify-between gap-3">
          <p className="leading-snug">
            <strong>Edit history:</strong> Click on any historical cell (Days 1-6) to retroactively toggle consistency logging levels if you
            forgot to log. Today&apos;s column updates dynamically as you log steps, hydration, meals, and diagnostic entries!
          </p>
          <span className="text-caption bg-raised border border-line px-2 py-0.5 rounded-md shrink-0 font-semibold">Editable</span>
        </div>
      </div>

      {/* 2. SECURITY PRIVACY PROMPT BAR */}
      <div className="bg-raised border border-line p-4 rounded-xl text-caption text-water flex items-center gap-3">
        <Lock className="w-5 h-5 shrink-0 text-water" />
        <p className="leading-snug">
          <strong>Your data is private.</strong> FIT ME AI is not a medical device and does not replace a doctor.
        </p>
      </div>

      {/* 3. MULTI-MODULE HEALTH ACCORDION (13 CORE SYSTEMS requested) */}
      <div className="space-y-3">
        {/* 1. SUGAR SURVEILLANCE */}
        <div className="bg-surface rounded-2xl border border-line overflow-hidden">
          <button
            onClick={() => toggleCollapse('sugar')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-raised cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Flame className="w-4 h-4 text-danger" />
              <div>
                <h4 className="text-small font-semibold text-ink">Blood sugar</h4>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-danger">{latestSugar} mg/dL</span>
              <span className="text-muted text-caption">{collapsed.sugar ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.sugar && (
            <div className="p-5 border-t border-line bg-raised space-y-4">
              <form onSubmit={addSugar} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  value={sVal}
                  onChange={(e) => setSVal(e.target.value)}
                  placeholder="Glucose value (e.g. 104)"
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                />
                <select
                  value={sType}
                  onChange={(e) => setSType(e.target.value as any)}
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                >
                  <option value="fasting">Fasting</option>
                  <option value="post_meal">Post Meal</option>
                </select>
                <button
                  type="submit"
                  className="bg-danger-subtle text-danger hover:bg-danger-subtle py-1.5 rounded-xl text-caption font-semibold transition-all"
                >
                  Log blood sugar
                </button>
              </form>
              <div className="bg-danger-subtle p-3 rounded-xl border border-danger/40 text-caption text-danger">
                <strong>AI Diabetic meal suggestions:</strong> High indices detected? Switch white rice to pearl barley millet, boiled egg
                whites, and target a 10-minute walk post-feed.
              </div>
            </div>
          )}
        </div>

        {/* 2. BLOOD PRESSURE */}
        <div className="bg-surface rounded-2xl border border-line overflow-hidden">
          <button
            onClick={() => toggleCollapse('bp')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-raised cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-primary" />
              <div>
                <h4 className="text-small font-semibold text-ink">Blood Pressure Monitoring</h4>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-ink">
                {latestSystolic}/{latestDiastolic} mmHg
              </span>
              <span className="text-muted text-caption">{collapsed.bp ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.bp && (
            <div className="p-5 border-t border-line bg-raised space-y-4">
              <form onSubmit={addBp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  value={sysIn}
                  onChange={(e) => setSysIn(e.target.value)}
                  placeholder="Systolic (e.g. 120)"
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                />
                <input
                  type="number"
                  value={diaIn}
                  onChange={(e) => setDiaIn(e.target.value)}
                  placeholder="Diastolic (e.g. 80)"
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                />
                <button
                  type="submit"
                  className="bg-primary-subtle text-primary hover:bg-primary-subtle py-1.5 rounded-xl text-caption font-semibold transition-all"
                >
                  Log blood pressure
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 3. HEART RATE */}
        <div className="bg-surface rounded-2xl border border-line overflow-hidden">
          <button
            onClick={() => toggleCollapse('heart')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-raised cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-danger" />
              <div>
                <h4 className="text-small font-semibold text-ink">Heart Rate & Wearable Sync</h4>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-muted">{latestBpm} bpm</span>
              <span className="text-muted text-caption">{collapsed.heart ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.heart && (
            <div className="p-5 border-t border-line bg-raised space-y-4">
              <form onSubmit={addHr} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  value={bpmIn}
                  onChange={(e) => setBpmIn(e.target.value)}
                  placeholder="BPM (e.g. 72)"
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                />
                <select
                  value={hrTypeIn}
                  onChange={(e) => setHrTypeIn(e.target.value as any)}
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                >
                  <option value="resting">Resting Pulse</option>
                  <option value="workout">Workout HRV</option>
                </select>
                <button
                  type="submit"
                  className="bg-danger-subtle text-danger hover:bg-danger-subtle py-1.5 rounded-xl text-caption font-semibold transition-all"
                >
                  Log Pulse Rate
                </button>
              </form>
              <div className="p-3 bg-raised rounded-xl text-caption text-muted">
                Connect Apple Health or Health Connect in a later update.
              </div>
            </div>
          )}
        </div>

        {/* 4. CLINICAL SLEEP & RESTING QUALITY */}
        <div className="bg-surface rounded-2xl border border-line overflow-hidden">
          <button
            onClick={() => toggleCollapse('sleep')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-raised cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-primary" />
              <div>
                <h4 className="text-small font-semibold text-ink">Sleep Quality & Sleep Debt Analytics</h4>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-primary">{latestSleepHours}h / 8h</span>
              <span className="text-muted text-caption">{collapsed.sleep ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.sleep && (
            <div className="p-5 border-t border-line bg-raised space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-raised p-2.5 rounded-xl">
                  <span className="text-caption text-accent block">CNS Stress Recovery</span>
                  <span className="text-title font-semibold text-ink">82% score</span>
                </div>
                <div className="bg-raised p-2.5 rounded-xl">
                  <span className="text-caption text-water block">Recorded Sleep Debt</span>
                  <span className="text-title font-semibold text-danger">0.8 hours</span>
                </div>
              </div>
              <p className="text-caption text-muted">
                * Recommendations: Restrict stimulants post-lunch; consume 200mg Magnesium glycinate close to bed to induce uninterrupted
                slow-wave cycles.
              </p>
            </div>
          )}
        </div>

        {/* 5. WOMEN'S HEALTH CYCLE TRACKS */}
        <div className="bg-surface rounded-2xl border border-line overflow-hidden">
          <button
            onClick={() => toggleCollapse('cycle')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-raised cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-sleep" />
              <div>
                <h4 className="text-small font-semibold text-ink">Menstrual Cycle & Luteal Sync</h4>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-sleep">Phase: Luteal</span>
              <span className="text-muted text-caption">{collapsed.cycle ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.cycle && (
            <div className="p-5 border-t border-line bg-raised space-y-4">
              <div className="flex gap-2">
                <select
                  value={flowIn}
                  onChange={(e) => setFlowIn(e.target.value as any)}
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                >
                  <option value="light">Light flow</option>
                  <option value="normal">Normal balance</option>
                  <option value="heavy">Heavy flow</option>
                </select>
                <button
                  type="button"
                  onClick={addCycle}
                  className="px-4 py-1.5 bg-raised border border-line text-sleep font-semibold text-caption rounded-xl hover:bg-raised transition-all"
                >
                  Log Flow record
                </button>
              </div>
              <div className="text-caption text-muted bg-raised p-3 rounded-xl border border-line">
                <strong>Iron Regulation:</strong> Increase sorrel leaf intake, ginger tea infusions, and magnesium loading during luteal or
                cramping periods.
              </div>
            </div>
          )}
        </div>

        {/* 6. LIPIDS & CHOLESTEROL */}
        <div className="bg-surface rounded-2xl border border-line overflow-hidden">
          <button
            onClick={() => toggleCollapse('lipids')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-raised cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-accent" />
              <div>
                <h4 className="text-small font-semibold text-ink">Serum Cholesterol & Cardiac lipids</h4>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-ink">HDL: 48 / LDL: 114</span>
              <span className="text-muted text-caption">{collapsed.lipids ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.lipids && (
            <div className="p-5 border-t border-line bg-raised space-y-4">
              <form onSubmit={addCholesterol} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="number"
                  value={hdlIn}
                  onChange={(e) => setHdlIn(e.target.value)}
                  placeholder="HDL (Target &gt;45)"
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                />
                <input
                  type="number"
                  value={ldlIn}
                  onChange={(e) => setLdlIn(e.target.value)}
                  placeholder="LDL (Target &lt;100)"
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                />
                <input
                  type="number"
                  value={trigIn}
                  onChange={(e) => setTrigIn(e.target.value)}
                  placeholder="Triglycerides"
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                />
                <button
                  type="submit"
                  className="bg-accent-subtle text-accent hover:bg-accent-subtle py-1.5 rounded-xl text-caption font-semibold transition-all"
                >
                  Update Lipids
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 7. GUT HEALTH ENGINE */}
        <div className="bg-surface rounded-2xl border border-line overflow-hidden">
          <button
            onClick={() => toggleCollapse('gut')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-raised cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-primary" />
              <div>
                <h4 className="text-small font-semibold text-ink">Gut Microbiome & Digestion Logs</h4>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-primary">Normal</span>
              <span className="text-muted text-caption">{collapsed.gut ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.gut && (
            <div className="p-5 border-t border-line bg-raised space-y-3 text-caption text-muted">
              <div className="flex justify-between items-center">
                <span>Intestinal Bloat marker:</span>
                <span className="text-ink">None (Optimally controlled)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Self-reported Probiotics:</span>
                <span className="text-primary font-semibold">1 serving taken (Kombucha raw)</span>
              </div>
            </div>
          )}
        </div>

        {/* 8. SKIN & HAIR ANALYSIS */}
        <div className="bg-surface rounded-2xl border border-line overflow-hidden">
          <button
            onClick={() => toggleCollapse('hairskin')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-raised cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-water" />
              <div>
                <h4 className="text-small font-semibold text-ink">Aesthetic Wellness: Hair & Cutaneous</h4>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-accent">Hydrated</span>
              <span className="text-muted text-caption">{collapsed.hairskin ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.hairskin && (
            <div className="p-5 border-t border-line bg-raised text-caption text-muted leading-relaxed">
              <span className="text-caption text-accent block mb-1">AI Hormonal Correlates</span>
              Optimal trace values. No iron/ferritin-drop deficiencies logged today.
            </div>
          )}
        </div>

        {/* 9. WEIGHT & BODY STRUCTURE */}
        <div className="bg-surface rounded-2xl border border-line overflow-hidden">
          <button
            onClick={() => toggleCollapse('body')}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-raised cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Scale className="w-4 h-4 text-primary" />
              <div>
                <h4 className="text-small font-semibold text-ink">Weight & Dynamic BMI Milestones</h4>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-ink">{weightLogs[weightLogs.length - 1]?.weight} kg</span>
              <span className="text-muted text-caption">{collapsed.body ? '▲' : '▼'}</span>
            </div>
          </button>

          {!collapsed.body && (
            <div className="p-5 border-t border-line bg-raised space-y-4">
              <form onSubmit={addWeight} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  value={wtIn}
                  onChange={(e) => setWtIn(e.target.value)}
                  placeholder="Weight (e.g. 74.5)"
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                />
                <input
                  type="number"
                  value={fatIn}
                  onChange={(e) => setFatIn(e.target.value)}
                  placeholder="Body Fat % (Optional)"
                  className="bg-raised border border-line rounded-xl px-3 py-1.5 text-caption text-ink"
                />
                <button
                  type="submit"
                  className="bg-primary-subtle border border-primary/30 text-primary hover:bg-primary-subtle py-1.5 rounded-xl text-caption font-semibold transition-all"
                >
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
