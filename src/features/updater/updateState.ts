/** In-app update decision for the direct-download Android app (app_config/android, Admin -> Releases). */
export type UpdateState = 'none' | 'optional' | 'forced';

export function updateState(installedCode: number | null, latestCode: number | null, minSupportedCode: number | null): UpdateState {
  if (!installedCode || !latestCode) return 'none';
  if (minSupportedCode && installedCode < minSupportedCode) return 'forced';
  return installedCode < latestCode ? 'optional' : 'none';
}
