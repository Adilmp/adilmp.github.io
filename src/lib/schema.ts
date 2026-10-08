// The single source of truth for what a project entry may contain.
// Used by Astro (content collection), by `npm run check`, by the search corpus builder and
// by the `new-project` scaffolder. Plain zod, no Astro-only imports, so Node can run it too.
import { z } from 'astro/zod';

export const STATUSES = ['pass', 'fail', 'inconclusive'] as const;
export type Status = (typeof STATUSES)[number];

/**
 * A receipt points at the file a number came from. `find` strings must appear verbatim in
 * that file at the repo's pinned commit; `npm run check` fetches the file and verifies it.
 */
export const receipt = z.object({
  repo: z.string(),
  path: z.string(),
  find: z.union([z.string(), z.array(z.string())]).optional(),
});
export type Receipt = z.infer<typeof receipt>;

export const repoRef = z.object({
  name: z.string(),
  owner: z.string().default('Adilmp'),
  /** Full commit SHA the receipts are pinned to. Required for public flagship repos. */
  ref: z.string().regex(/^[0-9a-f]{40}$/, 'ref must be a full 40-character commit SHA').optional(),
  role: z.string().optional(),
  visibility: z.enum(['public', 'private']).default('public'),
});
export type RepoRef = z.infer<typeof repoRef>;

export const assertion = z.object({
  claim: z.string().max(120),
  expected: z.string().optional(),
  actual: z.string(),
  status: z.enum(STATUSES),
  note: z.string().optional(),
  /** One-line version for the hero terminal. Required when `headline` is true. */
  short: z.string().max(70).optional(),
  headline: z.boolean().default(false),
  receipt,
});
export type Assertion = z.infer<typeof assertion>;

export const failure = z.object({
  title: z.string(),
  found: z.string(),
  fix: z.string(),
  outcome: z.enum(['fixed', 'accepted', 'open']),
  receipt: receipt.optional(),
});
export type Failure = z.infer<typeof failure>;

export const NODE_KINDS = ['input', 'process', 'store', 'model', 'gate', 'output', 'blocked'] as const;

export const diagramNode = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().max(24),
  sub: z.string().max(36).optional(),
  col: z.number().int().min(0).max(4),
  row: z.number().int().min(0).max(2),
  kind: z.enum(NODE_KINDS).default('process'),
});
export const diagramEdge = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().max(18).optional(),
});
export const diagramTrace = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().max(40),
  kind: z.enum(['ok', 'blocked']),
  path: z.array(z.string()).min(2),
  outcome: z.string(),
});
export const diagram = z.object({
  nodes: z.array(diagramNode).min(3).max(12),
  edges: z.array(diagramEdge).min(2),
  traces: z.array(diagramTrace).min(1).max(3),
  caption: z.string(),
  receipt,
});
export type Diagram = z.infer<typeof diagram>;
export type DiagramNode = z.infer<typeof diagramNode>;
export type DiagramEdge = z.infer<typeof diagramEdge>;
export type DiagramTrace = z.infer<typeof diagramTrace>;

export const TONES = ['accent', 'pass', 'fail', 'warn', 'muted'] as const;
const tone = z.enum(TONES);
export type Tone = z.infer<typeof tone>;

const chartBase = {
  title: z.string(),
  /** The claim-first headline of the chart: what the reader should conclude. */
  takeaway: z.string(),
  caption: z.string().optional(),
  receipt,
};

export const chart = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('bars'),
    ...chartBase,
    unit: z.string().default(''),
    max: z.number().optional(),
    orientation: z.enum(['v', 'h']).default('v'),
    showValues: z.boolean().default(true),
    bars: z
      .array(
        z.object({
          label: z.string(),
          value: z.number(),
          display: z.string().optional(),
          sub: z.string().optional(),
          tone: tone.optional(),
          /** For dense charts: only bars with tick=true get an axis label. */
          tick: z.boolean().optional(),
        }),
      )
      .min(1),
    marks: z.array(z.object({ index: z.number().int(), text: z.string() })).default([]),
  }),
  z.object({
    type: z.literal('grouped'),
    ...chartBase,
    unit: z.string().default(''),
    max: z.number().optional(),
    decimals: z.number().int().min(0).max(3).default(0),
    series: z.array(z.object({ name: z.string(), tone })).min(2).max(4),
    groups: z.array(z.object({ label: z.string(), values: z.array(z.number()) })).min(1),
  }),
  z.object({
    type: z.literal('reliability'),
    ...chartBase,
    xLabel: z.string(),
    yLabel: z.string(),
    points: z.array(z.object({ x: z.number(), y: z.number(), n: z.number() })).min(3),
    callout: z.object({ index: z.number().int(), text: z.string() }).optional(),
  }),
  z.object({
    type: z.literal('stack'),
    ...chartBase,
    normalize: z.boolean().default(false),
    unit: z.string().default(''),
    rows: z
      .array(
        z.object({
          label: z.string(),
          total: z.string().optional(),
          segments: z.array(z.object({ label: z.string(), value: z.number(), tone })).min(1),
        }),
      )
      .min(1),
  }),
]);
export type Chart = z.infer<typeof chart>;

export const headlineMetric = z.object({
  value: z.string(),
  label: z.string(),
  note: z.string().optional(),
  receipt,
});

export const projectSchema = z.object({
  title: z.string(),
  /** Up to 11 characters; labels the project in the hero run and the failure-log filters. */
  shortName: z.string().max(11).optional(),
  tagline: z.string(),
  /** One line on what you did, e.g. "Built end to end: pipeline, guardrails, evaluations". Shown on cards. */
  role: z.string().max(90).optional(),
  summary: z.string(),
  tier: z.enum(['flagship', 'archive']),
  order: z.number(),
  visibility: z.enum(['public', 'private']).default('public'),
  status: z.enum(['shipped', 'in-progress', 'archived']).default('shipped'),
  period: z.string().optional(),
  stack: z.array(z.string()).default([]),
  repos: z.array(repoRef).default([]),
  links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  headline: z.array(headlineMetric).max(4).default([]),
  assertions: z.array(assertion).default([]),
  failures: z.array(failure).default([]),
  decisions: z.array(z.object({ title: z.string(), why: z.string() })).default([]),
  diagram: diagram.optional(),
  charts: z.array(chart).default([]),
  /** Archive-tier entries only. */
  archive: z.object({ kind: z.string(), blurb: z.string() }).optional(),
});
export type Project = z.infer<typeof projectSchema>;

export interface ProjectEntry {
  id: string;
  data: Project;
  body: string;
}
