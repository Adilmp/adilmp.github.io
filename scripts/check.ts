// `npm run check`: the portfolio's own test suite.
//
// 1. Every project file matches the schema.
// 2. Content rules hold (flagship entries are complete, copy is clean, diagrams do not lie).
// 3. Every receipt is real: the cited file, at the pinned commit, contains the cited text.
//
// A number on this site that is not in the repo it cites fails the build.
//
//   npm run check              verify receipts (downloads files once, then uses .cache/)
//   npm run check -- --offline use only cached files (fails if one is missing)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { diagramProblems } from '../src/lib/diagram.ts';
import { PROJECTS_DIR, ROOT, loadProjects } from '../src/lib/load-projects.ts';
import { allReceipts, findList, findRepo, rawUrl } from '../src/lib/receipts.ts';
import { site } from '../src/data/site.ts';
import type { ProjectEntry } from '../src/lib/schema.ts';
import { projectTally } from '../src/lib/verdict.ts';

const OFFLINE = process.argv.includes('--offline');
const CACHE = join(ROOT, '.cache', 'receipts');
mkdirSync(CACHE, { recursive: true });

const errors: string[] = [];
const warnings: string[] = [];
const bad = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

let entries: ProjectEntry[];
try {
  entries = loadProjects();
} catch (e) {
  console.error(`✗ ${(e as Error).message}`);
  process.exit(1);
}

// ---------------------------------------------------------------- content rules
const orders = new Set<number>();
for (const { id, data: p, body } of entries) {
  if (orders.has(p.order)) bad(id, `order ${p.order} is used twice`);
  orders.add(p.order);

  if (p.tier === 'archive') {
    if (!p.archive) bad(id, 'archive entries need an `archive: { kind, blurb }` block');
    if (!p.repos.length && !p.links.length) bad(id, 'archive entries need a repo or a link');
    continue;
  }

  if (!p.role) bad(id, 'flagship entries need a `role` line: what you did on it (shown on the project card)');
  if (!p.shortName) bad(id, 'flagship entries need a `shortName` (up to 11 characters)');
  if (p.headline.length < 3) bad(id, `needs 3 or 4 headline metrics, has ${p.headline.length}`);
  if (p.assertions.length < 5) bad(id, `needs at least 5 assertions, has ${p.assertions.length}`);
  if (!p.assertions.some((a) => a.status === 'fail' || a.status === 'inconclusive')) {
    bad(id, 'a suite where everything passes is not credible; add the weakness you measured');
  }
  if (p.failures.length < 2) bad(id, `needs at least 2 failures ("what broke"), has ${p.failures.length}`);
  if (p.decisions.length < 2) bad(id, `needs at least 2 decisions, has ${p.decisions.length}`);
  if (p.charts.length < 1) bad(id, 'needs at least 1 chart');
  if (!p.diagram) bad(id, 'needs an architecture diagram with at least one trace');
  if (!body.trim()) bad(id, 'needs a markdown body (the story)');
  const nHead = p.assertions.filter((a) => a.headline).length;
  if (nHead < 1 || nHead > 2) bad(id, `mark 1 or 2 assertions \`headline: true\` for the hero run (it has ${nHead})`);

  p.assertions.forEach((a, i) => {
    if (a.headline && !a.short) bad(`${id} assertions[${i}]`, 'headline assertions need a `short` line for the hero terminal');
  });

  for (const r of p.repos) {
    if (r.visibility === 'public' && !r.ref) bad(id, `public repo ${r.name} needs a pinned 40-character \`ref\` so receipts are permalinks`);
  }
  if (p.diagram) for (const msg of diagramProblems(p.diagram)) bad(`${id} diagram`, msg);

  p.charts.forEach((c, i) => {
    const w = `${id} charts[${i}]`;
    if (c.type === 'grouped') {
      c.groups.forEach((g) => {
        if (g.values.length !== c.series.length) bad(w, `group "${g.label}" has ${g.values.length} values for ${c.series.length} series`);
      });
    }
    if (c.type === 'bars') {
      c.marks.forEach((m) => {
        if (!c.bars[m.index]) bad(w, `mark points at bar ${m.index}, which does not exist`);
      });
    }
    if (c.type === 'reliability') {
      c.points.forEach((pt, k) => {
        if (pt.x < 0 || pt.x > 1 || pt.y < 0 || pt.y > 1) bad(w, `point ${k} is outside 0..1`);
      });
      if (c.callout && !c.points[c.callout.index]) bad(w, 'callout points at a missing point');
    }
    if (c.type === 'stack' && c.normalize) {
      c.rows.forEach((r) => {
        const sum = r.segments.reduce((a, s) => a + s.value, 0);
        if (Math.abs(sum - 100) > 0.6) bad(w, `normalized row "${r.label}" sums to ${sum.toFixed(1)}, not 100`);
      });
    }
  });
}

// The four results on the first screen must point at real headline tiles.
if (site.heroResults.length !== 4) bad('site.ts', `heroResults must list exactly 4 results (has ${site.heroResults.length})`);
for (const r of site.heroResults) {
  const e = entries.find((x) => x.id === r.project);
  if (!e) bad('site.ts', `heroResults names project "${r.project}", which does not exist`);
  else if (!e.data.headline[r.tile]) bad('site.ts', `heroResults: ${r.project} has no headline tile ${r.tile}`);
}

// The CV behind the download button must exist and really be a PDF.
if (site.cv) {
  const cvPath = join(ROOT, 'public', site.cv.replace(/^\//, ''));
  if (!existsSync(cvPath)) bad('site.ts', `cv points at ${site.cv}, but ${cvPath} does not exist`);
  else if (readFileSync(cvPath).subarray(0, 5).toString() !== '%PDF-') bad('site.ts', `${site.cv} is not a PDF`);
}

// ---------------------------------------------------------------- copy lint
for (const file of readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.md'))) {
  const raw = readFileSync(join(PROJECTS_DIR, file), 'utf8');
  if (/—/.test(raw)) bad(file, 'contains an em dash; rewrite the sentence instead');
  if (/\b(TODO|FIXME|TBD)\b/.test(raw)) bad(file, 'contains a TODO/FIXME/TBD marker');
}

// ---------------------------------------------------------------- receipts
interface Job {
  where: string;
  url: string;
  finds: string[];
}
const jobs: Job[] = [];
for (const { id, data: p } of entries) {
  for (const { where, receipt } of allReceipts(p)) {
    const repo = findRepo(p, receipt.repo);
    if (!repo) {
      bad(`${id} ${where}`, `receipt names repo "${receipt.repo}", which is not in repos`);
      continue;
    }
    if (repo.visibility === 'private') continue;
    if (!repo.ref) continue; // already reported above
    jobs.push({ where: `${id} ${where}`, url: rawUrl(repo, receipt.path), finds: findList(receipt) });
    if (findList(receipt).length === 0) warnings.push(`${id} ${where}: receipt has no \`find\` text, so only the file's existence is checked`);
  }
}

async function getFile(url: string): Promise<string | null> {
  const p = join(CACHE, createHash('sha1').update(url).digest('hex'));
  if (existsSync(p)) return readFileSync(p, 'utf8');
  if (OFFLINE) return null;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  writeFileSync(p, text);
  return text;
}

const uniqueUrls = [...new Set(jobs.map((j) => j.url))];
const files = new Map<string, string | Error | null>();
for (let i = 0; i < uniqueUrls.length; i += 8) {
  await Promise.all(
    uniqueUrls.slice(i, i + 8).map(async (url) => {
      try {
        files.set(url, await getFile(url));
      } catch (e) {
        files.set(url, e as Error);
      }
    }),
  );
}

let verified = 0;
for (const j of jobs) {
  const f = files.get(j.url);
  if (f === null) {
    bad(j.where, `file not in cache and --offline was set (${j.url})`);
    continue;
  }
  if (f instanceof Error) {
    bad(j.where, `could not fetch ${j.url} (${f.message})`);
    continue;
  }
  let ok = true;
  for (const find of j.finds) {
    if (!f!.includes(find)) {
      ok = false;
      bad(j.where, `text not found in ${j.url.replace('https://raw.githubusercontent.com/', '')}\n      expected: ${JSON.stringify(find)}`);
    }
  }
  if (ok) verified += 1;
}

// ---------------------------------------------------------------- report
const flagship = entries.filter((e) => e.data.tier === 'flagship');
console.log('Portfolio check');
for (const e of flagship) {
  const t = projectTally(e.data);
  console.log(`  ${e.id.padEnd(28)} ${String(t.total).padStart(2)} assertions  ${t.pass} pass · ${t.fail} fail · ${t.inconclusive} inconclusive   ${e.data.failures.length} failures  ${e.data.charts.length} charts`);
}
console.log(`  ${entries.length - flagship.length} early-work entries`);
console.log(`  receipts verified: ${verified}/${jobs.length} across ${uniqueUrls.length} pinned files`);
for (const w of warnings) console.log(`  ! ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\n✓ all checks passed');
