// "Ask my work": BM25 over the site's own passages, running in the browser.
// No model, no network call except loading the passage index once. Shows scores and refuses
// when the evidence is thin, using the bar that scripts/eval-search.ts tuned.
import { Bm25, decide, stem, tokenize, type RefusalParams } from '../lib/bm25.ts';
import { indexText } from '../lib/corpus.ts';

interface Passage {
  id: string;
  project: string;
  projectTitle: string;
  section: string;
  title: string;
  text: string;
  href: string;
}

const root = document.querySelector<HTMLElement>('[data-ask]');

if (root) {
  const form = root.querySelector<HTMLFormElement>('form')!;
  const input = root.querySelector<HTMLInputElement>('input')!;
  const out = root.querySelector<HTMLElement>('[data-out]')!;
  const base = root.dataset.base ?? '';
  let index: Bm25 | null = null;
  let params: RefusalParams;
  const byId = new Map<string, Passage>();

  const load = async () => {
    if (index) return;
    const res = await fetch(root.dataset.indexUrl!);
    if (!res.ok) throw new Error(`index ${res.status}`);
    const data = (await res.json()) as { params: RefusalParams; passages: Passage[] };
    params = data.params;
    data.passages.forEach((p) => byId.set(p.id, p));
    index = new Bm25(data.passages.map((p) => ({ id: p.id, text: indexText(p) })));
  };

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  /** Excerpt with the query's matching words wrapped in <mark>, built with DOM nodes (no innerHTML). */
  const excerpt = (text: string, matched: Set<string>) => {
    const p = el('p');
    const cut = text.length > 380 ? text.slice(0, 380).replace(/\s+\S*$/, '') + '…' : text;
    for (const part of cut.split(/([A-Za-z0-9]+)/)) {
      const word = part.toLowerCase();
      const hit = /^[a-z0-9]+$/.test(word) && tokenize(word).length > 0 && matched.has(stem(word));
      if (hit) p.append(el('mark', undefined, part));
      else p.append(part);
    }
    return p;
  };

  const render = (q: string) => {
    const hits = index!.search(q, 5);
    const d = decide(q, hits, params);
    const top = hits[0];
    out.replaceChildren();

    const verdict = el('div', 'verdict-line');
    const badge = el('span', `badge ${d.refused ? 's-fail' : 's-pass'}`, d.refused ? '✗ REFUSED' : '✓ ANSWERED');
    verdict.append(badge);
    verdict.append(el('span', undefined, d.reason));
    if (top && !d.refused) {
      verdict.append(el('span', undefined, `top score ${top.score.toFixed(2)} · top 3 cover ${(top.groupCoverage * 100).toFixed(0)}% of the question's terms`));
    }
    out.append(verdict);

    if (d.refused) {
      const box = el('div', 'refused');
      box.append(el('b', undefined, "That is not something this portfolio answers."));
      box.append(
        el('p', undefined, 'I only answer from what is written on this site, and a weak match is worse than no answer. Try asking about a project, a number in a chart, or something that broke.'),
      );
      out.append(box);
      return;
    }

    hits.slice(0, 3).forEach((h, i) => {
      const p = byId.get(h.id);
      if (!p) return;
      const card = el('article', 'hit');
      const head = el('div', 'hit-head');
      head.append(el('span', undefined, `#${i + 1}`));
      const link = el('a', undefined, p.projectTitle);
      link.href = base + p.href;
      head.append(link);
      head.append(el('span', undefined, `${p.section} · score ${h.score.toFixed(2)}`));
      card.append(head);
      card.append(el('h4', undefined, p.title));
      card.append(excerpt(p.text, new Set(h.matched)));
      out.append(card);
    });
  };

  const ask = async (q: string) => {
    q = q.trim();
    if (!q) return;
    out.replaceChildren(el('p', 'ask-empty', 'Searching…'));
    try {
      await load();
      render(q);
    } catch {
      out.replaceChildren(el('p', 'ask-empty', 'The passage index could not be loaded. Reload the page and try again.'));
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void ask(input.value);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-q]').forEach((b) =>
    b.addEventListener('click', () => {
      input.value = b.dataset.q ?? '';
      void ask(input.value);
    }),
  );
  // Warm the index when the visitor shows interest, so the first answer is instant.
  input.addEventListener('focus', () => void load().catch(() => {}), { once: true });
}
