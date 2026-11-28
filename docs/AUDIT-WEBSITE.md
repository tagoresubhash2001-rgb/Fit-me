# FitMe website and app audit (28 Nov 2026)

Checked against the owner's requirements A–I. Base: commit `e1de32a` ("Website v1 (local work)").
Status: **Done**, **Partial**, **Missing**, **Broken**. The "After" column is updated as fixes land.

## Found during the audit (outside the list, fixed first)

| Issue | Evidence | Status before | After |
|---|---|---|---|
| `verifyCashfreePayment` gave any signed-in user a paid plan without checking a payment; it was live on fit-me1 | `functions/src/billing/subscription.ts` (commit 2f7d37c) | Broken (critical) | Fixed in bb6357f: server-created orders, verified with Cashfree, fail closed |
| Lint failed (14 errors) and the layout-guard test failed, which blocked every CI deploy | `npm run lint`, `src/test/layout-guard.test.ts` | Broken | Fixed in bb6357f |
| `createCashfreeCheckout` used hard-coded prices instead of `appConfig/pricing` | `subscription.ts` | Broken | Fixed in bb6357f |

## A. Brand

| Req | Status before | Evidence | Fix needed | After |
|---|---|---|---|---|
| A1 One palette, #1FA45B primary, metric accents, AA, light and dark | Partial | App tokens `src/index.css:25-60` use `--primary: #168247`, cream canvas; the website has its own palette in `src/features/website/tokens.ts` plus ~650 raw hex values; no heart-rate or steps token; manifest theme `#F7F5EF` (`vite.config.ts:58`) | One token set derived from #1FA45B (brand fill; AA-safe deeper shade of the same hue only where white text sits on green); add `--data-calories/steps/heart`; the website uses only tokens | |
| A2 "FitMe" everywhere, tagline, no "FIT ME AI"/"FitMe AI" | Partial | User-facing text is clean; two comments: `firestore.rules:3`, `deploy/setup-gcp.sh:2`; untracked iOS build copy `ios/App/App/capacitor.config.json` says "FIT ME AI" | Fix comments (done in bb6357f); `npx cap sync ios` regenerates the iOS copy | Done in bb6357f (comments) |
| A3 Approved logo unchanged, no emojis, lucide icons only | Partial | Logo `public/favicon.svg` fine; emoji/symbols `src/features/pages/DeleteAccountPage.tsx:83` (⚠️), `DownloadPage.tsx:263` (✓), `WorkoutsScreen.tsx:434` (✓); hand-drawn inline `<svg>` icons in the website (28) | Replace with lucide icons; keep only the logo SVG | |
| A4 No hard-coded hex or user-facing strings in website code | Broken | ~650 hex values in `src/features/website/**` and the legal pages; almost no `t()` calls (`AboutPage`, `FaqPage`, `HowItWorksPage`, `NotFoundPage`, `WebsiteFooter`: 0) | Rewrite the website on tokens and i18next (`src/locales/site.en.json`) | |

## B. Premium visuals

| Req | Status before | Evidence | Fix needed | After |
|---|---|---|---|---|
| B1 Cards: no thick dark border, 24–28 px radius, soft shadows, glass option | Partial | `src/components/ui/Card.tsx:15-17` 1 px `#0F1720` border, 20 px radius (`index.css:153`) | Soft hairline border, 24 px radius, softer layered shadow, `glass` variant | |
| B2 Bold large metric numbers, hierarchy, spacing | Partial | Metric tiles exist; sizes vary per screen | Shared metric number style in `components/ui` | |
| B3 Rings and charts: thick rounded strokes, gradients, animated fill, illustrated empty states | Partial | Rings are flat colour; empty states are text and icon | Gradient strokes and animated fill in the ring primitive; illustrated `EmptyState` | |
| B4 Floating frosted pill bottom nav, animated active pill | Partial | `src/app/Shell.tsx` bottom bar is white and full width; the active pill does not move | Floating glass pill with a `layoutId` active indicator | |
| B5 Rounded food thumbnails where images exist | Partial | Food rows show icons only | Thumbnail in the food row when `imageUrl` exists | |
| B6 Changes at design-system level only | Done (rule) | – | Keep changes in `components/ui` and tokens | |

## C. Screenshots

| Req | Status before | Evidence | Fix needed | After |
|---|---|---|---|---|
| C1 Demo account seeded only in emulator/dev with a full week of data | Missing | No `scripts/seed-demo.ts`; `e2e/seed-history.cjs` seeds a few days; `public/screenshots/phone-*.png` are older captures | `scripts/seed-demo.ts` (refuses non-emulator projects) plus a capture script | |
| C2 No pricing, plans, paywall, upgrade or trial banners in screenshots | Broken | `public/screenshots/phone-5-plans.png` was a plans screen (removed in e1de32a); the home capture shows trial/upgrade UI | Dev-only `?screenshots=1` flag hides all of it | |
| C3 Device frames, WebP/AVIF with srcset, licensed stock | Missing | Plain PNG `<img>` in `HomePage.tsx` | CSS device frame, WebP at 1x/2x via `<picture>`/`srcset`; no stock photos used | |

## D. Website

| Req | Status before | Evidence | Fix needed | After |
|---|---|---|---|---|
| D1 Real routes with own title, meta, OG, canonical; branded 404; refresh works | Partial | Routes exist (`src/app/App.tsx:116-140`); `WebsiteLayout.tsx` sets only title and description: no OG, canonical or robots per page; Hosting `**` rewrite makes refresh work; 404 returns HTTP 200 (SPA) | Per-route head manager (title, description, canonical, OG, Twitter), sitemap updated | |
| D2 Premium hero with gradient mesh, floating phones, glass metric cards, three CTAs | Partial | `HomePage.tsx` hero has a carousel and two CTAs; no "Continue in Browser" (the web app was disabled) | New hero | |
| D3 Bento sections, scroll reveal, counters, spring motion, reduced motion | Partial | CSS transitions only; `motion` is installed (`package.json:47`) but unused on the website | Use `motion` with `useReducedMotion` | |
| D4 No fake stats, ratings, counts or reviews; testimonials only approved from Firestore | Broken | `HomePage.tsx:54-59` "100% Private & On-Device", "Certified Google Health Connect integration", "24/7"; release notes say "Certified Health Connect" (`DownloadPage.tsx:22`) | Remove claims; testimonials section reads approved testimonials only | |
| D5 Contact form saves to `contact_messages`, success/error, spam protection | Partial | `ContactPage.tsx:40` writes, honeypot present, hard-coded strings; rules accepted any extra fields | Rules tightened (bb6357f); i18n, time-trap and rate limit in the rewrite | Rules done in bb6357f |
| D6 Remove `LandingScreen.tsx` if unused | Partial | Not imported anywhere | Delete | Done in bb6357f |

## E. Dynamic Island navbar

| Req | Status before | Evidence | Fix needed | After |
|---|---|---|---|---|
| E1 Graphite pill, compact → springs open (motion layout) | Partial | `DynamicIslandNavbar.tsx` uses CSS transitions, not `motion` layout animation | Rebuild with `motion` `layout` | |
| E2 Scroll down → compact with "Get the App"; scroll up → expand | Partial | Scroll handling exists without the "Get the App" pill | Add | |
| E3 Features dropdown grows out of the island | Missing | Separate floating panel (`DynamicIslandNavbar.tsx:232`) | Island grows to contain the menu | |
| E4 Sliding active-link indicator (`layoutId`) | Missing | Static background per link | `layoutId` pill | |
| E5 Mobile morphing panel; closes on outside tap, close, Escape, route change; scroll lock; focus trap | Partial | Escape (`:112`) only; no focus trap or scroll lock | Add | |
| E6 aria-expanded, aria-current, focus rings | Partial | Present (`:232`, `:293`) with hex ring colours | Keep, tokenised | |

## F. Download options

| Req | Status before | Evidence | Fix needed | After |
|---|---|---|---|---|
| F1 Detect Android, iPhone, iPad (incl. iPadOS desktop UA), desktop; QR on desktop | Partial | `DownloadPage.tsx:37-41` misses iPadOS (Mac UA with touch); no QR | `detectDevice()` with tests; QR (local generator, no third-party call) | |
| F2 Versioned APK from `app_config/android`, no hard-coded v2.0.1, `/download/android` with the right Content-Type, 3-step guide | Broken | Hard-coded `v2.0.1` in `DownloadPage.tsx:17`, `HomePage`, `FeaturesPage`, `HowItWorksPage`, `ReleasesPage`, `firebase.json` redirect, `InAppUpdateDialog.tsx:27` | `androidDownload` function (bb6357f); page reads `app_config/android` only | Redirect done in bb6357f |
| F3 iOS: no "Coming soon" or waitlist; `app_config/ios` App Store → TestFlight → browser | Broken | iOS waitlist form `DownloadPage.tsx:75-100` | Three-state iOS card | |
| F4 Admin Releases: iOS link fields; waitlist kept and exportable | Partial | `ReleasesPage.tsx` has Android fields only | iOS fields; waitlist table with CSV export | |
| F5 iOS GitHub Actions + fastlane to TestFlight | Missing | No workflow, no `ios/App/fastlane` | Workflow with secrets list | |

## G. Continue in Browser

| Req | Status before | Evidence | Fix needed | After |
|---|---|---|---|---|
| G1 Full customer web app at `/app/*` | Missing | `App.tsx:110-150`: on the web every customer route goes to the website; the member app runs only in the native shells | Web member app under `/app` (own router, basename `/app`) | |
| G2 Old paths redirect to `/app/...`; links, prefetch, shortcuts, deep links, SW scope | Broken | Old paths redirect to `/download?redirect=mobile_only` (`App.tsx:128-136`); PWA shortcuts point to `/food` (`vite.config.ts:73`) | Hosting 301s and client redirects to `/app/...`; shortcuts and `start_url` under `/app`; SW scope `/` covers it | |
| G3 One line: automatic steps and heart rate need the mobile app | Missing | – | Notice in Health and Home on the web | |
| G4 Native opens straight into the member app | Done | `App.tsx:154+` native branch | Keep | |
| G5 `/admin` works; `/vendor` → `/admin` | Done | `App.tsx:104-112` | Keep | |
| G6 Rewrites for website routes and `/app/**`; noindex `/app/**` and `/admin/**`; CSP valid | Partial | Single `**` rewrite works; noindex headers only for old paths (`firebase.json`) | noindex for `/app/**` and `/admin/**`; CSP re-checked | |

## H. Android app (sideloaded APK)

| Req | Status before | Evidence | Fix needed | After |
|---|---|---|---|---|
| H1 Release signing from `C:\Users\HP\fitme-keys`, SHA-1/256 in Firebase, Google Sign-In in release | Partial | `android/app/build.gradle:9-42` signs from `keystore.properties`/env (not committed); fingerprints cannot be checked from here | Owner checks the fingerprints (listed in the report) | |
| H2 Health Connect with rationale, missing HC, denied permissions, sensor fallback, WorkManager | Done | Manifest rationale `AndroidManifest.xml:27-41`; `@capgo/capacitor-health`; `StepSampler`/`StepSampleWorker` fallback | – | |
| H3 FCM with POST_NOTIFICATIONS, channels, deep links, token refresh; battery guide; Crashlytics | Partial | Permission (`AndroidManifest.xml:69`), token refresh and deep links (`src/data/push.ts`), Crashlytics (`build.gradle:67`), `BatteryOptimizationPrompt.tsx`; no notification channels created | Create channels at start-up; deep links accept `/app/...` | |
| H4 In-app updater from `app_config/android`, optional and forced | Partial | `InAppUpdateDialog.tsx` reads config but compares against a hard-coded `CURRENT_VERSION_CODE = 201` | Read the installed version from `@capacitor/app` | |
| H5 Direct APK pays via web/Cashfree (server-verified), behind a distribution flag | Broken | No distribution flag; the Cashfree callable was unverified | Server fixed (bb6357f); `VITE_DISTRIBUTION` (`direct`/`play`/`appstore`) picks Cashfree or store billing | Server done in bb6357f |

## I. Repo hygiene and security

| Req | Status before | Evidence | Fix needed | After |
|---|---|---|---|---|
| I1 No secrets in git, including history | Done | Full history scan: no keystore, `keystore.properties`, `.env`, service-account JSON or private key ever committed. Only Firebase client config (web API key in `deploy/web-config.dev.json`, Android key in `google-services.json`): these are public identifiers, not secrets; restrict them by app/referrer in Google Cloud | Add `*.apk`, `*.aab`, `keystore.properties` to `.gitignore` | Done in bb6357f |
| I2 APK committed in git | Broken | `public/downloads/FitMe-v2.0.1.apk` (11.9 MB) | Untracked and ignored; served from Storage via `androidDownload` (bb6357f). It stays in old history (removing it needs a history rewrite, which is a force-push) | Done in bb6357f |
| I3 Rules: public read only `app_config` and the APK; public create-only `contact_messages`, `ios_waitlist`; tests | Partial | `firestore.rules:234-270` (2f7d37c): `app_config` writable by any staff role, `app_downloads` open `create: if true`, no shape checks; no rules tests | Tightened with tests (bb6357f) | Done in bb6357f |
