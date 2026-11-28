import React from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { initI18n } from '../../../lib/i18n';
import { useSession } from '../../../data/session';
import { DEFAULT_PRICING, type PricingConfig } from '../../../domain/billing';

const calls: Array<{ name: string; data: unknown }> = [];
const responses: Record<string, unknown> = {};
vi.mock('firebase/functions', () => ({
  httpsCallable: (_f: unknown, name: string) => async (data: unknown) => {
    calls.push({ name, data });
    return { data: responses[name] ?? {} };
  },
}));
vi.mock('../../../lib/firebase', () => ({ functions: () => ({}), db: () => ({}) }));
let pricing: PricingConfig = DEFAULT_PRICING;
vi.mock('../../../data/pricing', () => ({ usePricing: () => pricing }));
vi.mock('../../../data/appConfig', async () => {
  const c = await import('../../../domain/appConfig');
  return { usePlanCatalog: () => c.DEFAULT_PLAN_CATALOG, useFeatures: () => c.DEFAULT_FEATURES, useContent: () => c.DEFAULT_CONTENT, useAppSettings: () => c.DEFAULT_APP_SETTINGS };
});

const PlansScreen = (await import('../PlansScreen')).default;
const DAY = 86400000;

beforeAll(async () => {
  // Reduced motion: prices switch instantly so the assertions see final values.
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  await initI18n();
});
beforeEach(() => {
  calls.length = 0;
  pricing = DEFAULT_PRICING;
  useSession.setState({
    user: { uid: 'u1' } as never,
    profile: { country: 'IN', currency: 'INR', name: 'Ravi' } as never,
    plan: 'free',
    entitlement: null,
  });
});
const renderPlans = (path = '/plans') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PlansScreen />
    </MemoryRouter>,
  );

describe('Plans screen', () => {
  it('shows India launch prices and animates to period totals', async () => {
    const u = userEvent.setup();
    renderPlans();
    expect(screen.getByText('₹199 billed monthly')).toBeInTheDocument();
    expect(screen.getByText('₹399 billed monthly')).toBeInTheDocument();
    await u.click(screen.getByRole('tab', { name: /3 months/ }));
    expect(screen.getByText('₹478 billed every 3 months, about ₹159 a month')).toBeInTheDocument();
    expect(screen.getByText('₹958 billed every 3 months, about ₹319 a month')).toBeInTheDocument();
    await u.click(screen.getByRole('tab', { name: /Yearly/ }));
    expect(screen.getByText('₹1,433 billed yearly, about ₹119 a month')).toBeInTheDocument();
    expect(screen.getByText('₹2,873 billed yearly, about ₹239 a month')).toBeInTheDocument();
    expect(screen.getAllByText('30 days free')).toHaveLength(2);
    expect(screen.getByText('Continue with Free')).toBeInTheDocument();
  });

  it('strikes through the regular price only with an offer end date', () => {
    const { unmount } = renderPlans();
    expect(document.querySelector('s')).toBeNull();
    unmount();
    pricing = { ...DEFAULT_PRICING, markets: { ...DEFAULT_PRICING.markets, IN: { ...DEFAULT_PRICING.markets.IN, offerEndsAt: new Date(Date.now() + 30 * DAY).toISOString() } } };
    renderPlans();
    const struck = [...document.querySelectorAll('s')].map((s) => s.textContent);
    expect(struck).toEqual(['₹299', '₹599']);
    expect(screen.getAllByText(/Launch offer, ends/)).toHaveLength(2);
  });

  it('shows a clear summary before starting the trial, then calls the server', async () => {
    const u = userEvent.setup();
    responses.startTrial = { status: 'trialing', trialEndsAt: Date.now() + 30 * DAY };
    renderPlans('/plans?period=yearly');
    await u.click(within(document.getElementById('plan-pro')!).getByRole('button', { name: 'Start 30-day free trial' }));
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByText('Your free trial')).toBeInTheDocument();
    expect(within(sheet).getByText('Pro')).toBeInTheDocument();
    expect(within(sheet).getByText('Yearly')).toBeInTheDocument();
    expect(within(sheet).getByText('₹2,873 every year')).toBeInTheDocument();
    expect(within(sheet).getByText(/Cancel anytime before/)).toBeInTheDocument();
    await u.click(within(sheet).getByRole('button', { name: 'Start free trial' }));
    // Web: Cashfree is tried first; with payments not live (no payment session) the trial flow runs.
    expect(calls.map((c) => c.name)).toEqual(['createCashfreeCheckout', 'startTrial']);
    expect(calls[0].data).toMatchObject({ plan: 'pro', period: 'yearly' });
    expect(calls[1].data).toEqual({ plan: 'pro', period: 'yearly' });
  });

  it('subscribed users see their plan with change and cancel', async () => {
    const u = userEvent.setup();
    useSession.setState({ plan: 'pro', entitlement: { plan: 'pro', status: 'trialing', period: 'yearly', source: 'test', expiresAt: Date.now() + 20 * DAY, trialEndsAt: Date.now() + 20 * DAY, willRenew: true, trialUsed: true } });
    renderPlans();
    expect(screen.getByText(/Free trial until/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /free trial/ })).toBeNull();
    await u.click(screen.getByRole('button', { name: 'Cancel subscription' }));
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByText(/You keep Pro until/)).toBeInTheDocument();
    await u.click(within(sheet).getByRole('button', { name: 'Cancel subscription' }));
    expect(calls).toEqual([{ name: 'manageSubscription', data: { action: 'cancel' } }]);
  });

  it('after cancelling, offers Keep my plan and does not point to a missing Change plan button', () => {
    useSession.setState({ plan: 'pro', entitlement: { plan: 'pro', status: 'cancelled', period: 'yearly', source: 'test', expiresAt: Date.now() + 20 * DAY, trialEndsAt: Date.now() + 20 * DAY, willRenew: false, trialUsed: true } });
    renderPlans();
    expect(screen.getByRole('button', { name: 'Keep my plan' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change plan' })).toBeNull();
    expect(screen.getByText('To switch, keep your plan first')).toBeInTheDocument();
    expect(screen.queryByText('Use Change plan above')).toBeNull();
  });

  it('during the free stages: no second trial, free until the stage ends, first charge then', async () => {
    const u = userEvent.setup();
    const now = Date.now();
    useSession.setState({
      plan: 'premium',
      subscriptionPlan: 'free',
      access: { createdAtMs: now - 10 * DAY, welcomeEndsAtMs: now - 3 * DAY, trialEndsAtMs: now + 27 * DAY, welcomePlan: 'pro', trialPlan: 'premium', eligible: true, configVersion: 1 },
    } as never);
    renderPlans('/plans?period=monthly');
    expect(screen.queryByText('30 days free')).toBeNull();
    expect(screen.getAllByText(/^Free until /)).toHaveLength(3); // page subtitle and both plan badges
    await u.click(within(document.getElementById('plan-pro')!).getByRole('button', { name: 'Choose Pro' }));
    const sheet = screen.getByRole('dialog');
    const end = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(now + 27 * DAY));
    expect(within(sheet).getByText(`Free until ${end}`)).toBeInTheDocument();
    expect(within(sheet).getAllByText(end).length).toBeGreaterThan(0);
    useSession.setState({ access: null } as never);
  });

  it('offers a plain choice (no trial) once the trial has been used', () => {
    useSession.setState({ entitlement: { plan: 'pro', status: 'expired', period: 'monthly', source: 'test', expiresAt: Date.now() - DAY, trialEndsAt: Date.now() - DAY, willRenew: false, trialUsed: true } });
    renderPlans();
    expect(screen.queryByText('30 days free')).toBeNull();
    expect(screen.getByRole('button', { name: 'Choose Pro' })).toBeInTheDocument();
  });
});
