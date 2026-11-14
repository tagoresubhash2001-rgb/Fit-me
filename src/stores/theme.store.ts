import { create } from 'zustand';

export type VisualTheme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: VisualTheme;
  setTheme: (theme: VisualTheme) => void;
  applyTheme: () => void;
}

const STORAGE_KEY = 'fit_me_theme';

function readStoredTheme(): VisualTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'dark' || v === 'system' || v === 'light' ? v : 'light';
  } catch {
    return 'light';
  }
}

/** Light mode is the default experience (PRD section 12). Dark mode is opt-in. */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readStoredTheme(),

  setTheme: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable: theme still applies for this session */
    }
    set({ theme });
    get().applyTheme();
  },

  applyTheme: () => {
    const { theme } = get();
    const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', dark);
  },
}));
