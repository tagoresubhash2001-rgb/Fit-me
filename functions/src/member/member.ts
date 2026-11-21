import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../lib/admin';
import { callableOptions, requireAuth } from '../lib/callable';
import { consume } from '../lib/rateLimit';
import { requireEnabled } from '../lib/features';
import { applyCoupon, Coupon, marketFor, PAID_PLANS, PERIODS, quote } from '../billing/billing';
import { loadPricing } from '../billing/store';

/**
 * Small member actions in one callable: diagnostics report, contact message, coupon check, push registration.
 * Everything is validated and rate limited; nothing here can change a plan or a payment.
 */
const opts = callableOptions({ timeoutSeconds: 30 });

const Diagnostics = z.object({
  app: z.object({ version: z.string().max(20), platform: z.enum(['web', 'android', 'ios']), build: z.string().max(40).optional() }),
  device: z.object({ model: z.string().max(80).optional(), os: z.string().max(40).optional(), language: z.string().max(12).optional(), timezone: z.string().max(60).optional() }),
  permissions: z.record(z.string().max(30), z.string().max(20)),
  sources: z.object({
    phoneSteps: z.object({ supported: z.boolean(), enabled: z.boolean(), backend: z.string().max(30).nullable(), lastSyncAt: z.number().nullable() }).nullable(),
    health: z.object({ availability: z.string().max(20), connected: z.boolean(), granted: z.array(z.string().max(40)).max(30), lastSyncAt: z.number().nullable() }).nullable(),
    batteryOptimised: z.boolean().nullable(),
  }),
  /** Counts only, never health values. */
  counts: z.record(z.string().max(30), z.number().int().min(0).max(1_000_000)).default({}),
  errors: z.array(z.object({ at: z.number(), where: z.string().max(60), message: z.string().max(300) })).max(30).default([]),
  note: z.string().max(500).optional(),
});

const Contact = z.object({ topic: z.enum(['help', 'bug', 'billing', 'feedback', 'other']), message: z.string().trim().min(5).max(3000), email: z.string().email().optional() });
const CouponCheck = z.object({ code: z.string().trim().toUpperCase().pipe(z.string().regex(/^[A-Z0-9_-]{3,24}$/)), plan: z.enum(PAID_PLANS), period: z.enum(PERIODS), country: z.string().regex(/^[A-Z]{2}$/) });
const Push = z.object({ token: z.string().min(20).max(400), platform: z.enum(['android', 'ios', 'web']), remove: z.boolean().default(false) });

export const memberAction = onCall(opts, async (req: CallableRequest<{ action?: string; data?: unknown }>) => {
  const uid = await requireAuth(req);
  const action = String(req.data?.action ?? '');
  const data = req.data?.data ?? {};
  switch (action) {
    case 'diagnostics.send': {
      await requireEnabled('diagnostics');
      const d = Diagnostics.safeParse(data);
      if (!d.success) throw new HttpsError('invalid-argument', 'bad_request');
      await consume(uid, 'diagnostics', 10);
      const ref = await db().collection('diagnostics').add({ uid, email: req.auth?.token.email ?? null, ...d.data, createdAt: FieldValue.serverTimestamp() });
      return { id: ref.id };
    }
    case 'contact.send': {
      await requireEnabled('contact');
      const c = Contact.safeParse(data);
      if (!c.success) throw new HttpsError('invalid-argument', 'bad_request');
      await consume(uid, 'contact', 5);
      const ref = await db().collection('contactMessages').add({ uid, email: c.data.email ?? req.auth?.token.email ?? null, topic: c.data.topic, message: c.data.message, status: 'open', replies: [], createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return { id: ref.id };
    }
    case 'coupon.check': {
      const c = CouponCheck.safeParse(data);
      if (!c.success) throw new HttpsError('invalid-argument', 'bad_request');
      await consume(uid, 'coupon', 30);
      const snap = await db().doc(`coupons/${c.data.code}`).get();
      const parsed = snap.exists ? Coupon.safeParse(snap.data()) : null;
      if (!parsed?.success) return { ok: false, reason: 'not_found' };
      const pricing = await loadPricing();
      const market = marketFor(pricing, c.data.country);
      const q = market ? quote(pricing, market, c.data.plan, c.data.period, Date.now()) : null;
      if (!market || !q) return { ok: false, reason: 'not_for_market' };
      const userUses = (await db().collection('couponRedemptions').where('code', '==', c.data.code).where('uid', '==', uid).count().get()).data().count;
      const r = applyCoupon(parsed.data, { market, plan: c.data.plan, period: c.data.period, total: q.total, step: pricing.markets[market].priceStep }, { nowMs: Date.now(), uses: Number(snap.get('uses') ?? 0), userUses });
      return r.ok ? { ...r, currency: q.currency, before: q.total } : r;
    }
    case 'push.register': {
      const p = Push.safeParse(data);
      if (!p.success) throw new HttpsError('invalid-argument', 'bad_request');
      await db()
        .doc(`users/${uid}/settings/push`)
        .set({ tokens: p.data.remove ? FieldValue.arrayRemove(p.data.token) : FieldValue.arrayUnion(p.data.token), platform: p.data.platform, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return { ok: true };
    }
    default:
      throw new HttpsError('invalid-argument', 'unknown_action');
  }
});
