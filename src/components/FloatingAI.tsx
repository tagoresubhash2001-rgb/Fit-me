import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Mic,
  MicOff,
  MessageCircle,
  X,
  Send,
  User,
  ChevronRight,
  TrendingUp,
  Compass,
  Smile,
  Eye,
  AlertCircle,
  RefreshCw,
  Volume2,
  HelpCircle,
  CheckCircle,
  Apple,
  Droplet,
  Dumbbell,
  Clock,
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';

interface FloatingAIProps {
  profile: UserProfile;
  quickAnalyzeFood: (query: string) => void;
  incrementWater: (ml: number) => void;
  setActiveTab: (tab: string) => void;
}

export default function FloatingAI({ profile, quickAnalyzeFood, incrementWater, setActiveTab }: FloatingAIProps) {
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
      text: `Namskaram ${profile.name}! I am your AI coach. Ask me about food, workouts or your plan for today.`,
      timestamp: 'Just now',
    },
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiChatHistory((prev) => [...prev, userMsg]);
    setChatText('');
    setAiIsReplying(true);

    // Call the server if custom coach is enabled (since our server has API /api/coach and /api/analyze-food)
    try {
      // 1. Check if user intends to log food or water
      const queryLower = rawVal.toLowerCase();

      // Telugu Translators or hydration matching
      if (
        queryLower.includes('dosa') ||
        queryLower.includes('rice') ||
        queryLower.includes('biryani') ||
        queryLower.includes('tinna') ||
        queryLower.includes('thinnanu') ||
        queryLower.includes('ghee') ||
        queryLower.includes('pappu')
      ) {
        // Log food via analyzer proxy
        await quickAnalyzeFood(rawVal);

        setAiChatHistory((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `Roger that ${profile.name}! I detected a nutrition log request: "${rawVal}". I sent this to our Food Analyzer to automatically estimate portion, calories, macros, and save it in your log. Super job! Let me know if you want to optimize anything else!`,
            timestamp: 'Just now',
          },
        ]);
        setAiIsReplying(false);
        return;
      }

      if (
        queryLower.includes('water') ||
        queryLower.includes('glass') ||
        queryLower.includes('drugganu') ||
        queryLower.includes('neellu') ||
        queryLower.includes('taaganu')
      ) {
        // Log water
        let amount = 250;
        if (queryLower.includes('bottle') || queryLower.includes('500ml')) {
          amount = 500;
        } else if (queryLower.includes('1l') || queryLower.includes('1000ml')) {
          amount = 1000;
        }
        incrementWater(amount);

        setAiChatHistory((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `Logged ${amount}ml of mineral water directly to today's hydration index! Stay hydrated. Target is 3,000ml. Keep it up!`,
            timestamp: 'Just now',
          },
        ]);
        setAiIsReplying(false);
        return;
      }

      if (queryLower.includes('workout') || queryLower.includes('gym') || queryLower.includes('exercise')) {
        setActiveTab('workout');
        setAiChatHistory((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `Switching you immediately to the Workout tab config so you can start an active routine! Let's get moving!`,
            timestamp: 'Just now',
          },
        ]);
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
          profile: profile,
        }),
      });

      if (!response.ok) throw new Error('Coach API failure');
      const data = await response.json();

      setAiChatHistory((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.text || 'Deenipai aalochanalo unnanu. Let me analyze deeper.',
          timestamp: 'Just now',
        },
      ]);

      // Adjust emotional coach tracker dynamically
      if (queryLower.includes('sad') || queryLower.includes('stress') || queryLower.includes('tired')) {
        setEmotionalState('Compassionate support locked. Activating soothing auditory wave patterns.');
      } else {
        setEmotionalState('Stable calibration. Aligned directly to daily objectives.');
      }
    } catch (err) {
      console.error(err);
      // fallback
      const fallText = `Mee request processing lo flow dynamic ga check chesa. Falls back nicely: I am looking at your day, ${profile.name}! Keep staying consistent! Chala baga chestunnav!`;
      setAiChatHistory((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallText,
          timestamp: 'Just now',
        },
      ]);
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
          'I drank one glass of water',
          'Nenu ippude chala tasty ghee karam dosa thinnanu',
          'I completed my core workout routine',
          'Felt a bit stressed at office with heavy meetings load',
        ];
        const randomSpeech = speechSimulations[Math.floor(Math.random() * speechSimulations.length)];
        handleSendMessage(randomSpeech);
      }, 3000);
    }
  };

  return (
    <div className="fixed bottom-[calc(max(12px,env(safe-area-inset-bottom))+84px)] end-4 z-50">
      <button
        id="floating-ai-orb-trigger"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close coach' : 'Talk to Jai or Jaya'}
        aria-expanded={isOpen}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-float transition-[background-color,transform] duration-150 hover:bg-primary-pressed active:scale-95"
      >
        {isOpen ? <X className="h-6 w-6" strokeWidth={1.75} /> : <MessageCircle className="h-6 w-6" strokeWidth={1.75} />}
      </button>

      {/* Futuristic Drawer Portal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute bottom-16 end-0 flex h-[min(520px,70dvh)] w-[calc(100vw-32px)] max-w-[380px] flex-col justify-between overflow-hidden rounded-card border border-line bg-surface shadow-float"
          >
            {/* Header section with cosmic glow */}
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <div>
                  <h3 className="text-caption text-accent font-semibold">Your AI coach</h3>
                  <span className="text-caption text-muted block">
                    Sync Mode: {profile.selectedCoach === 'jai' ? 'Jai Brotherly' : 'Jaya Nutri-sister'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveMode(activeMode === 'chat' ? 'voice' : 'chat')}
                  className="px-2.5 py-1 bg-raised hover:bg-raised rounded-lg text-caption font-semibold text-ink transition-colors border border-line cursor-pointer"
                >
                  {activeMode === 'chat' ? ' Voice' : ' Chat'}
                </button>
              </div>
            </div>

            {/* Sub-header Emotional coaching ticker */}
            <div className="bg-raised px-4 py-2 border-b border-line flex gap-2 items-center">
              <Smile className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-caption text-muted line-clamp-1 italic">Mood: {emotionalState}</span>
            </div>

            {/* Main Interactive Core */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {activeMode === 'chat' ? (
                <>
                  {aiChatHistory.map((msg, index) => {
                    const isAi = msg.sender === 'ai';
                    return (
                      <div key={msg.id || index} className={`flex gap-2.5 max-w-[85%] ${isAi ? 'self-start' : 'ml-auto flex-row-reverse'}`}>
                        <div
                          className={`p-3 rounded-2xl text-caption leading-relaxed ${
                            isAi
                              ? 'bg-surface border border-line text-ink rounded-tl-none'
                              : 'bg-primary text-on-primary rounded-tr-none shadow-card'
                          }`}
                        >
                          {msg.text}
                          <span className={`block  text-caption mt-1.5 ${isAi ? 'text-muted text-left' : 'text-primary text-right'}`}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {aiIsReplying && (
                    <div className="flex gap-2 text-caption text-primary self-start p-2">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Synthesizing metabolic suggestions...</span>
                    </div>
                  )}
                  <div ref={endRef} />
                </>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center space-y-6 px-4">
                  <div className="relative">
                    <div
                      className={`absolute -inset-4 rounded-full bg-primary-subtle  transition-all duration-1000 ${isListening ? 'scale-150 bg-primary-subtle ' : ''}`}
                    />
                    <button
                      onClick={handleSimulateVoice}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                        isListening
                          ? 'bg-danger-subtle border border-danger/40 '
                          : 'bg-primary-subtle border border-primary/30 hover:border-primary hover:bg-primary-subtle'
                      } cursor-pointer`}
                    >
                      {isListening ? <MicOff className="w-8 h-8 text-danger" /> : <Mic className="w-8 h-8 text-primary" />}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-caption font-semibold text-ink">{isListening ? 'Listening...' : 'Tap to speak'}</h4>
                    <p className="text-caption text-muted">
                      Speak naturally in Telugu/English ("Mee breakfast thinnanu"). AI detects variables automatically and maps caloric
                      density!
                    </p>
                  </div>

                  <div className="w-full flex justify-center gap-1">
                    <span className="w-1.5 h-4 bg-primary rounded-full" />
                    <span className="w-1.5 h-8 bg-accent-fill rounded-full delay-75" />
                    <span className="w-1.5 h-10 bg-primary rounded-full delay-150" />
                    <span className="w-1.5 h-6 bg-accent-fill rounded-full delay-200" />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Form input */}
            {activeMode === 'chat' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 border-t border-line bg-surface flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Ask, log meal in Tanglish, or water..."
                  className="flex-1 bg-raised border border-line rounded-xl px-3.5 py-2 text-caption text-ink focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  className="p-2 bg-primary-subtle hover:bg-primary border border-primary/30 rounded-xl text-primary hover:text-on-primary transition-all cursor-pointer"
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
