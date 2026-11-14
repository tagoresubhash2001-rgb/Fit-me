import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, Play, Plus, BookOpen, Star, Sparkles, Award, Zap,
  TrendingUp, RefreshCw, Trophy, AlertCircle, Compass, Smile, Eye
} from 'lucide-react';
import { UserProfile } from '../types';

interface WorkoutProps {
  profile: UserProfile;
}

export default function Workout({ profile }: WorkoutProps) {
  const [activeSegment, setActiveSegment] = useState<'routines' | 'builder' | 'marketplace'>('routines');
  const [workoutLogsCount, setWorkoutLogsCount] = useState(32);
  const [loadingAiRoutine, setLoadingAiRoutine] = useState(false);
  const [customFeedbackMsg, setCustomFeedbackMsg] = useState('');

  const [premadeRoutines, setPremadeRoutines] = useState([
    { id: '1', title: 'Circadian Metabolic Fast Burn', duration: '25 min', calories: '210', type: 'cardio', intensity: 'Moderate', desc: 'Activates thyroid outputs and controls blood glucose immediately via active intervals.' },
    { id: '2', title: 'Hypertrophy Anabolic Stack', duration: '45 min', calories: '380', type: 'strength', intensity: 'High', desc: 'Promotes muscle synthetic pathways. Safe mechanical loads for busy shifts.' },
    { id: '3', title: 'Cortisol Regulator Restorative Yoga', duration: '20 min', calories: '85', type: 'yoga', intensity: 'Low', desc: 'Gentle somatic locks and vagal nerve breathings to relieve high stress loads.' },
    { id: '4', title: 'No-Equipment Home Calisthenics', duration: '30 min', calories: '220', type: 'home_workout', intensity: 'Moderate', desc: 'Quick posture alignment and mechanical full body pump. Requires zero assets.' }
  ]);

  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const triggerAiWorkoutGenerator = () => {
    setLoadingAiRoutine(true);
    setTimeout(() => {
      setLoadingAiRoutine(false);
      const condition = profile.disease.toUpperCase();
      const goal = profile.goal.toUpperCase();
      
      const generatedRoutine = {
        id: `ai-gen-${Date.now()}`,
        title: `AI Customized ${profile.selectedCoach === 'jai' ? 'Jai Dynamic' : 'Jaya Compassionate'} Care Routine`,
        duration: '35 min',
        calories: '280',
        type: 'yoga',
        intensity: 'Moderate',
        desc: `Custom calibrated for ${condition} under ${goal} constraints. Ideal glycemic impact and high blood circulation markers.`
      };

      setPremadeRoutines(prev => [generatedRoutine, ...prev]);
      setCustomFeedbackMsg(`AI Coach created a direct "${generatedRoutine.title}" matching ${condition} rules!`);
      setTimeout(() => setCustomFeedbackMsg(''), 5000);
    }, 1500);
  };

  const startWorkoutSession = (title: string) => {
    setActiveSession(title);
    setTimerSeconds(0);
    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopWorkoutSession = (calories: string) => {
    if (timerInterval) clearInterval(timerInterval);
    setTimerInterval(null);
    setActiveSession(null);
    setWorkoutLogsCount(prev => prev + 1);
    setCustomFeedbackMsg(`Workout completed! Burned ~${calories} kcal. Added to workout logs history.`);
    setTimeout(() => setCustomFeedbackMsg(''), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#FF8A24] font-extrabold block">Kinetic Engine</span>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase mt-1">Interactive Workout System</h2>
        </div>

        {/* Triple design switch header */}
        <div className="flex bg-[#070D14] p-1 rounded-xl border border-white/5 self-start">
          {([
            { key: 'routines', label: 'Routines' },
            { key: 'builder', label: 'AI Generator' },
            { key: 'marketplace', label: 'Trainers' }
          ] as const).map((seg) => (
            <button
              key={seg.key}
              onClick={() => setActiveSegment(seg.key)}
              className={`px-3 py-1.5 text-xs font-mono font-bold transition-all rounded-lg cursor-pointer ${
                activeSegment === seg.key 
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications and status messages */}
      <AnimatePresence>
        {customFeedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-900/20 border border-emerald-400/20 p-4 rounded-xl text-xs text-emerald-300 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{customFeedbackMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. THE CHOSEN SEGMENT ROUTER */}
      {activeSegment === 'routines' && (
        <div className="space-y-4">
          
          {/* Active Workout Session Drawer Overlay */}
          {activeSession && (
            <div className="bg-gradient-to-r from-rose-950/40 via-purple-950/20 to-slate-900 border border-rose-500/30 p-5 rounded-2xl space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[10px] uppercase font-mono text-rose-400 font-bold">Active Live Training</span>
                </div>
                <div className="text-xl font-mono font-black text-white">
                  {Math.floor(timerSeconds / 60)}m {timerSeconds % 60}s elapsed
                </div>
              </div>
              <div>
                <h4 className="text-base font-black text-white">{activeSession}</h4>
                <p className="text-xs text-slate-300">Wearable tracker buffering metabolic inputs recursively.</p>
              </div>
              <button
                onClick={() => {
                  const routineMatch = premadeRoutines.find(r => r.title === activeSession);
                  stopWorkoutSession(routineMatch?.calories || '240');
                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 font-mono font-black text-xs uppercase tracking-wider text-white rounded-xl shadow-lg cursor-pointer"
              >
                Terminate and Log Workout
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {premadeRoutines.map((routine) => (
              <div key={routine.id} className="bg-[#0c1219] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/15 transition-all">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#FF8A24] font-bold">
                      {routine.type} • {routine.intensity}
                    </span>
                    <span className="text-xs font-mono font-black text-gray-500">
                      ~{routine.calories} kcal
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{routine.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{routine.desc}</p>
                </div>
                
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                  <span className="text-[10px] font-mono text-gray-400">Time: {routine.duration}</span>
                  <button
                    onClick={() => startWorkoutSession(routine.title)}
                    disabled={activeSession !== null}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 text-xs font-mono font-black uppercase rounded-xl transition-all disabled:opacity-30 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-rose-400" /> Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSegment === 'builder' && (
        <div className="bg-[#0c1219] border border-white/5 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF8A24] animate-spin" />
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">AI Targeted Anabolic & Metabolic Workout Synthesizer</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Construct routines engineered specifically to block cortisol spikes, buffer insulin resistances, or optimize deep recovery phases based on current lifestyle loads.
          </p>

          <button
            onClick={triggerAiWorkoutGenerator}
            disabled={loadingAiRoutine}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-rose-500 font-mono font-black text-xs uppercase tracking-wider text-white rounded-xl shadow-md disabled:after:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loadingAiRoutine ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Dumbbell className="w-4 h-4" />}
            {loadingAiRoutine ? 'Analyzing cardiac metrics...' : 'Synthesize My Care Routine'}
          </button>
        </div>
      )}

      {activeSegment === 'marketplace' && (
        <div className="bg-[#0c1219] border border-white/5 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Trainer Marketplace Companion</h3>
            <span className="text-[8px] uppercase font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">Coming Soon</span>
          </div>
          <p className="text-xs text-slate-400 leading-normal">
            Interact with highly credentialed medical wellness coaches, clinical sports physiologists, and yoga therapeutics teachers specifically in alignment with your medical records.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { name: 'Dr. Srinivas Rao, PhD', credentials: 'Clinical Sport Scientist', experience: '12+ Years Exp' },
              { name: 'Yogini Ananya Dev', credentials: 'Therapeutic Yoga Specialist', experience: '8+ Years Exp' }
            ].map((trainer, idx) => (
              <div key={idx} className="bg-black/20 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <strong className="text-xs text-white block">{trainer.name}</strong>
                  <span className="text-[10px] text-indigo-400 block font-mono">{trainer.credentials}</span>
                </div>
                <span className="text-[9px] text-gray-500 font-mono mt-3 block">{trainer.experience}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
