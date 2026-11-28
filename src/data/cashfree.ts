import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { appUrl } from '../lib/appPaths';

type Checkout = { orderId: string; paymentSessionId: string | null; environment: 'sandbox' | 'production' };
type CashfreeSdk = { checkout: (o: { paymentSessionId: string; redirectTarget: '_self' }) => Promise<unknown> };
declare global {
  interface Window {
    Cashfree?: (o: { mode: 'sandbox' | 'production' }) => CashfreeSdk;
  }
}

function loadSdk(): Promise<void> {
  if (window.Cashfree) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('cashfree_sdk'));
    document.head.appendChild(s);
  });
}

/**
 * Cashfree checkout (web app and direct APK). Returns 'not_live' when payments are not switched on or not
 * configured on the server, so the caller can fall back to the trial / interest flow. On success the page
 * goes to Cashfree and comes back to /plans?cashfree_order=<id>, where verifyCashfreeReturn() confirms it.
 */
export async function startCashfreeCheckout(plan: 'premium' | 'pro', period: 'monthly' | 'quarterly' | 'yearly'): Promise<'redirected' | 'not_live'> {
  let r: Checkout;
  try {
    r = (await httpsCallable(functions(), 'createCashfreeCheckout')({ plan, period, returnUrl: appUrl('/plans') })).data as Checkout;
  } catch (e) {
    const msg = String((e as Error).message);
    if (/payments_not_live|payments_not_configured|cashfree_inr_only/.test(msg)) return 'not_live';
    throw e;
  }
  if (!r.paymentSessionId) return 'not_live';
  await loadSdk();
  await window.Cashfree!({ mode: r.environment }).checkout({ paymentSessionId: r.paymentSessionId, redirectTarget: '_self' });
  return 'redirected';
}

/** After returning from Cashfree: the server checks the order with Cashfree before any plan is granted. */
export async function verifyCashfreeReturn(orderId: string): Promise<boolean> {
  const r = (await httpsCallable(functions(), 'verifyCashfreePayment')({ orderId })).data as { verified: boolean };
  return r.verified;
}
