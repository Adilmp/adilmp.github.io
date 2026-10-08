// Turns project entries into the passages the "Ask my work" box searches.
// Shared by the Astro endpoint (/search-index.json) and the Node eval (scripts/eval-search.ts),
// so what is evaluated is exactly what ships.
import type { ProjectEntry } from './schema.ts';
import { STATUS_WORD } from './verdict.ts';

export interface Passage {
  id: string;
  /** Project slug, or "about". */
  project: string;
  projectTitle: string;
  section: string;
  title: string;
  text: string;
  /** Site-relative path with anchor, e.g. "/projects/bookmind#a-3". */
  href: string;
}

export interface AboutPassage {
  id: string;
  title?: string;
  text: string;
}

const plain = (s: string): string =>
  s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function splitBody(body: string): { heading: string; text: string }[] {
  const sections: { heading: string; text: string }[] = [];
  let heading = 'Overview';
  let buf: string[] = [];
  const flush = () => {
    const text = plain(buf.join(' '));
    if (text) sections.push({ heading, text });
    buf = [];
  };
  for (const line of body.split('\n')) {
    const m = /^##\s+(.*)$/.exec(line);
    if (m) {
      flush();
      heading = plain(m[1]!);
    } else buf.push(line);
  }
  flush();
  return sections;
}

/** The text a passage is indexed under: project name first, so "the SQL project" can find its passages. */
export const indexText = (p: Passage): string => `${p.projectTitle}. ${p.section}. ${p.title}. ${p.text}`;

export function buildCorpus(entries: ProjectEntry[], about: AboutPassage[]): Passage[] {
  const out: Passage[] = [];
  for (const { id, data: p, body } of entries) {
    const base = `/projects/${id}`;
    const put = (suffix: string, section: string, title: string, text: string, anchor: string) =>
      out.push({
        id: `${id}:${suffix}`,
        project: id,
        projectTitle: p.title,
        section,
        title,
        text: plain(text),
        href: `${base}#${anchor}`,
      });

    if (p.tier === 'archive') {
      // Archive entries have no case-study page; they live in the early-work strip on the home page.
      out.push({
        id: `${id}:summary`,
        project: id,
        projectTitle: p.title,
        section: 'Early work',
        title: p.title,
        text: plain(`${p.title}. ${p.archive?.kind ?? ''}. ${p.archive?.blurb ?? p.summary} Stack: ${p.stack.join(', ')}.`),
        href: '/#earlier',
      });
      continue;
    }

    put('summary', 'Summary', 'What it is', `${p.title}. ${p.tagline} ${p.summary} Stack: ${p.stack.join(', ')}.`, 'top');
    p.headline.forEach((h, i) => put(`h${i}`, 'Headline number', `${h.value} ${h.label}`, `${h.value} ${h.label}. ${h.note ?? ''}`, 'top'));
    p.assertions.forEach((a, i) =>
      put(
        `a${i}`,
        `Assertion (${STATUS_WORD[a.status]})`,
        a.claim,
        `${a.claim}. Result: ${a.actual}. ${a.expected ? `Expected: ${a.expected}. ` : ''}${a.note ?? ''} Status: ${a.status}${a.status === 'fail' ? ', a published weakness' : ''}.`,
        `a-${i + 1}`,
      ),
    );
    p.failures.forEach((f, i) =>
      put(`f${i}`, 'What broke', f.title, `${f.title}. How it surfaced: ${f.found} Fix: ${f.fix} Outcome: ${f.outcome}.`, `f-${i + 1}`),
    );
    p.decisions.forEach((d, i) => put(`d${i}`, 'Decision', d.title, `${d.title}. ${d.why}`, `d-${i + 1}`));
    splitBody(body).forEach((s, i) => put(`s${i}`, 'The story', s.heading, s.text, 'story'));
  }
  for (const a of about) {
    out.push({
      id: a.id,
      project: 'about',
      projectTitle: 'About Adil',
      section: 'About',
      title: a.title ?? 'About Adil',
      text: plain(a.text),
      href: '/#about',
    });
  }
  return out;
}
