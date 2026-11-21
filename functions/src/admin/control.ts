import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue, Timestamp, type Query } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { z } from 'zod';
import { adminAuth, db } from '../lib/admin';
import { callableOptions } from '../lib/callable';
import { logAdmin, requireSection, type Actor } from '../lib/staff';
import type { AdminSection } from '../lib/adminRoles';
import { AccessPolicy } from '../lib/policy';
import { clearPolicyCache } from '../lib/policyStore';
import { Announcement, PageDoc, StringOverrides } from '../lib/appConfig';
import { Coupon, PricingConfig, taxBreakdown } from '../billing/billing';
import { loadPricing } from '../billing/store';
import { FoodInput, saveConfig } from './admin';
import { searchTokens } from '../foods/tokens';
import { SECRET_NAMES, secretStatus, setSecret, testSecret, type SecretName } from './secrets';
import { deliverNotification, NotificationInput } from './notify';

/**
 * Every newer admin control goes through this one callable (one Cloud Run service instead of thirty, which keeps
 * the project inside its regional CPU quota). Each action names the dashboard section it belongs to; the caller's
 * role must be allowed to open that section (lib/adminRoles.ts), every change is validated with zod and written to
 * the immutable adminLogs. Payment and subscription records are never edited or deleted here.
 */
const opts = callableOptions({ timeoutSeconds: 300, memory: '512MiB' });
const DAY = 86_400_000;
const ms = (v: unknown) => (v && typeof (v as { toMillis?: unknown }).toMillis === 'function' ? (v as Timestamp).toMillis() : typeof v === 'number' ? v : null);
const plain = (d: FirebaseFirestore.DocumentSnapshot) => {
  const out: Record<string, unknown> = { id: d.id };
  for (const [k, v] of Object.entries(d.data() ?? {})) out[k] = v instanceof Timestamp ? v.toMillis() : v;
  return out;
};
const Uid = z.string().min(6).max(128);
const Country = z.string().regex(/^[A-Z]{2}$/);
const Reason = z.string().trim().min(3).max(500);

type Handler = (actor: Actor, data: unknown) => Promise<unknown>;
const actions: Record<string, { section: AdminSection; run: Handler }> = {};
function action<T extends z.ZodTypeAny>(name: string, section: AdminSection, schema: T, run: (actor: Actor, input: z.infer<T>) => Promise<unknown>) {
  actions[name] = {
    section,
    run: async (actor, data) => {
      const parsed = schema.safeParse(data ?? {});
      if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request', { issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`) });
      return run(actor, parsed.data);
    },
  };
}

export const adminAction = onCall(opts, async (req: CallableRequest<{ action?: string; data?: unknown }>) => {
  const name = String(req.data?.action ?? '');
  const a = actions[name];
  if (!a) throw new HttpsError('invalid-argument', 'unknown_action');
  const actor = await requireSection(req, a.section);
  return a.run(actor, req.data?.data);
});

/** For tests: which section an action needs. */
export const actionSection = (name: string): AdminSection | null => actions[name]?.section ?? null;

// ================================================================== Analytics (overview)
action('analytics.summary', 'overview', z.object({ days: z.number().int().min(1).max(365).default(30), country: Country.nullable().default(null) }), async (_actor, { days, country }) => {
  const since = Date.now() - days * DAY;
  const sinceTs = Timestamp.fromMillis(since);
  const sinceDate = new Date(since).toISOString().slice(0, 10);
  let profiles: Query = db().collection('users').where('createdAt', '>=', sinceTs);
  if (country) profiles = profiles.where('country', '==', country);
  const [newProfiles, payments, scans, steps, workouts, foods, pendingT] = await Promise.all([
    profiles.select('createdAt', 'country').get(),
    db().collection('payments').where('createdAt', '>=', sinceTs).get(),
    db().collection('aiUsage').where('at', '>=', sinceTs).select('feature', 'at').get(),
    db().collectionGroup('stepLogs').where('date', '>=', sinceDate).count().get(),
    db().collectionGroup('workoutLogs').where('date', '>=', sinceDate).count().get(),
    db().collectionGroup('foodLogs').where('date', '>=', sinceDate).count().get(),
    db().collection('testimonials').where('status', '==', 'pending').count().get(),
  ]);
  const byDay: Record<string, { signups: number; scans: number }> = {};
  for (let t = since; t <= Date.now(); t += DAY) byDay[new Date(t).toISOString().slice(0, 10)] = { signups: 0, scans: 0 };
  const byCountry: Record<string, number> = {};
  for (const d of newProfiles.docs) {
    const day = new Date(ms(d.get('createdAt')) ?? 0).toISOString().slice(0, 10);
    if (byDay[day]) byDay[day].signups++;
    const c = String(d.get('country') ?? '??');
    byCountry[c] = (byCountry[c] ?? 0) + 1;
  }
  const scanCounts: Record<string, number> = {};
  for (const d of scans.docs) {
    const f = String(d.get('feature') ?? 'other');
    scanCounts[f] = (scanCounts[f] ?? 0) + 1;
    const day = new Date(ms(d.get('at')) ?? 0).toISOString().slice(0, 10);
    if (byDay[day] && f === 'foodPhotoScan') byDay[day].scans++;
  }
  const revenue: Record<string, { amount: number; count: number }> = {};
  for (const p of payments.docs) {
    if (p.get('verified') !== true || (country && p.get('country') !== country)) continue;
    const key = `${p.get('country') ?? '??'}:${p.get('currency') ?? '???'}`;
    revenue[key] = { amount: (revenue[key]?.amount ?? 0) + Number(p.get('amount') ?? 0), count: (revenue[key]?.count ?? 0) + 1 };
  }
  return {
    days,
    country,
    series: Object.entries(byDay).map(([date, v]) => ({ date, ...v })),
    signupsByCountry: byCountry,
    aiUsage: scanCounts,
    activity: { stepDays: steps.data().count, workouts: workouts.data().count, foodLogs: foods.data().count },
    revenue,
    testimonialsPending: pendingT.data().count,
  };
});

// ================================================================== Finance
action(
  'finance.payments',
  'finance',
  z.object({ status: z.enum(['all', 'verified', 'failed', 'refunded']).default('all'), country: Country.nullable().default(null), before: z.number().nullable().default(null) }),
  async (_a, { status, country, before }) => {
    let q: Query = db().collection('payments');
    if (status === 'verified') q = q.where('verified', '==', true);
    if (status === 'failed') q = q.where('status', '==', 'failed');
    if (status === 'refunded') q = q.where('status', '==', 'refunded');
    if (country) q = q.where('country', '==', country);
    q = q.orderBy('createdAt', 'desc');
    if (before) q = q.startAfter(Timestamp.fromMillis(before));
    const snap = await q.limit(50).get();
    return { rows: snap.docs.map(plain), more: snap.size === 50 };
  },
);

action('finance.webhooks', 'finance', z.object({ before: z.number().nullable().default(null) }), async (_a, { before }) => {
  let q: Query = db().collection('webhookLogs').orderBy('at', 'desc');
  if (before) q = q.startAfter(Timestamp.fromMillis(before));
  const snap = await q.limit(50).get();
  return { rows: snap.docs.map(plain), more: snap.size === 50 };
});

/** Receipt / tax invoice data for one payment (rendered and printed in the dashboard). */
action('finance.receipt', 'finance', z.object({ id: z.string().min(3).max(200) }), async (_a, { id }) => {
  const snap = await db().doc(`payments/${id}`).get();
  if (!snap.exists) throw new HttpsError('not-found', 'not_found');
  const p = plain(snap) as Record<string, unknown>;
  const pricing = await loadPricing();
  const market = Object.entries(pricing.markets).find(([, m]) => m.countries.includes(String(p.country ?? '')))?.[1];
  const tax = market?.tax ?? { name: 'Tax', percent: 0, inclusive: true };
  const settings = (await db().doc('appConfig/app').get()).data() ?? {};
  return {
    payment: p,
    seller: { name: 'Sindulis Innovative Solutions', product: 'FitMe', supportEmail: settings.supportEmail ?? null, gstin: settings.gstin ?? null },
    tax: { ...tax, ...taxBreakdown(Number(p.amount ?? 0), tax, market?.priceStep ?? 0.01) },
  };
});

/** Country table: one market per country or currency group, with prices, tax, payment methods and on/off. */
action('finance.savePricing', 'finance', z.object({ pricing: PricingConfig.omit({ version: true }), note: z.string().max(300).optional() }), async (actor, { pricing, note }) => {
  for (const [key, m] of Object.entries(pricing.markets)) {
    for (const plan of ['premium', 'pro'] as const) if (m.plans[plan].offer <= 0) throw new HttpsError('invalid-argument', 'price_required', { market: key, plan });
  }
  const version = await saveConfig(actor, 'pricing', pricing as unknown as Record<string, unknown>, note ? `pricing.save: ${note}` : 'pricing.save');
  return { version };
});

// ================================================================== Plans, features, Free Launch Mode, trials
action('policy.get', 'plans', z.object({}), async () => {
  const snap = await db().doc('appConfig/policy').get();
  const parsed = AccessPolicy.safeParse(snap.data() ?? {});
  return parsed.success ? parsed.data : AccessPolicy.parse({});
});

async function savePolicy(actor: Actor, patch: (p: AccessPolicy) => AccessPolicy, label: string) {
  const snap = await db().doc('appConfig/policy').get();
  const current = AccessPolicy.safeParse(snap.data() ?? {});
  const next = AccessPolicy.parse(patch(current.success ? current.data : AccessPolicy.parse({})));
  const version = await saveConfig(actor, 'policy', next as unknown as Record<string, unknown>, label);
  clearPolicyCache();
  return { ...next, version };
}

action('policy.freeLaunch', 'plans', z.object({ enabled: z.boolean(), countries: z.array(Country).max(250).default([]) }), (actor, v) =>
  savePolicy(actor, (p) => ({ ...p, freeLaunch: v }), v.enabled ? 'freeLaunch.on' : 'freeLaunch.off'),
);
action('policy.overrides', 'plans', z.object({ overrides: AccessPolicy.shape.overrides }), (actor, v) => savePolicy(actor, (p) => ({ ...p, overrides: v.overrides }), 'features.tiers'));
action('policy.stageDays', 'trials', z.object({ stageDays: AccessPolicy.shape.stageDays }), (actor, v) => savePolicy(actor, (p) => ({ ...p, stageDays: v.stageDays }), 'trials.countryDays'));

/** Extend or reset one user's free stages (reason required; the old dates are kept in the log). */
action(
  'trials.adjust',
  'trials',
  z.object({ uid: Uid, op: z.enum(['extend', 'reset', 'end']), days: z.number().int().min(1).max(365).default(7), reason: Reason }),
  async (actor, { uid, op, days, reason }) => {
    const ref = db().doc(`access/${uid}`);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'no_access_record');
    const before = plain(snap);
    const now = Date.now();
    const welcomeEnd = ms(snap.get('welcomeEndsAt')) ?? now;
    const trialEnd = ms(snap.get('trialEndsAt')) ?? now;
    let next: { welcomeEndsAt: number; trialEndsAt: number; eligible: boolean };
    if (op === 'extend') {
      // Extends whichever stage is running (or restarts the trial from today if both are over).
      if (now < welcomeEnd) next = { welcomeEndsAt: welcomeEnd + days * DAY, trialEndsAt: trialEnd + days * DAY, eligible: true };
      else next = { welcomeEndsAt: welcomeEnd, trialEndsAt: Math.max(trialEnd, now) + days * DAY, eligible: true };
    } else if (op === 'reset') {
      const cfg = (await db().doc('appConfig/access').get()).data() ?? {};
      const w = Number(cfg.welcomeDays ?? 7);
      const t = Number(cfg.trialDays ?? 30);
      next = { welcomeEndsAt: now + w * DAY, trialEndsAt: now + (w + t) * DAY, eligible: true };
    } else next = { welcomeEndsAt: Math.min(welcomeEnd, now), trialEndsAt: Math.min(trialEnd, now), eligible: snap.get('eligible') === true };
    await ref.update({ welcomeEndsAt: Timestamp.fromMillis(next.welcomeEndsAt), trialEndsAt: Timestamp.fromMillis(next.trialEndsAt), eligible: next.eligible, adjustedBy: actor.uid, adjustedAt: FieldValue.serverTimestamp() });
    await logAdmin(actor, `trial.${op}`, { type: 'user', id: uid }, { welcomeEndsAt: before.welcomeEndsAt, trialEndsAt: before.trialEndsAt, eligible: before.eligible }, next, reason);
    return next;
  },
);

// ================================================================== Coupons (never deleted, only switched off)
action('coupons.list', 'coupons', z.object({}), async () => {
  const snap = await db().collection('coupons').orderBy('updatedAt', 'desc').limit(200).get();
  return { rows: snap.docs.map(plain) };
});
action('coupons.save', 'coupons', z.object({ coupon: Coupon }), async (actor, { coupon }) => {
  const ref = db().doc(`coupons/${coupon.code}`);
  const before = (await ref.get()).data() ?? null;
  await ref.set({ ...coupon, uses: before?.uses ?? 0, createdAt: before?.createdAt ?? FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
  await logAdmin(actor, before ? 'coupon.update' : 'coupon.create', { type: 'coupon', id: coupon.code }, before, coupon);
  return { code: coupon.code };
});

// ================================================================== Content: strings, pages, announcements
action('strings.get', 'content', z.object({}), async () => StringOverrides.parse((await db().doc('appConfig/strings').get()).data() ?? {}));
action('strings.set', 'content', z.object({ lang: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/), key: z.string().regex(/^[A-Za-z0-9_.-]{1,120}$/), value: z.string().max(2000).nullable() }), async (actor, { lang, key, value }) => {
  const current = StringOverrides.parse((await db().doc('appConfig/strings').get()).data() ?? {});
  const strings = { ...current.strings, [lang]: { ...(current.strings[lang] ?? {}) } };
  const before = strings[lang][key] ?? null;
  if (value === null || value === '') delete strings[lang][key];
  else strings[lang][key] = value;
  const version = await saveConfig(actor, 'strings', { strings }, `strings.set ${lang}:${key}`);
  return { version, before };
});

action('pages.list', 'content', z.object({}), async () => ({ rows: (await db().collection('pages').orderBy('order').limit(500).get()).docs.map(plain) }));
action('pages.save', 'content', z.object({ page: PageDoc }), async (actor, { page }) => {
  const ref = db().doc(`pages/${page.slug}`);
  const before = (await ref.get()).data() ?? null;
  await ref.set({ ...page, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid, ...(before ? {} : { createdAt: FieldValue.serverTimestamp() }) });
  await logAdmin(actor, before ? 'page.update' : 'page.create', { type: 'page', id: page.slug }, before ? { title: before.title, published: before.published } : null, { title: page.title, published: page.published });
  return { slug: page.slug };
});
action('pages.unpublish', 'content', z.object({ slug: z.string().regex(/^[a-z0-9-]{2,60}$/) }), async (actor, { slug }) => {
  await db().doc(`pages/${slug}`).update({ published: false, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
  await logAdmin(actor, 'page.unpublish', { type: 'page', id: slug }, { published: true }, { published: false });
  return { ok: true };
});

action('announcements.list', 'notifications', z.object({}), async () => ({ rows: (await db().collection('announcements').orderBy('updatedAt', 'desc').limit(100).get()).docs.map(plain) }));
action('announcements.save', 'notifications', z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{3,40}$/).optional(), announcement: Announcement }), async (actor, { id, announcement }) => {
  const ref = id ? db().doc(`announcements/${id}`) : db().collection('announcements').doc();
  const before = (await ref.get()).data() ?? null;
  await ref.set({ ...announcement, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
  await logAdmin(actor, before ? 'announcement.update' : 'announcement.create', { type: 'announcement', id: ref.id }, before, announcement);
  return { id: ref.id };
});

// ================================================================== Notifications (push + in-app inbox)
action('notify.send', 'notifications', NotificationInput, async (actor, input) => {
  const ref = db().collection('notifications').doc();
  const scheduled = input.sendAt && Date.parse(input.sendAt) > Date.now() + 60_000;
  await ref.set({ ...input, status: scheduled ? 'scheduled' : 'sending', createdBy: actor.uid, createdAt: FieldValue.serverTimestamp() });
  await logAdmin(actor, scheduled ? 'notification.schedule' : 'notification.send', { type: 'notification', id: ref.id }, null, input);
  if (scheduled) return { id: ref.id, status: 'scheduled' };
  const result = await deliverNotification(ref.id);
  return { id: ref.id, status: 'sent', ...result };
});
action('notify.list', 'notifications', z.object({}), async () => ({ rows: (await db().collection('notifications').orderBy('createdAt', 'desc').limit(100).get()).docs.map(plain) }));
action('notify.cancel', 'notifications', z.object({ id: z.string().min(5).max(60) }), async (actor, { id }) => {
  const ref = db().doc(`notifications/${id}`);
  const s = await ref.get();
  if (s.get('status') !== 'scheduled') throw new HttpsError('failed-precondition', 'not_scheduled');
  await ref.update({ status: 'cancelled', cancelledBy: actor.uid });
  await logAdmin(actor, 'notification.cancel', { type: 'notification', id }, { status: 'scheduled' }, { status: 'cancelled' });
  return { ok: true };
});
action('templates.list', 'notifications', z.object({}), async () => ({ rows: (await db().collection('notifyTemplates').limit(100).get()).docs.map(plain) }));
action(
  'templates.save',
  'notifications',
  z.object({ id: z.string().regex(/^[a-z0-9-]{2,40}$/), title: z.record(z.string(), z.string().max(80)), body: z.record(z.string(), z.string().max(400)) }),
  async (actor, t) => {
    const ref = db().doc(`notifyTemplates/${t.id}`);
    const before = (await ref.get()).data() ?? null;
    await ref.set({ ...t, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
    await logAdmin(actor, 'template.save', { type: 'notifyTemplate', id: t.id }, before, t);
    return { id: t.id };
  },
);

// ================================================================== Users: grants, messages, diagnostics
action(
  'users.grant',
  'users',
  z.object({ uid: Uid, plan: z.enum(['premium', 'pro', 'free']), days: z.number().int().min(1).max(3650).nullable(), reason: Reason }),
  async (actor, { uid, plan, days, reason }) => {
    if (!(await adminAuth().getUser(uid).catch(() => null))) throw new HttpsError('not-found', 'user_not_found');
    const ref = db().doc(`grants/${uid}`);
    const before = (await ref.get()).data() ?? null;
    // A grant sits next to any store subscription; it never changes entitlements/{uid} or payment records.
    const next = { uid, plan, expiresAtMs: plan === 'free' ? Date.now() : days ? Date.now() + days * DAY : null, reason, by: actor.uid, at: FieldValue.serverTimestamp() };
    await ref.set(next);
    await logAdmin(actor, plan === 'free' ? 'user.grantEnd' : 'user.grant', { type: 'user', id: uid }, before, { plan, days }, reason);
    return { plan, expiresAtMs: next.expiresAtMs };
  },
);
action('users.message', 'users', z.object({ uid: Uid, title: z.string().trim().min(1).max(80), body: z.string().trim().min(1).max(400) }), async (actor, { uid, title, body }) => {
  const ref = db().collection('notifications').doc();
  const input = { audience: 'user' as const, value: uid, title: { en: title }, body: { en: body }, sendAt: null, push: true };
  await ref.set({ ...input, status: 'sending', createdBy: actor.uid, createdAt: FieldValue.serverTimestamp() });
  await logAdmin(actor, 'user.message', { type: 'user', id: uid }, null, { title });
  return { id: ref.id, ...(await deliverNotification(ref.id)) };
});
action('users.diagnostics', 'users', z.object({ uid: Uid.optional() }), async (_a, { uid }) => {
  let q: Query = db().collection('diagnostics');
  if (uid) q = q.where('uid', '==', uid);
  const snap = await q.orderBy('createdAt', 'desc').limit(50).get();
  return { rows: snap.docs.map(plain) };
});
action('users.devices', 'users', z.object({ uid: Uid }), async (_a, { uid }) => {
  const [devices, push] = await Promise.all([db().doc(`users/${uid}/settings/devices`).get(), db().doc(`users/${uid}/settings/push`).get()]);
  const d = devices.data() ?? {};
  return { health: d.health ? { app: d.health.app, connected: !!d.health.connected, lastSyncAt: ms(d.health.lastSyncAt) } : null, phoneSteps: d.phoneSteps ? { enabled: !!d.phoneSteps.enabled, lastSyncAt: ms(d.phoneSteps.lastSyncAt) } : null, pushDevices: ((push.get('tokens') as string[] | undefined) ?? []).length };
});

// ================================================================== Foods: import, merge, remove
action('foods.import', 'foods', z.object({ rows: z.array(FoodInput.omit({ id: true })).min(1).max(500) }), async (actor, { rows }) => {
  const batch = db().batch();
  const ids: string[] = [];
  for (const f of rows) {
    const ref = db().collection('foods').doc(`admin-${db().collection('foods').doc().id}`);
    ids.push(ref.id);
    batch.set(ref, {
      ...f,
      searchTokens: searchTokens([f.name, ...f.aliases]),
      source: 'curated',
      dataset: 'FitMe curated (admin import)',
      sourceId: ref.id,
      rank: 85,
      reviewStatus: 'approved',
      license: 'FitMe curated food (Sindulis Innovative Solutions)',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid,
    });
  }
  await batch.commit();
  await logAdmin(actor, 'food.import', { type: 'food', id: `${ids.length} foods` }, null, { count: ids.length, first: rows[0].name });
  return { created: ids.length, ids };
});
/** Duplicates are hidden and point at the food that is kept; nothing is deleted, logged meals keep their copy. */
action('foods.merge', 'foods', z.object({ keepId: z.string().min(2).max(200), removeIds: z.array(z.string().min(2).max(200)).min(1).max(20) }), async (actor, { keepId, removeIds }) => {
  if (removeIds.includes(keepId)) throw new HttpsError('invalid-argument', 'keep_in_remove');
  const keep = await db().doc(`foods/${keepId}`).get();
  if (!keep.exists) throw new HttpsError('not-found', 'keep_not_found');
  const batch = db().batch();
  const extraAliases = new Set<string>(keep.get('aliases') ?? []);
  for (const id of removeIds) {
    const s = await db().doc(`foods/${id}`).get();
    if (!s.exists) continue;
    extraAliases.add(String(s.get('name')));
    for (const a of (s.get('aliases') as string[] | undefined) ?? []) extraAliases.add(a);
    batch.update(s.ref, { status: 'hidden', mergedInto: keepId, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
  }
  const aliases = [...extraAliases].filter((a) => a && a !== keep.get('name')).slice(0, 40);
  batch.update(keep.ref, { aliases, searchTokens: searchTokens([String(keep.get('name')), ...aliases]), updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
  await batch.commit();
  await logAdmin(actor, 'food.merge', { type: 'food', id: keepId }, { removeIds }, { aliases });
  return { kept: keepId, hidden: removeIds.length };
});

// ================================================================== API and integration keys (Secret Manager)
action('integrations.status', 'integrations', z.object({}), async () => ({ rows: await Promise.all(SECRET_NAMES.map((n) => secretStatus(n))) }));
action('integrations.set', 'integrations', z.object({ name: z.enum(SECRET_NAMES as unknown as [SecretName, ...SecretName[]]), value: z.string().min(8).max(8000) }), async (actor, { name, value }) => {
  const status = await setSecret(name, value);
  // The value is never logged or returned: only that it changed and its new version number.
  await logAdmin(actor, 'integration.setKey', { type: 'secret', id: name }, null, { version: status.version });
  return status;
});
action('integrations.test', 'integrations', z.object({ name: z.enum(SECRET_NAMES as unknown as [SecretName, ...SecretName[]]) }), async (actor, { name }) => {
  const r = await testSecret(name);
  await logAdmin(actor, 'integration.test', { type: 'secret', id: name }, null, { ok: r.ok, detail: r.detail });
  return r;
});

// ================================================================== Support inbox
action('support.list', 'support', z.object({ status: z.enum(['open', 'answered', 'closed', 'all']).default('open') }), async (_a, { status }) => {
  let q: Query = db().collection('contactMessages');
  if (status !== 'all') q = q.where('status', '==', status);
  const snap = await q.orderBy('createdAt', 'desc').limit(100).get();
  return { rows: snap.docs.map(plain) };
});
action('support.reply', 'support', z.object({ id: z.string().min(5).max(60), reply: z.string().trim().max(2000).optional(), status: z.enum(['open', 'answered', 'closed']) }), async (actor, { id, reply, status }) => {
  const ref = db().doc(`contactMessages/${id}`);
  const s = await ref.get();
  if (!s.exists) throw new HttpsError('not-found', 'not_found');
  const replies = [...((s.get('replies') as unknown[]) ?? [])];
  if (reply) replies.push({ by: actor.uid, text: reply, at: Date.now() });
  await ref.update({ status, replies, updatedAt: FieldValue.serverTimestamp() });
  if (reply) {
    await db()
      .collection(`users/${s.get('uid')}/inbox`)
      .add({ kind: 'support', title: { en: 'Reply from FitMe support' }, body: { en: reply }, ref: id, createdAt: FieldValue.serverTimestamp(), readAt: null });
  }
  await logAdmin(actor, 'support.reply', { type: 'contactMessage', id }, { status: s.get('status') }, { status, replied: !!reply });
  return { ok: true };
});

// ================================================================== Audit log search
action(
  'logs.search',
  'logs',
  z.object({ action: z.string().max(60).optional(), targetType: z.string().max(40).optional(), actorUid: z.string().max(128).optional(), from: z.number().optional(), to: z.number().optional(), before: z.number().nullable().default(null), limit: z.number().int().min(1).max(1000).default(100) }),
  async (_a, f) => {
    let q: Query = db().collection('adminLogs');
    if (f.targetType) q = q.where('targetType', '==', f.targetType);
    if (f.actorUid) q = q.where('actorUid', '==', f.actorUid);
    if (f.from) q = q.where('at', '>=', Timestamp.fromMillis(f.from));
    if (f.to) q = q.where('at', '<=', Timestamp.fromMillis(f.to));
    q = q.orderBy('at', 'desc');
    if (f.before) q = q.startAfter(Timestamp.fromMillis(f.before));
    const snap = await q.limit(f.limit).get();
    let rows = snap.docs.map(plain);
    if (f.action) rows = rows.filter((r) => String(r.action ?? '').startsWith(f.action!));
    return { rows, more: snap.size === f.limit };
  },
);

logger.debug('admin actions registered', { count: Object.keys(actions).length });
export const _actionNames = () => Object.keys(actions);
