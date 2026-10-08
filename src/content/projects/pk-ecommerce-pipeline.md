---
title: Pakistan E-Commerce Pipeline
shortName: pk-pipeline
tagline: 584,524 order items from an Excel export that was 44% blank padding, accounted for row by row.
role: "Built end to end: ingestion, Spark jobs, warehouse, tests and CI."
summary: A batch data pipeline for Pakistan's largest public e-commerce dataset. Monthly batches land in an S3 data lake, are cleaned and validated with PySpark, and load into a Postgres star schema. Bad rows are quarantined with the reason, and every stage proves its row counts add up.
tier: flagship
order: 3
status: shipped
stack: [Python, PySpark, PostgreSQL, S3 API (RustFS), Docker Compose, Airflow, SQL, GitHub Actions]
repos:
  - name: pk-ecommerce-pipeline
    ref: 14c51471e11dda96e09926d74a6a3263aa82ae8d
    role: primary
links:
  - label: Design decisions (D1 to D29)
    url: https://github.com/Adilmp/pk-ecommerce-pipeline/blob/14c51471e11dda96e09926d74a6a3263aa82ae8d/docs/DECISIONS.md
  - label: Security review
    url: https://github.com/Adilmp/pk-ecommerce-pipeline/blob/14c51471e11dda96e09926d74a6a3263aa82ae8d/docs/SECURITY.md
headline:
  - value: "584,524"
    label: rows read, all accounted for
    note: 574,758 loaded, 9,766 quarantined, none dropped silently
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: ["| Rows read | **584,524**", "**574,758**", "**9,766** (1.67%)"] }
  - value: "PKR 965.2M"
    label: completed revenue
    note: matches an independent Python implementation for all 26 months
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: ["**PKR 965.2 million**", "All 26 months match exactly, including total revenue, to the paisa"] }
  - value: "~4 min"
    label: full 26-month backfill
    note: on a laptop, with one command
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "**~4 minutes** on a laptop" }
  - value: "99.5%"
    label: of the quarantine is one rule
    note: 9,713 of 9,766 rows have a discount larger than the item's value
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "| `DISCOUNT_EXCEEDS_LINE`: discount larger than price × qty | 9,713 |" }
assertions:
  - claim: Every row is accounted for
    expected: rows read = clean + quarantined + duplicates
    actual: 584,524 read = 574,758 loaded + 9,766 quarantined
    status: pass
    headline: true
    short: 584,524 read = 574,758 clean + 9,766 quarantined
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: ["| Rows read | **584,524**", "**574,758**", "**9,766** (1.67%)"] }
  - claim: Revenue matches an independent implementation
    actual: all 26 months match a plain-Python check exactly, to the paisa
    status: pass
    short: revenue matches an independent check, to the paisa
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "All 26 months match exactly, including total revenue, to the paisa" }
  - claim: The reconciliation checks catch real bugs
    actual: the row-count check caught line breaks inside 11 quoted SKUs splitting rows in two
    status: pass
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: ["caught a real bug", "11 quoted SKUs"] }
  - claim: Re-running a month never duplicates rows
    expected: idempotent loads
    actual: one transaction per month, and the gold load is serialised
    status: pass
    note: 50 unit tests plus an end-to-end test run in CI.
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "Rerunning a month never creates duplicates" }
  - claim: A full backfill is practical to run
    actual: 26 months in about 4 minutes on a laptop, with one command
    status: pass
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "**~4 minutes** on a laptop" }
  - claim: The quarantine has an explanation
    actual: one rule, DISCOUNT_EXCEEDS_LINE, accounts for 9,713 of 9,766 rows (99.5%)
    status: pass
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "| `DISCOUNT_EXCEEDS_LINE`: discount larger than price × qty | 9,713 |" }
  - claim: Services are locked down by default
    actual: ports on localhost only, no secrets in git, checksummed jars, dependencies scanned in CI
    status: pass
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "Services on localhost only, no secrets in git, checksummed and scanned dependencies" }
  - claim: The source file can be loaded as delivered
    actual: "no; it has 464,051 blank padding lines, Excel errors (#REF! and #N/A), and a grand_total repeated on every item"
    status: fail
    headline: true
    short: "source file loadable as delivered: no"
    note: The data was profiled before anything was designed, and each problem became a rule or a design decision.
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: ["464,051 blank lines", "`grand_total` is the order total repeated on every item"] }
  - claim: Completed revenue alone shows the real trend
    actual: no; June to August 2018 show 0.0 because almost no orders were marked complete at export time
    status: fail
    note: A naive revenue chart would show sales falling to zero. The value is there, filed as in progress.
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "The last months aren't a collapse" }
  - claim: Spark is the right size of tool for 0.5M rows
    actual: no; at 0.5M rows pandas would be faster, and Spark was chosen so the design scales
    status: fail
    short: "Spark right-sized for 0.5M rows: no"
    note: I chose Spark so the design scales, and wrote the trade-off down instead of hiding it (D7).
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "at 0.5M rows pandas would be faster" }
  - claim: Dependencies have no known vulnerabilities
    actual: no; PySpark 3.5's bundled jars and AWS SDK v1 are an accepted risk until a Spark 4 upgrade
    status: fail
    note: The job only parses trusted batch files, and its one network service is on localhost.
    receipt: { repo: pk-ecommerce-pipeline, path: docs/SECURITY.md, find: ["Spark 3.5's bundled jars and AWS SDK v1", "Spark 4 (Hadoop 3.4, SDK v2)"] }
failures:
  - title: Spark split 11 rows into 22 broken records
    found: The row-count check between ingest and Spark failed. Eleven SKUs contain line breaks inside quotes, so Spark turned each of those rows into two broken records.
    fix: The CSV reader now sets multiLine. Raw files are immutable, so the fix was replayed from the original data rather than patched downstream.
    outcome: fixed
    receipt: { repo: pk-ecommerce-pipeline, path: src/pipeline/silver.py, find: ["11 rows have line breaks inside quoted SKUs", "multiLine"] }
  - title: grand_total would have counted a 3-item order three times
    found: grand_total is the order total repeated on every item, so summing it overstates revenue for every multi-item order.
    fix: Revenue is computed per item as price × qty − discount, and the fact table has one row per order item.
    outcome: fixed
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "revenue is computed per item instead (price × qty − discount)" }
  - title: 9,713 discounts were larger than the item they discounted
    found: Profiling found lines whose discount exceeds price × quantity, which gives negative revenue.
    fix: Those rows go to quarantine with the reason code DISCOUNT_EXCEEDS_LINE, visible and reprocessable, instead of being dropped or silently clamped.
    outcome: fixed
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "9,713 discounts are larger than the item's own value" }
  - title: The object store vanished two weeks before the build
    found: The project was designed on MinIO. MinIO deleted its images from Docker Hub on 11 September 2026.
    fix: Because the code only speaks the S3 API, switching to RustFS was a one-line change in docker-compose.yml, and so is moving to AWS.
    outcome: fixed
    receipt: { repo: pk-ecommerce-pipeline, path: docs/DECISIONS.md, find: "MinIO deleted its images from Docker" }
  - title: The security review found vulnerable jars
    found: The Postgres JDBC driver 42.7.4 had three HIGH CVEs, and the AWS SDK bundle 1.12.262 shipped old Jackson, Ion and Netty with 19 HIGH or CRITICAL CVEs.
    fix: Upgraded to JDBC 42.7.13, which has no known CVEs, and SDK 1.12.797. Twelve findings remain, all in shaded Netty, and are written up as an accepted risk until a Spark 4 upgrade.
    outcome: accepted
    receipt: { repo: pk-ecommerce-pipeline, path: docs/SECURITY.md, find: ["42.7.4", "1.12.262"] }
  - title: Data quality fell off a cliff in January 2018
    found: Quarantined rows jump from a handful a month to between 257 and 2,934 a month. That looks like a change in the source system.
    fix: Nothing to fix upstream. The quarantine table makes the change visible, measurable and reprocessable instead of silently dropped.
    outcome: accepted
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: "The problem starts abruptly in **January 2018**" }
decisions:
  - title: Keep raw data immutable
    why: Any bug can be fixed and replayed from the original files. That was used for real to fix the CSV bug (D3).
  - title: Model revenue at the item grain
    why: grand_total is order-level, so the fact table has one row per order item and revenue is computed from price, quantity and discount (D18).
  - title: Quarantine bad rows, never drop them
    why: A failing row is set aside with every reason code and its raw values, so quality problems stay visible and reprocessable.
  - title: Speak only the S3 API
    why: Storage and compute are decoupled, so swapping the object store took one line when MinIO disappeared (D4).
  - title: Make every stage prove its counts
    why: The pipeline stops if Spark reads a different number of rows than ingest wrote, if read does not equal clean plus quarantined plus duplicates, or if loaded does not equal staged.
diagram:
  caption: A clean row travels to the warehouse. A bad row is set aside in quarantine with its reasons. Raw files are never modified, so any bug can be replayed.
  receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: ["flowchart LR", "fact_order_items + 4 dims"] }
  nodes:
    - { id: csv, label: Kaggle CSV, sub: "584,524 order items", col: 0, row: 0, kind: input }
    - { id: ingest, label: Ingest, sub: "split by month, add manifest", col: 1, row: 0 }
    - { id: raw, label: raw/, sub: "CSV per month, never modified", col: 2, row: 0, kind: store }
    - { id: silver, label: Clean with PySpark, sub: "schema, de-dup, 16 rules", col: 3, row: 0, kind: gate }
    - { id: silverstore, label: silver/, sub: "Parquet, clean rows", col: 4, row: 0, kind: store }
    - { id: quarantine, label: quarantine/, sub: "bad rows plus reasons", col: 3, row: 1, kind: blocked }
    - { id: dq, label: dq tables, sub: "reasons and run log", col: 2, row: 1, kind: store }
    - { id: gold, label: Load, sub: "JDBC to staging, one txn", col: 4, row: 1 }
    - { id: dw, label: Star schema, sub: "fact_order_items + 4 dims", col: 4, row: 2, kind: store }
    - { id: analytics, label: SQL views, sub: "revenue, cohorts, payments", col: 3, row: 2, kind: output }
  edges:
    - { from: csv, to: ingest }
    - { from: ingest, to: raw }
    - { from: raw, to: silver }
    - { from: silver, to: silverstore, label: clean }
    - { from: silver, to: quarantine, label: failed }
    - { from: quarantine, to: dq }
    - { from: silverstore, to: gold }
    - { from: gold, to: dw }
    - { from: dw, to: analytics }
  traces:
    - id: clean-row
      label: A clean row
      kind: ok
      path: [csv, ingest, raw, silver, silverstore, gold, dw, analytics]
      outcome: One row per order item, loaded in one transaction per month. Re-running a month never creates duplicates.
    - id: bad-row
      label: A bad row
      kind: blocked
      path: [csv, ingest, raw, silver, quarantine]
      outcome: 9,766 rows (1.67%) were set aside in quarantine, then recorded in the dq tables with every reason code and their raw values. Nothing was silently dropped.
charts:
  - type: bars
    title: Completed revenue by month, PKR millions
    takeaway: White Friday 2017 alone is 31% of 26 months of completed revenue.
    caption: From June 2018 almost no orders were marked complete when the data was exported, so those months show 0.0. That is not a sales collapse; the value is filed as in progress.
    max: 300
    showValues: false
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: ["| 2017-11 | 57,241 | 295.6 |", "31% of all 26 months"] }
    marks:
      - { index: 4, text: "White Friday 2016: 69.9" }
      - { index: 16, text: "White Friday 2017: 295.6" }
    bars:
      - { label: Jul 16, value: 8.3, tone: muted, tick: true }
      - { label: Aug 16, value: 15.1, tone: muted }
      - { label: Sep 16, value: 22.5, tone: muted }
      - { label: Oct 16, value: 17.3, tone: muted, tick: true }
      - { label: Nov 16, value: 69.9, tone: accent }
      - { label: Dec 16, value: 19.6, tone: muted }
      - { label: Jan 17, value: 23.6, tone: muted, tick: true }
      - { label: Feb 17, value: 19.0, tone: muted }
      - { label: Mar 17, value: 28.7, tone: muted }
      - { label: Apr 17, value: 22.2, tone: muted, tick: true }
      - { label: May 17, value: 36.4, tone: muted }
      - { label: Jun 17, value: 27.9, tone: muted }
      - { label: Jul 17, value: 12.4, tone: muted, tick: true }
      - { label: Aug 17, value: 20.7, tone: muted }
      - { label: Sep 17, value: 5.8, tone: muted }
      - { label: Oct 17, value: 21.6, tone: muted, tick: true }
      - { label: Nov 17, value: 295.6, tone: accent }
      - { label: Dec 17, value: 17.3, tone: muted }
      - { label: Jan 18, value: 20.9, tone: muted, tick: true }
      - { label: Feb 18, value: 122.2, tone: muted }
      - { label: Mar 18, value: 100.8, tone: muted }
      - { label: Apr 18, value: 15.7, tone: muted, tick: true }
      - { label: May 18, value: 21.4, tone: muted }
      - { label: Jun 18, value: 0.0, tone: warn }
      - { label: Jul 18, value: 0.0, tone: warn, tick: true }
      - { label: Aug 18, value: 0.0, tone: warn }
  - type: stack
    title: Order outcomes by payment type
    takeaway: Prepaid orders are cancelled almost 8 times as often as cash on delivery.
    caption: Share of orders by final status. Cash on delivery is refunded more, which fits returns after delivery.
    normalize: true
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: ["| Prepaid (cards, wallets, bank, vouchers) | 220,274 | 26.9% | 8.2% | 4.0% | 60.9% |", "| Cash on delivery | 182,503 | 58.5% | 9.8% | 23.8% | 7.9% |"] }
    rows:
      - label: Prepaid
        total: 220,274 orders
        segments:
          - { label: Completed, value: 26.9, tone: pass }
          - { label: In progress, value: 8.2, tone: muted }
          - { label: Refunded, value: 4.0, tone: warn }
          - { label: Cancelled, value: 60.9, tone: fail }
      - label: Cash on delivery
        total: 182,503 orders
        segments:
          - { label: Completed, value: 58.5, tone: pass }
          - { label: In progress, value: 9.8, tone: muted }
          - { label: Refunded, value: 23.8, tone: warn }
          - { label: Cancelled, value: 7.9, tone: fail }
      - label: Store credit
        total: 5,264 orders
        segments:
          - { label: Completed, value: 60.6, tone: pass }
          - { label: In progress, value: 15.2, tone: muted }
          - { label: Refunded, value: 23.3, tone: warn }
          - { label: Cancelled, value: 0.9, tone: fail }
  - type: bars
    title: Why 9,766 rows were quarantined
    takeaway: One rule explains 99.5% of the quarantine.
    caption: A discount larger than price times quantity gives negative revenue, so those lines are set aside rather than guessed at.
    orientation: h
    receipt: { repo: pk-ecommerce-pipeline, path: README.md, find: ["| `DISCOUNT_EXCEEDS_LINE`: discount larger than price × qty | 9,713 |", "| `NEGATIVE_DISCOUNT` | 3 |"] }
    bars:
      - { label: DISCOUNT_EXCEEDS_LINE, value: 9713, display: "9,713", tone: fail }
      - { label: MISSING_SKU, value: 20, display: "20", tone: muted }
      - { label: MISSING_STATUS, value: 19, display: "19", tone: muted }
      - { label: INVALID_CUSTOMER_ID, value: 11, display: "11", tone: muted }
      - { label: NEGATIVE_DISCOUNT, value: 3, display: "3", tone: muted }
---

## The problem

A data engineering role asks for PySpark, SQL, Docker, cloud storage and data quality. I wanted one project that shows all five on real, messy data, and that I could defend line by line.

## What I built

A batch pipeline over Pakistan's largest public e-commerce dataset: 584,524 order items from July 2016 to August 2018, in a 106 MB CSV that began life as an Excel export. Ingest splits it into monthly files, as if each month arrived separately, and lands them untouched in an S3 data lake with a manifest. PySpark reads each month with an explicit schema, cleans it and checks 16 data-quality rules. Clean rows load into a Postgres star schema in one transaction per month. Rows that fail a rule go to a quarantine table with every reason code. SQL views answer the business questions.

## How I tested it

Fifty unit tests and an end-to-end test run in CI. Every stage proves its row counts add up and stops the pipeline if they do not. The final results were also checked month by month against an independent plain-Python implementation of the same rules, and all 26 months match to the paisa.

## What I would do next

Upgrade to Spark 4, which retires the accepted dependency risk in the security review and moves the job to the AWS SDK v2.
