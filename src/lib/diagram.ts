// Grid-based architecture diagrams. Authors give each node a (col,row) cell; this module turns
// that into pixel boxes and routed edges, and refuses diagrams that lie (a trace that follows
// an edge that does not exist, an edge drawn through another box, a "blocked" trace that
// ends somewhere that is not blocked).
import type { Diagram, DiagramNode, DiagramTrace } from './schema.ts';

export const NW = 200;
export const NH = 64;
export const GX = 40;
export const GY = 46;
export const PAD = 20;

export interface LaidNode extends DiagramNode {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LaidEdge {
  from: string;
  to: string;
  label?: string;
  d: string;
  lx: number;
  ly: number;
  anchor: 'middle' | 'start';
}

export interface Laid {
  w: number;
  h: number;
  nodes: LaidNode[];
  edges: LaidEdge[];
  byId: Map<string, LaidNode>;
}

const f = (n: number) => Math.round(n * 10) / 10;

function route(a: LaidNode, b: LaidNode): Pick<LaidEdge, 'd' | 'lx' | 'ly' | 'anchor'> {
  const dc = b.col - a.col;
  const dr = b.row - a.row;
  if (dr === 0 && dc !== 0) {
    const x1 = dc > 0 ? a.x + a.w : a.x;
    const x2 = dc > 0 ? b.x : b.x + b.w;
    const y = a.y + a.h / 2;
    return { d: `M${f(x1)},${f(y)} L${f(x2)},${f(y)}`, lx: (x1 + x2) / 2, ly: y - 8, anchor: 'middle' };
  }
  if (dc === 0 && dr !== 0) {
    const x = a.x + a.w / 2;
    const y1 = dr > 0 ? a.y + a.h : a.y;
    const y2 = dr > 0 ? b.y : b.y + b.h;
    return { d: `M${f(x)},${f(y1)} L${f(x)},${f(y2)}`, lx: x + 8, ly: (y1 + y2) / 2 + 4, anchor: 'start' };
  }
  // Diagonal: leave horizontally, arrive horizontally (an S-curve through the column gap).
  const x1 = dc > 0 ? a.x + a.w : a.x;
  const x2 = dc > 0 ? b.x : b.x + b.w;
  const y1 = a.y + a.h / 2;
  const y2 = b.y + b.h / 2;
  const k = Math.max(24, Math.abs(x2 - x1) / 2);
  const c1x = dc > 0 ? x1 + k : x1 - k;
  const c2x = dc > 0 ? x2 - k : x2 + k;
  const mx = (x1 + 3 * c1x + 3 * c2x + x2) / 8;
  const my = (y1 + 3 * y1 + 3 * y2 + y2) / 8;
  return {
    d: `M${f(x1)},${f(y1)} C${f(c1x)},${f(y1)} ${f(c2x)},${f(y2)} ${f(x2)},${f(y2)}`,
    lx: mx,
    ly: my - 8,
    anchor: 'middle',
  };
}

export function layout(d: Diagram): Laid {
  const nodes: LaidNode[] = d.nodes.map((n) => ({
    ...n,
    x: PAD + n.col * (NW + GX),
    y: PAD + n.row * (NH + GY),
    w: NW,
    h: NH,
  }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: LaidEdge[] = [];
  for (const e of d.edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) continue;
    edges.push({ from: e.from, to: e.to, label: e.label, ...route(a, b) });
  }
  const cols = Math.max(...d.nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...d.nodes.map((n) => n.row)) + 1;
  return {
    w: PAD * 2 + cols * NW + (cols - 1) * GX,
    h: PAD * 2 + rows * NH + (rows - 1) * GY,
    nodes,
    edges,
    byId,
  };
}

/** Everything wrong with a diagram, as readable messages. Empty means it is honest and drawable. */
export function diagramProblems(d: Diagram): string[] {
  const out: string[] = [];
  const ids = new Set<string>();
  const cells = new Set<string>();
  for (const n of d.nodes) {
    if (ids.has(n.id)) out.push(`duplicate node id "${n.id}"`);
    ids.add(n.id);
    const cell = `${n.col},${n.row}`;
    if (cells.has(cell)) out.push(`two nodes share grid cell (${cell})`);
    cells.add(cell);
  }
  for (const n of d.nodes) {
    // Text is drawn at fixed sizes (14px uppercase label, 11.5px subtitle) inside a NW-wide box.
    if (n.label.length * 8 > NW - 28) out.push(`node "${n.id}": label "${n.label}" is too long to fit its box (max 21 characters)`);
    if (n.sub && n.sub.length * 5.7 > NW - 28) out.push(`node "${n.id}": subtitle "${n.sub}" is too long to fit its box (max 30 characters)`);
  }
  const byId = new Map(d.nodes.map((n) => [n.id, n]));
  const edgeKeys = new Set<string>();
  for (const e of d.edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a) out.push(`edge from unknown node "${e.from}"`);
    if (!b) out.push(`edge to unknown node "${e.to}"`);
    if (!a || !b) continue;
    edgeKeys.add(`${e.from}>${e.to}`);
    if (a.row === b.row) {
      const [lo, hi] = [Math.min(a.col, b.col), Math.max(a.col, b.col)];
      for (const n of d.nodes) if (n.row === a.row && n.col > lo && n.col < hi) out.push(`edge ${e.from}→${e.to} is drawn through "${n.id}"`);
    }
    if (a.col === b.col) {
      const [lo, hi] = [Math.min(a.row, b.row), Math.max(a.row, b.row)];
      for (const n of d.nodes) if (n.col === a.col && n.row > lo && n.row < hi) out.push(`edge ${e.from}→${e.to} is drawn through "${n.id}"`);
    }
  }
  const traceIds = new Set<string>();
  for (const t of d.traces) {
    if (traceIds.has(t.id)) out.push(`duplicate trace id "${t.id}"`);
    traceIds.add(t.id);
    t.path.forEach((id, i) => {
      if (!byId.has(id)) out.push(`trace "${t.id}" uses unknown node "${id}"`);
      const next = t.path[i + 1];
      if (next !== undefined && byId.has(id) && byId.has(next) && !edgeKeys.has(`${id}>${next}`)) {
        out.push(`trace "${t.id}" goes ${id}→${next}, but that edge does not exist`);
      }
    });
    const last = byId.get(t.path[t.path.length - 1]!);
    if (last) {
      if (t.kind === 'blocked' && last.kind !== 'blocked') out.push(`blocked trace "${t.id}" ends at "${last.id}", which is not a blocked node`);
      if (t.kind === 'ok' && last.kind === 'blocked') out.push(`ok trace "${t.id}" ends at a blocked node`);
    }
  }
  return out;
}

export interface TraceStep {
  nodeId: string;
  /** Edge taken to arrive at this node, as "from>to". Undefined for the first node. */
  edgeKey?: string;
}

export function traceSteps(t: DiagramTrace): TraceStep[] {
  return t.path.map((nodeId, i) => ({ nodeId, edgeKey: i === 0 ? undefined : `${t.path[i - 1]}>${nodeId}` }));
}
