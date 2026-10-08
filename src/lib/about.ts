import { site } from '../data/site.ts';
import type { AboutPassage } from './corpus.ts';

/** What the search box knows about the person, beyond the projects. */
export const aboutPassages: AboutPassage[] = [
  ...site.about.map((text, i) => ({ id: `about:${i}`, title: ['Who I am', 'Background', 'How I work'][i] ?? 'About', text })),
  {
    id: 'about:facts',
    title: 'Quick facts',
    text: `${site.fullName} is an ${site.role} based in ${site.location}. Education: BS Computer Science at the National University of Computer and Emerging Sciences (FAST-NUCES), Sept 2020 to June 2024. University studies in computer science. Two years of industry experience in AI. Focus: LLM evaluation, RAG, guardrails and data pipelines. GitHub: ${site.github}.`,
  },
];
