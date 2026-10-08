import { describe, expect, it } from 'vitest';
import { NH, NW, diagramProblems, layout, traceSteps } from '../src/lib/diagram.ts';
import type { Diagram } from '../src/lib/schema.ts';

const receipt = { repo: 'r', path: 'README.md' };
const base = (): Diagram => ({
  caption: 'c',
  receipt,
  nodes: [
    { id: 'a', label: 'A', col: 0, row: 0, kind: 'input' },
    { id: 'b', label: 'B', col: 1, row: 0, kind: 'process' },
    { id: 'c', label: 'C', col: 2, row: 0, kind: 'output' },
    { id: 'x', label: 'X', col: 1, row: 1, kind: 'blocked' },
  ],
  edges: [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'b', to: 'x' },
  ],
  traces: [
    { id: 'ok', label: 'ok', kind: 'ok', path: ['a', 'b', 'c'], outcome: 'o' },
    { id: 'no', label: 'no', kind: 'blocked', path: ['a', 'b', 'x'], outcome: 'o' },
  ],
});

describe('diagramProblems', () => {
  it('accepts an honest diagram', () => {
    expect(diagramProblems(base())).toEqual([]);
  });
  it('rejects a trace that follows an edge that does not exist', () => {
    const d = base();
    d.traces[0]!.path = ['a', 'c'];
    expect(diagramProblems(d).join('\n')).toMatch(/a→c, but that edge does not exist/);
  });
  it('rejects a trace through an unknown node', () => {
    const d = base();
    d.traces[0]!.path = ['a', 'zzz'];
    expect(diagramProblems(d).join('\n')).toMatch(/unknown node "zzz"/);
  });
  it('rejects a blocked trace that ends somewhere that is not blocked', () => {
    const d = base();
    d.traces[1]!.path = ['a', 'b', 'c'];
    expect(diagramProblems(d).join('\n')).toMatch(/not a blocked node/);
  });
  it('rejects an ok trace that ends on a blocked node', () => {
    const d = base();
    d.traces[0]!.path = ['a', 'b', 'x'];
    expect(diagramProblems(d).join('\n')).toMatch(/ends at a blocked node/);
  });
  it('rejects an edge drawn straight through another box', () => {
    const d = base();
    d.edges.push({ from: 'a', to: 'c' });
    expect(diagramProblems(d).join('\n')).toMatch(/drawn through "b"/);
  });
  it('rejects two nodes in one grid cell and duplicate ids', () => {
    const d = base();
    d.nodes.push({ id: 'a', label: 'dup', col: 0, row: 0, kind: 'process' });
    const msg = diagramProblems(d).join('\n');
    expect(msg).toMatch(/duplicate node id "a"/);
    expect(msg).toMatch(/share grid cell/);
  });
  it('rejects text that cannot fit its box', () => {
    const d = base();
    d.nodes[0]!.label = 'A label that is far too long';
    d.nodes[1]!.sub = 'A subtitle that is much too long to fit';
    const msg = diagramProblems(d).join('\n');
    expect(msg).toMatch(/label .* too long/);
    expect(msg).toMatch(/subtitle .* too long/);
  });
});

describe('layout', () => {
  it('places nodes on a grid and routes every edge', () => {
    const L = layout(base());
    expect(L.nodes).toHaveLength(4);
    expect(L.edges).toHaveLength(3);
    const a = L.byId.get('a')!;
    const b = L.byId.get('b')!;
    expect(b.x).toBeGreaterThan(a.x + NW);
    expect(L.byId.get('x')!.y).toBeGreaterThan(a.y + NH);
    for (const e of L.edges) expect(e.d).toMatch(/^M[\d.-]+,[\d.-]+ [LC]/);
  });
  it('gives the same edge keys the trace player looks up', () => {
    const d = base();
    const keys = traceSteps(d.traces[0]!).flatMap((s) => (s.edgeKey ? [s.edgeKey] : []));
    expect(keys).toEqual(['a>b', 'b>c']);
  });
});
