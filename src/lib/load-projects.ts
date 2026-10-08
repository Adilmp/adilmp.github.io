// Node-side loader for the project files. Astro pages use the content collection instead,
// but scripts (check, eval-search, new-project) and tests need the same data without Astro.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { projectSchema, type ProjectEntry } from './schema.ts';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PROJECTS_DIR = join(ROOT, 'src', 'content', 'projects');

export function splitFrontmatter(raw: string): { front: unknown; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error('missing --- frontmatter ---');
  return { front: parse(m[1]!), body: m[2]! };
}

export function loadProjects(dir = PROJECTS_DIR): ProjectEntry[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const raw = readFileSync(join(dir, file), 'utf8');
      const { front, body } = splitFrontmatter(raw);
      const parsed = projectSchema.safeParse(front);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
        throw new Error(`${file} does not match the project schema:\n${issues}`);
      }
      return { id: file.replace(/\.md$/, ''), data: parsed.data, body };
    })
    .sort((a, b) => a.data.order - b.data.order);
}
