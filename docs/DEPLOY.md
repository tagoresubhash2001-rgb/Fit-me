# Deploying FitMe

Every deploy runs in GitHub Actions (`.github/workflows/deploy.yml`). Nobody deploys from a laptop.

## Current status (2026-11-15)

| Part | State |
| --- | --- |
| Website (Hosting) | **Live** at https://fit-me1.web.app, deployed by GitHub Actions on every push to `main` |
| Firestore | `(default)` database, native mode, asia-south1; rules and indexes deployed by the workflow |
| Reference data | Seeded once into empty collections: 5,000 USDA foods (+ micronutrients), 54 curated dishes, 102 exercises, appConfig |
| Authentication | **Not started**: Firebase console → Authentication → Get started, then enable Email/Password and Google |
| Billing | **Not linked to fit-me1**, so these are off: Cloud Functions (AI coach, AI food text, data export, account deletion), Secret Manager (`GEMINI_API_KEY`), Cloud Build, Cloud Run, Artifact Registry, the default Storage bucket and Storage rules |

When billing is linked: enable the billing-only APIs (re-run `deploy/setup-gcp.sh`), store the Gemini key
(`printf %s "<key>" | firebase functions:secrets:set GEMINI_API_KEY --project dev --data-file=-`), create the
default Storage bucket (Firebase console → Storage → Get started, asia-south1), then delete `false &&` from the
`if:` lines of the `storage` and `functions` jobs in `.github/workflows/deploy.yml`.

## Environments

| Name | Firebase project | Status | How it deploys |
| --- | --- | --- | --- |
| dev | `fit-me1` | Live at https://fit-me1.web.app | Every push to `main` |
| staging | `fitmeai-staging` | **Not created yet** | Manual run (refuses until the project exists) |
| production | `fitmeai-prod` | **Not created yet** | Manual run + approval (refuses until the project exists) |

`.firebaserc` maps the aliases `dev` → `fit-me1`, `staging` → `fitmeai-staging`, `prod` → `fitmeai-prod`.

## What happens on a push to `main`

1. **Check target**, then **Lint, test and build check** (app lint and unit tests).
2. **Hosting (website)**: builds the web app with the dev config in `deploy/web-config.dev.json`,
   checks the bundle has the fit-me1 config and no emulator hosts, serves the build locally and runs a
   real-browser render check at phone, tablet and desktop sizes (`e2e/render-check.cjs`: sign-in screen
   renders, no page errors, no CSP violations, no horizontal scroll). Only then it deploys Firebase Hosting,
   smoke-tests https://fit-me1.web.app (HTTP 200 and the app shell) and repeats the render check on the
   live site, which also confirms the service worker registers.
   This job does not depend on any backend job, so the website goes live even if a backend job fails.
3. **Firestore rules and indexes** → **Storage rules** → **Cloud Functions** (each still runs if the
   previous backend job failed). The functions job runs functions lint and tests, deploys, then
   smoke-tests `healthCheck` at https://asia-south1-fit-me1.cloudfunctions.net/healthCheck.

Two deploys never overlap: each environment has its own concurrency group.
Pull requests into `main` get a Hosting preview channel on `fit-me1` that expires after 7 days; the link
is posted on the PR. `ci.yml` runs on every push and PR (lint, unit tests, build, Security Rules tests and
callable-function tests on the emulators).

### Web config

The Firebase web config is public (it ships in the website). Dev values live in
`deploy/web-config.dev.json`; `deploy/write-web-env.mjs` turns them into `.env.production.local` at build
time. GitHub environment variables with the same `VITE_*` names override them. Production builds can never
connect to the emulators (`src/lib/env.ts`), and the deploy job fails if the emulator flag is set.
No seed or demo data is part of the web build.

### Authentication (no keys in GitHub)

The workflow signs in to Google Cloud with **Workload Identity Federation**: GitHub's short-lived OIDC
token is exchanged for credentials of the service account
`firebase-adminsdk-fbsvc@fit-me1.iam.gserviceaccount.com`. Only the repository
`tagoresubhash2001-rgb/Fit-me` is accepted (attribute condition on the provider). Nothing secret is stored
in GitHub.

Fallback: if a secret named `FIREBASE_SERVICE_ACCOUNT` (a service-account JSON key) is added to the `dev`
environment, the workflow uses it instead. Minimum roles for that account are the ones granted by
`deploy/setup-gcp.sh`.

### Secrets

- `GEMINI_API_KEY` lives only in Google Secret Manager in `fit-me1` and is read by Cloud Functions at run
  time. To rotate it: `printf %s "<new key>" | firebase functions:secrets:set GEMINI_API_KEY --project dev --data-file=-`
  and then re-run the latest deploy.
- Never commit service-account keys, the Gemini key or any `.env` file (all are git-ignored).

## One-time setup (owner)

1. Open Cloud Shell for fit-me1: https://console.cloud.google.com/cloudshell?project=fit-me1 and run the
   contents of `deploy/setup-gcp.sh` (enables APIs, grants deploy roles to the service account, creates
   the Workload Identity Federation provider for this repository).
2. Firebase console → Authentication → **Get started**, then Sign-in method → enable **Email/Password**
   and **Google**: https://console.firebase.google.com/project/fit-me1/authentication/providers
   `fit-me1.web.app` and `fit-me1.firebaseapp.com` are authorised domains by default.
3. Budget alert: https://console.cloud.google.com/billing → your billing account → Budgets & alerts →
   Create budget → scope: project fit-me1 → amount (for example ₹1,000 or $10 a month) → alerts at 50%,
   90% and 100% → email billing admins.

## Rolling back

- **Website only, instantly:** Firebase console → Hosting → Release history → pick an earlier release →
  **Rollback** (https://console.firebase.google.com/project/fit-me1/hosting/sites/fit-me1).
- **Everything (website, rules, functions):** GitHub → Actions → "Deploy to Firebase" → open an earlier
  successful run → **Re-run all jobs**. That redeploys exactly that commit.
- **Redeploy an earlier commit permanently:** `git revert <bad commit>` on a branch, open a PR, merge.
  The push to `main` deploys the reverted code.
- Firestore data is never touched by deploys; rules and indexes roll back with the steps above.
- **Service worker and rollbacks:** `sw.js`, `index.html` and the manifest are served with `no-cache`, so
  every visit checks for a new release. Open tabs see "A new version of FitMe is ready" and switch on
  **Refresh**; old cached files are cleaned up by the new worker. A Hosting rollback is picked up the same way
  (the rolled-back `sw.js` differs from the current one). If a release ever ships a broken worker, deploy a
  fix: the browser re-checks `sw.js` on every navigation and at least once an hour while the app is open.

## Web app (PWA)

- Manifest `manifest.webmanifest` (name, short name, colours, standalone, start URL, maskable icons, install
  screenshots, shortcuts) and icons in `public/icons/` (regenerate with `node scripts/build-icons.mjs` from
  `public/favicon.svg`; install screenshots with `node scripts/capture-pwa-screenshots.cjs`).
- Service worker `src/sw.ts` (Workbox injectManifest): precaches the app shell, caches fonts and images at
  runtime, serves the app for in-app links offline and `/offline` if nothing is cached. It never caches API,
  auth or Firestore traffic and skips Firebase's reserved `/__/` paths.
- `firebase.json`: SPA rewrite, clean URLs, immutable cache for hashed `/assets/**`, `no-cache` for
  `index.html`, `sw.js` and the manifest, CSP (Firebase, Google sign-in, App Check), HSTS, nosniff,
  Referrer-Policy, Permissions-Policy, frame denial, and `X-Robots-Tag: noindex` on in-app routes. Only the
  sign-in page is indexable (`robots.txt`, canonical, Open Graph and Twitter cards).
- iOS: Safari → Share → Add to Home Screen (apple-touch-icon and status-bar meta tags are set).

## Checking a release on every form factor

After "Deploy to Firebase" is green:

```
node e2e/render-check.cjs https://fit-me1.web.app            # phone, tablet, desktop render + CSP + service worker
node e2e/pwa-check.cjs https://fit-me1.web.app               # installable (Chrome's own checks) + offline
node e2e/devices-flow.cjs https://fit-me1.web.app            # full flow on six devices (creates test accounts)
GOOGLE_APPLICATION_CREDENTIALS=<admin key> node e2e/_cleanup-user.cjs <uid>   # remove each test account
npx lighthouse https://fit-me1.web.app/ [--preset=desktop]   # performance, accessibility, best practices, SEO
```

Devices: iPhone 13 (390×844), Pixel 7, iPad portrait (820×1180), iPad landscape (1180×820), laptop
(1366×768), desktop (1920×1080). The flow covers sign-up, onboarding, food and water add/edit/delete,
planner week and month, Jai and Jaya, Upgrade → Plans, settings and sign-out, then checks for horizontal
scroll at 360, 768, 1024, 1280 and 1920 px. `e2e/a11y-keyboard.cjs` (emulators) adds a keyboard-only run
and an axe accessibility audit; `e2e/review.cjs` writes screenshots of every screen per device, theme and
language.

## Scheduled functions (trial reminders)

`trialReminders` runs daily at 10:00 Asia/Kolkata and sends the "trial ends in 3 days" push and in-app
notification. Deploying it creates a Cloud Scheduler job, which the deploy account
(`firebase-adminsdk-fbsvc@fit-me1.iam.gserviceaccount.com`) is not yet allowed to do, so the workflow deploys
every other function by name and leaves it alone. The function exists in fit-me1 but has no schedule yet, so it
does not run. The in-app trial-ending banner does not depend on it. To turn it on (owner, once):

```
gcloud projects add-iam-policy-binding fit-me1 \
  --member=serviceAccount:firebase-adminsdk-fbsvc@fit-me1.iam.gserviceaccount.com \
  --role=roles/cloudscheduler.admin
```

Then in GitHub: Settings, Secrets and variables, Actions, Variables: add `ENABLE_SCHEDULED_FUNCTIONS` = `true`,
and re-run "Deploy to Firebase".

## Branch protection for `main` (recommended)

GitHub → Settings → Branches → Add rule for `main`: require a pull request before merging, require status
checks "app", "functions" and "emulator-tests" (from CI) to pass, and block force pushes.

## Cost safety in place

- Every callable function is capped at 5 instances; `healthCheck` at 2 (`functions/src/lib/callable.ts`).
- Per-user daily AI limits (`functions/src/lib/limitDefaults.ts`, override in `appConfig/limits`).
- AI features are plan-gated on the server; free users cannot call Gemini at all.
- Artifact Registry clean-up policy for function images is set on deploy (`--force`).

## Not set up yet

- Staging and production Firebase projects (and the GitHub `production` environment with required reviewer).
- Custom domain (later: Hosting → Add custom domain → `app.fitmeai.com` → add the DNS records shown, then add
  the domain to Authentication → Settings → Authorised domains).
- App Check enforcement (needs reCAPTCHA Enterprise for web, App Attest / Play Integrity for mobile; then set
  `ENFORCE_APP_CHECK = true` in `functions/src/lib/callable.ts` and `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`).
- Apple sign-in and phone sign-in (need Apple Developer account and SMS region policy).
- Mobile app builds (Xcode / Android Studio with `GoogleService-Info.plist` and `google-services.json`).
