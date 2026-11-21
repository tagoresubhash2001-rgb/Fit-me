# Store price tables (generated from src/domain/billing.ts DEFAULT_PRICING)

Web (Cashfree) prices come straight from the admin dashboard (Finance, Countries and prices). The App Store and Google Play need the same prices entered in their consoles, per country. If you change a price in the admin, re-run `npx tsx scripts/pricing-md.ts > docs/store/pricing.md` (or copy the new numbers) and update both consoles.

Product IDs are identical on both stores: `premium_monthly`, `premium_quarterly`, `premium_yearly`, `pro_monthly`, `pro_quarterly`, `pro_yearly`. Free trial: none in the stores (the 7-day Welcome Unlock and 30-day trial are granted by FitMe itself; during Free Launch Mode everything is free).

## IN (INR) — countries: IN

Tax: GST 18% (included in the price)

| Product ID | Charged per period | Per month | Saving | Tax part |
|---|---|---|---|---|
| premium_monthly | 199 INR | 199 | 0% | 30.36 |
| premium_quarterly | 478 INR | 159 | 20% | 72.92 |
| premium_yearly | 1433 INR | 119 | 40% | 218.59 |
| pro_monthly | 399 INR | 399 | 0% | 60.86 |
| pro_quarterly | 958 INR | 319 | 20% | 146.14 |
| pro_yearly | 2873 INR | 239 | 40% | 438.25 |

## US (USD) — countries: US

Tax: Sales tax 0% (added on top)

| Product ID | Charged per period | Per month | Saving | Tax part |
|---|---|---|---|---|
| premium_monthly | 9 USD | 9 | 0% | 0 |
| premium_quarterly | 21.6 USD | 7.2 | 20% | 0 |
| premium_yearly | 64.8 USD | 5.4 | 40% | 0 |
| pro_monthly | 29 USD | 29 | 0% | 0 |
| pro_quarterly | 69.6 USD | 23.2 | 20% | 0 |
| pro_yearly | 208.8 USD | 17.4 | 40% | 0 |

## GB (GBP) — countries: GB

Tax: VAT 20% (included in the price)

| Product ID | Charged per period | Per month | Saving | Tax part |
|---|---|---|---|---|
| premium_monthly | 9 GBP | 9 | 0% | 1.5 |
| premium_quarterly | 21.6 GBP | 7.2 | 20% | 3.6 |
| premium_yearly | 64.8 GBP | 5.4 | 40% | 10.8 |
| pro_monthly | 29 GBP | 29 | 0% | 4.83 |
| pro_quarterly | 69.6 GBP | 23.2 | 20% | 11.6 |
| pro_yearly | 208.8 GBP | 17.4 | 40% | 34.8 |

## EU (EUR) — countries: AT, BE, HR, CY, EE, FI, FR, DE, GR, IE, IT, LV, LT, LU, MT, NL, PT, SK, SI, ES

Tax: VAT 0% (included in the price)

| Product ID | Charged per period | Per month | Saving | Tax part |
|---|---|---|---|---|
| premium_monthly | 9 EUR | 9 | 0% | 0 |
| premium_quarterly | 21.6 EUR | 7.2 | 20% | 0 |
| premium_yearly | 64.8 EUR | 5.4 | 40% | 0 |
| pro_monthly | 29 EUR | 29 | 0% | 0 |
| pro_quarterly | 69.6 EUR | 23.2 | 20% | 0 |
| pro_yearly | 208.8 EUR | 17.4 | 40% | 0 |

## Google Play

Play Console → FitMe → Monetize → Products → Subscriptions → create one subscription per plan (premium, pro) with three base plans (monthly, quarterly = 3 months, yearly). Set the price per country from the tables above; for countries without a table, use "Set prices automatically" from the US price.

## App Store

App Store Connect → FitMe → Subscriptions → one group "FitMe" with six auto-renewable subscriptions (product IDs above). Price per country: choose the price point closest to the table (Apple uses fixed price points); for other countries Apple converts from the base country (United States).
