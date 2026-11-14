import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Clock, Plus, Sparkles, Check, RefreshCw, AlertCircle, Edit2, 
  Smile, Coffee, Dumbbell, BookOpen, Sun, Moon, Briefcase, Droplet, Pill, Trash2
} from 'lucide-react';
import { UserProfile } from '../types';

interface Activity {
  id: string;
  type: 'routine' | 'meal' | 'workout' | 'hydration' | 'meeting' | 'supplement' | 'sleep' | 'recovery';
  label: string;
  subtext: string;
  completed: boolean;
  isAiOptimized: boolean;
}

interface TimeSlot {
  timeStr: string; // e.g. "06:00 AM"
  activity: Activity | null;
}

// Full 24-hour timeline in 30-minute intervals starting from 06:00 AM to 11:30 PM
const SLOT_LABELS = [
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

// Group mapping for beautiful modularity
const CIRCADIAN_GROUPS = [
  { id: 'morning', label: 'Sunrise & Activation Sync', range: ['06:00 AM', '10:30 AM'], icon: Sun, color: 'text-amber-400 bg-amber-500/10' },
  { id: 'noon', label: 'High Focus & Nourishing Sync', range: ['11:00 AM', '03:30 PM'], icon: Briefcase, color: 'text-[#1FA45B] bg-emerald-500/10' },
  { id: 'evening', label: 'Atmospheric Wind-Down Sync', range: ['04:00 PM', '07:30 PM'], icon: Coffee, color: 'text-[#FF8A24] bg-orange-500/10' },
  { id: 'night', label: 'NREM Sleep Preparation Sync', range: ['08:00 PM', '11:30 PM'], icon: Moon, color: 'text-[#8A5CF6] bg-purple-500/10' }
];

import { usePlannerStore } from '../stores/planner.store';

interface PlannerProps {
  profile: UserProfile;
}

export default function Planner({ profile }: PlannerProps) {
  const {
    slotsToday,
    selectedDate,
    activeFilter,
    isOptimizing,
    aiOptimizedMessage,
    setSelectedDate,
    setActiveFilter,
    toggleSlotCompleted,
    saveSlotActivity,
    deleteActivity,
    optimizeCircadianSlots
  } = usePlannerStore();
  
  // Slot edit controls
  const [editingSlotTime, setEditingSlotTime] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newSub, setNewSub] = useState('');
  const [newType, setNewType] = useState<Activity['type']>('routine');

  // Triggering internal custom optimizations based on user profiles
  const triggerAIOptimizer = () => {
    optimizeCircadianSlots(profile.goal, profile.disease);
  };

  const handleToggleSlotCompleted = (time: string) => {
    toggleSlotCompleted(time);
  };

  const handleOpenSlotAdder = (time: string) => {
    setEditingSlotTime(time);
    const existing = slotsToday[time];
    if (existing) {
      setNewLabel(existing.label);
      setNewSub(existing.subtext);
      setNewType(existing.type);
    } else {
      setNewLabel('');
      setNewSub('');
      setNewType('routine');
    }
  };

  const handleSaveSlotActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlotTime || !newLabel.trim()) return;

    saveSlotActivity(editingSlotTime, newType, newLabel, newSub);
    setEditingSlotTime(null);
  };

  const handleDeleteActivity = (time: string) => {
    deleteActivity(time);
  };

  // Helper for checking slot positioning inside groups
  const isTimeInGroup = (time: string, range: string[]) => {
    const timeToVal = (tString: string) => {
      const [timePart, meridiem] = tString.split(' ');
      let [h, m] = timePart.split(':').map(Number);
      if (meridiem === 'PM' && h !== 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const targetVal = timeToVal(time);
    const minVal = timeToVal(range[0]);
    const maxVal = timeToVal(range[1]);

    return targetVal >= minVal && targetVal <= maxVal;
  };

  // Statistical aggregates
  const totalSlotsFilled = (Object.values(slotsToday) as (Activity | null)[]).filter(Boolean).length;
  const totalSlotsCompleted = (Object.values(slotsToday) as (Activity | null)[]).filter((s): s is Activity => s !== null && s.completed).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-32">
      
      {/* 1. Header Segment with Premium iOS Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-extrabold block">Circadian Optimizer OS</span>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase mt-1">AI Life Optimization Engine</h2>
        </div>

        <div className="flex bg-[#070D14] p-1 rounded-xl border border-white/5 self-start">
          {([
            { key: 'yesterday', label: 'Yesterday (Past)' },
            { key: 'today', label: 'Today (Live)' },
            { key: 'tomorrow', label: 'Tomorrow (Future)' }
          ] as const).map((day) => (
            <button
              key={day.key}
              onClick={() => setSelectedDate(day.key)}
              className={`px-3 py-1.5 text-xs font-mono font-bold transition-all rounded-lg cursor-pointer ${
                selectedDate === day.key 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1B. TIMELINE STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0b1219] border border-white/5 p-4 rounded-2xl">
          <span className="text-[9px] font-mono text-gray-500 block uppercase">Circadian Progress</span>
          <div className="text-lg font-black text-white mt-1">{totalSlotsCompleted} / {totalSlotsFilled}</div>
          <p className="text-[9px] text-[#1FA45B] mt-0.5 font-mono">Completed activities</p>
        </div>

        <div className="bg-[#0b1219] border border-white/5 p-4 rounded-2xl">
          <span className="text-[9px] font-mono text-gray-500 block uppercase">Insulin Buffer</span>
          <div className="text-lg font-black text-orange-400 mt-1">
            {profile.disease === 'diabetes' ? '3 Walks Scheduled' : '1 Walk Active'}
          </div>
          <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Post-meal spike blocks</p>
        </div>

        <div className="bg-[#0b1219] border border-white/5 p-4 rounded-2xl">
          <span className="text-[9px] font-mono text-gray-500 block uppercase">Caffeine Cutoff</span>
          <div className="text-lg font-black text-[#FF8A24] mt-1">02:00 PM</div>
          <p className="text-[9px] text-emerald-400 mt-0.5 font-mono">● Safe windows locked</p>
        </div>

        <div className="bg-[#0b1219] border border-white/5 p-4 rounded-2xl">
          <span className="text-[9px] font-mono text-gray-500 block uppercase">Sleep Sync Zone</span>
          <div className="text-lg font-black text-[#8A5CF6] mt-1">10:30 PM</div>
          <p className="text-[9px] text-purple-400 mt-0.5 font-mono">Restoration window</p>
        </div>
      </div>

      {/* 2. AI Day Optimization Control Banner */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-[#0c131d] to-slate-900 border border-indigo-500/20 rounded-[28px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-10%] w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs uppercase font-mono tracking-wider text-indigo-300 font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-300" /> Active AI Day Optimization Engine
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-normal font-sans">
            Maps nutrition absorption times, pre-workout protein saturations, meeting cortisol buffers, and hormonal balance blocks according to your <strong>{profile.disease === 'none' ? 'General Indian' : profile.disease}</strong> clinical guidelines.
          </p>
        </div>

        <button
          onClick={triggerAIOptimizer}
          disabled={isOptimizing || selectedDate === 'yesterday'}
          className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 font-mono font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg border border-white/10 text-white shrink-0 disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          {isOptimizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Optimize My Timeline
        </button>
      </div>

      {/* Optimizer result overlay */}
      <AnimatePresence>
        {aiOptimizedMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            className="overflow-hidden"
          >
            <div className="bg-emerald-950/25 border border-emerald-400/20 p-5 rounded-2xl text-xs text-emerald-300 flex gap-3">
              <Sparkles className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <span className="block font-mono uppercase tracking-wider text-[10px] text-emerald-400 font-black">AI Optimizer Execution Complete!</span>
                <p className="mt-1 leading-relaxed text-slate-200">{aiOptimizedMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAST ALERT NOTICE */}
      {selectedDate === 'yesterday' && (
        <div className="bg-[#181111]/80 p-4 rounded-xl border border-rose-500/10 text-xs text-rose-300 flex items-center gap-3 font-mono">
          <AlertCircle className="w-5 h-5 text-rose-450 shrink-0" />
          <span>PAST RECORD LOCK: Yesterday&apos;s wellness operations are fully consolidated and written to cloud memory. No alterations are authorized.</span>
        </div>
      )}

      {/* VIEW FILTER TABS */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveFilter('filled')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeFilter === 'filled' 
              ? 'bg-slate-800 text-white border border-white/10' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Active Schedule Blocks ({totalSlotsFilled})
        </button>
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeFilter === 'all' 
              ? 'bg-slate-800 text-white border border-white/10' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Show All 30-Minute Slots (36)
        </button>
      </div>

      {/* 3. MULTI-CYCLE TIME CARDS */}
      <div className="space-y-6">
        {CIRCADIAN_GROUPS.map((group) => {
          // Filter slots belonging to this group
          const groupSlots = SLOT_LABELS.filter(time => isTimeInGroup(time, group.range));
          const numActiveInGroup = groupSlots.filter(t => slotsToday[t] !== null).length;

          // If showing filled only, and this group has 0 contents, skips rendering in filled mode
          if (activeFilter === 'filled' && numActiveInGroup === 0) return null;

          const GroupIcon = group.icon;

          return (
            <div key={group.id} className="space-y-3.5">
              
              {/* Group Cycle Divider */}
              <div className="flex items-center gap-2 px-1">
                <div className={`p-1.5 rounded-lg ${group.color}`}>
                  <GroupIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase text-gray-300 font-extrabold tracking-widest">
                    {group.label}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    Range limit: {group.range[0]} - {group.range[1]} • {numActiveInGroup} Active
                  </p>
                </div>
              </div>

              {/* Slot map */}
              <div className="space-y-3 border-l border-slate-800/80 ml-4 pl-5 relative">
                {groupSlots.map((timeStr) => {
                  const activity = slotsToday[timeStr];
                  const isSlotEmpty = activity === null;

                  // If showing filled only, skip empty slots
                  if (activeFilter === 'filled' && isSlotEmpty) return null;

                  return (
                    <div key={timeStr} className="relative group">
                      
                      {/* Timeline status micro light */}
                      <div className={`absolute left-[-26px] top-4 w-2.5 h-2.5 rounded-full border border-slate-900 transition-all ${
                        isSlotEmpty 
                          ? 'bg-slate-800 group-hover:bg-slate-700' 
                          : activity.completed 
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' 
                            : 'bg-indigo-500'
                      }`} />

                      <div className={`p-4 rounded-2xl border transition-all ${
                        isSlotEmpty 
                          ? 'bg-[#080d14]/30 border-dashed border-slate-800/60 hover:border-emerald-500/20 py-3.5 flex justify-between items-center' 
                          : activity.completed 
                            ? 'bg-[#0c1219]/60 border-white/5 opacity-65 flex justify-between items-start gap-4' 
                            : 'bg-[#0c1219] border-white/5 hover:border-white/10 flex justify-between items-start gap-4 shadow-sm'
                      }`}>
                        
                        {/* 1. LEFT SEGMENT: TIME + LABEL + RECOM */}
                        {isSlotEmpty ? (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-mono text-gray-500 font-bold">{timeStr}</span>
                              <span className="text-[10px] text-gray-650 font-mono italic">Unscheduled circadian window</span>
                            </div>
                            {selectedDate !== 'yesterday' && (
                              <button
                                onClick={() => handleOpenSlotAdder(timeStr)}
                                className="px-3 py-1 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/5 font-mono text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                              >
                                + Schedule
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-mono text-emerald-400 font-black">{timeStr}</span>
                                <span className={`text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full font-mono ${
                                  activity.type === 'meal' ? 'bg-orange-500/10 text-orange-400' :
                                  activity.type === 'workout' ? 'bg-rose-500/10 text-rose-450' :
                                  activity.type === 'hydration' ? 'bg-blue-500/10 text-blue-400' :
                                  activity.type === 'supplement' ? 'bg-purple-500/10 text-purple-400' :
                                  activity.type === 'sleep' ? 'bg-indigo-500/10 text-indigo-400' :
                                  'bg-slate-800 text-slate-350'
                                }`}>
                                  {activity.type}
                                </span>
                                
                                {activity.isAiOptimized && (
                                  <span className="text-[8px] uppercase font-mono bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 animate-pulse" /> AI Optimized
                                  </span>
                                )}
                              </div>

                              <h4 className={`text-xs sm:text-sm font-bold text-white tracking-tight leading-snug ${
                                activity.completed ? 'line-through text-gray-500' : ''
                              }`}>
                                {activity.label}
                              </h4>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-0.5">
                                {activity.subtext}
                              </p>
                            </div>

                            {/* 2. RIGHT SEGMENT: INTERACTION TRIGGER */}
                            <div className="flex items-center gap-2 shrink-0 self-center">
                              {selectedDate !== 'yesterday' && (
                                <button
                                  onClick={() => handleToggleSlotCompleted(timeStr)}
                                  className={`px-3 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                                    activity.completed 
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                      : 'bg-slate-850 hover:bg-slate-800 border-white/5 hover:border-slate-700 text-slate-300'
                                  }`}
                                >
                                  {activity.completed ? '✓ Done' : 'Complete'}
                                </button>
                              )}

                              {selectedDate !== 'yesterday' && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleOpenSlotAdder(timeStr)}
                                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer"
                                    title="Edit slot details"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteActivity(timeStr)}
                                    className="p-1.5 hover:bg-rose-500/5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Clear timeline activity"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

      {/* 4. MODAL DRAWER FOR SLOT ADDS / EDITS */}
      <AnimatePresence>
        {editingSlotTime && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c1219] border border-white/10 w-full max-w-lg rounded-[24px] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-500/10 to-[#FF8A24]/10 p-5 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="text-xs uppercase font-mono tracking-widest text-[#FF8A24] font-black">Circadian Scheduler Console</h3>
                  <span className="text-xs text-slate-400 mt-1 block">Configure scheduling block for {editingSlotTime}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSlotTime(null)}
                  className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSlotActivity} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-mono text-gray-400 block mb-1">Schedule Slot Time</label>
                    <input
                      type="text"
                      value={editingSlotTime}
                      disabled
                      className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-500 w-full font-mono cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-mono text-gray-400 block mb-1">Event Log Group</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white w-full cursor-pointer focus:border-emerald-400"
                    >
                      <option value="routine">Routine / Daylight</option>
                      <option value="meal">Metabolic Meal</option>
                      <option value="workout">Physical workout</option>
                      <option value="hydration">Hydration schedule</option>
                      <option value="supplement">Supplement timing</option>
                      <option value="sleep">Delta sleep block</option>
                      <option value="meeting">Professional alignment</option>
                      <option value="recovery">Active recovery</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-mono text-gray-400 block mb-1">Title Label</label>
                  <input
                    type="text"
                    required
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Glycemic Stabilizer Infusion"
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-mono text-gray-400 block mb-1">Instructions / Nutritional guidelines notes</label>
                  <textarea
                    rows={2}
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    placeholder="e.g. Drink 250ml warm water blended with organic amla extracts to bolster trace immunity barriers."
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white w-full h-16 focus:outline-none focus:border-emerald-400 font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlotTime(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-xs font-mono font-bold text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1FA45B] hover:bg-emerald-600 rounded-xl text-xs font-mono font-black uppercase text-white shadow-md transition-all cursor-pointer"
                  >
                    Update Block
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
