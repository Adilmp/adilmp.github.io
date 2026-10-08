---
title: Does Jev's Confidence Mean Anything?
shortName: jev-audit
tagline: A vendor calls its confidence scores calibrated. I audited them against human annotators for $0.05, then shipped the fix as a one-file tool.
role: "Ran the audit, then wrote the tool that fixes what it found."
summary: An audit of the probabilities returned by TypeSafe's Jev, measured against human annotations instead of another model's opinion, plus jevcal, a single-file tool that finds out what your model's 0.9 really means and learns the correction.
tier: flagship
order: 4
status: shipped
stack: [Python, NumPy, pandas, matplotlib, Platt scaling, isotonic regression, civil_comments]
repos:
  - name: does-jev-confidence-mean-anything
    ref: def9face17aebef5cd2a54ece39ff0821bcfdf0c
    role: audit
  - name: jevcal
    ref: 468a4df3060a5205a73148fb3fb3aa298b7e4b8d
    role: tool
links: []
headline:
  - value: "10%"
    label: flagged by humans when Jev said about 75%
    note: natural comment traffic, best of four wordings
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: "reported ~75% confidence, human annotators flagged **10%** of those comments" }
  - value: "0.91"
    label: AUC, so it ranks well
    note: the units are wrong, not the decisions
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: "AUC 0.91 means it genuinely" }
  - value: "96%"
    label: of the error removed by a two-parameter fit
    note: with the ranking untouched
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: "a two-parameter fit removes 96%" }
  - value: "$0.05"
    label: to run the whole audit
    note: 8,000 judgments, 4 wordings, 2 base rates
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: ["8,000 judgments · 4 wordings · 2 base rates", "$0.05"] }
assertions:
  - claim: Jev ranks flagged comments above clean ones
    expected: AUC well above 0.5
    actual: AUC 0.903 to 0.912 across three runs
    status: pass
    short: "ranking is good: AUC 0.91"
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: ["| `hard` | 19.2% | original | 0.157 | 0.903 |", "| `natural` | 2.9% | tightened | 0.156 | 0.912 |"] }
  - claim: Stated confidence is calibrated
    expected: ECE near 0
    actual: ECE 0.156 to 0.209, and every confidence band sits below the diagonal
    status: fail
    headline: true
    short: "stated confidence is calibrated: no (ECE 0.16 to 0.21)"
    note: The vendor's sentence that higher confidence means higher accuracy is true here, since rank correlation is 0.96. What fails is reading 0.9 as a threshold you can bet on.
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: ["Every confidence band sat below the diagonal", "| `natural` | 2.9% | original | 0.209 | 0.906 |", "actual flag rate is 0.96"] }
  - claim: A stated 0.75 means about 75%
    expected: roughly 75% of those comments flagged
    actual: annotators flagged 10% of the judgments in the 0.7 to 0.8 band (n=40)
    status: fail
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: "reported ~75% confidence, human annotators flagged **10%** of those comments" }
  - claim: A two-parameter fit fixes the units without touching the ranking
    actual: ECE 0.157, 0.209 and 0.156 become 0.023, 0.007 and 0.006, and AUC stays 0.918
    status: pass
    headline: true
    short: "2-parameter fix: ECE to 0.006 to 0.023, AUC unchanged"
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: ["**0.023**", "**0.007**", "**0.006**", "0.918 → 0.918"] }
  - claim: The fix is scored on data it never saw
    actual: fitted on one half of the rows and scored on the other half
    status: pass
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: "Recalibration is fitted on one half and scored on the half it never saw" }
  - claim: A better prompt wording fixes the calibration
    expected: ECE near 0 with the right wording
    actual: no; across four wordings ECE spans 0.211 to 0.519 and the strictest still said 26% where reality was 5%
    status: fail
    short: "better prompt wording fixes it: no"
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: ["No wording fixed it", "**0.519**", "**0.211**"] }
  - claim: Accuracy at the default threshold shows the model works
    actual: 61.0% accuracy, worse than answering no every time (67.8%), while ranking at AUC 0.83
    status: fail
    note: The signal is there and the threshold is in the wrong place. That is the whole argument for measuring calibration.
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: ["**61.0%**", "**67.8%**", "**AUC 0.83**"] }
  - claim: A low ECE means the model is good
    actual: no; a model that ignores its input and returns the base rate scores ECE 0.0000 at AUC 0.5
    status: fail
    short: "low ECE means a good model: no"
    note: So jevcal prints that baseline next to your result and makes its own decisions on Brier score.
    receipt: { repo: jevcal, path: README.md, find: "ECE of 0.0000 with AUC 0.5" }
  - claim: About 100 labelled rows are enough to calibrate
    actual: 94% of the calibration error removed at 100 rows, against 69% at 25, 90% at 50 and 93% at 800
    status: pass
    short: "jevcal: 100 labelled rows remove 94% of the error"
    receipt: { repo: jevcal, path: README.md, find: ["| 25 | 69% |", "| **100** | **94%** |", "| 800 | 93% |"] }
  - claim: jevcal says when it cannot be trusted
    actual: warns under 50 rows or 10 positives, and writes no file if the fix does not improve held-out Brier score
    status: pass
    receipt: { repo: jevcal, path: README.md, find: ["Under 50 rows or 10 positives", "It won't invent a fix you don't need"] }
  - claim: The correction works for models other than Jev
    actual: not tested; the repo's only example is the real Jev output from this audit
    status: inconclusive
    short: "jevcal beyond Jev: not tested"
    note: The README says nothing in it is Jev-specific. That is a design claim, and I have not run it on a second model.
    receipt: { repo: jevcal, path: README.md, find: "Nothing here is Jev-specific" }
failures:
  - title: My first guess at a better prompt made it worse
    found: Mirroring the annotators' own published definition, which should have been the fairest wording, gave the highest ECE of four wordings (0.519).
    fix: I ran four wordings of the same question in one call over identical state, so only the phrasing varied, then re-ran the whole pipeline with the best wording instead of the first. The bias survived.
    outcome: fixed
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: "was the **worst**" }
  - title: Accuracy would have said the model was fine
    found: At a 2.9% base rate, flagging nothing scores 97.1% accuracy, so accuracy on this data is worse than useless.
    fix: The measuring step prints the do-nothing baseline before anything else and reports precision and recall.
    outcome: fixed
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: "97.1%" }
  - title: ECE can be gamed
    found: A model that ignores its input and returns the base rate for every row scores a perfect ECE of 0.0000 with AUC 0.5.
    fix: jevcal prints that baseline beside your result and makes its own decisions on Brier score, which cannot be gamed that way.
    outcome: fixed
    receipt: { repo: jevcal, path: README.md, find: "ECE of 0.0000 with AUC 0.5" }
  - title: Invented data could be mistaken for real data
    found: A no-API-key mode needs simulated data to test the plumbing, and simulated data looks exactly like data.
    fix: Simulated output goes to separate SIMULATED files and every chart is stamped, so the two cannot be confused.
    outcome: fixed
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: "Simulated output goes to separate" }
decisions:
  - title: Use human ground truth, not a model's opinion
    why: civil_comments records what fraction of a panel flagged each comment, so a toxicity of 0.7 means 7 in 10 real people agreed.
  - title: Test the obvious objection before making the claim
    why: Someone will say the prompt was badly worded. Step 7 runs four wordings in one call and the headline uses the best, not the first.
  - title: Ship the fix, not only the finding
    why: jevcal fits a correction on half the labelled rows, scores it on the other half, and prints the threshold you should actually write.
  - title: Implement the maths directly
    why: Platt scaling and isotonic regression are about sixty lines each, and the API client is plain urllib, so every number traces to code in the repo.
diagram:
  caption: One pipeline, two outcomes. The audit trace measures the problem. The fix trace learns a correction. The red trace is the bet that the audit disproves.
  receipt: { repo: jevcal, path: README.md, find: ["jevcal check", "jevcal fit", "jevcal apply"] }
  nodes:
    - { id: data, label: civil_comments, sub: "human annotator shares", col: 0, row: 0, kind: input }
    - { id: jev, label: Jev API, sub: "4 wordings, 8,000 judgments", col: 1, row: 0, kind: model }
    - { id: preds, label: Predictions, sub: "cached JSONL, resumable", col: 2, row: 0, kind: store }
    - { id: measure, label: Measure, sub: "ECE, Brier, AUC", col: 3, row: 0 }
    - { id: chart, label: Reliability chart, sub: "stated vs observed rate", col: 4, row: 0, kind: output }
    - { id: bad, label: if p > 0.9, sub: "a stated 0.9 delivers 28%", col: 1, row: 1, kind: blocked }
    - { id: fit, label: Fit a correction, sub: "Platt, fitted on half the rows", col: 2, row: 1, kind: gate }
    - { id: tool, label: jevcal, sub: "check, fit, apply", col: 3, row: 1 }
    - { id: deploy, label: cal(p) > 0.9, sub: "p now means a real rate", col: 4, row: 1, kind: output }
  edges:
    - { from: data, to: jev }
    - { from: jev, to: preds }
    - { from: preds, to: measure }
    - { from: measure, to: chart }
    - { from: jev, to: bad, label: raw score }
    - { from: preds, to: fit }
    - { from: fit, to: tool }
    - { from: tool, to: deploy }
  traces:
    - id: audit
      label: The audit
      kind: ok
      path: [data, jev, preds, measure, chart]
      outcome: AUC 0.91, so it ranks well, but ECE is 0.156 to 0.209 and every confidence band sits below the diagonal.
    - id: fix
      label: The fix
      kind: ok
      path: [data, jev, preds, fit, tool, deploy]
      outcome: Brier score goes from 0.0837 to 0.0248 on the held-out half and AUC stays 0.9264, so the ranking is untouched.
    - id: bet
      label: Using the raw score
      kind: blocked
      path: [data, jev, bad]
      outcome: A stated 0.9 delivers 28%. To get a real 90% you would need p of 0.997 or more, and 0 of 1,600 judgments reach it.
charts:
  - type: reliability
    title: Stated confidence against observed rate
    takeaway: Every confidence band sits below the diagonal. Jev's top band, scored 0.94, was right 33% of the time.
    caption: 1,600 judgments on natural comment traffic (2.9% positive), tightened wording. Dot size shows how many judgments fall in the band.
    xLabel: what Jev said (stated confidence)
    yLabel: how often annotators flagged it
    callout: { index: 7, text: "Jev said ~75%.\nAnnotators flagged\n10% of those." }
    receipt: { repo: does-jev-confidence-mean-anything, path: results/natural_strict_buckets.csv, find: ["0.7-0.8,40,0.75225,0.1,", "0.9-1.0,24,0.9362499999999999,0.3333333333333333"] }
    points:
      - { x: 0.0279, y: 0.0022, n: 890 }
      - { x: 0.1438, y: 0.0, n: 217 }
      - { x: 0.2465, y: 0.027, n: 148 }
      - { x: 0.3467, y: 0.0513, n: 78 }
      - { x: 0.4415, y: 0.0328, n: 61 }
      - { x: 0.5558, y: 0.0566, n: 53 }
      - { x: 0.6549, y: 0.122, n: 41 }
      - { x: 0.7523, y: 0.1, n: 40 }
      - { x: 0.8404, y: 0.2917, n: 48 }
      - { x: 0.9362, y: 0.3333, n: 24 }
  - type: bars
    title: Calibration error by question wording
    takeaway: Mirroring the annotators' own definition was the worst wording. No wording fixed it.
    caption: Four wordings of one question in a single call, over identical state. True base rate 4.8%. Lower is better.
    max: 0.6
    receipt: { repo: does-jev-confidence-mean-anything, path: README.md, find: ["| `v1_original` | 0.445 | 0.397 | 0.896 |", "**0.519**", "**0.211**"] }
    bars:
      - { label: Original, value: 0.397, display: "0.397", tone: muted }
      - { label: Annotator's definition, value: 0.519, display: "0.519", tone: fail }
      - { label: Strict, value: 0.211, display: "0.211", tone: accent }
      - { label: Bare, value: 0.441, display: "0.441", tone: muted }
  - type: bars
    title: Labelled rows needed to calibrate
    takeaway: About 100 labelled rows are enough. More does not help.
    caption: Share of calibration error removed, measured on real data.
    unit: "%"
    max: 100
    receipt: { repo: jevcal, path: README.md, find: ["| 25 | 69% |", "| **100** | **94%** |", "| 800 | 93% |"] }
    bars:
      - { label: 25 rows, value: 69, tone: muted }
      - { label: 50 rows, value: 90, tone: muted }
      - { label: 100 rows, value: 94, tone: accent }
      - { label: 800 rows, value: 93, tone: muted }
---

## The problem

A vendor's docs call its confidence scores calibrated. Engineers read that as: threshold at 0.9 and you get 90%. I wanted to know whether that reading survives contact with human-labelled data, and what it costs to find out.

## What I did

I used civil_comments as ground truth, because every comment carries the share of a human panel that flagged it. I sent 8,000 judgments to Jev, across four wordings and two base rates, for five cents, and measured ranking (AUC) and calibration (ECE and Brier score) separately.

Jev ranks well. Its probabilities lean toward yes, the error grows as positives get rarer, and a two-parameter fit removes 96% of it without changing a single ranking. Then I turned the check into a tool: jevcal, one file, numpy only, about 100 labelled rows.

## What this is not

It is not an argument against the model. An AUC of 0.91 means it understands the task, and as a high-recall pre-filter with a calibration layer on top it works. As `if p > 0.9` it does not do what it looks like it does.

## What I would do next

Run jevcal on a second model that emits probabilities, such as an LLM judge, to find out whether the claim that nothing in it is Jev-specific holds.
