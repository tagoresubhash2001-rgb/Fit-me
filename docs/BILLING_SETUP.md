# Billing setup: App Store, Google Play, RevenueCat, Cashfree

What is built (PRD section 2 and 3): prices in `appConfig/pricing`, a 30-day free trial once per account,
billing periods (monthly, 3 months 20% off, yearly 40% off), entitlement states (trialing, active, grace,
cancelled, expired) written only by Cloud Functions, verified store webhooks and a trial-ending reminder.
What needs the owner: store and payment accounts, products, keys. Until then the app records interest and
says "Payments are launching soon".

## 1. Billing modes (`appConfig/billing.mode`)

| Mode | What "Start 30-day free trial" does |
| --- | --- |
| `interest` | Saves `planInterest/{uid}` and shows "Payments are launching soon". |
| `test` | Accounts with the custom claim `billingTester` (set with `e2e/_set-tester.cjs`) get a real server-side trial (`source: test`) so the whole lifecycle can be tested; everyone else is treated as `interest`. This is the setting on fit-me1 (dev). |
| `live` | Mobile: purchase through RevenueCat (App Store / Google Play); entitlements arrive by webhook. Web: Cashfree checkout (see section 5); until it is configured the button saves interest. |

Change the mode in the Firebase console (Firestore → `appConfig/billing`). Clients cannot write it.

## 2. Products (identical ids everywhere)

| Product id | Plan | Period | India price | US | UK | Eurozone |
| --- | --- | --- | --- | --- | --- | --- |
| `premium_monthly` | Premium | 1 month | ₹199 | $9 | £9 | €9 |
| `premium_quarterly` | Premium | 3 months | ₹478 | $21.60 | £21.60 | €21.60 |
| `premium_yearly` | Premium | 1 year | ₹1,433 | $64.80 | £64.80 | €64.80 |
| `pro_monthly` | Pro | 1 month | ₹399 | $29 | £29 | €29 |
| `pro_quarterly` | Pro | 3 months | ₹958 | $69.60 | £69.60 | €69.60 |
| `pro_yearly` | Pro | 1 year | ₹2,873 | $208.80 | £208.80 | €208.80 |

The app computes these from `appConfig/pricing`; the store prices must match. If a store does not offer an
exact price point, pick the nearest point **below** and update the config (`rounding: down`) so the app never
shows a bigger saving than the store charges. Regular prices for the launch offer (India: Premium ₹299, Pro
₹599) are only shown struck through when `markets.IN.offerEndsAt` is set to an ISO date-time in the future.

## 3. App Store Connect (iOS)

1. App Store Connect → your app → **Subscriptions** → create a subscription group **FitMe**.
2. Add the six auto-renewable subscriptions above (Reference name = product id, Product ID = product id).
   Within the group, rank Pro above Premium so upgrades and downgrades are handled by Apple.
3. For each: set the duration (1 month / 3 months / 1 year), prices per territory (table above; other
   territories use Apple's equalised price), localised display name and description.
4. **Introductory offer** on each product: type **Free**, duration **1 month**, all territories. Apple
   applies eligibility (once per subscription group per Apple ID), which matches "trial once per account".
5. Agreements, Tax and Banking: the Paid Apps agreement must be active.
6. Create an **In-App Purchase key** (Users and Access → Integrations → In-App Purchase) and upload it to
   RevenueCat. Turn on **App Store Server Notifications V2** with the URL RevenueCat gives you.
7. Sandbox testers: Users and Access → Sandbox → add testers; trials renew every few minutes in sandbox.

## 4. Google Play Console (Android)

1. Play Console → your app → **Monetize → Products → Subscriptions** → create `premium` and `pro`
   subscriptions; inside each add base plans `monthly` (P1M), `quarterly` (P3M) and `yearly` (P1Y), all
   auto-renewing. Product ids in RevenueCat: `premium_monthly` etc. (RevenueCat maps `premium:monthly`).
2. Prices per country from the table above.
3. On each base plan add an **offer**: eligibility "New customer acquisition — never had this
   subscription", phase **Free trial, 1 month**.
4. Grace period: 7 days; account hold: 30 days (RevenueCat maps them to `grace` / `expired`).
5. Link a Google Cloud service account with the Play Developer API and upload its JSON to RevenueCat.
   Turn on Real-time developer notifications (Pub/Sub topic from RevenueCat).
6. License testers: Setup → License testing → add tester Google accounts.

## 5. RevenueCat

1. Create the project, add the iOS and Android apps, upload the keys from sections 3 and 4.
2. Entitlements: `premium` and `pro`. Attach the `premium_*` products to `premium` and `pro_*` to `pro`.
3. Offering `default` with six packages: `$rc_monthly`, `$rc_three_month`, `$rc_annual` for each plan.
4. App user id = Firebase uid (the app calls `Purchases.logIn(uid)` after sign-in).
5. Integrations → **Webhooks**: URL `https://asia-south1-fit-me1.cloudfunctions.net/revenuecatWebhook`,
   Authorization header: a long random value. Store the same value in Secret Manager (section 7) as
   `REVENUECAT_WEBHOOK_AUTH`.
6. Public SDK keys (`appl_…`, `goog_…`) go in the native build config (they are publishable, not secret).

## 6. Cashfree (web: UPI Autopay and card mandates)

1. Cashfree Merchant Dashboard → Subscriptions → enable; complete KYC.
2. Create plans with plan ids equal to the product ids, type periodic, interval 1 / 3 / 12 months,
   amounts from the table (INR).
3. Trial: create subscriptions with `subscription_first_charge_time` = now + 30 days (the mandate is
   authorised now, the first charge happens after the trial) and `subscription_tags.uid` = Firebase uid.
4. Webhooks → add `https://asia-south1-fit-me1.cloudfunctions.net/cashfreeWebhook` for subscription events.
   The function verifies `x-webhook-signature` = base64(HMAC-SHA256(`x-webhook-timestamp` + raw body,
   client secret)). Store the client secret as `CASHFREE_CLIENT_SECRET` (section 7).
5. Pending in code: creating the Cashfree subscription from the web checkout (needs the app id, the client
   secret and the plan ids from step 2). Until then web users in `live` mode get "Payments are launching soon".

## 7. Secrets (Secret Manager, project fit-me1)

```
printf '%s' '<value>' | gcloud secrets create REVENUECAT_WEBHOOK_AUTH --project fit-me1 --replication-policy=automatic --data-file=-
printf '%s' '<value>' | gcloud secrets create CASHFREE_CLIENT_SECRET --project fit-me1 --replication-policy=automatic --data-file=-
# Let the Cloud Functions runtime read them:
gcloud secrets add-iam-policy-binding REVENUECAT_WEBHOOK_AUTH --project fit-me1 \
  --member=serviceAccount:216212194424-compute@developer.gserviceaccount.com --role=roles/secretmanager.secretAccessor
gcloud secrets add-iam-policy-binding CASHFREE_CLIENT_SECRET --project fit-me1 \
  --member=serviceAccount:216212194424-compute@developer.gserviceaccount.com --role=roles/secretmanager.secretAccessor
```

Until both exist the webhooks answer `503 not_configured`; wrong signatures always get `401`. Values are
read at call time and cached for five minutes, so no redeploy is needed after creating them.

## 8. Trial reminder

`trialReminders` runs daily at 10:00 India time. Three days before a trial ends it writes
`users/{uid}/notifications/trial-<end>` (the app also shows a banner from the entitlement) and sends a push
message when the device registered for push (`users/{uid}/settings/push.tokens`). Email reminders need a
mail provider (for example the Firebase "Trigger Email" extension): pending.

## 9. Testing

- Unit: `src/domain/__tests__/billing.test.ts` (prices, rounding, honesty rules, states, eligibility),
  `functions/test/billing.test.ts` (webhook signatures and event mapping).
- Emulator: `npm run test:integration` (trial, once per account, Pro unlocked on the server, cancel keeps
  access to the trial end, resume, change plan, interest mode, webhooks refuse unsigned calls).
- End to end: `e2e/devices-flow.cjs` on six devices (Plans → period → trial summary → trial → Pro unlocked
  → cancel → still active).
- Seed: `node functions/lib/scripts/seed-billing.js --project fit-me1` creates the config only if missing.
