import { describe, expect, it, vi } from 'vitest';

vi.mock('./platform', () => ({ isNative: () => false }));
import { appPath, isAppPath, legacyTarget, nativeRoute } from './appPaths';

describe('member app paths (web)', () => {
  it('maps member routes under /app', () => {
    expect(appPath('/')).toBe('/app/');
    expect(appPath('/food')).toBe('/app/food');
    expect(appPath('settings')).toBe('/app/settings');
  });
  it('recognises /app paths only', () => {
    expect(isAppPath('/app')).toBe(true);
    expect(isAppPath('/app/food')).toBe(true);
    expect(isAppPath('/apple')).toBe(false);
    expect(isAppPath('/download')).toBe(false);
  });
  it('redirects old member paths to /app, never to /download', () => {
    expect(legacyTarget('/food')).toBe('/app/food');
    expect(legacyTarget('/health/water')).toBe('/app/health/water');
    expect(legacyTarget('/settings')).toBe('/app/settings');
    expect(legacyTarget('/sign-in')).toBe('/app/');
    expect(legacyTarget('/features')).toBeNull();
    expect(legacyTarget('/')).toBeNull();
  });
  it('strips /app from native deep links', () => {
    expect(nativeRoute('/app/food')).toBe('/food');
    expect(nativeRoute('/app')).toBe('/');
    expect(nativeRoute('/health')).toBe('/health');
  });
});
