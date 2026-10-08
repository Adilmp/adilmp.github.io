import { describe, expect, it } from 'vitest';
import { chartTable, renderChart, renderMini } from '../src/lib/charts.ts';
import { loadProjects } from '../src/lib/load-projects.ts';
import type { Chart } from '../src/lib/schema.ts';

const receipt = { repo: 'r', path: 'README.md' };
const common = { takeaway: 't', title: 'T', receipt };
const count = (svg: string, re: RegExp) => (svg.match(re) ?? []).length;

describe('renderChart', () => {
  it('draws one bar per datum and labels the values', () => {
    const c: Chart = { ...common, type: 'bars', unit: '%', max: 100, orientation: 'v', showValues: true, marks: [], bars: [{ label: 'A', value: 92 }, { label: 'B', value: 25 }] };
    const svg = renderChart(c);
    expect(count(svg, /class="ch-bar /g)).toBe(2);
    expect(svg).toContain('92%');
    expect(svg).toContain('25%');
  });
  it('scales bars to the data: a bar twice as big is twice as tall', () => {
    const c: Chart = { ...common, type: 'bars', unit: '', max: 100, orientation: 'v', showValues: true, marks: [], bars: [{ label: 'A', value: 20 }, { label: 'B', value: 40 }] };
    const heights = [...renderChart(c).matchAll(/class="ch-bar t-accent"[^>]*height="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(heights[1]! / heights[0]!).toBeCloseTo(2, 1);
  });
  it('gives small-valued axes enough decimals to stay distinct', () => {
    const c: Chart = { ...common, type: 'bars', unit: '', max: 0.6, orientation: 'v', showValues: true, marks: [], bars: [{ label: 'A', value: 0.4 }] };
    const ticks = [...renderChart(c).matchAll(/<tspan[^>]*>(\d\.\d\d)<\/tspan>/g)].map((m) => m[1]);
    expect(new Set(ticks).size).toBe(5);
  });
  it('escapes text so a label cannot inject markup', () => {
    const c: Chart = { ...common, type: 'bars', unit: '', orientation: 'h', showValues: true, marks: [], bars: [{ label: '<img src=x onerror=alert(1)>', value: 1 }] };
    const svg = renderChart(c);
    expect(svg).not.toContain('<img');
    expect(svg).toContain('&lt;img');
  });
  it('skips zero-width stack segments but keeps them in the data table', () => {
    const c: Chart = {
      ...common,
      type: 'stack',
      normalize: false,
      unit: '',
      rows: [{ label: 'row', segments: [{ label: 'Yes', value: 3, tone: 'pass' }, { label: 'No', value: 0, tone: 'fail' }] }],
    };
    // Only the non-zero segment is drawn as a bar; the zero segment survives in the table and legend.
    expect(count(renderChart(c), /<g class="bar">/g)).toBe(1);
    expect(chartTable(c).head).toEqual(['Row', 'Yes', 'No']);
  });
  it('draws the calibration gap and the diagonal for a reliability chart', () => {
    const c: Chart = {
      ...common,
      type: 'reliability',
      xLabel: 'x',
      yLabel: 'y',
      points: [{ x: 0.1, y: 0, n: 10 }, { x: 0.5, y: 0.1, n: 10 }, { x: 0.9, y: 0.3, n: 10 }],
    };
    const svg = renderChart(c);
    expect(svg).toContain('class="ch-diag"');
    expect(svg).toContain('class="ch-gap"');
    expect(count(svg, /class="ch-dot"/g)).toBe(3);
  });
  it('uses a wider canvas for wide charts', () => {
    const c: Chart = { ...common, type: 'bars', unit: '', orientation: 'v', showValues: true, marks: [], bars: [{ label: 'A', value: 1 }] };
    expect(renderChart(c)).toContain('viewBox="0 0 720');
    expect(renderChart(c, true)).toContain('viewBox="0 0 1120');
  });
});

describe('chartTable', () => {
  it('exposes grouped data with its series names', () => {
    const c: Chart = {
      ...common,
      type: 'grouped',
      unit: '%',
      decimals: 0,
      series: [{ name: 'EN', tone: 'accent' }, { name: 'AR', tone: 'warn' }],
      groups: [{ label: '7b', values: [75, 83] }],
    };
    expect(chartTable(c)).toEqual({ head: ['Group', 'EN', 'AR'], rows: [['7b', '75%', '83%']] });
  });
});

describe('renderMini (the picture on a project card)', () => {
  it('draws one bar per datum for a bar chart, with the same values as the full chart', () => {
    const c: Chart = { ...common, type: 'bars', unit: '%', max: 100, orientation: 'v', showValues: true, marks: [], bars: [{ label: 'A', value: 92 }, { label: 'B', value: 25 }] };
    const svg = renderMini(c);
    expect(count(svg, /<g class="bar">/g)).toBe(2);
    expect(svg).toContain('92%');
    expect(svg).toContain('25%');
  });
  it('renders every lead chart in the real project files without errors', () => {
    for (const e of loadProjects().filter((x) => x.data.tier === 'flagship')) {
      const lead = e.data.charts[0]!;
      const svg = renderMini(lead);
      expect(svg.startsWith('<svg'), e.id).toBe(true);
      expect(svg.includes('NaN'), `${e.id} has NaN in its mini chart`).toBe(false);
      expect(svg.includes('undefined'), `${e.id} has undefined in its mini chart`).toBe(false);
    }
  });
  it('keeps the calibration picture honest: curve, diagonal and gap', () => {
    const c: Chart = { ...common, type: 'reliability', xLabel: 'x', yLabel: 'y', points: [{ x: 0.1, y: 0, n: 10 }, { x: 0.5, y: 0.1, n: 10 }, { x: 0.9, y: 0.3, n: 10 }] };
    const svg = renderMini(c);
    expect(svg).toContain('ch-diag');
    expect(svg).toContain('ch-gap');
    expect(count(svg, /class="ch-dot"/g)).toBe(3);
  });
});
