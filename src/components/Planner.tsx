import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Plus,
  Sparkles,
  Check,
  RefreshCw,
  AlertCircle,
  Edit2,
  Smile,
  Coffee,
  Dumbbell,
  BookOpen,
  Sun,
  Moon,
  Briefcase,
  Droplet,
  Pill,
  Trash2,
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
  '06:00 AM',
  '06:30 AM',
  '07:00 AM',
  '07:30 AM',
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM',
  '07:00 PM',
  '07:30 PM',
  '08:00 PM',
  '08:30 PM',
  '09:00 PM',
  '09:30 PM',
  '10:00 PM',
  '10:30 PM',
  '11:00 PM',
  '11:30 PM',
];

// Group mapping for beautiful modularity
const CIRCADIAN_GROUPS = [
  { id: 'morning', label: 'Sunrise & Activation Sync', range: ['06:00 AM', '10:30 AM'], icon: Sun, color: 'text-accent bg-accent-subtle' },
  {
    id: 'noon',
    label: 'High Focus & Nourishing Sync',
    range: ['11:00 AM', '03:30 PM'],
    icon: Briefcase,
    color: 'text-primary bg-primary-subtle',
  },
  {
    id: 'evening',
    label: 'Atmospheric Wind-Down Sync',
    range: ['04:00 PM', '07:30 PM'],
    icon: Coffee,
    color: 'text-accent bg-accent-subtle',
  },
  { id: 'night', label: 'NREM Sleep Preparation Sync', range: ['08:00 PM', '11:30 PM'], icon: Moon, color: 'text-sleep bg-raised' },
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
    optimizeCircadianSlots,
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
  const totalSlotsCompleted = (Object.values(slotsToday) as (Activity | null)[]).filter(
    (s): s is Activity => s !== null && s.completed,
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-32">
      {/* 1. Header Segment with Premium iOS Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-caption text-primary font-semibold block">Daily planner</span>
          <h2 className="text-display font-semibold text-ink mt-1">Plan your day</h2>
        </div>

        <div className="flex bg-canvas p-1 rounded-xl border border-line self-start">
          {(
            [
              { key: 'yesterday', label: 'Yesterday (Past)' },
              { key: 'today', label: 'Today (Live)' },
              { key: 'tomorrow', label: 'Tomorrow (Future)' },
            ] as const
          ).map((day) => (
            <button
              key={day.key}
              onClick={() => setSelectedDate(day.key)}
              className={`px-3 py-1.5 text-caption  font-semibold transition-all rounded-lg cursor-pointer ${
                selectedDate === day.key
                  ? 'bg-primary-subtle border border-primary/30 text-primary font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1B. TIMELINE STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-line p-4 rounded-2xl">
          <span className="text-caption text-muted block">Today's progress</span>
          <div className="text-title font-semibold text-ink mt-1">
            {totalSlotsCompleted} / {totalSlotsFilled}
          </div>
          <p className="text-caption text-primary mt-0.5">Completed activities</p>
        </div>

        <div className="bg-surface border border-line p-4 rounded-2xl">
          <span className="text-caption text-muted block">Insulin Buffer</span>
          <div className="text-title font-semibold text-accent mt-1">
            {profile.disease === 'diabetes' ? '3 Walks Scheduled' : '1 Walk Active'}
          </div>
          <p className="text-caption text-muted mt-0.5">Post-meal spike blocks</p>
        </div>

        <div className="bg-surface border border-line p-4 rounded-2xl">
          <span className="text-caption text-muted block">Caffeine Cutoff</span>
          <div className="text-title font-semibold text-accent mt-1">02:00 PM</div>
          <p className="text-caption text-primary mt-0.5">● Safe windows locked</p>
        </div>

        <div className="bg-surface border border-line p-4 rounded-2xl">
          <span className="text-caption text-muted block">Sleep Sync Zone</span>
          <div className="text-title font-semibold text-sleep mt-1">10:30 PM</div>
          <p className="text-caption text-sleep mt-0.5">Restoration window</p>
        </div>
      </div>

      {/* 2. AI Day Optimization Control Banner */}
      <div className="border border-line rounded-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <h3 className="text-caption text-primary font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> AI day planner
            </h3>
          </div>
          <p className="text-caption sm:text-small text-ink font-sans">
            Maps nutrition absorption times, pre-workout snacks, breaks between meetings and rest according to your{' '}
            <strong>{profile.disease === 'none' ? 'General Indian' : profile.disease}</strong> profile.
          </p>
        </div>

        <button
          onClick={triggerAIOptimizer}
          disabled={isOptimizing || selectedDate === 'yesterday'}
          className="px-5 py-3 font-semibold text-caption rounded-2xl shadow-card border border-line text-on-primary shrink-0 disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform bg-primary hover:bg-primary-pressed"
        >
          {isOptimizing ? <RefreshCw className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
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
            <div className="bg-primary-subtle border border-primary/30 p-5 rounded-2xl text-caption text-primary flex gap-3">
              <Sparkles className="w-5 h-5 shrink-0 text-primary" />
              <div>
                <span className="block text-caption text-primary font-semibold">AI Optimizer Execution Complete!</span>
                <p className="mt-1 leading-relaxed text-ink">{aiOptimizedMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAST ALERT NOTICE */}
      {selectedDate === 'yesterday' && (
        <div className="bg-danger-subtle p-4 rounded-xl border border-danger/40 text-caption text-danger flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0" />
          <span>
            PAST RECORD LOCK: Yesterday&apos;s wellness operations are fully consolidated and written to cloud memory. No alterations are
            authorized.
          </span>
        </div>
      )}

      {/* VIEW FILTER TABS */}
      <div className="flex gap-2 border-b border-line pb-2">
        <button
          onClick={() => setActiveFilter('filled')}
          className={`px-3.5 py-1.5 rounded-lg text-caption  font-semibold transition-all ${
            activeFilter === 'filled' ? 'bg-surface text-ink border border-line' : 'text-muted hover:text-ink'
          }`}
        >
          Active Schedule Blocks ({totalSlotsFilled})
        </button>
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg text-caption  font-semibold transition-all ${
            activeFilter === 'all' ? 'bg-surface text-ink border border-line' : 'text-muted hover:text-ink'
          }`}
        >
          Show All 30-Minute Slots (36)
        </button>
      </div>

      {/* 3. MULTI-CYCLE TIME CARDS */}
      <div className="space-y-6">
        {CIRCADIAN_GROUPS.map((group) => {
          // Filter slots belonging to this group
          const groupSlots = SLOT_LABELS.filter((time) => isTimeInGroup(time, group.range));
          const numActiveInGroup = groupSlots.filter((t) => slotsToday[t] !== null).length;

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
                  <h3 className="text-caption text-ink font-semibold">{group.label}</h3>
                  <p className="text-caption text-muted mt-0.5">
                    Range limit: {group.range[0]} - {group.range[1]} • {numActiveInGroup} Active
                  </p>
                </div>
              </div>

              {/* Slot map */}
              <div className="space-y-3 border-l border-line ml-4 pl-5 relative">
                {groupSlots.map((timeStr) => {
                  const activity = slotsToday[timeStr];
                  const isSlotEmpty = activity === null;

                  // If showing filled only, skip empty slots
                  if (activeFilter === 'filled' && isSlotEmpty) return null;

                  return (
                    <div key={timeStr} className="relative group">
                      {/* Timeline status micro light */}
                      <div
                        className={`absolute left-[-26px] top-4 w-2.5 h-2.5 rounded-full border border-line transition-all ${
                          isSlotEmpty ? 'bg-surface group-hover:bg-raised' : activity.completed ? 'bg-primary shadow-card' : 'bg-primary'
                        }`}
                      />

                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          isSlotEmpty
                            ? 'bg-raised border-dashed border-line hover:border-primary/30 py-3.5 flex justify-between items-center'
                            : activity.completed
                              ? 'bg-raised border-line opacity-65 flex justify-between items-start gap-4'
                              : 'bg-surface border-line hover:border-line flex justify-between items-start gap-4 shadow-card'
                        }`}
                      >
                        {/* 1. LEFT SEGMENT: TIME + LABEL + RECOM */}
                        {isSlotEmpty ? (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="text-caption text-muted font-semibold">{timeStr}</span>
                              <span className="text-caption text-muted italic">Free slot</span>
                            </div>
                            {selectedDate !== 'yesterday' && (
                              <button
                                onClick={() => handleOpenSlotAdder(timeStr)}
                                className="px-3 py-1 bg-raised hover:bg-primary-subtle hover:text-primary border border-line text-caption rounded-lg transition-all cursor-pointer"
                              >
                                + Schedule
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-caption text-primary font-semibold">{timeStr}</span>
                                <span
                                  className={`text-caption  font-semibold  px-2 py-0.5 rounded-full  ${
                                    activity.type === 'meal'
                                      ? 'bg-accent-subtle text-accent'
                                      : activity.type === 'workout'
                                        ? 'bg-danger-subtle text-danger'
                                        : activity.type === 'hydration'
                                          ? 'bg-raised text-water'
                                          : activity.type === 'supplement'
                                            ? 'bg-raised text-sleep'
                                            : activity.type === 'sleep'
                                              ? 'bg-raised text-primary'
                                              : 'bg-surface text-muted'
                                  }`}
                                >
                                  {activity.type}
                                </span>

                                {activity.isAiOptimized && (
                                  <span className="text-caption bg-primary-subtle text-primary font-semibold border border-primary/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" /> AI Optimized
                                  </span>
                                )}
                              </div>

                              <h4
                                className={`text-caption sm:text-small font-semibold text-ink  leading-snug ${
                                  activity.completed ? 'line-through text-muted' : ''
                                }`}
                              >
                                {activity.label}
                              </h4>
                              <p className="text-caption text-muted leading-relaxed font-sans mt-0.5">{activity.subtext}</p>
                            </div>

                            {/* 2. RIGHT SEGMENT: INTERACTION TRIGGER */}
                            <div className="flex items-center gap-2 shrink-0 self-center">
                              {selectedDate !== 'yesterday' && (
                                <button
                                  onClick={() => handleToggleSlotCompleted(timeStr)}
                                  className={`px-3 py-1.5 rounded-xl text-caption  font-semibold  transition-all cursor-pointer border ${
                                    activity.completed
                                      ? 'bg-primary-subtle text-primary border-primary/30'
                                      : 'bg-surface hover:bg-surface border-line hover:border-line text-ink'
                                  }`}
                                >
                                  {activity.completed ? ' Done' : 'Complete'}
                                </button>
                              )}

                              {selectedDate !== 'yesterday' && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleOpenSlotAdder(timeStr)}
                                    className="p-1.5 hover:bg-raised rounded-lg text-muted hover:text-ink transition-colors cursor-pointer"
                                    title="Edit slot details"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteActivity(timeStr)}
                                    className="p-1.5 hover:bg-danger-subtle rounded-lg text-muted hover:text-danger transition-colors cursor-pointer"
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
          <div className="fixed inset-0 bg-raised backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-line w-full max-w-lg rounded-card overflow-hidden"
            >
              <div className="p-5 border-b border-line flex justify-between items-center">
                <div>
                  <h3 className="text-caption text-accent font-semibold">Add an activity</h3>
                  <span className="text-caption text-muted mt-1 block">Configure scheduling block for {editingSlotTime}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSlotTime(null)}
                  className="p-1 bg-raised hover:bg-raised rounded-lg text-muted hover:text-ink transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSlotActivity} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-caption text-muted block mb-1">Schedule Slot Time</label>
                    <input
                      type="text"
                      value={editingSlotTime}
                      disabled
                      className="bg-raised border border-line rounded-xl px-3 py-2 text-caption text-muted w-full cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-caption text-muted block mb-1">Event Log Group</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="bg-surface border border-line rounded-xl px-3 py-2 text-caption text-ink w-full cursor-pointer focus:border-primary"
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
                  <label className="text-caption text-muted block mb-1">Title Label</label>
                  <input
                    type="text"
                    required
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Glycemic Stabilizer Infusion"
                    className="bg-surface border border-line rounded-xl px-3 py-2 text-caption text-ink w-full focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-caption text-muted block mb-1">Instructions / Nutritional guidelines notes</label>
                  <textarea
                    rows={2}
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    placeholder="e.g. Drink 250ml warm water blended with organic amla extracts to bolster trace immunity barriers."
                    className="bg-surface border border-line rounded-xl px-3 py-2 text-caption text-ink w-full h-16 focus:outline-none focus:border-primary font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlotTime(null)}
                    className="px-4 py-2 bg-surface hover:bg-surface rounded-xl text-caption font-semibold text-ink transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary hover:bg-primary rounded-xl text-caption font-semibold text-on-primary shadow-card transition-all cursor-pointer"
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
