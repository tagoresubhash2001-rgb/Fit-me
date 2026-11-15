# Deploying FIT ME AI from GitHub to Firebase

Deployments run from GitHub Actions (`.github/workflows/deploy.yml`). Nobody deploys from a laptop.

| What you do | What happens |
| --- | --- |
| Push or merge into `main` | Tests run, then everything deploys to **fitmeai-dev** |
| Open a pull request into `main` | Tests run, then a temporary preview link (7 days) is posted on the PR |
| Actions → "Deploy to Firebase" → Run workflow → `staging` | Tests run, then everything deploys to **fitmeai-staging** |
| Actions → "Deploy to Firebase" → Run workflow → `production` | Waits for your approval, then deploys to **fitmeai-prod** |

"Everything" means Firestore rules and indexes, Storage rules, Cloud Functions and the web app (Hosting).
The web app is then live at `https://<project-id>.web.app`.

The iOS and Android apps are not deployed by this workflow. They are built in Xcode / Android Studio and
uploaded to the App Store and Google Play (Phase 5).

---

## One-time setup

Do steps 1 to 5 for **fitmeai-dev** first. Repeat them for staging and prod when you need those.

### 1. Firebase project

Follow `docs/SETUP.md`, Firebase section, steps 1 to 3: create the project on the **Blaze** plan, enable
Authentication, Firestore, Storage and App Check, and register a **Web app**. Keep the web app's config
values open; you need them in step 4.

### 2. Gemini key (once per project)

On your computer, with the Firebase CLI:

```
firebase login
firebase functions:secrets:set GEMINI_API_KEY --project fitmeai-dev
```

The Cloud Functions deploy fails until this secret exists.

### 3. Service account for GitHub

1. Open Google Cloud Console → select project **fitmeai-dev** → IAM & Admin → Service Accounts → **Create service account**.
2. Name: `github-deploy`.
3. Grant these roles:
   - Firebase Admin
   - Cloud Functions Admin
   - Cloud Run Admin
   - Service Account User
   - Secret Manager Admin
   - Artifact Registry Administrator
   - API Keys Viewer
4. Open the new account → Keys → Add key → Create new key → **JSON**. A `.json` file downloads.
   Treat it like a password: never commit it, never send it in chat, delete the file after step 4.

### 4. GitHub environment, variables and secret

In the GitHub repo: **Settings → Environments → New environment**. Create `dev`
(later `staging` and `production`, with exactly these names).

Inside the `dev` environment:

**Environment secret** (Add environment secret)

| Name | Value |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | The full contents of the JSON key file from step 3 |

**Environment variables** (Add environment variable), copied from the Firebase web app config:

| Name | Example value |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `fitmeai-dev.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `fitmeai-dev` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `fitmeai-dev.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` |
| `VITE_FIREBASE_APP_ID` | `1:123456789012:web:abc123` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-XXXXXXX` (optional) |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` | App Check site key (needed for staging and prod) |
| `VITE_FUNCTIONS_REGION` | `asia-south1` (optional; this is the default) |

These web config values are public identifiers, not secrets, which is why they are variables.

### 5. Protect production

When you create the `production` environment, tick **Required reviewers** and add yourself.
Production deploys then wait until you click **Approve** in the Actions tab. Under
**Deployment branches**, choose "Selected branches" and allow only `main`.

### 6. Make `main` the default branch

Settings → General → Default branch → switch to `main`. Work then happens on feature branches that are
merged into `main` through pull requests.

---

## After the first deploy

1. Seed the food database once per project (see `docs/SETUP.md`, Firebase step 5, the `seed.js` command).
2. Add the deployed domain to Firebase Authentication → Settings → **Authorized domains** if it is not
   already there (`fitmeai-dev.web.app` is added automatically; custom domains are not).
3. Open `https://fitmeai-dev.web.app`, sign up, and log a meal to confirm Auth, Firestore and Functions work.

## If a deploy fails

| Error in the Actions log | Fix |
| --- | --- |
| `Missing GitHub variable ...` or `Missing secret FIREBASE_SERVICE_ACCOUNT` | Add it to the matching GitHub environment (step 4) |
| `Permission denied` / `iam.serviceAccounts.actAs` | A role from step 3 is missing on the service account |
| `Secret GEMINI_API_KEY not found` | Run step 2 for that project |
| `Billing account not configured` | The project must be on the Blaze plan |
| `... API has not been used in project ...` | Open the link in the error, click **Enable**, then re-run the job |
