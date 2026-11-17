import React from 'react';
import { cn } from './cn';

export interface ChartPoint {
  label: string;
  value: number;
}

/** Simple accessible bar chart (SVG). Colours come from token classes. */
export function BarChart({
  points,
  target,
  colorClass = 'fill-primary',
  height = 120,
  ariaLabel,
  formatValue = (v) => String(v),
  targetLabel,
}: {
  points: ChartPoint[];
  target?: number;
  colorClass?: string;
  height?: number;
  ariaLabel: string;
  formatValue?: (v: number) => string;
  /** Legend text for the dashed target line. */
  targetLabel?: string;
}) {
  const top = Math.max(1, target ?? 0, ...points.map((p) => p.value));
  const max = top * 1.1;
  const w = 100 / Math.max(1, points.length);
  // Thin the x labels so they never collide (7 shown at most on phones, up to 15 on wide screens).
  const step = points.length <= 7 ? 1 : Math.ceil(points.length / 7);
  const stepWide = points.length <= 15 ? 1 : Math.ceil(points.length / 15);
  return (
    <figure aria-label={ariaLabel} className="w-full">
      <div className="mb-1 flex items-center justify-between gap-2 text-caption text-muted">
        <span className="tabular-nums">{formatValue(Math.round(top * 10) / 10)}</span>
        {target !== undefined && targetLabel && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t-2 border-dashed border-muted" aria-hidden />
            {targetLabel}
          </span>
        )}
      </div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-32 w-full md:h-40 xl:h-48" role="img" aria-hidden>
        {target !== undefined && (
          <line
            x1="0"
            x2="100"
            y1={height - (target / max) * height}
            y2={height - (target / max) * height}
            className="stroke-line"
            strokeDasharray="2 2"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {points.map((p, i) => {
          const h = (p.value / max) * height;
          return (
            <rect
              key={i}
              x={i * w + w * 0.18}
              width={w * 0.64}
              y={height - h}
              height={Math.max(h, p.value > 0 ? 1.5 : 0)}
              rx="1.2"
              className={cn(colorClass, target !== undefined && p.value >= target ? '' : 'opacity-70')}
            />
          );
        })}
      </svg>
      <div className="mt-1 flex">
        {points.map((p, i) => (
          <span key={i} className={cn('min-w-0 flex-1 overflow-hidden text-center text-caption whitespace-nowrap text-muted', i % step !== 0 && 'invisible', i % stepWide === 0 && 'xl:visible')}>
            {p.label}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">{points.map((p) => `${p.label}: ${formatValue(p.value)}`).join(', ')}</figcaption>
    </figure>
  );
}

/** Line chart for trends such as weight; `secondary` draws a second (e.g. moving average) line. */
export function LineChart({
  points,
  secondary,
  ariaLabel,
  height = 120,
}: {
  points: ChartPoint[];
  secondary?: ChartPoint[];
  ariaLabel: string;
  height?: number;
}) {
  const all = [...points, ...(secondary ?? [])].map((p) => p.value);
  if (!points.length) return null;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = Math.max(0.5, max - min);
  const y = (v: number) => height - 8 - ((v - min) / span) * (height - 16);
  const x = (i: number, n: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const path = (ps: ChartPoint[]) => ps.map((p, i) => `${i ? 'L' : 'M'}${x(i, ps.length)},${y(p.value)}`).join(' ');
  return (
    <figure aria-label={ariaLabel} className="w-full">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-32 w-full" aria-hidden>
        <path d={path(points)} fill="none" className="stroke-muted" strokeWidth="1.2" vectorEffect="non-scaling-stroke" opacity="0.5" />
        {secondary && (
          <path d={path(secondary)} fill="none" className="stroke-primary" strokeWidth="2.25" vectorEffect="non-scaling-stroke" />
        )}
        {(() => {
          // Dot on the latest value so a single entry is still visible (round cap keeps it circular under scaling).
          const ps = secondary?.length ? secondary : points;
          const last = ps[ps.length - 1];
          const cx = x(ps.length - 1, ps.length);
          const cy = y(last.value);
          return (
            <path
              d={`M${cx},${cy} L${cx},${cy}`}
              className="stroke-primary"
              strokeWidth="8"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })()}
      </svg>
      <figcaption className="sr-only">{points.map((p) => `${p.label}: ${p.value}`).join(', ')}</figcaption>
    </figure>
  );
}
