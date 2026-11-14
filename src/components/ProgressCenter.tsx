/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Calendar, CheckSquare, PlusCircle, TrendingDown, Star, Activity, 
  Trash2, Trophy, Scale, Sparkles 
} from 'lucide-react';
import { UserProfile, Habit } from '../types';

interface ProgressCenterProps {
  profile: UserProfile;
  waterLogsTotal: number;
}

export default function ProgressCenter({ profile, waterLogsTotal }: ProgressCenterProps) {
  // Local active state for custom weight logs
  const [weightLogs, setWeightLogs] = useState([
    { date: 'May 10', weight: 72.5 },
    { date: 'May 14', weight: 71.8 },
    { date: 'May 18', weight: 71.2 },
    { date: 'May 22', weight: 70.5 },
    { date: 'May 25', weight: profile.weight }
  ]);
  const [newLogWeight, setNewLogWeight] = useState<string>('');

  // Daily Habits
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', title: 'Terrace Morning Walk', teluguTitle: 'మిద్దెపై ఉదయపు నడక (20 నిమిషాలు)', category: 'activity', icon: '🚶', completedDays: ['2026-05-25'] },
    { id: '2', title: 'Hydration (Pure Buttermilk/Majjiga)', teluguTitle: 'శరీరానికి తగినంత మజ్జిగ/నీరు', category: 'nutrition', icon: '🥛', completedDays: [] },
    { id: '3', title: 'Pranayama / Calm focus breathing', teluguTitle: 'ప్రాణాయామం (ధ్యానం)', category: 'mindfulness', icon: '🧘', completedDays: ['2026-05-25'] },
    { id: '4', title: 'Steamed greens or protein substitute', teluguTitle: 'ఆకుకూరలు / ప్రత్యామ్నాయ ప్రోటీన్', category: 'nutrition', icon: '🥦', completedDays: [] }
  ]);

  const handleToggleHabit = (id: string) => {
    const today = '2026-05-25';
    setHabits(habits.map(h => {
      if (h.id === id) {
        const completed = h.completedDays.includes(today);
        return {
          ...h,
          completedDays: completed 
            ? h.completedDays.filter(d => d !== today)
            : [...h.completedDays, today]
        };
      }
      return h;
    }));
  };

  const handleAddWeightLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogWeight.trim()) return;
    const num = Number(newLogWeight);
    if (isNaN(num) || num <= 0) return;

    const todayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setWeightLogs([...weightLogs, { date: todayDate, weight: num }]);
    setNewLogWeight('');
  };

  const handleDeleteWeightLog = (idx: number) => {
    setWeightLogs(weightLogs.filter((_, i) => i !== idx));
  };

  // BMI calculation
  const calculatedBMI = (profile.weight / ((profile.height / 100) * (profile.height / 100)));

  // SVG Weight curve coords generator
  // Max/Min weights for scaling bounds
  const weightsArr = weightLogs.map(l => l.weight);
  const minWeight = Math.min(...weightsArr, profile.targetWeight || 60) - 1;
  const maxWeight = Math.max(...weightsArr, profile.weight) + 1;
  const weightSpan = maxWeight - minWeight;

  const chartWidth = 500;
  const chartHeight = 150;

  // Map log index to x, weight value to y
  const points = weightLogs.map((log, index) => {
    const x = (index / (weightLogs.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - ((log.weight - minWeight) / weightSpan) * (chartHeight - 40) - 20;
    return { x, y, label: log.date, val: log.weight };
  });

  // Target line y coordinate
  const targetWeightVal = profile.targetWeight || 65;
  const targetY = chartHeight - ((targetWeightVal - minWeight) / weightSpan) * (chartHeight - 40) - 20;

  // SVG curved path builder (simple line commands)
  const linePath = points.length > 0 
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') 
    : '';

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : '';

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-0 mt-4 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0F1720]/40 p-5 rounded-3xl border border-slate-800 backdrop-blur-md">
        <span className="text-xs text-[#1FA45B] font-bold uppercase tracking-wider font-mono">Progress & Goals Analytics</span>
        <h1 className="text-2xl font-black text-white tracking-tight mt-1">
          Track Your Transformation
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Monitor your caloric deficits, weight trends, and check off healthy wellness habits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Weight Log Chart */}
        <div className="md:col-span-2 bg-slate-900/60 p-6 rounded-3xl border border-[#1FA45B]/10 space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Weight Progress (Baruvu)</h3>
              <p className="text-[11px] text-gray-450 mt-0.5">Target Body Weight: {profile.targetWeight || 65} kg ({profile.goal.replace('_', ' ')})</p>
            </div>
            <TrendingDown className="w-5 h-5 text-[#1FA45B] animate-pulse" />
          </div>

          {/* SVG Line Graph */}
          {points.length > 0 ? (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 relative overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1FA45B" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#1FA45B" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Sub lines */}
                <line x1="0" y1={targetY} x2={chartWidth} y2={targetY} stroke="#FF8A24" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                <text x={chartWidth - 80} y={targetY - 5} fill="#FF8A24" fontSize="8" fontFamily="monospace" fontWeight="bold">TARGET: {targetWeightVal}kg</text>

                {/* Filled gradient area */}
                <path d={areaPath} fill="url(#chartGlow)" />

                {/* Primary connection line */}
                <path d={linePath} fill="none" stroke="#1FA45B" strokeWidth="2.5" strokeLinecap="round" />

                {/* Coordinate indicators */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3.5" fill="#1FA45B" stroke="#0F1720" strokeWidth="1.5" />
                    <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace" fontWeight="bold">{p.val}kg</text>
                    <text x={p.x} y={chartHeight - 4} textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="monospace">{p.label}</text>
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            <div className="py-12 bg-slate-950 border border-slate-850 rounded-2xl text-center text-xs text-gray-500">
              No weight coordinates logged yet. Add logs to see the curved progress chart!
            </div>
          )}

          {/* Add Weigh Log Form */}
          <form onSubmit={handleAddWeightLog} className="flex gap-2">
            <input 
              id="new-weight-log-input"
              type="number" 
              step="0.1"
              required
              value={newLogWeight} 
              onChange={(e) => setNewLogWeight(e.target.value)} 
              placeholder="Record current weight (e.g., 70.3 kg)" 
              className="flex-grow bg-slate-850 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#1FA45B]"
            />
            <button 
              id="submit-weight-log-btn"
              type="submit" 
              className="bg-[#1FA45B] hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              Add Coordinate
            </button>
          </form>
        </div>

        {/* Right Column: Mini stats & BMI */}
        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Mee Body Index Indicators</h3>
            
            <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-gray-500 uppercase font-mono">Current BMI</span>
              <p className="text-2xl font-black text-white mt-1">
                {calculatedBMI.toFixed(1)}
              </p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-[#1FA45B] inline-block mt-1">
                {(() => {
                  if (calculatedBMI < 18.5) return 'Underweight (Sanna)';
                  if (calculatedBMI < 24.9) return 'Healthy (Chakkati)';
                  if (calculatedBMI < 29.9) return 'Overweight (Sthula)';
                  return 'Obese (Sthula)';
                })()}
              </span>
            </div>

            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800/80 text-xs text-gray-300">
              <p className="font-bold text-white flex items-center gap-1">
                <Trophy className="w-4 h-4 text-[#FF8A24]" />
                Daily Water Logged
              </p>
              <p className="font-mono font-bold text-lg text-white mt-1">{waterLogsTotal} mL</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Hydration prevents cell-fat accumulation.</p>
            </div>
          </div>

          <div className="bg-[#1FA45B]/10 border border-[#1FA45B]/20 p-3 rounded-xl text-[10px] text-gray-200">
            <strong>Coach Note:</strong> Your BMR requires <strong>{profile.goal === 'fat_loss' ? '1460' : '1850'} kcal</strong> daily static baseline expenditure.
          </div>
        </div>

      </div>

      {/* Habit checklists */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Mee Daily Habits Checklist (Nitya Kriya)</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Toggle each checkbox once completed. Consistent actions trigger wellness updates.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {habits.map((habit) => {
            const completed = habit.completedDays.includes('2026-05-25');
            return (
              <button
                key={habit.id}
                id={`toggle-habit-btn-${habit.id}`}
                onClick={() => handleToggleHabit(habit.id)}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  completed 
                    ? 'bg-slate-800/80 border-[#1FA45B]/40 text-white' 
                    : 'bg-slate-950/40 border-slate-850 text-gray-400 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{habit.icon}</span>
                  <div>
                    <h4 className={`text-xs font-bold ${completed ? 'text-[#1FA45B] line-through' : 'text-gray-200'}`}>{habit.title}</h4>
                    <p className="text-[11px] text-gray-500">{habit.teluguTitle}</p>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  completed ? 'bg-[#1FA45B]/20 border-[#1FA45B] text-[#1FA45B]' : 'border-slate-700 text-transparent'
                }`}>
                  ✓
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
