import { create } from 'zustand';

/** Per-viewer layout conveniences (not user data): kept in localStorage, safe to lose. */
const read = (k: string, d: string) => {
  try {
    return localStorage.getItem(k) ?? d;
  } catch {
    return d;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

interface UiState {
  coachOpen: boolean;
  coachWidth: number;
  sidebarCollapsed: boolean;
  shortcutsOpen: boolean;
  setCoachOpen: (v: boolean) => void;
  setCoachWidth: (w: number) => void;
  toggleSidebar: () => void;
  setShortcutsOpen: (v: boolean) => void;
}

export const COACH_MIN = 340;
export const COACH_MAX = 560;

export const useUi = create<UiState>((set) => ({
  coachOpen: false,
  coachWidth: Math.min(COACH_MAX, Math.max(COACH_MIN, Number(read('fit_me_coach_w', '400')) || 400)),
  sidebarCollapsed: read('fit_me_sidebar', 'open') === 'collapsed',
  shortcutsOpen: false,
  setCoachOpen: (coachOpen) => set({ coachOpen }),
  setCoachWidth: (w) => {
    const coachWidth = Math.round(Math.min(COACH_MAX, Math.max(COACH_MIN, w)));
    write('fit_me_coach_w', String(coachWidth));
    set({ coachWidth });
  },
  toggleSidebar: () =>
    set((s) => {
      write('fit_me_sidebar', s.sidebarCollapsed ? 'open' : 'collapsed');
      return { sidebarCollapsed: !s.sidebarCollapsed };
    }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
}));
