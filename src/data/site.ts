// Site-wide facts. Anything optional that is `null` simply does not render.
export const site = {
  name: 'Adil Pervez',
  fullName: 'Adil Muhammad Pervez',
  role: 'AI Engineer',
  location: 'Karachi, Pakistan',
  url: 'https://adilmp.github.io',
  title: 'Adil Pervez | AI engineer: LLM evaluation, RAG, text-to-SQL, data pipelines',
  description:
    'Adil Pervez is an AI engineer in Karachi. Five projects with code, results and what went wrong: text-to-SQL guardrails, RAG with checked answers, a PySpark pipeline, an LLM calibration audit and a video classifier.',
  /** The first-screen headline (also the subtitle on share cards). */
  pitch: 'I build LLM systems and prove they work.',
  /** One line under the headline. */
  subline: 'I test AI systems, find where they break, and build the fix.',
  /** The one primary call to action on the first screen. */
  ctaLabel: 'Email me',
  ctaHint: 'Hiring an AI engineer?',
  /** Shown under the subline on the first screen. */
  availability: 'Available immediately · Remote, or hybrid and onsite in Pakistan',
  intro:
    'Five projects, each with the code, the numbers and what went wrong along the way. Every number links to the file it came from.',
  focus: 'LLM evaluation · RAG · text-to-SQL guardrails · data pipelines',
  /**
   * The four results shown on the first screen. Each points at a headline tile in a project file,
   * so the number, its label and its receipt come from the same place as the case study.
   */
  heroResults: [
    { project: 'text-to-sql-guardrails', tile: 1 },
    { project: 'bookmind', tile: 0 },
    { project: 'pk-ecommerce-pipeline', tile: 0 },
    { project: 'jev-calibration-audit', tile: 0 },
  ],
  /**
   * Plain-language findings on the first screen. Each is tied to a headline tile, so the number
   * has a receipt: `text` must contain the tile's value verbatim (the check enforces it).
   */
  heroFindings: [
    {
      project: 'text-to-sql-guardrails',
      tile: 0,
      text: 'Asked questions in English, Arabic and Urdu, a database assistant answered 85% correctly, and no harmful statement ran.',
    },
    {
      project: 'table-tennis-strokes',
      tile: 0,
      text: 'A video model I fine-tuned names the table-tennis stroke in a clip correctly 85.8% of the time on its validation clips, and runs on a CPU in 1 to 2 seconds.',
    },
    {
      project: 'bookmind',
      tile: 0,
      text: 'A book Q&A tool had the right chapter in its top 5 results 95% of the time, and marked none of 29 bad sentences as supported.',
    },
  ],
  tools: ['Python', 'PySpark', 'SQL', 'PostgreSQL', 'FastAPI', 'PyTorch', 'Docker', 'Ollama'],
  github: 'https://github.com/Adilmp',
  /** Set to e.g. '/img/adil.jpg' (file in /public) to show a photo; null shows the monogram. */
  photo: '/img/adil.jpg' as string | null,
  email: 'adilmp14@gmail.com' as string | null,
  linkedin: 'https://www.linkedin.com/in/adil-muhammad-pervez' as string | null,
  /** Your own CV, served from /public. Replace the file to update it; the filename below is what visitors get. */
  cv: '/adil-pervez-cv.pdf' as string | null,
  cvFilename: 'Adil_Pervez_CV_AI_Engineer.pdf',
  /** Shown in the "at a glance" card on the first screen. */
  yearsInAI: '2 years',
  /**
   * Copied from the CV that is sent to employers (public/adil-pervez-cv.pdf). Keep the two in step.
   */
  experience: [
    {
      title: 'LLM Evaluation Engineer',
      org: 'Turing',
      kind: 'Contract',
      place: 'United States, remote',
      when: 'Mar 2026 \u2013 Jun 2026',
      points: [
        "Generated RLHF preference data in Turing's post-training pipeline used to align frontier LLMs.",
        'Scored model responses on math, logic and domain reasoning against rubrics, feeding the reward signal.',
        'Analyzed model failure modes and edge cases, documenting rationales that drove training-data fixes.',
      ],
    },
    {
      title: 'AI Data Quality Engineer',
      org: 'CNTXT AI',
      kind: null,
      place: 'United Arab Emirates, remote',
      when: 'Jun 2024 \u2013 Jan 2026',
      points: [
        'Evaluated medical and legal LLM outputs for accuracy and safety, flagging hallucinations and policy breaches.',
        'Validated large-scale text, image and video datasets for LLM and computer vision training.',
        'Identified systematic failure patterns and edge cases, improving dataset reliability for downstream models.',
      ],
    },
  ],
  education: [
    {
      degree: 'BS Computer Science',
      school: 'National University of Computer and Emerging Sciences (FAST-NUCES)',
      place: 'Pakistan',
      when: 'Sept 2020 \u2013 June 2024',
    },
  ],
  skills: [
    { label: 'LLMs and agents', items: 'LangChain, LangGraph, AI agents, tool calling, RAG, prompt engineering, LLM APIs' },
    { label: 'LLM evaluation and data', items: 'Eval harnesses, guardrails, hallucination detection, RLHF and preference data, CI gates' },
    { label: 'ML and deep learning', items: 'PyTorch, Hugging Face Transformers, fine-tuning, computer vision, NLP, Recall@k, MRR' },
    { label: 'Engineering', items: 'Python, FastAPI, REST APIs, SQL (PostgreSQL, SQLite), Pandas, Docker, Git, GitHub Actions, pytest' },
  ],
  about: [
    "I'm Adil, an AI engineer in Karachi with two years of industry experience at US and UAE AI companies (Turing, CNTXT AI), building RLHF preference data and training datasets for frontier LLMs and computer vision models.",
    'I build production-style LLM applications in Python (RAG pipelines, SQL agents with guardrails) with evaluation harnesses and CI gates, and I fine-tune transformer models with PyTorch and Hugging Face.',
    'It shapes how I work: decide what "working" means, try to break it, and publish the numbers, including the bad ones.',
  ],
} as const;
