// BM25 written from scratch, the same way BookMind's retriever is: no search library,
// so every score on this site traces back to code you can read in one sitting.
// Runs unchanged in the browser (the "Ask my work" box) and in Node (the search eval).

const STOP = new Set(
  `a about above after again all also am an and any are as at be because been before being below
  between both but by can could did do does doing down during each few for from further had has have
  having he her here hers him his how i if in into is it its just me more most my no nor not now of
  off on once only or other our out over own same she should so some such than that the their them
  then there these they this those through to too under until up very was we were what when where
  which while who whom why will with would you your yours tell show give please
  go goes going went get got make made say said like want know experience experienced skill skills`
    .split(/\s+/)
    .filter(Boolean),
);

/** Light, deterministic stemmer: plural/-ing/-ed removal and a trailing-e fold. Not Porter. */
export function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.length > 4 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  if (w.length > 4 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  const folded = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  const raw = folded.match(/[a-z0-9]+/g) ?? [];
  return raw.filter((t) => !STOP.has(t)).map(stem);
}

/**
 * A tiny query-side thesaurus. People ask "what went wrong" and the passage says "broke", or ask
 * where I "studied" and the passage names a university. Expansions are scored at reduced weight
 * and never count toward coverage, so they cannot make an off-topic question look answerable.
 */
const SYNONYMS: Record<string, string[]> = {
  wrong: ['broke', 'fail', 'failure', 'problem'],
  broke: ['fail', 'failure', 'wrong'],
  broken: ['broke', 'fail', 'failure'],
  bug: ['broke', 'failure', 'problem'],
  mistake: ['broke', 'failure', 'wrong'],
  issue: ['problem', 'failure'],
  fail: ['failure', 'broke'],
  failed: ['failure', 'broke', 'fail'],
  accurate: ['accuracy'],
  accuracy: ['accurate'],
  study: ['education', 'university'],
  studied: ['education', 'university'],
  university: ['education', 'fast', 'nuces'],
  degree: ['education', 'university'],
  graduate: ['education', 'university'],
  based: ['location', 'karachi'],
  live: ['location', 'karachi'],
  located: ['location', 'karachi'],
};

/** "Who are you?" has no content words, so route it to the about passages instead of refusing. */
const ABOUT_INTENT = /\b(who are you|about (you|yourself)|introduce yourself|your background)\b/i;

export interface Doc {
  id: string;
  text: string;
}

export interface Hit {
  id: string;
  score: number;
  /** Distinct query terms (stemmed) that occur in this document. */
  matched: string[];
  /** IDF-weighted share of the query's known terms that occur in this document, 0..1. */
  coverage: number;
  /** Same measure, but over the union of the top 3 passages, since a question can span passages. */
  groupCoverage: number;
  /** Share of the query's terms that occur anywhere in the corpus, 0..1. Off-topic questions score low. */
  knownShare: number;
}

export class Bm25 {
  private readonly docs: Doc[];
  private readonly tf: Map<string, number>[];
  private readonly len: number[];
  private readonly df = new Map<string, number>();
  private readonly avgLen: number;
  private readonly k1: number;
  private readonly b: number;

  constructor(docs: Doc[], k1 = 1.5, b = 0.75) {
    this.docs = docs;
    this.k1 = k1;
    this.b = b;
    this.tf = [];
    this.len = [];
    for (const d of docs) {
      const toks = tokenize(d.text);
      const counts = new Map<string, number>();
      for (const t of toks) counts.set(t, (counts.get(t) ?? 0) + 1);
      this.tf.push(counts);
      this.len.push(toks.length);
      for (const t of counts.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
    }
    this.avgLen = this.len.reduce((a, b) => a + b, 0) / Math.max(1, docs.length);
  }

  private idf(term: string): number {
    const n = this.docs.length;
    const df = this.df.get(term) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  search(query: string, k = 5): Hit[] {
    if (ABOUT_INTENT.test(query)) query = `${query} Adil engineer education`;
    const terms = [...new Set(tokenize(query))];
    if (terms.length === 0) return [];
    const extra = [...new Set(terms.flatMap((t) => (SYNONYMS[t] ?? []).map(stem)))].filter((t) => !terms.includes(t));
    const known = terms.filter((t) => (this.df.get(t) ?? 0) > 0);
    const knownShare = known.length / terms.length;
    const knownIdf = known.reduce((a, t) => a + this.idf(t), 0);
    const hits: Hit[] = [];
    this.docs.forEach((doc, i) => {
      let score = 0;
      let matchedIdf = 0;
      const matched: string[] = [];
      const counts = this.tf[i]!;
      const norm = 1 - this.b + (this.b * this.len[i]!) / this.avgLen;
      const weigh = (term: string, weight: number) => {
        const f = counts.get(term);
        if (!f) return false;
        score += weight * this.idf(term) * ((f * (this.k1 + 1)) / (f + this.k1 * norm));
        return true;
      };
      for (const term of terms) {
        if (weigh(term, 1)) {
          matched.push(term);
          matchedIdf += this.idf(term);
        }
      }
      for (const term of extra) weigh(term, 0.5);
      if (score > 0) {
        hits.push({ id: doc.id, score, matched, coverage: knownIdf ? matchedIdf / knownIdf : 0, groupCoverage: 0, knownShare });
      }
    });
    // Ties break by id so results are deterministic.
    hits.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
    const top = hits.slice(0, k);
    const union = new Set(top.slice(0, 3).flatMap((h) => h.matched));
    const groupIdf = [...union].reduce((a, t) => a + this.idf(t), 0);
    const groupCoverage = knownIdf ? groupIdf / knownIdf : 0;
    for (const h of top) h.groupCoverage = groupCoverage;
    return top;
  }
}

export interface RefusalParams {
  /** Refuse when fewer than this share of the question's terms occur anywhere on the site. */
  minKnown: number;
  /** Refuse when the top 3 passages together hold less than this IDF-weighted share of the question's known terms. */
  minCoverage: number;
  /** Refuse when the best passage scores below this BM25 score. */
  minScore: number;
}

export interface Decision {
  refused: boolean;
  reason: string;
}

/**
 * Phrases that address an assistant rather than ask about the portfolio. There is no model behind
 * the box to instruct, so none of these can work, but saying so is clearer than returning a passage.
 */
const INSTRUCTION = [
  /\b(ignore|disregard|forget)\b.{0,40}\b(previous|prior|above|earlier|all)\b/i,
  /\b(system|hidden|secret) (prompt|instructions?)\b/i,
  /\b(reveal|print|show|repeat|leak)\b.{0,30}\b(prompt|instructions?|rules)\b/i,
  /\b(pretend|act as|roleplay|role-play|you are now|jailbreak)\b/i,
];
export const looksLikeInstruction = (q: string): boolean => INSTRUCTION.some((r) => r.test(q));

const pct = (n: number): string => `${(n * 100).toFixed(0)}%`;

/** The refusal rule: say "not in my portfolio" instead of returning the least-bad passage. */
export function decide(query: string, hits: Hit[], p: RefusalParams): Decision {
  if (looksLikeInstruction(query)) {
    return { refused: true, reason: 'that reads as an instruction, not a question, and there is no model behind this box to instruct' };
  }
  const top = hits[0];
  if (!top) return { refused: true, reason: 'no passage shares a single term with the question' };
  if (top.knownShare < p.minKnown) {
    return { refused: true, reason: `only ${pct(top.knownShare)} of the question's terms appear anywhere on this site (needs ${pct(p.minKnown)})` };
  }
  if (top.groupCoverage < p.minCoverage) {
    return { refused: true, reason: `the top passages cover ${pct(top.groupCoverage)} of the question's terms by weight (needs ${pct(p.minCoverage)})` };
  }
  if (top.score < p.minScore) {
    return { refused: true, reason: `the best score, ${top.score.toFixed(2)}, is below the ${p.minScore.toFixed(2)} bar` };
  }
  return { refused: false, reason: 'the top passages clear all three bars' };
}
