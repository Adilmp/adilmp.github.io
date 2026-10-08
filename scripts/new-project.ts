// `npm run new-project -- <slug> --repo Owner/name [--tier flagship|archive]`
//
// Reads the repo through the GitHub CLI, pins its current commit, and writes a project file:
//   archive   a complete entry, ready to publish (title, blurb, stack and link from the repo)
//   flagship  a skeleton that fails `npm run check` until it is filled in, plus a printout of the
//             numbers found in the repo's README so you can cite them instead of typing them
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECTS_DIR, loadProjects } from '../src/lib/load-projects.ts';

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

const usage = `Usage: npm run new-project -- <slug> --repo Owner/name [--tier flagship|archive] [--title "Display title"]

  <slug>     kebab-case file name, e.g. voice-patient-registration
  --repo     the GitHub repo that holds the work (public repos get pinned receipts)
  --tier     flagship = full case study (default), archive = one line in "Earlier work"
  --title    display title (defaults to the repo name, humanised)
`;

if (argv.length === 0 || argv.includes('--help')) {
  console.log(usage);
  process.exit(argv.length === 0 ? 1 : 0);
}

const slug = argv[0]!;
const repoArg = flag('--repo');
const tier = (flag('--tier') ?? 'flagship') as 'flagship' | 'archive';
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`slug "${slug}" must be kebab-case (letters, digits, hyphens)`);
if (!repoArg || !/^[\w.-]+\/[\w.-]+$/.test(repoArg)) fail('--repo Owner/name is required');
if (tier !== 'flagship' && tier !== 'archive') fail('--tier must be flagship or archive');

const target = join(PROJECTS_DIR, `${slug}.md`);
if (existsSync(target)) fail(`${target} already exists; edit it instead`);

function fail(msg: string): never {
  console.error(`✗ ${msg}\n\n${usage}`);
  process.exit(1);
}

function gh(path: string): string {
  try {
    return execFileSync('gh', ['api', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    fail(`gh api ${path} failed. Is the GitHub CLI installed and logged in (gh auth status)?\n${(e as Error).message.split('\n')[0]}`);
  }
}

const [owner, name] = repoArg!.split('/') as [string, string];
const meta = JSON.parse(gh(`repos/${owner}/${name}`)) as {
  description: string | null;
  language: string | null;
  topics?: string[];
  private: boolean;
  default_branch: string;
  html_url: string;
};
const isPrivate = meta.private;
const sha = isPrivate ? undefined : (JSON.parse(gh(`repos/${owner}/${name}/commits/${meta.default_branch}`)) as { sha: string }).sha;

const humanise = (s: string) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
const title = flag('--title') ?? humanise(name);
const description = (meta.description ?? '').replace(/"/g, "'").trim();
const stack = [meta.language, ...(meta.topics ?? [])].filter(Boolean).slice(0, 6) as string[];
const order = Math.max(0, ...loadProjects().filter((e) => e.data.tier === tier).map((e) => e.data.order)) + 1;
const q = (s: string) => JSON.stringify(s);

const repoBlock = `repos:
  - name: ${name}
    owner: ${owner}
${sha ? `    ref: ${sha}\n    role: primary` : '    visibility: private'}`;

let file: string;
if (tier === 'archive') {
  file = `---
title: ${q(title)}
tagline: ${q(description || 'TODO one line: what it is')}
summary: ${q(description || 'TODO one sentence')}
tier: archive
order: ${order}
status: archived
stack: ${JSON.stringify(stack)}
${repoBlock}
links:
  - label: Source on GitHub
    url: ${meta.html_url}
archive:
  kind: ${q(meta.language ?? 'Project')}
  blurb: ${q(description || 'TODO one sentence about what it does and how it was built')}
---
`;
} else {
  file = `---
# TODO(new-project): fill in every field, delete the commented examples, then delete this line.
# \`npm run check\` fails while a TODO is present, so an unfinished project can never ship.
# The full playbook is ADD_PROJECT.md. The rule that matters: every number needs a receipt.
title: ${q(title)}
shortName: ${slug.replace(/-/g, '').slice(0, 11)}
tagline: ${q(description || 'TODO one sentence: what it is and the claim it stands on')}
summary: ${q(description || 'TODO two sentences for the card and the search index')}
tier: flagship
order: ${order}
status: shipped
stack: ${JSON.stringify(stack)}
${repoBlock}
links: []
headline: []        # 3 or 4 tiles, each with a receipt
assertions: []      # 5 or more; at least one fail or inconclusive; 1 or 2 with headline: true
failures: []        # 2 or more: what broke, how it surfaced, what you did
decisions: []       # 2 or more
# diagram:          # up to 12 nodes on a 5 x 3 grid, at least one trace (see another project for the shape)
charts: []          # at least 1: bars, grouped, reliability or stack, with real data
#
# EXAMPLE assertion (copy the shape; \`find\` must appear verbatim in the file at the pinned commit):
#   - claim: Every row is accounted for
#     expected: rows read = clean + quarantined
#     actual: 584,524 read = 574,758 loaded + 9,766 quarantined
#     status: pass            # pass | fail | inconclusive
#     headline: true          # shows in the title-page run; needs \`short\`
#     short: 584,524 read = 574,758 clean + 9,766 quarantined
#     receipt: { repo: ${name}, path: README.md, find: "| Rows read | **584,524**" }
---

## The problem

TODO: why this exists, in two or three sentences.

## What I built

TODO: the system, what it does, the parts you chose.

## How I tested it

TODO: the data, the suite, the baseline, the models.

## What I would do next

TODO: the honest next step.
`;
}

writeFileSync(target, file);
console.log(`✓ wrote src/content/projects/${slug}.md  (${tier}${isPrivate ? ', private repo: receipts cannot be verified' : `, pinned to ${sha!.slice(0, 7)}`})`);

if (tier === 'flagship' && !isPrivate) {
  // Show the numbers the README already states, so the case study cites them instead of retyping them.
  const readme = Buffer.from((JSON.parse(gh(`repos/${owner}/${name}/readme`)) as { content: string }).content, 'base64').toString('utf8');
  const rows = readme.split('\n').filter((l) => l.startsWith('|') && /\d/.test(l) && !/^\|[-: |]+\|$/.test(l));
  console.log(`\nREADME table rows that contain numbers (candidates for \`find:\` receipts):`);
  for (const r of rows.slice(0, 30)) console.log(`  ${r.length > 140 ? r.slice(0, 137) + '...' : r}`);
}

console.log(`
Next:
  1. Fill in the file (see ADD_PROJECT.md).    4. npm run dev, then look at it on desktop and mobile.
  2. npm run check   (it lists what is missing)  5. Add 1 or 2 questions about it to src/data/search-gold.json (dev split).
  3. npm test && npm run check:types           6. Do not deploy until you have read it once yourself.
`);
