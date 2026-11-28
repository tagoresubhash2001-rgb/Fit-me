import { webhookSecret } from './secrets';

/**
 * Cashfree Payment Gateway (orders API) for the web app and the direct-download Android APK, where Google Play
 * Billing is not available. Prices always come from the server (appConfig/pricing); a plan is granted only after
 * Cashfree itself reports the order as PAID for this user, amount and currency. Missing credentials = every call is
 * refused (fail closed). Credentials (Secret Manager): CASHFREE_APP_ID, CASHFREE_CLIENT_SECRET, CASHFREE_ENV
 * ("production" or "sandbox", default sandbox). See docs/BILLING_SETUP.md.
 */
export const CASHFREE_API_VERSION = '2023-08-01';

export interface CashfreeCreds {
  appId: string;
  secret: string;
  base: string;
}

export async function cashfreeCreds(): Promise<CashfreeCreds | null> {
  const [appId, secret, env] = await Promise.all([webhookSecret('CASHFREE_APP_ID'), webhookSecret('CASHFREE_CLIENT_SECRET'), webhookSecret('CASHFREE_ENV')]);
  if (!appId || !secret) return null;
  return { appId, secret, base: env === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg' };
}

/** Order id: plan and period are encoded so the verify step never trusts the client for them. */
export function makeOrderId(uid: string, plan: string, period: string, nowMs: number): string {
  // Cashfree order ids: 3-45 chars, alphanumeric, '-' and '_'.
  return `fm_${plan[0]}${period[0]}_${uid.slice(0, 20)}_${nowMs.toString(36)}`.replace(/[^A-Za-z0-9_-]/g, '');
}

export interface CashfreeOrder {
  order_id?: string;
  order_status?: string;
  order_amount?: number;
  order_currency?: string;
  customer_details?: { customer_id?: string };
  order_tags?: Record<string, string> | null;
  payment_session_id?: string;
}

/** True only when Cashfree reports the order PAID, for this user, at the expected amount and currency. */
export function orderPaidFor(order: CashfreeOrder, expect: { uid: string; amount: number; currency: string }): boolean {
  return (
    order.order_status === 'PAID' &&
    order.customer_details?.customer_id === expect.uid &&
    order.order_tags?.uid === expect.uid &&
    order.order_currency === expect.currency &&
    typeof order.order_amount === 'number' &&
    Math.abs(order.order_amount - expect.amount) < 0.005
  );
}

const headers = (c: CashfreeCreds) => ({
  'Content-Type': 'application/json',
  'x-api-version': CASHFREE_API_VERSION,
  'x-client-id': c.appId,
  'x-client-secret': c.secret,
});

export async function createOrder(
  c: CashfreeCreds,
  o: { orderId: string; uid: string; amount: number; currency: string; plan: string; period: string; email: string | null; phone: string | null; returnUrl: string }
): Promise<CashfreeOrder> {
  const r = await fetch(`${c.base}/orders`, {
    method: 'POST',
    headers: headers(c),
    body: JSON.stringify({
      order_id: o.orderId,
      order_amount: o.amount,
      order_currency: o.currency,
      customer_details: { customer_id: o.uid, customer_email: o.email ?? undefined, customer_phone: o.phone ?? '9999999999' },
      order_meta: { return_url: `${o.returnUrl}${o.returnUrl.includes('?') ? '&' : '?'}cashfree_order={order_id}` },
      order_tags: { uid: o.uid, plan: o.plan, period: o.period },
    }),
  });
  if (!r.ok) throw new Error(`cashfree_create_${r.status}`);
  return (await r.json()) as CashfreeOrder;
}

export async function fetchOrder(c: CashfreeCreds, orderId: string): Promise<CashfreeOrder | null> {
  const r = await fetch(`${c.base}/orders/${encodeURIComponent(orderId)}`, { headers: headers(c) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`cashfree_get_${r.status}`);
  return (await r.json()) as CashfreeOrder;
}
