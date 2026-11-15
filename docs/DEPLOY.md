# Deploying FIT ME AI

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
   deploys Firebase Hosting and smoke-tests https://fit-me1.web.app (HTTP 200 and the app shell).
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
