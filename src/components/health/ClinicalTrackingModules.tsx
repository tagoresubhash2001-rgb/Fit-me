import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Droplet, Heart, Activity, ShieldAlert, Sparkles, Scale, AlertCircle,
  TrendingUp, Compass, Calendar, CheckSquare, Plus, Minus, UserCheck, 
  Moon, Zap, ShieldCheck, Thermometer, Smile, Eye, ArrowUpRight, Award,
  Clock, RefreshCw, Layers
} from 'lucide-react';
import { 
  UserProfile, BloodSugarLog, BpLog, HeartRateLog, StressLog, SleepLog, 
  CycleLog, BodyMeasurements, WorkoutLog, MoodLog, CholesterolLog, 
  GutHealthLog, SkinHairLog, WeightLog 
} from '../../types';

interface ClinicalModulesProps {
  profile: UserProfile;
  waterAmount: number;
  incrementWater: (amount: number) => void;
  mealLogsCalories: number;
  onSelectTab?: (tab: string) => void;
}

export default function ClinicalTrackingModules({
  profile,
  waterAmount,
  incrementWater,
  mealLogsCalories,
  onSelectTab
}: ClinicalModulesProps) {
  // ----------------------------------------------------
  // PERSISTED LOG STATES (Maps directly to collection names requested)
  // ----------------------------------------------------
  const [sugarLogs, setSugarLogs] = useState<BloodSugarLog[]>(() => {
    const saved = localStorage.getItem('fit_me_blood_sugar_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'fasting', glucoseValue: 104, hbA1c: 5.8, timestamp: '08:00 AM', notes: 'Wakeup fasting' },
      { id: '2', type: 'post_meal', glucoseValue: 135, timestamp: '02:30 PM', notes: 'Post heavy millet lunch' }
    ];
  });

  const [bpLogs, setBpLogs] = useState<BpLog[]>(() => {
    const saved = localStorage.getItem('fit_me_bp_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', systolic: 122, diastolic: 82, pulse: 72, timestamp: '09:00 AM' }
    ];
  });

  const [hrLogs, setHrLogs] = useState<HeartRateLog[]>(() => {
    const saved = localStorage.getItem('fit_me_heart_rate_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'resting', bpm: 68, timestamp: '07:30 AM' },
      { id: '2', type: 'workout', bpm: 142, timestamp: '06:30 PM' }
    ];
  });

  const [stressLogs, setStressLogs] = useState<StressLog[]>(() => {
    const saved = localStorage.getItem('fit_me_stress_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', level: 'moderate', emotionalLoad: 5, burnoutRisk: false, timestamp: '12:00 PM' }
    ];
  });

  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>(() => {
    const saved = localStorage.getItem('fit_me_sleep_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', durationHours: 7.2, bedtimeConsistency: 85, recoveryQuality: 'good', sleepDebt: 0.8, sleepScore: 78, timestamp: '07:00 AM' }
    ];
  });

  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>(() => {
    const saved = localStorage.getItem('fit_me_cycle_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', cycleDate: '2026-05-18', isOvulation: false, symptoms: ['bloating'], pmsSeverity: 'mild', mood: 'tired', flowIntensity: 'normal', energyLevel: 6, timestamp: 'Morning' }
    ];
  });

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => {
    const saved = localStorage.getItem('fit_me_weight_logs_v2');
    return saved ? JSON.parse(saved) : [
      { id: '1', weight: profile.weight, date: 'May 25', bodyFatPercentage: 21.4, timestamp: '08:00 AM' }
    ];
  });

  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurements[]>(() => {
    const saved = localStorage.getItem('fit_me_body_measurements');
    return saved ? JSON.parse(saved) : [
      { id: '1', waist: 84, chest: 102, arms: 36, thighs: 54, muscleMass: 55.4, timestamp: '08:00 AM' }
    ];
  });

  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>(() => {
    const saved = localStorage.getItem('fit_me_workout_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'cardio', durationMinutes: 25, caloriesBurned: 220, intensity: 'moderate', recoveryScore: 82, timestamp: '06:30 AM' }
    ];
  });

  const [moodLogs, setMoodLogs] = useState<MoodLog[]>(() => {
    const saved = localStorage.getItem('fit_me_mood_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', state: 'energetic', correlationNotes: 'Felt fresh right after millet hydration tea', timestamp: '10:00 AM' }
    ];
  });

  const [cholesterolLogs, setCholesterolLogs] = useState<CholesterolLog[]>(() => {
    const saved = localStorage.getItem('fit_me_cholesterol_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', hdl: 48, ldl: 114, triglycerides: 140, timestamp: 'May 20' }
    ];
  });

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

  // Save all to local storage to mock active collections sync
  useEffect(() => {
    localStorage.setItem('fit_me_blood_sugar_logs', JSON.stringify(sugarLogs));
  }, [sugarLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_bp_logs', JSON.stringify(bpLogs));
  }, [bpLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_heart_rate_logs', JSON.stringify(hrLogs));
  }, [hrLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_stress_logs', JSON.stringify(stressLogs));
  }, [stressLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_sleep_logs', JSON.stringify(sleepLogs));
  }, [sleepLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_cycle_logs', JSON.stringify(cycleLogs));
  }, [cycleLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_weight_logs_v2', JSON.stringify(weightLogs));
  }, [weightLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_body_measurements', JSON.stringify(bodyMeasurements));
  }, [bodyMeasurements]);
  useEffect(() => {
    localStorage.setItem('fit_me_workout_logs', JSON.stringify(workoutLogs));
  }, [workoutLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_mood_logs', JSON.stringify(moodLogs));
  }, [moodLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_cholesterol_logs', JSON.stringify(cholesterolLogs));
  }, [cholesterolLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_gut_health_logs', JSON.stringify(gutLogs));
  }, [gutLogs]);
  useEffect(() => {
    localStorage.setItem('fit_me_skin_hair_logs', JSON.stringify(skinHairLogs));
  }, [skinHairLogs]);

  // ----------------------------------------------------
  // FORM & SIMULATOR STATES for metrics
  // ----------------------------------------------------
  const [newSugarVal, setNewSugarVal] = useState('');
  const [newSugarType, setNewSugarType] = useState<'fasting' | 'post_meal'>('fasting');
  const [newSugarHba1c, setNewSugarHba1c] = useState('');

  const [newSystolic, setNewSystolic] = useState('');
  const [newDiastolic, setNewDiastolic] = useState('');

  const [newHrBpm, setNewHrBpm] = useState('');
  const [newHrType, setNewHrType] = useState<'resting' | 'workout' | 'recovery'>('resting');

  const [newStressLevel, setNewStressLevel] = useState<'calm' | 'moderate' | 'elevated' | 'high'>('calm');
  const [newStressHours, setNewStressHours] = useState('3');

  const [newSleepDuration, setNewSleepDuration] = useState('');
  const [newSleepQuality, setNewSleepQuality] = useState<'poor' | 'fair' | 'good' | 'optimal'>('good');

  const [newWeightVal, setNewWeightVal] = useState('');
  const [newBodyFatVal, setNewBodyFatVal] = useState('');

  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingText, setBreathingText] = useState('Ready');
  const [breathingTimer, setBreathingTimer] = useState<NodeJS.Timeout | null>(null);

  const [newCycleDate, setNewCycleDate] = useState('2026-05-25');
  const [newCycleFlow, setNewCycleFlow] = useState<'light' | 'normal' | 'heavy'>('normal');
  const [newCyclePms, setNewCyclePms] = useState<'none' | 'mild' | 'severe'>('none');
  const [newCycleSymptoms, setNewCycleSymptoms] = useState<('cramps' | 'bloating' | 'headache' | 'fatigue')[]>([]);

  // ----------------------------------------------------
  // DAILY HEALTH SCORE & IMMUNITY CALCULATOR ENGINE
  // ----------------------------------------------------
  const latestSugar = sugarLogs[sugarLogs.length - 1]?.glucoseValue || 100;
  const latestSystolic = bpLogs[bpLogs.length - 1]?.systolic || 120;
  const latestDiastolic = bpLogs[bpLogs.length - 1]?.diastolic || 80;
  const latestSleepHours = sleepLogs[sleepLogs.length - 1]?.durationHours || 7.5;
  const latestStressLevel = stressLogs[stressLogs.length - 1]?.level || 'calm';
  const latestProbiotic = gutLogs[gutLogs.length - 1]?.probioticTaken ?? true;

  // Calculate Health Score dynamically (0-100)
  const calculateDailyHealthScore = () => {
    let base = 75; // Baseline healthy score
    
    // 1. Food Quality factor from meals logged (we can review mealLogCalories)
    if (mealLogsCalories > 1400 && mealLogsCalories < 2200) base += 8;
    else if (mealLogsCalories > 2200) base -= 5;
    
    // 2. Hydration satisfaction points
    if (waterAmount >= 3000) base += 6;
    else if (waterAmount >= 2000) base += 3;
    else base -= 4;

    // 3. Sleep check
    if (latestSleepHours >= 7 && latestSleepHours <= 9) base += 5;
    else base -= 5;

    // 4. Clinical Sugar limits
    if (latestSugar > 125) base -= 8; // Borderline high fasting
    if (latestSugar < 70) base -= 5;

    // 5. BP satisfaction
    if (latestSystolic > 130 || latestDiastolic > 85) base -= 6;

    // 6. Stress limits
    if (latestStressLevel === 'high') base -= 10;
    else if (latestStressLevel === 'elevated') base -= 5;
    else base += 3;

    // 7. Probiotic gut health
    if (latestProbiotic) base += 3;

    return Math.min(100, Math.max(20, base));
  };

  const healthScore = calculateDailyHealthScore();

  // Calculate Immunity score based on sleep, stress, activity, bowel & vitamins
  const calculateImmunityScore = () => {
    let base = 70;
    if (latestSleepHours >= 7.5) base += 8;
    if (waterAmount >= 2500) base += 6;
    if (latestStressLevel === 'calm') base += 8;
    if (latestProbiotic) base += 5;
    if (workoutLogs.length > 0) base += 5;
    return Math.min(100, base);
  };
  const immunityScore = calculateImmunityScore();

  // ----------------------------------------------------
  // CORRELATION RECOMMENDATIONS FOR AI INSIGHTS
  // ----------------------------------------------------
  const getPersonalizedInsights = () => {
    const list = [];
    if (latestSugar > 120) {
      list.push({
        title: 'Sugar Spikes Warning',
        desc: 'Your recent post-meal indicator suggests high glucose load limit. We suggest switching polished ragi or grain to anti-diabetic millets and walking immediately.',
        type: 'danger'
      });
    }
    if (latestSystolic > 125 || latestDiastolic > 82) {
      list.push({
        title: 'BP Regulation Alert',
        desc: 'Your blood pressure reads slightly high. Limit sodium food portions, consume magnesium-heavy bananas or raw buttermilk infusions to open tension barriers.',
        type: 'warning'
      });
    }
    if (latestSleepHours < 6.5) {
      list.push({
        title: 'Active Sleep Deficiency',
        desc: 'Sleep duration falls below recovery parameters today. Take a 3pm caffeine cutoff target and try Ashwagandha roots at bedtime to aid deep stage cycle.',
        type: 'warning'
      });
    }
    if (latestStressLevel === 'high' || latestStressLevel === 'elevated') {
      list.push({
        title: 'Stress Induced Burnout risk',
        desc: 'Stress levels are elevated today under shifts. Avoid high workouts; practice 5 minutes of mindful box breathing below and keep hydration saturated.',
        type: 'info'
      });
    }
    if (list.length === 0) {
      list.push({
        title: 'Optimal Physical Status',
        desc: 'All analyzed biochemical parameters are in optimal range! Daily health score: ' + healthScore + '/100 is excellent. Keep tracking food consistently!',
        type: 'success'
      });
    }
    return list;
  };

  // ----------------------------------------------------
  // BREATHING SIMULATOR LOGIC
  // ----------------------------------------------------
  const toggleBreathingExercise = () => {
    if (isBreathingActive) {
      if (breathingTimer) clearInterval(breathingTimer);
      setIsBreathingActive(false);
      setBreathingText('Ready');
    } else {
      setIsBreathingActive(true);
      let step = 0;
      setBreathingText('Inhale slowly... (4s)');
      const interval = setInterval(() => {
        step = (step + 1) % 4;
        if (step === 0) setBreathingText('Inhale slowly... (4s)');
        else if (step === 1) setBreathingText('Hold breath... (4s)');
        else if (step === 2) setBreathingText('Exhale gently... (4s)');
        else if (step === 3) setBreathingText('Hold lung resting... (4s)');
      }, 4000);
      setBreathingTimer(interval);
    }
  };

  useEffect(() => {
    return () => {
      if (breathingTimer) clearInterval(breathingTimer);
    };
  }, [breathingTimer]);

  // ----------------------------------------------------
  // ACTION LOG HANDLERS
  // ----------------------------------------------------
  const addSugarLog = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newSugarVal);
    if (!val || isNaN(val)) return;
    const newLog: BloodSugarLog = {
      id: `sugar-${Date.now()}`,
      type: newSugarType,
      glucoseValue: val,
      hbA1c: newSugarHba1c ? Number(newSugarHba1c) : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSugarLogs([...sugarLogs, newLog]);
    setNewSugarVal('');
    setNewSugarHba1c('');
  };

  const addBpLog = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = Number(newSystolic);
    const dia = Number(newDiastolic);
    if (!sys || !dia || isNaN(sys) || isNaN(dia)) return;
    const newLog: BpLog = {
      id: `bp-${Date.now()}`,
      systolic: sys,
      diastolic: dia,
      pulse: 72,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setBpLogs([...bpLogs, newLog]);
    setNewSystolic('');
    setNewDiastolic('');
  };

  const addHrLog = (e: React.FormEvent) => {
    e.preventDefault();
    const bpm = Number(newHrBpm);
    if (!bpm || isNaN(bpm)) return;
    const newLog: HeartRateLog = {
      id: `hr-${Date.now()}`,
      type: newHrType as any,
      bpm,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHrLogs([...hrLogs, newLog]);
    setNewHrBpm('');
  };

  const addSleepLog = (e: React.FormEvent) => {
    e.preventDefault();
    const dur = Number(newSleepDuration);
    if (!dur || isNaN(dur)) return;
    const newLog: SleepLog = {
      id: `sleep-${Date.now()}`,
      durationHours: dur,
      bedtimeConsistency: 90,
      recoveryQuality: newSleepQuality,
      sleepDebt: Math.max(0, 8 - dur),
      sleepScore: Math.min(100, Math.round((dur / 8) * 90 + 10)),
      timestamp: new Date().toUTCString()
    };
    setSleepLogs([...sleepLogs, newLog]);
    setNewSleepDuration('');
  };

  const addWeightLog = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(newWeightVal);
    if (!w || isNaN(w)) return;
    const newLog: WeightLog = {
      id: `weight-${Date.now()}`,
      weight: w,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bodyFatPercentage: newBodyFatVal ? Number(newBodyFatVal) : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setWeightLogs([...weightLogs, newLog]);
    setNewWeightVal('');
    setNewBodyFatVal('');
  };

  const addCycleLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: CycleLog = {
      id: `cycle-${Date.now()}`,
      cycleDate: newCycleDate,
      isOvulation: newCycleFlow === 'normal' && cycleLogs.length % 2 === 0,
      symptoms: newCycleSymptoms,
      pmsSeverity: newCyclePms,
      mood: 'balanced',
      flowIntensity: newCycleFlow,
      energyLevel: 7,
      timestamp: 'Logged Track'
    };
    setCycleLogs([...cycleLogs, newLog]);
    setNewCycleSymptoms([]);
  };

  // Filter based on user profile logic requested
  const isDiabetic = profile.disease === 'diabetes';
  const isWoman = profile.gender === 'female' || profile.disease === 'pcos';
  const isAthlete = profile.lifestyle === 'athlete' || profile.goal === 'muscle_building';
  const isProfessional = profile.lifestyle === 'busy_professional' || profile.lifestyle === 'shift_worker';

  return (
    <div className="space-y-6">
      
      {/* ----------------------------------------------------
          A. MAIN RADIUS DAILY HEALTH SCORE & IMMUNITY SCORES
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Dynamic Circular Health Score Card */}
        <div className="bg-gradient-to-br from-slate-900 via-[#0F1720] to-slate-950 border border-white/10 rounded-[28px] p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[300px]">
          <div className="absolute top-[-20%] left-[-20%] w-32 h-32 bg-emerald-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-32 h-32 bg-[#FF8A24]/10 rounded-full blur-[80px]" />

          <div className="w-full text-left">
            <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 font-extrabold block">Personal Health Engine</span>
            <h3 className="text-lg font-black text-white mt-1 uppercase tracking-tight">Daily Health Score</h3>
          </div>

          <div className="relative w-40 h-40 flex items-center justify-center my-4">
            {/* Smooth SVG Path circular tracking of Health Score */}
            <svg className="absolute w-full h-full -rotate-90">
              <circle 
                cx="80" cy="80" r="64" 
                className="stroke-slate-950 fill-none" 
                strokeWidth="10" 
              />
              <circle 
                cx="80" cy="80" r="64" 
                className="stroke-emerald-400 fill-none transition-all duration-1000" 
                strokeWidth="10" 
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - healthScore / 100)}
                strokeLinecap="round"
              />
            </svg>

            <div className="text-center z-10 space-y-0.5">
              <span className="text-3xl font-black text-white tracking-tighter">{healthScore}</span>
              <span className="text-xs text-gray-500 block font-mono">/ 100 max</span>
              <span className="text-[10px] text-emerald-400 uppercase font-mono tracking-wider font-extrabold block mt-1">Excellent</span>
            </div>
          </div>

          <div className="w-full text-sm text-slate-400 font-medium">
            Calculated from hydration: <span className="text-blue-400">{waterAmount}ml</span>, sleep hours, stress logs and clinical indicators.
          </div>
        </div>

        {/* Dynamic Circular Immunity Score Card */}
        <div className="bg-gradient-to-br from-slate-900 via-[#0F1720] to-slate-950 border border-white/10 rounded-[28px] p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[300px]">
          <div className="absolute top-[-25%] right-[-25%] w-32 h-32 bg-blue-500/10 rounded-full blur-[80px]" />
          
          <div className="w-full text-left">
            <span className="text-[9px] uppercase font-mono tracking-widest text-[#FF8A24] font-extrabold block">Biodefense Surveillance</span>
            <h3 className="text-lg font-black text-white mt-1 uppercase tracking-tight">AI Immunity Score</h3>
          </div>

          <div className="relative w-40 h-40 flex items-center justify-center my-4">
            <svg className="absolute w-full h-full -rotate-90">
              <circle 
                cx="80" cy="80" r="64" 
                className="stroke-slate-950 fill-none" 
                strokeWidth="10" 
              />
              <circle 
                cx="80" cy="80" r="64" 
                className="stroke-blue-400 fill-none transition-all duration-1000" 
                strokeWidth="10" 
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - immunityScore / 100)}
                strokeLinecap="round"
              />
            </svg>

            <div className="text-center z-10 space-y-0.5">
              <span className="text-3xl font-black text-white tracking-tighter">{immunityScore}</span>
              <span className="text-xs text-gray-500 block font-mono">/ 100 score</span>
              <span className="text-[10px] text-blue-400 uppercase font-mono tracking-wider font-extrabold block mt-1">Saturated</span>
            </div>
          </div>

          <div className="w-full text-sm text-slate-400 font-medium">
            Metabolic protection: {latestProbiotic ? 'Gut Balanced' : 'Probiotic Deficiency'}. Recovery: {workoutLogs.length > 0 ? 'Active' : 'Muted'}.
          </div>
        </div>

      </div>

      {/* ----------------------------------------------------
          B. PREMIUM CLINICAL REAL-TIME CORRELATION INSIGHTS
          ---------------------------------------------------- */}
      <div className="bg-[#0f1d2a] border border-emerald-500/20 p-5 rounded-[24px] shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h4 className="text-xs uppercase font-mono tracking-widest text-emerald-300 font-extrabold">Preventive Care Analytics & Action Recommendations</h4>
        </div>
        <div className="space-y-2.5">
          {getPersonalizedInsights().map((insight, idx) => (
            <div key={idx} className="bg-slate-900/40 p-3 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed flex gap-2">
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${insight.type === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
              <div>
                <strong className="text-white block font-mono uppercase tracking-wider text-[10px]">{insight.title}</strong>
                <p className="mt-0.5 text-slate-400">{insight.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------
          C. ADAPTIVE HIGH-PRIORITY METRICS MODULES
          ---------------------------------------------------- */}
      <div>
        <h3 className="text-xs uppercase font-mono tracking-widest text-[#FF8A24] font-extrabold mb-4 flex items-center gap-1.5">
          <Compass className="w-4 h-4 animate-spin" /> Priority Health Log Tracks (Intelligently Selected)
        </h3>

        <div className="grid grid-cols-1 gap-4">
          
          {/* DIABETES CONSTRAINTS: Blood Sugar module */}
          {(isDiabetic || !isWoman && !isAthlete && !isProfessional) && (
            <div id="module-blood-sugar" className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-wider text-rose-450 font-bold block">Collection: blood_sugar_logs</span>
                  <h4 className="text-base font-black text-white uppercase tracking-tight">Blood Sugar Surveillance</h4>
                </div>
                <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-full font-mono font-bold">
                  Clinical Care Spikes
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Visual blood sugar track bar */}
                <div className="md:col-span-5 bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono block">Fasting target limit: 70 - 100 mg/dL</span>
                    <div className="text-3xl font-black text-white tracking-tighter mt-1">{latestSugar} <span className="text-xs font-mono text-gray-500">mg/dL</span></div>
                    <span className="text-[10px] text-slate-400 mt-2 block italic leading-snug">
                      {latestSugar > 125 ? '⚠️ Spiked range: Glycemic stress observed' : '✓ Normal glycemic ranges'}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex">
                      <div className="h-full bg-sky-400" style={{ width: '30%' }} />
                      <div className="h-full bg-emerald-400" style={{ width: '40%' }} />
                      <div className="h-full bg-rose-500" style={{ width: '30%' }} />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1">
                      <span>Low (&lt;70)</span>
                      <span>Healthy (70-125)</span>
                      <span>Danger (&gt;125)</span>
                    </div>
                  </div>
                </div>

                {/* Tracking Form input */}
                <form onSubmit={addSugarLog} className="md:col-span-7 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase font-mono text-slate-400 block mb-1">Glucose value (mg/dL)</label>
                      <input 
                        type="number" 
                        value={newSugarVal}
                        onChange={(e) => setNewSugarVal(e.target.value)}
                        placeholder="e.g. 104"
                        className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white max-w-full focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-mono text-slate-400 block mb-1">Standard state</label>
                      <select 
                        value={newSugarType}
                        onChange={(e) => setNewSugarType(e.target.value as any)}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white max-w-full focus:outline-none focus:border-rose-500"
                      >
                        <option value="fasting">Fasting</option>
                        <option value="post_meal">Post Meal</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-mono text-slate-400 block mb-1">HbA1c index percentage (Optional)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={newSugarHba1c}
                      onChange={(e) => setNewSugarHba1c(e.target.value)}
                      placeholder="e.g. 5.7%"
                      className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-rose-500/15 border border-rose-500/20 rounded-xl text-xs font-mono font-bold text-rose-400 uppercase">
                    Log Blood Sugar Limit
                  </button>
                </form>
              </div>

              {/* History log stream */}
              <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
                <span className="text-[9px] text-[#FF8A24] font-mono tracking-wider font-extrabold uppercase">Glycemic logs timeline history</span>
                {sugarLogs.slice(-2).reverse().map((log) => (
                  <div key={log.id} className="flex justify-between items-center bg-black/10 p-2 rounded-xl text-xs border border-white/5">
                    <span className="text-gray-400 uppercase font-mono text-[9px]">{log.type} at {log.timestamp}</span>
                    <span className="font-mono font-black text-rose-400">{log.glucoseValue} mg/dL {log.hbA1c && `• HbA1c: ${log.hbA1c}%`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WOMEN CONSTRAINTS: Menstrual Cycle module */}
          {(isWoman) && (
            <div id="module-cycle" className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-wider text-purple-400 font-bold block">Collection: cycle_logs</span>
                  <h4 className="text-base font-black text-white uppercase tracking-tight">Menstrual Cycle & Follicular Sync</h4>
                </div>
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2.5 py-1 rounded-full font-mono font-bold">
                  Follicular & Luteal Care
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Phase advisory details */}
                <div className="md:col-span-5 bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-purple-300 font-mono block">Estimated Cycle Phase Tracker</span>
                    <div className="text-xl font-black text-white tracking-tight mt-1">Luteal Recovery Phase</div>
                    <span className="text-[10px] text-slate-400 mt-2 block leading-relaxed">
                      💡 <strong>Iron suggestions:</strong> Focus on sorrel leafy lentils, fresh amla tea, and pumpkin seeds during ovulation to buffer copper & iron.
                    </span>
                  </div>
                  
                  <div className="bg-purple-500/5 p-2 rounded-xl text-[9px] text-purple-300 border border-purple-500/15 mt-3 leading-snug">
                    Encrypted Medical Record: Records utilize secure cryptographic local arrays to safeguard private health cycles.
                  </div>
                </div>

                {/* Calendar Cycle Track input */}
                <form onSubmit={addCycleLog} className="md:col-span-7 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase font-mono text-slate-400 block mb-1">Flow Intesity</label>
                      <select 
                        value={newCycleFlow}
                        onChange={(e) => setNewCycleFlow(e.target.value as any)}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none"
                      >
                        <option value="light">Light</option>
                        <option value="normal">Normal</option>
                        <option value="heavy">Heavy</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-mono text-slate-400 block mb-1">PMS Symptoms</label>
                      <select 
                        value={newCyclePms}
                        onChange={(e) => setNewCyclePms(e.target.value as any)}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none"
                      >
                        <option value="none">None</option>
                        <option value="mild">Mild Cramp discomfort</option>
                        <option value="severe">Severe cortisol spike</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2 bg-purple-500/15 border border-purple-500/20 rounded-xl text-xs font-mono font-bold text-purple-400 uppercase">
                    Log Menstrual Status
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ATHLETES: Heart Rate & Workouts */}
          {(isAthlete) && (
            <div id="module-hr-workout" className="space-y-4">
              {/* Workout logs cards */}
              <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-wider text-[#FF8A24] font-bold block">Collection: workout_logs</span>
                    <h4 className="text-base font-black text-white uppercase tracking-tight">Kinetic Workout & Recovery Records</h4>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-mono font-bold">
                    Anaerobic Focus
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
                    <span className="text-[9px] text-gray-500 font-mono block">Dynamic Heart Rate Monitoring</span>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-300">Resting Pulse</span>
                      <strong className="text-base text-rose-450 font-mono">68 bpm</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-300">Active High Target</span>
                      <strong className="text-base text-[#FF8A24] font-mono">142 bpm</strong>
                    </div>
                    <p className="text-[9px] text-gray-400 leading-snug pt-2 border-t border-white/5">
                      🔄 Smartwatch Auto-Sync Pre-Integration Active (Ready for Apple Health Companion bundle).
                    </p>
                  </div>

                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-[#1FA45B] font-mono block uppercase">Anabolic Protein Suggestions</span>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        To reconstruct torn muscle tissues safely, guarantee a standard double-portion protein load such as clean vegetarian whey isolates or paneer within 45 mins.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BUSY PROFESSIONALS: Stress & Sleep modules */}
          {(isProfessional) && (
            <div id="module-professional" className="space-y-4">
              
              {/* Sleep management logs card */}
              <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-wider text-blue-400 font-bold block">Collection: sleep_logs</span>
                    <h4 className="text-base font-black text-white uppercase tracking-tight">Sleep Quality & Bedtime Consistency</h4>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full font-mono font-bold">
                    CNS Recovery Score
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Performance charts sleep */}
                  <div className="md:col-span-5 bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-gray-500 font-mono block">Last night duration</span>
                      <div className="text-3xl font-black text-white tracking-tighter mt-1">{latestSleepHours} <span className="text-xs font-mono text-gray-500">hours</span></div>
                      <div className="text-xs text-emerald-400 font-mono mt-2 flex items-center gap-1">
                        <Moon className="w-3.5 h-3.5 text-blue-400" /> Consistency: {sleepLogs[sleepLogs.length - 1]?.bedtimeConsistency || 85}%
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 italic mt-3 leading-snug">
                      💡 <strong>Caffeine threshold:</strong> Do not ingest stimulant coffee or teas past 2:30 PM to save deep slow-wave phase parameters.
                    </p>
                  </div>

                  {/* Sleep tracking input form */}
                  <form onSubmit={addSleepLog} className="md:col-span-7 space-y-3">
                    <div>
                      <label className="text-[9px] uppercase font-mono text-slate-400 block mb-1">Sleep Duration elapsed (Hours)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={newSleepDuration}
                        onChange={(e) => setNewSleepDuration(e.target.value)}
                        placeholder="e.g. 7.5"
                        className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-mono text-slate-400 block mb-1">Rest quality score</label>
                      <select 
                        value={newSleepQuality}
                        onChange={(e) => setNewSleepQuality(e.target.value as any)}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none"
                      >
                        <option value="poor">Poor (Intermittent shifts)</option>
                        <option value="fair">Fair (Tired)</option>
                        <option value="good">Good recovery</option>
                        <option value="optimal">Superb consistency</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-500/15 border border-blue-500/20 rounded-xl text-xs font-mono font-bold text-blue-400 uppercase">
                      Log Sleep Details
                    </button>
                  </form>
                </div>
              </div>

              {/* Stress management logs card */}
              <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-wider text-rose-450 font-bold block">Collection: stress_logs</span>
                    <h4 className="text-base font-black text-white uppercase tracking-tight">Active Stress & Cortisol Monitoring</h4>
                  </div>
                  <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-full font-mono font-bold">
                    Autonomic Nervous State
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Interactive breathing widget */}
                  <div className="bg-black/25 p-4 rounded-2xl border border-[#1FA45B]/15 text-center flex flex-col justify-between items-center">
                    <div>
                      <span className="text-[9px] text-[#1FA45B] font-mono tracking-wider font-extrabold uppercase block">Vagus Nerve Breathing Engine</span>
                      <p className="text-[10px] text-slate-400 mt-1">Slower cycles activate parasympathetic pathways, dropping cortisol instantly.</p>
                    </div>

                    <div className="my-4 flex items-center justify-center relative">
                      {/* Smooth ripple wave visualizer for breathing */}
                      <motion.div 
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-400/20 absolute"
                        animate={isBreathingActive ? { scale: [1, 1.6, 1.6, 1] } : { scale: 1 }}
                        transition={isBreathingActive ? { duration: 16, repeat: Infinity, ease: 'easeInOut' } : {}}
                      />
                      <div className="w-16 h-16 rounded-full bg-slate-950 border border-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold text-white relative z-10 text-center px-1">
                        {breathingText}
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={toggleBreathingExercise}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all tracking-wider ${
                        isBreathingActive 
                          ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' 
                          : 'bg-[#1FA45B] hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {isBreathingActive ? 'Stop Breath Training' : 'Start 4-4-4 Relax'}
                    </button>
                  </div>

                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <label className="text-[9px] uppercase font-mono text-slate-400 block mb-1">Record emotional pressure load (1-10)</label>
                      <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                        {[
                          { val: 'calm', color: 'bg-emerald-400 text-slate-950' },
                          { val: 'moderate', color: 'bg-blue-400 text-slate-950' },
                          { val: 'elevated', color: 'bg-amber-400 text-slate-950' },
                          { val: 'high', color: 'bg-rose-500 text-white animate-pulse' }
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => {
                              const newLog: StressLog = {
                                id: `stress-${Date.now()}`,
                                level: item.val as any,
                                emotionalLoad: item.val === 'calm' ? 2 : item.val === 'moderate' ? 5 : item.val === 'elevated' ? 7 : 9,
                                burnoutRisk: item.val === 'high',
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              };
                              setStressLogs([...stressLogs, newLog]);
                            }}
                            className={`p-2 rounded-xl text-[9px] font-mono font-bold uppercase text-center cursor-pointer ${item.color}`}
                          >
                            {item.val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 text-[10px] text-gray-400">
                      Primary Stress Indicator: <strong className="text-white capitalize">{latestStressLevel}</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>

      {/* ----------------------------------------------------
          D. ADDITIONAL MEDICAL & PREVENTIVE TRACKS (COLLAPSED)
          ---------------------------------------------------- */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-6">
        <h4 className="text-xs uppercase font-mono tracking-widest text-[#FF8A24] font-extrabold mb-4 flex items-center justify-between">
          <span>Other Preventive Biochemical Indicators</span>
          <span className="text-[10px] text-gray-500 font-normal">Collapsible tracker streams</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* BP logs panel */}
          <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
            <h5 className="text-[11px] font-mono uppercase font-bold text-white mb-2">Blood Pressure (Systolic / Diastolic)</h5>
            <form onSubmit={addBpLog} className="flex gap-2 mb-3">
              <input 
                type="number" 
                value={newSystolic}
                onChange={(e) => setNewSystolic(e.target.value)}
                placeholder="120"
                className="bg-slate-950/85 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none w-1/3"
              />
              <span className="text-gray-500 text-xs self-center">/</span>
              <input 
                type="number" 
                value={newDiastolic}
                onChange={(e) => setNewDiastolic(e.target.value)}
                placeholder="80"
                className="bg-slate-950/85 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none w-1/3"
              />
              <button type="submit" className="px-3 bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-mono font-bold uppercase shrink-0 border border-rose-500/10">Log BP</button>
            </form>
            <div className="text-[10px] text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Latest Reading:</span>
                <span className="font-mono text-white font-bold">{latestSystolic} / {latestDiastolic} mmHg</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1">
                <span>Clinicial risk:</span>
                <span className={`font-mono font-bold ${latestSystolic > 130 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {latestSystolic > 130 ? 'Hypertension risk' : 'Normal range'}
                </span>
              </div>
            </div>
          </div>

          {/* Cholesterol logs panel */}
          <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
            <h5 className="text-[11px] font-mono uppercase font-bold text-white mb-2">Lipids (Cholesterol limits)</h5>
            <div className="space-y-1.5 text-[10px] text-gray-400">
              <div className="flex justify-between">
                <span>HDL Target (&gt;45):</span>
                <span className="font-mono font-bold text-emerald-400">{cholesterolLogs[0]?.hdl || 48} mg/dL</span>
              </div>
              <div className="flex justify-between">
                <span>LDL Target (&lt;100):</span>
                <span className="font-mono font-bold text-rose-450">{cholesterolLogs[0]?.ldl || 114} mg/dL</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1">
                <span>Triglycerides (&lt;150):</span>
                <span className="font-mono font-bold text-[#FF8A24]">{cholesterolLogs[0]?.triglycerides || 140} mg/dL</span>
              </div>
            </div>
          </div>

          {/* Gut health logs panel */}
          <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
            <h5 className="text-[11px] font-mono uppercase font-bold text-white mb-2">Gastrointestinal & Digestive tract</h5>
            <div className="space-y-1.5 text-[10px] text-gray-400">
              <div className="flex justify-between items-center">
                <span>Digestion level:</span>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold">Excellent</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Gut probiotic ingestion:</span>
                <button 
                  onClick={() => {
                    const newLog: GutHealthLog = {
                      id: `gut-${Date.now()}`,
                      digestionLevel: 'excellent',
                      isBowelConsistent: true,
                      probioticTaken: !latestProbiotic,
                      timestamp: 'Instant Log'
                    };
                    setGutLogs([...gutLogs, newLog]);
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold transition-all border ${
                    latestProbiotic 
                      ? 'bg-emerald-500/20 text-[#1FA45B] border-emerald-500/20' 
                      : 'bg-white/5 text-gray-400 border-white/5'
                  }`}
                >
                  {latestProbiotic ? 'Yes (Probiotic taken)' : 'Log probiotic'}
                </button>
              </div>
              <p className="text-[9px] text-slate-500 mt-2 italic leading-relaxed">
                Buttermilk & soaked fenugreek seeds aid the intestinal microbiome, suppressing systemic bloating indices.
              </p>
            </div>
          </div>

          {/* Skin and Hair biomarkers */}
          <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
            <h5 className="text-[11px] font-mono uppercase font-bold text-white mb-2">Acne & Hair follicle indicators</h5>
            <div className="space-y-2 text-[10px] text-gray-400">
              <div className="flex justify-between">
                <span>Sebaceous Acne state:</span>
                <span className="font-mono font-bold text-white uppercase text-[9px]">{skinHairLogs[0]?.acneLevel || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Follicle Hair fall rating:</span>
                <span className="font-mono font-bold text-white uppercase text-[9px]">{skinHairLogs[0]?.hairFallLevel || 'Normal'}</span>
              </div>
              <p className="text-[9px] text-slate-500 border-t border-white/5 pt-1.5 leading-relaxed">
                Connective hormone deficiencies (Zinc, Vitamin D) directly trigger hair falling during stressful work seasons. Keep multi-mineral logs consistent.
              </p>
            </div>
          </div>

          {/* Weight log and fat logs */}
          <div className="bg-black/20 border border-white/5 p-4 rounded-2xl col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-[11px] font-mono uppercase font-bold text-white">Body composition & biometric stats</h5>
              <span className="text-[10px] text-[#FF8A24] font-mono">Goal target: {profile.targetWeight || 65} kg</span>
            </div>
            <form onSubmit={addWeightLog} className="grid grid-cols-3 gap-2 mb-3">
              <input 
                type="number" 
                step="0.1"
                value={newWeightVal}
                onChange={(e) => setNewWeightVal(e.target.value)}
                placeholder="Weight (kg)"
                className="bg-slate-950/85 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none"
              />
              <input 
                type="number" 
                step="0.1"
                value={newBodyFatVal}
                onChange={(e) => setNewBodyFatVal(e.target.value)}
                placeholder="Body fat %"
                className="bg-slate-950/85 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none"
              />
              <button type="submit" className="bg-[#FF8A24] text-slate-950 rounded-xl text-[10px] font-mono font-black uppercase text-center cursor-pointer">Log composition</button>
            </form>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-gray-400">
              <div className="bg-slate-950/40 p-1.5 rounded-lg border border-white/5">
                <span>BMI</span>
                <p className="text-white font-bold font-mono mt-0.5">{(profile.weight / ((profile.height / 100) * (profile.height / 100))).toFixed(1)}</p>
              </div>
              <div className="bg-slate-950/40 p-1.5 rounded-lg border border-white/5">
                <span>Arms circumference</span>
                <p className="text-white font-bold font-mono mt-0.5">{bodyMeasurements[0]?.arms || 36} cm</p>
              </div>
              <div className="bg-slate-950/40 p-1.5 rounded-lg border border-white/5">
                <span>Waist indicator</span>
                <p className="text-white font-bold font-mono mt-0.5">{bodyMeasurements[0]?.waist || 84} cm</p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
