import type { Project, ProjectEntry, Status } from './schema.ts';

export interface Tally {
  pass: number;
  fail: number;
  inconclusive: number;
  total: number;
}

export function tally(statuses: Iterable<Status>): Tally {
  const t: Tally = { pass: 0, fail: 0, inconclusive: 0, total: 0 };
  for (const s of statuses) {
    t[s] += 1;
    t.total += 1;
  }
  return t;
}

export const projectTally = (p: Project): Tally => tally(p.assertions.map((a) => a.status));

export const suiteTally = (entries: ProjectEntry[]): Tally =>
  tally(entries.flatMap((e) => e.data.assertions.map((a) => a.status)));

export const STATUS_GLYPH: Record<Status, string> = { pass: '✓', fail: '✗', inconclusive: '◐' };
export const STATUS_WORD: Record<Status, string> = {
  pass: 'PASS',
  fail: 'FAIL',
  inconclusive: 'UNCLEAR',
};
