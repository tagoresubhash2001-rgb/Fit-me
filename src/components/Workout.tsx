import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dumbbell,
  Play,
  Plus,
  BookOpen,
  Star,
  Sparkles,
  Award,
  Zap,
  TrendingUp,
  RefreshCw,
  Trophy,
  AlertCircle,
  Compass,
  Smile,
  Eye,
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
    {
      id: '1',
      title: 'Morning cardio',
      duration: '25 min',
      calories: '210',
      type: 'cardio',
      intensity: 'Moderate',
      desc: 'Activates thyroid outputs and controls blood glucose immediately via active intervals.',
    },
    {
      id: '2',
      title: 'Strength training',
      duration: '45 min',
      calories: '380',
      type: 'strength',
      intensity: 'High',
      desc: 'Promotes muscle synthetic pathways. Safe mechanical loads for busy shifts.',
    },
    {
      id: '3',
      title: 'Relaxing yoga',
      duration: '20 min',
      calories: '85',
      type: 'yoga',
      intensity: 'Low',
      desc: 'Gentle stretches and slow breathing to help you unwind.',
    },
    {
      id: '4',
      title: 'No-Equipment Home Calisthenics',
      duration: '30 min',
      calories: '220',
      type: 'home_workout',
      intensity: 'Moderate',
      desc: 'Quick posture alignment and mechanical full body pump. Requires zero assets.',
    },
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
        desc: `Custom calibrated for ${condition} under ${goal} constraints. Ideal glycemic impact and high blood circulation markers.`,
      };

      setPremadeRoutines((prev) => [generatedRoutine, ...prev]);
      setCustomFeedbackMsg(`AI Coach created a direct "${generatedRoutine.title}" matching ${condition} rules!`);
      setTimeout(() => setCustomFeedbackMsg(''), 5000);
    }, 1500);
  };

  const startWorkoutSession = (title: string) => {
    setActiveSession(title);
    setTimerSeconds(0);
    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopWorkoutSession = (calories: string) => {
    if (timerInterval) clearInterval(timerInterval);
    setTimerInterval(null);
    setActiveSession(null);
    setWorkoutLogsCount((prev) => prev + 1);
    setCustomFeedbackMsg(`Workout completed! Burned ~${calories} kcal. Added to workout logs history.`);
    setTimeout(() => setCustomFeedbackMsg(''), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-caption text-accent font-semibold block">Workouts</span>
          <h2 className="text-display font-semibold text-ink mt-1">Your workouts</h2>
        </div>

        {/* Triple design switch header */}
        <div className="flex bg-canvas p-1 rounded-xl border border-line self-start">
          {(
            [
              { key: 'routines', label: 'Routines' },
              { key: 'builder', label: 'AI Generator' },
              { key: 'marketplace', label: 'Trainers' },
            ] as const
          ).map((seg) => (
            <button
              key={seg.key}
              onClick={() => setActiveSegment(seg.key)}
              className={`px-3 py-1.5 text-caption  font-semibold transition-all rounded-lg cursor-pointer ${
                activeSegment === seg.key
                  ? 'bg-danger-subtle border border-danger/40 text-danger font-semibold'
                  : 'text-muted hover:text-ink'
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
            className="bg-primary-subtle border border-primary/30 p-4 rounded-xl text-caption text-primary flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{customFeedbackMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. THE CHOSEN SEGMENT ROUTER */}
      {activeSegment === 'routines' && (
        <div className="space-y-4">
          {/* Active Workout Session Drawer Overlay */}
          {activeSession && (
            <div className="border border-danger/40 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger" />
                  <span className="text-caption text-danger font-semibold">Active Live Training</span>
                </div>
                <div className="text-title font-semibold text-ink">
                  {Math.floor(timerSeconds / 60)}m {timerSeconds % 60}s elapsed
                </div>
              </div>
              <div>
                <h4 className="text-body font-semibold text-ink">{activeSession}</h4>
                <p className="text-caption text-ink">Wearable tracker buffering metabolic inputs recursively.</p>
              </div>
              <button
                onClick={() => {
                  const routineMatch = premadeRoutines.find((r) => r.title === activeSession);
                  stopWorkoutSession(routineMatch?.calories || '240');
                }}
                className="w-full py-2 bg-danger hover:bg-danger font-semibold text-caption text-on-primary rounded-xl shadow-card cursor-pointer"
              >
                Terminate and Log Workout
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {premadeRoutines.map((routine) => (
              <div
                key={routine.id}
                className="bg-surface border border-line p-5 rounded-2xl flex flex-col justify-between hover:border-line transition-all"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-caption text-accent font-semibold">
                      {routine.type} • {routine.intensity}
                    </span>
                    <span className="text-caption font-semibold text-muted">~{routine.calories} kcal</span>
                  </div>
                  <h3 className="text-small font-semibold text-ink mt-1">{routine.title}</h3>
                  <p className="text-caption text-muted leading-relaxed mt-1">{routine.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-line">
                  <span className="text-caption text-muted">Time: {routine.duration}</span>
                  <button
                    onClick={() => startWorkoutSession(routine.title)}
                    disabled={activeSession !== null}
                    className="flex h-9 items-center gap-1.5 rounded-[10px] bg-primary px-3.5 text-small font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-pressed disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" /> Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSegment === 'builder' && (
        <div className="bg-surface border border-line p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="text-small font-semibold text-ink">AI Targeted Anabolic & Metabolic Workout Synthesizer</h3>
          </div>
          <p className="text-caption text-muted leading-relaxed">
            Build your own routine for strength, cardio or recovery phases based on current lifestyle loads.
          </p>

          <button
            onClick={triggerAiWorkoutGenerator}
            disabled={loadingAiRoutine}
            className="w-full py-3 font-semibold text-caption text-on-primary rounded-xl shadow-card disabled:after:opacity-50 cursor-pointer flex items-center justify-center gap-2 bg-primary hover:bg-primary-pressed"
          >
            {loadingAiRoutine ? <RefreshCw className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
            {loadingAiRoutine ? 'Analyzing cardiac metrics...' : 'Synthesize My Care Routine'}
          </button>
        </div>
      )}

      {activeSegment === 'marketplace' && (
        <div className="bg-surface border border-line p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-small font-semibold text-ink">Trainer Marketplace Companion</h3>
            <span className="text-caption bg-raised text-primary px-2 py-0.5 rounded-full border border-line">Coming Soon</span>
          </div>
          <p className="text-caption text-muted">
            Certified trainers will be available after launch, specifically in alignment with your medical records.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { name: 'Dr. Srinivas Rao, PhD', credentials: 'Sports coach', experience: '12+ Years Exp' },
              { name: 'Yogini Ananya Dev', credentials: 'Therapeutic Yoga Specialist', experience: '8+ Years Exp' },
            ].map((trainer, idx) => (
              <div key={idx} className="bg-raised p-3.5 rounded-xl border border-line flex flex-col justify-between">
                <div>
                  <strong className="text-caption text-ink block">{trainer.name}</strong>
                  <span className="text-caption text-primary block">{trainer.credentials}</span>
                </div>
                <span className="text-caption text-muted mt-3 block">{trainer.experience}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
