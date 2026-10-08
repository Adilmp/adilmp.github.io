// Social share cards (1200x630), drawn at build time in the same comic style as the site.
// Each card shows its real results, so a link pasted into LinkedIn previews the work itself.
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import type { Status } from './schema.ts';

const font = (pkg: string, file: string): ArrayBuffer => {
  const buf = readFileSync(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
};

let fonts: Parameters<typeof satori>[1]['fonts'] | null = null;
const loadFonts = () =>
  (fonts ??= [
    { name: 'Bangers', data: font('bangers', 'bangers-latin-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'Oswald', data: font('oswald', 'oswald-latin-600-normal.woff'), weight: 600, style: 'normal' },
    { name: 'Barlow', data: font('barlow', 'barlow-latin-500-normal.woff'), weight: 500, style: 'normal' },
    { name: 'Barlow', data: font('barlow', 'barlow-latin-700-normal.woff'), weight: 700, style: 'normal' },
  ]);

const C = {
  ink: '#15110c',
  paper: '#e8dcc0',
  card: '#f7f0de',
  light: '#fffaf0',
  accent: '#0f766e',
  pink: '#be185d',
  green: '#15803d',
  red: '#b91c1c',
  blue: '#1d4ed8',
  purple: '#6d28d9',
  amber: '#b45309',
};

type El = { type: string; props: { style?: Record<string, unknown>; children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown): El => ({ type, props: { style, children } });

/** A comic outline made from offset shadows (reliable in satori), plus the hard drop shadow. */
const outline = (w: number, shadow = 6): string => {
  const o = [`${w}px 0`, `-${w}px 0`, `0 ${w}px`, `0 -${w}px`, `${w}px ${w}px`, `-${w}px ${w}px`, `${w}px -${w}px`, `-${w}px -${w}px`];
  return [...o.map((s) => `${s} 0 ${C.ink}`), `${shadow + w}px ${shadow + w}px 0 ${C.ink}`].join(', ');
};

export interface OgInput {
  title: string;
  subtitle: string;
  eyebrow: string;
  statuses: Status[];
  /** Big numbers to show on the right; for the home card these are the four hero results. */
  results?: { value: string; label: string }[];
}

const BURSTS = [C.pink, C.blue, C.green, C.purple];

export async function renderOg(input: OgInput): Promise<Buffer> {
  const t = { pass: 0, fail: 0, inconclusive: 0 };
  input.statuses.forEach((s) => (t[s] += 1));
  const n = input.title.length;
  const titleSize = n <= 12 ? 128 : n <= 20 ? 96 : 80;

  const squares = input.statuses.map((s) =>
    h('div', {
      width: 16,
      height: 16,
      marginRight: 5,
      marginBottom: 5,
      border: `3px ${s === 'inconclusive' ? 'dashed' : 'solid'} ${C.ink}`,
      borderRadius: 4,
      background: s === 'pass' ? C.green : s === 'fail' ? C.red : C.card,
    }),
  );

  const sticker = (n: number, label: string, bg: string) =>
    h('div', { display: 'flex', alignItems: 'center', marginRight: 14, padding: '2px 12px', background: bg, border: `3px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, color: C.light }, [
      h('div', { fontFamily: 'Bangers', fontSize: 32, marginRight: 8, lineHeight: 1 }, String(n)),
      h('div', { fontFamily: 'Oswald', fontWeight: 600, fontSize: 17, letterSpacing: 2, textTransform: 'uppercase' }, label),
    ]);

  const resultBoxes = (input.results ?? []).slice(0, 4).map((r, i) =>
    h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 225, marginBottom: 16 }, [
      h(
        'div',
        { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 172, height: 100, background: BURSTS[i % 4], border: `5px solid ${C.ink}`, borderRadius: 60, boxShadow: `6px 6px 0 ${C.ink}`, fontFamily: 'Bangers', fontSize: r.value.length > 5 ? 46 : 56, color: C.light, textShadow: '2px 0 0 #15110c, -2px 0 0 #15110c, 0 2px 0 #15110c, 0 -2px 0 #15110c, 3px 3px 0 #15110c' },
        r.value,
      ),
      h('div', { marginTop: 12, padding: '2px 8px', background: C.card, border: `3px solid ${C.ink}`, fontFamily: 'Oswald', fontWeight: 600, fontSize: 16, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', color: C.ink, maxWidth: 215 }, r.label),
    ]),
  );
  const hasResults = resultBoxes.length > 0;

  const tree = h(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '36px 64px 30px',
      background: C.paper,
      backgroundImage: `radial-gradient(rgba(21,17,12,0.16) 2px, transparent 2.4px)`,
      backgroundSize: '18px 18px',
      color: C.ink,
      fontFamily: 'Barlow',
    },
    [
      h('div', { display: 'flex', alignItems: 'center' }, [
        h('div', { width: 54, height: 54, borderRadius: 27, background: C.accent, color: C.light, border: `4px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bangers', fontSize: 26 }, 'AP'),
        h('div', { marginLeft: 16, fontFamily: 'Bangers', fontSize: 38, letterSpacing: 2, textTransform: 'uppercase' }, 'Adil Pervez'),
        h('div', { marginLeft: 20, padding: '3px 12px', background: C.ink, color: C.paper, fontFamily: 'Oswald', fontWeight: 600, fontSize: 20, letterSpacing: 3, textTransform: 'uppercase' }, input.eyebrow),
      ]),
      h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
        h('div', { display: 'flex', flexDirection: 'column', width: hasResults ? 570 : 1070 }, [
          h(
            'div',
            { fontFamily: 'Bangers', fontSize: titleSize, lineHeight: 0.95, letterSpacing: 2, textTransform: 'uppercase', color: C.accent, textShadow: outline(4, 6) },
            input.title,
          ),
          h('div', { marginTop: 28, fontSize: 28, fontWeight: 700, lineHeight: 1.25, maxWidth: hasResults ? 540 : 960, padding: '12px 20px', background: C.card, border: `4px solid ${C.ink}`, borderRadius: 18, boxShadow: `5px 5px 0 ${C.ink}` }, input.subtitle),
        ]),
        hasResults ? h('div', { display: 'flex', flexWrap: 'wrap', width: 470, justifyContent: 'space-between' }, resultBoxes) : h('div', {}, ''),
      ]),
      h('div', { display: 'flex', flexDirection: 'column' }, [
        h('div', { display: 'flex', flexWrap: 'wrap', maxWidth: 1072 }, squares),
        h('div', { display: 'flex', marginTop: 10 }, [sticker(t.pass, 'pass', C.green), sticker(t.fail, 'fail', C.red), sticker(t.inconclusive, 'unclear', C.amber)]),
      ]),
    ],
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: loadFonts() });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}
