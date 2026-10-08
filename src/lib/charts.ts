// Charts as plain SVG strings, rendered at build time. No chart library: every mark is a
// <rect>/<circle>/<path> whose size comes straight from the data in the project file, and
// every chart ships with its data table (see chartTable) so nothing is hidden behind a hover.
import type { Chart, Tone } from './schema.ts';

type Spec<T extends Chart['type']> = Extract<Chart, { type: T }>;

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n: number, d = 0): string => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const r1 = (n: number): number => Math.round(n * 10) / 10;

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  const m = v / exp;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return nice * exp;
}

/** Multi-line <text>; "\n" in the label starts a new line. */
function text(x: number, y: number, label: string, cls: string, anchor: 'start' | 'middle' | 'end' = 'start', lh = 14): string {
  const lines = label.split('\n');
  const tspans = lines
    .map((l, i) => `<tspan x="${r1(x)}" dy="${i === 0 ? 0 : lh}">${esc(l)}</tspan>`)
    .join('');
  return `<text class="${cls}" x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}">${tspans}</text>`;
}

const toneClass = (t: Tone | undefined): string => `t-${t ?? 'accent'}`;

function legend(items: { label: string; tone: Tone }[], x: number, y: number): string {
  let cx = x;
  return items
    .map((it) => {
      const w = 22 + it.label.length * 7.4 + 14;
      const g = `<g><rect class="ch-bar ${toneClass(it.tone)}" x="${r1(cx)}" y="${y - 9}" width="12" height="12" rx="2"/>${text(cx + 18, y + 1, it.label, 'ch-ax')}</g>`;
      cx += w;
      return g;
    })
    .join('');
}

/** Enough decimals that the axis ticks of a small-valued chart stay distinct. */
const axisDecimals = (max: number): number => (max <= 1 ? 2 : max < 10 ? 1 : 0);

function yAxis(L: number, T: number, iw: number, ih: number, max: number, unit: string): string {
  const decimals = axisDecimals(max);
  const out: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i;
    const y = T + ih - (v / max) * ih;
    out.push(`<line class="ch-grid" x1="${L}" x2="${L + iw}" y1="${r1(y)}" y2="${r1(y)}"/>`);
    out.push(text(L - 8, y + 4, `${fmt(v, decimals)}${unit}`, 'ch-ax', 'end'));
  }
  return out.join('');
}

function barsV(s: Spec<'bars'>, W: number): string {
  const hasMarks = s.marks.length > 0;
  const T = hasMarks ? 74 : 34;
  const L = 52;
  const R = 16;
  const B = 64;
  const H = 330;
  const iw = W - L - R;
  const ih = H - T - B;
  const max = s.max ?? niceMax(Math.max(...s.bars.map((b) => b.value)));
  const n = s.bars.length;
  const band = iw / n;
  const bw = Math.min(72, band * (n > 12 ? 0.7 : 0.6));
  const onlyTicks = s.bars.some((b) => b.tick !== undefined);
  const y = (v: number) => T + ih - (v / max) * ih;
  const parts: string[] = [yAxis(L, T, iw, ih, max, s.unit)];
  s.bars.forEach((b, i) => {
    const cx = L + band * i + band / 2;
    const top = y(b.value);
    const h = Math.max(1.5, T + ih - top);
    const shown = b.display ?? `${fmt(b.value, b.value % 1 ? 1 : 0)}${s.unit}`;
    parts.push(
      `<g class="bar"><title>${esc(b.label)}: ${esc(shown)}${b.sub ? ` (${esc(b.sub)})` : ''}</title><rect class="ch-bar ${toneClass(b.tone)}" x="${r1(cx - bw / 2)}" y="${r1(T + ih - h)}" width="${r1(bw)}" height="${r1(h)}" rx="${bw > 8 ? 3 : 1}"/></g>`,
    );
    if (s.showValues) parts.push(text(cx, top - 7, shown, 'ch-val', 'middle'));
    if (!onlyTicks || b.tick) {
      parts.push(text(cx, T + ih + 20, b.label, 'ch-ax', 'middle'));
      if (b.sub) parts.push(text(cx, T + ih + 36, b.sub, 'ch-sub', 'middle'));
    }
  });
  s.marks.forEach((m, k) => {
    const b = s.bars[m.index];
    if (!b) return;
    const cx = L + band * m.index + band / 2;
    const textY = 16 + (k % 3) * 18;
    const right = cx > W * 0.55;
    parts.push(`<line class="ch-leader" x1="${r1(cx)}" x2="${r1(cx)}" y1="${textY + 6}" y2="${r1(y(b.value) - 5)}"/>`);
    parts.push(text(right ? cx - 7 : cx + 7, textY + 4, m.text, 'ch-note', right ? 'end' : 'start'));
  });
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" style="min-width:${Math.round(W * 0.6)}px" xmlns="http://www.w3.org/2000/svg" role="img">${parts.join('')}</svg>`;
}

function barsH(s: Spec<'bars'>, W: number): string {
  const L = 236;
  const R = 96;
  const rowH = 40;
  const T = 8;
  const H = T + s.bars.length * rowH + 8;
  const iw = W - L - R;
  const max = s.max ?? Math.max(...s.bars.map((b) => b.value));
  const parts: string[] = [];
  s.bars.forEach((b, i) => {
    const cy = T + i * rowH + rowH / 2;
    const w = Math.max(2, (b.value / max) * iw);
    const shown = b.display ?? `${fmt(b.value, b.value % 1 ? 1 : 0)}${s.unit}`;
    parts.push(`<g class="bar"><title>${esc(b.label)}: ${esc(shown)}</title><rect class="ch-bar ${toneClass(b.tone)}" x="${L}" y="${r1(cy - 11)}" width="${r1(w)}" height="22" rx="3"/></g>`);
    parts.push(text(L - 12, cy + 4, b.label, 'ch-ax', 'end'));
    parts.push(text(L + w + 8, cy + 4, shown, 'ch-val'));
  });
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" style="min-width:${Math.round(W * 0.6)}px" xmlns="http://www.w3.org/2000/svg" role="img">${parts.join('')}</svg>`;
}

function grouped(s: Spec<'grouped'>, W: number): string {
  const L = 52;
  const R = 16;
  const T = 62;
  const B = 56;
  const H = 340;
  const iw = W - L - R;
  const ih = H - T - B;
  const all = s.groups.flatMap((g) => g.values);
  const max = s.max ?? niceMax(Math.max(...all));
  const G = s.groups.length;
  const S = s.series.length;
  const band = iw / G;
  const inner = Math.min(band * 0.78, S * 64);
  const bw = inner / S - 5;
  const y = (v: number) => T + ih - (v / max) * ih;
  const parts: string[] = [legend(s.series.map((x) => ({ label: x.name, tone: x.tone })), L, 20), yAxis(L, T, iw, ih, max, s.unit)];
  s.groups.forEach((g, gi) => {
    const x0 = L + band * gi + (band - inner) / 2;
    g.values.forEach((v, si) => {
      const x = x0 + si * (inner / S) + 2.5;
      const top = y(v);
      const shown = `${fmt(v, s.decimals)}${s.unit}`;
      parts.push(
        `<g class="bar"><title>${esc(g.label)} · ${esc(s.series[si]!.name)}: ${esc(shown)}</title><rect class="ch-bar ${toneClass(s.series[si]!.tone)}" x="${r1(x)}" y="${r1(top)}" width="${r1(bw)}" height="${r1(T + ih - top)}" rx="3"/></g>`,
      );
      parts.push(text(x + bw / 2, top - 7, shown, 'ch-val', 'middle'));
    });
    parts.push(text(L + band * gi + band / 2, T + ih + 22, g.label, 'ch-ax', 'middle'));
  });
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" style="min-width:${Math.round(W * 0.6)}px" xmlns="http://www.w3.org/2000/svg" role="img">${parts.join('')}</svg>`;
}

function reliability(s: Spec<'reliability'>): string {
  const W = 640;
  const H = 480;
  const L = 70;
  const T = 24;
  const S = 380;
  const x = (v: number) => L + v * S;
  const y = (v: number) => T + S - v * S;
  const parts: string[] = [];
  for (let i = 0; i <= 5; i++) {
    const v = i / 5;
    parts.push(`<line class="ch-grid" x1="${r1(x(v))}" x2="${r1(x(v))}" y1="${T}" y2="${T + S}"/>`);
    parts.push(`<line class="ch-grid" x1="${L}" x2="${L + S}" y1="${r1(y(v))}" y2="${r1(y(v))}"/>`);
    parts.push(text(x(v), T + S + 18, fmt(v, 1), 'ch-ax', 'middle'));
    parts.push(text(L - 10, y(v) + 4, fmt(v, 1), 'ch-ax', 'end'));
  }
  parts.push(`<line class="ch-diag" x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}"/>`);
  parts.push(text(x(0.5) + 10, y(0.5) - 12, 'perfectly calibrated', 'ch-note'));
  const pts = s.points;
  const area = [...pts.map((p) => `${r1(x(p.x))},${r1(y(p.y))}`), ...[...pts].reverse().map((p) => `${r1(x(p.x))},${r1(y(p.x))}`)].join(' ');
  parts.push(`<polygon class="ch-gap" points="${area}"/>`);
  parts.push(`<polyline class="ch-line" fill="none" points="${pts.map((p) => `${r1(x(p.x))},${r1(y(p.y))}`).join(' ')}"/>`);
  pts.forEach((p) => {
    const r = Math.min(12, 2.6 + Math.sqrt(p.n) * 0.34);
    parts.push(`<g class="bar"><title>said ${fmt(p.x, 2)}, actually ${fmt(p.y, 2)} (n=${fmt(p.n)})</title><circle class="ch-dot" cx="${r1(x(p.x))}" cy="${r1(y(p.y))}" r="${r1(r)}"/></g>`);
  });
  if (s.callout) {
    const p = pts[s.callout.index];
    if (p) {
      const tx = L + S + 18;
      const ty = Math.min(T + S - 50, y(p.y) - 30);
      parts.push(`<polyline class="ch-leader" fill="none" points="${r1(x(p.x) + 8)},${r1(y(p.y))} ${r1(tx - 6)},${r1(ty + 4)}"/>`);
      parts.push(text(tx, ty + 4, s.callout.text, 'ch-note', 'start', 15));
    }
  }
  parts.push(text(L + S / 2, H - 8, s.xLabel, 'ch-ax', 'middle'));
  parts.push(`<text class="ch-ax" transform="translate(16 ${T + S / 2}) rotate(-90)" text-anchor="middle">${esc(s.yLabel)}</text>`);
  return `<svg class="ch ch-square" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${parts.join('')}</svg>`;
}

function stack(s: Spec<'stack'>, W: number): string {
  const L = 224;
  const R = 84;
  const T = 44;
  const rowH = 58;
  const barH = 28;
  const H = T + s.rows.length * rowH + 8;
  const iw = W - L - R;
  const totals = s.rows.map((r) => r.segments.reduce((a, b) => a + b.value, 0));
  const maxTotal = Math.max(...totals);
  const seen = new Map<string, Tone>();
  s.rows.forEach((r) => r.segments.forEach((g) => seen.set(g.label, g.tone)));
  const parts: string[] = [legend([...seen].map(([label, tone]) => ({ label, tone })), L, 18)];
  s.rows.forEach((r, ri) => {
    const cy = T + ri * rowH + rowH / 2;
    const total = totals[ri]!;
    const scale = s.normalize ? iw / total : iw / maxTotal;
    let x = L;
    parts.push(text(L - 12, cy - (r.total ? 2 : -4), r.label, 'ch-ax', 'end'));
    if (r.total) parts.push(text(L - 12, cy + 14, r.total, 'ch-sub', 'end'));
    r.segments.forEach((g) => {
      if (g.value === 0) return; // a zero segment has no width; the legend and data table still list it
      const w = g.value * scale;
      const shown = s.normalize ? `${fmt(g.value, g.value % 1 ? 1 : 0)}%` : `${fmt(g.value)}${s.unit}`;
      parts.push(`<g class="bar"><title>${esc(r.label)} · ${esc(g.label)}: ${esc(shown)}</title><rect class="ch-bar ${toneClass(g.tone)}" x="${r1(x)}" y="${r1(cy - barH / 2)}" width="${r1(Math.max(1.5, w))}" height="${barH}" rx="2"/></g>`);
      if (w >= 52) parts.push(text(x + w / 2, cy + 4, shown, g.tone === 'muted' ? 'ch-inbar on-muted' : 'ch-inbar', 'middle'));
      x += w;
    });
    if (!s.normalize) parts.push(text(x + 8, cy + 4, fmt(total) + s.unit, 'ch-val'));
  });
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" style="min-width:${Math.round(W * 0.6)}px" xmlns="http://www.w3.org/2000/svg" role="img">${parts.join('')}</svg>`;
}


// ───────────────────────────── mini charts (project cards) ─────────────────────────────
// A small, quiet version of a project's lead chart: marks and just enough labels to read it.
// Same data as the full chart on the project page, no axes or grid.
const MW = 520;
const MH = 190;
const miniSvg = (parts: string[]): string =>
  `<svg class="ch ch-mini" viewBox="0 0 ${MW} ${MH}" xmlns="http://www.w3.org/2000/svg" role="img">${parts.join('')}</svg>`;

function miniBarsV(s: Spec<'bars'>): string {
  const padX = 14;
  const top = 26;
  const bottom = 34;
  const base = MH - bottom;
  const n = s.bars.length;
  const band = (MW - padX * 2) / n;
  const bw = Math.min(78, band * (n > 12 ? 0.72 : 0.6));
  const max = s.max ?? Math.max(...s.bars.map((b) => b.value));
  const parts: string[] = [`<line class="ch-base" x1="${padX}" x2="${MW - padX}" y1="${base}" y2="${base}"/>`];
  const onlyTicks = s.bars.some((b) => b.tick !== undefined);
  s.bars.forEach((b, i) => {
    const cx = padX + band * i + band / 2;
    const h = Math.max(2, (b.value / max) * (base - top));
    const shown = b.display ?? `${fmt(b.value, b.value % 1 ? 1 : 0)}${s.unit}`;
    parts.push(`<g class="bar"><title>${esc(b.label)}: ${esc(shown)}</title><rect class="ch-bar ${toneClass(b.tone)}" x="${r1(cx - bw / 2)}" y="${r1(base - h)}" width="${r1(bw)}" height="${r1(h)}" rx="${bw > 8 ? 3 : 1}"/></g>`);
    if (n <= 8 || b.tone === 'accent') parts.push(text(cx, base - h - 7, shown, 'ch-val', 'middle'));
    if (!onlyTicks ? n <= 8 : b.tick) parts.push(text(cx, base + 20, b.label, 'ch-ax', 'middle'));
  });
  return miniSvg(parts);
}

function miniBarsH(s: Spec<'bars'>): string {
  const rows = s.bars.slice(0, 5);
  const rowH = (MH - 16) / rows.length;
  const L = 170;
  const max = s.max ?? Math.max(...rows.map((b) => b.value));
  const parts: string[] = [];
  rows.forEach((b, i) => {
    const cy = 8 + rowH * i + rowH / 2;
    const w = Math.max(2, (b.value / max) * (MW - L - 70));
    const shown = b.display ?? `${fmt(b.value, b.value % 1 ? 1 : 0)}${s.unit}`;
    parts.push(`<g class="bar"><title>${esc(b.label)}: ${esc(shown)}</title><rect class="ch-bar ${toneClass(b.tone)}" x="${L}" y="${r1(cy - 10)}" width="${r1(w)}" height="20" rx="3"/></g>`);
    parts.push(text(L - 10, cy + 4, b.label, 'ch-ax', 'end'));
    parts.push(text(L + w + 8, cy + 4, shown, 'ch-val'));
  });
  return miniSvg(parts);
}

function miniGrouped(s: Spec<'grouped'>): string {
  const padX = 14;
  const top = 44;
  const bottom = 30;
  const base = MH - bottom;
  const G = s.groups.length;
  const S = s.series.length;
  const band = (MW - padX * 2) / G;
  const inner = Math.min(band * 0.8, S * 60);
  const bw = inner / S - 4;
  const max = s.max ?? Math.max(...s.groups.flatMap((g) => g.values));
  const parts: string[] = [legend(s.series.map((x) => ({ label: x.name, tone: x.tone })), padX, 14), `<line class="ch-base" x1="${padX}" x2="${MW - padX}" y1="${base}" y2="${base}"/>`];
  s.groups.forEach((g, gi) => {
    const x0 = padX + band * gi + (band - inner) / 2;
    g.values.forEach((v, si) => {
      const h = Math.max(2, (v / max) * (base - top));
      const x = x0 + si * (inner / S) + 2;
      parts.push(`<g class="bar"><title>${esc(g.label)} · ${esc(s.series[si]!.name)}: ${esc(fmt(v, s.decimals) + s.unit)}</title><rect class="ch-bar ${toneClass(s.series[si]!.tone)}" x="${r1(x)}" y="${r1(base - h)}" width="${r1(bw)}" height="${r1(h)}" rx="3"/></g>`);
      parts.push(text(x + bw / 2, base - h - 6, `${fmt(v, s.decimals)}${s.unit}`, 'ch-val', 'middle'));
    });
    parts.push(text(padX + band * gi + band / 2, base + 20, g.label, 'ch-ax', 'middle'));
  });
  return miniSvg(parts);
}

function miniStack(s: Spec<'stack'>): string {
  const rows = s.rows.slice(0, 3);
  const seen = new Map<string, Tone>();
  rows.forEach((r) => r.segments.forEach((g) => seen.set(g.label, g.tone)));
  const L = 150;
  const iw = MW - L - 16;
  const top = 38;
  const rowH = (MH - top - 6) / rows.length;
  const totals = rows.map((r) => r.segments.reduce((a, b) => a + b.value, 0));
  const maxTotal = Math.max(...totals);
  const parts: string[] = [legend([...seen].map(([label, tone]) => ({ label, tone })), 14, 14)];
  rows.forEach((r, i) => {
    const cy = top + rowH * i + rowH / 2;
    const scale = s.normalize ? iw / totals[i]! : iw / maxTotal;
    let x = L;
    parts.push(text(L - 10, cy + 4, r.label, 'ch-ax', 'end'));
    r.segments.forEach((g) => {
      if (g.value === 0) return;
      const w = g.value * scale;
      parts.push(`<g class="bar"><title>${esc(r.label)} · ${esc(g.label)}: ${esc(fmt(g.value, g.value % 1 ? 1 : 0))}</title><rect class="ch-bar ${toneClass(g.tone)}" x="${r1(x)}" y="${r1(cy - 13)}" width="${r1(Math.max(1.5, w))}" height="26" rx="2"/></g>`);
      x += w;
    });
  });
  return miniSvg(parts);
}

function miniReliability(s: Spec<'reliability'>): string {
  const S = 156;
  const x0 = 34;
  const y0 = 12;
  const x = (v: number) => x0 + v * S;
  const y = (v: number) => y0 + S - v * S;
  const pts = s.points;
  const area = [...pts.map((p) => `${r1(x(p.x))},${r1(y(p.y))}`), ...[...pts].reverse().map((p) => `${r1(x(p.x))},${r1(y(p.x))}`)].join(' ');
  const parts: string[] = [
    `<rect class="ch-frame" x="${x0}" y="${y0}" width="${S}" height="${S}"/>`,
    `<line class="ch-diag" x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}"/>`,
    `<polygon class="ch-gap" points="${area}"/>`,
    `<polyline class="ch-line" fill="none" points="${pts.map((p) => `${r1(x(p.x))},${r1(y(p.y))}`).join(' ')}"/>`,
    ...pts.map((p) => `<circle class="ch-dot" cx="${r1(x(p.x))}" cy="${r1(y(p.y))}" r="${r1(Math.min(7, 2.6 + Math.sqrt(p.n) * 0.17))}"/>`),
    text(x0 + S / 2, y0 + S + 16, 'what the model said', 'ch-ax', 'middle'),
    `<text class="ch-ax" transform="translate(14 ${y0 + S / 2}) rotate(-90)" text-anchor="middle">what happened</text>`,
    `<line class="ch-diag" x1="250" y1="60" x2="290" y2="60"/>`,
    text(300, 65, 'perfectly calibrated', 'ch-note'),
    `<line class="ch-line" x1="250" y1="104" x2="290" y2="104"/>`,
    text(300, 109, 'what I measured', 'ch-note'),
    `<rect class="ch-gap-key" x="250" y="132" width="40" height="14"/>`,
    text(300, 144, 'the gap', 'ch-note'),
  ];
  return miniSvg(parts);
}

export function renderMini(c: Chart): string {
  switch (c.type) {
    case 'bars':
      return c.orientation === 'h' ? miniBarsH(c) : miniBarsV(c);
    case 'grouped':
      return miniGrouped(c);
    case 'reliability':
      return miniReliability(c);
    case 'stack':
      return miniStack(c);
  }
}

/** `wide` charts get a wider canvas so their text stays the same on-screen size as in narrow cards. */
export function renderChart(c: Chart, wide = false): string {
  const W = wide ? 1120 : 720;
  switch (c.type) {
    case 'bars':
      return c.orientation === 'h' ? barsH(c, W) : barsV(c, W);
    case 'grouped':
      return grouped(c, W);
    case 'reliability':
      return reliability(c);
    case 'stack':
      return stack(c, W);
  }
}

/** The same data as a table, for the "View the data" disclosure and for screen readers. */
export function chartTable(c: Chart): { head: string[]; rows: string[][] } {
  switch (c.type) {
    case 'bars':
      return {
        head: ['Item', 'Value', 'Note'],
        rows: c.bars.map((b) => [b.label.replace(/\n/g, ' '), b.display ?? `${fmt(b.value, b.value % 1 ? 1 : 0)}${c.unit}`, b.sub ?? '']),
      };
    case 'grouped':
      return {
        head: ['Group', ...c.series.map((s) => s.name)],
        rows: c.groups.map((g) => [g.label, ...g.values.map((v) => `${fmt(v, c.decimals)}${c.unit}`)]),
      };
    case 'reliability':
      return {
        head: ['Stated confidence', 'Observed rate', 'Samples'],
        rows: c.points.map((p) => [fmt(p.x, 3), fmt(p.y, 3), fmt(p.n)]),
      };
    case 'stack':
      return {
        head: ['Row', ...[...new Set(c.rows.flatMap((r) => r.segments.map((s) => s.label)))]],
        rows: c.rows.map((r) => {
          const labels = [...new Set(c.rows.flatMap((x) => x.segments.map((s) => s.label)))];
          return [`${r.label}${r.total ? ` (${r.total})` : ''}`, ...labels.map((l) => {
            const seg = r.segments.find((s) => s.label === l);
            return seg ? `${fmt(seg.value, seg.value % 1 ? 1 : 0)}${c.normalize ? '%' : c.unit}` : '';
          })];
        }),
      };
  }
}
