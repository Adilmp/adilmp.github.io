import type { APIRoute, GetStaticPaths } from 'astro';
import { site } from '../../data/site.ts';
import { renderOg } from '../../lib/og.ts';
import { flagshipOf, getProjects } from '../../lib/projects.ts';

export const getStaticPaths: GetStaticPaths = async () => {
  const flagship = flagshipOf(await getProjects());
  const statuses = flagship.flatMap((e) => e.data.assertions.map((a) => a.status));
  const results = site.heroResults.flatMap((r) => {
    const tile = flagship.find((e) => e.id === r.project)?.data.headline[r.tile];
    return tile ? [{ value: tile.value, label: tile.label }] : [];
  });
  return [
    {
      params: { slug: 'home' },
      props: {
        input: {
          title: 'Adil Pervez',
          subtitle: site.pitch,
          eyebrow: `${site.role} · Karachi`,
          statuses,
          results,
        },
      },
    },
    ...flagship.map((e) => ({
      params: { slug: e.id },
      props: {
        input: {
          title: e.data.title,
          subtitle: e.data.tagline,
          eyebrow: 'Project',
          statuses: e.data.assertions.map((a) => a.status),
          results: e.data.headline.slice(0, 4).map((h) => ({ value: h.value, label: h.label })),
        },
      },
    })),
  ];
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props.input);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
};
