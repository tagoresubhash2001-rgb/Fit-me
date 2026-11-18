import { useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

/**
 * Navigate with a shared-element transition (View Transitions API): elements with the same
 * `view-transition-name` on both screens morph into each other. Plain navigation where unsupported or
 * under reduced motion.
 */
export function navigateWithTransition(go: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || reduced()) return go();
  doc.startViewTransition(() => flushSync(go));
}

/** Subtle 3D tilt under the pointer for hero cards (desktop pointers only, never with reduced motion). */
export function useTilt(max = 3) {
  const raf = useRef(0);
  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse' || !finePointer() || reduced()) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.transform = `perspective(1000px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translate3d(0, -2px, 0)`;
      });
    },
    [max],
  );
  const onPointerLeave = useCallback((e: React.PointerEvent<HTMLElement>) => {
    cancelAnimationFrame(raf.current);
    e.currentTarget.style.transform = '';
  }, []);
  return { onPointerMove, onPointerLeave };
}
