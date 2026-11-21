/**
 * One step count per day, never summed across sources (a watch and the phone count the same walk). The single
 * highest-priority source wins: the health platform (Apple Health / Health Connect already merges phone and watch),
 * then a cloud wearable, then this phone's own counter, then a manual entry. Ties within a source take the larger.
 */
export interface StepRow {
  id: string;
  date: string;
  steps: number;
  source?: string;
  deviceName?: string;
}

export type StepSource = 'health' | 'cloud' | 'phone' | 'manual';

export function stepSourceOf(row: Pick<StepRow, 'id' | 'source'>): StepSource {
  if (row.id.startsWith('device-')) return 'health';
  if (row.id.startsWith('cloud-')) return 'cloud';
  if (row.id.startsWith('phone-')) return 'phone';
  return 'manual';
}

const PRIORITY: StepSource[] = ['health', 'cloud', 'phone', 'manual'];

export function pickDaily(rows: StepRow[], date: string): { steps: number; source: StepSource | null; row: StepRow | null } {
  let best: StepRow | null = null;
  let bestRank = Infinity;
  for (const r of rows) {
    if (r.date !== date || !(r.steps > 0)) continue;
    const rank = PRIORITY.indexOf(stepSourceOf(r));
    if (rank < bestRank || (rank === bestRank && best && r.steps > best.steps)) {
      best = r;
      bestRank = rank;
    }
  }
  return { steps: best?.steps ?? 0, source: best ? stepSourceOf(best) : null, row: best };
}

/** Walking stride from height (0.415 x height, a standard estimate); 0.762 m when height is unknown. */
export function strideMeters(heightCm?: number | null): number {
  return heightCm && heightCm > 80 && heightCm < 250 ? (heightCm * 0.415) / 100 : 0.762;
}

/** Distance (km) and walking energy (kcal, about 0.5 kcal per kg per 1,000 steps) for a step count. */
export function stepStats(steps: number, heightCm?: number | null, weightKg?: number | null) {
  const km = (steps * strideMeters(heightCm)) / 1000;
  const kcal = Math.round(steps * 0.0005 * (weightKg && weightKg > 20 ? weightKg : 70));
  return { km: Math.round(km * 100) / 100, kcal };
}
