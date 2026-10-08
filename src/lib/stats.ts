import type { ProjectEntry } from './schema.ts';
import { allReceipts, findRepo } from './receipts.ts';
import { suiteTally } from './verdict.ts';

/** Headline numbers for the whole site, computed from the project files so they cannot drift. */
export function suiteStats(flagship: ProjectEntry[]) {
  const t = suiteTally(flagship);
  const failures = flagship.reduce((n, e) => n + e.data.failures.length, 0);
  const charts = flagship.reduce((n, e) => n + e.data.charts.length, 0);
  const receipts = flagship.reduce(
    (n, e) => n + allReceipts(e.data).filter((r) => findRepo(e.data, r.receipt.repo)?.visibility === 'public').length,
    0,
  );
  const pinnedFiles = new Set(
    flagship.flatMap((e) =>
      allReceipts(e.data).map((r) => {
        const repo = findRepo(e.data, r.receipt.repo);
        return `${repo?.name}@${repo?.ref}:${r.receipt.path}`;
      }),
    ),
  ).size;
  return { projects: flagship.length, ...t, failures, charts, receipts, pinnedFiles };
}
