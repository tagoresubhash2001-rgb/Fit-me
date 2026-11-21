import { DEFAULT_PRICING, quote, PERIODS, PAID_PLANS, taxBreakdown } from '../src/domain/billing';
const c = DEFAULT_PRICING;
const out: string[] = [];
out.push('# Store price tables (generated from src/domain/billing.ts DEFAULT_PRICING)', '');
out.push('Web (Cashfree) prices come straight from the admin dashboard (Finance, Countries and prices). The App Store and Google Play need the same prices entered in their consoles, per country. If you change a price in the admin, re-run `npx tsx scripts/pricing-md.ts > docs/store/pricing.md` (or copy the new numbers) and update both consoles.', '');
out.push('Product IDs are identical on both stores: `premium_monthly`, `premium_quarterly`, `premium_yearly`, `pro_monthly`, `pro_quarterly`, `pro_yearly`. Free trial: none in the stores (the 7-day Welcome Unlock and 30-day trial are granted by FitMe itself; during Free Launch Mode everything is free).', '');
for (const [key, m] of Object.entries(c.markets)) {
  out.push(`## ${key} (${m.currency}) — countries: ${m.countries.join(', ')}`, '');
  out.push(`Tax: ${m.tax.name} ${m.tax.percent}% ${m.tax.inclusive ? '(included in the price)' : '(added on top)'}`, '');
  out.push('| Product ID | Charged per period | Per month | Saving | Tax part |', '|---|---|---|---|---|');
  for (const plan of PAID_PLANS)
    for (const period of PERIODS) {
      const q = quote(c, key, plan, period, Date.now())!;
      const tax = taxBreakdown(q.total, m.tax, m.priceStep);
      out.push(`| ${plan}_${period} | ${q.total} ${q.currency} | ${q.perMonth} | ${Math.round(q.savingPct * 100)}% | ${tax.tax} |`);
    }
  out.push('');
}
out.push('## Google Play', '', 'Play Console → FitMe → Monetize → Products → Subscriptions → create one subscription per plan (premium, pro) with three base plans (monthly, quarterly = 3 months, yearly). Set the price per country from the tables above; for countries without a table, use "Set prices automatically" from the US price.', '');
out.push('## App Store', '', 'App Store Connect → FitMe → Subscriptions → one group "FitMe" with six auto-renewable subscriptions (product IDs above). Price per country: choose the price point closest to the table (Apple uses fixed price points); for other countries Apple converts from the base country (United States).');
console.log(out.join('\n'));
