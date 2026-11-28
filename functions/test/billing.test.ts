import { allowedApkUrl, storageMediaUrl } from '../src/releases/download';
import { makeOrderId, orderPaidFor } from '../src/billing/cashfree';
import { safeReturnUrl } from '../src/billing/subscription';
import { describe, expect, it } from 'vitest';
import { createHmac } from 'crypto';
import { cashfreeSignatureValid, cashfreeUid, fromCashfree, fromRevenueCat, parseProductId, revenueCatAuthorized } from '../src/billing/mappers';
import { applyEvent, hasAccess } from '../src/billing/billing';
import { effectivePlan } from '../src/lib/plans';

const T = Date.parse('2026-11-18T00:00:00Z');
const DAY = 86400000;

describe('product ids', () => {
  it('parses store product ids with prefixes and base plans', () => {
    expect(parseProductId('pro_yearly')).toEqual({ plan: 'pro', period: 'yearly' });
    expect(parseProductId('com.sindulis.fitme.premium_quarterly')).toEqual({ plan: 'premium', period: 'quarterly' });
    expect(parseProductId('pro_monthly:base')).toEqual({ plan: 'pro', period: 'monthly' });
    expect(parseProductId('gold_weekly')).toBeNull();
  });
});

describe('RevenueCat webhook', () => {
  it('accepts only the configured Authorization header', () => {
    expect(revenueCatAuthorized('Bearer s3cret-value', 's3cret-value')).toBe(true);
    expect(revenueCatAuthorized('s3cret-value', 's3cret-value')).toBe(true);
    expect(revenueCatAuthorized('wrong', 's3cret-value')).toBe(false);
    expect(revenueCatAuthorized(undefined, 's3cret-value')).toBe(false);
  });
  it('maps a trial, the first charge, cancellation and expiry', () => {
    const trial = fromRevenueCat({ id: '1', type: 'INITIAL_PURCHASE', app_user_id: 'u', product_id: 'pro_yearly', period_type: 'TRIAL', purchased_at_ms: T, expiration_at_ms: T + 30 * DAY, store: 'PLAY_STORE' });
    expect(trial).toMatchObject({ type: 'trial_started', plan: 'pro', period: 'yearly', trialDays: 30, source: 'playstore' });
    const ent = applyEvent(null, trial!)!;
    const charged = fromRevenueCat({ id: '2', type: 'RENEWAL', app_user_id: 'u', product_id: 'pro_yearly', period_type: 'NORMAL', event_timestamp_ms: T + 30 * DAY, expiration_at_ms: T + 395 * DAY, store: 'APP_STORE' });
    const active = applyEvent(ent, charged!)!;
    expect(active.status).toBe('active');
    const cancelled = applyEvent(active, fromRevenueCat({ id: '3', type: 'CANCELLATION', app_user_id: 'u', event_timestamp_ms: T + 40 * DAY })!)!;
    expect(hasAccess(cancelled, T + 100 * DAY)).toBe(true);
    const expired = applyEvent(cancelled, fromRevenueCat({ id: '4', type: 'EXPIRATION', app_user_id: 'u', event_timestamp_ms: T + 395 * DAY })!)!;
    expect(hasAccess(expired, T + 395 * DAY)).toBe(false);
  });
  it('ignores events that do not change access', () => {
    expect(fromRevenueCat({ id: '5', type: 'TRANSFER', app_user_id: 'u' })).toBeNull();
    expect(fromRevenueCat({ id: '6', type: 'INITIAL_PURCHASE', app_user_id: 'u', product_id: 'unknown' })).toBeNull();
  });
  it('maps billing issues to a grace period', () => {
    expect(fromRevenueCat({ id: '7', type: 'BILLING_ISSUE', app_user_id: 'u', event_timestamp_ms: T, grace_period_expiration_at_ms: T + 16 * DAY })).toEqual({ type: 'billing_issue', at: T, graceEndsAt: T + 16 * DAY });
  });
});

describe('Cashfree webhook', () => {
  const secret = 'cf-test-secret';
  const body = JSON.stringify({
    type: 'SUBSCRIPTION_STATUS_CHANGED',
    event_time: '2026-11-18T00:00:00Z',
    data: { subscription_details: { subscription_id: 's1', subscription_status: 'ACTIVE', plan_details: { plan_id: 'premium_quarterly' }, subscription_tags: { uid: 'abc' } } },
  });
  const ts = '1794960000';
  const sig = createHmac('sha256', secret).update(ts + body).digest('base64');
  it('verifies the signature over timestamp + raw body', () => {
    expect(cashfreeSignatureValid(body, ts, sig, secret)).toBe(true);
    expect(cashfreeSignatureValid(body + ' ', ts, sig, secret)).toBe(false);
    expect(cashfreeSignatureValid(body, '1', sig, secret)).toBe(false);
    expect(cashfreeSignatureValid(body, ts, sig, 'other')).toBe(false);
    expect(cashfreeSignatureValid(body, undefined, sig, secret)).toBe(false);
  });
  it('maps mandate activation to the 30-day trial and payments to active periods', () => {
    const w = JSON.parse(body);
    expect(cashfreeUid(w)).toBe('abc');
    expect(fromCashfree(w, 30)).toMatchObject({ type: 'trial_started', plan: 'premium', period: 'quarterly', trialDays: 30, source: 'cashfree' });
    const paid = { ...w, type: 'SUBSCRIPTION_PAYMENT_SUCCESS', data: { ...w.data, subscription_details: { ...w.data.subscription_details, next_schedule_date: '2027-02-18T00:00:00Z' } } };
    expect(fromCashfree(paid, 30)).toMatchObject({ type: 'purchased', periodEndsAt: Date.parse('2027-02-18T00:00:00Z') });
    expect(fromCashfree({ ...w, type: 'SUBSCRIPTION_PAYMENT_FAILED' }, 30)).toMatchObject({ type: 'billing_issue' });
    const cancelled = { ...w, data: { subscription_details: { ...w.data.subscription_details, subscription_status: 'CUSTOMER_CANCELLED' } } };
    expect(fromCashfree(cancelled, 30)).toMatchObject({ type: 'cancelled' });
  });
});

describe('server plan check honours entitlement states', () => {
  it('expired gives free; cancelled keeps access until the end', () => {
    expect(effectivePlan({ plan: 'pro', status: 'expired', expiresAt: T + DAY }, T)).toBe('free');
    expect(effectivePlan({ plan: 'pro', status: 'cancelled', expiresAt: T + DAY }, T)).toBe('pro');
    expect(effectivePlan({ plan: 'pro', status: 'cancelled', expiresAt: T - 1 }, T)).toBe('free');
  });
});

describe('Cashfree orders (server-verified)', () => {
  const ok = { order_status: 'PAID', order_amount: 199, order_currency: 'INR', customer_details: { customer_id: 'u1' }, order_tags: { uid: 'u1' } };
  const expect1 = { uid: 'u1', amount: 199, currency: 'INR' };
  it('accepts only a PAID order for the same user, amount and currency', () => {
    expect(orderPaidFor(ok, expect1)).toBe(true);
    expect(orderPaidFor({ ...ok, order_status: 'ACTIVE' }, expect1)).toBe(false);
    expect(orderPaidFor({ ...ok, order_amount: 1 }, expect1)).toBe(false);
    expect(orderPaidFor({ ...ok, order_currency: 'USD' }, expect1)).toBe(false);
    expect(orderPaidFor({ ...ok, customer_details: { customer_id: 'u2' } }, expect1)).toBe(false);
    expect(orderPaidFor({ ...ok, order_tags: { uid: 'u2' } }, expect1)).toBe(false);
    expect(orderPaidFor({}, expect1)).toBe(false);
  });
  it('makes valid order ids', () => {
    const id = makeOrderId('abc/DEF.123', 'premium', 'monthly', 1_700_000_000_000);
    expect(id).toMatch(/^[A-Za-z0-9_-]{3,45}$/);
    expect(id.startsWith('fm_pm_')).toBe(true);
  });
  it('only returns to this site or the app', () => {
    expect(safeReturnUrl('https://fit-me1.web.app/app/plans?x=1')).toBe('https://fit-me1.web.app/app/plans?x=1');
    expect(safeReturnUrl('https://evil.example/steal')).toBe('https://fit-me1.web.app/app/plans');
    expect(safeReturnUrl(null)).toBe('https://fit-me1.web.app/app/plans');
    expect(safeReturnUrl('not a url')).toBe('https://fit-me1.web.app/app/plans');
  });
});

describe('Android download redirect', () => {
  it('serves only https URLs on the allowed hosts', () => {
    expect(allowedApkUrl('https://firebasestorage.googleapis.com/v0/b/x/o/releases%2FFitMe-v3.apk?alt=media')).toContain('firebasestorage');
    expect(allowedApkUrl('http://firebasestorage.googleapis.com/x.apk')).toBeNull();
    expect(allowedApkUrl('https://evil.example/x.apk')).toBeNull();
    expect(allowedApkUrl(undefined)).toBeNull();
    expect(storageMediaUrl('b', 'releases/FitMe-v3.apk')).toBe('https://firebasestorage.googleapis.com/v0/b/b/o/releases%2FFitMe-v3.apk?alt=media');
  });
});
