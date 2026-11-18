import React, { useLayoutEffect, useState } from 'react';
import { cn } from './cn';

/**
 * One indicator that slides to the active item of a navigation list (transform only; instant under
 * reduced motion). The container must be `relative`; the active item is found with `selector`.
 */
export function SlidingPill({ container, selector, watch, className }: { container: React.RefObject<HTMLElement | null>; selector: string; watch: unknown; className?: string }) {
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    const measure = () => {
      const target = el.querySelector<HTMLElement>(selector);
      if (!target) return setBox(null);
      const a = el.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      setBox({ x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [container, selector, watch]);
  if (!box) return null;
  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute top-0 left-0 z-0 transition-[transform,width,height] duration-300 ease-[var(--ease-spring)] motion-reduce:transition-none', className)}
      style={{ width: box.w, height: box.h, transform: `translate3d(${box.x}px, ${box.y}px, 0)` }}
    />
  );
}
