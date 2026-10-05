/* Post-event retrospectives, one Markdown file per year in
 * src/data/retrospectives/. Each becomes /history/<year>/retrospective, and
 * that year in the session history links to it. Add a year by adding a file;
 * the frontmatter below is all the page needs. */
import type { MarkdownInstance } from 'astro';

export interface RetrospectiveFrontmatter {
  year: number;
  title: string;
  /* One sentence for search results and link previews. */
  description: string;
  registered?: number;
  checkedIn?: number;
  pitched?: number;
}

const files = import.meta.glob<MarkdownInstance<RetrospectiveFrontmatter>>('../data/retrospectives/*.md', {
  eager: true,
});

export const RETROSPECTIVES = Object.values(files).sort((a, b) => b.frontmatter.year - a.frontmatter.year);

export const retrospectiveYears = new Set(RETROSPECTIVES.map((retro) => retro.frontmatter.year));

export const retrospectiveHref = (year: number) => `/history/${year}/retrospective`;

/* The full pitch list for a year, when one exists, in
 * src/data/retrospectives/<year>-pitches.json: every pitch from Pitch Night,
 * scheduled or not, as written on its card. Themes are our reading of each
 * title, used only to count patterns; a pitch can carry more than one. */
export interface Pitch {
  board: number;
  title: string;
  /* Left out where the card's name couldn't be read with confidence. */
  presenter?: string;
  scheduled: boolean;
  themes: string[];
}

export const THEME_LABELS: Record<string, string> = {
  ai: 'AI',
  software: 'Software',
  'hands-on': 'Hands-on',
  careers: 'Careers & work',
  data: 'Data',
  culture: 'Culture',
  life: 'Life',
  civic: 'Civic',
  community: 'Community',
  health: 'Health',
  science: 'Science',
};

const pitchFiles = import.meta.glob<{ default: Pitch[] }>('../data/retrospectives/*-pitches.json', { eager: true });

export const pitchesFor = (year: number): Pitch[] | undefined => {
  const pitches = pitchFiles[`../data/retrospectives/${year}-pitches.json`]?.default;
  for (const pitch of pitches ?? []) {
    const unknown = pitch.themes.filter((theme) => !(theme in THEME_LABELS));
    if (unknown.length > 0) throw new Error(`${year}-pitches.json: "${pitch.title}" has unknown themes ${unknown.join(', ')}`);
  }
  return pitches;
};
