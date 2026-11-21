/**
 * GPS route cleaning and summary for walks, runs and rides. Filtering ideas follow Traccar's location handling
 * (Apache-2.0, used as a reference only): drop fixes with poor accuracy, drop jumps that imply an impossible speed for
 * the activity, and ignore jitter while standing still. Pure functions, unit tested.
 */
export type RouteActivity = 'walk' | 'run' | 'ride';

export interface Fix {
  lat: number;
  lng: number;
  /** Horizontal accuracy in metres (smaller is better). */
  accuracy: number;
  t: number;
}

export const ACTIVITY = {
  walk: { maxSpeed: 3.5, met: 3.5 },
  run: { maxSpeed: 8, met: 9.8 },
  ride: { maxSpeed: 25, met: 7.5 },
} as const satisfies Record<RouteActivity, { maxSpeed: number; met: number }>;

export const MAX_ACCURACY_M = 35;
const MIN_MOVE_M = 3;

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Accept or reject the next fix given the last accepted one. */
export function acceptFix(last: Fix | null, next: Fix, activity: RouteActivity): boolean {
  if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng) || Math.abs(next.lat) > 90 || Math.abs(next.lng) > 180) return false;
  if (!(next.accuracy > 0) || next.accuracy > MAX_ACCURACY_M) return false;
  if (!last) return true;
  if (next.t <= last.t) return false;
  const d = haversine(last, next);
  if (d < Math.max(MIN_MOVE_M, Math.min(next.accuracy, last.accuracy) / 2)) return false; // standing still / jitter
  const speed = d / ((next.t - last.t) / 1000);
  return speed <= ACTIVITY[activity].maxSpeed * 1.5; // allow short sprints and descents, reject jumps
}

export function distanceMeters(points: Fix[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversine(points[i - 1], points[i]);
  return d;
}

/** Keeps at most `max` points, evenly spaced, always including the first and last. */
export function thin<T>(points: T[], max = 400): T[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
}

/** Energy: MET x body weight (kg) x hours. */
export function routeCalories(activity: RouteActivity, movingMs: number, weightKg?: number | null): number {
  return Math.round(ACTIVITY[activity].met * (weightKg && weightKg > 20 ? weightKg : 70) * (movingMs / 3600000));
}

/** Pace in seconds per km (walk/run) and speed in km/h (ride). */
export function paceSecPerKm(meters: number, movingMs: number): number | null {
  return meters > 20 ? Math.round(movingMs / 1000 / (meters / 1000)) : null;
}
