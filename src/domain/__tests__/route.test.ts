import { describe, expect, it } from 'vitest';
import { acceptFix, distanceMeters, haversine, paceSecPerKm, routeCalories, thin, type Fix } from '../route';

const base = { lat: 17.385, lng: 78.4867 }; // Hyderabad
const north = (m: number) => m / 111320; // degrees of latitude for m metres
const fix = (dy: number, t: number, accuracy = 8): Fix => ({ lat: base.lat + north(dy), lng: base.lng, accuracy, t });

describe('route cleaning', () => {
  it('measures distance on the sphere', () => {
    expect(haversine(base, { lat: base.lat + north(1000), lng: base.lng })).toBeCloseTo(1000, -1);
  });
  it('accepts a normal walking step and rejects poor accuracy', () => {
    expect(acceptFix(fix(0, 0), fix(14, 10_000), 'walk')).toBe(true); // 1.4 m/s
    expect(acceptFix(fix(0, 0), fix(14, 10_000, 80), 'walk')).toBe(false);
  });
  it('drops GPS jumps that are impossible for the activity', () => {
    expect(acceptFix(fix(0, 0), fix(200, 10_000), 'walk')).toBe(false); // 20 m/s while walking
    expect(acceptFix(fix(0, 0), fix(200, 10_000), 'ride')).toBe(true);
  });
  it('ignores jitter while standing still and out-of-order fixes', () => {
    expect(acceptFix(fix(0, 0), fix(1, 5_000), 'walk')).toBe(false);
    expect(acceptFix(fix(0, 10_000), fix(20, 5_000), 'walk')).toBe(false);
    expect(acceptFix(null, { lat: 200, lng: 0, accuracy: 5, t: 0 }, 'walk')).toBe(false);
  });
  it('sums the cleaned route and estimates pace and energy', () => {
    const pts = [fix(0, 0), fix(500, 360_000), fix(1000, 720_000)];
    expect(distanceMeters(pts)).toBeCloseTo(1000, -1);
    expect(paceSecPerKm(1000, 720_000)).toBe(720); // 12 min/km
    expect(routeCalories('walk', 3_600_000, 70)).toBe(245);
  });
  it('thins long routes but keeps both ends', () => {
    const pts = Array.from({ length: 1000 }, (_, i) => i);
    const t = thin(pts, 400);
    expect(t).toHaveLength(400);
    expect(t[0]).toBe(0);
    expect(t[399]).toBe(999);
  });
});
