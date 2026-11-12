# FIT ME AI — Project Instructions for Claude Code

FIT ME AI is a global AI health & wellness app by Sindulis Innovative Solutions.
One Flutter codebase → iOS, Android, Web. Firebase backend for launch (may move later).
Full product spec: `docs/PRD.md` (read the relevant section before starting any task).

## Golden rules (never break these)

1. No mock AI, fake scan results, hardcoded stats, or buttons without a real action in production code.
   Seed/demo data only in dev, clearly behind a flag.
2. Never claim a feature is done until it runs on real data, is saved to Firestore, syncs, and has tests.
3. Never deploy to production. Deploy only to `dev` or `staging` and ask before anything else.
4. Never overwrite or delete existing Firestore data or user files without asking.
5. Plan gating (free / premium / pro) is enforced server-side in Cloud Functions, never only in UI.
6. AI never invents user data and never saves a health record without the user confirming it.
7. No user-facing string hardcoded in Dart — everything goes in ARB localization files.
8. Secrets (Gemini key, RevenueCat, Cashfree, AdMob) only in Secret Manager / env config. Never in the client or git.
9. Work phase by phase (see "Roadmap"). Finish and verify the current phase before starting the next.
10. When something in the PRD is unclear, ask instead of guessing.

## Tech stack

| Layer | Choice |
|---|---|
| App | Flutter (stable), Dart 3, Material 3 with custom theme |
| State / routing | Riverpod (code-gen), go_router |
| Models | freezed + json_serializable |
| Auth | Firebase Auth: Google, Sign in with Apple, email, phone OTP |
| DB | Cloud Firestore |
| Storage | Firebase Storage |
| Backend | Cloud Functions 2nd gen, TypeScript, Node LTS |
| AI | Gemini API called ONLY from Cloud Functions; provider behind an interface so it can be swapped |
| Payments | RevenueCat (`purchases_flutter`) + Apple IAP + Google Play Billing on mobile; Cashfree on web via Functions + webhooks |
| Health data | `health` package (HealthKit / Health Connect) |
| Ads | google_mobile_ads, free users only |
| Push | Firebase Cloud Messaging |
| Monitoring | Crashlytics, Performance, Analytics |
| Security | App Check, Security Rules, Secret Manager |

Firebase projects: `fitmeai-dev`, `fitmeai-staging`, `fitmeai-prod` (use flavors / `--dart-define`).

## Repo structure

```
apps/mobile/            Flutter app (iOS, Android, Web)
  lib/
    core/               theme, router, l10n, env, errors, utils
    data/               repositories, Firestore/Functions services
    domain/             models (freezed), calculators (BMR, TDEE, macros)
    features/<module>/  presentation (screens, widgets) + controllers
  l10n/                 ARB files
  test/ integration_test/
apps/admin/             Flutter web admin panel (later phase)
functions/              Cloud Functions (TypeScript)
  src/ai/               orchestrator, Jai/Jaya personas, tools
  src/billing/          RevenueCat + Cashfree webhooks, entitlements
  src/foods/            food search, import scripts
firestore.rules  storage.rules  firestore.indexes.json
docs/PRD.md             product spec
```

Keep features modular. Business logic in `domain/` and Functions, not in widgets.

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
cd apps/mobile && flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter gen-l10n
flutter analyze && flutter test
flutter run --dart-define=ENV=dev

# backend
cd functions && npm ci && npm run lint && npm test
firebase emulators:start
firebase deploy --only functions,firestore:rules --project fitmeai-dev
```

## Definition of done (every task)

- [ ] `flutter analyze` and `npm run lint` clean
- [ ] Unit tests for logic, widget tests for new screens, rules tests for new collections
- [ ] Works on Android, iOS, web (or the gap is stated)
- [ ] Loading, empty, error, offline states
- [ ] All strings in ARB (at least `en`; other languages via translation step)
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
