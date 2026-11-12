# FIT ME AI — Claude Code prompts (paste one phase at a time)

Setup before Phase 0:
1. Create an empty folder `fit-me-ai`, put `CLAUDE.md` in its root.
2. Create `docs/PRD.md` — export the Master PRD v2.0 doc as Markdown and save it there.
3. Install Flutter, Node LTS, Firebase CLI, and log in (`firebase login`). Xcode needed for iOS.
4. Create 3 Firebase projects: `fitmeai-dev`, `fitmeai-staging`, `fitmeai-prod`.
5. Open the folder in Claude Code and paste Phase 0.

---

## Phase 0 — Foundation

```
Read CLAUDE.md and docs/PRD.md fully before doing anything.

We are starting FIT ME AI from scratch. Your task is Phase 0 (Foundation) only.

First, give me a short plan: the folder structure, packages you will add, and the order of work.
Wait for my "ok" before writing code.

After I approve, build:
1. Flutter app in apps/mobile for iOS, Android, Web with dev/staging/prod flavors
   wired to fitmeai-dev / fitmeai-staging / fitmeai-prod (use flutterfire configure).
2. Theme from the design system in CLAUDE.md (light + dark), typography that renders
   Telugu, Hindi, Tamil and Arabic correctly.
3. Localization setup (ARB) for: en, hi, te, ta, es, pt, fr, de, ar (RTL), id.
   English strings complete; other languages can be machine-translated placeholders marked TODO-REVIEW.
4. go_router with the bottom navigation shell: Home, Nutrition, Fitness, Progress, Profile,
   a floating Jai/Jaya button, and the Nova Bar pill (static for now, real data in later phases).
5. Firebase Auth: Google, Sign in with Apple, email/password, phone OTP. Session persistence,
   sign out, and in-app account deletion.
6. Country, currency, units and timezone detection at signup, editable in Settings.
7. functions/ folder: TypeScript Cloud Functions project with lint, tests, and one health-check function.
8. firestore.rules and storage.rules: users can only access users/{uid}/**; everything else denied.
   Add rules tests that run in the emulator.
9. App Check enabled (debug provider for dev).
10. GitHub Actions CI: flutter analyze, flutter test, functions lint + test, rules tests.

Gate for this phase: app runs on Android emulator, iOS simulator and Chrome; I can sign in,
see the 5 tabs, switch language (including Arabic RTL), and sign out.

When done, give me: what you built, how to run it, test results, and anything not done.
Do not start Phase 1.
```

---

## Phase 1 — Core free tier

```
Read CLAUDE.md and PRD sections 2, 4, 7, 9, 13. Phase 0 is complete.

Build Phase 1 (core free tier). Plan first, wait for my ok, then build module by module,
running tests after each module:

1. Onboarding & health profile (PRD module 1): all fields, metric/imperial input,
   calculations exactly as in CLAUDE.md with unit tests, generated personal targets screen.
2. Food database: import pipeline in functions/src/foods for USDA FoodData Central
   (start with a subset of ~5,000 common foods) + curated regional dishes JSON for India,
   US, UK first. Search ranked by user's country and language. Store source on every item.
3. Nutrition logging: meal slots, search, quantity + local serving units, manual food,
   saved meals, recipe builder, edit/delete/undo, duplicate detection.
   Free tier shows calories, protein, carbs, fat, fiber. Micronutrients are hidden (Premium, Phase 3).
4. Water tracker, weight & measurements (trend, not daily judgement), sleep log.
5. Steps and watch connect via the health package (HealthKit / Health Connect), opt-in,
   showing the data source.
6. Basic workouts: exercise library (seed ~100 exercises), timer, sets/reps, rest timer, history.
7. Dashboard with real data: calories in/out/remaining, macros, water, steps, workout, sleep, weight.
   Every card opens its module. Nova Bar shows calories left and active workout timer.
8. Goals, streaks, badges (no guilt messages).
9. Store tab with a "Coming Soon" screen and "notify me" (saves interest to Firestore).
10. Settings: profile, units, language, theme, notifications toggle, data export, delete account.

Gate: a free user can track a full day on Android, iOS and web, data syncs across devices
in real time, and all tests pass. Report what's done and not done. Do not start Phase 2.
```

---

## Phase 2 — Subscriptions & ads

```
Read CLAUDE.md and PRD sections 2, 3, 10 (Ads). Phase 1 is complete.

Build Phase 2. Plan first, wait for my ok.

1. Entitlement model: entitlements/{uid} {plan: free|premium|pro, expiresAt, source, store}
   written only by Cloud Functions. Client reads it via a Riverpod provider.
2. RevenueCat on iOS/Android with products: premium_monthly, pro_monthly
   (prices set in App Store Connect / Play Console per country — I will set them; you list what I must configure).
3. RevenueCat webhook → Cloud Function → entitlements/{uid}.
4. Web: Cashfree subscription checkout via Cloud Functions; verified webhooks update
   entitlements/{uid}. Keys from Secret Manager.
5. Paywall screen with localized prices from the store (mobile) and from config (web),
   restore purchases, manage subscription, purchase history.
6. Server-side gating helper used by every future premium/pro function.
7. AdMob banners/native ads for free users only, none on health-sensitive screens,
   consent via Google UMP (GDPR) and Apple ATT.

Gate: sandbox purchases on iOS and Android, and Cashfree test mode on web, each unlock
the right tier on all devices; cancellation/expiry downgrades correctly; tests pass.
Give me a checklist of store-console setup I must do myself.
```

---

## Phase 3 — Premium

```
Read CLAUDE.md and PRD sections 7 (modules 3, 4, 12), 8, 9. Phase 2 is complete.

Build Phase 3:
1. Micronutrients in nutrition screens and daily summary, gated to Premium (server + UI).
2. AI food photo scan: upload to Storage → Cloud Function → Gemini vision → match items to
   our food DB → return items, portion estimates and nutrition as RANGES with confidence.
   User edits quantities and confirms before anything is saved. Premium only, rate-limited.
3. Barcode scan using Open Food Facts (with attribution), fallback to manual entry.
4. AI Hub screen that groups the scanner (and later Pro generators).

Gate: real scans of Indian, Western and packaged food work end to end; nothing saves
without confirmation; free users are blocked server-side. Tests pass.
```

---

## Phase 4 — Pro (Jai & Jaya, planner)

```
Read CLAUDE.md and PRD sections 7 (modules 6, 8, 11, 13, 15) and 8. Phase 3 is complete.

Build Phase 4, Pro tier only, all gated server-side:
1. AI orchestrator in functions/src/ai: loads user context, routes tools
   (food analysis, meal plan, workout plan, schedule), calls Gemini, validates output,
   enforces per-tier limits, logs usage. Safety rules from PRD section 8.
2. Jai & Jaya chat: streaming replies in the user's language, persona prompts,
   chat history, action suggestions with "Apply" buttons that need user confirmation.
3. Voice: speech-to-text input with confirmation, text-to-speech with distinct Jai/Jaya voices.
4. Planner: daily/weekly/monthly; add, edit, delete, skip, complete, repeat, custom recurrence.
5. AI auto-planner from work hours and goals; preview → approve → save.
   Missed-activity rescheduling suggestions that need approval.
6. AI meal plan and workout generators (preview → approve → save).
7. Smart reminders via FCM, each category toggleable.
8. Weekly/monthly/yearly reports from real data, PDF export.

Gate: AI answers use the user's real data; with no data it says so; nothing is saved
without approval; free/premium users are blocked; tests pass.
```

---

## Phase 5 — Admin & hardening

```
Read CLAUDE.md and PRD sections 11, 13, 14. Phase 4 is complete.

1. apps/admin Flutter web with roles: super admin, admin, nutrition reviewer,
   fitness reviewer, support, finance. Manage users (no health data without explicit
   authorized access + audit log), foods, exercises, app config, AI usage, notifications,
   store waitlist.
2. Full security review: rules, App Check, function auth, rate limits, secrets.
3. Performance: startup time, image sizes, Firestore indexes, pagination.
4. Accessibility: contrast, screen readers, text scaling, reduced motion.
5. Store readiness checklist from PRD section 14; privacy labels and data-safety answers drafted for me.
6. Staging deploy and a full QA pass report. Do NOT deploy to prod.
```

---

## Useful one-liners while building

- Bug: `This is broken: <what you saw>. Find the root cause, explain it, then fix it with a test. Don't rewrite unrelated code.`
- Review: `Audit <module> against PRD section X and the Definition of done in CLAUDE.md. List gaps, don't fix yet.`
- Continue: `Continue Phase N from where you stopped. First tell me what's done and what's left.`
