/* Build-time Airtable fetches. The site is static: this runs during `astro build`,
   so content changes in Airtable appear after the next rebuild (daily cron or manual).
   Missing credentials degrade to empty data so local dev works; a FAILED fetch with
   credentials present throws and fails the build — better a red build than the cron
   silently publishing a site with no sponsors or schedule. */

import { createHash } from 'node:crypto';

const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID } = import.meta.env;

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
}

async function fetchAll(table: string, params: string): Promise<AirtableRecord[]> {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    console.warn(`[airtable] credentials missing, skipping ${table}`);
    return [];
  }
  const records: AirtableRecord[] = [];
  let offset = '';
  do {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}?${params}${offset ? `&offset=${offset}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    if (!res.ok) {
      throw new Error(`[airtable] ${table} fetch failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    records.push(...data.records);
    offset = data.offset ?? '';
  } while (offset);
  return records;
}

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export interface Sponsor {
  name: string;
  slug: string;
  level: string;
  url?: string;
  writeup?: string;
  logo?: { url: string; width: number; height: number };
}

/* When true, pulls every sponsor row regardless of the "Commitment confirmed"
   flag — preview use only. */
const INCLUDE_UNCONFIRMED = false;

/* "Commitment confirmed" in the Sponsors table is the flag that shows a sponsor on the site. */
export async function getSponsors(): Promise<{ premier: Sponsor[]; regular: Sponsor[] }> {
  const records = await fetchAll(
    'Sponsors',
    INCLUDE_UNCONFIRMED ? '' : 'filterByFormula=%7BCommitment%20confirmed%7D'
  );

  const sponsors: Sponsor[] = records
    .filter((r) => r.fields['Sponsor'])
    .map((r) => {
      const logo = r.fields['Logo']?.[0];
      return {
        name: r.fields['Sponsor'],
        slug: slugify(r.fields['Sponsor']),
        level: r.fields['Level'] ?? 'Sponsor',
        url: r.fields['Url'],
        writeup: r.fields['Write up'],
        logo: logo ? { url: logo.url, width: logo.width, height: logo.height } : undefined,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    premier: sponsors.filter((s) => s.level === 'Premier Sponsor'),
    regular: sponsors.filter((s) => s.level !== 'Premier Sponsor'),
  };
}

export interface Session {
  topic: string;
  speaker?: string;
  time: string;
  location?: string;
  type?: string;
}

/* Display order for schedule rows; mirrors the Time single-select options in Airtable. */
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
  '5:00pm - 7:00pm',
];

/* One switch for all preview data: set the USE_FAKE_DATA env var to "true" to
   fake the registrant count and attendee directory so the gated UI can be
   reviewed before real registrations exist. Unset (the default, and what
   production builds use) reads real Airtable data. */
const USE_FAKE_DATA = import.meta.env.USE_FAKE_DATA === 'true';
const FAKE_REGISTRANT_COUNT = 78;

/* The peer-count line and the attendee directory stay hidden until this many
   people have registered (threshold ported from the old be.camp). */
export const REGISTRANT_THRESHOLD = 20;

/* The live base's table is named Guests (verified against an export). */
const REGISTRATIONS_TABLE = import.meta.env.AIRTABLE_TABLE || 'Guests';

/* Total rows in the table the registration form writes to. Memoized: Header and
   Footer ask on every page, and the count shouldn't be fetched once per page
   during a build. */
let registrantCountPromise: Promise<number> | null = null;
export function getRegistrantCount(): Promise<number> {
  registrantCountPromise ??= (async () => {
    if (USE_FAKE_DATA) return FAKE_REGISTRANT_COUNT;
    const records = await fetchAll(REGISTRATIONS_TABLE, 'fields%5B%5D=Guest%20Name');
    return records.length;
  })();
  return registrantCountPromise;
}

export interface Attendee {
  name: string;
  /* md5 of the lowercased email — only the hash ever reaches the client,
     used to look up the Gravatar avatar. */
  gravatarHash: string;
}

const md5 = (value: string) => createHash('md5').update(value).digest('hex');

const FAKE_ATTENDEE_NAMES = [
  'Ada Whitfield', 'Ben Okafor', 'Camille Reyes', 'Devon Marsh', 'Elena Petrov',
  'Felix Nguyen', 'Grace Aldridge', 'Hank Morrow', 'Imani Clarke', 'Jonas Feld',
  'Kira Solomon', 'Liam Berger', 'Maya Trent', 'Noah Castillo', 'Opal Freeman',
  'Priya Raman', 'Quentin Ashe', 'Rosa Delgado', 'Sam Whitaker', 'Tessa Bloom',
  'Uma Krishnan', 'Victor Hale', 'Wren Palmer', 'Xavier Boone', 'Yara Haddad',
  'Zeke Lawson',
];

/* Attendees who opted into the public directory. Names + Gravatar hashes only —
   emails never leave the build. */
export async function getAttendees(): Promise<Attendee[]> {
  if (USE_FAKE_DATA) {
    return FAKE_ATTENDEE_NAMES.map((name) => ({
      name,
      gravatarHash: md5(`${name.toLowerCase().replace(/\s+/g, '.')}@example.com`),
    }));
  }
  const records = await fetchAll(
    REGISTRATIONS_TABLE,
    'fields%5B%5D=Guest%20Name&fields%5B%5D=Email&fields%5B%5D=Directory%20Permission'
  );
  return records
    .filter((r) => r.fields['Directory Permission'] && r.fields['Guest Name'] && r.fields['Email'])
    .map((r) => ({
      name: String(r.fields['Guest Name']),
      gravatarHash: md5(String(r.fields['Email']).trim().toLowerCase()),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSaturdaySchedule(): Promise<Session[]> {
  const records = await fetchAll('Saturday Schedule', 'fields%5B%5D=Topic&fields%5B%5D=Speaker&fields%5B%5D=Time&fields%5B%5D=Location&fields%5B%5D=Type');

  return records
    .filter((r) => r.fields['Topic'] && r.fields['Time'])
    .map((r) => ({
      topic: r.fields['Topic'],
      speaker: r.fields['Speaker'],
      time: r.fields['Time'],
      location: r.fields['Location'],
      type: r.fields['Type'],
    }));
}
