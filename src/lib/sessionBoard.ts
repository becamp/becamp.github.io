/* Pure focus logic for the /sessions display board (src/pages/sessions.astro).
   Kept dependency-free and framework-free so it can be imported both by the
   Astro page's client-side script (to redraw as the clock advances) and
   directly by tests, without touching the DOM or the Airtable data layer.

   Minutes are minutes-since-midnight, local time — e.g. 9:30am is 570. */

export interface Slot {
  /** Matches Session["time"] from src/lib/airtable.ts (and TIME_SLOTS) exactly. */
  key: string;
  /** "Session N" — this slot's fixed ordinal, shown when it does not hold focus. */
  ord: string;
  start: number;
  end: number;
}

/* The five breakout-room slots, in order. Lunch, lightning talks, the break,
   the retrospective and drinks are not display-board slots — they never carry
   focus. Some of them appear as a full-width band below; none is ever a
   focusable row. */
export const SLOTS: Slot[] = [
  { key: '9:30am - 10:15am', ord: 'Session 1', start: 9 * 60 + 30, end: 10 * 60 + 15 },
  { key: '10:20am - 11:05am', ord: 'Session 2', start: 10 * 60 + 20, end: 11 * 60 + 5 },
  { key: '11:10am - 11:55am', ord: 'Session 3', start: 11 * 60 + 10, end: 11 * 60 + 55 },
  { key: '2:00pm - 2:45pm', ord: 'Session 4', start: 14 * 60, end: 14 * 60 + 45 },
  { key: '2:50pm - 3:35pm', ord: 'Session 5', start: 14 * 60 + 50, end: 15 * 60 + 35 },
];

export interface Band {
  /** Stable id, emitted as data-band so a test or a style can name one band. */
  id: string;
  label: string;
  start: number;
  end: number;
  /** Matches Session["time"] from src/lib/airtable.ts exactly. */
  keys: string[];
  /** A fixed part of the day that no schedule record declares. The board shows
      it whatever the schedule holds; every other band waits for its records. */
  fixed?: boolean;
}

/* The full-width bands: stretches of the day that no room column can hold,
   each shown as a single row rather than one card per record.

   A band is deliberately not a Slot. The focus rule below walks SLOTS only, so
   a band never carries focus, never carries an ordinal and never joins the
   handoff — which is what keeps focus on the first afternoon slot throughout
   the midday gap, and what keeps the board from pointing at the retrospective
   once the last session has ended.

   The records a band absorbs run in the Atrium and the Auditorium, so no room
   column can hold them. `keys` matches Session["time"] exactly.

   "Drinks somewhere on the Downtown Mall" ('4:05pm - Whenever') is deliberately
   not banded: it is off-site, it has no parseable end, and it is not part of
   the clean-up. It stays off the board, as it always has. */
export const BANDS: Band[] = [
  {
    /* Fixed: doors and breakfast happen whether or not anyone records them, so
       this band carries no keys and is shown on every board. */
    id: 'doors',
    label: 'Doors open & Breakfast',
    start: 9 * 60,
    end: 9 * 60 + 30,
    keys: [],
    fixed: true,
  },
  {
    id: 'midday',
    label: 'Lunch & Lightning Talks',
    start: 12 * 60 + 5,
    end: 13 * 60 + 55,
    keys: ['12:05pm - 12:35pm', '12:35pm - 1:25pm', '1:25pm - 1:55pm'],
  },
  {
    id: 'retro',
    label: 'Conference Retrospective & clean up',
    start: 15 * 60 + 40,
    end: 16 * 60 + 30,
    keys: ['3:40pm - 4:05pm'],
  },
];

/* The focus rule, verified against every boundary: the first slot whose end
   time is later than now. A session ending at 10:15 hands focus to the 10:20
   slot the instant the clock reads 10:15 — no dead gap, and through the
   midday lunch break the board already points at the first afternoon slot.
   After the last slot ends, there is nothing left to focus. */
export function focusedSlot(minutes: number): Slot | null {
  return SLOTS.find((slot) => minutes < slot.end) ?? null;
}

/* A slot is "on now" only once it has actually started — otherwise focus is
   pointing ahead at a room nobody should walk into yet. */
export function isRunning(slot: Slot, minutes: number): boolean {
  return minutes >= slot.start;
}

export type FocusLabel = 'On now' | 'Up next';

export function focusLabel(slot: Slot, minutes: number): FocusLabel {
  return isRunning(slot, minutes) ? 'On now' : 'Up next';
}

/* "10:15am" / "2:05pm" — matches the mockup's masthead clock formatting. */
export function formatTime(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  let h = h24 % 12;
  if (h === 0) h = 12;
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}${h24 < 12 ? 'am' : 'pm'}`;
}
