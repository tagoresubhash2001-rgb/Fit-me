import { describe, expect, it } from 'vitest';
import { detectDevice } from './device';

const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  ipadOld: 'Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0',
};

describe('detectDevice', () => {
  it('finds Android, iPhone and older iPads', () => {
    expect(detectDevice(UA.android)).toBe('android');
    expect(detectDevice(UA.iphone)).toBe('iphone');
    expect(detectDevice(UA.ipadOld)).toBe('ipad');
  });
  it('treats iPadOS (desktop Mac user agent with touch) as an iPad', () => {
    expect(detectDevice(UA.mac, 5)).toBe('ipad');
    expect(detectDevice(UA.mac, 1)).toBe('ipad');
    expect(detectDevice(UA.mac, 0)).toBe('desktop');
  });
  it('everything else is desktop', () => {
    expect(detectDevice(UA.windows)).toBe('desktop');
    expect(detectDevice('')).toBe('desktop');
  });
});
