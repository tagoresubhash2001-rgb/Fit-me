/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { BloodSugarLog, BpLog, HeartRateLog, StressLog, SleepLog, CycleLog, BodyMeasurements, CholesterolLog, WeightLog } from '../types';
import { validateBloodSugar, validateBloodPressure, validateHeartRate, validateSleepDuration } from '../validators/health.validator';

interface TrackingState {
  sugarLogs: BloodSugarLog[];
  bpLogs: BpLog[];
  hrLogs: HeartRateLog[];
  stressLogs: StressLog[];
  sleepLogs: SleepLog[];
  cycleLogs: CycleLog[];
  cholesterolLogs: CholesterolLog[];
  weightLogs: WeightLog[];
  measurements: BodyMeasurements[];

  addSugarLog: (log: Omit<BloodSugarLog, 'id' | 'timestamp'>) => void;
  addBpLog: (log: Omit<BpLog, 'id' | 'timestamp'>) => void;
  addHrLog: (log: Omit<HeartRateLog, 'id' | 'timestamp'>) => void;
  addStressLog: (log: Omit<StressLog, 'id' | 'timestamp'>) => void;
  addSleepLog: (log: Omit<SleepLog, 'id' | 'timestamp'>) => void;
  addCycleLog: (log: Omit<CycleLog, 'id' | 'timestamp'>) => void;
  addWeightLog: (log: Omit<WeightLog, 'id' | 'timestamp'>) => void;
  addCholesterolLog: (log: Omit<CholesterolLog, 'id' | 'timestamp'>) => void;
  updateMeasurements: (newMeasurements: BodyMeasurements) => void;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  sugarLogs: (() => {
    const saved = localStorage.getItem('fit_me_blood_sugar_logs');
    return saved
      ? JSON.parse(saved)
      : [
          { id: '1', type: 'fasting', glucoseValue: 104, hbA1c: 5.8, timestamp: '08:00 AM' },
          { id: '2', type: 'post_meal', glucoseValue: 135, timestamp: '02:30 PM' },
        ];
  })(),

  bpLogs: (() => {
    const saved = localStorage.getItem('fit_me_bp_logs');
    return saved ? JSON.parse(saved) : [{ id: '1', systolic: 122, diastolic: 82, pulse: 72, timestamp: '09:00 AM' }];
  })(),

  hrLogs: (() => {
    const saved = localStorage.getItem('fit_me_heart_rate_logs');
    return saved
      ? JSON.parse(saved)
      : [
          { id: '1', type: 'resting', bpm: 68, timestamp: '07:30 AM' },
          { id: '2', type: 'workout', bpm: 142, timestamp: '06:30 PM' },
        ];
  })(),

  stressLogs: (() => {
    const saved = localStorage.getItem('fit_me_stress_logs');
    return saved ? JSON.parse(saved) : [{ id: '1', level: 'moderate', emotionalLoad: 5, burnoutRisk: false, timestamp: '12:00 PM' }];
  })(),

  sleepLogs: (() => {
    const saved = localStorage.getItem('fit_me_sleep_logs');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: '1',
            durationHours: 7.2,
            bedtimeConsistency: 85,
            recoveryQuality: 'good',
            sleepDebt: 0.8,
            sleepScore: 78,
            timestamp: '07:00 AM',
          },
        ];
  })(),

  cycleLogs: (() => {
    const saved = localStorage.getItem('fit_me_cycle_logs');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: '1',
            cycleDate: '2026-05-18',
            isOvulation: false,
            symptoms: ['bloating'],
            pmsSeverity: 'mild',
            mood: 'balanced',
            flowIntensity: 'normal',
            energyLevel: 6,
            timestamp: '08:00 AM',
          },
        ];
  })(),

  weightLogs: (() => {
    const saved = localStorage.getItem('fit_me_weight_logs_v2');
    return saved ? JSON.parse(saved) : [{ id: '1', weight: 68, date: 'May 25', bodyFatPercentage: 21.4, timestamp: '08:00 AM' }];
  })(),

  cholesterolLogs: (() => {
    const saved = localStorage.getItem('fit_me_cholesterol_logs');
    return saved ? JSON.parse(saved) : [{ id: '1', hdl: 48, ldl: 114, triglycerides: 140, timestamp: '08:00 AM' }];
  })(),

  measurements: (() => {
    const saved = localStorage.getItem('fit_me_body_measurements');
    return saved ? JSON.parse(saved) : [{ id: '1', waist: 82, chest: 101, arms: 35, thighs: 53, muscleMass: 56.1, timestamp: '08:00 AM' }];
  })(),

  addSugarLog: (log) => {
    const validatedGlucose = validateBloodSugar(log.glucoseValue);
    const newLog: BloodSugarLog = {
      ...log,
      id: Date.now().toString(),
      glucoseValue: validatedGlucose,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => {
      const updated = [...state.sugarLogs, newLog];
      localStorage.setItem('fit_me_blood_sugar_logs', JSON.stringify(updated));
      return { sugarLogs: updated };
    });
  },

  addBpLog: (log) => {
    const validatedBP = validateBloodPressure(log.systolic, log.diastolic);
    const newLog: BpLog = {
      ...log,
      id: Date.now().toString(),
      systolic: validatedBP.systolic,
      diastolic: validatedBP.diastolic,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => {
      const updated = [...state.bpLogs, newLog];
      localStorage.setItem('fit_me_bp_logs', JSON.stringify(updated));
      return { bpLogs: updated };
    });
  },

  addHrLog: (log) => {
    const validatedBpm = validateHeartRate(log.bpm);
    const newLog: HeartRateLog = {
      ...log,
      id: Date.now().toString(),
      bpm: validatedBpm,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => {
      const updated = [...state.hrLogs, newLog];
      localStorage.setItem('fit_me_heart_rate_logs', JSON.stringify(updated));
      return { hrLogs: updated };
    });
  },

  addStressLog: (log) => {
    const newLog: StressLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => {
      const updated = [...state.stressLogs, newLog];
      localStorage.setItem('fit_me_stress_logs', JSON.stringify(updated));
      return { stressLogs: updated };
    });
  },

  addSleepLog: (log) => {
    const validatedDuration = validateSleepDuration(log.durationHours);
    const newLog: SleepLog = {
      ...log,
      id: Date.now().toString(),
      durationHours: validatedDuration,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => {
      const updated = [...state.sleepLogs, newLog];
      localStorage.setItem('fit_me_sleep_logs', JSON.stringify(updated));
      return { sleepLogs: updated };
    });
  },

  addCycleLog: (log) => {
    const newLog: CycleLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => {
      const updated = [...state.cycleLogs, newLog];
      localStorage.setItem('fit_me_cycle_logs', JSON.stringify(updated));
      return { cycleLogs: updated };
    });
  },

  addWeightLog: (log) => {
    const newLog: WeightLog = {
      ...log,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => {
      const updated = [...state.weightLogs, newLog];
      localStorage.setItem('fit_me_weight_logs_v2', JSON.stringify(updated));
      return { weightLogs: updated };
    });
  },

  addCholesterolLog: (log) => {
    const newLog: CholesterolLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    set((state) => {
      const updated = [...state.cholesterolLogs, newLog];
      localStorage.setItem('fit_me_cholesterol_logs', JSON.stringify(updated));
      return { cholesterolLogs: updated };
    });
  },

  updateMeasurements: (newMeasurements) => {
    set((state) => {
      const updated = [newMeasurements];
      localStorage.setItem('fit_me_body_measurements', JSON.stringify(updated));
      return { measurements: updated };
    });
  },
}));
