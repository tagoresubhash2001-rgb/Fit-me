# FIT ME AI — Codebase Audit

**Audited build:** Google AI Studio export (commit `6a8d876`), React 19 + Vite 6 + Tailwind 4 + Zustand 5, Express `server.ts` calling Gemini.
**Audited against:** `docs/PRD.md` (v2.0, source of truth) and `docs/ORIGINAL_SPEC.md` (v1.0).
**Date:** 2026-11-14. This file is updated at the end of every phase (see "Change log" at the bottom).

Status key:
- **DONE**: works with real data, saved, no fakes
- **PARTIAL**: some parts real; the missing parts are listed
- **MOCKED**: UI exists, but the data or behaviour is fake or hardcoded
- **MISSING**: not built
- **UNUSED**: the component exists but is never rendered

Effort key: **S** (under 1 day), **M** (1–3 days), **L** (over 3 days).

## 0. Baseline facts (verified)

| Fact | Evidence |
| --- | --- |
| No Firebase at all. Every piece of user data is in `localStorage` via Zustand or component state. | `src/stores/*.ts` (all read/write `localStorage`); `firebase-blueprint.json` and `src/lib/dbSchema.ts` are design notes only; no `firebase` package in `package.json` |
| Fake guest auth: the user is always signed in as `temporary-guest-id` / `user@example.com`. | `src/stores/auth.store.ts:25-27`. The store is never imported by any screen. |
| Gemini is called from an Express server (`server.ts`), with no authentication, rate limiting or plan gating. When the key is missing or the call fails, it returns invented nutrition numbers. | `server.ts:41-211` |
| No i18n library. UI text is hardcoded English, with Telugu phrases mixed into strings and AI prompts. | All components; `server.ts:65-75` |
| No country, currency, units or timezone handling. Everything is metric, and prices are hardcoded in ₹. | `src/types.ts`, `Store.tsx:30-37` |
| No subscriptions or plan gating anywhere. | `SubscriptionModal.tsx` is never rendered and uses old Base/Premium/Luxury pricing |
| No tests, no linter beyond `tsc --noEmit`, no CI. | `package.json` |
| Navy/dark visual theme with glow blobs and gradients; not the PRD §12 brand. | `App.tsx:197-199` (`bg-[#070C14]`, blurred blobs); hex colours hardcoded in every component |
| Builds and typechecks cleanly. | `npm ci && tsc --noEmit && vite build` pass at `6a8d876` |

## 1. Core modules (ORIGINAL_SPEC §5, modules 01–18)

| # | Module | Status | Files | What is missing | Tier | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | Onboarding and health profile | PARTIAL | `AIOnboarding.tsx`, `stores/user.store.ts`, `utils/healthCalculations.ts` | Six-step form saved to `localStorage` only. Missing fields: country, state, language, allergies, equipment, work hours, sleep schedule, exercise experience. No imperial units. **Calculations deviate from PRD/CLAUDE.md:** lose = TDEE−450 (spec −500), gain = TDEE+400 (spec +300), male floor 1400 (spec 1500), invented disease multipliers on TDEE (thyroid ×0.88, PCOS ×0.92, diabetes ×0.95: not validated formulas), "other" gender offset −78, water floor 2000 ml plus disease add-ons, no fiber target, no BMI shown. No unit tests. | Free | M |
| 02 | Dashboard | MOCKED | `Dashboard.tsx` (1,197 lines) | Calories, macros and water come from local stores, which start from fake seeds (steps 8420, water 1250 ml). Burned calories are not real. Health score and AI tips are hardcoded text (`Dashboard.tsx:1182`). No sleep, weight or today's-schedule cards wired to real data. | Free | L |
| 03 | Nutrition and calorie logging | PARTIAL | `Dashboard.tsx:35-262`, `stores/nutrition.store.ts`, `lib/foodDb.ts` (unused) | Quick-add from an 8-item hardcoded list (`Dashboard.tsx:35-44`). Free-text log calls `/api/analyze-food`, which **invents** numbers when Gemini fails (`server.ts:151-200`, `App.tsx:117-134` falls back to 250 kcal). Logs have no date, so "today" never resets. No search over a real food DB, no serving units, saved meals, recipe builder, edit, undo or duplicate detection. `lib/foodDb.ts` (22 items) is never imported. | Free / Premium (micros) | L |
| 04 | AI food scanner | MOCKED | `Dashboard.tsx:174-233` `handleSimulatedScan` | Camera and barcode return fixed foods after a 2 s timer and **save without confirmation**. No camera access, no AI, no ranges, no confirmation step. | Premium | L |
| 05 | Water | PARTIAL | `stores/hydration.store.ts`, `Dashboard.tsx`, `Trackings.tsx` | Starts at a fake 1250 ml (`hydration.store.ts:18`). One running number with no per-day logs, no history, no daily reset, no custom amount. Target is not user-adjustable. | Free | S |
| 06 | Workouts | MOCKED | `Workout.tsx` | 4 hardcoded routines with invented calories; "32 workouts logged" is hardcoded (`Workout.tsx:15`). The AI generator is a 1.5 s timer returning a template (`Workout.tsx:30-50`). The timer works, but nothing is saved. No exercise library, sets/reps, rest timer or history. "Marketplace" tab is a trainer placeholder. | Free / Pro (generator) | L |
| 07 | Weekly and monthly planner | MOCKED | `Planner.tsx`, `stores/planner.store.ts` | Day-only view. Yesterday/today/tomorrow all show the **same** slot map (`planner.store.ts:18,55`). Seeded with 10 fake activities (`planner.store.ts:32-52`). The "AI optimizer" is a timer injecting hardcoded disease-specific slots with unverifiable claims ("reduces glycemic rise by up to 34%", `planner.store.ts:107-135`). No weekly/monthly views, recurrence, skip, reschedule, reminders or approval flow. | Pro | L |
| 08 | Weight and body | MOCKED | `stores/tracking.store.ts:82-101`, `Trackings.tsx` | Seeded weight 68 kg on "May 25" and fake measurements. No trend, plateau detection, averages, BMI tracking or progress photos. Dates are display strings, not real dates. | Free | M |
| 09 | Sleep and recovery | MOCKED | `stores/tracking.store.ts:68-73`, `Trackings.tsx` | Seeded 7.2 h sleep log with an invented "sleep score". "Recovery score" is a formula on fake inputs (`Trackings.tsx:150-156`). No start/end times, history or source shown. | Free | M |
| 10 | AI coaches Jai and Jaya | PARTIAL | `FloatingAI.tsx`, `stores/ai.store.ts`, `server.ts:41-111`, `AICoach.tsx` (unused) | Chat really calls Gemini, but through unauthenticated Express. Prompt forces Telugu-English for every user and **injects disease advice**. Returns emoji and canned fallback replies when there is no key (`server.ts:85-91`). Chat history lives in `localStorage` with a seeded first message (`ai.store.ts:33-35`). Voice is **simulated**: it picks a random fixed phrase (`FloatingAI.tsx:159-175`). No streaming, no tier gating, no actions with confirmation. | Pro | L |
| 11 | Health intelligence (diabetes, women's wellness) | MOCKED | `Trackings.tsx`, `stores/tracking.store.ts:38-80`, `ClinicalTrackingModules.tsx` (unused), `DiseasePrograms.tsx` (unused) | Seeded glucose, BP, HR, stress, cycle and cholesterol logs. Health, recovery and immunity "scores" are invented formulas (`Trackings.tsx:141-163`). "HIPAA Secure Medical Sandbox" claim (`Trackings.tsx:516`). Clinical features are **post-launch per PRD §6**. | Post-launch | L |
| 12 | AI hub | MISSING | — | No hub screen. | Premium / Pro | M |
| 13 | Progress and reports | MOCKED | `Trackings.tsx:55-80,330-470`, `ProgressCenter.tsx` (unused) | 7-day heatmap is seeded with fake levels, and tapping a cell cycles the value (user-editable fake history). No daily/weekly/monthly/yearly reports, PDF or export. | Free (daily) / Pro | L |
| 14 | Goals and habits | MISSING | `Dashboard.tsx` supplement checklist (`:78-93`) | No goals, streaks or badges. | Free | M |
| 15 | Community and challenges | MISSING | — | Post-launch per PRD §6. | Post-launch | L |
| 16 | Notifications and reminders | MOCKED | `WhatsAppAlerts.tsx` (unused) | WhatsApp "simulator" only. No FCM, no per-category toggles. | Pro | M |
| 17 | Subscriptions and payments | MISSING | `SubscriptionModal.tsx` (unused) | Old ₹99/₹149/₹249 Base/Premium/Luxury plans, fake 1.5 s "payment" (`SubscriptionModal.tsx:60-66`). No RevenueCat, IAP, Cashfree or entitlements. | All | L |
| 18 | Profile and settings | PARTIAL | `ProfileSettings.tsx`, `stores/theme.store.ts` | Profile edits are saved to `localStorage`. Theme toggle works (dark default). No language, units, notifications, privacy, data export, logout or **account deletion**. "Reset" does `localStorage.clear()` (`App.tsx:98`). | Free | M |

## 2. PRD-only areas

| Area | Status | Files | What is missing | Tier | Effort |
| --- | --- | --- | --- | --- | --- |
| Auth | MOCKED | `stores/auth.store.ts` | Fake guest user; store unused. Needs Firebase Auth (Google, Apple, email, phone OTP), native plugin on Capacitor, session persistence, logout, deletion. | Free | M |
| Localization (PRD §4) | MISSING | — | i18next with 10 launch languages, RTL, country/currency/units/timezone detection, local serving units, Noto fonts. | Free | L |
| Payments (PRD §3) | MISSING | `SubscriptionModal.tsx` (unused) | Same as module 17. | All | L |
| Ads (PRD §10) | MISSING | — | AdMob (mobile only, free users), consent (UMP / ATT), none on health-sensitive screens. Web ads undecided. | Free | M |
| Store (PRD §10) | MOCKED | `Store.tsx` | Six fake products with prices, ratings and a fake cart (`Store.tsx:30-50`). PRD: "Coming soon" screen plus "Notify me" saved to Firestore. | Free | S |
| Trainers (PRD §10) | MOCKED | `Workout.tsx` "marketplace" segment | Placeholder. Post-launch: hide at launch. | Post-launch | L |
| Admin (PRD §5, §11) | MOCKED | `AdminPanel.tsx` (unused) | Local-state food list "Simulated initial food records" (`AdminPanel.tsx:14`). Needs a role-gated route, custom claims and audit log. | — | L |
| Security (PRD §13) | MISSING | `server.ts` | No auth on API, no App Check, no rules, no rate limits, no Secret Manager. Gemini key comes from `.env` on the server process. | — | M |
| Devices / steps (module 7) | MOCKED | `stores/device.store.ts`, `stores/workout.store.ts:24` | Fake "Fitbit Sense 3 Pro connected, 82% battery" (`device.store.ts:28-31`), simulated sync timer, fake 8420 steps. Needs HealthKit / Health Connect via a Capacitor plugin. | Free | M |
| Nova Bar (PRD §7) | MISSING | — | No live-activity pill. | Free | M |
| Data model (PRD §13) | MISSING | `firebase-blueprint.json`, `lib/dbSchema.ts` | Blueprint only. Records have no `uid`, real `date`, `tz`, `source` or `status`; timestamps are display strings like `'08:00 AM'`. | — | L |
| Tests / CI | MISSING | — | Vitest, Playwright, rules tests, GitHub Actions. | — | M |
| Native apps (Capacitor) | MISSING | — | No `capacitor.config.ts`, `ios/` or `android/`. | — | M |

## 3. Unused components: decision for each

> **Redesign step (2026-11-14):** `DiseasePrograms`, `Supplements`, `WhatsAppAlerts`, `AdminPanel`,
> `SubscriptionModal`, `ClinicalTrackingModules` and `lib/dbSchema.ts` were deleted as decided below.
> `AICoach`, `CalorieTracker` and `ProgressCenter` were also deleted: once React types were installed they no
> longer type-checked (wrong meal-slot union, missing `teluguTitle` field), and their useful ideas are already
> listed below for the Phase 1/4 rebuilds.

| Component | Lines | Decision | Where |
| --- | --- | --- | --- |
| `AICoach.tsx` | 339 | **Merge, then delete.** Its persona selector and TTS (`speechSynthesis`) ideas move into the Jai/Jaya chat sheet (Phase 4). The rest duplicates `FloatingAI.tsx`. | Phase 4, `src/features/coach/` |
| `DiseasePrograms.tsx` | 387 | **Delete.** Disease "programs" (seed cycling, "reverses hepatic lipid accumulation") are unverifiable medical claims. Clinical features are post-launch and need expert review (PRD §11). | — |
| `Supplements.tsx` | 435 | **Delete.** Random "consistency score" (`:68`), simulated AI (`:114-115`). Supplements are not in the PRD MVP. | — |
| `ProgressCenter.tsx` | 266 | **Reuse layout only** for the Health tab's progress section (Phase 1), fed by real logs. | Phase 1, `src/features/health/` |
| `WhatsAppAlerts.tsx` | 253 | **Delete.** WhatsApp is not in the PRD; reminders are FCM (Phase 4). | — |
| `AdminPanel.tsx` | 240 | **Delete now, rebuild** as a role-gated route in Phase 5. Nothing in it is real. | Phase 5 |
| `CalorieTracker.tsx` | 614 | **Merge** its meal-slot layout ideas into the nutrition logging screen (Phase 1), then delete. | Phase 1, `src/features/nutrition/` |
| `SubscriptionModal.tsx` | 227 | **Delete, rebuild** as the paywall with PRD §2 tiers and store prices (Phase 2). | Phase 2 |
| `health/ClinicalTrackingModules.tsx` | 1,076 | **Delete.** It is imported in `Dashboard.tsx:15` but never rendered. Clinical tracking is post-launch. | — |
| `lib/foodDb.ts` | 491 | **Delete** once the Firestore `foods` collection exists (Phase 1). The 22 items have no `source`. | Phase 1 |
| `lib/dbSchema.ts`, `firebase-blueprint.json` | — | **Delete** after the real model in `src/domain/` and `firestore.rules` exists (Phase 0). | Phase 0 |

## 4. Prioritised pending list, by PRD phase

**Redesign (before Phase 0, visual only):** tokens, shared UI components, light-first theme, PRD §12 navigation (Home, Planner, Health, Workouts, Store; profile from the avatar), remove emojis, jargon, glow and spin effects, screenshots.

**Phase 0 – Foundation**
1. Firebase SDK, env config for dev/staging/prod, emulator wiring. *(Firebase project creation and login: owner.)*
2. Firebase Auth with all four methods; native plugin on Capacitor; sign-in screen; logout; account deletion.
3. Firestore data model (PRD §13) plus `firestore.rules` and `storage.rules` with emulator tests.
4. Move all stores from `localStorage` to Firestore with the offline cache. No seeded defaults.
5. i18next with 10 locales, RTL, Noto fonts, country/currency/units/timezone detection.
6. Cloud Functions: move `/api/coach` and `/api/analyze-food` out of `server.ts`, behind auth, App Check, zod validation and rate limits, with the key in Secret Manager. **Remove all invented fallbacks.**
7. Capacitor iOS/Android projects. App Check.
8. Vitest, Playwright, ESLint, GitHub Actions CI.

**Phase 1 – Core free tier:** exact calculator (unit tested) and full onboarding; dated food logs with real food DB search (USDA subset + curated regional dishes), serving units, edit/delete/undo, saved meals, recipe builder, duplicate detection; dated water/weight/sleep logs with trends; HealthKit/Health Connect steps with source; exercise library, sets/reps/rest timer, saved history; dashboard from real logs with empty states; goals, streaks, badges; Store "Coming soon" with "Notify me"; settings with units, language, data export and deletion. Delete fake defaults, seeded logs, scores and the heatmap.

**Phase 2 – Subscriptions and ads:** `entitlements/{uid}` written by a server function; server-side gating helper; RevenueCat (mobile); Cashfree (web) with verified webhooks; paywall with store prices; restore/manage; AdMob plus UMP/ATT for free mobile users.

**Phase 3 – Premium:** micronutrients gated; real photo scan via a Gemini vision Function (ranges, confirm before saving); barcode via Open Food Facts; AI hub. Delete `handleSimulatedScan`.

**Phase 4 – Pro:** orchestrator; Jai and Jaya streaming chat plus real STT/TTS; planner with daily/weekly/monthly views, recurrence and reschedule-with-approval; AI auto-planner; meal and workout generators; FCM reminders; reports with PDF export.

**Phase 5 – Admin and hardening:** role-gated admin route; security review; performance (code-splitting: the bundle is currently over 500 kB); accessibility; store listing checklist; staging deploy.

## 5. Every mock / fake data location

| File:line | What is fake |
| --- | --- |
| `src/stores/auth.store.ts:25-27` | Guest user `user@example.com`, always authenticated |
| `src/stores/hydration.store.ts:18` | Water starts at 1250 ml |
| `src/stores/workout.store.ts:24` | Steps start at 8420 |
| `src/stores/device.store.ts:28-31` | Fake connected Fitbit (82% battery), HealthKit "sandbox", BLE scale |
| `src/stores/device.store.ts:45-55` | Simulated sync (1.2 s timer) |
| `src/stores/device.store.ts:35` | Fake heart rate 72 bpm |
| `src/stores/tracking.store.ts:40-43` | Seeded glucose logs (104, 135 mg/dL, HbA1c 5.8) |
| `src/stores/tracking.store.ts:48-50` | Seeded BP 122/82 |
| `src/stores/tracking.store.ts:55-58` | Seeded heart rate logs |
| `src/stores/tracking.store.ts:63-65` | Seeded stress log |
| `src/stores/tracking.store.ts:70-72` | Seeded sleep 7.2 h, sleep score 78 |
| `src/stores/tracking.store.ts:77-79` | Seeded cycle log |
| `src/stores/tracking.store.ts:84-86` | Seeded weight 68 kg, body fat 21.4% |
| `src/stores/tracking.store.ts:91-93` | Seeded cholesterol |
| `src/stores/tracking.store.ts:98-100` | Seeded body measurements |
| `src/stores/planner.store.ts:32-52` | 10 seeded planner activities |
| `src/stores/planner.store.ts:107-135` | "AI optimizer" = timer plus hardcoded slots with medical claims |
| `src/stores/planner.store.ts:18,55` | Same slot map shown for yesterday, today and tomorrow |
| `src/stores/ai.store.ts:33-35` | Seeded coach greeting |
| `src/stores/ai.store.ts:87` | Canned fallback reply on error |
| `src/stores/user.store.ts:15-31` | Default profile values (age 26, 172 cm, 68 kg) used if onboarding is skipped |
| `src/utils/healthCalculations.ts:22-28` | Fallback weight/height/age when missing |
| `src/utils/healthCalculations.ts:37,49-58` | Invented gender-neutral offset and disease TDEE multipliers |
| `src/App.tsx:117-134` | Invented nutrients when the AI response lacks them (250 kcal, 8 g protein, ...) |
| `src/App.tsx:145` | "Logged fallback meal" message |
| `server.ts:85-91` | Canned coach reply when there is no key |
| `server.ts:151-200` | Hardcoded nutrition for biryani/dosa/idli/etc. when there is no key |
| `server.ts:186-199` | Hardcoded 250 kcal "Custom Food Item" on any AI error |
| `src/components/Dashboard.tsx:35-44` | 8 hardcoded "health foods" with invented micronutrients |
| `src/components/Dashboard.tsx:174-233` | `handleSimulatedScan`: fixed camera/barcode results, auto-saved |
| `src/components/Dashboard.tsx:1182` | Hardcoded "fiber is hovering at a protective range" insight |
| `src/components/Trackings.tsx:58-66` | Seeded 7-day heatmap |
| `src/components/Trackings.tsx:73-79` | Heatmap cells editable by tapping (rotates fake values) |
| `src/components/Trackings.tsx:82-100` | Seeded gut, skin/hair and mood logs |
| `src/components/Trackings.tsx:131-163` | Health/recovery/immunity scores from invented formulas with default inputs |
| `src/components/Workout.tsx:15` | "32 workouts logged" |
| `src/components/Workout.tsx:19-24` | Hardcoded routines with invented calories |
| `src/components/Workout.tsx:30-50` | Fake AI workout generator (timer + template) |
| `src/components/Store.tsx:30-37` | Six fake products, prices, ratings |
| `src/components/Store.tsx:41-45` | Fake cart |
| `src/components/FloatingAI.tsx:159-175` | Simulated voice input (random fixed phrase) |
| `src/components/Supplements.tsx:68,114-115` | Random consistency score, simulated AI (unused) |
| `src/components/SubscriptionModal.tsx:60-66` | Fake payment (unused) |
| `src/components/WhatsAppAlerts.tsx:26-70` | Simulated WhatsApp alerts (unused) |
| `src/components/AdminPanel.tsx:14` | Simulated food records (unused) |
| `src/components/health/ClinicalTrackingModules.tsx:126` | localStorage "mock collections" (unused) |
| `src/lib/dbSchema.ts:43` | "Simulated active collections" |

## 6. Risks

**Health claims and safety**
- Unverifiable medical claims in UI and prompts: "Reduces post-prandial glycemic rise by up to 34%" (`planner.store.ts:119`), "Reverses hepatic lipid accumulation" (`DiseasePrograms.tsx:86`), "Excretes blood glucose safely into skeletal frame" (`planner.store.ts:120`), seed-cycling hormone claims. PRD §11 forbids "disease reversal" claims.
- The AI prompt instructs the model to "strictly incorporate medical guides" for diabetes, PCOS and thyroid (`server.ts:81`). PRD §8 forbids diagnosis and medication advice; clinical features are post-launch.
- Calorie targets use invented disease multipliers, contrary to "validated formulas only" (PRD §8, ORIGINAL_SPEC module 01).
- AI fallbacks invent nutrition numbers and save them as real logs. PRD §8: "The AI never invents user data."
- No medical disclaimer anywhere.

**Privacy and compliance**
- "HIPAA Secure Medical Sandbox Mode Active" (`Trackings.tsx:516`): an unverifiable compliance claim (PRD §11).
- Health data (glucose, cycle, BP) is stored unencrypted in `localStorage`, with no consent screens (PRD §11 needs separate, revocable consents).
- No data export or account deletion (required by GDPR, DPDP and the app stores).
- `/api/*` endpoints are unauthenticated: anyone can spend the Gemini quota.

**Store policy**
- In-app account deletion is missing (Apple 5.1.1(v), Google Play policy).
- Sign in with Apple is missing (required on iOS when Google sign-in is offered).
- A fake store with prices and a fake "payment" flow could be read as misleading.
- Simulated device connections ("Fitbit connected") break ORIGINAL_SPEC §13: "Never show fake synchronisation."
- Emojis and jargon ("Surveillance Hardware" badge, "Water matrix index", "Eco-Drive") conflict with PRD §12.

## Change log

| Date | Phase | Change |
| --- | --- | --- |
| 2026-11-14 | Audit | Initial audit of the AI Studio export. |
| 2026-11-14 | Redesign | PRD §12 tokens (`src/index.css`), self-hosted Inter + Noto (Telugu, Devanagari, Tamil, Arabic), shared UI kit in `src/components/ui/`, light default theme, new header/nav (Home, Planner, Health, Workouts, Store; profile from the avatar), solid green coach button, all screens remapped to tokens, emojis and jargon removed, unverifiable HIPAA claims replaced with a medical disclaimer. Screenshots in `docs/screenshots/`. Features and data unchanged: all MOCKED statuses above still apply. Also found: Settings "Gemini temperature" slider changes nothing (remove in Phase 1). |
