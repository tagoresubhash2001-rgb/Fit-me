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
}: {
  points: ChartPoint[];
  target?: number;
  colorClass?: string;
  height?: number;
  ariaLabel: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, target ?? 0, ...points.map((p) => p.value)) * 1.1;
  const w = 100 / Math.max(1, points.length);
  return (
    <figure aria-label={ariaLabel} className="w-full">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-32 w-full" role="img" aria-hidden>
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
          <span key={i} className="flex-1 truncate text-center text-caption text-muted">
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
