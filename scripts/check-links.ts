// `npm run check:links` (run after `npm run build`): every internal link and #anchor in the built
// site must resolve, including the anchors the search results and the title-page squares point at.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from '../src/lib/load-projects.ts';

const DIST = join(ROOT, 'dist');
if (!existsSync(DIST)) {
  console.error('✗ dist/ does not exist; run `npm run build` first');
  process.exit(1);
}

const base = (process.env.SITE_BASE ?? '/').replace(/\/$/, '');
const htmlFiles: string[] = [];
const walk = (dir: string) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) htmlFiles.push(p);
  }
};
walk(DIST);

const idsOf = new Map<string, Set<string>>();
const pathOf = (file: string) => {
  const rel = '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\.html$/, '');
  return rel.length > 1 ? rel.replace(/\/$/, '') : '/';
};
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  idsOf.set(pathOf(f), new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!)));
}

const problems: string[] = [];
let checked = 0;
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const here = pathOf(f);
  for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
    let href = m[1]!;
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;
    if (base && href.startsWith(base + '/')) href = href.slice(base.length);
    const [rawPath, hash] = href.split('#') as [string, string | undefined];
    const path = rawPath === '' ? here : rawPath.replace(/\/$/, '') || '/';
    checked += 1;
    const isAsset = /\.[a-z0-9]+$/i.test(path) && !path.endsWith('.html');
    if (isAsset) {
      if (!existsSync(join(DIST, path))) problems.push(`${here}: missing file ${path}`);
      continue;
    }
    const ids = idsOf.get(path);
    if (!ids) {
      problems.push(`${here}: link to ${path} has no page`);
      continue;
    }
    if (hash && !ids.has(hash)) problems.push(`${here}: ${path}#${hash} has no such anchor`);
  }
}

// The search index points at anchors too.
const index = JSON.parse(readFileSync(join(DIST, 'search-index.json'), 'utf8')) as { passages: { id: string; href: string }[] };
for (const p of index.passages) {
  const [path, hash] = p.href.split('#') as [string, string | undefined];
  const ids = idsOf.get(path.replace(/\/$/, '') || '/');
  checked += 1;
  if (!ids) problems.push(`search passage ${p.id}: no page for ${path}`);
  else if (hash && !ids.has(hash)) problems.push(`search passage ${p.id}: ${p.href} has no such anchor`);
}

console.log(`Link check: ${checked} internal links and search anchors across ${htmlFiles.length} pages`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of [...new Set(problems)].slice(0, 40)) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log('✓ every link and anchor resolves');
