# FIT ME AI — Project Instructions for Claude Code

FIT ME AI is a global AI health & wellness app by Sindulis Innovative Solutions.
One React + TypeScript codebase → Web, plus iOS and Android via Capacitor. Firebase backend for launch (may move later).
Full product spec: `docs/PRD.md` (read the relevant section before starting any task).

## Golden rules (never break these)

1. No mock AI, fake scan results, hardcoded stats, or buttons without a real action in production code.
   Seed/demo data only in dev, clearly behind a flag.
2. Never claim a feature is done until it runs on real data, is saved to Firestore, syncs, and has tests.
3. Never deploy to production. Deploy only to `dev` or `staging` and ask before anything else.
4. Never overwrite or delete existing Firestore data or user files without asking.
5. Plan gating (free / premium / pro) is enforced server-side in Cloud Functions, never only in UI.
6. AI never invents user data and never saves a health record without the user confirming it.
7. No user-facing string hardcoded in components — everything goes in i18next JSON translation files.
8. Secrets (Gemini key, RevenueCat, Cashfree, AdMob) only in Secret Manager / env config. Never in the client or git.
9. Work phase by phase (see "Roadmap"). Finish and verify the current phase before starting the next.
10. When something in the PRD is unclear, ask instead of guessing.

## Tech stack

| Layer | Choice |
|---|---|
| App | React 19 + TypeScript + Vite, Tailwind CSS 4 (design tokens via `@theme` + CSS variables) |
| Native shells | Capacitor (iOS + Android) wrapping the same web build |
| State | Zustand stores backed by Firestore (Firestore offline cache = local persistence; no localStorage for user data) |
| Validation | zod schemas shared by client and Cloud Functions |
| i18n | i18next + react-i18next, JSON files per language; RTL via `dir` on `<html>` |
| Auth | Firebase Auth: Google, Sign in with Apple, email, phone OTP (native via `@capacitor-firebase/authentication`, JS SDK on web) |
| DB | Cloud Firestore |
| Storage | Firebase Storage |
| Backend | Cloud Functions 2nd gen, TypeScript, Node LTS (replaces `server.ts` Express server) |
| AI | Gemini API called ONLY from Cloud Functions; key in Secret Manager; provider behind an interface so it can be swapped |
| Payments | RevenueCat (`@revenuecat/purchases-capacitor`) + Apple IAP + Google Play Billing on mobile; Cashfree on web via Functions + webhooks |
| Health data | HealthKit / Health Connect via a Capacitor health plugin |
| Ads | AdMob via `@capacitor-community/admob` on mobile, free users only (web ad network TBD) |
| Push | Firebase Cloud Messaging (`@capacitor-firebase/messaging` on native) |
| Monitoring | Crashlytics (native), Performance, Analytics |
| Security | App Check (App Attest / Play Integrity native, reCAPTCHA Enterprise web), Security Rules, Secret Manager |
| Hosting | Firebase Hosting for the web app |
| Tests | Vitest + React Testing Library (unit/component), Playwright (e2e + screenshots), `@firebase/rules-unit-testing` (rules) |

Firebase projects: `fitmeai-dev`, `fitmeai-staging`, `fitmeai-prod` (selected via Vite mode / `VITE_ENV`).

## Repo structure

```
src/                    React app (web + Capacitor)
  app/                  app shell, router, providers
  components/ui/        design-system primitives (Button, Card, Input, ...)
  features/<module>/    screens, widgets, hooks per module
  stores/               Zustand stores (Firestore-backed)
  lib/                  firebase, i18n, env, api clients, utils
  domain/               pure logic: calculators (BMR, TDEE, macros), models, zod schemas
  locales/<lang>.json   translation files
ios/  android/          Capacitor native projects
functions/              Cloud Functions (TypeScript)
  src/ai/               orchestrator, Jai/Jaya personas, tools
  src/billing/          RevenueCat + Cashfree webhooks, entitlements
  src/foods/            food search, import scripts
tests/rules/            Security Rules tests (emulator)
e2e/                    Playwright tests and screenshot scripts
firestore.rules  storage.rules  firestore.indexes.json  firebase.json  capacitor.config.ts
docs/PRD.md  docs/ORIGINAL_SPEC.md  docs/AUDIT.md
```

Admin panel is a separate role-gated route in the same app (Phase 5).
Keep features modular. Business logic in `src/domain/` and Functions, not in components.

## Key product decisions

- Tiers: **Free** (macros incl. fiber, steps, watch connect, water, weight, sleep, basic workouts, ads shown),
  **Premium** (+ micronutrients, AI food photo scan, no ads),
  **Pro** (+ Jai & Jaya AI coaches, reminders, weekly/monthly planner, AI generators, advanced reports).
- Prices: India ₹199 / ₹399; US $9 / $29; UK £9 / £29; EU €9 / €29; others via store local price tiers.
- Mobile purchases = in-app purchase in every country. Web = Cashfree. RevenueCat unifies entitlements.
  Server writes `entitlements/{uid}`; clients only read it.
- Global from day one: local currency, language, units, foods per country. Launch languages:
  en, hi, te, ta, es, pt, fr, de, ar (RTL), id.
- Food DB: USDA FoodData Central + Open Food Facts + curated regional dishes; every food stores its `source`.
- AI coaches: Jai (fitness, male voice), Jaya (nutrition/wellness, female voice), one orchestrator, shared user context.
- Store tab exists at launch as "Coming Soon". Trainer marketplace is post-launch.
- Health safety: no diagnosis, no medication/insulin advice; show disclaimer; urgent symptoms → advise a doctor.

## Calculations (must be exact and unit-tested)

- BMR: Mifflin-St Jeor. TDEE = BMR × activity factor (1.2 / 1.375 / 1.55 / 1.725 / 1.9).
- Goal calories: lose ≈ TDEE − 500 (floor 1200 F / 1500 M), gain ≈ TDEE + 300, maintain = TDEE. Make deltas configurable in `appConfig`.
- Macros default: protein 1.6 g/kg (range configurable), fat 25–30% kcal, carbs = remainder. Fiber 14 g per 1000 kcal.
- Water default 35 ml/kg, user-adjustable.
- All times stored in UTC plus the user's IANA timezone; "today" is computed in the user's timezone.

## Design system

Colors: primary green `#1FA45B`, orange `#FF8A24`, dark `#0F1720`, cream `#F7F5EF`, sage `#DDEBDD`, white `#FFFFFF`.
Cards 16–24 px radius, soft shadows. Light mode first, full dark mode. Floating glass bottom nav
(Home, Nutrition, Fitness, Progress, Profile) + floating Jai/Jaya button. "Nova Bar" floating pill for live activity.
Every interactive element has pressed / loading / disabled / success / error states.
Respect reduced motion. No overflow or clipped text at any size or language (test Telugu and Arabic).

## Firestore data rules

- User data only under `users/{uid}/...`. Global data (`foods`, `exercises`, `appConfig`) and `entitlements` are server-write only.
- Every record: `id, uid, createdAt, updatedAt, date, tz, source (manual|ai|device|import), status`.
- Write and test Security Rules with the emulator before any feature that touches a new collection.

## Commands

```
# app
npm ci
npm run dev                  # Vite dev server (uses Functions emulator in dev)
npm run lint                 # tsc --noEmit + eslint
npm test                     # vitest
npm run build                # production web build
npx cap sync                 # copy web build into ios/ and android/
npx cap open ios | android   # open native project (Xcode / Android Studio)
npx playwright test          # e2e + screenshots

# backend
cd functions && npm ci && npm run lint && npm test
npm run test:rules           # rules tests against the emulator
firebase emulators:start
firebase deploy --only functions,firestore:rules,hosting --project fitmeai-dev
```

## Definition of done (every task)

- [ ] `npm run lint` clean (app and functions)
- [ ] Unit tests for logic, widget tests for new screens, rules tests for new collections
- [ ] Works on Android, iOS, web (or the gap is stated)
- [ ] Loading, empty, error, offline states
- [ ] All strings in i18next JSON (at least `en`; other languages via translation step)
- [ ] Data persists and syncs; gating enforced server-side where relevant
- [ ] Short summary to the user: what was built, what was tested, what is NOT done yet

## Roadmap

0. Foundation — project, flavors, Firebase envs, theme, l10n, router, auth, CI
1. Core free tier — onboarding + targets, dashboard, food logging (macros), water, weight, sleep, steps/watch, basic workouts, Store "Coming Soon", settings + delete account
2. Subscriptions — RevenueCat, IAP, Play Billing, Cashfree web, entitlements, paywall, ads for free users
3. Premium — micronutrients, AI food photo scan, barcode
4. Pro — Jai & Jaya chat + voice, reminders, planner + AI auto-planner, generators, reports
5. Admin + hardening — admin panel, security review, performance, accessibility, store listings
6. Post-launch — trainers, store, community, women's wellness
