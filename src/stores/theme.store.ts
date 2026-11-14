/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

export type VisualTheme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: VisualTheme;
  setTheme: (theme: VisualTheme) => void;
  applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem('fit_me_theme') as VisualTheme) || 'system',
  
  setTheme: (theme) => {
    localStorage.setItem('fit_me_theme', theme);
    set({ theme });
    get().applyTheme();
  },

  applyTheme: () => {
    const { theme } = get();
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else if (theme === 'dark') {
      document.documentElement.classList.remove('light');
    } else {
      const systemPrefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      if (systemPrefersLight) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  }
}));
