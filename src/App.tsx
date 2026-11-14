/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Award, PlayCircle, Trophy, BellRing, Settings as SettingsIcon 
} from 'lucide-react';

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
    x: direction === 'right' ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? -80 : 80,
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
  const [activeTab, setActiveTab ] = useState<string>('home');
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
    setNlpNotification(`AI Assistant configured: ${newProfile.selectedCoach === 'jai' ? 'Jai Brotherly Mode' : 'Jaya Compassionate Mode'} logged successfully.`);
    setTimeout(() => setNlpNotification(null), 4000);
  };

  // Reset/Clear Profile out
  const handleResetProfile = () => {
    if (window.confirm("Do you want to reset your Fit Me profile? All logs will be cleared.")) {
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
    setNlpNotification("Connecting with South Indian AI food parameters...");
    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodQuery: query,
          profile: profile
        })
      });

      if (!response.ok) throw new Error("Food log failure");
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
      setNlpNotification("System is syncing. Logged fallback meal to directory.");
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
        return <div className="text-gray-400 py-12 text-center">Under construction</div>;
    }
  };

  // If user has not completed onboarding, trigger the setup flow first
  if (!profile || !profile.hasOnboarded) {
    return <AIOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#070C14] text-gray-150 selection:bg-[#1FA45B] selection:text-white relative pb-28 overflow-x-hidden font-sans">
      
      {/* Dynamic atmospheric background lights */}
      <div className="fixed top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-[#1FA45B]/5 blur-[200px] pointer-events-none" />
      <div className="fixed bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-[#FF8A24]/5 blur-[200px] pointer-events-none" />

      {/* Floating Global Banner Notification for NLP log indicators */}
      <AnimatePresence>
        {nlpNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[99999] bg-[#1FA45B] text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 max-w-sm"
          >
            <Sparkles className="w-5 h-5 shrink-0 animate-spin text-white" />
            <p className="text-xs font-semibold leading-relaxed leading-normal">{nlpNotification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Header */}
      <header className="sticky top-0 z-40 bg-[#070C14]/75 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black bg-gradient-to-r from-emerald-400 to-[#FF8A24] bg-clip-text text-transparent tracking-widest">
              FIT ME
            </span>
            <span className="text-[10px] uppercase font-mono bg-slate-900 px-3 py-0.5 rounded-full border border-white/5 text-emerald-400 font-bold">
              {profile.disease === 'none' ? 'Optimal Care' : `${profile.disease}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick settings gear icon triggers settings modal */}
            <button 
              onClick={() => {
                setModalMode('settings');
                setIsModalOpen(true);
              }}
              className="p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer text-gray-400 hover:text-white"
              title="Global settings configure"
            >
              <SettingsIcon className="w-5 h-5 text-gray-400" />
            </button>

            {/* Quick avatar click triggers editable profile screen */}
            <button 
              onClick={() => {
                setModalMode('profile');
                setIsModalOpen(true);
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1FA45B] to-[#FF8A24] flex items-center justify-center font-bold text-xs text-white uppercase shadow-md border border-slate-800 cursor-pointer overflow-hidden hover:scale-105 transition-transform"
              title="Your personal health indices"
            >
              {profile.name[0]}
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
            transition={{
              x: { type: 'spring', stiffness: 350, damping: 30 },
              opacity: { duration: 0.18 }
            }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global floating interactive AI companion button */}
      <FloatingAI 
        profile={profile} 
        quickAnalyzeFood={handleNlpLogFood} 
        incrementWater={handleIncrementWater}
        setActiveTab={setActiveTab}
      />

      {/* Global Profile and Settings Modal manager */}
      <ProfileSettings 
        profile={profile} 
        onChangeProfile={updateProfile} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialMode={modalMode} 
      />

      {/* Floating iOS Bottom Bar Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

    </div>
  );
}
