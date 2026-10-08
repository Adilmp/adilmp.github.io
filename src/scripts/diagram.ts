// Trace player for the architecture diagrams. The server renders the first trace fully lit, so
// the page is complete without JavaScript; this script replays it as a request flowing through.

export {}; // makes this file a module so its top-level names stay private

interface Trace {
  id: string;
  label: string;
  kind: 'ok' | 'blocked';
  path: string[];
  outcome: string;
}

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

class Player {
  private token = 0;
  private current: Trace;
  private readonly svg: SVGSVGElement;
  private readonly dot: SVGCircleElement;
  private readonly outcome: HTMLElement;
  private readonly steps: HTMLElement;
  private readonly fig: HTMLElement;
  private readonly traces: Trace[];
  private readonly labels: Record<string, string>;

  constructor(fig: HTMLElement, traces: Trace[], labels: Record<string, string>) {
    this.fig = fig;
    this.traces = traces;
    this.labels = labels;
    this.svg = fig.querySelector('svg')!;
    this.dot = fig.querySelector('.trace-dot')!;
    this.outcome = fig.querySelector('[data-outcome]')!;
    this.steps = fig.querySelector('[data-steps]')!;
    this.current = traces[0]!;
  }

  private edge(a: string, b: string): SVGGElement | null {
    return this.svg.querySelector(`.edge[data-key="${a}>${b}"]`);
  }
  private node(id: string): SVGGElement | null {
    return this.svg.querySelector(`.node[data-id="${id}"]`);
  }

  private renderSteps(t: Trace) {
    this.steps.replaceChildren(
      ...t.path.map((id) => {
        const li = document.createElement('li');
        li.dataset.node = id;
        li.textContent = this.labels[id] ?? id;
        return li;
      }),
    );
  }

  private reset() {
    this.svg.querySelectorAll('.lit, .lit-run').forEach((e) => e.classList.remove('lit', 'lit-run', 'blocked'));
    this.svg.querySelectorAll('.end-ok, .end-blocked').forEach((e) => e.classList.remove('end-ok', 'end-blocked'));
    this.svg.querySelectorAll<SVGElement>('.edge-lit').forEach((p) => {
      p.style.strokeDashoffset = '';
      p.style.opacity = '';
    });
    this.dot.classList.remove('on', 'blocked');
  }

  private finish(t: Trace) {
    const last = t.path[t.path.length - 1]!;
    t.path.forEach((id, i) => {
      this.node(id)?.classList.add('lit');
      this.steps.querySelector(`[data-node="${id}"]`)?.classList.add('on');
      if (i > 0) {
        const e = this.edge(t.path[i - 1]!, id);
        e?.classList.add('lit');
        e?.classList.toggle('blocked', t.kind === 'blocked');
      }
    });
    this.node(last)?.classList.add(t.kind === 'blocked' ? 'end-blocked' : 'end-ok');
    if (t.kind === 'blocked') this.steps.querySelector(`[data-node="${last}"]`)?.classList.add('blocked');
    this.dot.classList.remove('on', 'blocked');
    this.fig.classList.remove('is-playing');
    this.outcome.dataset.kind = t.kind;
    this.outcome.textContent = t.outcome;
  }

  private async travel(a: string, b: string, t: Trace, token: number) {
    const g = this.edge(a, b);
    const line = g?.querySelector<SVGPathElement>('.edge-line');
    const lit = g?.querySelector<SVGPathElement>('.edge-lit');
    if (!g || !line || !lit) return;
    g.classList.toggle('blocked', t.kind === 'blocked');
    g.classList.add('lit-run');
    this.dot.classList.add('on');
    this.dot.classList.toggle('blocked', t.kind === 'blocked');
    const len = line.getTotalLength();
    const dur = 460;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        if (token !== this.token) return resolve();
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - (1 - p) ** 3;
        const pt = line.getPointAtLength(len * eased);
        this.dot.setAttribute('cx', String(pt.x));
        this.dot.setAttribute('cy', String(pt.y));
        lit.style.opacity = '1';
        lit.style.strokeDashoffset = String(1 - eased);
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    if (token === this.token) {
      g.classList.add('lit');
      lit.style.strokeDashoffset = '';
      lit.style.opacity = '';
    }
  }

  select(id: string) {
    this.fig.querySelectorAll<HTMLButtonElement>('[data-trace]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.trace === id)));
  }

  async play(t: Trace = this.current) {
    const token = ++this.token;
    this.current = t;
    this.select(t.id);
    this.renderSteps(t);
    this.reset();
    this.outcome.dataset.kind = t.kind;
    if (reduceMotion) {
      this.finish(t);
      return;
    }
    this.outcome.textContent = '';
    this.fig.classList.add('is-playing');
    for (let i = 0; i < t.path.length; i++) {
      if (token !== this.token) return;
      const id = t.path[i]!;
      if (i > 0) {
        await this.travel(t.path[i - 1]!, id, t, token);
        if (token !== this.token) return;
      }
      this.node(id)?.classList.add('lit');
      this.steps.querySelector(`[data-node="${id}"]`)?.classList.add('on');
      await sleep(i === 0 ? 260 : 140);
    }
    if (token === this.token) this.finish(t);
  }

  byId(id: string): Trace | undefined {
    return this.traces.find((t) => t.id === id);
  }
}

document.querySelectorAll<HTMLElement>('[data-diagram]').forEach((fig) => {
  const traces: Trace[] = JSON.parse(fig.dataset.traces ?? '[]');
  const labels: Record<string, string> = JSON.parse(fig.dataset.labels ?? '{}');
  if (!traces.length) return;
  const player = new Player(fig, traces, labels);

  fig.querySelectorAll<HTMLButtonElement>('[data-trace]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const t = player.byId(btn.dataset.trace ?? '');
      if (t) void player.play(t);
    }),
  );
  fig.querySelector('[data-replay]')?.addEventListener('click', () => void player.play());

  // Play the first trace once, when the diagram scrolls into view.
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void player.play(traces[0]);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(fig);
  }
});
