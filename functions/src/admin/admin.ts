import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { UserRecord } from 'firebase-admin/auth';
import { z } from 'zod';
import { adminAuth, db } from '../lib/admin';
import { callableOptions, requireAuth } from '../lib/callable';
import { logAdmin, requireStaff, roleOf, ROLES, type Role } from '../lib/staff';
import { AccessConfig, buildAccess, stageAt } from '../lib/access';
import { AppSettings, ContentConfig, FeatureFlags, PlanCatalog } from '../lib/appConfig';
import { PricingConfig } from '../billing/billing';
import { loadAccessConfig, toDoc, toRecord, type AccessDoc } from '../account/access';
import { searchTokens } from '../foods/tokens';

const opts = callableOptions({ timeoutSeconds: 120, memory: '512MiB' });
const DAY = 86_400_000;
const ms = (v: unknown) => (v && typeof (v as { toMillis?: unknown }).toMillis === 'function' ? (v as Timestamp).toMillis() : null);

// ------------------------------------------------------------------ Overview
/** Real counts only. Revenue is summed from verified payment records; none exist until billing goes live. */
export const adminOverview = onCall(opts, async (req) => {
  await requireStaff(req, 'moderator');
  const now = Timestamp.now();
  const count = async (q: FirebaseFirestore.Query) => (await q.count().get()).data().count;
  const users = db().collection('users');
  const access = db().collection('access');
  const ents = db().collection('entitlements');
  const [totalUsers, welcome, trialOrWelcome, notEligible, subs, paid, pendingT, approvedT, payments] = await Promise.all([
    count(users),
    count(access.where('eligible', '==', true).where('welcomeEndsAt', '>', now)),
    count(access.where('eligible', '==', true).where('trialEndsAt', '>', now)),
    count(access.where('eligible', '==', false)),
    count(ents.where('status', 'in', ['trialing', 'active', 'grace', 'cancelled']).where('expiresAt', '>', now)),
    count(ents.where('status', 'in', ['active', 'grace']).where('expiresAt', '>', now)),
    count(db().collection('testimonials').where('status', '==', 'pending')),
    count(db().collection('publicTestimonials')),
    db().collection('payments').where('verified', '==', true).get(),
  ]);
  const accessTotal = await count(access);
  // Auth: deactivated and recently active accounts (lastSignIn within 30 days), plus the newest sign-ups.
  let deactivated = 0;
  let active30 = 0;
  const recent: Array<{ uid: string; email: string | null; createdAt: number }> = [];
  let token: string | undefined;
  let scanned = 0;
  do {
    const page = await adminAuth().listUsers(1000, token);
    for (const u of page.users) {
      scanned++;
      if (u.disabled) deactivated++;
      if (Date.parse(u.metadata.lastRefreshTime ?? u.metadata.lastSignInTime ?? '') > Date.now() - 30 * DAY) active30++;
      recent.push({ uid: u.uid, email: u.email ?? u.phoneNumber ?? null, createdAt: Date.parse(u.metadata.creationTime) });
    }
    token = page.pageToken;
  } while (token && scanned < 20000);
  recent.sort((a, b) => b.createdAt - a.createdAt);
  const revenue: Record<string, number> = {};
  for (const p of payments.docs) {
    const cur = String(p.get('currency') ?? 'INR');
    revenue[cur] = (revenue[cur] ?? 0) + Number(p.get('amount') ?? 0);
  }
  const logs = await db().collection('adminLogs').orderBy('at', 'desc').limit(10).get();
  return {
    totalUsers: scanned,
    onboardedProfiles: totalUsers,
    activeUsers30d: active30,
    deactivatedUsers: deactivated,
    stages: { welcome, trial: trialOrWelcome - welcome, ended: accessTotal - trialOrWelcome - notEligible, notEligible },
    subscriptions: { total: subs, paid },
    revenue: payments.empty ? null : revenue,
    testimonials: { pending: pendingT, approved: approvedT },
    recentRegistrations: recent.slice(0, 10),
    recentActivity: logs.docs.map((d) => ({ id: d.id, ...d.data(), at: ms(d.get('at')) })),
  };
});

// ------------------------------------------------------------------ Users
interface UserRow {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  disabled: boolean;
  createdAt: number;
  lastSignInAt: number | null;
  role: Role | null;
  plan: string | null;
  planStatus: string | null;
  stage: string;
}

async function rowsFor(users: UserRecord[]): Promise<UserRow[]> {
  if (!users.length) return [];
  const refs = (c: string) => users.map((u) => db().doc(`${c}/${u.uid}`));
  const [profiles, ents, access] = await Promise.all([db().getAll(...refs('users')), db().getAll(...refs('entitlements')), db().getAll(...refs('access'))]);
  const now = Date.now();
  return users.map((u, i) => {
    const p = profiles[i].data() ?? {};
    const e = ents[i].data();
    const a = access[i].exists ? toRecord(access[i].data() as AccessDoc) : null;
    return {
      uid: u.uid,
      email: u.email ?? u.phoneNumber ?? null,
      name: typeof p.name === 'string' ? p.name : (u.displayName ?? null),
      photoURL: typeof p.photoURL === 'string' ? p.photoURL : null,
      disabled: u.disabled,
      createdAt: Date.parse(u.metadata.creationTime),
      lastSignInAt: Date.parse(u.metadata.lastRefreshTime ?? u.metadata.lastSignInTime ?? '') || null,
      role: roleOf(u.customClaims),
      plan: e?.plan ?? null,
      planStatus: e?.status ?? null,
      stage: stageAt(a, now).stage,
    };
  });
}

const ListInput = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(['all', 'active', 'disabled', 'staff']).default('all'),
  pageToken: z.string().max(400).optional(),
});

/** Paged user list from Firebase Auth joined with profile, plan and stage. Search matches email, phone, name or uid. */
export const adminListUsers = onCall(opts, async (req) => {
  await requireStaff(req, 'moderator');
  const parsed = ListInput.safeParse(req.data ?? {});
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const { q, status, pageToken } = parsed.data;
  const needle = q?.toLowerCase() ?? '';
  // Direct lookups first (exact email, phone or uid), then a scan of one Auth page.
  if (needle) {
    const direct = await Promise.all([
      needle.includes('@') ? adminAuth().getUserByEmail(needle).catch(() => null) : null,
      needle.startsWith('+') ? adminAuth().getUserByPhoneNumber(needle).catch(() => null) : null,
      /^[A-Za-z0-9]{20,40}$/.test(q!) ? adminAuth().getUser(q!).catch(() => null) : null,
    ]);
    const hits = direct.filter((u): u is UserRecord => !!u);
    if (hits.length) return { users: await rowsFor(hits), nextPageToken: null };
  }
  const page = await adminAuth().listUsers(500, pageToken);
  let rows = await rowsFor(page.users);
  if (needle) rows = rows.filter((r) => [r.email, r.name, r.uid].some((v) => v?.toLowerCase().includes(needle)));
  if (status === 'active') rows = rows.filter((r) => !r.disabled);
  if (status === 'disabled') rows = rows.filter((r) => r.disabled);
  if (status === 'staff') rows = rows.filter((r) => r.role);
  rows.sort((a, b) => b.createdAt - a.createdAt);
  return { users: rows, nextPageToken: page.pageToken ?? null };
});

const UidInput = z.object({ uid: z.string().min(6).max(128) });

/** One user: account, plan, stage, recent activity counts (no health details beyond counts). */
export const adminGetUser = onCall(opts, async (req) => {
  await requireStaff(req, 'moderator');
  const parsed = UidInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const u = await adminAuth().getUser(parsed.data.uid).catch(() => null);
  if (!u) throw new HttpsError('not-found', 'not_found');
  const [row] = await rowsFor([u]);
  const since = new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10);
  const logCount = async (c: string) => (await db().collection(`users/${u.uid}/${c}`).where('date', '>=', since).where('status', '==', 'active').count().get()).data().count;
  const [profile, ent, access, foods, water, workouts, testimonials] = await Promise.all([
    db().doc(`users/${u.uid}`).get(),
    db().doc(`entitlements/${u.uid}`).get(),
    db().doc(`access/${u.uid}`).get(),
    logCount('foodLogs'),
    logCount('waterLogs'),
    logCount('workoutLogs'),
    db().collection('testimonials').where('uid', '==', u.uid).get(),
  ]);
  const p = profile.data() ?? {};
  const a = access.exists ? toRecord(access.data() as AccessDoc) : null;
  return {
    ...row,
    providers: u.providerData.map((x) => x.providerId),
    emailVerified: u.emailVerified,
    profile: { country: p.country ?? null, language: p.language ?? null, goal: p.goal ?? null, timezone: p.timezone ?? null, onboarded: !!p.targets },
    entitlement: ent.exists ? { ...ent.data(), expiresAt: ms(ent.get('expiresAt')), trialEndsAt: ms(ent.get('trialEndsAt')), updatedAt: ms(ent.get('updatedAt')) } : null,
    access: a ? { ...a, ...stageAt(a, Date.now()) } : null,
    activity30d: { foodLogs: foods, waterLogs: water, workoutLogs: workouts },
    testimonials: testimonials.docs.map((d) => ({ id: d.id, status: d.get('status'), updatedAt: ms(d.get('updatedAt')) })),
  };
});

/** Deactivate or reactivate: disables the Auth account, revokes refresh tokens and blocks callables at once. */
export const adminSetUserDisabled = onCall(opts, async (req) => {
  const actor = await requireStaff(req, 'admin');
  const parsed = z.object({ uid: z.string().min(6).max(128), disabled: z.boolean(), reason: z.string().trim().max(500).optional() }).safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const { uid, disabled, reason } = parsed.data;
  if (uid === actor.uid) throw new HttpsError('failed-precondition', 'cannot_disable_self');
  const u = await adminAuth().getUser(uid).catch(() => null);
  if (!u) throw new HttpsError('not-found', 'not_found');
  if (roleOf(u.customClaims) === 'superAdmin' && actor.role !== 'superAdmin') throw new HttpsError('permission-denied', 'protected_account');
  await adminAuth().updateUser(uid, { disabled });
  if (disabled) await adminAuth().revokeRefreshTokens(uid);
  await db().doc(`userStatus/${uid}`).set({ disabled, reason: reason ?? null, by: actor.uid, at: FieldValue.serverTimestamp() });
  await logAdmin(actor, disabled ? 'user.deactivate' : 'user.reactivate', { type: 'user', id: uid }, { disabled: u.disabled }, { disabled }, reason);
  return { disabled };
});

// ------------------------------------------------------------------ Staff and roles
/** Grant, change or remove a staff role (super admin only). The last super admin cannot be removed. */
export const adminSetRole = onCall(opts, async (req) => {
  const actor = await requireStaff(req, 'superAdmin');
  const parsed = z.object({ email: z.string().email().optional(), uid: z.string().min(6).max(128).optional(), role: z.enum(ROLES).nullable() }).refine((v) => v.email || v.uid).safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const { email, uid, role } = parsed.data;
  const u = uid ? await adminAuth().getUser(uid).catch(() => null) : await adminAuth().getUserByEmail(email!.toLowerCase()).catch(() => null);
  if (!u) throw new HttpsError('not-found', 'user_not_found');
  const before = roleOf(u.customClaims);
  if (before === 'superAdmin' && role !== 'superAdmin') {
    const supers = await db().collection('staff').where('role', '==', 'superAdmin').count().get();
    if (supers.data().count <= 1) throw new HttpsError('failed-precondition', 'last_super_admin');
  }
  await adminAuth().setCustomUserClaims(u.uid, { ...(u.customClaims ?? {}), role: role ?? null });
  await adminAuth().revokeRefreshTokens(u.uid); // new token with the new role on next sign-in
  if (role) await db().doc(`staff/${u.uid}`).set({ uid: u.uid, email: u.email ?? null, role, grantedBy: actor.uid, at: FieldValue.serverTimestamp() });
  else await db().doc(`staff/${u.uid}`).delete();
  await logAdmin(actor, role ? 'staff.setRole' : 'staff.remove', { type: 'user', id: u.uid }, { role: before }, { role });
  return { uid: u.uid, role };
});

/** Ends every session of the calling staff member (security settings). */
export const adminRevokeMySessions = onCall(opts, async (req) => {
  const actor = await requireStaff(req, 'moderator');
  await adminAuth().revokeRefreshTokens(actor.uid);
  await logAdmin(actor, 'staff.revokeOwnSessions', { type: 'user', id: actor.uid }, null, null);
  return { ok: true };
});

// ------------------------------------------------------------------ Config documents (versioned)
async function saveConfig(actor: Parameters<typeof logAdmin>[0], id: string, value: Record<string, unknown>, action: string) {
  const ref = db().doc(`appConfig/${id}`);
  const before = (await ref.get()).data() ?? null;
  const version = Number((before as { version?: number } | null)?.version ?? 0) + 1;
  const next = { ...value, version, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid };
  await db().doc(`appConfigVersions/${id}_${String(version).padStart(5, '0')}`).set({ id, version, value, previous: before, by: actor.uid, at: FieldValue.serverTimestamp() });
  await ref.set(next);
  await logAdmin(actor, action, { type: 'appConfig', id }, before, value);
  return version;
}

/** Prices, periods and offer dates. Never touches subscription or payment records; every version is kept. */
export const adminSavePricing = onCall(opts, async (req) => {
  const actor = await requireStaff(req, 'admin');
  const parsed = PricingConfig.safeParse((req.data as { config?: unknown })?.config);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_pricing', { issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`) });
  return { version: await saveConfig(actor, 'pricing', parsed.data as unknown as Record<string, unknown>, 'config.pricing') };
});

/** Plan names, descriptions, benefits and whether a tier is offered. Existing subscribers keep their plan. */
export const adminSavePlans = onCall(opts, async (req) => {
  const actor = await requireStaff(req, 'admin');
  const parsed = PlanCatalog.safeParse((req.data as { config?: unknown })?.config);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_plans');
  return { version: await saveConfig(actor, 'plans', parsed.data, 'config.plans') };
});

export const adminSaveFeatures = onCall(opts, async (req) => {
  const actor = await requireStaff(req, 'admin');
  const parsed = FeatureFlags.safeParse((req.data as { config?: unknown })?.config);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_features');
  return { version: await saveConfig(actor, 'features', parsed.data as Record<string, unknown>, 'config.features') };
});

export const adminSaveContent = onCall(opts, async (req) => {
  const actor = await requireStaff(req, 'admin');
  const parsed = ContentConfig.safeParse((req.data as { config?: unknown })?.config);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_content', { issues: parsed.error.issues.slice(0, 5).map((i) => i.path.join('.')) });
  return { version: await saveConfig(actor, 'content', parsed.data as Record<string, unknown>, 'config.content') };
});

export const adminSaveAppSettings = onCall(opts, async (req) => {
  const actor = await requireStaff(req, 'admin');
  const parsed = AppSettings.safeParse((req.data as { config?: unknown })?.config);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_settings');
  return { version: await saveConfig(actor, 'app', parsed.data, 'config.app') };
});

/**
 * Free-stage lengths and plans. New users get the new values. With applyToExisting, users still inside a free
 * stage are recalculated from their original sign-up time (never shortened below "now" retroactively for
 * people who already passed a stage; their subscription records are not touched).
 */
export const adminSaveAccess = onCall(opts, async (req) => {
  const actor = await requireStaff(req, 'admin');
  const parsed = z
    .object({ welcomeDays: z.number().int().min(0).max(90), trialDays: z.number().int().min(0).max(365), welcomePlan: z.enum(['premium', 'pro']), trialPlan: z.enum(['premium', 'pro']), applyToExisting: z.boolean().default(false) })
    .safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_access');
  const { applyToExisting, ...cfg } = parsed.data;
  const current = await loadAccessConfig();
  const version = current.version + 1;
  const next: AccessConfig = { ...cfg, version };
  await db().doc('appConfig/access').set({ ...next, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
  await db().doc(`appConfigVersions/access_${String(version).padStart(5, '0')}`).set({ id: 'access', version, value: next, previous: current, applyToExisting, by: actor.uid, at: FieldValue.serverTimestamp() });
  let updated = 0;
  if (applyToExisting) {
    const now = Date.now();
    const snap = await db().collection('access').where('eligible', '==', true).where('trialEndsAt', '>', Timestamp.fromMillis(now)).get();
    let batch = db().batch();
    let n = 0;
    for (const d of snap.docs) {
      const rec = toRecord(d.data() as AccessDoc);
      const r = buildAccess(rec.createdAtMs, next, true);
      batch.set(d.ref, { ...toDoc(d.id, r), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      updated++;
      if (++n === 400) {
        await batch.commit();
        batch = db().batch();
        n = 0;
      }
    }
    if (n) await batch.commit();
  }
  await logAdmin(actor, 'config.access', { type: 'appConfig', id: 'access' }, current, { ...next, applyToExisting, updatedUsers: updated });
  return { version, updatedUsers: updated };
});

// ------------------------------------------------------------------ Food database
const FoodInput = z.object({
  id: z.string().regex(/^(admin|cur|dish|ifct|usda|fndds|usdaf|off)-[A-Za-z0-9_-]{1,60}$/).optional(),
  name: z.string().trim().min(2).max(120),
  aliases: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  category: z.string().trim().max(60).default('Other'),
  cuisine: z.string().trim().max(60).optional(),
  countries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(20).default([]),
  per100g: z.object({ calories: z.number().min(0).max(900), proteinG: z.number().min(0).max(100), carbsG: z.number().min(0).max(100), fatG: z.number().min(0).max(100), fiberG: z.number().min(0).max(100) }),
  servings: z.array(z.object({ label: z.string().trim().min(1).max(60), grams: z.number().positive().max(3000) })).max(8).default([]),
  status: z.enum(['active', 'hidden']).default('active'),
});

/** Create or edit a food (search picks it up within minutes through the index overlay). */
export const adminSaveFood = onCall(opts, async (req) => {
  const actor = await requireStaff(req, 'admin');
  const parsed = FoodInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_food', { issues: parsed.error.issues.slice(0, 5).map((i) => i.path.join('.')) });
  const f = parsed.data;
  const id = f.id ?? `admin-${db().collection('foods').doc().id}`;
  const ref = db().doc(`foods/${id}`);
  const before = (await ref.get()).data() ?? null;
  const doc = {
    name: f.name,
    aliases: f.aliases,
    category: f.category,
    ...(f.cuisine ? { cuisine: f.cuisine } : {}),
    countries: f.countries,
    per100g: f.per100g,
    servings: f.servings,
    status: f.status,
    searchTokens: searchTokens([f.name, ...f.aliases]),
    source: (before?.source as string) ?? 'curated',
    dataset: (before?.dataset as string) ?? 'FitMe curated (admin)',
    sourceId: (before?.sourceId as string) ?? id,
    rank: (before?.rank as number) ?? 85,
    reviewStatus: 'approved',
    license: (before?.license as string) ?? 'FitMe curated food (Sindulis Innovative Solutions)',
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid,
  };
  await ref.set(doc, { merge: true });
  await logAdmin(actor, before ? 'food.update' : 'food.create', { type: 'food', id }, before ? { name: before.name, per100g: before.per100g, status: before.status ?? 'active' } : null, { name: f.name, per100g: f.per100g, status: f.status });
  return { id };
});

/** Approve or reject an AI-estimated food a user saved (approval adds it to the shared database). */
export const adminReviewFoodSuggestion = onCall(opts, async (req) => {
  const actor = await requireStaff(req, 'admin');
  const parsed = z.object({ id: z.string().min(4).max(200), decision: z.enum(['approve', 'reject']), food: FoodInput.optional(), note: z.string().max(500).optional() }).safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const ref = db().doc(`foodSuggestions/${parsed.data.id}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'not_found');
  if (snap.get('status') !== 'pending') throw new HttpsError('failed-precondition', 'already_reviewed');
  let foodId: string | null = null;
  if (parsed.data.decision === 'approve') {
    const f = parsed.data.food;
    if (!f) throw new HttpsError('invalid-argument', 'food_required');
    foodId = `admin-${db().collection('foods').doc().id}`;
    await db()
      .doc(`foods/${foodId}`)
      .set({
        name: f.name,
        aliases: f.aliases,
        category: f.category,
        countries: f.countries,
        per100g: f.per100g,
        servings: f.servings,
        status: 'active',
        searchTokens: searchTokens([f.name, ...f.aliases]),
        source: 'curated',
        dataset: 'FitMe reviewed (from a user AI estimate)',
        sourceId: parsed.data.id,
        rank: 80,
        reviewStatus: 'approved',
        license: 'FitMe curated food (Sindulis Innovative Solutions)',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actor.uid,
      });
  }
  const after = { status: parsed.data.decision === 'approve' ? 'approved' : 'rejected', foodId, note: parsed.data.note ?? null };
  await ref.update({ ...after, reviewedBy: actor.uid, reviewedAt: FieldValue.serverTimestamp() });
  await logAdmin(actor, `foodSuggestion.${parsed.data.decision}`, { type: 'foodSuggestion', id: parsed.data.id }, { status: 'pending' }, after);
  return after;
});

/**
 * The app reports a custom food the user saved from an AI estimate. The server reads the user's own document
 * (it must exist and be marked origin "ai") and queues a copy for review; nothing from the request is trusted.
 */
export const reportAiFood = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  const parsed = z.object({ customFoodId: z.string().regex(/^[A-Za-z0-9_-]{6,40}$/) }).safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const id = parsed.data.customFoodId;
  const snap = await db().doc(`users/${uid}/customFoods/${id}`).get();
  const d = snap.data();
  if (!d || d.origin !== 'ai') throw new HttpsError('failed-precondition', 'not_ai_food');
  const ref = db().doc(`foodSuggestions/${uid}_${id}`);
  if ((await ref.get()).exists) return { queued: false };
  await ref.set({ uid, customFoodId: id, name: String(d.name ?? '').slice(0, 120), servingLabel: d.servingLabel ?? null, grams: d.grams ?? null, nutrients: d.nutrients ?? null, status: 'pending', createdAt: FieldValue.serverTimestamp() });
  return { queued: true };
});
