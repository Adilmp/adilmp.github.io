// These tests guard the content model: what the site claims must be internally consistent,
// independently of whether the network is up (receipt verification lives in `npm run check`).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aboutPassages } from '../src/lib/about.ts';
import { buildCorpus, splitBody } from '../src/lib/corpus.ts';
import { diagramProblems } from '../src/lib/diagram.ts';
import { site } from '../src/data/site.ts';
import { ROOT, loadProjects, splitFrontmatter } from '../src/lib/load-projects.ts';
import { allReceipts, findRepo } from '../src/lib/receipts.ts';
import { suiteTally } from '../src/lib/verdict.ts';

const entries = loadProjects();
const flagship = entries.filter((e) => e.data.tier === 'flagship');

describe('project files', () => {
  it('has five flagship case studies and the early-work strip', () => {
    expect(flagship).toHaveLength(5);
    expect(entries.length - flagship.length).toBeGreaterThanOrEqual(6);
  });
  it.each(flagship.map((e) => [e.id, e] as const))('%s: every receipt names a repo it declares and every public repo is pinned', (_id, e) => {
    for (const { where, receipt } of allReceipts(e.data)) {
      expect(findRepo(e.data, receipt.repo), where).toBeDefined();
    }
    for (const r of e.data.repos) if (r.visibility === 'public') expect(r.ref, r.name).toMatch(/^[0-9a-f]{40}$/);
  });
  it.each(flagship.map((e) => [e.id, e] as const))('%s: diagram is honest and has at least one trace', (_id, e) => {
    expect(diagramProblems(e.data.diagram!)).toEqual([]);
    expect(e.data.diagram!.traces.length).toBeGreaterThan(0);
  });
  it('publishes failures: no suite is all green', () => {
    const t = suiteTally(flagship);
    expect(t.fail).toBeGreaterThan(0);
    expect(t.inconclusive).toBeGreaterThan(0);
    expect(t.total).toBe(t.pass + t.fail + t.inconclusive);
  });
  it('keeps copy free of em dashes (an easy tell of machine-written text)', () => {
    for (const e of entries) {
      const raw = readFileSync(join(ROOT, 'src', 'content', 'projects', `${e.id}.md`), 'utf8');
      expect(raw.includes('—'), e.id).toBe(false);
    }
  });
  it('rejects a file with no frontmatter', () => {
    expect(() => splitFrontmatter('# just markdown')).toThrow(/frontmatter/);
  });
});

describe('CV download', () => {
  it('serves a real PDF from /public', () => {
    expect(site.cv).toBeTruthy();
    const file = join(ROOT, 'public', site.cv!.replace(/^\//, ''));
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file).subarray(0, 5).toString()).toBe('%PDF-');
    expect(site.cvFilename).toMatch(/\.pdf$/);
  });
});

describe('first screen', () => {
  it('shows four results, each a real headline tile with a receipt', () => {
    expect(site.heroResults).toHaveLength(4);
    for (const r of site.heroResults) {
      const tile = entries.find((e) => e.id === r.project)?.data.headline[r.tile];
      expect(tile, `${r.project} tile ${r.tile}`).toBeDefined();
      expect(tile!.receipt.path.length).toBeGreaterThan(0);
    }
  });
  it.each(flagship.map((e) => [e.id, e] as const))('%s: has a role line for the project card', (_id, e) => {
    expect(e.data.role?.length ?? 0).toBeGreaterThan(10);
  });
});

describe('search corpus', () => {
  const corpus = buildCorpus(entries, aboutPassages);
  it('has unique passage ids', () => {
    const ids = corpus.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('links every passage to a page that exists', () => {
    const slugs = new Set(flagship.map((e) => e.id));
    for (const p of corpus) {
      if (p.project === 'about' || p.href === '/#earlier') continue;
      expect(slugs.has(p.project), p.id).toBe(true);
      expect(p.href).toMatch(new RegExp(`^/projects/${p.project}#`));
    }
  });
  it('splits a body into sections by ## headings', () => {
    expect(splitBody('intro\n\n## One\nalpha\n\n## Two\nbeta')).toEqual([
      { heading: 'Overview', text: 'intro' },
      { heading: 'One', text: 'alpha' },
      { heading: 'Two', text: 'beta' },
    ]);
  });
});

describe('search evaluation inputs', () => {
  const gold = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'search-gold.json'), 'utf8')).questions as { q: string; split: string; expect: string[] | null }[];
  const known = new Set([...entries.map((e) => e.id), 'about']);
  it('only expects projects that exist', () => {
    for (const g of gold) for (const id of g.expect ?? []) expect(known.has(id), g.q).toBe(true);
  });
  it('keeps a held-out split with answerable and off-topic questions', () => {
    const test = gold.filter((g) => g.split === 'test');
    expect(test.filter((g) => g.expect).length).toBeGreaterThanOrEqual(8);
    expect(test.filter((g) => !g.expect).length).toBeGreaterThanOrEqual(5);
  });
  it('has no question in both splits', () => {
    const dev = new Set(gold.filter((g) => g.split === 'dev').map((g) => g.q.toLowerCase()));
    for (const g of gold.filter((x) => x.split === 'test')) expect(dev.has(g.q.toLowerCase()), g.q).toBe(false);
  });
});
