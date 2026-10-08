// Site-wide facts. Anything optional that is `null` simply does not render.
export const site = {
  name: 'Adil Pervez',
  fullName: 'Adil Muhammad Pervez',
  role: 'AI engineer',
  location: 'Karachi, Pakistan',
  url: 'https://adilmp.github.io',
  title: 'Adil Pervez | AI engineer: LLM evaluation, RAG, text-to-SQL, data pipelines',
  description:
    'Adil Pervez is an AI engineer in Karachi. Five projects with code, results and what went wrong: text-to-SQL guardrails, RAG with checked answers, a PySpark pipeline, an LLM calibration audit and a video classifier.',
  /** The one-line pitch under the name. */
  pitch: 'I break LLM systems on purpose, and publish what I find.',
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
   * `title` matches the CV but is deliberately not shown on the site; `focus` is what the site shows instead.
   */
  experience: [
    {
      title: 'LLM Business Analyst',
      focus: 'LLM evaluation and test design',
      org: 'Turing',
      kind: 'Contract',
      place: 'United States, remote',
      when: 'Mar 2026 \u2013 Jun 2026',
      points: [
        'Designed 200+ structured test prompts with pass/fail criteria to evaluate LLM reasoning across mathematics, logic, and domain-specific tasks.',
        'Documented recurring model failure patterns in written reports used to improve training-data pipelines.',
        'Worked with distributed teams to resolve ambiguous outputs and refine evaluation guidelines for a high-volume workflow.',
      ],
    },
    {
      title: 'Data Annotator',
      focus: 'Medical and legal LLM evaluation',
      org: 'CNTXT AI',
      kind: 'Contract',
      place: 'United Arab Emirates, remote',
      when: 'Jun 2024 \u2013 Jan 2026',
      points: [
        'Evaluated medical and legal LLM outputs against strict rubrics, flagging hallucinations and policy violations.',
        'Labeled and validated large volumes of text data for NLP training pipelines, maintaining high inter-annotator agreement.',
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
    { label: 'LLMs and GenAI', items: 'LLM API integration (Claude / Anthropic API, Ollama), prompt engineering and optimization, RAG, LLM evaluation, hallucination detection' },
    { label: 'ML and NLP', items: 'PyTorch, Hugging Face Transformers, model fine-tuning, NLP text normalization, retrieval metrics (Recall@k, MRR)' },
    { label: 'Engineering', items: 'Python, FastAPI, REST APIs, SQL (PostgreSQL, SQLite), Pandas, NumPy, Streamlit, Docker, Git, pytest' },
  ],
  about: [
    "I'm Adil, an AI engineer in Karachi with two years of industry experience in AI. I've evaluated large language models for US and UAE AI companies (Turing, CNTXT AI).",
    "I build LLM-powered applications in Python (RAG, text-to-SQL) that put model APIs behind REST services, and I've fine-tuned transformer models with Hugging Face.",
    'It shapes how I work: decide what "working" means, try to break it, and publish the numbers, including the bad ones.',
  ],
} as const;
