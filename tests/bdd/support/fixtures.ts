/* Airtable record fixtures, shaped exactly as the API returns them so the code
   under test does its own field reading, trimming and coercion. */

export interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
}

export type TableName = 'Sponsors' | 'Guests' | 'Saturday Schedule';

let seq = 0;
const rec = (fields: Record<string, any>): AirtableRecord => ({
  id: `rec${String(++seq).padStart(14, '0')}`,
  fields,
});

/* A logo attachment. The build downloads these, so the URL must match the
   host allowed in astro.config.mjs and the fetch stub must serve an image. */
export const LOGO_HOST = 'https://v5.airtableusercontent.com';
export const logo = (name: string) => [
  { url: `${LOGO_HOST}/${name}.png`, width: 240, height: 80 },
];

/* ── Sponsors ────────────────────────────────────────────────────────────── */

export const sponsors = {
  /* Deliberately out of order, with a leading space on one name and a tie, so
     ordering and trimming are both exercised by the default fixture. */
  assorted: (): AirtableRecord[] => [
    rec({ Sponsor: 'Mango Labs', Level: 'Sponsor', 'Cash budget': 1000, 'Commitment confirmed': true }),
    rec({ Sponsor: ' SpiffWorks', Level: 'Premier Sponsor', 'Cash budget': 5000, 'Commitment confirmed': true, Url: 'https://www.spiffworks.example', 'Write up': 'They build things.' }),
    rec({ Sponsor: 'Acme Corp', Level: 'Sponsor', 'Cash budget': 1000, 'Commitment confirmed': true, Url: 'https://acme.example' }),
    rec({ Sponsor: 'Zebra Co', Level: 'Sponsor', 'Cash budget': 500, 'Commitment confirmed': true }),
    rec({ Sponsor: 'Hooli & Co.', Level: 'Premier Sponsor', 'Cash budget': 9000, 'Commitment confirmed': true }),
  ],

  withLevels: (rows: Array<{ name: string; level?: string; cash?: number; url?: string; withLogo?: boolean }>): AirtableRecord[] =>
    rows.map((r) =>
      rec({
        Sponsor: r.name,
        ...(r.level === undefined ? {} : { Level: r.level }),
        ...(r.cash === undefined ? {} : { 'Cash budget': r.cash }),
        ...(r.url ? { Url: r.url } : {}),
        ...(r.withLogo ? { Logo: logo(r.name.toLowerCase().replace(/\W+/g, '-')) } : {}),
        'Commitment confirmed': true,
      })
    ),

  /* Equal contributions, supplied in an order the expected output reverses. */
  tied: (names: string[]): AirtableRecord[] =>
    names.map((name) => rec({ Sponsor: name, Level: 'Sponsor', 'Cash budget': 100, 'Commitment confirmed': true })),

  cashValues: (values: Array<number | string | undefined>): AirtableRecord[] =>
    values.map((v, i) =>
      rec({
        Sponsor: `Sponsor ${String.fromCharCode(65 + i)}`,
        Level: 'Sponsor',
        ...(v === undefined ? {} : { 'Cash budget': v }),
        'Commitment confirmed': true,
      })
    ),

  /* A row with no name in the Sponsor column — must be dropped. */
  nameless: (): AirtableRecord[] => [rec({ Level: 'Sponsor', 'Cash budget': 100, 'Commitment confirmed': true })],
};

/* ── Guests ──────────────────────────────────────────────────────────────── */

export const guests = {
  /* `count` rows, of which the first `optedIn` carry directory permission. */
  many: (count: number, optedIn = count): AirtableRecord[] =>
    Array.from({ length: count }, (_, i) =>
      rec({
        'Guest Name': `Guest ${String(i + 1).padStart(3, '0')}`,
        Email: `guest${i + 1}@example.test`,
        'Directory Permission': i < optedIn,
      })
    ),

  named: (rows: Array<{ name?: string; email?: string; directory?: boolean }>): AirtableRecord[] =>
    rows.map((r) =>
      rec({
        ...(r.name === undefined ? {} : { 'Guest Name': r.name }),
        ...(r.email === undefined ? {} : { Email: r.email }),
        ...(r.directory === undefined ? {} : { 'Directory Permission': r.directory }),
      })
    ),
};

/* ── Saturday schedule ───────────────────────────────────────────────────── */

export const TIME_SLOTS = [
  '9:30am - 10:15am',
  '10:20am - 11:05am',
  '11:10am - 11:55am',
  '12:05pm - 12:35pm',
  '12:35pm - 1:25pm',
  '1:25pm - 1:55pm',
  '2:00pm - 2:45pm',
  '2:50pm - 3:35pm',
  '3:40pm - 4:05pm',
  '4:05pm - Whenever',
];

export const schedule = {
  sessions: (
    rows: Array<{ topic?: string; speaker?: string; time?: string; location?: string; type?: string }>
  ): AirtableRecord[] =>
    rows.map((r) =>
      rec({
        ...(r.topic === undefined ? {} : { Topic: r.topic }),
        ...(r.speaker === undefined ? {} : { Speaker: r.speaker }),
        ...(r.time === undefined ? {} : { Time: r.time }),
        ...(r.location === undefined ? {} : { Location: r.location }),
        ...(r.type === undefined ? {} : { Type: r.type }),
      })
    ),

  /* `tracks` parallel sessions in one slot. */
  parallel: (time: string, tracks: number): AirtableRecord[] =>
    Array.from({ length: tracks }, (_, i) =>
      rec({
        Topic: `Parallel topic ${i + 1}`,
        Speaker: `Speaker ${i + 1}`,
        Time: time,
        Location: `Breakout_Room_${i + 1}`,
        Type: 'Discussion',
      })
    ),

  /* One session in every canonical slot. */
  fullDay: (): AirtableRecord[] =>
    TIME_SLOTS.map((time, i) =>
      rec({
        Topic: `Session for ${time}`,
        Speaker: `Speaker ${i + 1}`,
        Time: time,
        Location: `Breakout_Room_${(i % 3) + 1}`,
        Type: 'Discussion',
      })
    ),
};

export const resetIds = () => {
  seq = 0;
};
