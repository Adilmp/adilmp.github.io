import { getCollection } from 'astro:content';
import type { ProjectEntry } from './schema.ts';

export async function getProjects(): Promise<ProjectEntry[]> {
  const all = await getCollection('projects');
  return all.map((e) => ({ id: e.id, data: e.data, body: e.body ?? '' })).sort((a, b) => a.data.order - b.data.order);
}

export const flagshipOf = (entries: ProjectEntry[]): ProjectEntry[] => entries.filter((e) => e.data.tier === 'flagship');
export const archiveOf = (entries: ProjectEntry[]): ProjectEntry[] => entries.filter((e) => e.data.tier === 'archive');
