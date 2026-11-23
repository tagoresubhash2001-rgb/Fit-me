#!/usr/bin/env node
/**
 * Prints the Cloud Functions affected by a change, so CI deploys only those (each deploy builds a new image).
 * A function is affected when any file in its local import graph under functions/src changed. A change to
 * functions/package.json, package-lock.json, tsconfig or the `functions` section of firebase.json affects every
 * function (set BASE to the commit compared against; without it any firebase.json change counts).
 * Usage: node scripts/changed-functions.mjs <changed file> ...   (paths relative to the repository root)
 * Output: space-separated function names (empty = nothing to deploy), or ALL.
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, normalize, relative } from 'node:path';

const root = join(dirname(new URL(import.meta.url).pathname), '..');
const src = join(root, 'functions/src');
const changed = process.argv.slice(2).map((p) => normalize(p));
const GLOBAL = ['functions/package.json', 'functions/package-lock.json', 'functions/tsconfig.json', 'firebase.json'];
/** firebase.json counts only when its `functions` section changed (BASE = the commit compared against). */
const functionsConfigChanged = () => {
  const base = process.env.BASE;
  if (!base) return true;
  try {
    const before = JSON.parse(execFileSync('git', ['show', `${base}:firebase.json`], { cwd: root, encoding: 'utf8' }));
    const now = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
    return JSON.stringify(before.functions ?? null) !== JSON.stringify(now.functions ?? null);
  } catch {
    return true;
  }
};
if (changed.some((c) => GLOBAL.includes(c) && (c !== 'firebase.json' || functionsConfigChanged()))) {
  console.log('ALL');
  process.exit(0);
}

const resolve = (from, spec) => {
  const base = join(dirname(from), spec);
  for (const c of [`${base}.ts`, join(base, 'index.ts'), base]) if (existsSync(c) && c.endsWith('.ts')) return c;
  return null;
};
const imports = (file) =>
  [...readFileSync(file, 'utf8').matchAll(/(?:import|export)\s[^'"]*?from\s+['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]\s*\)/g)]
    .map((m) => resolve(file, m[1] ?? m[2]))
    .filter(Boolean);
const closure = (file, seen = new Set()) => {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const f of imports(file)) closure(f, seen);
  return seen;
};

// index.ts: `export { a, b } from './x'`, `import { a } from './x'` + `exports.a = a`.
const index = join(src, 'index.ts');
const text = readFileSync(index, 'utf8');
const owners = new Map();
for (const m of text.matchAll(/export\s*\{([^}]+)\}\s*from\s*['"](\.[^'"]+)['"]/g)) for (const n of m[1].split(',')) owners.set(n.trim().split(/\s+as\s+/).pop(), resolve(index, m[2]));
for (const m of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](\.[^'"]+)['"]/g))
  for (const n of m[1].split(',')) {
    const name = n.trim();
    if (new RegExp(`exports\\.${name}\\s*=`).test(text)) owners.set(name, resolve(index, m[2]));
  }

const changedAbs = new Set(changed.filter((c) => c.startsWith('functions/src/')).map((c) => join(root, c)));
// index.ts itself changed: functions added, removed or renamed; deploy all to be safe.
if (changedAbs.has(index)) {
  console.log('ALL');
  process.exit(0);
}
const out = [];
for (const [name, file] of owners) if (file && [...closure(file)].some((f) => changedAbs.has(f))) out.push(name);
console.log(out.sort().join(' '));
if (process.env.DEBUG) for (const [n, f] of owners) console.error(n, relative(root, f ?? '?'));
