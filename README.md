# Fit-me — FIT ME AI

Global AI health and wellness app. One React + TypeScript codebase for web, with iOS and Android via Capacitor.
Firebase backend (Auth, Firestore, Storage, Cloud Functions, App Check).

- Rules for contributors and Claude Code: [`CLAUDE.md`](CLAUDE.md)
- Product spec: [`docs/PRD.md`](docs/PRD.md) · original spec: [`docs/ORIGINAL_SPEC.md`](docs/ORIGINAL_SPEC.md)
- Status of every module: [`docs/AUDIT.md`](docs/AUDIT.md) · owner setup: [`docs/SETUP.md`](docs/SETUP.md)

## Run locally (no Firebase project needed)

```
npm ci && npm ci --prefix functions
npm run build --prefix functions
npx firebase emulators:start --only auth,firestore,functions,storage --project demo-fitmeai
# in a second terminal: load foods (USDA CSV folder optional) and exercises into the emulator
(cd functions && FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node lib/scripts/seed.js --project demo-fitmeai [--usda <sr_legacy_csv_dir>])
npm run dev:emulators          # http://localhost:5173
```

## Checks

```
npm run lint && npm test                       # app
(cd functions && npm run lint && npm test)     # functions
npm run test:rules                             # Security Rules (emulator)
npm run test:integration                       # callable functions (emulator)
node e2e/flow.cjs                              # end-to-end flow + screenshots (emulators + dev server running)
```

## Mobile

```
npm run build && npx cap sync
npx cap open android   # Android Studio
npx cap open ios       # Xcode (Mac only)
```
