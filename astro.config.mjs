import { defineConfig } from 'astro/config';

// GitHub Pages: a repo named `<user>.github.io` serves from "/", any other repo name
// serves from "/<repo>/". The deploy workflow sets SITE_BASE accordingly.
const base = process.env.SITE_BASE ?? '/';
const site = process.env.SITE_URL ?? 'https://adilmp.github.io';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
