// Writes .env.production.local for `vite build` from deploy/web-config.<env>.json.
// A non-empty process.env value with the same name (GitHub environment variable) wins.
// Usage: node deploy/write-web-env.mjs dev
import { readFileSync, writeFileSync } from 'node:fs';

const envName = process.argv[2];
const cfg = JSON.parse(readFileSync(new URL(`./web-config.${envName}.json`, import.meta.url), 'utf8'));
const lines = ['VITE_USE_EMULATORS=false'];
for (const [k, v] of Object.entries(cfg)) {
  if (!k.startsWith('VITE_')) continue;
  lines.push(`${k}=${process.env[k] || v}`);
}
lines.push(`VITE_APP_VERSION=${(process.env.GITHUB_SHA || 'local').slice(0, 7)}`);
const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'];
const missing = required.filter((k) => !lines.some((l) => l.startsWith(`${k}=`) && l.length > k.length + 1));
if (missing.length) {
  console.error(`Missing web config: ${missing.join(', ')}`);
  process.exit(1);
}
writeFileSync('.env.production.local', `${lines.join('\n')}\n`);
console.log(`Wrote web config for "${envName}" (project ${lines.find((l) => l.startsWith('VITE_FIREBASE_PROJECT_ID')).split('=')[1]}).`);
