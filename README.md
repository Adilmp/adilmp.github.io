# Adil Pervez: portfolio

My portfolio, styled like a cel-shaded comic page. The first screen says who I am, what I do and four results. Below it are five projects, each with a short write-up, a diagram you can replay, the tests I ran, charts drawn from the real data, and what went wrong.

**The rule behind it:** every number on the site links to the file it came from, pinned to a commit. `npm run check` downloads each file and fails the build if the number is not in it. So a wrong number cannot be published.

- **First screen:** name, role, a one-line pitch, and an "at a glance" card: two years in AI with the two roles, and four results taken from the projects' own data. Then the project cards.
- **Project pages:** what I did, headline results, a short version of the story, an animated trace of a request through the system (including the one that attacks it), test results with receipts, charts with a "view the data" table, what went wrong, and the decisions I would defend.
- **What went wrong:** every failure across the projects, filterable.
- **CV:** your own PDF in `public/adil-pervez-cv.pdf` sits behind the hero button and the about section. Replace the file to update it; `npm run check` fails if it is missing or not a PDF.
- **Ask my work:** a search box over the site (BM25 written from scratch, no chatbot). It refuses off-topic questions and prompt injection, and it is evaluated on questions held out of tuning.

## How it stays honest

| Mechanism | What it guarantees |
|---|---|
| Receipts | Each cited number is checked against its pinned file. Currently 116 receipts across 12 files. |
| Pinned commits | Links go to `blob/<sha>/<path>`, so they stay valid when a repo moves on. `npm run drift` shows which repos are ahead. |
| Content rules | A project needs a role line, at least one failing or unclear test, two failures, a diagram whose traces follow real edges, and no `TODO`. |
| Drawn from data | Charts and diagrams are SVG generated from the project files at build time. |
| Search eval | The refusal rule is tuned on a dev set and reported on a held-out set; the numbers on the page come from `src/data/search-eval.json`, regenerated on every build. |
| CI gate | The deploy workflow runs `check`, tests, the type check, the build and a link check. A wrong number blocks publishing. |

## Commands

```bash
npm install
npm run dev            # http://localhost:4321
npm run check          # schema, content rules, diagrams, copy lint, every receipt
npm test               # vitest: search, diagrams, charts, content model
npm run check:types    # astro check
npm run build          # evaluates the search box, builds, renders share cards
npm run check:links    # after a build: every internal link and anchor resolves
npm run new-project -- <slug> --repo Owner/name [--tier archive]
npm run drift
```

Node 24 or newer.

## Adding a project

One file in `src/content/projects/`. `npm run new-project` pins the repo and scaffolds it; `ADD_PROJECT.md` is the playbook and `.claude/skills/add-portfolio-project/SKILL.md` is the same procedure for a Claude session. The project card, case-study page, failure log, search index, share card and sitemap all follow from that file.

## The look

Everything visual is in `src/styles/global.css`, driven by tokens at the top: thick ink outlines, flat colour with a hard-edged highlight band (no gradients), halftone dots, hard offset shadows, Bangers / Oswald / Barlow / Permanent Marker type. The palette is deliberately dark and muted (deep teal as the main colour, with raspberry, blue, green, purple and slate for projects, amber for "unclear", on warm paper); there is no bright yellow and no orange. Each project gets one of five colours, which frames its card and fills the banner of its page. The card's picture is a small version of the project's lead chart, drawn from the same data as the full chart. Light is the default; dark is a charcoal page with cream outlines and teal shadows, and every fill keeps cream text at 4.8:1 or better in both themes. Charts, diagrams and share cards use the same tokens.

## Deploying to GitHub Pages

Push this folder to a GitHub repo and enable Pages with the "GitHub Actions" source. A repo named `<user>.github.io` is served from the root; any other name is served from `/<repo>/`, and the workflow sets the base path accordingly.

## Known limits

- The search box's test questions were written by the same person who wrote the passages, there are 17 held-out questions, and I looked at aggregate held-out scores while improving the algorithm. Treat its numbers as a sanity check, not a benchmark.
- A few test results encode judgement, for example that a validation score picked by best checkpoint is optimistic. Each one lists the evidence it rests on.
- Email and LinkedIn are not set in `src/data/site.ts` yet; they render only when set. Experience, education and skills in `site.ts` are copied from the CV and must be kept in step with it by hand.
