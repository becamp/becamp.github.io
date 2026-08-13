/* Build-time Airtable fetches. The site is static: this runs during `astro build`,
   so content changes in Airtable appear after the next rebuild (daily cron or manual).
   Missing credentials or fetch failures degrade to empty data, never a broken build. */

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
  try {
    do {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}?${params}${offset ? `&offset=${offset}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
      if (!res.ok) {
        console.warn(`[airtable] ${table} fetch failed: ${res.status}`);
        return records;
      }
      const data = await res.json();
      records.push(...data.records);
      offset = data.offset ?? '';
    } while (offset);
  } catch (err) {
    console.warn(`[airtable] ${table} fetch error`, err);
  }
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

/* Preview override: a number here fakes the registrant count so the hero line can
   be reviewed locally; set back to null so the real Airtable count is used. */
const FAKE_REGISTRANT_COUNT: number | null = 78;

/* Total rows in the table the registration form writes to. Displayed on the site
   only once it reaches 20 (threshold ported from the old be.camp). */
export async function getRegistrantCount(): Promise<number> {
  if (FAKE_REGISTRANT_COUNT !== null) return FAKE_REGISTRANT_COUNT;
  const table = import.meta.env.AIRTABLE_TABLE || 'Registrations';
  const records = await fetchAll(table, 'fields%5B%5D=Guest%20Name');
  return records.length;
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
