import { describe, expect, it } from 'vitest';
import { canTransition, TestimonialInput } from '../src/testimonials/testimonials';
import { bestMatch, parsePhotoEstimate, sniffImage } from '../src/ai/foodPhoto';
import { roleAtLeast, roleOf } from '../src/lib/staff';
import { identityKey } from '../src/account/access';
import { addPeriod } from '../src/billing/subscription';

describe('testimonial workflow', () => {
  it('authors can only submit, resubmit after changes, or withdraw', () => {
    expect(canTransition(null, 'pending', 'user')).toBe(true);
    expect(canTransition('changes_requested', 'pending', 'user')).toBe(true);
    expect(canTransition('approved', 'pending', 'user')).toBe(false);
    expect(canTransition('rejected', 'pending', 'user')).toBe(false);
    expect(canTransition('approved', 'approved', 'user')).toBe(false);
    expect(canTransition('approved', 'withdrawn', 'user')).toBe(true);
    expect(canTransition('withdrawn', 'withdrawn', 'user')).toBe(false);
  });
  it('staff review pending items; withdrawn ones can never be published again', () => {
    expect(canTransition('pending', 'approved', 'staff')).toBe(true);
    expect(canTransition('pending', 'changes_requested', 'staff')).toBe(true);
    expect(canTransition('pending', 'rejected', 'staff')).toBe(true);
    expect(canTransition('approved', 'unpublished', 'staff')).toBe(true);
    expect(canTransition('withdrawn', 'approved', 'staff')).toBe(false);
    expect(canTransition('rejected', 'approved', 'staff')).toBe(false);
    expect(canTransition('changes_requested', 'approved', 'staff')).toBe(false);
  });
  it('validates input: consent is required, text lengths, numbers', () => {
    const ok = { id: 'abcdEFGH1234', displayName: 'Ravi', testimonial: 'FitMe helped me eat better every day.', experience: 'I logged every meal for three months and lost 6 kg.', hasBefore: false, hasAfter: false, consent: true };
    expect(TestimonialInput.safeParse(ok).success).toBe(true);
    expect(TestimonialInput.safeParse({ ...ok, consent: false }).success).toBe(false);
    expect(TestimonialInput.safeParse({ ...ok, testimonial: 'short' }).success).toBe(false);
    expect(TestimonialInput.safeParse({ ...ok, id: '../x' }).success).toBe(false);
    expect(TestimonialInput.safeParse({ ...ok, details: { weightChangeKg: -6, durationWeeks: 12 } }).success).toBe(true);
    expect(TestimonialInput.safeParse({ ...ok, details: { age: 5 } }).success).toBe(false);
  });
});

describe('food photo scan', () => {
  it('checks the real image type from the bytes', () => {
    expect(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]).toString('base64'))).toBe('image/jpeg');
    expect(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64'))).toBe('image/png');
    expect(sniffImage(Buffer.from('RIFF\0\0\0\0WEBPVP8 ').toString('base64'))).toBe('image/webp');
    expect(sniffImage(Buffer.from('<svg xmlns=').toString('base64'))).toBeNull();
  });
  it('rejects model output that is not the expected shape (no invented fallback)', () => {
    expect(parsePhotoEstimate('not json')).toBeNull();
    expect(parsePhotoEstimate(JSON.stringify({ isFood: true, quality: 'good', items: [{ name: 'Idli' }] }))).toBeNull();
    const r = { min: 1, max: 2 };
    const good = parsePhotoEstimate(JSON.stringify({ isFood: true, quality: 'dark', items: [{ name: 'Idli', searchName: 'idli', portion: '2 pieces', grams: r, calories: r, proteinG: r, carbsG: r, fatG: r, fiberG: r, confidence: 'high' }] }));
    expect(good?.quality).toBe('dark');
  });
  it('matches a detected item only to a database food that shares a real word', () => {
    const foods = [
      { id: 'a', name: 'Coconut chutney', source: 'curated', per100g: { calories: 1, proteinG: 1, carbsG: 1, fatG: 1, fiberG: 1 }, servings: [] },
      { id: 'b', name: 'Masala dosa', aliases: ['masala dosai'], source: 'curated', per100g: { calories: 1, proteinG: 1, carbsG: 1, fatG: 1, fiberG: 1 }, servings: [] },
    ];
    expect(bestMatch(foods, 'masala dosa')?.id).toBe('b');
    expect(bestMatch(foods, 'dosai')?.id).toBe('b');
    expect(bestMatch(foods, 'pizza')).toBeNull();
  });
});

describe('staff roles and identity', () => {
  it('roles come only from the custom claim, ranked', () => {
    expect(roleOf({ role: 'admin' })).toBe('admin');
    expect(roleOf({ role: 'owner' })).toBeNull();
    expect(roleOf({ admin: true })).toBeNull();
    expect(roleAtLeast('superAdmin', 'admin')).toBe(true);
    expect(roleAtLeast('moderator', 'admin')).toBe(false);
    expect(roleAtLeast(null, 'moderator')).toBe(false);
  });
  it('one set of free stages per person: same verified email gives the same key, unverified gives none', () => {
    const a = identityKey({ email: 'Ravi@Example.com', emailVerified: true });
    expect(a).toBe(identityKey({ email: 'ravi@example.com ', emailVerified: true }));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(identityKey({ email: 'x@y.z', emailVerified: false })).toBeNull();
    expect(identityKey({ email: 'x@gmail.com', emailVerified: false, providerData: [{ providerId: 'google.com' }] })).not.toBeNull();
    expect(identityKey({ phoneNumber: '+919999999999' })).toMatch(/^[0-9a-f]{64}$/);
  });
  it('billing periods end on the same day of a later month', () => {
    const at = Date.UTC(2026, 0, 15);
    expect(new Date(addPeriod(at, 'monthly')).toISOString().slice(0, 10)).toBe('2026-02-15');
    expect(new Date(addPeriod(at, 'quarterly')).toISOString().slice(0, 10)).toBe('2026-04-15');
    expect(new Date(addPeriod(at, 'yearly')).toISOString().slice(0, 10)).toBe('2027-01-15');
  });
});
