---
name: add-portfolio-project
description: Add a new project (or update an existing one) on Adil's portfolio site at /mnt/data/portfolio. Use when the user says "add X to my portfolio", "put this project on my site", "make a case study for X", "add this to earlier work", or asks to refresh the numbers on a project already on the site.
---

# Add a project to the portfolio

The site is an Astro app where each project is one file, `src/content/projects/<slug>.md`, and every number needs a receipt (a file in a public repo at a pinned commit; `npm run check` verifies it). Read `/mnt/data/portfolio/CLAUDE.md` for the rules and `/mnt/data/portfolio/ADD_PROJECT.md` for the full playbook. This is the short procedure.

Work in `/mnt/data/portfolio`. Load nvm first: `export NVM_DIR=/mnt/data/.nvm; . $NVM_DIR/nvm.sh`. Open the folder in VS Code (`code -n /mnt/data/portfolio`) so the user can watch.

## 1. Decide the tier

- **Archive** (one line in "Earlier work"): small or older projects. One command, no verdicts.
- **Flagship** (full case study): needs a public repo with real, written-down results. If the numbers are not in the repo yet, ask the user to add them (or offer to) before citing anything.
- Private repo: no receipts can be verified. Prefer an archive entry, and never show student or user data.

If you are unsure which repo or which tier, ask the user one concrete question. Find repos with `gh repo list Adilmp --limit 100`.

## 2. Scaffold

```bash
npm run new-project -- <slug> --repo Adilmp/<repo> [--tier archive] [--title "Display title"]
```

This pins the repo's current commit. For a flagship it also prints README table rows that contain numbers: use those as candidate receipts.

## 3. Read the repo, then fill the file

Read the README, results docs, `DECISIONS`/`SECURITY`/postmortem files and the code that defines the architecture. Then fill, in this order: `role` (one true line on what the user did; ask if the work was shared), headline (3 or 4; the first tile becomes the stat burst on the card), assertions (5 or more; at least one `fail` or `inconclusive`; one or two `headline: true` with a `short`), failures (2 or more), decisions (2 or more), diagram (from the code, not the README), charts (1 or more, real data), and the four-section story.

- Copy `find` text **verbatim** from the file; prefer a whole table row; never span a line break.
- Do not invent a number, a failure or a limitation. If the repo does not say it, leave it out or ask.
- Do not soften what the repo admits. Weaknesses are the point.
- Plain, specific first-person copy. No em dashes, no hype. Match the tone of the existing five case studies.
- A `blocked` trace must end on a node of kind `blocked`; every trace step must be a real edge; diagram labels are at most 21 characters and subtitles at most 30.

## 4. Verify

```bash
npm run check && npm test && npm run check:types
```

Fix what `check` reports. It names the file, the field and the missing text. Then `npm run dev`, open the home page and the new case study, and look at desktop and phone width: the project card and its picture, the diagram traces, the charts, the test results table, the failure list.

## 5. Feature it on the first screen (optional)

The four big results on the home page come from `heroResults` in `src/data/site.ts`. If the new project has a number worth leading with, point one entry at its headline tile; otherwise leave it.

## 6. Make it searchable

Add one or two questions about the project to `src/data/search-gold.json` with `"split": "dev"` and `expect: ["<slug>"]`. Never add to the `test` split. `npm run build` re-evaluates the search box.

## 7. Stop and report

Tell the user what was added, anything you could not cite, and what they should read before publishing. **Do not commit, push or deploy unless they ask.** If they ask you to commit: plain message, no AI co-author trailer, identity `Adilmp <adilmp@users.noreply.github.com>`.

## Updating numbers on an existing project

Run `npm run drift` to see which repos moved past their pin. Update the `ref` in the project file to the new commit, run `npm run check` (it lists every receipt whose text is no longer present), update those numbers from the new file, and re-run all checks.
