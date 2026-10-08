import type { Project, Receipt, RepoRef } from './schema.ts';

export function findRepo(project: Project, name: string): RepoRef | undefined {
  return project.repos.find((r) => r.name === name);
}

/** Permalink to the file at the pinned commit (falls back to the default branch). */
export function receiptUrl(project: Project, r: Receipt): string {
  const repo = findRepo(project, r.repo);
  if (!repo) return '#';
  return `https://github.com/${repo.owner}/${repo.name}/blob/${repo.ref ?? 'main'}/${r.path}`;
}

export function rawUrl(repo: RepoRef, path: string): string {
  return `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${repo.ref ?? 'main'}/${path}`;
}

export const findList = (r: Receipt): string[] =>
  r.find === undefined ? [] : Array.isArray(r.find) ? r.find : [r.find];

export function repoUrl(repo: RepoRef): string {
  return `https://github.com/${repo.owner}/${repo.name}`;
}

export function shortRef(repo: RepoRef): string {
  return repo.ref ? repo.ref.slice(0, 7) : 'main';
}

/** Every receipt a project makes, flattened with a human label for error messages. */
export function allReceipts(p: Project): { where: string; receipt: Receipt }[] {
  const out: { where: string; receipt: Receipt }[] = [];
  p.headline.forEach((h, i) => out.push({ where: `headline[${i}] "${h.label}"`, receipt: h.receipt }));
  p.assertions.forEach((a, i) => out.push({ where: `assertions[${i}] "${a.claim}"`, receipt: a.receipt }));
  p.failures.forEach((f, i) => f.receipt && out.push({ where: `failures[${i}] "${f.title}"`, receipt: f.receipt }));
  p.charts.forEach((c, i) => out.push({ where: `charts[${i}] "${c.title}"`, receipt: c.receipt }));
  if (p.diagram) out.push({ where: 'diagram', receipt: p.diagram.receipt });
  return out;
}
