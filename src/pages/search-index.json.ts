import type { APIRoute } from 'astro';
import evalData from '../data/search-eval.json';
import { aboutPassages } from '../lib/about.ts';
import { buildCorpus } from '../lib/corpus.ts';
import { getProjects } from '../lib/projects.ts';

export const GET: APIRoute = async () => {
  const passages = buildCorpus(await getProjects(), aboutPassages);
  return new Response(JSON.stringify({ params: evalData.params, passages }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
