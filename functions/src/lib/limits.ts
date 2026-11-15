import { db } from './admin';
import type { Plan } from './plans';

import { DEFAULT_LIMITS } from './limitDefaults';
export { DEFAULT_LIMITS };

export async function dailyLimit(key: string, plan: Plan): Promise<number> {
  try {
    const snap = await db().doc('appConfig/limits').get();
    const v = snap.exists ? snap.get(`${key}.${plan}`) : undefined;
    if (typeof v === 'number') return v;
  } catch {
    /* fall back to defaults */
  }
  return DEFAULT_LIMITS[key]?.[plan] ?? 0;
}
