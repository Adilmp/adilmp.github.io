// `npm run drift`: which repos have moved on since their receipts were pinned?
// Informational: a repo ahead of its pin does not break anything, because receipts link to the
// pinned commit. It tells you when the numbers on the site may be older than the repo's own.
import { loadProjects } from '../src/lib/load-projects.ts';

const token = process.env.GITHUB_TOKEN;
const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-drift' };
if (token) headers.Authorization = `Bearer ${token}`;

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com/${path}`, { headers });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return (await res.json()) as T;
}

const rows: string[] = [];
let drifted = 0;
for (const { id, data } of loadProjects()) {
  for (const r of data.repos) {
    if (!r.ref || r.visibility === 'private') continue;
    try {
      const meta = await api<{ default_branch: string }>(`repos/${r.owner}/${r.name}`);
      const cmp = await api<{ ahead_by: number; status: string }>(`repos/${r.owner}/${r.name}/compare/${r.ref}...${meta.default_branch}`);
      if (cmp.ahead_by > 0) drifted += 1;
      rows.push(`${cmp.ahead_by > 0 ? '↑' : '='} ${`${r.owner}/${r.name}`.padEnd(52)} ${id.padEnd(26)} pinned ${r.ref.slice(0, 7)}  ${cmp.ahead_by > 0 ? `${cmp.ahead_by} commit${cmp.ahead_by === 1 ? '' : 's'} ahead` : 'up to date'}`);
    } catch (e) {
      rows.push(`? ${r.owner}/${r.name}: ${(e as Error).message}`);
    }
  }
}
console.log(rows.join('\n'));
console.log(drifted ? `\n${drifted} repo(s) moved on. To refresh: update the \`ref\`, run \`npm run check\`, update any number it reports.` : '\nEvery pinned repo is up to date.');
