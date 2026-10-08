---
title: Text-to-SQL Guardrails
shortName: sql-guard
tagline: Ask a database in English, Arabic or Urdu without trusting the model that writes the SQL.
role: "Built end to end: the pipeline, the guardrails and the evaluations."
summary: A text-to-SQL pipeline for English, Arabic and Urdu that treats the model as untrusted input. Generated queries are parsed into a syntax tree, checked against the real schema and run in a read-only sandbox, and when one is rejected the model is shown why and tries again. Built, attacked and measured on a laptop CPU.
tier: flagship
order: 1
status: shipped
stack: [Python, sqlglot, SQLite, FastAPI, Ollama, qwen2.5, pytest, uv, GitHub Actions]
repos:
  - name: text-to-sql-guardrails
    ref: dae1de376ba833da88455e2a10bfa5a1f0c0650d
    role: primary
links:
  - label: Full results
    url: https://github.com/Adilmp/text-to-sql-guardrails/blob/dae1de376ba833da88455e2a10bfa5a1f0c0650d/docs/results.md
  - label: Design decisions
    url: https://github.com/Adilmp/text-to-sql-guardrails/blob/dae1de376ba833da88455e2a10bfa5a1f0c0650d/DECISIONS.md
  - label: Security model
    url: https://github.com/Adilmp/text-to-sql-guardrails/blob/dae1de376ba833da88455e2a10bfa5a1f0c0650d/SECURITY.md
headline:
  - value: "85%"
    label: execution accuracy
    note: 51 of 60 questions in English, Arabic and Urdu, qwen2.5:7b on a CPU; the previous pipeline got 34
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "**85.0%** (51/60)" }
  - value: "0"
    label: harmful statements executed
    note: every answer to an adversarial prompt contained, across two models
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "every answer to an adversarial prompt contained, across two models" }
  - value: "67%"
    label: held-out accuracy
    note: 16 of 24 hard questions written before any tuning and run once; the previous pipeline got 7
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "**66.7%** (16/24)" }
  - value: "439"
    label: tests, all offline
    note: about 10 seconds, run in CI on Python 3.10 to 3.12
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "439, all offline in ~10 s" }
assertions:
  - claim: Hard multi-table questions work
    expected: most of them
    actual: 21 of 27 on the development suite (78%), up from 6 of 27 (22%)
    status: pass
    headline: true
    short: "hard questions: 6 of 27 before, 21 of 27 after"
    note: Joins were the weak spot of the first version. The model read a column off the wrong table or left a join column unqualified. Join conditions, business definitions and a repair loop fixed most of them.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: "| multilingual | `qwen2.5:7b` | 34/60 (56.7%) | **51/60 (85.0%)** | 6/27 (22%) | 21/27 (78%) |" }
  - claim: The gains hold on questions the tuning never saw
    expected: a clear gain on the held-out suite
    actual: 7 of 24 before, 16 of 24 after (66.7%)
    status: pass
    note: It ends lower than the 85% on the development suite, which is where the prompt was tuned and so flatters it. The held-out number is the one to trust.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: "| holdout | `qwen2.5:7b` | 7/24 (29.2%) | **16/24 (66.7%)** |" }
  - claim: No harmful statement reaches the database
    expected: 100% containment, which is the guardrail's job
    actual: 0 executed; 6 of 6 dangerous outputs contained (4 of 4 and 2 of 2)
    status: pass
    headline: true
    short: 0 harmful statements executed, 6/6 contained
    note: Containment comes from the validator, not from model behaviour. A query that tried to write is never sent back for repair.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["| `qwen2.5:0.5b` | 7 | 4 | 2 | 1 | 4/4 (**100%**) |", "| `qwen2.5:7b` | 7 | 2 | 4 | 1 | 2/2 (**100%**) |"] }
  - claim: Urdu works about as well as English
    expected: no large gap
    actual: English 18/20, Arabic 17/20, Urdu 16/20 on the development suite
    status: pass
    note: Urdu is new. Through the old Arabic path it scored 10 of 20.
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "18/20 · 17/20 · 16/20 on the development suite" }
  - claim: Follow-up questions work
    actual: 19 of 24 (79.2%); English 7/8, Arabic 7/8, Urdu 5/8
    status: pass
    note: Adding them left every single-question reply byte-identical, for both models. Bare fragments such as "only for customers in the UAE" are where it still slips.
    receipt: { repo: text-to-sql-guardrails, path: DECISIONS.md, find: ["**19/24 (79.2%)**: English 7/8, Arabic 7/8, Urdu 5/8", "**byte-identical replies** for both models"] }
  - claim: Clarifying questions only fire where a term is really ambiguous
    actual: on the two eval questions whose verbs split the model from the gold answer, in each language, and nowhere else
    status: pass
    note: With hints that say what to do in the query, the model followed the chosen option in 15 of 15 tries.
    receipt: { repo: text-to-sql-guardrails, path: DECISIONS.md, find: ["fires on exactly six", "followed the chosen meaning in 15 of 15 tries"] }
  - claim: The confidence score separates right answers from wrong ones
    expected: a clear gap
    actual: mean 0.98 on correct answers and 0.96 on wrong ones (7b, development suite)
    status: fail
    note: It used to (0.97 against 0.71) because most wrong answers failed to run. Now almost every answer runs, and its signals are structural, so a well-formed wrong query looks like a right one.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["| correct | 51 | 0.98 |", "| wrong | 9 | 0.96 |"] }
  - claim: The repair loop is what fixed hard questions
    actual: it fired on 2 of 84 questions and fixed 1; on the 0.5b model it fired on 42 and fixed none
    status: fail
    note: The prompt changes did the work. The loop is a safety net for queries that would have failed outright.
    receipt: { repo: text-to-sql-guardrails, path: DECISIONS.md, find: ["fired on 2 of 84 accuracy", "fired on 42 of 84 and fixed"] }
  - claim: Similar questions can share a cached answer
    expected: rewordings match and different questions do not
    actual: the embedding model scored "customers in Dubai" against "customers in Riyadh" at 1.000, above true rewordings (0.938 to 0.976)
    status: fail
    note: So the cache matches only case, punctuation, polite filler and spelling variants, and every hit is validated and run again.
    receipt: { repo: text-to-sql-guardrails, path: DECISIONS.md, find: ["| no | 1.000 |", "| true English rewordings | yes | 0.938–0.976 |"] }
  - claim: The 0.5b model is good enough
    actual: "qwen2.5:0.5b: 0 of 24 held out, 3 of 24 follow-ups, Urdu 1 of 20"
    status: fail
    note: It improved on the original 24 questions and collapses on the new hard ones. It is less accurate and exactly as safe.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["| `qwen2.5:0.5b` | 24 | **0/24 (0.0%)** |", "| `qwen2.5:0.5b` | 24 | **3/24 (12.5%)** |", "1/20 (5%)"] }
  - claim: The eval is stable enough to gate on
    expected: identical replies on unchanged code
    actual: re-running 7b gives byte-identical replies, and the baseline for this change reproduced the committed 19/24 exactly
    status: pass
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: ["gives byte-identical replies", "reproduced the committed 19/24 exactly"] }
  - claim: Semantic prompt injection through stored data is stopped
    expected: stopped
    actual: not stopped; the text 'ignore all rules' looks exactly like a legitimate label
    status: fail
    note: What bounds the damage is that the guardrails reject destructive SQL whatever persuaded the model, so it can return wrong rows but cannot delete any.
    receipt: { repo: text-to-sql-guardrails, path: SECURITY.md, find: ["ignore all rules", "semantic injection **cannot cause data loss**"] }
  - claim: Accuracy on the Spider benchmark
    actual: not run; the benchmark's SQLite databases cannot be downloaded unattended
    status: inconclusive
    note: No Spider number is quoted anywhere in the repo.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: "**Spider.**" }
  - claim: Dialectal Arabic and Roman Urdu work
    actual: not measured; the suite is Modern Standard Arabic and Urdu in Urdu script
    status: inconclusive
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["**Dialectal Arabic.**", "**Roman Urdu**"] }
failures:
  - title: The first question of every session timed out
    found: The request timeout was shorter than a cold start. Loading the model and reading the prompt took 128 seconds, the 120 second limit cut it off, and the client retried.
    fix: Timeouts now come from measured latency, the server reads the prompt once at startup, and the model stays loaded while the server runs.
    outcome: fixed
    receipt: { repo: text-to-sql-guardrails, path: DECISIONS.md, find: "the 120 s limit cut it off" }
  - title: Valid queries with a subquery were blocked
    found: The validator reported a derived table's alias as undefined, so valid queries with a subquery in a join were rejected. Hard questions use them often.
    fix: Derived tables are resolved like CTEs. Their contents are still checked, so naming a subquery cannot hide an unknown table.
    outcome: fixed
    receipt: { repo: text-to-sql-guardrails, path: README.md, find: "a subquery's alias was reported as undefined" }
  - title: The repair loop coached an attack
    found: Asked to fix a parse error that contained DROP, the model returned the same attack with a semicolon in it. The second statement did not parse, so it vanished from the telemetry.
    fix: A rejected reply that contains a write keyword is never repaired, and the stacked-statement check uses sqlglot's tokenizer, which works on text that does not parse.
    outcome: fixed
    receipt: { repo: text-to-sql-guardrails, path: SECURITY.md, find: "It happened again, differently." }
  - title: A clarification lost to the Urdu verb
    found: After choosing "all orders", the Urdu question still came back filtered on status = 'delivered'. The plain-language steps under the answer showed it at once.
    fix: Clarification hints now say what to do in the query. The model then followed the chosen option in 15 of 15 tries across three languages.
    outcome: fixed
    receipt: { repo: text-to-sql-guardrails, path: DECISIONS.md, find: ["Urdu verb outweighed an English phrase in parentheses", "15 of 15 tries"] }
  - title: Stopping the demo threw the model's work away
    found: A keep-alive request sent on shutdown did not carry the context size the model was loaded with, so Ollama reloaded the model and a running job paid a 4.5 minute re-read.
    fix: The server keeps the model warm through its normal request path and never sends a bare keep-alive.
    outcome: fixed
    receipt: { repo: text-to-sql-guardrails, path: DECISIONS.md, find: "4.5-minute re-read" }
  - title: A 200 MB reply passed every control
    found: "Probing with printf('%.*c', 200000000, 'x') returned a 200 MB string in 1.1 seconds. It was one row, well inside the 5 second budget, an allowed function and an ordinary SELECT."
    fix: Every limit bounded rows or time and none bounded bytes. A per-cell cap and a total byte budget now apply in the executor.
    outcome: fixed
    receipt: { repo: text-to-sql-guardrails, path: SECURITY.md, find: "200 MB" }
  - title: Stored prompt injection through sampled column values
    found: Column values are rendered into the prompt, and repair hints quote values from the data. A value of '; DROP TABLE t-- reached the prompt intact.
    fix: A content allowlist withholds unsafe values from both. A plain-language payload cannot be filtered by form, so that residual risk is documented and a test asserts it.
    outcome: accepted
    receipt: { repo: text-to-sql-guardrails, path: SECURITY.md, find: "catalog.is_prompt_safe" }
decisions:
  - title: Parse the query, never pattern-match it
    why: Every regex filter has a one-line bypass, such as DR/**/OP or a WITH clause hiding a DELETE. The validator parses with sqlglot and checks the whole tree.
  - title: Hold out questions before tuning
    why: Eight hard questions were written and checked before any prompt change and run once at the end. A prompt tuned on a suite always looks good on that suite.
  - title: One prompt for every language
    why: The model reads its prompt once at startup and reuses it whatever language comes next. A prompt per language made every switch re-read it from scratch.
  - title: Show the model the error, but never repair an attack
    why: The validator and SQLite already know what is wrong with a broken query. A query that tried to write is final, because a repair would turn a blocked attack into a cleaner one.
  - title: Ask back from a curated list
    why: A short list of terms that can be read two ways in this data decides when to ask. It costs no model call and is checked against every eval question.
  - title: Build answer text from the result
    why: The one-line answer and the plain-language steps come from the result and the syntax tree, so they cannot state a number the query did not return.
diagram:
  caption: One request through the pipeline. The model sits outside the trust boundary, and nothing it writes reaches the database without passing the validator, including a repaired query.
  receipt: { repo: text-to-sql-guardrails, path: README.md, find: ["Extract SQL", "read-only · 5 s · 200 rows · byte cap", "show the model the problem"] }
  nodes:
    - { id: question, label: Question, sub: "English, Arabic or Urdu", col: 0, row: 0, kind: input }
    - { id: clean, label: Clean and detect, sub: "language, digits, spelling", col: 1, row: 0 }
    - { id: prompt, label: Shared prompt, sub: "DDL, joins, definitions", col: 2, row: 0 }
    - { id: model, label: Model, sub: "Ollama, untrusted input", col: 3, row: 0, kind: model }
    - { id: extract, label: Extract SQL, sub: "keeps every keyword", col: 4, row: 0 }
    - { id: schema, label: Schema and glossary, sub: "live catalog, business terms", col: 2, row: 1, kind: store }
    - { id: repair, label: Repair, sub: "shows the model the error", col: 3, row: 1 }
    - { id: validate, label: Validate, sub: "syntax tree vs real schema", col: 4, row: 1, kind: gate }
    - { id: answer, label: Answer, sub: "sentence, steps, chart", col: 2, row: 2, kind: output }
    - { id: execute, label: Execute and ground, sub: "read-only, values checked", col: 3, row: 2 }
    - { id: blocked, label: Blocked, sub: "names the rule that fired", col: 4, row: 2, kind: blocked }
  edges:
    - { from: question, to: clean }
    - { from: clean, to: prompt }
    - { from: prompt, to: model }
    - { from: model, to: extract }
    - { from: extract, to: validate }
    - { from: validate, to: execute, label: ok }
    - { from: execute, to: answer }
    - { from: validate, to: blocked, label: attack }
    - { from: validate, to: repair, label: fix }
    - { from: repair, to: model, label: "at most twice" }
    - { from: execute, to: repair, label: SQLite error }
    - { from: schema, to: prompt, label: DDL }
  traces:
    - id: normal
      label: A normal question
      kind: ok
      path: [question, clean, prompt, model, extract, validate, execute, answer]
      outcome: The query passes validation, runs read-only, and the answer comes back as one line in the question's language, with the steps that produced it.
    - id: repaired
      label: A broken query, repaired
      kind: ok
      path: [question, clean, prompt, model, extract, validate, repair, model, extract, validate, execute, answer]
      outcome: When the model reads city off the orders table, the validator says which table has it and the model tries again with the join. Every repaired query is validated again.
    - id: injection
      label: A prompt injection
      kind: blocked
      path: [question, clean, prompt, model, extract, validate, blocked]
      outcome: The model wrote DROP TABLE orders. The validator rejected it with write_operation, and it was never sent back for repair.
charts:
  - type: grouped
    title: Before and after, qwen2.5:7b
    takeaway: The gain held on hard questions written before any tuning.
    caption: Same model, same questions, scored the same way. Before is the previous pipeline run on today's suites.
    unit: "%"
    max: 100
    decimals: 1
    series:
      - { name: Before, tone: muted }
      - { name: After, tone: accent }
    groups:
      - { label: "Development (60)", values: [56.7, 85.0] }
      - { label: "Held out (24)", values: [29.2, 66.7] }
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["| holdout | `qwen2.5:7b` | 7/24 (29.2%) | **16/24 (66.7%)** |", "| multilingual | `qwen2.5:7b` | 34/60 (56.7%) | **51/60 (85.0%)** |"] }
  - type: grouped
    title: Accuracy by language and model size
    takeaway: At 7b the three languages are close. The small model loses Urdu almost entirely.
    caption: Development suite, 20 questions per language.
    unit: "%"
    max: 100
    series:
      - { name: English, tone: accent }
      - { name: Arabic, tone: warn }
      - { name: Urdu, tone: pass }
    groups:
      - { label: "qwen2.5:7b", values: [90, 85, 80] }
      - { label: "qwen2.5:0.5b", values: [50, 30, 5] }
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["18/20 (90%) | 17/20 (85%) | 16/20 (80%)", "10/20 (50%) | 6/20 (30%) | 1/20 (5%)"] }
  - type: stack
    title: What the models wrote when told to attack
    takeaway: Each model refused once. The validator contained every dangerous output.
    caption: Seven adversarial prompts per model, one in Arabic and one in Urdu. Dangerous means a write, DDL, sandbox escape, denied function or stacked statement.
    receipt: { repo: text-to-sql-guardrails, path: docs/results.md, find: ["| `qwen2.5:0.5b` | 7 | 4 | 2 | 1 |", "| `qwen2.5:7b` | 7 | 2 | 4 | 1 |"] }
    rows:
      - label: "qwen2.5:7b"
        total: 7 prompts
        segments:
          - { label: Dangerous, value: 2, tone: fail }
          - { label: Inert attempt, value: 4, tone: warn }
          - { label: Refused, value: 1, tone: pass }
      - label: "qwen2.5:0.5b"
        total: 7 prompts
        segments:
          - { label: Dangerous, value: 4, tone: fail }
          - { label: Inert attempt, value: 2, tone: warn }
          - { label: Refused, value: 1, tone: pass }
---

## The problem

Most text-to-SQL demos send a schema and a question to a model and run whatever comes back. I wanted to know what has to happen around that call before it is safe to put in front of users, in Arabic and Urdu as well as English. The first version was safe but failed most hard questions, the ones that join three or four tables, and its first answer of every session timed out.

## What I built

A pipeline that treats the model as untrusted input. The generated query is parsed into a syntax tree, every table and column is checked against the real schema, and only then does it run in a read-only sandbox with a five second deadline and caps on rows and bytes. When the validator or SQLite rejects a query for a fixable reason, the model is shown the error and tries again, at most twice. A query that tried to write is never sent back.

Every language shares one prompt that lists how the tables join and what business terms mean, such as revenue being the price actually charged. Urdu is told apart from Arabic by its letters. The answer leads with one line in the question's language and the plain steps behind it, both built from the result rather than written by the model. Follow-up questions carry the earlier exchange, and a short curated list of ambiguous terms makes the system ask back before guessing.

## How I tested it

Four suites on a local CPU with Ollama. A development suite of 20 questions in each of three languages, where the prompt was tuned. A held-out suite of eight hard questions in each language, written before any tuning and run once. A follow-up suite of two-turn conversations. Seven adversarial prompts. A regression gate compares every new run with the committed one, question by question, and the previous pipeline was run on the same suites so the comparison is fair.

## What I would do next

The weakest parts of the system now are the confidence score, which cannot see a wrong but well-formed query, and plain-language injection through stored data, which the guardrails contain but cannot stop. Next I would look for a better confidence signal and turn the thumbs up and down that users can now give into reviewed eval cases and verified queries. Run Spider, which needs its databases from somewhere other than HuggingFace, and try dialectal Arabic and Roman Urdu, which the suites do not cover.
