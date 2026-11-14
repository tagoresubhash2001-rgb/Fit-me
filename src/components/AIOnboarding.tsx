/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, User, Dumbbell, ShieldAlert, Heart, MapPin, Flame, Utensils, Award, BookOpen, Volume2 } from 'lucide-react';
import { UserProfile, Gender, ActivityLevel, Goal, DiseaseCondition, FoodPreference, Region, Lifestyle } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function AIOnboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(26);
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(70);
  const [targetWeight, setTargetWeight] = useState<number>(65);
  const [activity, setActivity] = useState<ActivityLevel>('moderately_active');
  const [goal, setGoal] = useState<Goal>('fat_loss');
  const [disease, setDisease] = useState<DiseaseCondition>('none');
  const [foodPreference, setFoodPreference] = useState<FoodPreference>('veg');
  const [region, setRegion] = useState<Region>('andhra');
  const [lifestyle, setLifestyle] = useState<Lifestyle>('busy_professional');
  const [selectedCoach, setSelectedCoach] = useState<'jai' | 'jaya'>('jaya');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
    exit: { opacity: 0, x: -30, transition: { duration: 0.3 } },
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      const profile: UserProfile = {
        name: name.trim() || 'Mitra',
        age,
        gender,
        height,
        weight,
        targetWeight,
        activity,
        goal,
        disease,
        foodPreference,
        region,
        lifestyle,
        hasOnboarded: true,
        selectedCoach,
        theme,
      };
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-dvh bg-canvas text-ink flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-on-primary relative overflow-hidden">
      {/* Dynamic ambient background glow */}

      <div className="w-full max-w-xl bg-surface backdrop-blur-xl border border-line rounded-card p-6 sm:p-8 shadow-card relative z-10 flex flex-col justify-between min-h-[580px]">
        {/* Header progress bar */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="text-title font-semibold">FIT ME AI</span>
              <span className="text-caption bg-surface text-primary px-2 py-0.5 rounded-full border border-primary/30">v2.0 Beta</span>
            </div>
            <span className="text-caption text-muted">
              Step {step} of {totalSteps}
            </span>
          </div>

          <div className="w-full bg-track h-1.5 rounded-full mb-8 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Body with Animation Transitions */}
        <div className="flex-grow flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-display sm:text-display font-semibold text-ink flex items-center gap-2">
                    Let's customize your AI ecosystem <Sparkles className="text-accent w-6 h-6" />
                  </h1>
                  <p className="text-small text-muted">What should we call you? Fit Me tracks regional habits to tailor your routine.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-caption text-muted mb-2"> Your Name </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                      <input
                        id="user-name-input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="E.g., Naresh, Swathi, Sridhar..."
                        className="w-full bg-surface border border-line rounded-xl py-3 pl-12 pr-4 text-ink placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-caption text-muted mb-2"> Your Age </label>
                      <input
                        id="user-age-input"
                        type="number"
                        value={age || ''}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full bg-surface border border-line rounded-xl py-3 px-4 text-ink focus:outline-none focus:border-primary transition-colors"
                        min="10"
                        max="110"
                      />
                    </div>
                    <div>
                      <label className="block text-caption text-muted mb-2"> Gender </label>
                      <select
                        id="user-gender-select"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as Gender)}
                        className="w-full bg-surface border border-line rounded-xl py-3 px-3 text-ink focus:outline-none focus:border-primary transition-colors appearance-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-caption text-muted mb-2"> Choose Appearance </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'light', label: 'Light Theme' },
                        { id: 'dark', label: 'Dark Theme' },
                        { id: 'system', label: 'System Theme' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          id={`theme-btn-${t.id}`}
                          onClick={() => {
                            setTheme(t.id as any);
                            if (t.id === 'light') {
                              document.documentElement.classList.add('light');
                            } else if (t.id === 'dark') {
                              document.documentElement.classList.remove('light');
                            } else {
                              const match = window.matchMedia('(prefers-color-scheme: light)').matches;
                              if (match) document.documentElement.classList.add('light');
                              else document.documentElement.classList.remove('light');
                            }
                          }}
                          className={`py-2 px-1 rounded-xl border text-center text-caption font-semibold transition-all cursor-pointer ${
                            theme === t.id
                              ? 'bg-primary-subtle border-primary text-ink font-semibold shadow-card'
                              : 'bg-raised border-line text-muted hover:bg-surface'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-display font-semibold text-ink">Your Physical Indicators</h1>
                  <p className="text-small text-muted">
                    Entering accurate stats calculates accurate metabolic rates and calorie allowances.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface p-3 rounded-2xl border border-line flex flex-col items-center">
                    <span className="text-caption text-muted mb-2">Height (cm)</span>
                    <input
                      id="user-height-input"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="text-center w-full bg-transparent border-b border-line text-title font-semibold text-ink focus:outline-none focus:border-primary py-1"
                    />
                  </div>

                  <div className="bg-surface p-3 rounded-2xl border border-line flex flex-col items-center">
                    <span className="text-caption text-muted mb-2">Weight (kg)</span>
                    <input
                      id="user-weight-input"
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="text-center w-full bg-transparent border-b border-line text-title font-semibold text-ink focus:outline-none focus:border-primary py-1"
                    />
                  </div>

                  <div className="bg-surface p-3 rounded-2xl border border-line flex flex-col items-center">
                    <span className="text-caption text-muted mb-2">Target (kg)</span>
                    <input
                      id="user-target-weight-input"
                      type="number"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(Number(e.target.value))}
                      className="text-center w-full bg-transparent border-b border-line text-title font-semibold text-ink focus:outline-none focus:border-primary py-1"
                    />
                  </div>
                </div>

                <div className="bg-surface p-4 rounded-xl border border-line flex items-center justify-between">
                  <div>
                    <p className="text-caption text-muted">Calculated BMI Indicator</p>
                    <p className="text-title font-semibold text-primary mt-1">{(weight / ((height / 100) * (height / 100))).toFixed(1)}</p>
                  </div>
                  <span className="text-caption px-3 py-1 rounded-full bg-surface border border-line text-ink">
                    {(() => {
                      const bmi = weight / ((height / 100) * (height / 100));
                      if (bmi < 18.5) return 'Underweight';
                      if (bmi < 24.9) return 'Healthy Weight';
                      if (bmi < 29.9) return 'Overweight';
                      return 'Obese Weight';
                    })()}
                  </span>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-display font-semibold text-ink">Your Goals & Food Preferences</h1>
                  <p className="text-small text-muted">Your visual calorie wheels adjust matching your body target and dietary rules.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-caption text-muted mb-2">Core Life Goal</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'fat_loss', label: 'Fat Loss', icon: Flame, color: 'text-accent' },
                        { id: 'weight_gain', label: 'Weight Gain', icon: Dumbbell, color: 'text-primary' },
                        { id: 'maintenance', label: 'Weight Management', icon: Heart, color: 'text-primary' },
                        { id: 'muscle_building', label: 'Muscle Building', icon: Award, color: 'text-accent' },
                      ].map((g) => (
                        <button
                          key={g.id}
                          id={`goal-btn-${g.id}`}
                          onClick={() => setGoal(g.id as Goal)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left text-small transition-all ${
                            goal === g.id
                              ? 'bg-primary-subtle border-primary text-ink'
                              : 'bg-raised border-line text-muted hover:bg-surface'
                          }`}
                        >
                          <g.icon className={`w-5 h-5 shrink-0 ${goal === g.id ? g.color : 'text-muted'}`} strokeWidth={1.75} />
                          <span>{g.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-caption text-muted mb-2">Dietary Orientation</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'veg', label: 'Vegetarian' },
                        { id: 'non_veg', label: 'Non-Vegetarian' },
                        { id: 'eggetarian', label: 'Egg-Vegetarian' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          id={`food-preference-btn-${f.id}`}
                          onClick={() => setFoodPreference(f.id as FoodPreference)}
                          className={`p-3 rounded-xl border text-center text-caption transition-all ${
                            foodPreference === f.id
                              ? 'bg-primary-subtle border-primary text-ink font-semibold'
                              : 'bg-raised border-line text-muted hover:bg-surface'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-display font-semibold text-ink">Health conditions</h1>
                  <p className="text-small text-muted">
                    Tell us about any health conditions so we can show you relevant food tips. This is not medical advice.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-caption text-muted">Do you suffer from any condition?</label>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', label: 'Perfect Health (No Issues)', desc: 'General fitness, higher high energy foods.' },
                      { id: 'diabetes', label: 'Diabetes Care', desc: 'Lower glycemic levels limit, brown rice choices.' },
                      { id: 'pcos', label: 'PCOS / PCOD', desc: 'Hormonal balancing, insulin checks.' },
                      { id: 'thyroid', label: 'Thyroid Management', desc: 'Optimal iodine, selenium and metabolic boosters.' },
                      { id: 'hypertension', label: 'Hypertension', desc: 'Strict low salt, high potassium regional advise.' },
                      { id: 'fatty_liver', label: 'Fatty Liver Support', desc: 'No processed oils. Pure home cook plans.' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        id={`disease-btn-${d.id}`}
                        onClick={() => setDisease(d.id as DiseaseCondition)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[96px] ${
                          disease === d.id ? 'bg-surface border-line text-ink' : 'bg-raised border-line text-muted hover:bg-surface'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className={`text-caption font-semibold ${disease === d.id ? 'text-accent' : 'text-ink'}`}>{d.label}</span>
                          {disease === d.id && <ShieldAlert className="w-4 h-4 text-accent" />}
                        </div>
                        <span className="text-caption text-muted leading-tight mt-1">{d.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-display font-semibold text-ink">Region & Lifestyle Localization</h1>
                  <p className="text-small text-muted">
                    Our AI models utilize region mappings to estimate carbs/oils for Rayalaseema vs. Andhra vs. Telangana home cooking.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-caption text-muted mb-2">Regional Home Food Mapping</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'andhra', label: 'Coastal Andhra (Lighter grains, spices, seafood)' },
                        { id: 'telangana', label: 'Telangana (Millets, spice-infused, active grains)' },
                        { id: 'rayalaseema', label: 'Rayalaseema (Ragi, whole grains, stews)' },
                        { id: 'general_indian', label: 'General Indian / Pan-Indian' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          id={`region-btn-${r.id}`}
                          onClick={() => setRegion(r.id as Region)}
                          className={`p-3 rounded-xl border text-left text-caption transition-all ${
                            region === r.id
                              ? 'bg-accent-subtle border-accent-fill/40 text-ink'
                              : 'bg-raised border-line text-muted hover:bg-surface'
                          }`}
                        >
                          <MapPin className={`w-3.5 h-3.5 inline mr-1.5 ${region === r.id ? 'text-accent' : 'text-muted'}`} />
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-caption text-muted mb-2">Your Lifestyle & Schedule</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'busy_professional', label: 'Professional / Job Holder' },
                        { id: 'homemaker', label: 'Homemaker' },
                        { id: 'student', label: 'Student / Gym' },
                      ].map((l) => (
                        <button
                          key={l.id}
                          id={`lifestyle-btn-${l.id}`}
                          onClick={() => setLifestyle(l.id as Lifestyle)}
                          className={`p-2.5 rounded-xl border text-center text-caption transition-all ${
                            lifestyle === l.id
                              ? 'bg-surface border-line text-ink font-medium'
                              : 'bg-raised border-line text-muted hover:bg-surface'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div key="step6" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-display font-semibold text-ink">Select Your AI Wellness Coach</h1>
                  <p className="text-small text-muted">
                    Choose the ideal guide for your journey. They specialize in regional food-log strategies, glycemic indexes, and daily
                    behavioral encouragement.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Coach Jai */}
                  <button
                    id="coach-btn-jai"
                    onClick={() => setSelectedCoach('jai')}
                    className={`relative p-5 rounded-2xl border text-left transition-all flex flex-col justify-between h-56 group overflow-hidden ${
                      selectedCoach === 'jai'
                        ? 'bg-surface border-primary ring-1 ring-primary/30'
                        : 'bg-raised border-line opacity-70 hover:opacity-90'
                    }`}
                  >
                    <div className="absolute inset-0 pointer-events-none" />
                    <div className="flex justify-between items-center w-full relative z-10">
                      <span className="text-caption bg-surface text-ink px-2 py-0.5 rounded-full border border-line">
                        Strength & Motivation
                      </span>
                      <Volume2 className="w-4 h-4 text-primary" />
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-title font-semibold text-ink group-hover:text-primary transition-colors">Jai</h3>
                      <p className="text-caption text-muted mt-1 leading-snug">
                        "Strength-focused, goal-oriented health coach. Direct, energetic guidance with high accountability to consistently
                        hit targets."
                      </p>
                    </div>
                  </button>

                  {/* Coach Jaya */}
                  <button
                    id="coach-btn-jaya"
                    onClick={() => setSelectedCoach('jaya')}
                    className={`relative p-5 rounded-2xl border text-left transition-all flex flex-col justify-between h-56 group overflow-hidden ${
                      selectedCoach === 'jaya'
                        ? 'bg-surface border-accent-fill/40 ring-1 ring-accent-fill/40'
                        : 'bg-raised border-line opacity-70 hover:opacity-90'
                    }`}
                  >
                    <div className="absolute inset-0 pointer-events-none" />
                    <div className="flex justify-between items-center w-full relative z-10">
                      <span className="text-caption bg-surface text-ink px-2 py-0.5 rounded-full border border-line">Calm and caring</span>
                      <Volume2 className="w-4 h-4 text-accent" />
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-title font-semibold text-ink group-hover:text-accent transition-colors">Jaya</h3>
                      <p className="text-caption text-muted mt-1 leading-snug">
                        "Clinically-focused, warm individual counselor. Expert in glycemic index parameters, whole grains, and gradual
                        wellness habits."
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-line">
          {step > 1 ? (
            <button
              id="onboarding-back-btn"
              onClick={handleBack}
              className="h-12 rounded-button border border-line bg-surface px-5 text-body font-semibold text-ink transition-colors duration-150 hover:bg-raised"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              id="onboarding-next-btn"
              onClick={handleNext}
              disabled={step === 1 && !name.trim()}
              className="flex h-12 items-center gap-1.5 rounded-button bg-primary px-6 text-body font-semibold text-on-primary transition-[background-color,transform] duration-150 hover:bg-primary-pressed active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {step === totalSteps ? 'Start my plan' : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
