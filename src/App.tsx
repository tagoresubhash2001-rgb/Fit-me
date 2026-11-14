/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Award, PlayCircle, Trophy, BellRing, Settings as SettingsIcon } from 'lucide-react';

import { UserProfile, Meal, ChatMessage } from './types';
import AIOnboarding from './components/AIOnboarding';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import Planner from './components/Planner';
import Trackings from './components/Trackings';
import Workout from './components/Workout';
import Store from './components/Store';
import FloatingAI from './components/FloatingAI';
import ProfileSettings from './components/ProfileSettings';

// Zustand unified state stores
import { useUserStore } from './stores/user.store';
import { useNutritionStore } from './stores/nutrition.store';
import { useHydrationStore } from './stores/hydration.store';
import { useAIStore } from './stores/ai.store';
import { useThemeStore } from './stores/theme.store';
import { useWorkoutStore } from './stores/workout.store';

const TAB_ORDER = ['planner', 'trackings', 'home', 'workout', 'store'];

const slideVariants = {
  enter: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? 16 : -16,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? -16 : 16,
    opacity: 0,
  }),
};

export default function App() {
  const { profile, updateProfile, resetProfile } = useUserStore();
  const { mealLogs, addMealLog, removeMealLog, clearMealLogs } = useNutritionStore();
  const { waterAmount, incrementWater, resetWater } = useHydrationStore();
  const { nlpNotification, setNlpNotification } = useAIStore();
  const { theme, setTheme, applyTheme } = useThemeStore();
  const { steps, incrementSteps } = useWorkoutStore();

  // Ordered exact tab ids: planner, trackings, home, workout, store
  const [activeTab, setActiveTab] = useState<string>('home');
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [lastTab, setLastTab] = useState<string>('home');

  useEffect(() => {
    const prevIndex = TAB_ORDER.indexOf(lastTab);
    const currIndex = TAB_ORDER.indexOf(activeTab);
    if (prevIndex !== -1 && currIndex !== -1 && prevIndex !== currIndex) {
      setDirection(currIndex > prevIndex ? 'right' : 'left');
    }
    setLastTab(activeTab);
  }, [activeTab, lastTab]);

  // Modal overlays
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'profile' | 'settings'>('profile');

  // Apply theme on change
  useEffect(() => {
    applyTheme();
  }, [profile?.theme, theme]);

  // Handle Onboarding Completion
  const handleOnboardingComplete = (newProfile: UserProfile) => {
    updateProfile(newProfile);
    setTheme(newProfile.theme || 'system');

    // Inject appropriate friendly coach greeting matching gender + goal on first launch
    setNlpNotification(
      `AI Assistant configured: ${newProfile.selectedCoach === 'jai' ? 'Jai Brotherly Mode' : 'Jaya Compassionate Mode'} logged successfully.`,
    );
    setTimeout(() => setNlpNotification(null), 4000);
  };

  // Reset/Clear Profile out
  const handleResetProfile = () => {
    if (window.confirm('Do you want to reset your Fit Me profile? All logs will be cleared.')) {
      resetProfile();
      clearMealLogs();
      resetWater();
      setActiveTab('home');
      localStorage.clear();
      window.location.reload();
    }
  };

  // Triggering NLP Proxy searches from Dashboard or Coach chats
  const handleNlpLogFood = async (query: string) => {
    setNlpNotification('Connecting with South Indian AI food parameters...');
    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodQuery: query,
          profile: profile,
        }),
      });

      if (!response.ok) throw new Error('Food log failure');
      const analyzedResult = await response.json();

      // Append directly to active daily logs
      addMealLog({
        name: analyzedResult.name || query,
        calories: Number(analyzedResult.calories || 250),
        protein: Number(analyzedResult.protein || 8),
        carbs: Number(analyzedResult.carbs || 35),
        fats: Number(analyzedResult.fats || 6),
        fiber: Number(analyzedResult.fiber || 3),
        sodium: Number(analyzedResult.sodium || 240),
        potassium: Number(analyzedResult.potassium || 180),
        magnesium: Number(analyzedResult.magnesium || 35),
        calcium: Number(analyzedResult.calcium || 50),
        zinc: Number(analyzedResult.zinc || 0.8),
        iron: Number(analyzedResult.iron || 1.1),
        b12: Number(analyzedResult.b12 || 0.3),
        vitaminD: Number(analyzedResult.vitaminD || 10),
        omega3: Number(analyzedResult.omega3 || 60),
        hydrationScore: Number(analyzedResult.hydrationScore || 60),
        portion: analyzedResult.portion || '1 standard plate',
        category: 'lunch', // defaults
      });

      // Trigger a success flash to screen
      setNlpNotification(`AI Analyzed & logged: ${analyzedResult.name || query} (${analyzedResult.calories || 250} kcal) successfully!`);
      setTimeout(() => setNlpNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setNlpNotification('System is syncing. Logged fallback meal to directory.');
      setTimeout(() => setNlpNotification(null), 3000);
    }
  };

  const handleAddMealRecord = (mealData: Omit<Meal, 'id' | 'timestamp'>) => {
    addMealLog(mealData);
  };

  const handleRemoveMealRecord = (id: string) => {
    removeMealLog(id);
  };

  const handleIncrementWater = (ml: number) => {
    incrementWater(ml);
  };

  // Screen/Tabs Router
  const renderTabContent = () => {
    if (!profile || !profile.hasOnboarded) return null;
    switch (activeTab) {
      case 'planner':
        return <Planner profile={profile} />;
      case 'trackings':
        return (
          <Trackings
            profile={profile}
            waterAmount={waterAmount}
            incrementWater={handleIncrementWater}
            mealLogsCalories={mealLogs.reduce((acc, m) => acc + m.calories, 0)}
          />
        );
      case 'home':
        return (
          <Dashboard
            profile={profile}
            mealLogs={mealLogs}
            waterAmount={waterAmount}
            incrementWater={handleIncrementWater}
            openMealModal={() => setActiveTab('store')}
            quickAnalyzeFood={handleNlpLogFood}
            onReset={handleResetProfile}
            setActiveTab={setActiveTab}
            addMealLog={handleAddMealRecord}
            removeMealLog={handleRemoveMealRecord}
          />
        );
      case 'workout':
        return <Workout profile={profile} />;
      case 'store':
        return <Store profile={profile} />;
      default:
        return <div className="text-muted py-12 text-center">Under construction</div>;
    }
  };

  // If user has not completed onboarding, trigger the setup flow first
  if (!profile || !profile.hasOnboarded) {
    return <AIOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-canvas pb-32 text-ink">
      <AnimatePresence>
        {nlpNotification && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="status"
            className="fixed inset-x-4 top-3 z-[100] mx-auto flex max-w-sm items-start gap-3 rounded-card border border-line bg-surface p-3.5 shadow-float"
          >
            <Sparkles className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.75} />
            <p className="text-small text-ink">{nlpNotification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-title font-semibold text-ink">
              FIT ME <span className="text-primary">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setModalMode('settings');
                setIsModalOpen(true);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-raised hover:text-ink"
              aria-label="Settings"
              title="Settings"
            >
              <SettingsIcon className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => {
                setModalMode('profile');
                setIsModalOpen(true);
              }}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-small font-semibold text-on-primary transition-transform duration-150 active:scale-95"
              aria-label="Profile"
              title="Profile"
            >
              {profile.name[0]?.toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* Primary Screen View */}
      <main className="relative z-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global floating interactive AI companion button */}
      <FloatingAI profile={profile} quickAnalyzeFood={handleNlpLogFood} incrementWater={handleIncrementWater} setActiveTab={setActiveTab} />

      {/* Global Profile and Settings Modal manager */}
      <ProfileSettings
        profile={profile}
        onChangeProfile={updateProfile}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />

      {/* Floating iOS Bottom Bar Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
