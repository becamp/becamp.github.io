/* The session archive, one entry per beCamp, newest first.
 *
 * Source: the organizers' "beCamp Session History" spreadsheet, one tab per
 * event. The tabs carry no year label, so the years are derived: 16 tabs, and
 * no event in 2020, 2021 or 2023, puts the oldest at 2007. The topics
 * corroborate it — "iOS7 session disbanded" lands in 2013, "Intro to Windows 8"
 * in 2012, "Google App Engine" in 2008, each within months of that thing
 * shipping. Correct src/data/sessions.json if a tab turns out to be another
 * year.
 *
 * NOT EVERYTHING IS HERE. The spreadsheet has at least one further tab, older
 * than 2007 and presumably 2006, whose rows the Drive connector truncates. Two
 * rows were also left out on purpose: a "Breakfast" row in 2015 and a bare
 * "cont." row in 2007, neither of which is a session.
 *
 * Many older rows carry no speaker and no type — the Present / Learn / Share
 * labels only came in part way through. The page shows those gaps rather than
 * hiding the columns, because the gaps are part of the record. */
import sessions from '../data/sessions.json';

export interface ArchivedSession {
  topic: string;
  time: string;
  speaker?: string;
  room?: string;
  /* Free text: "Present", "Share", "Present/Learn", … */
  type?: string;
}

export interface ArchivedYear {
  year: number;
  sessions: ArchivedSession[];
}

export const SESSION_HISTORY: ArchivedYear[] = sessions;

/* The three labels a pitch can carry. A session may carry more than one
   ("Present/Share"), so filtering is a substring test, not equality. */
export const SESSION_TYPES = ['Present', 'Learn', 'Share'] as const;

export type SessionType = (typeof SESSION_TYPES)[number];

/* Orange for Present, blue for Learn, muted for Share — the same three roles
   the rest of the site gives those colours. An untyped session gets the
   dimmest of them, since a dash is all it can say. */
export const typeTone = (type?: string): string => {
  if (!type) return 'text-[#4d5480]';
  if (type.includes('Present')) return 'text-primary';
  if (type.includes('Learn')) return 'text-link';
  return 'text-[#858fc6]';
};

/* Lowercased haystack for the client-side search box; built once at build time
   so the browser never has to walk the objects. */
export const searchText = (session: ArchivedSession): string =>
  [session.topic, session.speaker ?? '', session.room ?? ''].join(' ').toLowerCase();

export const totalSessions = SESSION_HISTORY.reduce((n, year) => n + year.sessions.length, 0);

export const namedSpeakers = (() => {
  const names = new Set<string>();
  for (const year of SESSION_HISTORY) {
    for (const session of year.sessions) {
      if (!session.speaker) continue;
      /* "John F. and John C.", "Owen/Jessica", "Tom Steffes & Lief Poorman" —
         split so a co-presented session counts each person once. */
      for (const name of session.speaker.split(/ (?:and|&) |\//)) {
        const trimmed = name.trim();
        if (trimmed) names.add(trimmed.toLowerCase());
      }
    }
  }
  return names.size;
})();

export const earliestYear = Math.min(...SESSION_HISTORY.map((year) => year.year));
export const latestYear = Math.max(...SESSION_HISTORY.map((year) => year.year));

/* Distinct rooms a year used — the archive's stand-in for "how many tracks ran
   in parallel". The oldest tabs record no room at all, hence the zero case. */
export const roomCount = (year: ArchivedYear): number =>
  new Set(year.sessions.map((session) => session.room).filter(Boolean)).size;
