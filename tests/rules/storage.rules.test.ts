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

const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]);

describe('profile photos', () => {
  it('owner uploads a JPEG avatar with the expected name; others cannot read or write it', async () => {
    const s = env.authenticatedContext('alice').storage();
    await assertSucceeds(uploadBytes(ref(s, 'users/alice/profile/avatar-1794900000000.jpg'), jpg, { contentType: 'image/jpeg' }));
    await assertSucceeds(getBytes(ref(s, 'users/alice/profile/avatar-1794900000000.jpg')));
    await assertFails(getBytes(ref(env.authenticatedContext('bob').storage(), 'users/alice/profile/avatar-1794900000000.jpg')));
    await assertFails(uploadBytes(ref(env.authenticatedContext('bob').storage(), 'users/alice/profile/avatar-1794900000001.jpg'), jpg, { contentType: 'image/jpeg' }));
  });
  it('rejects other names, types and sizes over 5 MB', async () => {
    const s = env.authenticatedContext('alice').storage();
    await assertFails(uploadBytes(ref(s, 'users/alice/profile/me.jpg'), jpg, { contentType: 'image/jpeg' }));
    await assertFails(uploadBytes(ref(s, 'users/alice/profile/avatar-1794900000000.jpg'), png, { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(s, 'users/alice/profile/avatar-1794900000002.jpg'), new Uint8Array(5 * 1024 * 1024 + 10), { contentType: 'image/jpeg' }));
  });
});

describe('testimonial photos', () => {
  it('author uploads before/after; staff can read; strangers and signed-out users cannot', async () => {
    const s = env.authenticatedContext('alice').storage();
    await assertSucceeds(uploadBytes(ref(s, 'testimonials/alice/t1/before.jpg'), jpg, { contentType: 'image/jpeg' }));
    await assertSucceeds(getBytes(ref(env.authenticatedContext('mod', { role: 'moderator' }).storage(), 'testimonials/alice/t1/before.jpg')));
    await assertFails(getBytes(ref(env.authenticatedContext('bob').storage(), 'testimonials/alice/t1/before.jpg')));
    await assertFails(getBytes(ref(env.unauthenticatedContext().storage(), 'testimonials/alice/t1/before.jpg')));
    await assertFails(uploadBytes(ref(s, 'testimonials/alice/t1/other.jpg'), jpg, { contentType: 'image/jpeg' }));
    await assertFails(uploadBytes(ref(env.authenticatedContext('bob').storage(), 'testimonials/alice/t1/after.jpg'), jpg, { contentType: 'image/jpeg' }));
  });
  it('published copies: anyone reads, no client writes', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), 'public/testimonials/t1/before.jpg'), jpg, { contentType: 'image/jpeg' });
    });
    await assertSucceeds(getBytes(ref(env.unauthenticatedContext().storage(), 'public/testimonials/t1/before.jpg')));
    await assertFails(uploadBytes(ref(env.authenticatedContext('mod', { role: 'superAdmin' }).storage(), 'public/testimonials/t2/before.jpg'), jpg, { contentType: 'image/jpeg' }));
  });
});

describe('admin media library', () => {
  it('content editors upload images; finance and members cannot; anyone reads', async () => {
    const img = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const editor = env.authenticatedContext('ed', { role: 'content' }).storage();
    const finance = env.authenticatedContext('fin', { role: 'finance' }).storage();
    await assertSucceeds(uploadBytes(ref(editor, 'public/media/banner.jpg'), img, { contentType: 'image/jpeg' }));
    await assertFails(uploadBytes(ref(finance, 'public/media/x.jpg'), img, { contentType: 'image/jpeg' }));
    await assertFails(uploadBytes(ref(env.authenticatedContext('alice').storage(), 'public/media/y.jpg'), img, { contentType: 'image/jpeg' }));
    await assertFails(uploadBytes(ref(editor, 'public/media/page.html'), img, { contentType: 'text/html' }));
    await assertSucceeds(getBytes(ref(env.unauthenticatedContext().storage(), 'public/media/banner.jpg')));
  });
});
