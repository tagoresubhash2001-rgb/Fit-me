/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, Send, ShieldCheck, Clock, Settings, Sparkles, AlertCircle, 
  CheckCircle, BellRing 
} from 'lucide-react';
import { UserProfile } from '../types';

interface WhatsAppAlertsProps {
  profile: UserProfile;
}

export default function WhatsAppAlerts({ profile }: WhatsAppAlertsProps) {
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [voiceQuotesEnabled, setVoiceQuotesEnabled] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Simulated live message triggers
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 1200);
  };

  const triggerMockAlert = (type: 'meal' | 'voice' | 'weekly') => {
    let text = "";
    const coachName = profile.selectedCoach === 'jai' ? 'Jai' : 'Jaya';
    
    if (type === 'meal') {
      text = profile.selectedCoach === 'jai'
        ? `*Fit Me AI (Jai):* Hey ${profile.name}! It is 1:30 PM. Did you track your lunch yet? Make sure to optimize your macro targets and build consistent habits. Let's go! 🔥`
        : `*Fit Me AI (Jaya):* Hello ${profile.name}. It is lunchtime. To stabilize your glycemic index and metabolism, try focusing on fiber first. Record your meals when you finish! 😊`;
    } else if (type === 'voice') {
      text = profile.selectedCoach === 'jai'
        ? `*Fit Me AI Voice (Jai):* "Great morning! Strap on your sneakers and secure premium daily steps. We are aligned for your ${profile.goal.replace('_', ' ')} milestones. Let us dominate today!" 🎙️`
        : `*Fit Me AI Voice (Jaya):* "A fresh morning begins with mindful choices. Power your day with whole foods and plenty of water. You are making elite progress, stay focused! 😊" 🎙️`;
    } else {
      text = `*Fit Me AI Weekly Digest:*
Hello ${profile.name}! Weekly Nutrition Report:
- Carbs consumed: Average 190g/day
- Water logs completed: 86% of targets
- Weight coordinate shifted: -0.7 kg this week!
🔥 Streaks active: 4 Days! Keep pushing local limits!`;
    }

    setActiveAlert(text);
    // Auto-clear after 8 seconds
    setTimeout(() => {
      setActiveAlert(null);
    }, 8000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-0 mt-4 space-y-6">
      
      {/* Title Card */}
      <div className="bg-[#0F1720]/40 p-5 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#1FA45B] animate-pulse" />
          <span className="text-xs text-[#1FA45B] font-bold uppercase tracking-wider font-mono">Instant Messaging Gateway</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mt-1">
          WhatsApp Real-time Integration
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Stay fully committed. Receive proactive meal logs checks, regional voice nudges, and clinical digests from Jai or Jaya on your phone.
        </p>
      </div>

      {/* Floating Notification Simulator HUD */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-[#075e54] p-4 rounded-2xl border border-emerald-500 shadow-2xl space-y-2 relative z-50 text-white max-w-sm mx-auto"
          >
            <div className="flex justify-between items-center text-[10px] font-mono uppercase bg-emerald-950 px-2 py-0.5 rounded text-[#25d366] font-extrabold tracking-wider">
              <span>Incoming Simulation Message</span>
              <span className="animate-ping">● LIVE</span>
            </div>

            <p className="text-xs leading-relaxed leading-normal select-text whitespace-pre-wrap">
              {activeAlert}
            </p>

            <button
              id="mock-alert-dismiss"
              onClick={() => setActiveAlert(null)}
              className="w-full py-1 text-center bg-emerald-800 hover:bg-emerald-700 text-[10px] font-bold uppercase rounded transition-colors"
            >
              Dismiss alert
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Columns: Config Form */}
        <div className="md:col-span-2 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Telegram & WhatsApp Configuration</h3>
          
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-mono mb-1.5">Your Active Number</label>
              <input
                id="whatsapp-number-input"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="E.g., +91 9440523456"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#1FA45B]"
              />
            </div>

            {/* Config Sliders */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center justify-between p-3 bg-slate-850 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Proactive Meal Swapping Cheque ⏰</h4>
                  <p className="text-[10px] text-gray-450 mt-0.5">Sends automated lunch reminders exactly at 1:15 PM.</p>
                </div>
                <input 
                  id="whatsapp-reminders-toggle"
                  type="checkbox" 
                  checked={remindersEnabled}
                  onChange={(e) => setRemindersEnabled(e.target.checked)}
                  className="w-9 h-5 rounded-full accent-[#1FA45B]" 
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-850 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Daily Jai/Jaya Voice Casts 🎙️</h4>
                  <p className="text-[10px] text-gray-450 mt-0.5">Launches morning motivational audio logs on your mobile.</p>
                </div>
                <input 
                  id="whatsapp-voice-quotes-toggle"
                  type="checkbox" 
                  checked={voiceQuotesEnabled}
                  onChange={(e) => setVoiceQuotesEnabled(e.target.checked)}
                  className="w-9 h-5 rounded-full accent-[#1FA45B]" 
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-850 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Weekly Diagnostic Digests 📊</h4>
                  <p className="text-[10px] text-gray-450 mt-0.5">Summates calorie charts and targets achievements securely.</p>
                </div>
                <input 
                  id="whatsapp-weekly-reports-toggle"
                  type="checkbox" 
                  checked={weeklyReports}
                  onChange={(e) => setWeeklyReports(e.target.checked)}
                  className="w-9 h-5 rounded-full accent-[#1FA45B]" 
                />
              </div>
            </div>

            <button
              id="whatsapp-save-config-btn"
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-gradient-to-r from-[#1FA45B] to-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:brightness-105 active:scale-95 transition-all shadow-md"
            >
              {isSaving ? 'Synchronizing Securely...' : 'Save Configuration Link'}
            </button>

            {savedSuccess && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-center text-xs text-emerald-400 font-medium">
                Siddham! Fit Me AI alerts synchronized to number: {phoneNumber}!
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Trigger Instant Simulated Nudges */}
        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-[#FF8A24]" />
              Trigger Live Nudges
            </h3>
            <p className="text-[11px] text-gray-400">
              Test how clean, emotionally rich, and tailored our WhatsApp notifications feel:
            </p>

            <div className="space-y-2 pt-1">
              <button
                id="mock-trigger-meal"
                onClick={() => triggerMockAlert('meal')}
                className="w-full text-left p-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-white">1:30 PM Lunch Check-in</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Sends region advice from selected coach</p>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">Test</span>
              </button>

              <button
                id="mock-trigger-voice"
                onClick={() => triggerMockAlert('voice')}
                className="w-full text-left p-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-white">Jai/Jaya Morning Voice Cast</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Bilingual motivational nudge</p>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">Test</span>
              </button>

              <button
                id="mock-trigger-weekly"
                onClick={() => triggerMockAlert('weekly')}
                className="w-full text-left p-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-white">Clinical Weekly Progress Digest</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Aggregated metrics, weights drops charts</p>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">Test</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-[10px] text-gray-500 text-center leading-normal">
            Information encryption operates securely. Your numbers or health records are never leased to third party distributors.
          </div>
        </div>

      </div>

    </div>
  );
}
