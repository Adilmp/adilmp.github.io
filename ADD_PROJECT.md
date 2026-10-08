# Adding a project

This is the playbook for adding a project to the portfolio. It is written for you, and for any Claude session you ask to do it (the same steps are in `.claude/skills/add-portfolio-project/SKILL.md`).

**The one rule: every number on the site needs a receipt.** A receipt is a file in a public repo, at a pinned commit, that contains the number. `npm run check` downloads the file and fails the build if the number is not in it. If a number is not written down in the repo yet, put it there first (a results table, a README line, a CSV), commit it, then cite it.

## What you get for free

Adding one file under `src/content/projects/` updates all of this automatically:

| Where | What changes |
|---|---|
| Projects section | a new card with its diagram as the picture, a stat burst, the role line and a verdict bar |
| "How I check my work" | its squares and the totals join the scoreboard |
| What went wrong | its failures join the filterable list |
| Ask my work | its assertions, failures, decisions and story become searchable |
| Share card | `/og/<slug>.png` is generated with its verdict squares |
| Sitemap | the page is listed |

## Two kinds of entry

**Archive** (a line in "Earlier work"): one command, no verdicts. Use it for small or older projects.

```bash
npm run new-project -- sarcasm-detection --repo Adilmp/SarcasmDetection --tier archive
```

It writes a complete entry from the repo's description, language and topics. Read it, tighten the blurb, run `npm run check`. If the repo has no description the file contains a `TODO` that blocks the check until you write one.

**Flagship** (a full case study with assertions, a trace diagram, charts and a failure list):

```bash
npm run new-project -- my-project --repo Adilmp/my-project
```

It pins the repo's current commit, writes a skeleton that **fails `npm run check` on purpose**, and prints the README table rows that contain numbers, which are your candidate receipts.

## Filling in a flagship

Work through the file top to bottom. `npm run check` tells you what is still missing.

1. **Role (one line).** What you did on it, in plain words: "Built end to end: ingestion, Spark jobs, warehouse, tests and CI." It is shown on the project card and at the top of the page, and a hiring manager reads it first. Say only what is true, and be precise when the work was shared (for example a team project).
2. **Headline (3 or 4 tiles).** The numbers someone should remember. The first tile is the stat burst on the project card. Each tile has a `receipt`.
3. **Test results (5 or more; the field is called `assertions`).** A claim a sceptic could test, the bar it was held to (`expected`, optional), what you measured (`actual`), and a status:
   - `pass`: the claim holds in the data
   - `fail`: a weakness you measured and are publishing
   - `inconclusive`: not measured, or the evidence cannot settle it
   Include at least one `fail` or `inconclusive`. A suite where everything passes tells the reader nothing, and `check` enforces this. Mark one or two `headline: true` (with a `short` line of 70 characters or fewer); the field is kept for the search index and any future summary view.
4. **Failures (2 or more).** Title, how it surfaced, what you did, and the outcome: `fixed`, `accepted` (a documented risk) or `open`. These are the most useful part of a case study. Look in the repo for `DECISIONS`, `SECURITY`, postmortem notes and commit messages that say "fix".
5. **Decisions (2 or more).** Choices you would defend, each with the reason.
6. **Diagram.** Up to 12 nodes on a 5 by 3 grid (`col` 0 to 4, `row` 0 to 2), edges between them, and traces. A trace is a path of node ids; **every step must be a real edge**. A trace of kind `blocked` must end on a node of kind `blocked`: use it for the request you attack the system with. Labels are at most 21 characters and subtitles at most 30, or they will not fit their box; `check` measures this. Draw the diagram from the code, not from the README's marketing.
7. **Charts (1 or more).** The first chart in the list is also the picture on the project card (a small version with its conclusion underneath), so put the one that best shows your result first. `bars`, `grouped`, `reliability` or `stack`. The `takeaway` is the headline, written as a conclusion ("Prepaid orders are cancelled almost 8 times as often as cash on delivery"). Put the real numbers in `bars`/`groups`/`points`/`rows` and cite the table they came from.
8. **Story (the markdown body).** Four `##` sections: The problem, What I built, How I tested it, What I would do next. Short, specific, first person.

### Writing a receipt

```yaml
receipt: { repo: my-project, path: README.md, find: "| Rows read | **584,524**" }
```

- `repo` is the `name` of an entry in `repos:`.
- `path` is relative to the repo root.
- `find` is text copied **verbatim** from the file (a string, or a list where all must appear). Copy a whole table row rather than a lone number so the receipt cannot match by accident. Avoid text that wraps across a line break.
- Public repos need a pinned `ref` (the scaffolder sets it). Receipts link to `blob/<ref>/<path>`, so they stay valid when the repo moves on.
- Private repos cannot have receipts verified. Prefer an archive entry, or make the numbers public first.

If the repo has moved on and you want to refresh the numbers, run `npm run drift` to see which repos are ahead of their pin, update the `ref`, and re-run `npm run check` to see which numbers changed.

## The first screen

The four results in the splash panel on the home page are chosen in `src/data/site.ts` (`heroResults`: a project and one of its headline tiles). To feature a new project's number, point one entry at it. The number, label and receipt come from the project file, so they cannot drift. `npm run check` fails if an entry points at something that does not exist.

## The CV

The download button serves `public/adil-pervez-cv.pdf`, which is your own CV (not generated). When you add a project, remember the CV does not update itself: re-export it from your LaTeX source and replace that file. Numbers on the CV should match the site's receipts.

## Checks

```bash
npm run check          # schema, content rules, diagrams, copy lint, and every receipt against the pinned file
npm test               # search, diagram, chart and content-model tests
npm run check:types    # astro check
npm run build          # also re-evaluates the search box and renders the share cards
npm run dev            # http://localhost:4321 : look at it on desktop and on a phone-width window
```

Copy rules `check` enforces: no em dashes, no `TODO`/`FIXME`/`TBD`. Keep the voice plain and specific: say what you did and what happened, skip the adjectives.

## The search box

"Ask my work" indexes the new project automatically. Add one or two questions about it to `src/data/search-gold.json` under `"split": "dev"` (answerable ones with `expect: ["<slug>"]`). Do **not** add to the `test` split after seeing results: that split is held out of tuning, and adding to it after the fact would quietly un-hold it. `npm run build` re-tunes the refusal rule on `dev` and re-reports on `test`.

## Publishing

Nothing deploys until you decide. When you are ready: commit with a plain message (no co-author trailer), push to `main`, and the workflow in `.github/workflows/deploy.yml` runs `check`, tests and the build before publishing to GitHub Pages.
