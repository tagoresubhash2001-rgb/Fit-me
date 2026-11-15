# FIT ME AI: setup the owner must do

Everything below needs an account, a console login or a decision that only the owner can make.
The code is ready for each item; nothing here has been done for you.

## Firebase (blocks running against real projects)
1. Create the projects `fitmeai-dev`, `fitmeai-staging`, `fitmeai-prod` (Blaze plan: Cloud Functions and Secret Manager need it).
2. In each project enable: Authentication (Email/Password, Google, Apple, Phone), Firestore (choose a region,
   for example `asia-south1`; consider an EU project or database for EU users, PRD section 11), Storage, App Check.
3. Register a Web app in each project and copy its config into `.env.development`, `.env.staging`, `.env.production`
   (template: `.env.example`).
4. Register the Android app `com.sindulis.fitmeai` (add your debug and release SHA-1 / SHA-256) and the iOS app
   `com.sindulis.fitmeai`. Download `google-services.json` to `android/app/` and `GoogleService-Info.plist` to `ios/App/App/`.
5. `firebase login`, then:
   ```
   firebase functions:secrets:set GEMINI_API_KEY --project fitmeai-dev
   firebase deploy --only firestore:rules,firestore:indexes,storage,functions --project fitmeai-dev
   (cd functions && npm run build && node lib/scripts/seed.js --project fitmeai-dev --usda <sr_legacy_csv_dir> --yes)
   ```
   The USDA SR Legacy CSV zip is at https://fdc.nal.usda.gov/download-datasets (public domain).
6. App Check: register reCAPTCHA Enterprise (web), App Attest (iOS) and Play Integrity (Android). For development
   create a debug token and put it in `VITE_APPCHECK_DEBUG_TOKEN` (dev only).
7. Phone sign-in: set the SMS region policy and add test phone numbers for QA.

## Apple and Google
- Apple Developer account ($99 a year), a Mac with Xcode, Sign in with Apple capability and HealthKit capability
  enabled on the App ID; set the Apple provider's Service ID and key in Firebase Auth.
- Google Play Console ($25), Health Connect declaration form for steps and sleep.

## Decisions from PRD section 15 still open
- Name of the top tier ("Pro"), annual plans, discount and free-trial length, prices for other countries (Phase 2).
- AI usage limits per tier (defaults in `functions/src/lib/limitDefaults.ts` until recorded) (Phase 3).
- NIN permission for IFCT 2017 data (Phase 1 used USDA + curated dishes instead).
- Ad network for the web (no web ads until decided).
- Legal entity, privacy policy owner and lawyer review; app name trademark check (before launch).

## Phase 2 accounts (subscriptions)
- App Store Connect and Play Console subscription products `premium_monthly` and `pro_monthly` with the PRD prices.
- RevenueCat project (iOS + Android apps, entitlements `premium` and `pro`, webhook URL and auth header).
- Cashfree merchant account (test and live keys, webhook secret) for web subscriptions.
- AdMob account and app IDs; UMP consent message configured.

## Reviews before launch
- Nutrition reviewer: approve the 54 curated dishes (`reviewStatus: pending_review`).
- Fitness reviewer: approve the 102 exercise instructions.
- Native speakers: review hi, te, ta, ar, es, pt, fr, de, id translations and complete the missing strings.
