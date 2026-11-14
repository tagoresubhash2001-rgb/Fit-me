/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

interface AIState {
  chatHistory: ChatMessage[];
  coachLoading: boolean;
  voiceActive: boolean;
  activeCoachText: string;
  nlpNotification: string | null;

  addMessage: (sender: 'user' | 'coach', text: string) => void;
  setCoachLoading: (coachLoading: boolean) => void;
  setVoiceActive: (voiceActive: boolean) => void;
  setNlpNotification: (nlpNotification: string | null) => void;
  sendChatMessage: (message: string, profile: any) => Promise<string>;
  clearHistory: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  chatHistory: (() => {
    const saved = localStorage.getItem('fit_me_chat_history');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: '1',
            sender: 'coach',
            text: 'Namskaram! Ready values configured. What are we planning to accomplish today?',
            timestamp: '08:00 AM',
          },
        ];
  })(),
  coachLoading: false,
  voiceActive: false,
  activeCoachText: '',
  nlpNotification: null,

  addMessage: (sender, text) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => {
      const updated = [...state.chatHistory, newMsg];
      localStorage.setItem('fit_me_chat_history', JSON.stringify(updated));
      return { chatHistory: updated };
    });
  },

  setCoachLoading: (coachLoading) => set({ coachLoading }),
  setVoiceActive: (voiceActive) => set({ voiceActive }),
  setNlpNotification: (nlpNotification) => set({ nlpNotification }),

  sendChatMessage: async (message, profile) => {
    get().addMessage('user', message);
    set({ coachLoading: true });

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: get().chatHistory,
          profile,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse AI endpoint response');
      }

      const data = await response.json();
      const reply = data.text || 'Pardon, can we try that again?';
      get().addMessage('coach', reply);
      set({ coachLoading: false });
      return reply;
    } catch (e) {
      console.error(e);
      const fallbackReply = "I am processing the data. Please ensure the backend is connected! Let's stay on targets!";
      get().addMessage('coach', fallbackReply);
      set({ coachLoading: false });
      return fallbackReply;
    }
  },

  clearHistory: () => {
    localStorage.removeItem('fit_me_chat_history');
    set({ chatHistory: [] });
  },
}));
