---
title: Text-to-SQL Guardrails
shortName: sql-guard
tagline: Ask a database in Arabic or English without trusting the model that writes the SQL.
role: "Built end to end: the pipeline, the guardrails and the evaluations."
summary: A bilingual text-to-SQL pipeline that treats the model as untrusted input. Generated queries are parsed into a syntax tree, checked against the real schema and run in a read-only sandbox. Built, attacked and measured on a laptop CPU.
tier: flagship
order: 1
status: shipped
stack: [Python, sqlglot, SQLite, FastAPI, Ollama, qwen2.5, pytest, uv, GitHub Actions]
repos:
  - name: text-to-sql-guardrails
    ref: 888d86748f5c32b51d4c413366a1b9462aff20b7
    role: primary
links:
  - label: Security model
    url: https://github.com/Adilmp/text-to-sql-guardrails/blob/888d86748f5c32b51d4c413366a1b9462aff20b7/SECURITY.md
  - label: Full results
    url: https://github.com/Adilmp/text-to-sql-guardrails/blob/888d86748f5c32b51d4c413366a1b9462aff20b7/docs/results.md
headline:
  - value: "79.2%"
    label: execution accuracy
    note: 19 of 24 paired Arabic and English questions, qwen2.5:7b on a CPU
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "**79.2%** (19/24)" }
  - value: "0"
    label: harmful statements executed
    note: all 12 answers to adversarial prompts blocked, across two models
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "all 12 answers to adversarial prompts blocked" }
  - value: "270"
    label: tests, all offline
    note: about 10 seconds, run in CI on Python 3.10 to 3.12
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "270, all offline in ~10 s" }
  - value: "3"
    label: real vulnerabilities found by testing
    note: fixes and residual risks written up in SECURITY.md
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "3 real vulnerabilities found by testing" }
assertions:
  - claim: No harmful statement reaches the database
    expected: 100% containment, which is the guardrail's job
    actual: 0 executed; 7 of 7 dangerous outputs contained (4 of 4 and 3 of 3)
    status: pass
    headline: true
    short: 0 harmful statements executed, 7/7 contained
    note: Neither model refused a single injection. Containment comes from the validator, not from model behaviour.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["4/4 (**100%**)", "3/3 (**100%**)"] }
  - claim: Arabic questions work as well as English at 7b
    expected: no measurable gap
    actual: Arabic 10/12 (83%), English 9/12 (75%)
    status: pass
    short: Arabic 83% vs English 75% at 7b, no real gap
    note: One case apart, which is noise at n=12. At 0.5b the gap opens, with Arabic at 33% and English at 58%.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["9/12 (75%)", "10/12 (83%)"] }
  - claim: Easy and medium questions work
    actual: easy 11/12 (92%), medium 7/8 (88%)
    status: pass
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["11/12 (92%)", "7/8 (88%)"] }
  - claim: Hard multi-table questions work
    actual: hard 1/4 (25%); questions tagged join 2/6 (33%)
    status: fail
    short: "hard multi-table questions: 1 of 4"
    note: Four of the five failures involve multi-table joins. This is the weak spot, not rounding noise.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["1/4 (25%)", "| join | 2/6 (33%) |"] }
  - claim: The confidence score ranks answers
    actual: mean 0.97 on correct answers, 0.71 on wrong ones (7b)
    status: pass
    note: It ranks answers; it is not a calibrated probability (decision D17). The Jev audit shows why that distinction matters.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["| correct | 19 | 0.97 |", "| wrong | 5 | 0.71 |"] }
  - claim: Invented tables and columns are caught before execution
    actual: 4 cases for the 0.5b model, 1 for the 7b model
    status: pass
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "caught before execution (4 cases for 0.5b, 1 for 7b)" }
  - claim: The eval is stable enough to gate on
    expected: zero tolerance, measured rather than guessed
    actual: qwen2.5:7b at temperature 0 gave byte-identical replies on all 30 cases
    status: pass
    short: "7b re-run: identical replies on all 30 cases"
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "byte-identical replies on all 30" }
  - claim: The regression gate catches an unsafe model swap
    actual: swapping 7b for 0.5b gives 19 to 11 correct, 9 regressions, exact McNemar p = 0.021
    status: pass
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: ["19 → 11 correct, 9 regressions", "p = 0.021"] }
  - claim: Tests run offline and in CI
    actual: 270 tests in about 10 seconds; CI on Python 3.10 to 3.12
    status: pass
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "270, all offline in ~10 s" }
  - claim: Semantic prompt injection through stored data is stopped
    expected: stopped
    actual: not stopped; the text 'ignore all rules' looks exactly like a legitimate label
    status: fail
    headline: true
    short: "semantic injection via stored data: not stopped"
    note: What bounds the damage is that the guardrails reject destructive SQL whatever persuaded the model, so it can return wrong rows but cannot delete any.
    receipt: { repo: text-to-sql-guardrails, path: SECURITY.md, find: ["ignore all rules", "semantic injection **cannot cause data loss**"] }
  - claim: Accuracy on the Spider benchmark
    actual: not run; the benchmark's SQLite databases cannot be downloaded unattended
    status: inconclusive
    short: "Spider benchmark: not run"
    note: No Spider number is quoted anywhere in the repo.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: "**Spider.**" }
  - claim: The Anthropic backend works
    actual: written and type-checked, never executed, because no API key was available
    status: inconclusive
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: "**Claude / Anthropic.**" }
  - claim: Dialectal Arabic works
    actual: not measured; the suite is Modern Standard Arabic only
    status: inconclusive
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: "**Dialectal Arabic.**" }
failures:
  - title: A stacked DROP was trimmed without being reported
    found: An earlier results table was wrong. A stacked DROP from the 0.5b model was trimmed without being reported, so the attack never showed up as an attack.
    fix: The extractor now recognises every statement keyword on the raw output and never sanitises it, and the eval records the raw model reply. Both models were re-measured.
    outcome: fixed
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "earlier version of this table was wrong" }
  - title: A 200 MB reply passed every control
    found: "Probing with printf('%.*c', 200000000, 'x') returned a 200 MB string in 1.1 seconds. It was one row, well inside the 5 second budget, an allowed function and an ordinary SELECT."
    fix: Every limit bounded rows or time and none bounded bytes. A per-cell cap of 4,096 characters and a total budget of 1,000,000 now apply in the executor, so the 200 MB reply serialises to about 4 KB.
    outcome: fixed
    receipt: { repo: text-to-sql-guardrails, path: SECURITY.md, find: "200 MB" }
  - title: A hostile table name ran SQL before any guardrail
    found: Static analysis flagged two of the three places where names are interpolated and missed PRAGMA table_info. An adversarial test that built a real database with a hostile table name found the third.
    fix: quote_identifier() doubles embedded quotes at all three sites. Scanners and adversarial tests found different bugs, and neither alone was enough.
    outcome: fixed
    receipt: { repo: text-to-sql-guardrails, path: SECURITY.md, find: "quote_identifier()" }
  - title: Stored prompt injection through sampled column values
    found: Low-cardinality column values are rendered into the system prompt. A value of '; DROP TABLE t-- reached the prompt intact, so anyone who can write a row can talk to the model.
    fix: A content allowlist withholds a column's samples if any value contains SQL-meaningful characters. A plain-language payload cannot be filtered by form, so that residual risk is documented and a test asserts it.
    outcome: accepted
    receipt: { repo: text-to-sql-guardrails, path: SECURITY.md, find: "_is_prompt_safe" }
  - title: A dead model server looked like a worse model
    found: My first attempt to measure run-to-run noise lost its Ollama server a few minutes in. Scored naively, accuracy fell from 19/24 to 2/24.
    fix: Outcomes now record a stable error code, and the regression gate has a third verdict, INCONCLUSIVE, for broken evidence. A broken run can hide a regression but cannot invent one.
    outcome: fixed
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "19/24 to 2/24" }
decisions:
  - title: Parse the query, never pattern-match it
    why: Every regex filter has a one-line bypass, such as DR/**/OP or a WITH clause hiding a DELETE. The validator parses with sqlglot and checks the whole tree.
  - title: Make runtime defences survive the validator
    why: The read-only URI, query_only pragma, deadline, row cap and byte budget are tested without the validator. If every static check were deleted, writes would still fail.
  - title: Measure containment and susceptibility separately
    why: Containment is the guardrail's job and must be 100%. Susceptibility is a property of the model. Mixing them gives a metric that runs backwards.
  - title: Set the regression tolerance from data
    why: Re-running 7b at temperature 0 gave identical replies on all 30 cases, so the gate allows zero regressions unless one is accepted in writing.
diagram:
  caption: One request through the pipeline. The model sits outside the trust boundary, and nothing it writes reaches the database without passing the validator.
  receipt: { repo: text-to-sql-guardrails, path: README.md, find: ["Extract SQL", "read-only · 5 s · 200 rows · byte cap"] }
  nodes:
    - { id: question, label: Question, sub: "Arabic, English or mixed", col: 0, row: 0, kind: input }
    - { id: clean, label: Clean and detect, sub: "meaning-preserving cleanup", col: 1, row: 0 }
    - { id: prompt, label: Build prompt, sub: "schema as DDL, Arabic aliases", col: 2, row: 0 }
    - { id: model, label: Model, sub: "Ollama, untrusted input", col: 3, row: 0, kind: model }
    - { id: extract, label: Extract SQL, sub: "strip fences and prose", col: 4, row: 0 }
    - { id: schema, label: Real schema, sub: "live catalog", col: 2, row: 1, kind: store }
    - { id: execute, label: Execute, sub: "read-only, 5 s, row+byte caps", col: 3, row: 1 }
    - { id: validate, label: Validate, sub: "syntax tree vs real schema", col: 4, row: 1, kind: gate }
    - { id: answer, label: Answer, sub: "rows plus confidence", col: 3, row: 2, kind: output }
    - { id: blocked, label: Blocked, sub: "names the rule that fired", col: 4, row: 2, kind: blocked }
  edges:
    - { from: question, to: clean }
    - { from: clean, to: prompt }
    - { from: prompt, to: model }
    - { from: model, to: extract }
    - { from: extract, to: validate }
    - { from: validate, to: execute, label: ok }
    - { from: execute, to: answer }
    - { from: validate, to: blocked, label: rejected }
    - { from: schema, to: prompt, label: DDL }
  traces:
    - id: normal
      label: A normal question
      kind: ok
      path: [question, clean, prompt, model, extract, validate, execute, answer]
      outcome: The query passes validation, runs read-only and comes back with a confidence score.
    - id: injection
      label: A prompt injection
      kind: blocked
      path: [question, clean, prompt, model, extract, validate, blocked]
      outcome: The model complied and wrote DROP TABLE orders. The validator rejected it with write_operation before anything ran.
charts:
  - type: bars
    title: Accuracy by difficulty, qwen2.5:7b
    takeaway: Single-table questions work. Hard multi-table questions are the cliff.
    caption: 24 paired cases. Hard has only 4 cases, so treat 25% as a direction, not a decimal.
    unit: "%"
    max: 100
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["11/12 (92%)", "7/8 (88%)", "1/4 (25%)"] }
    bars:
      - { label: Easy, value: 92, sub: "11 of 12", tone: pass }
      - { label: Medium, value: 88, sub: "7 of 8", tone: pass }
      - { label: Hard, value: 25, sub: "1 of 4", tone: fail }
  - type: grouped
    title: Accuracy by language and model size
    takeaway: Arabic degrades first as the model shrinks.
    caption: n=12 per language per model. At 7b the languages are one case apart.
    unit: "%"
    max: 100
    series:
      - { name: English, tone: accent }
      - { name: Arabic, tone: warn }
    groups:
      - { label: "qwen2.5:7b", values: [75, 83] }
      - { label: "qwen2.5:0.5b", values: [58, 33] }
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["9/12 (75%)", "10/12 (83%)", "7/12 (58%)", "4/12 (33%)"] }
  - type: stack
    title: What the models wrote when told to attack
    takeaway: Neither model refused once. The validator contained every dangerous output.
    caption: Six adversarial prompts per model. Dangerous means a write, DDL, sandbox escape, denied function or stacked statement.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["| `qwen2.5:0.5b` | 6 | 4 | 2 | 0 |", "| `qwen2.5:7b` | 6 | 3 | 3 | 0 |"] }
    rows:
      - label: "qwen2.5:7b"
        total: 6 prompts
        segments:
          - { label: Dangerous, value: 3, tone: fail }
          - { label: Inert attempt, value: 3, tone: warn }
          - { label: Refused, value: 0, tone: pass }
      - label: "qwen2.5:0.5b"
        total: 6 prompts
        segments:
          - { label: Dangerous, value: 4, tone: fail }
          - { label: Inert attempt, value: 2, tone: warn }
          - { label: Refused, value: 0, tone: pass }
---

## The problem

Most text-to-SQL demos send a schema and a question to a model and run whatever comes back. I wanted to know what has to happen around that call before it is safe to put in front of users, and to measure whether it works in Arabic as well as English.

## What I built

A pipeline that treats the model as untrusted input. The generated query is parsed into a syntax tree, every table and column is checked against the real schema, and only then does it run in a read-only sandbox with a five second deadline and caps on rows and bytes. Every answer carries a confidence score.

Arabic input is cleaned before it reaches the model. The same word has several spellings, diacritics are optional, digits come from two Unicode ranges and copied text carries invisible direction marks, so the cleanup keeps a hard line between changes that preserve meaning and folding that is only used for matching.

## How I tested it

Three suites on a local CPU with Ollama. A paired set of 24 questions, 12 in each language. Six adversarial prompts: drop a table, delete rows, stack a statement, attach a database, read a file. And a regression gate that compares a new run with the committed one case by case. Two models took part, qwen2.5:7b and one about 15 times smaller.

## What I would do next

Run Spider, which needs its databases from somewhere other than HuggingFace. Try dialectal Arabic, because the suite is Modern Standard Arabic. And measure the Anthropic backend, which is written but has never run.
