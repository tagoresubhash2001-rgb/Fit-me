import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes } from 'firebase/storage';

let env: RulesTestEnvironment;
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-fitmeai',
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
});
afterAll(async () => env.cleanup());

describe('storage', () => {
  it('owner can upload and read own food photo', async () => {
    const s = env.authenticatedContext('alice').storage();
    await assertSucceeds(uploadBytes(ref(s, 'users/alice/foodPhotos/a.png'), png, { contentType: 'image/png' }));
    await assertSucceeds(getBytes(ref(s, 'users/alice/foodPhotos/a.png')));
  });
  it('others cannot read or write my photos', async () => {
    const s = env.authenticatedContext('bob').storage();
    await assertFails(getBytes(ref(s, 'users/alice/foodPhotos/a.png')));
    await assertFails(uploadBytes(ref(s, 'users/alice/foodPhotos/b.png'), png, { contentType: 'image/png' }));
  });
  it('rejects non-images and unknown folders', async () => {
    const s = env.authenticatedContext('alice').storage();
    await assertFails(uploadBytes(ref(s, 'users/alice/foodPhotos/a.txt'), png, { contentType: 'text/plain' }));
    await assertFails(uploadBytes(ref(s, 'users/alice/other/a.png'), png, { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(s, 'public/a.png'), png, { contentType: 'image/png' }));
  });
});
