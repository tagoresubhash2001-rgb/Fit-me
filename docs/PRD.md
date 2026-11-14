# FIT ME AI: Master Product Requirements Document (v2.0)

**Owner:** Tagore Subhash Maguluri, Sindulis Innovative Solutions
**Last updated:** 14 November 2026
**Status:** Approved for build

This document is the single source of truth for the FIT ME AI build. `docs/ORIGINAL_SPEC.md` describes each module in more detail; where the two documents disagree, this PRD wins.

## 1. Product overview

FIT ME AI is a global AI health and wellness app by Sindulis Innovative Solutions. It launches on iOS, Android and the web from day one. It combines nutrition, fitness, planning, tracking and two AI coaches (Jai and Jaya) in one app that feels as if it was built for each user's own country.

A first React version was built in Google AI Studio. Claude Code audits that build against this PRD and completes it.

**Positioning:** FIT ME AI = Nutrition + Fitness + Health Tracking + AI Coaching + Intelligent Planning. It is not just a calorie counter.

**Three USPs**

1. **Local food intelligence, globally.** The app understands each user's own cuisine: Andhra meals in Guntur, tacos in Texas, sushi in Tokyo.
2. **Jai and Jaya, AI coaches.** A fitness coach (Jai) and a nutrition and wellness coach (Jaya) who speak the user's language and know their data.
3. **Intelligent planner.** Daily, weekly and monthly health schedules that adapt when plans slip.

**Target users**

| Segment | Main need |
| --- | --- |
| Weight loss, gain or maintenance | Calorie and macro targets that work |
| Fitness and gym users | Workout plans, progress and recovery |
| Busy professionals and students | Time-based routines and reminders |
| People managing lifestyle conditions | Food and habit tracking (non-clinical) |
| Women | Cycle-aware wellness (opt-in) |
| Non-English speakers worldwide | The app and AI in their own language |

## 2. Business model and pricing

FIT ME AI earns from four revenue streams, with subscriptions at the core. A generous free tier drives downloads; the paid tiers unlock AI features.

**Revenue streams**

1. **Subscriptions:** Free, Premium and Pro, sold through in-app purchase and on the web.
2. **Ads:** Google AdMob (our own ad network later), shown to free users only.
3. **Trainer commission:** certified trainers sell monthly coaching inside the app, and Sindulis takes a commission.
4. **Store commission:** partner brands sell products in the app. The Store launches as "Coming soon".

**Plan tiers**

| Feature | Free | Premium | Pro |
| --- | --- | --- | --- |
| Food logging with macros (calories, protein, carbs, fat, fiber) | Yes | Yes | Yes |
| Step tracking and watch / health-app connection | Yes | Yes | Yes |
| Water, weight and sleep logging | Yes | Yes | Yes |
| Basic workouts and history | Yes | Yes | Yes |
| Micronutrients (vitamins, minerals, sodium, sugar) | No | Yes | Yes |
| AI food photo scan | No | Yes | Yes |
| Jai and Jaya AI coaches (chat and voice) | No | No | Yes |
| Smart reminders | No | No | Yes |
| Weekly and monthly planner, AI auto-planner | No | No | Yes |
| AI meal plans and workout generator | No | No | Yes |
| Advanced analytics and reports | No | No | Yes |
| Ads | Shown | None | None |

**Monthly prices**

| Market | Premium | Pro |
| --- | --- | --- |
| India | ₹199 | ₹399 |
| United States | $9 | $29 |
| United Kingdom | £9 | £29 |
| Eurozone | €9 | €29 |
| Other countries | Local equivalent via store price tiers | Local equivalent via store price tiers |

Prices are always shown in the user's local currency.

## 3. Payments and subscriptions

Mobile subscriptions use Apple and Google in-app purchase in every country. The web app uses Cashfree. RevenueCat unifies all three, so each account has one plan on every device.

| Platform | Payment method | Store commission on subscriptions |
| --- | --- | --- |
| iOS | Apple In-App Purchase | 15% under the Small Business Program (under $1M a year); otherwise 30% in year one, then 15% |
| Android | Google Play Billing | 15% (10% service fee + 5% billing fee) |
| Web | Cashfree | Cashfree gateway fee only |

The stores deduct local tax (GST or VAT) before taking their commission. Approximate net revenue per subscriber per month at 15%: India ₹143 / ₹287, US $7.65 / $24.65, UK £6.40 / £20.50 (Premium / Pro).

**How it works**

1. The user subscribes in the app (Apple or Google) or on the web (Cashfree).
2. RevenueCat receives the purchase and the stores' server notifications. Cashfree webhooks are verified in a Cloud Function and synced to RevenueCat.
3. A Cloud Function writes the user's entitlement (free, premium or pro) and its expiry date to Firestore.
4. The apps and the web read the entitlement from Firestore. Server-side functions (AI calls, scans) check it before they run.

**Rules**

- Entitlements are always enforced on the server and never trusted from the client.
- Support renewal, expiry, upgrade, downgrade, cancellation, refunds, grace periods and restoring purchases.
- Apply to the Apple Small Business Program before launch.
- Mobile store subscriptions stay with Apple and Google. They cannot be moved to Cashfree later, even if the backend moves off Firebase.
- Trainer and Store payments are for real-world services and goods, so they use Cashfree split payments, not in-app purchase.

## 4. Global localization

Every user should feel the app was built for their country. The country is detected from the device and store region at sign-up and can be changed in Settings.

| What adapts | How |
| --- | --- |
| Currency | Store price tiers on mobile; local currency through Cashfree on the web |
| App language | Full UI translation, with the device language as the default |
| AI language | Jai and Jaya reply in the user's chosen language, in text and voice |
| Food database | The country's common foods and dishes rank first in search |
| Serving units | Local units: katori, roti, idli count, cup, oz, slice, bowl |
| Measurement units | kg/lb, cm/ft-in, ml/fl oz, km/mi, °C/°F |
| Formats | Local date, time, number and week-start formats |
| Content | Local workout names, plus festivals and fasting periods (for example Ramadan and Navratri) in the planner |

**Launch languages:** English, Hindi, Telugu, Tamil, Spanish, Portuguese, French, German, Arabic (right-to-left) and Indonesian. More languages are added through the same translation files.

**Rules**

- No hard-coded user-facing text. All text lives in i18next JSON translation files.
- The right-to-left layout must work for Arabic.
- Telugu, Hindi, Tamil and Arabic text must render without clipping in every card and button.
- Voice input confirms what it heard before anything is saved.

## 5. Platforms and tech stack

One React + TypeScript codebase builds the web app, and Capacitor wraps the same build for iOS and Android. Firebase is the backend for launch. Because the backend may move off Firebase later, business logic lives in Cloud Functions behind clean service interfaces rather than scattered through the client.

| Layer | Technology |
| --- | --- |
| Apps | React 19 + TypeScript + Vite + Tailwind 4 (web); Capacitor for iOS and Android |
| State and routing | Zustand stores backed by Firestore; React Router |
| Authentication | Firebase Auth: Google, Apple, email, phone OTP (native plugin inside the mobile apps) |
| Database | Cloud Firestore |
| Files | Firebase Storage (food photos, progress photos) |
| Backend logic | Cloud Functions (TypeScript, 2nd gen) |
| AI | Gemini API through Cloud Functions (text, vision, voice); the model provider is swappable |
| Subscriptions | RevenueCat + Apple IAP + Google Play Billing; Cashfree on the web |
| Notifications | Firebase Cloud Messaging |
| Health data | Apple HealthKit and Android Health Connect |
| Ads | Google AdMob in the mobile apps (free users only); web ad network to be decided |
| Hosting | Firebase Hosting (web app and landing pages) |
| Monitoring | Crashlytics, Performance Monitoring, Analytics |
| Security | App Check, Security Rules, Secret Manager |
| Admin panel | A separate, role-gated route in the same app |

**Environments:** three Firebase projects (dev, staging and prod), plus the Emulator Suite for local and CI tests.

**Build requirements:** a Mac with Xcode for iOS builds, an Apple Developer account ($99 a year) and a Google Play Console account ($25 one-time).

## 6. MVP scope and roadmap

The MVP launches the Free, Premium and Pro tiers with the AI coaches. Trainers, the Store, community and clinical features come after launch. Each phase must pass its gate before the next one starts.

1. **Phase 0 – Foundation.** Capacitor setup, three Firebase environments, design system, localization, CI. *Gate:* the app runs on iOS, Android and the web with sign-in.
2. **Phase 1 – Core free tier.** Onboarding and health profile, target calculations, dashboard, food logging with macros, water, weight, steps, watch connection, basic workouts. *Gate:* a free user can track a full day, with data saved and synced.
3. **Phase 2 – Subscriptions.** RevenueCat, Apple IAP, Google Play Billing, Cashfree on the web, entitlement enforcement, ads for free users. *Gate:* sandbox purchases unlock features on all three platforms.
4. **Phase 3 – Premium.** Micronutrients, AI food photo scan with portion editing, barcode scan. *Gate:* scan-to-log works with real AI and user confirmation.
5. **Phase 4 – Pro.** Jai and Jaya (chat and voice), reminders, weekly and monthly planner, AI auto-planner and rescheduling, meal and workout generators, advanced reports. *Gate:* the AI uses real user data and never saves anything without confirmation.
6. **Phase 5 – Admin and hardening.** Admin panel, Security Rules tests, performance, accessibility, store listings. *Gate:* security and QA sign-off.
7. **Launch.** App Store, Google Play and the web.
8. **Post-launch.** Trainer marketplace, Store (opening from "Coming soon"), community and challenges, women's wellness, support for lifestyle conditions.

**Not in the MVP:** clinical glucose features, pregnancy flows, community leaderboards, our own ad network.

## 7. Module specifications

The app has 19 modules. Jai and Jaya can be opened from every screen through a floating button. "Tier" shows the lowest plan that unlocks a module's core; some modules mix tiers (see section 2).

**Bottom navigation (5 tabs):** Home (dashboard and food logging), Planner, Health (progress and trackers), Workouts and Store. Profile and Settings open from the avatar in the header.

| # | Module | Tier | Key requirements | Phase |
| --- | --- | --- | --- | --- |
| 1 | Onboarding and health profile | Free | Name, age, sex, height, weight, target weight, country, language, activity level, diet type, allergies, equipment, schedule. Calculates BMI, BMR (Mifflin-St Jeor), TDEE, and calorie, macro and water targets with validated formulas. | 1 |
| 2 | Dashboard | Free | Calories eaten, burned and remaining; macros; water; steps; workout; sleep; weight; today's schedule. Each card opens its module. | 1 |
| 3 | Nutrition | Free / Premium | Meals by slot, search, manual entry, saved meals, recipe builder, edit / delete / undo, duplicate detection. Micronutrients are Premium. | 1, 3 |
| 4 | AI food scanner | Premium | Photo to items, portions and nutrition with an uncertainty range; the user edits and confirms before saving; barcode scan. | 3 |
| 5 | Water | Free | Quick add, custom amount, adjustable target, history. | 1 |
| 6 | Workouts | Free / Pro | Exercise library with demos, timer, sets and reps, rest timer, history, custom builder. The AI generator is Pro. | 1, 4 |
| 7 | Steps and devices | Free | HealthKit and Health Connect, watch data; the source is shown on every synced value. | 1 |
| 8 | Planner | Pro | Daily, weekly and monthly plans; add, edit, delete, skip, repeat, reschedule, complete. AI auto-planner from work hours. Missed activities are rescheduled only with the user's approval. | 4 |
| 9 | Weight and body | Free | Weight, measurements, private progress photos, trend and plateau detection; no judgement on daily swings. | 1 |
| 10 | Sleep | Free | Manual or device sleep data, schedule, history. | 1 |
| 11 | Jai and Jaya | Pro | See section 8. | 4 |
| 12 | AI hub | Premium / Pro | One place for the scanner and the meal-plan, workout and plan generators. | 3, 4 |
| 13 | Progress and reports | Free / Pro | Daily summary is free; weekly, monthly and yearly reports and PDF export are Pro. | 1, 4 |
| 14 | Goals and habits | Free | Goals, streaks and badges; no guilt messages when a streak is missed. | 1 |
| 15 | Reminders | Pro | Meal, water, workout, sleep and weigh-in reminders; each category can be switched on or off. | 4 |
| 16 | Subscriptions | All | Paywall, plans, restore purchases, manage subscription, history. | 2 |
| 17 | Trainers | Post-launch | See section 10. | Post |
| 18 | Store | Coming soon | A visible tab with a "Coming soon" screen at launch. | 1 (placeholder) |
| 19 | Profile and settings | Free | Profile, units, language, theme, notifications, privacy, data export, in-app account deletion. | 1 |

**Nova Bar:** a floating pill at the top of the screen that shows live activity (workout timer, calories left, next task). It uses iOS Live Activities and Android ongoing notifications where available, and an in-app pill everywhere else.

## 8. AI architecture: Jai and Jaya

One AI orchestrator in Cloud Functions powers every AI feature. Jai and Jaya are two personas on top of it, sharing the same user context.

| Coach | Focus |
| --- | --- |
| Jai (male voice) | Workouts, exercise form, motivation, consistency, activity |
| Jaya (female voice) | Food, nutrition, meal plans, hydration, routines, women's wellness education |

**The orchestrator:** loads the user's profile and recent logs, routes each request to the right tool (food analysis, plan generator, scheduler), calls the model, validates the output, enforces plan and rate limits, and logs usage.

**Example:** the user says "Start my weight-loss plan from tomorrow." The orchestrator reads their weight, target, food preferences, schedule and calendar, drafts a meal and workout plan, shows a preview, and saves it to Firestore only after the user approves.

**Rules**

- The AI never invents user data. If there is no data, it says so.
- Nothing said in a chat becomes a health record without explicit confirmation.
- Calorie and target numbers come from validated formulas and the food database, never from model guesses.
- No diagnosis, no medication or insulin advice, no emergency treatment. Urgent symptoms get a "contact a doctor or emergency services" response.
- No emojis in AI replies or notifications.
- API keys live only in Secret Manager; the client never calls the model directly.
- Usage limits per tier are enforced on the server, with a graceful fallback when the AI is down or times out.
- Replies are in the user's language. Voice uses speech-to-text and text-to-speech, with distinct voices for Jai and Jaya.

## 9. Food data strategy

The food database is global from launch. It is built from open datasets plus our own curated dishes, and every item records its source. Each licence below must be confirmed before import.

| Source | Coverage | Licence |
| --- | --- | --- |
| USDA FoodData Central | Global base foods with detailed micronutrients | Public domain |
| Open Food Facts | Packaged foods and barcodes worldwide | ODbL: attribution and share-alike on the data |
| IFCT 2017 (NIN, India) | Indian raw foods | Commercial use needs permission from NIN |
| UK CoFID and other national tables | Country-specific foods | Check each licence |
| FIT ME AI curated dishes | Cooked regional dishes (pesarattu, biryani, pho, tacos) built from recipes | Owned by Sindulis |

**Rules**

- Each food stores calories, protein, carbs, fat, fiber, sugar, sodium, key micronutrients, serving units and its source.
- Search ranks the user's country and language first. Dishes carry local names in several languages.
- Users can create custom foods. These stay private unless a nutrition reviewer approves them.
- AI photo estimates link to database items and show a range, never a falsely exact number.

## 10. Trainers, Store and ads

Trainers and the Store are commission marketplaces; ads are shown to free users only. Trainers launch after the MVP, and the Store shows "Coming soon" at launch.

**Trainer marketplace (post-launch)**

- Trainers apply, upload their certification and ID, and are approved by an admin before going live.
- Each trainer profile shows a photo, specialties, languages, country, rating and the monthly fee the trainer sets.
- Users subscribe monthly. A trainer sees only the data the user chooses to share.
- Chat, plan assignment and check-ins happen inside the app.
- Payments go through Cashfree split payments: Sindulis keeps its commission and the rest is paid out to the trainer.
- A trainer dashboard shows clients, earnings and payouts.

**Store ("Coming soon" at launch)**

- A visible Store tab with a "Coming soon" screen and a "Notify me" sign-up.
- Later, partner brands list products. Orders, delivery and returns are handled by the brand, and Sindulis earns a commission through Cashfree split payments.
- An admin reviews health claims on every product before it is listed.

**Ads**

- Google AdMob banners and native ads for free users only. Any paid plan removes all ads.
- No ads on health-sensitive screens (sleep, cycle tracking, conditions).
- Personalised ads only with consent (GDPR / UK consent banner, Apple ATT). Health data is never used for ad targeting.
- Our own ad network comes later.

## 11. Privacy, compliance and safety

FIT ME AI handles health data in many countries, so privacy is built in from Phase 0, not added later. A qualified lawyer must review the app before launch.

| Law or policy | Applies to | Key requirement |
| --- | --- | --- |
| DPDP Act 2023 | India | Clear consent, purpose limits, deletion on request |
| GDPR / UK GDPR | EU, UK | Explicit consent for health data, data export, deletion, EU data-region option |
| US state privacy laws (for example Washington's My Health My Data Act) | US | Separate consent for consumer health data |
| Apple HealthKit and Google Health Connect policies | iOS, Android | Health data is never used for ads or sold |
| App Store and Google Play health-app rules | Both | Privacy labels, in-app account deletion, medical disclaimers |

**Rules**

- Separate, revocable consent screens for health data, device sync, AI processing and ads.
- Data export and full account deletion from Settings.
- Progress photos and food photos are private by default.
- A clear disclaimer: FIT ME AI is not a medical device and does not replace a doctor.
- Admins cannot read private health records without explicit authorisation, and every such access is audit-logged.
- Clinical features (glucose, pregnancy) launch only after expert review.
- No unverifiable claims such as "HIPAA compliant" or "disease reversal".

## 12. Design system

Premium, calm and friendly: green and cream, soft rounded cards and Apple-level smoothness. **Light mode is the primary experience and the default.** Dark mode is fully supported as an option. The look must never drift into navy blue or purple and indigo gradients.

**Brand colours**

| Token | Hex | Use |
| --- | --- | --- |
| Primary green | #1FA45B | Brand, primary buttons, active states, progress |
| Green pressed | #178A4C | Pressed and hover state of primary buttons |
| Green subtle | #E8F5EC | Selected backgrounds, soft highlights |
| Orange | #FF8A24 | Highlights, streaks, energy (use sparingly) |
| Dark | #0F1720 | Main text; base of dark mode |
| Cream | #F7F5EF | App background (light mode) |
| Sage | #DDEBDD | Wellness cards and soft highlight sections |
| White | #FFFFFF | Cards and surfaces |
| Text secondary | #5B616B | Secondary text (light mode) |
| Border | #E6E3D8 | Borders and dividers (light mode) |
| Error | #E5484D | Errors and destructive actions |

**Dark mode:** background #0F1720, cards #17212B, raised surfaces #1F2A35, borders #26323E. Same green and orange.

**Data colours** (for example blue for water and violet for sleep) may be used inside charts and small icons only, never as page or card backgrounds.

**Typography**

- One family: Inter for Latin scripts, with Noto Sans Telugu, Noto Sans Devanagari, Noto Sans Tamil and Noto Sans Arabic as fallbacks so every launch language renders correctly.
- Type scale (mobile):

| Style | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| Display | 28 / 34 | Semibold | Screen titles |
| Title | 20 / 26 | Semibold | Card titles |
| Body | 15 / 22 | Regular | Main text |
| Small | 13 / 18 | Regular | Supporting text |
| Caption | 12 / 16 | Medium | Labels (12 px is the minimum anywhere) |

- Numbers use tabular figures.
- No serif or monospace fonts. No all-caps headings; small section labels may be uppercase at 11–12 px, used sparingly.
- Sentence case for buttons and headings ("Add food", not "ADD FOOD").

**Components**

- **Cards:** white (dark mode #17212B), 20 px radius, 1 px border, soft shadow (0 1px 2px rgba(15,23,32,.04), 0 4px 16px rgba(15,23,32,.06)). No glow shadows.
- **Buttons:** primary is solid green with white text, 48 px high, 14 px radius. Secondary is white with a border. Destructive is soft red. Every button has pressed, disabled, loading and focus states.
- **Inputs:** 48 px high, 12 px radius, label above, error text below.
- **Bottom navigation:** a white floating bar; the active tab is green with a pill indicator.
- **Jai and Jaya button:** a solid green floating circle.
- **Progress rings:** green on a light grey track (#ECEAE2; dark mode #26323E).
- **Icons:** lucide-react only, 1.75 stroke, 20 px in navigation and 18 px inline.
- **Spacing:** a 4 / 8 px grid, with 16 px screen padding on mobile.
- **Nova Bar:** collapsed, expanded, active (live progress) and completed states.
- **Charts** for calories, weight, macros, water, workouts and sleep.

**Writing and motion**

- No emojis anywhere: UI text, AI replies or notifications.
- Plain, friendly language. No jargon such as "metabolic surveillance", "OS", "engine" or "matrix".
- Motion is 150–250 ms ease-out; respect reduced-motion settings. No decorative glow blobs, spinning or bouncing icons, or heavy gradients.
- All colours come from design tokens (Tailwind theme and CSS variables), never hard-coded hex values in components.
- Layouts work from 360 px phones to tablets and desktop, with no overflow or clipped text in any language.

The reference images in the original specification are for mood only and must not be copied.

## 13. Data model and security

All user data lives under the user's own document. Every module reads and writes the same model, so a change in one place shows up everywhere.

```text
users/{uid}                              profile, targets, country, language, units
users/{uid}/foodLogs/{id}                date, meal slot, foodId, quantity, nutrients, source
users/{uid}/waterLogs/{id}
users/{uid}/workoutLogs/{id}
users/{uid}/weightLogs/{id}
users/{uid}/sleepLogs/{id}
users/{uid}/plans/{id}                   meal, workout, weekly and monthly plans
users/{uid}/schedule/{id}                activities with recurrence and status
users/{uid}/habits/{id}
users/{uid}/aiThreads/{id}/messages/{id}
users/{uid}/reports/{id}
entitlements/{uid}                       plan, expiry, source (written by the server only)
foods/{id}                               global food database
exercises/{id}
trainers/{id}                            post-launch
products/{id}                            post-launch
appConfig/{doc}
```

This is a starting structure. Claude Code finalises paths and indexes from the actual query patterns.

**Every record has:** id, uid, createdAt, updatedAt, date (the user's local date and time zone), source (manual, ai, device or import) and status.

**Security**

- Security Rules: users can read and write only their own data; entitlements and global collections are server-write only.
- Rules are tested with the Emulator Suite in CI before every deploy.
- App Check protects all Firebase services and Cloud Functions.
- Cloud Functions validate every input and apply per-user rate limits on AI.
- Daily Firestore backups, with a restore tested before launch.

## 14. Quality rules and acceptance

A feature is done only when it works with real data on iOS, Android and the web, is tested, and is saved and synced. Demo data and mock AI never count as finished.

**Non-negotiables**

- No mock AI, fake scan results, hard-coded statistics or buttons without a working action in production.
- Every screen has loading, empty, error and offline states.
- Every write is validated, saved to Firestore and synced in real time across devices.
- Free / Premium / Pro gating is checked on the server, not just hidden in the UI.
- Nothing is deployed to production without staging tests and approval.

**Testing**

- Unit tests for calculations (BMR, TDEE, macros, nutrient totals, streaks, recurrence).
- Component and end-to-end tests for the core flows: onboarding, logging food, scanning food, purchasing and the planner.
- Security Rules tests in the emulator.
- Manual QA on a small Android phone, an iPhone, a tablet and desktop web, in at least English, Telugu and Arabic.

**Store readiness**

- In-app account deletion, privacy policy, terms of use and a health disclaimer.
- Sign in with Apple alongside Google on iOS.
- Accurate Apple privacy labels and Google Play data-safety form.
- Store screenshots and listings localised for the launch languages.

## 15. Decisions to record

The owner has made these decisions; their final values must be written here before the phase that needs them.

| Decision | Needed by | Value |
| --- | --- | --- |
| Name of the top tier (this document uses "Pro") | Phase 2 | To be recorded |
| Annual plans, discount and free-trial length | Phase 2 | To be recorded |
| Prices for other countries, or the stores' automatic local tiers | Phase 2 | To be recorded |
| AI usage limits per tier (messages and scans per day) | Phase 3 | To be recorded |
| Trainer and Store commission percentages | Post-launch | To be recorded |
| Final list of launch countries and languages | Phase 0 | Section 4 list unless changed |
| NIN permission for IFCT 2017 data | Phase 1 | To be recorded |
| Legal entity and privacy-policy owner; lawyer review | Before launch | To be recorded |
| App name and trademark check in key markets | Before launch | To be recorded |
| Mac and Apple Developer account for iOS builds | Phase 0 | To be recorded |
| Ad network for the web version | Phase 2 | To be recorded |
