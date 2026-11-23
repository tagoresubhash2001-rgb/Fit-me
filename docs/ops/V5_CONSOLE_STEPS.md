# v5: console steps (Google Cloud / Firebase)

This session has no sign-in to Google Cloud. These steps need the project owner (or to give an agent access, see the
end). Each step says where to click and how to undo it.

## 1. Remove the unused App Hosting backend `fitmebackend`
Checked: nothing in the code or config uses `fitmebackend--fit-me1.asia-southeast1.hosted.app`. The website is served
only by Firebase Hosting (`firebase.json` → `hosting.public: dist`). The Auth authorized domains are `localhost`,
`fit-me1.firebaseapp.com`, `fit-me1.web.app` and PR preview channels; the hosted.app domain is not among them. The
app has no CORS settings that mention it.
1. https://console.firebase.google.com/project/fit-me1/apphosting → `fitmebackend` → **Settings** → **Delete backend**
   (deletes its Cloud Run service and stops the builds on every push to `main`). Undo: create a new backend.
2. GitHub connection: https://console.cloud.google.com/developer-connect/connections?project=fit-me1 → the connection used
   by App Hosting → **Delete**. Then on GitHub: https://github.com/settings/installations → **Firebase App Hosting** →
   Configure → remove the `Fit-me` repository (or Uninstall).
3. Leftover images: https://console.cloud.google.com/artifacts?project=fit-me1 → repository
   `firebaseapphosting-images` (asia-southeast1) → **Delete**.
4. Leftover source files: https://console.cloud.google.com/storage/browser?project=fit-me1 → buckets used only by App
   Hosting builds (names containing `apphosting` or `cloudbuild` in asia-southeast1) → **Delete**.

## 2. Costs
- **Function image clean-up (1 day)**: done by the deploy workflow after this PR merges (job "Function image
  clean-up policy"; it also runs with every functions deploy). Images older than a day are removed automatically.
- **Deploy only what changed**: done in `.github/workflows/deploy.yml` (this PR).
- **Hosting history, keep 10**: https://console.firebase.google.com/project/fit-me1/hosting/sites/fit-me1 → Release
  history → ⋮ → **Version history settings** → keep **10**.
- **Storage lifecycle**: https://console.cloud.google.com/storage/browser?project=fit-me1 → bucket → **Lifecycle** →
  Add rule → Delete object → Age:
  - `fit-me1-backups`: 14 days.
  - `gcf-sources-216212194424-asia-south1` and `fit-me1_cloudbuild` (if present): 7 days.
- **Daily Firestore backup, keep 7 days**: https://console.cloud.google.com/firestore/databases/-default-/disaster-recovery?project=fit-me1
  → **Create backup schedule** → Daily → retention **7 days**.
- **Logging**: https://console.cloud.google.com/logs/router?project=fit-me1 → keep `_Default` (30 days); delete any other
  sink that is not `_Required` / `_Default`. The app has no debug logging that writes large volumes.
- **Phone (SMS) sign-in**: the app does use it (sign-in screen → "Continue with phone"). To limit SMS fraud:
  https://console.firebase.google.com/project/fit-me1/authentication/settings → **SMS region policy** → **Allow** →
  **India** → Save. App Check enforcement must wait until the apps are registered in App Check
  (https://console.firebase.google.com/project/fit-me1/appcheck): reCAPTCHA Enterprise for web, Play Integrity for
  Android (needs the app in Google Play), App Attest for iOS. Turning enforcement on before that would block every user.
- **Budget ₹1,000 / month**: https://console.cloud.google.com/billing/budgets → **Create budget** → Projects: fit-me1 →
  Amount ₹1,000 → thresholds 50%, 90%, 100% → "Email alerts to billing admins and users" and, for
  sinfoxmedia@gmail.com, **Connect a Monitoring email notification channel** with that address.
- **Cost report**: https://console.cloud.google.com/billing/reports → last 30 days, group by SKU.

## 3. Admin `sinfoxmedia@gmail.com`
1. Sign in at https://fit-me1.web.app/admin with your current super-admin Google account.
2. **Admin management** → email `sinfoxmedia@gmail.com` → role **Super admin** → Add. This sets the `role` claim and the
   `staff/{uid}` document and writes `adminLogs`, exactly as the role system expects.
3. On a browser signed in to sinfoxmedia@gmail.com: https://fit-me1.web.app/admin/login → **Continue with Google**.
   Firebase keeps one account per email address, so Google sign-in attaches to the existing account (same user ID) and
   the role stays. If Admin management afterwards shows two entries for that email, give the role to the one that signed
   in with Google and remove the role from the other.

## Giving an agent access instead
Run in Cloud Shell (https://shell.cloud.google.com/?project=fit-me1) a short-lived grant, or allow the agent's GitHub
workflow approach; then ask it to do steps 1–3 and verify them.
