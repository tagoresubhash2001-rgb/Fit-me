import { useSyncExternalStore } from 'react';

/** Form-factor breakpoints, mirrored from the Tailwind theme tokens in src/index.css. */
export const BREAKPOINTS = { tablet: 768, desktop: 1280, wide: 1536 } as const;

export type FormFactor = 'mobile' | 'tablet' | 'desktop';

export const QUERIES = {
  tablet: `(min-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  wide: `(min-width: ${BREAKPOINTS.wide}px)`,
  /** Tablet held sideways: the navigation rail replaces the bottom bar. */
  rail: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 0.02}px) and (orientation: landscape)`,
  touch: '(hover: none), (pointer: coarse)',
} as const;

export function formFactorFor(width: number): FormFactor {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

function subscribe(query: string) {
  return (cb: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const m = window.matchMedia(query);
    m.addEventListener('change', cb);
    return () => m.removeEventListener('change', cb);
  };
}

/** Live media query match. Layout should prefer CSS breakpoints; use this only where markup must differ. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribe(query),
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

export const useIsTablet = () => useMediaQuery(QUERIES.tablet);
export const useIsDesktop = () => useMediaQuery(QUERIES.desktop);
