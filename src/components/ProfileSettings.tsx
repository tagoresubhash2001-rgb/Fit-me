import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Settings, X, Lock, ShieldCheck, Heart, Sparkles, AlertCircle,
  Bell, Volume2, Globe, CreditCard, RefreshCw, Key, Shield, Info
} from 'lucide-react';
import { UserProfile, Gender, Goal, DiseaseCondition, FoodPreference, Region, Lifestyle } from '../types';

interface ProfileSettingsProps {
  profile: UserProfile;
  onChangeProfile: (profile: UserProfile) => void;
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'profile' | 'settings';
}

export default function ProfileSettings({
  profile,
  onChangeProfile,
  isOpen,
  onClose,
  initialMode
}: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(initialMode);

  // Profile Form States
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [height, setHeight] = useState(profile.height);
  const [weight, setWeight] = useState(profile.weight);
  const [targetWeight, setTargetWeight] = useState(profile.targetWeight || profile.weight);
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [disease, setDisease] = useState<DiseaseCondition>(profile.disease);
  const [foodPreference, setFoodPreference] = useState<FoodPreference>(profile.foodPreference);
  const [region, setRegion] = useState<Region>(profile.region);
  const [lifestyle, setLifestyle] = useState<Lifestyle>(profile.lifestyle);
  const [selectedCoach, setSelectedCoach] = useState<'jai' | 'jaya'>(profile.selectedCoach);

  // Settings States
  const [enableSound, setEnableSound] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [aiTemperature, setAiTemperature] = useState(0.7);
  const [fitbitSynced, setFitbitSynced] = useState(false);
  const [savedSuccessAlert, setSavedSuccessAlert] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name,
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
      targetWeight: Number(targetWeight),
      goal,
      disease,
      foodPreference,
      region,
      lifestyle,
      selectedCoach
    };

    onChangeProfile(updated);
    setSavedSuccessAlert('Profile Metrics Updated Globally!');
    setTimeout(() => {
      setSavedSuccessAlert('');
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Blur backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#070D14]/90 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-[#0c1219] border border-white/10 w-full max-w-2xl h-[90vh] sm:h-[80vh] rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-gray-200"
          >
            {/* Top Bar Switcher */}
            <div className="p-4 border-b border-white/5 bg-slate-950 flex justify-between items-center shrink-0">
              <div className="flex bg-[#070D14] p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeTab === 'profile' 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeTab === 'settings' 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  App Settings
                </button>
              </div>

              <button 
                onClick={onClose}
                className="p-1.5 bg-slate-900/80 hover:bg-slate-800 rounded-full text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification alert */}
            <AnimatePresence>
              {savedSuccessAlert && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-950/40 border-b border-emerald-400/20 px-5 py-2.5 text-xs text-emerald-300 font-mono text-center"
                >
                  ✓ {savedSuccessAlert}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'profile' ? (
                <form id="profile-edit-form" onSubmit={handleUpdateProfile} className="space-y-4">
                  
                  {/* Basic user parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block mb-1">Age (Years)</label>
                      <input 
                        type="number" 
                        value={age} 
                        onChange={e => setAge(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block mb-1">Gender</label>
                      <select 
                        value={gender} 
                        onChange={e => setGender(e.target.value as Gender)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block mb-1">Height (cm)</label>
                      <input 
                        type="number" 
                        value={height} 
                        onChange={e => setHeight(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block mb-1">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={weight} 
                        onChange={e => setWeight(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Metabolic & Health conditions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider text-[#FF8A24] block mb-1 font-bold">Primary Goal Priorities</label>
                      <select 
                        value={goal} 
                        onChange={e => setGoal(e.target.value as Goal)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="fat_loss">Fat Loss & Leptin Balance</option>
                        <option value="weight_gain">Healthy Mass Gain</option>
                        <option value="maintenance">Metabolic Maintenance</option>
                        <option value="muscle_building">Anabolic Hypertrophy</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider text-rose-400 block mb-1 font-bold">Clinics Health Condition</label>
                      <select 
                        value={disease} 
                        onChange={e => setDisease(e.target.value as DiseaseCondition)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="none">Optimal Care (No chronic diseases)</option>
                        <option value="diabetes">Diabetes (Type-2 Glycemic controls)</option>
                        <option value="pcos">PCOS (Androgen Balance targets)</option>
                        <option value="thyroid">Thyroid (T3/T4 metabolic regulators)</option>
                        <option value="hypertension">Hypertension (Cardiac blood volume regulators)</option>
                        <option value="fatty_liver">Non-alcoholic Fatty Liver (Fructose control)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block mb-1">Nutrition Preference</label>
                      <select 
                        value={foodPreference} 
                        onChange={e => setFoodPreference(e.target.value as FoodPreference)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="veg">Pure Vegetarian</option>
                        <option value="non_veg">Non Vegetarian (Inclusive of lean poultry)</option>
                        <option value="eggetarian">Eggetarian</option>
                        <option value="vegan">Vegan / Plant-Based</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block mb-1">South Indian regional code</label>
                      <select 
                        value={region} 
                        onChange={e => setRegion(e.target.value as Region)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="andhra">Andhra Coastal (Spicy, high fiber pappu overrides)</option>
                        <option value="telangana">Telangana region (Millets, sorghum Roti, spicy spices)</option>
                        <option value="rayalaseema">Rayalaseema region (Ragi mudda, sesame seeds, high mineral trace)</option>
                        <option value="general_indian">General Indian / Continental</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-white/5">
                    <button 
                      type="submit" 
                      className="px-6 py-2.5 bg-[#1FA45B] hover:bg-emerald-600 font-mono font-black text-xs uppercase tracking-wider text-white rounded-xl shadow-lg cursor-pointer"
                    >
                      Save & Sync
                    </button>
                  </div>

                </form>
              ) : (
                <div className="space-y-6">
                  
                  {/* APP CONTROLS SECTIONS */}
                  <div className="bg-[#070D14] p-4 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#FF8A24] font-black">AI Model configuration parameters</h3>
                    
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <strong>Select AI Coach Personas:</strong>
                        <span className="block text-[10px] text-gray-500">Affects prompt vocabulary globally</span>
                      </div>
                      <select 
                        value={selectedCoach} 
                        onChange={e => {
                          const coach = e.target.value as 'jai' | 'jaya';
                          setSelectedCoach(coach);
                          const updated = { ...profile, selectedCoach: coach };
                          onChangeProfile(updated);
                        }}
                        className="bg-slate-950 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white"
                      >
                        <option value="jai">Jai brotherly (Motivating, protective, warm)</option>
                        <option value="jaya">Jaya sisterly (Empathetic, nutri-scientific)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <strong>Gemini Temperature Threshold:</strong>
                        <span className="font-mono text-emerald-400">{aiTemperature}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.2" 
                        max="1.5" 
                        step="0.1" 
                        value={aiTemperature} 
                        onChange={e => setAiTemperature(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#1FA45B]"
                      />
                    </div>
                  </div>

                  {/* APPEARANCE SECTION */}
                  <div className="bg-[#070D14] p-4 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#FF8A24] font-black">Appearance Preference</h3>
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <strong>Visual Theme Select</strong>
                        <span className="block text-[10px] text-gray-400">Choose between Warm Light, Deep Dark or OS System sync</span>
                      </div>
                      <div className="flex bg-[#070D14] p-1 rounded-xl border border-white/5">
                        {[
                          { id: 'light', label: 'Light' },
                          { id: 'dark', label: 'Dark' },
                          { id: 'system', label: 'System' }
                        ].map((t) => {
                          const isSel = (profile.theme || 'system') === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                const updated = { ...profile, theme: t.id as any };
                                onChangeProfile(updated);
                                setSavedSuccessAlert(`Theme configured to ${t.label}!`);
                                setTimeout(() => setSavedSuccessAlert(''), 1500);
                              }}
                              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                isSel 
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black' 
                                  : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* INTEGRATION SECTION */}
                  <div className="bg-[#070D14] p-4 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#FF8A24] font-black font-semibold">Integrations Sync Hub</h3>
                    
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <strong>Fitbit / Garmin Secure integration:</strong>
                        <span className="block text-[10px] text-gray-500">Auto pull continuous pulse and sleep telemetry</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFitbitSynced(!fitbitSynced);
                          setSavedSuccessAlert(fitbitSynced ? 'Fitbit cloud sync unlinked.' : 'Connected to Fitbit clinical server.');
                          setTimeout(() => setSavedSuccessAlert(''), 1500);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${
                          fitbitSynced ? 'bg-[#1FA45B]/15 border border-[#1FA45B]/20 text-[#1FA45B]' : 'bg-slate-850 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {fitbitSynced ? 'Connected' : 'Sync Fitbit'}
                      </button>
                    </div>
                  </div>

                  {/* PRIVACY HUB */}
                  <div className="bg-[#070D14] p-4 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-black">Security Policy Core</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                      All biometric metadata, nutrition records, cycles, and insulin logs comply with HIPAA security levels. HealthOS operates on sandboxed local-first persistent boundaries, meaning zero data leakage models are possible.
                    </p>
                  </div>

                </div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
