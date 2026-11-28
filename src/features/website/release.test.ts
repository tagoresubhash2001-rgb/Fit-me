import { describe, expect, it } from 'vitest';
import { iosMode, parseAndroid, parseIos } from './release';

describe('release config', () => {
  it('Android: reads what is set and never invents a version', () => {
    expect(parseAndroid(undefined).version).toBeNull();
    const r = parseAndroid({ latestVersionName: 'v2.1.0', fileSizeMB: '12.4', latestVersionCode: 210 });
    expect(r.version).toBe('2.1.0');
    expect(r.sizeMB).toBe(12.4);
    expect(r.versionCode).toBe(210);
  });
  it('iOS: App Store link wins, then TestFlight, else the browser', () => {
    expect(iosMode(parseIos(undefined))).toBe('browser');
    expect(iosMode(parseIos({ testflightUrl: 'https://testflight.apple.com/join/AbC123' }))).toBe('testflight');
    expect(iosMode(parseIos({ testflightUrl: 'https://testflight.apple.com/join/x', appStoreUrl: 'https://apps.apple.com/app/id123' }))).toBe('appstore');
  });
  it('iOS: ignores links to other sites', () => {
    expect(iosMode(parseIos({ appStoreUrl: 'https://evil.example/app', testflightUrl: 'http://testflight.apple.com/x' }))).toBe('browser');
  });
});
