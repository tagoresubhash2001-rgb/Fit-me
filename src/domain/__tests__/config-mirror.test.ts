import { describe, expect, it } from 'vitest';
import access from '../access.ts?raw';
import accessServer from '../../../functions/src/lib/access.ts?raw';
import appConfig from '../appConfig.ts?raw';
import appConfigServer from '../../../functions/src/lib/appConfig.ts?raw';
import policy from '../policy.ts?raw';
import policyServer from '../../../functions/src/lib/policy.ts?raw';
import accessSchema from '../accessSchema.ts?raw';
import accessSchemaServer from '../../../functions/src/lib/accessSchema.ts?raw';
import policySchema from '../policySchema.ts?raw';
import policySchemaServer from '../../../functions/src/lib/policySchema.ts?raw';
import roles from '../adminRoles.ts?raw';
import rolesServer from '../../../functions/src/lib/adminRoles.ts?raw';

describe('shared rules are identical in the app and Cloud Functions', () => {
  it('functions/src/lib/access.ts is an exact copy of src/domain/access.ts', () => expect(accessServer).toBe(access));
  it('functions/src/lib/policy.ts is an exact copy of src/domain/policy.ts', () => expect(policyServer).toBe(policy));
  it('functions/src/lib/accessSchema.ts is an exact copy of src/domain/accessSchema.ts', () => expect(accessSchemaServer).toBe(accessSchema));
  it('functions/src/lib/policySchema.ts is an exact copy of src/domain/policySchema.ts', () => expect(policySchemaServer).toBe(policySchema));
  it('functions/src/lib/adminRoles.ts is an exact copy of src/domain/adminRoles.ts', () => expect(rolesServer).toBe(roles));
  it('functions/src/lib/appConfig.ts is an exact copy of src/domain/appConfig.ts', () => expect(appConfigServer).toBe(appConfig));
});
