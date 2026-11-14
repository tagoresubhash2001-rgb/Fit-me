/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, Volume2, VolumeX, MessageSquare, Zap, Gift, HelpCircle, 
  RefreshCw, Award, ShieldAlert, Heart, Calendar 
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';

interface AICoachProps {
  profile: UserProfile;
  updateCoachSelection: (coach: 'jai' | 'jaya') => void;
  chatHistory: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
}

export default function AICoach({ 
  profile, 
  updateCoachSelection, 
  chatHistory, 
  addChatMessage 
}: AICoachProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const activeCoach = profile.selectedCoach;

  const currentCoachName = activeCoach === 'jai' ? 'Jai' : 'Jaya';
  const currentCoachTeluguQuote = activeCoach === 'jai' 
    ? 'Uncompromising focus. Let us push past our targets today.' 
    : 'Peace, consistency, and daily balance are the keys to physical wellness 😊';

  // Specific high-quality modern wellness prompts
  const helperPrompts = activeCoach === 'jai' ? [
    { text: "I had a heavy meal. How do I balance my calories with activity adjustments? 🔥", display: "Calorie offsets" },
    { text: "What high-protein meal items support premium lean muscle building? 💪", display: "Premium Proteins" },
    { text: "What are the most effective strategies to manage late-night cravings? 🥗", display: "Curb Cravings" }
  ] : [
    { text: "Suggest some low-glycemic, anti-inflammatory whole-food starch alternatives? 🩺", display: "Low-Glycemic Swaps" },
    { text: "Can you design a natural seed cycling strategy to support monthly hormone rhythm? 🌱", display: "Seed Cycling Guide" },
    { text: "What are the benefits of herbal recovery infusions and daily hydration timers? 🥛", display: "Hydration Hydrology" }
  ];

  // TTS helper using Web Speech API
  const speakText = (text: string) => {
    if (!speechEnabled) return;
    
    // Stop any existing speech
    window.speechSynthesis?.cancel();

    // Clean markdown characters out of speech
    const cleanedText = text.replace(/[*#`_\-]/g, '').slice(0, 300); // safety cap
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Choose appropriate pitch & rate
    if (activeCoach === 'jai') {
      utterance.pitch = 0.95; // deep
      utterance.rate = 1.0;
    } else {
      utterance.pitch = 1.15; // soft
      utterance.rate = 1.05;
    }
    
    window.speechSynthesis?.speak(utterance);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    // 1. Append User Message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    addChatMessage(userMsg);
    setInputText('');
    setIsSending(true);

    try {
      // 2. Query Full-Stack Proxy endpoint
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory.slice(-6), // keep context minimal & fast
          profile: profile
        })
      });

      if (!response.ok) {
        throw new Error("Proxy error");
      }

      const data = await response.json();
      
      // 3. Append AI Message
      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      addChatMessage(aiReply);
      
      // Speak if enabled
      if (speechEnabled) {
        speakText(data.text);
      }

    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Manno, local sync is buffering. Since you asked about nutrition, let's keep foods wholesome, track portions, and continue tracking!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      addChatMessage(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto pb-4 px-4 sm:px-0 mt-4">
      
      {/* Top Banner with speech switch and coach chooser */}
      <div className="bg-white/5 p-4 rounded-[32px] border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0F1720] ${
              activeCoach === 'jai' ? 'bg-[#1FA45B]' : 'bg-[#FF8A24]'
            }`} />
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl font-black text-white shrink-0">
              {activeCoach === 'jai' ? 'JAI' : 'JYA'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight font-display">
                AI Coach {currentCoachName}
              </h2>
              <span className="text-[10px] bg-[#1FA45B]/10 border border-[#1FA45B]/20 text-[#1FA45B] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                Active
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-sans italic mt-0.5">
              "{currentCoachTeluguQuote}"
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Switch Coach */}
          <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex gap-0.5">
            <button
              id="switch-coach-jai-btn"
              onClick={() => {
                updateCoachSelection('jai');
                speakText("Hey boy! Jai here! Big brother active!");
              }}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                activeCoach === 'jai' 
                  ? 'bg-[#1FA45B] text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              Jai
            </button>
            <button
              id="switch-coach-jaya-btn"
              onClick={() => {
                updateCoachSelection('jaya');
                speakText("Namskaram, Jaya here to guide your endocrine health.");
              }}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                activeCoach === 'jaya' 
                  ? 'bg-[#FF8A24] text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              Jaya
            </button>
          </div>

          {/* Speech synthesis toggle */}
          <button
            id="tts-toggle-btn"
            onClick={() => {
              const prev = speechEnabled;
              setSpeechEnabled(!prev);
              if (!prev) {
                setTimeout(() => speakText(`Voice narration activated for Coach ${currentCoachName}`), 100);
              } else {
                window.speechSynthesis?.cancel();
              }
            }}
            className={`p-2.5 rounded-2xl border transition-all ${
              speechEnabled 
                ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400 font-bold' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200'
            }`}
            title="Read advice aloud (Web Speech Synth)"
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chat History View */}
      <div className="flex-grow overflow-y-auto py-4 space-y-4 pr-1 mt-2">
        
        {/* Intro greeting */}
        <div className="bg-white/5 p-6 rounded-[32px] border border-dashed border-white/15 text-center max-w-md mx-auto space-y-2.5 backdrop-blur-md">
          <MessageSquare className="w-8 h-8 text-[#1FA45B] mx-auto opacity-75 animate-pulse" />
          <h4 className="text-sm font-bold text-white font-display">Your Emotional Support Dashboard</h4>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Coaches understand regional meals like Pappu, Biryani, Curd rice. Simply chat in English, pure Telugu, or a mix of both!
          </p>
        </div>

        {chatHistory.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
              msg.sender === 'user'
                ? 'bg-gradient-to-br from-[#1FA45B] to-emerald-600 text-white rounded-br-none shadow-md'
                : 'bg-white/[0.04] backdrop-blur-md border border-white/10 text-gray-150 rounded-bl-none'
            }`}>
              
              {/* If AI, option to replay speech */}
              {msg.sender === 'ai' && (
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono font-semibold">
                    Coach {currentCoachName}
                  </span>
                  <button 
                    id={`replay-speech-${msg.id}`}
                    onClick={() => speakText(msg.text)} 
                    className="text-gray-500 hover:text-[#1FA45B]"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Message text with basic paragraph splits */}
              <div className="space-y-2">
                {msg.text.split('\n').map((line, idx) => {
                  if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                    return (
                      <div key={idx} className="flex gap-2 text-xs pl-2 text-gray-300">
                        <span className="text-[#FF8A24] shrink-0">•</span>
                        <span>{line.replace(/^[-*]\s*/, '')}</span>
                      </div>
                    );
                  }
                  return <p key={idx} className={idx === 0 ? "" : "mt-1.5"}>{line}</p>;
                })}
              </div>

            </div>
            <span className="text-[10px] text-gray-500 font-mono mt-1 px-2 uppercase">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isSending && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-4 rounded-3xl rounded-bl-none text-xs text-gray-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#1FA45B] animate-spin" />
              <span>Coach {currentCoachName} is analyzing Telugu diet rules & goals...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Helper Prompts Overlay */}
      <div className="flex gap-2 overflow-x-auto py-2 shrink-0 no-scrollbar relative z-10">
        {helperPrompts.map((p, i) => (
          <button
            key={i}
            id={`ai-coach-suggestion-btn-${i}`}
            onClick={() => handleSendMessage(p.text)}
            className="text-xs shrink-0 bg-white/5 border border-white/10 text-gray-300 hover:text-[#FF8A24] px-4 py-2 rounded-2xl transition-all font-semibold active:scale-95 shadow-sm hover:border-white/20"
          >
            {p.display}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xl shrink-0 shadow-lg relative z-10">
        <div className="flex items-center gap-2">
          <input
            id="coach-chat-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
            placeholder={`Message Coach ${currentCoachName} in English or Telugu...`}
            className="flex-grow bg-transparent border-0 focus:outline-none text-white text-sm px-2 py-1 placeholder-gray-500"
            disabled={isSending}
          />
          <button
            id="coach-send-message-btn"
            onClick={() => handleSendMessage(inputText)}
            disabled={isSending || !inputText.trim()}
            className="bg-[#1FA45B] text-white p-2.5 rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
