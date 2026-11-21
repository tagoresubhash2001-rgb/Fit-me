import { describe, expect, it } from 'vitest';
import access from '../access.ts?raw';
import accessServer from '../../../functions/src/lib/access.ts?raw';
import appConfig from '../appConfig.ts?raw';
import appConfigServer from '../../../functions/src/lib/appConfig.ts?raw';

describe('shared rules are identical in the app and Cloud Functions', () => {
  it('functions/src/lib/access.ts is an exact copy of src/domain/access.ts', () => expect(accessServer).toBe(access));
  it('functions/src/lib/appConfig.ts is an exact copy of src/domain/appConfig.ts', () => expect(appConfigServer).toBe(appConfig));
});
