// All internal links go through here so the site works at "/" (user.github.io) and at "/repo/".
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const url = (path = '/'): string => base + (path.startsWith('/') ? path : `/${path}`);

export const abs = (path: string): string => new URL(url(path), import.meta.env.SITE ?? 'https://adilmp.github.io').href;
