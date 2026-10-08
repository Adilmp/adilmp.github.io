---
title: BookMind
shortName: bookmind
tagline: RAG over a book where every answer sentence is checked against its evidence.
role: "Built end to end: retrieval, answers, the answer checker and the evaluations."
summary: Ask a book questions and get answers grounded in cited passages. Retrieval is built from scratch (hand-written BM25, fused with embeddings), and a sentence-level checker labels each claim supported, weak or unsupported. A small evaluation harness measures all of it.
tier: flagship
order: 2
status: shipped
stack: [Python, FastAPI, Streamlit, BM25, nomic-embed-text, Ollama, Claude API, Docker]
repos:
  - name: bookmind
    ref: bb8f37f9a53e3d103305303ca3a7bf7b1f7839bc
    role: primary
links:
  - label: Evaluation results
    url: https://github.com/Adilmp/bookmind/blob/bb8f37f9a53e3d103305303ca3a7bf7b1f7839bc/README.md#evaluation-results
headline:
  - value: "95%"
    label: Recall@5, hybrid retrieval
    note: the right chapter is in the top 5 passages for 36 of 38 answerable questions
    receipt: { repo: bookmind, path: README.md, find: "| All 38: Recall@5 | 92% | 89% | **95%** |" }
  - value: "0.796"
    label: MRR, hybrid retrieval
    note: BM25 alone scores 0.703, embeddings alone 0.763
    receipt: { repo: bookmind, path: README.md, find: "| All 38: MRR | 0.703 | 0.763 | **0.796** |" }
  - value: "0 of 29"
    label: bad sentences marked supported
    note: wrong-evidence and invented sentences, none got a green check
    receipt: { repo: bookmind, path: README.md, find: ["Checked against the wrong passages (21) | 0 | 9 | 12", "Invented claims (8) | 0 | 2 | 6"] }
  - value: "326"
    label: chunks, each citeable by chapter
    note: built from one EPUB, with a hand-written BM25 index
    receipt: { repo: bookmind, path: README.md, find: "all 326 chunks" }
assertions:
  - claim: Hybrid retrieval finds the right chapter
    expected: Recall@5 above either retriever alone
    actual: Recall@5 95%, against 92% for BM25 and 89% for embeddings (38 questions)
    status: pass
    headline: true
    short: Recall@5 95%, ahead of BM25 and embeddings
    receipt: { repo: bookmind, path: README.md, find: "| All 38: Recall@5 | 92% | 89% | **95%** |" }
  - claim: Hybrid never loses a question BM25 found
    actual: it found one more, ranked the right chapter higher on 13 questions and lower on 7
    status: pass
    receipt: { repo: bookmind, path: README.md, find: ["Hybrid never lost a question BM25 found", "on 13 questions and lower on 7"] }
  - claim: Hybrid ranks better than BM25 by more than noise
    expected: an MRR gain whose interval excludes zero
    actual: MRR +0.093, 95% interval -0.03 to +0.22, which includes zero
    status: inconclusive
    headline: true
    short: "hybrid gain over BM25: not proven (interval spans 0)"
    note: Hybrid is the default because it was best or joint best on every slice and never worse on recall, not because the gain is proven. 38 questions cannot rule out luck.
    receipt: { repo: bookmind, path: README.md, find: ["The gain is not yet proven", "-0.03 to +0.22"] }
  - claim: The sentence checker never gives a green check to a bad sentence
    actual: 0 of 29 wrong-evidence or invented sentences were marked supported
    status: pass
    short: 0 of 29 bad sentences got a green check
    note: Similarity is not meaning, so a sentence that reverses a passage can still look close, and the calibration set is small and from one model.
    receipt: { repo: bookmind, path: README.md, find: ["Checked against the wrong passages (21) | 0 | 9 | 12", "Invented claims (8) | 0 | 2 | 6"] }
  - claim: Every citation points at a real chapter
    actual: checked deterministically, even without a model or an API key
    status: pass
    note: It checks that a cited chapter exists. Whether the passage supports the sentence is the sentence checker's job.
    receipt: { repo: bookmind, path: README.md, find: "The citation checker is deterministic" }
  - claim: It runs without a paid API
    actual: qwen2.5:7b on a laptop CPU takes 27 s to 2 min per cited answer
    status: pass
    note: It works, slowly. The 0.5b model answered in 17 s but copied the passage instead of answering.
    receipt: { repo: bookmind, path: README.md, find: ["a cited answer took 27 s to 2 min", "copied the passage instead of answering"] }
  - claim: Retrieval is judged at passage level
    actual: chapter level only; a hit means a passage from the right chapter
    status: fail
    short: "retrieval labels: chapter-level, not passage-level"
    receipt: { repo: bookmind, path: README.md, find: "The labels are chapter-level" }
  - claim: Off-topic questions are refused
    expected: all 4 off-topic questions refused
    actual: one off-topic question was refused in a manual check; the full measurement still needs a model run
    status: inconclusive
    short: "refusal correctness: not yet measured"
    receipt: { repo: bookmind, path: README.md, find: "Refusal correctness (adversarial) | *(run with a model)*" }
  - claim: RAG hallucinates less than closed-book
    actual: not yet measured at scale
    status: inconclusive
    receipt: { repo: bookmind, path: README.md, find: "Hallucination rate: RAG vs closed-book | *(run with a model)*" }
failures:
  - title: Concept maps were built, then deleted
    found: Word co-occurrence graphs, and graphs from LLM-extracted triples over a truncated prompt, gave readers nothing they could act on.
    fix: I removed the feature. A shipped graph nobody can use costs more than the feature is worth.
    outcome: fixed
    receipt: { repo: bookmind, path: README.md, find: "Built, then **removed**" }
  - title: The first test set could not tell two retrievers apart
    found: With only 12 questions, a single question moved Recall@5 by 8 points, so no comparison between retrievers meant anything.
    fix: I grew the set to 38 answerable and 4 off-topic questions, written and committed before dense or hybrid retrieval was measured so they could not be tuned to the new code.
    outcome: fixed
    receipt: { repo: bookmind, path: README.md, find: "The original 12 questions couldn't separate two retrievers" }
  - title: Each retriever failed in a different way
    found: BM25 matches words, so it misses a passage that says the same thing differently. Embeddings match meaning but drift toward passages that are merely on the same topic, and they are worse at exact terms.
    fix: Run both and merge the rankings with Reciprocal Rank Fusion, which uses only ranks, so the two score scales never need to be reconciled.
    outcome: fixed
    receipt: { repo: bookmind, path: README.md, find: "merely on the same topic" }
  - title: The smallest local model copied instead of answering
    found: qwen2.5:0.5b answered in 17 seconds, but it pasted the retrieved passage back instead of answering the question.
    fix: The default stays on the 7b model. If no model is reachable, an extractive fallback returns the top passage with its citation and says so.
    outcome: accepted
    receipt: { repo: bookmind, path: README.md, find: "copied the passage instead of answering" }
decisions:
  - title: Write the retriever by hand
    why: I wanted every part understood, not magic. BM25 is mine, the fusion fits in ten lines, and one file is the only code that talks to a model.
  - title: Fuse ranks, not scores
    why: Reciprocal Rank Fusion gives each passage 1/(60 + rank) per list. BM25's unbounded scores and cosine similarity never share a scale. The constant 60 is the standard value, not tuned here.
  - title: Check answers with embeddings, not another LLM
    why: Matching each answer sentence to its evidence is cheap, deterministic and cannot hallucinate. The thresholds were set on 8 real answers (21 sentences) labelled by hand.
  - title: Print the limits next to the headline
    why: The README shows the interval that includes zero and the chapter-level labels right beside the 95%, so the number cannot be read without its caveat.
diagram:
  caption: Two flows share one index. A question is retrieved, answered and checked. Two of the three traces end in a refusal or a flagged sentence on purpose.
  receipt: { repo: bookmind, path: README.md, find: ["Reciprocal Rank Fusion", "I couldn't find this in the book."] }
  nodes:
    - { id: question, label: Question, col: 0, row: 0, kind: input }
    - { id: epub, label: EPUB, sub: "one book", col: 0, row: 1, kind: input }
    - { id: search, label: Hybrid search, sub: "BM25 plus embeddings, RRF", col: 1, row: 0 }
    - { id: chunks, label: Chunks, sub: "326, cited by chapter", col: 1, row: 1, kind: store }
    - { id: llm, label: Grounded answer, sub: "Claude or local Ollama", col: 2, row: 0, kind: model }
    - { id: verify, label: Sentence check, sub: "supported, weak, unsupported", col: 3, row: 0, kind: gate }
    - { id: answer, label: Cited answer, sub: "every sentence labelled", col: 4, row: 0, kind: output }
    - { id: refuse, label: Refusal, sub: "reply: not in the book", col: 2, row: 1, kind: blocked }
    - { id: flag, label: Flagged, sub: "unsupported sentence marked", col: 3, row: 1, kind: blocked }
  edges:
    - { from: epub, to: chunks, label: ingest }
    - { from: chunks, to: search }
    - { from: question, to: search }
    - { from: search, to: llm, label: top 5 }
    - { from: llm, to: verify }
    - { from: verify, to: answer }
    - { from: llm, to: refuse, label: no answer }
    - { from: verify, to: flag }
  traces:
    - id: answerable
      label: A question the book answers
      kind: ok
      path: [question, search, llm, verify, answer]
      outcome: Passages are retrieved, the model answers with chapter citations, and every answer sentence is labelled against its evidence.
    - id: off-topic
      label: An off-topic question
      kind: blocked
      path: [question, search, llm, refuse]
      outcome: The prompt tells the model to reply exactly "I couldn't find this in the book." when the passages do not contain the answer.
    - id: unsupported
      label: A claim the evidence does not back
      kind: blocked
      path: [question, search, llm, verify, flag]
      outcome: The checker labels the sentence unsupported, so the reader sees a possible hallucination instead of a confident answer.
charts:
  - type: bars
    title: Recall@5 by retriever
    takeaway: Hybrid finds the right chapter more often than either retriever alone.
    caption: 38 answerable questions. A hit is a passage from the right chapter, not the exact passage.
    unit: "%"
    max: 100
    receipt: { repo: bookmind, path: README.md, find: "| All 38: Recall@5 | 92% | 89% | **95%** |" }
    bars:
      - { label: BM25, value: 92, tone: muted }
      - { label: Embeddings, value: 89, tone: muted }
      - { label: Hybrid, value: 95, tone: accent }
  - type: grouped
    title: MRR by question slice
    takeaway: Hybrid is best or joint best on every slice, but the gain over BM25 is not proven.
    caption: The MRR difference over BM25 is +0.093 with a 95% interval of -0.03 to +0.22, which includes zero.
    max: 1
    decimals: 3
    series:
      - { name: BM25, tone: muted }
      - { name: Embeddings, tone: warn }
      - { name: Hybrid, tone: accent }
    groups:
      - { label: "All 38", values: [0.703, 0.763, 0.796] }
      - { label: "Everyday wording (19)", values: [0.629, 0.719, 0.763] }
      - { label: "The book's own terms (7)", values: [0.929, 0.857, 1.0] }
    receipt: { repo: bookmind, path: README.md, find: ["| Everyday wording (19): MRR | 0.629 | 0.719 | **0.763** |", "| The book's own terms (7): MRR | 0.929 | 0.857 | **1.000** |"] }
  - type: stack
    title: What the sentence checker said
    takeaway: No unsupported sentence got a green check.
    caption: Thresholds were set on 8 real qwen2.5:7b answers labelled by hand. The calibration set is small and from one model.
    receipt: { repo: bookmind, path: README.md, find: ["Real sentences judged supported (17) | 13 | 4 | 0", "Invented claims (8) | 0 | 2 | 6"] }
    rows:
      - label: Real sentences, supported
        total: 17 sentences
        segments:
          - { label: Supported, value: 13, tone: pass }
          - { label: Weak, value: 4, tone: warn }
          - { label: Unsupported, value: 0, tone: fail }
      - label: Real sentences, weak
        total: 4 sentences
        segments:
          - { label: Supported, value: 0, tone: pass }
          - { label: Weak, value: 4, tone: warn }
          - { label: Unsupported, value: 0, tone: fail }
      - label: Checked against the wrong passages
        total: 21 sentences
        segments:
          - { label: Supported, value: 0, tone: pass }
          - { label: Weak, value: 9, tone: warn }
          - { label: Unsupported, value: 12, tone: fail }
      - label: Invented claims
        total: 8 sentences
        segments:
          - { label: Supported, value: 0, tone: pass }
          - { label: Weak, value: 2, tone: warn }
          - { label: Unsupported, value: 6, tone: fail }
---

## The problem

Asking a chatbot about a book gives you fluent answers you cannot trust. I wanted answers grounded in cited passages, and a way to measure how often the system makes things up.

## What I built

Retrieval first, from scratch. An EPUB becomes 326 citeable chunks, BM25 is written by hand, embeddings come from Ollama, and the two rankings are merged by a fusion step that fits in ten lines. On top of that sit answers that cite chapters, a checker that matches each answer sentence to its evidence and labels it supported, weak or unsupported, and a quiz mode that writes study questions from a chapter's own sentences. It runs on a free local model or on Claude.

## How I tested it

A test set of 42 questions: 38 that the book answers, each labelled with the chapter that answers it, and 4 off-topic ones the system must refuse. I wrote 26 of the questions after the first version and committed them before measuring the new retrievers, so they could not be tuned to the new code.

## What I would do next

Grow the set past 100 questions with passage-level labels, so the hybrid gain can be confirmed or ruled out. Then run the answer-quality metrics (citation accuracy, refusal correctness, hallucination against a closed-book baseline) that the README still marks as needing a model run.
