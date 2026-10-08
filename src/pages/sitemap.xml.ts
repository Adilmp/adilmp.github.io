import type { APIRoute } from 'astro';
import { abs } from '../lib/url.ts';
import { flagshipOf, getProjects } from '../lib/projects.ts';

export const GET: APIRoute = async () => {
  const pages = ['/', ...flagshipOf(await getProjects()).map((e) => `/projects/${e.id}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((p) => `  <url><loc>${abs(p)}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
