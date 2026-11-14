import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Mic, MicOff, MessageCircle, X, Send, User, ChevronRight,
  TrendingUp, Compass, Smile, Eye, AlertCircle, RefreshCw, Volume2, 
  HelpCircle, CheckCircle, Apple, Droplet, Dumbbell, Clock
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';

interface FloatingAIProps {
  profile: UserProfile;
  quickAnalyzeFood: (query: string) => void;
  incrementWater: (ml: number) => void;
  setActiveTab: (tab: string) => void;
}

export default function FloatingAI({
  profile,
  quickAnalyzeFood,
  incrementWater,
  setActiveTab
}: FloatingAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'voice'>('chat');
  const [isListening, setIsListening] = useState(false);
  const [chatText, setChatText] = useState('');
  const [aiIsReplying, setAiIsReplying] = useState(false);

  // Emotional coaching status
  const [emotionalState, setEmotionalState] = useState<string>('Refined, ready to align with your health goals.');

  const [aiChatHistory, setAiChatHistory] = useState<ChatMessage[]>(() => [
    {
      id: 'init-floating',
      sender: 'ai',
      text: `Namskaram ${profile.name}! I am your global HealthOS AI companion. Talk to me naturally in Telugu or English. I can log food, schedule routines, or adapt your water hydration immediately!`,
      timestamp: 'Just now'
    }
  ]);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, aiChatHistory, aiIsReplying]);

  const handleSendMessage = async (customQuery?: string) => {
    const rawVal = customQuery || chatText;
    if (!rawVal.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: rawVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiChatHistory(prev => [...prev, userMsg]);
    setChatText('');
    setAiIsReplying(true);

    // Call the server if custom coach is enabled (since our server has API /api/coach and /api/analyze-food)
    try {
      // 1. Check if user intends to log food or water
      const queryLower = rawVal.toLowerCase();
      
      // Telugu Translators or hydration matching
      if (queryLower.includes('dosa') || queryLower.includes('rice') || queryLower.includes('biryani') || queryLower.includes('tinna') || queryLower.includes('thinnanu') || queryLower.includes('ghee') || queryLower.includes('pappu')) {
        // Log food via analyzer proxy
        await quickAnalyzeFood(rawVal);
        
        setAiChatHistory(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Roger that ${profile.name}! I detected a nutrition log request: "${rawVal}". I sent this to our Food Analyzer to automatically estimate portion, calories, macros, and save it in your log. Super job! Let me know if you want to optimize anything else!`,
          timestamp: 'Just now'
        }]);
        setAiIsReplying(false);
        return;
      }

      if (queryLower.includes('water') || queryLower.includes('glass') || queryLower.includes('drugganu') || queryLower.includes('neellu') || queryLower.includes('taaganu')) {
        // Log water
        let amount = 250;
        if (queryLower.includes('bottle') || queryLower.includes('500ml')) {
          amount = 500;
        } else if (queryLower.includes('1l') || queryLower.includes('1000ml')) {
          amount = 1000;
        }
        incrementWater(amount);
        
        setAiChatHistory(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Logged ${amount}ml of mineral water directly to today's hydration index! Stay hydrated. Target is 3,000ml. Keep it up!`,
          timestamp: 'Just now'
        }]);
        setAiIsReplying(false);
        return;
      }

      if (queryLower.includes('workout') || queryLower.includes('gym') || queryLower.includes('exercise')) {
        setActiveTab('workout');
        setAiChatHistory(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Switching you immediately to the Workout tab config so you can start an active routine! Let's get moving!`,
          timestamp: 'Just now'
        }]);
        setAiIsReplying(false);
        return;
      }

      // If generic discussion, call coach API endpoint on server.ts
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: rawVal,
          history: aiChatHistory.slice(-5), // last few items
          profile: profile
        })
      });

      if (!response.ok) throw new Error("Coach API failure");
      const data = await response.json();

      setAiChatHistory(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text || "Deenipai aalochanalo unnanu. Let me analyze deeper.",
        timestamp: 'Just now'
      }]);

      // Adjust emotional coach tracker dynamically
      if (queryLower.includes('sad') || queryLower.includes('stress') || queryLower.includes('tired')) {
        setEmotionalState("Compassionate support locked. Activating soothing auditory wave patterns.");
      } else {
        setEmotionalState("Stable calibration. Aligned directly to daily objectives.");
      }

    } catch (err) {
      console.error(err);
      // fallback
      const fallText = `Mee request processing lo flow dynamic ga check chesa. Falls back nicely: I am analyzing your daily matrix, ${profile.name}! Keep staying consistent! Chala baga chestunnav!`;
      setAiChatHistory(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: fallText,
        timestamp: 'Just now'
      }]);
    } finally {
      setAiIsReplying(false);
    }
  };

  const handleSimulateVoice = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulate speech-to-text input after 3 seconds
      setTimeout(() => {
        setIsListening(false);
        const speechSimulations = [
          "I drank one glass of water",
          "Nenu ippude chala tasty ghee karam dosa thinnanu",
          "I completed my core workout routine",
          "Felt a bit stressed at office with heavy meetings load"
        ];
        const randomSpeech = speechSimulations[Math.floor(Math.random() * speechSimulations.length)];
        handleSendMessage(randomSpeech);
      }, 3000);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-[9999]">
      
      {/* Floating Orbital Core button */}
      <motion.button
        id="floating-ai-orb-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#1FA45B] via-emerald-500 to-[#FF8A24] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(31,164,91,0.5)] border border-white/20 focus:outline-none cursor-pointer relative"
      >
        {isOpen ? <X className="w-6 h-6 animate-spin-once" /> : <Sparkles className="w-6 h-6 text-white animate-pulse" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-500 text-[8px] font-sans font-black flex items-center justify-center text-white border border-slate-900 animate-bounce">
            AI
          </span>
        )}
      </motion.button>

      {/* Futuristic Drawer Portal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-[92vw] sm:w-[380px] h-[520px] bg-[#0c1219]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between"
          >
            {/* Header section with cosmic glow */}
            <div className="bg-gradient-to-r from-[#1FA45B]/10 to-[#FF8A24]/10 p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-xs uppercase font-mono tracking-widest text-[#FF8A24] font-black">AI Life Companion OS</h3>
                  <span className="text-[9px] text-gray-400 font-mono block">Sync Mode: {profile.selectedCoach === 'jai' ? 'Jai Brotherly' : 'Jaya Nutri-sister'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveMode(activeMode === 'chat' ? 'voice' : 'chat')}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-[9px] font-mono font-bold text-slate-300 transition-colors uppercase border border-white/5 cursor-pointer"
                >
                  {activeMode === 'chat' ? '🎙 Voice' : '💬 Chat'}
                </button>
              </div>
            </div>

            {/* Sub-header Emotional coaching ticker */}
            <div className="bg-slate-950/40 px-4 py-2 border-b border-white/5 flex gap-2 items-center">
              <Smile className="w-3.5 h-3.5 text-[#1FA45B] shrink-0" />
              <span className="text-[9px] font-mono text-gray-400 line-clamp-1 italic">
                Status Matrix: {emotionalState}
              </span>
            </div>

            {/* Main Interactive Core */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {activeMode === 'chat' ? (
                <>
                  {aiChatHistory.map((msg, index) => {
                    const isAi = msg.sender === 'ai';
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex gap-2.5 max-w-[85%] ${isAi ? 'self-start' : 'ml-auto flex-row-reverse'}`}
                      >
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isAi 
                            ? 'bg-slate-900 border border-white/5 text-slate-200 rounded-tl-none' 
                            : 'bg-[#1FA45B] text-white rounded-tr-none shadow-md'
                        }`}>
                          {msg.text}
                          <span className={`block font-mono text-[8px] mt-1.5 ${isAi ? 'text-gray-500 text-left' : 'text-emerald-100 text-right'}`}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {aiIsReplying && (
                    <div className="flex gap-2 text-xs text-emerald-400 font-mono animate-pulse self-start p-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing metabolic suggestions...</span>
                    </div>
                  )}
                  <div ref={endRef} />
                </>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center space-y-6 px-4">
                  <div className="relative">
                    <div className={`absolute -inset-4 rounded-full bg-emerald-500/10 blur-xl transition-all duration-1000 ${isListening ? 'scale-150 bg-emerald-500/25 animate-pulse' : ''}`} />
                    <button
                      onClick={handleSimulateVoice}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                        isListening 
                          ? 'bg-rose-500/10 border border-rose-500 animate-bounce' 
                          : 'bg-emerald-500/10 border border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-500/20'
                      } cursor-pointer`}
                    >
                      {isListening ? <MicOff className="w-8 h-8 text-rose-400 animate-spin" /> : <Mic className="w-8 h-8 text-[#1FA45B]" />}
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                      {isListening ? 'Broadcasting live...' : 'Press to Broadcast voice'}
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-normal">
                      Speak naturally in Telugu/English ("Mee breakfast thinnanu"). AI detects variables automatically and maps caloric density!
                    </p>
                  </div>

                  <div className="w-full flex justify-center gap-1">
                    <span className="w-1.5 h-4 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="w-1.5 h-8 bg-[#FF8A24] rounded-full animate-pulse delay-75" />
                    <span className="w-1.5 h-10 bg-emerald-500 rounded-full animate-pulse delay-150" />
                    <span className="w-1.5 h-6 bg-[#FF8A24] rounded-full animate-pulse delay-200" />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Form input */}
            {activeMode === 'chat' && (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="p-3 border-t border-white/5 bg-slate-950 flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Ask, log meal in Tanglish, or water..."
                  className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#1FA45B] transition-colors"
                />
                <button
                  type="submit"
                  className="p-2 bg-emerald-500/10 hover:bg-[#1FA45B] border border-emerald-500/20 rounded-xl text-emerald-400 hover:text-white transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
