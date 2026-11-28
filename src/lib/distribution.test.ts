import { describe, expect, it } from 'vitest';
import { paysWithCashfree } from './distribution';

describe('payment path by distribution', () => {
  it('web and the direct APK pay with Cashfree; store builds use store billing', () => {
    expect(paysWithCashfree('web')).toBe(true);
    expect(paysWithCashfree('direct')).toBe(true);
    expect(paysWithCashfree('play')).toBe(false);
    expect(paysWithCashfree('appstore')).toBe(false);
  });
});
