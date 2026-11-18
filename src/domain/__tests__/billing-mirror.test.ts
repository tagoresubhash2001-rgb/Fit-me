import { describe, expect, it } from 'vitest';
import app from '../billing.ts?raw';
import server from '../../../functions/src/billing/billing.ts?raw';

describe('billing rules are identical in the app and Cloud Functions', () => {
  it('functions/src/billing/billing.ts is an exact copy of src/domain/billing.ts', () => {
    expect(server).toBe(app);
  });
});
