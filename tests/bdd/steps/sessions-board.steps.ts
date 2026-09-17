/* The /sessions display board: docs/bdd/sessions-board-breakout-only.feature,
   sessions-board-focus-advance.feature, sessions-board-focus-labelling.feature,
   sessions-board-idle-chrome.feature, sessions-board-presentation-mode.feature
   and sessions-board-viewport-scaling.feature.

   sessions-board-debug-clock.feature is tagged @manual — see the report in
   tests/bdd/STATUS.md.

   Kept self-contained (no imports from common.steps.ts or another area's step
   file — CONTRACT.md rule 1), so the small render helper below is a local copy.

   Most of this area only exists at runtime: focus, its labelling, the idle
   fade and fullscreen are all applied by the page's own script, so the
   assertions run against a real browser over the real built output. The clock
   is driven by openPage's `now`, which shifts the page's Date rather than
   freezing it — the board therefore keeps ticking, which is what the
   "left running" scenario needs. */

import { Given, When, Then, BeforeStep, DataTable } from '@cucumber/cucumber';
import type { ITestStepHookParameter } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import { buildSite } from '../support/build.js';
import { openPage } from '../support/browser.js';
import { schedule, TIME_SLOTS, type AirtableRecord } from '../support/fixtures.js';
import { all, text, texts } from '../support/dom.js';
import type { BecampWorld } from '../support/world.js';

/* --color-primary from src/styles/global.css, as a browser reports it. */
const ACCENT = 'rgb(255, 117, 15)';

/* The board's own icon paths, from src/pages/sessions.astro. Outward-pointing
   corners mean "enter"; inward-pointing mean "exit". */
const ICON_OUTWARD = 'M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6';
const ICON_INWARD = 'M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6';

/* The five breakout slots as the features state them. Deliberately re-declared
   from the feature tables rather than imported from src/lib/sessionBoard.ts —
   a spec should not be checked against the code it specifies. */
const BREAKOUT_SLOTS = [
  { key: '9:30am - 10:15am', ord: 'Session 1', start: 570, end: 615 },
  { key: '10:20am - 11:05am', ord: 'Session 2', start: 620, end: 665 },
  { key: '11:10am - 11:55am', ord: 'Session 3', start: 670, end: 715 },
  { key: '2:00pm - 2:45pm', ord: 'Session 4', start: 840, end: 885 },
  { key: '2:50pm - 3:35pm', ord: 'Session 5', start: 890, end: 935 },
];

const ROOMS = [1, 2, 3];

/* "10:15am" / "2:05pm" -> minutes since midnight. */
function parseClock(stamp: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(stamp.trim());
  assert.ok(m, `not a clock time: "${stamp}"`);
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === 'pm') h += 12;
  return h * 60 + Number(m[2]);
}

/* Saturday of the event, at the given minute. Seconds default to 5 so a
   sub-second page load cannot roll the clock into the following minute. */
const epochFor = (minutes: number, seconds = 5) =>
  new Date(2026, 9, 3, Math.floor(minutes / 60), minutes % 60, seconds).getTime();

/* A full board: five breakout slots across three rooms, plus the non-breakout
   items the board is supposed to leave out. */
function boardRecords(
  overrides: { omit?: Array<{ slot: number; room: number }>; topic?: { slot: number; room: number; value: string }; speaker?: { slot: number; room: number; value: string } } = {}
): AirtableRecord[] {
  const TYPES = ['Discussion', 'Workshop', 'Talk'];
  const rows: Array<{ topic?: string; speaker?: string; time?: string; location?: string; type?: string }> = [];

  BREAKOUT_SLOTS.forEach((slot, s) => {
    ROOMS.forEach((room, r) => {
      if (overrides.omit?.some((o) => o.slot === s && o.room === r)) return;
      const isTopic = overrides.topic && overrides.topic.slot === s && overrides.topic.room === r;
      const isSpeaker = overrides.speaker && overrides.speaker.slot === s && overrides.speaker.room === r;
      rows.push({
        topic: isTopic ? overrides.topic!.value : `Topic ${s + 1}-${room}`,
        speaker: isSpeaker ? overrides.speaker!.value : `Speaker ${s + 1}-${room}`,
        time: slot.key,
        location: `Breakout_Room_${room}`,
        type: TYPES[r],
      });
    });
  });

  /* Everything the board must not show. Drinks carries no location at all. */
  rows.push(
    { topic: 'Lunch', time: TIME_SLOTS[3], location: 'Atrium' },
    { topic: 'Lightning Talks — five minutes each', time: TIME_SLOTS[4], location: 'Auditorium', type: 'Lightning Talks' },
    { topic: 'Break & Sponsor Raffle', time: TIME_SLOTS[5], location: 'Atrium' },
    { topic: 'Retrospective — what worked', time: TIME_SLOTS[8], location: 'Auditorium' },
    { topic: 'Drinks somewhere on the Downtown Mall', time: TIME_SLOTS[9] }
  );

  return schedule.sessions(rows);
}

/** Builds if needed and parks the static /sessions markup on the world. */
async function buildBoard(world: BecampWorld): Promise<Document> {
  world.buildOptions.records = {
    ...world.buildOptions.records,
    'Saturday Schedule':
      world.buildOptions.records?.['Saturday Schedule'] ?? (world.scratch.records as AirtableRecord[]) ?? boardRecords(),
  };
  world.site ??= await buildSite(world.buildOptions);
  assert.equal(world.site.failure, undefined, `build failed: ${world.site.failure?.message}`);
  assert.ok(world.site.has('/sessions'), 'the build emitted no /sessions page');
  world.currentPage = '/sessions';
  world.document = world.site.page('/sessions');
  return world.document;
}

/* openPage's own `now` option cannot be used: tsx compiles the class inside
   that init script with esbuild's `__name` helper, which does not exist in the
   page, so the script throws and the clock is never overridden (reported in
   tests/bdd/STATUS.md). Passing the script as a string keeps it out of the
   transpiler's hands. The clock is shifted, not frozen, so the board goes on
   ticking — which is what the "left running" scenario needs. */
const clockScript = (epoch: number) => `
  (() => {
    const RealDate = Date;
    const offset = ${epoch} - RealDate.now();
    class ShiftedDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) super(RealDate.now() + offset);
        else super(...args);
      }
      static now() { return RealDate.now() + offset; }
    }
    globalThis.Date = ShiftedDate;
  })();
`;

/** Opens /sessions with the board's clock shifted to `epoch`, when one is set. */
async function openBoard(world: BecampWorld, epoch?: number) {
  const opened = await openPage(world.site!, '/sessions', {
    ...(world.scratch.viewport ? { viewport: world.scratch.viewport } : {}),
    ...(world.scratch.reducedMotion ? { reducedMotion: true } : {}),
  });
  if (epoch !== undefined) {
    await opened.context.addInitScript({ content: clockScript(epoch) });
    await opened.page.reload({ waitUntil: 'load' });
  }
  return opened;
}

/* Records every requestFullscreen the page makes, and can refuse them, so the
   scenarios can assert what was asked for without a real display. The board
   calls document.documentElement.requestFullscreen() at click time, so
   patching the prototype after load is enough. */
async function armFullscreen(page: Page) {
  /* A string body, for the same reason clockScript is one: tsx names every
     function it sees, and the `__name` helper it calls does not exist in the
     page. */
  await page.evaluate(`(() => {
    if (window.__fsArmed) return;
    window.__fsArmed = true;
    window.__fsCalls = [];
    window.__fsRefuse = false;
    const orig = Element.prototype.requestFullscreen;
    Element.prototype.requestFullscreen = function (opts) {
      window.__fsCalls.push(opts || {});
      if (window.__fsRefuse) return Promise.reject(new Error('fullscreen refused by the embedding context'));
      return orig.call(this, opts);
    };
  })()`);
}

/** Opens the board in a browser, once per scenario. */
async function boardPage(world: BecampWorld): Promise<Page> {
  if (world.scratch.page) return world.scratch.page as Page;
  await buildBoard(world);
  const { page, context } = await openBoard(world, world.scratch.now as number | undefined);
  world.scratch.page = page;
  world.scratch.context = context;
  await armFullscreen(page);
  return page;
}

/** The focused row's slot key and ordinal label, read from a live board. */
async function focusState(page: Page) {
  return page.evaluate(() => {
    const live = Array.from(document.querySelectorAll<HTMLElement>('.row-session.is-live'));
    const row = live[0];
    return {
      count: live.length,
      slot: row?.dataset.slot ?? null,
      label: row?.querySelector('.ord-text')?.textContent?.trim() ?? null,
      dotHidden: row ? (row.querySelector('.live-dot')?.className ?? '').includes('hidden') : null,
    };
  });
}

/* A throwaway board at one instant, for sweeping across the day without
   holding a context open per sample. */
async function probeFocus(world: BecampWorld, minutes: number) {
  await buildBoard(world);
  const { page, context } = await openBoard(world, epochFor(minutes));
  try {
    return await focusState(page);
  } finally {
    await context.close();
  }
}

const slotByKey = (key: string | null) => BREAKOUT_SLOTS.find((s) => s.key === key);

const rows = (doc: Document) => all(doc, '.row-session');

/* ══════════════════════════════════════════════════════════════════════════
   Shared across this area's files
   ══════════════════════════════════════════════════════════════════════════ */

/* Two phrasings of the same thing across the six files. Both render the
   static markup; steps that need runtime behaviour open the browser
   themselves via boardPage(). */
When(/^the board renders$/, async function (this: BecampWorld) {
  await buildBoard(this);
});

When(/^the board is rendered$/, async function (this: BecampWorld) {
  await buildBoard(this);
});

When('the board renders at any time during the day', async function (this: BecampWorld) {
  this.scratch.now ??= epochFor(parseClock('11:30am'));
  this.scratch.sweepDay = true;
  await boardPage(this);
});

/* "any viewport size" is not one size of my choosing — sample the shapes a
   display board actually gets plugged into, including the ones the outline
   names. */
const DISPLAY_SIZES = [
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 },
  { width: 2560, height: 1080 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
];

When('the board is rendered at any viewport size', async function (this: BecampWorld) {
  await buildBoard(this);
  const samples = [];
  for (const viewport of DISPLAY_SIZES) {
    const { page, context } = await openPage(this.site!, '/sessions', { viewport });
    try {
      samples.push({ viewport, ...(await overflow(page)) });
    } finally {
      await context.close();
    }
  }
  this.scratch.overflowSamples = samples;
});

Given(/^the time is (\d{1,2}:\d{2}(?:am|pm))(?:, during lunch)?$/, function (this: BecampWorld, stamp: string) {
  this.scratch.nowMinutes = parseClock(stamp);
  this.scratch.now = epochFor(this.scratch.nowMinutes);
});

Given('the time is any moment during the day', function (this: BecampWorld) {
  this.scratch.sweepDay = true;
  this.scratch.now = epochFor(parseClock('10:00am'));
});

Given('the viewer prefers reduced motion', function (this: BecampWorld) {
  this.scratch.reducedMotion = true;
});

/* ══════════════════════════════════════════════════════════════════════════
   sessions-board-breakout-only.feature
   ══════════════════════════════════════════════════════════════════════════ */

Then('exactly five session rows are shown', function (this: BecampWorld) {
  assert.ok(this.document, 'no board has been rendered');
  assert.equal(rows(this.document).length, 5, 'the board does not show exactly five session rows');
});

Then('they are the slots that run in breakout rooms', function (this: BecampWorld) {
  assert.ok(this.document);
  assert.deepEqual(
    rows(this.document).map((r) => r.getAttribute('data-slot')),
    BREAKOUT_SLOTS.map((s) => s.key)
  );
});

Then('no row is shown for {string}', function (this: BecampWorld, item: string) {
  assert.ok(this.document);
  const needle = item.trim();
  const offending = rows(this.document).filter((r) => text(r).includes(needle));
  assert.deepEqual(offending.map(text), [], `the board shows a row for "${needle}"`);
});

Then('a column is shown for each breakout room', function (this: BecampWorld) {
  assert.ok(this.document);
  assert.equal(all(this.document, '.col-head').length, ROOMS.length, 'wrong number of room columns');
});

Then('each column header names the room', function (this: BecampWorld) {
  assert.ok(this.document);
  assert.deepEqual(
    texts(this.document, '.col-head .col-room'),
    ROOMS.map((n) => `Breakout Room ${n}`)
  );
});

Then("each column header carries the room's number in the accent colour", function (this: BecampWorld) {
  assert.ok(this.document);
  const nums = all(this.document, '.col-head .col-num');
  assert.deepEqual(nums.map(text), ROOMS.map(String), 'column headers do not carry the room numbers');
  for (const n of nums) {
    assert.ok(
      (n.getAttribute('class') ?? '').split(/\s+/).includes('text-primary'),
      `room number "${text(n)}" is not in the accent colour`
    );
  }
});

Then('the five session rows divide the space below the masthead evenly', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const heights = await page.$$eval('.row-session', (els) => els.map((el) => el.getBoundingClientRect().height));
  assert.equal(heights.length, 5);
  const spread = Math.max(...heights) - Math.min(...heights);
  assert.ok(spread <= 1.5, `session rows differ in height by ${spread.toFixed(2)}px`);
  assert.ok(heights[0] > 0, 'session rows have no height');
});

Given('one room has no session in a slot', function (this: BecampWorld) {
  this.scratch.records = boardRecords({ omit: [{ slot: 1, room: 2 }] });
  this.scratch.openCell = { slot: 1, room: 2 };
});

Then('that cell is shown as an open placeholder', function (this: BecampWorld) {
  assert.ok(this.document);
  const { slot, room } = this.scratch.openCell as { slot: number; room: number };
  const row = rows(this.document)[slot];
  const cells = all(row, '.card');
  assert.equal(cells.length, ROOMS.length, 'the unclaimed cell was dropped rather than shown');
  const cell = cells[room];
  assert.ok(
    (cell.getAttribute('class') ?? '').split(/\s+/).includes('card-open'),
    'the unclaimed cell is not marked as an open placeholder'
  );
  this.scratch.openElement = cell;
});

Then('it invites someone to claim it at the board', function (this: BecampWorld) {
  const cell = this.scratch.openElement as Element | undefined;
  assert.ok(cell, 'no open placeholder was selected');
  assert.match(text(cell), /claim it at the board/i, 'the placeholder does not invite anyone to claim it');
});

Given('a session with a topic, a speaker and a format', function (this: BecampWorld) {
  this.scratch.expectedTopic = 'Topic 1-1';
  this.scratch.expectedSpeaker = 'Speaker 1-1';
  this.scratch.expectedType = 'Discussion';
});

/* `the card shows the topic` and `the card shows the speaker` live in
   common.steps.ts and read this.scratch.card. Nothing in those phrases says
   which card, so select the one this area means — the first slot's first
   session — just before the first of them runs. */
const CARD_STEPS = new Set(['the card shows the topic', 'the card shows the speaker', 'the card shows the format']);

BeforeStep(function (this: BecampWorld, { pickleStep }: ITestStepHookParameter) {
  if (!CARD_STEPS.has(pickleStep.text) || this.scratch.card || !this.document) return;
  const card = rows(this.document)[0]?.querySelector('.card');
  if (card) this.scratch.card = card;
});

Then('the card shows the format', function (this: BecampWorld) {
  const card = this.scratch.card as Element | undefined;
  assert.ok(card, 'no card was selected');
  assert.ok(
    text(card).includes(this.scratch.expectedType as string),
    `card does not show the format "${this.scratch.expectedType}"`
  );
});

Then('the card does not repeat the room, which the column header already names', function (this: BecampWorld) {
  const card = this.scratch.card as Element | undefined;
  assert.ok(card, 'no card was selected');
  assert.ok(!/Breakout Room/i.test(text(card)), 'the card repeats the room name');
});

/* ══════════════════════════════════════════════════════════════════════════
   sessions-board-focus-advance.feature
   ══════════════════════════════════════════════════════════════════════════ */

Given('the board shows the five breakout-room slots', async function (this: BecampWorld, table: DataTable) {
  const expected = table.hashes().map((r) => ({
    key: r.slot.trim(),
    start: parseClock(r.start),
    end: parseClock(r.end),
  }));
  /* The table is the specification; check the declared slots against it before
     anything renders, then check the rendered board carries the same keys. */
  assert.deepEqual(
    BREAKOUT_SLOTS.map((s) => ({ key: s.key, start: s.start, end: s.end })),
    expected
  );
  const doc = await buildBoard(this);
  assert.deepEqual(
    rows(doc).map((r) => r.getAttribute('data-slot')),
    expected.map((s) => s.key)
  );
});

Then(/^the focused slot is "?(\d{1,2}:\d{2}[ap]m - \d{1,2}:\d{2}[ap]m)"?$/, async function (this: BecampWorld, key: string) {
  const page = await boardPage(this);
  const state = await focusState(page);
  assert.equal(state.slot, key, `focus is on ${state.slot ?? 'nothing'}, expected ${key}`);
});

Then("the focused slot's end time is later than the current time", async function (this: BecampWorld) {
  /* Every slot boundary, each boundary's neighbouring minute, and every half
     hour of the event day — focus must never sit on something finished. */
  const samples = new Set<number>();
  for (const slot of BREAKOUT_SLOTS) {
    for (const edge of [slot.start, slot.end]) {
      samples.add(edge - 1);
      samples.add(edge);
      samples.add(edge + 1);
    }
  }
  for (let m = 8 * 60; m <= 17 * 60; m += 30) samples.add(m);

  for (const minutes of [...samples].sort((a, b) => a - b)) {
    const state = await probeFocus(this, minutes);
    if (!state.slot) continue;
    const slot = slotByKey(state.slot);
    assert.ok(slot, `focus is on an unknown slot "${state.slot}"`);
    assert.ok(
      slot.end > minutes,
      `at ${minutes} minutes the board focuses ${slot.key}, which ended at ${slot.end}`
    );
  }
});

Then('the board is not left without a focus', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const state = await focusState(page);
  assert.equal(state.count, 1, 'the board has no focused slot');
});

Then('no slot is focused', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const state = await focusState(page);
  assert.equal(state.count, 0, `the board still focuses ${state.slot}`);
});

Then('the board reports the day as over', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const said = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  assert.match(
    said,
    /day over|day is over|that'?s a wrap|see you next year|sessions are over|no more sessions/i,
    'the board says nothing about the day being over'
  );
});

Given('the board has been left running', async function (this: BecampWorld) {
  /* Ten seconds before a handover, so the board's own 15-second tick has to be
     what moves focus — nobody touches the display after this. */
  this.scratch.handover = BREAKOUT_SLOTS[0].end;
  this.scratch.now = epochFor(this.scratch.handover - 1, 50);
  const page = await boardPage(this);
  const state = await focusState(page);
  assert.equal(state.slot, BREAKOUT_SLOTS[0].key, 'the board did not start on the slot that is still running');
});

When("the clock crosses a session's end time", async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  assert.ok(page, 'the board is not open');
  /* openPage shifts Date rather than freezing it, so the page's clock really
     does cross 10:15 here. The board re-renders on its own 15s interval. */
  await page.waitForFunction(
    (key: string) => document.querySelector('.row-session.is-live')?.getAttribute('data-slot') !== key,
    BREAKOUT_SLOTS[0].key,
    { timeout: 40_000 }
  );
});

Then('focus moves to the next slot without anyone touching the display', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  const state = await focusState(page);
  assert.equal(state.slot, BREAKOUT_SLOTS[1].key, 'focus did not move to the next slot');
});

/* ══════════════════════════════════════════════════════════════════════════
   sessions-board-focus-labelling.feature
   ══════════════════════════════════════════════════════════════════════════ */

Given(/^the focused slot runs from (\d{1,2}:\d{2}[ap]m) to (\d{1,2}:\d{2}[ap]m)$/, function (
  this: BecampWorld,
  from: string,
  to: string
) {
  const slot = BREAKOUT_SLOTS.find((s) => s.start === parseClock(from) && s.end === parseClock(to));
  assert.ok(slot, `no breakout slot runs from ${from} to ${to}`);
  this.scratch.expectedSlot = slot.key;
});

Given('a slot is focused', function (this: BecampWorld) {
  this.scratch.now ??= epochFor(parseClock('11:30am'));
  this.scratch.expectedSlot = BREAKOUT_SLOTS[2].key;
});

Given('the third slot is focused', function (this: BecampWorld) {
  this.scratch.now = epochFor(parseClock('11:30am'));
  this.scratch.expectedSlot = BREAKOUT_SLOTS[2].key;
});

When('a running session is focused', async function (this: BecampWorld) {
  this.scratch.now ??= epochFor(parseClock('11:30am'));
  const page = await boardPage(this);
  const state = await focusState(page);
  assert.equal(state.label, 'On now', 'the focused session is not running');
});

Then('the focused slot is labelled {string}', async function (this: BecampWorld, label: string) {
  const page = await boardPage(this);
  const state = await focusState(page);
  if (this.scratch.expectedSlot) {
    assert.equal(state.slot, this.scratch.expectedSlot, 'focus is not on the slot the scenario set up');
  }
  assert.equal(state.label, label, `the focused slot is labelled "${state.label}"`);
});

Then('a pulsing indicator is shown beside the label', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const dot = await page.evaluate(() => {
    const el = document.querySelector('.row-session.is-live .live-dot');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { hidden: el.className.includes('hidden'), animation: cs.animationName, duration: cs.animationDuration };
  });
  assert.ok(dot, 'the focused row has no indicator');
  assert.equal(dot.hidden, false, 'the indicator is hidden');
  assert.notEqual(dot.animation, 'none', 'the indicator does not pulse');
  assert.notEqual(dot.duration, '0s', 'the indicator does not pulse');
});

Then('no pulsing indicator is shown', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const state = await focusState(page);
  assert.equal(state.dotHidden, true, 'an indicator is shown beside a session that has not started');
});

Then('the indicator is shown without animation', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const dot = await page.evaluate(() => {
    const el = document.querySelector('.row-session.is-live .live-dot');
    if (!el) return null;
    return { hidden: el.className.includes('hidden'), animation: getComputedStyle(el).animationName };
  });
  assert.ok(dot, 'the focused row has no indicator');
  assert.equal(dot.hidden, false, 'the indicator is not shown at all');
  assert.equal(dot.animation, 'none', 'the indicator still animates under reduced motion');
});

Then("the slot's time is shown in the accent colour", async function (this: BecampWorld) {
  const page = await boardPage(this);
  const colour = await page.evaluate(() => {
    const el = document.querySelector('.row-session.is-live .slot-time');
    return el ? getComputedStyle(el).color : null;
  });
  assert.equal(colour, ACCENT, 'the focused slot time is not in the accent colour');
});

Then('an accent rail marks the row', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const rail = await page.evaluate(() => {
    const el = document.querySelector('.row-session.is-live .slot');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { colour: cs.borderLeftColor, width: parseFloat(cs.borderLeftWidth) };
  });
  assert.ok(rail, 'the focused row has no time gutter');
  assert.equal(rail.colour, ACCENT, 'the rail is not in the accent colour');
  assert.ok(rail.width > 0, 'the rail has no width');
});

Then("the row's session cards are tinted with the accent", async function (this: BecampWorld) {
  const page = await boardPage(this);
  const tints = await page.$$eval('.row-session.is-live .card:not(.card-open)', (els) =>
    els.map((el) => {
      const cs = getComputedStyle(el);
      return { background: cs.backgroundColor, border: cs.borderTopColor };
    })
  );
  assert.ok(tints.length > 0, 'the focused row has no session cards');
  for (const t of tints) {
    assert.match(t.background, /^rgba?\(255,\s*117,\s*15/, `card background is ${t.background}, not an accent tint`);
    assert.match(t.border, /^rgba?\(255,\s*117,\s*15/, `card border is ${t.border}, not an accent tint`);
  }
});

Then(/^the (first|second|third|fourth|fifth) slot is labelled "([^"]+)"$/, async function (
  this: BecampWorld,
  ordinal: string,
  label: string
) {
  const index = ['first', 'second', 'third', 'fourth', 'fifth'].indexOf(ordinal);
  const page = await boardPage(this);
  const found = await page.evaluate((i: number) => {
    const row = document.querySelectorAll<HTMLElement>('.row-session')[i];
    return row?.querySelector('.ord-text')?.textContent?.trim() ?? null;
  }, index);
  assert.equal(found, label, `the ${ordinal} slot is labelled "${found}"`);
});

Then('at most one row is focused', async function (this: BecampWorld) {
  const page = await boardPage(this);
  assert.ok((await focusState(page)).count <= 1, 'more than one row is focused');

  /* And at every handover moment, where a double-focus would show up first. */
  for (const slot of BREAKOUT_SLOTS) {
    for (const minutes of [slot.start - 1, slot.start, slot.end - 1, slot.end]) {
      const state = await probeFocus(this, minutes);
      assert.ok(state.count <= 1, `${state.count} rows are focused at minute ${minutes}`);
    }
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   sessions-board-idle-chrome.feature
   ══════════════════════════════════════════════════════════════════════════ */

const IDLE_MS = 4000;

const idleState = (page: Page) =>
  page.evaluate(() => {
    const btn = document.getElementById('fs-btn');
    const cs = btn ? getComputedStyle(btn) : null;
    return {
      idle: document.body.classList.contains('idle'),
      cursor: getComputedStyle(document.body).cursor,
      opacity: cs ? Number(cs.opacity) : null,
      pointerEvents: cs ? cs.pointerEvents : null,
    };
  });

Given('the board is shown and has just been touched', async function (this: BecampWorld) {
  const page = await boardPage(this);
  await page.mouse.move(400, 400);
  assert.equal((await idleState(page)).idle, false, 'the board is idle immediately after being touched');
});

Given('the board has been touched', async function (this: BecampWorld) {
  const page = await boardPage(this);
  await page.mouse.move(400, 400);
  this.scratch.touchedAt = Date.now();
});

Given('the board has gone idle', async function (this: BecampWorld) {
  const page = await boardPage(this);
  await page.waitForFunction(() => document.body.classList.contains('idle'), undefined, { timeout: 15_000 });
  assert.equal((await idleState(page)).idle, true);
});

When('four seconds pass with no input', async function (this: BecampWorld) {
  const page = await boardPage(this);
  await page.waitForFunction(() => document.body.classList.contains('idle'), undefined, { timeout: 15_000 });
});

Then('the cursor is hidden', async function (this: BecampWorld) {
  const state = await idleState(this.scratch.page as Page);
  assert.equal(state.cursor, 'none', `the cursor is "${state.cursor}"`);
});

/* The control is transitioned over 200ms, so a fade is only observable once it
   has settled — assert the resting opacity, not the frame the class changed. */
async function settledOpacity(page: Page, target: number) {
  await page
    .waitForFunction(
      (want: number) => {
        const btn = document.getElementById('fs-btn');
        return Boolean(btn) && Math.abs(Number(getComputedStyle(btn!).opacity) - want) < 0.01;
      },
      target,
      { timeout: 3000 }
    )
    .catch(() => {
      /* fall through to the assertion below, which reports what it actually is */
    });
  return Number((await idleState(page)).opacity);
}

Then('the fullscreen control fades out', async function (this: BecampWorld) {
  const opacity = await settledOpacity(this.scratch.page as Page, 0);
  assert.ok(opacity <= 0.01, `the control is still at opacity ${opacity}`);
});

Then('the control stops accepting pointer events', async function (this: BecampWorld) {
  const state = await idleState(this.scratch.page as Page);
  assert.equal(state.pointerEvents, 'none', 'the faded control still accepts pointer events');
});

When('the visitor generates a {string}', async function (this: BecampWorld, event: string) {
  const page = this.scratch.page as Page;
  assert.ok(page, 'the board is not open');
  switch (event) {
    case 'mousemove':
      await page.mouse.move(500, 500);
      break;
    case 'mousedown':
      await page.mouse.move(500, 500);
      await page.mouse.down();
      await page.mouse.up();
      break;
    case 'keydown':
      await page.keyboard.press('Shift');
      break;
    case 'touchstart':
      await page.evaluate(() => window.dispatchEvent(new Event('touchstart')));
      break;
    case 'wheel':
      await page.mouse.wheel(0, 1);
      break;
    default:
      throw new Error(`unhandled input "${event}"`);
  }
  await page.waitForTimeout(50);
});

Then('the cursor is shown again', async function (this: BecampWorld) {
  const state = await idleState(this.scratch.page as Page);
  assert.equal(state.idle, false, 'the board is still idle');
  assert.notEqual(state.cursor, 'none', 'the cursor is still hidden');
});

Then('the fullscreen control fades back in', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  const opacity = await settledOpacity(page, 1);
  assert.ok(opacity >= 0.99, `the control is at opacity ${opacity}`);
  assert.equal((await idleState(page)).pointerEvents, 'auto', 'the control still refuses pointer events');
});

When('the visitor moves the pointer again after three seconds', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  await page.waitForTimeout(3000);
  assert.equal((await idleState(page)).idle, false, 'the board went idle before four seconds had passed');
  await page.mouse.move(600, 600);
  this.scratch.movedAt = Date.now();
});

Then('the board does not go idle until four further seconds pass', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  /* Two seconds after the second interaction — well past the original
     countdown — the board must still be awake. */
  await page.waitForTimeout(2000);
  assert.equal((await idleState(page)).idle, false, 'the countdown did not restart on the second interaction');
  await page.waitForFunction(() => document.body.classList.contains('idle'), undefined, { timeout: 15_000 });
  const elapsed = Date.now() - (this.scratch.movedAt as number);
  assert.ok(elapsed >= IDLE_MS - 250, `the board went idle ${elapsed}ms after the interaction`);
});

/** Tabs until the fullscreen control holds focus. */
async function focusControl(page: Page) {
  for (let i = 0; i < 12; i += 1) {
    if (await page.evaluate(() => document.activeElement?.id === 'fs-btn')) return;
    await page.keyboard.press('Tab');
  }
  assert.fail('the fullscreen control could not be reached with the keyboard');
}

When('the visitor tabs to the fullscreen control', async function (this: BecampWorld) {
  await focusControl(this.scratch.page as Page);
});

Then('the control is fully visible', async function (this: BecampWorld) {
  const opacity = await settledOpacity(this.scratch.page as Page, 1);
  assert.ok(opacity >= 0.99, `the focused control is at opacity ${opacity}`);
});

Then('every session card remains fully legible', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  const cards = await page.$$eval('.card', (els) =>
    els.map((el) => ({ opacity: Number(getComputedStyle(el).opacity), visibility: getComputedStyle(el).visibility }))
  );
  assert.ok(cards.length > 0, 'no session cards found');
  for (const c of cards) {
    assert.equal(c.opacity, 1, 'a session card faded with the chrome');
    assert.equal(c.visibility, 'visible');
  }
});

Then('the masthead remains fully legible', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  const masthead = await page.evaluate(() => {
    const el = document.querySelector('#board > header');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { opacity: Number(cs.opacity), visibility: cs.visibility };
  });
  assert.ok(masthead, 'no masthead found');
  assert.equal(masthead.opacity, 1, 'the masthead faded with the chrome');
  assert.equal(masthead.visibility, 'visible');
});

/* ══════════════════════════════════════════════════════════════════════════
   sessions-board-presentation-mode.feature
   ══════════════════════════════════════════════════════════════════════════ */

const controlState = (page: Page) =>
  page.evaluate(() => {
    const btn = document.getElementById('fs-btn');
    const enter = document.getElementById('fs-icon-enter');
    const exit = document.getElementById('fs-icon-exit');
    /* Whichever icon is not `hidden` is the one the visitor sees. No local
       helper: tsx would name it, and the `__name` call does not exist here. */
    const enterClass = enter?.getAttribute('class') ?? 'hidden';
    const exitClass = exit?.getAttribute('class') ?? 'hidden';
    const shown = !enterClass.includes('hidden') ? enter : !exitClass.includes('hidden') ? exit : null;
    return {
      label: document.getElementById('fs-label')?.textContent?.trim() ?? null,
      pressed: btn?.getAttribute('aria-pressed') ?? null,
      icon: shown?.querySelector('path')?.getAttribute('d') ?? null,
      fullscreen: Boolean(document.fullscreenElement),
      requests: ((window as any).__fsCalls ?? []) as Array<Record<string, string>>,
    };
  });

Given('the board is shown in a browser window', async function (this: BecampWorld) {
  const page = await boardPage(this);
  assert.equal((await controlState(page)).fullscreen, false, 'the board is already fullscreen');
});

Given('the board is in fullscreen', async function (this: BecampWorld) {
  const page = await boardPage(this);
  await page.click('#fs-btn');
  await page.waitForFunction(() => Boolean(document.fullscreenElement), undefined, { timeout: 10_000 });
  this.scratch.sizeBefore = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
});

Given('the embedding context does not permit fullscreen', async function (this: BecampWorld) {
  const page = await boardPage(this);
  await page.evaluate('window.__fsRefuse = true');
  this.scratch.layoutBefore = await page.evaluate(() => ({
    rows: document.querySelectorAll('.row-session').length,
    cols: document.querySelectorAll('.col-head').length,
    board: document.getElementById('board')!.getBoundingClientRect().height,
  }));
});

When('the visitor activates the fullscreen control', async function (this: BecampWorld) {
  const page = await boardPage(this);
  await page.click('#fs-btn');
  await page.waitForTimeout(250);
});

When('the visitor presses {string}', async function (this: BecampWorld, combination: string) {
  const page = await boardPage(this);
  const parts = combination.split('+');
  const key = parts.pop()!;
  /* The features write the modifiers as people say them; Playwright wants its
     own names. */
  const modifier = parts[0]?.replace(/^Cmd$/i, 'Meta').replace(/^Ctrl$/i, 'Control');
  await page.keyboard.press(modifier ? `${modifier}+${key}` : key);
  await page.waitForTimeout(250);
});

When('the board enters fullscreen', async function (this: BecampWorld) {
  const page = await boardPage(this);
  this.scratch.sizeBefore = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  await page.click('#fs-btn');
  await page.waitForFunction(() => Boolean(document.fullscreenElement), undefined, { timeout: 10_000 });
});

When('the visitor exits fullscreen by any means', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  await page.evaluate(() => document.exitFullscreen());
  await page.waitForFunction(() => !document.fullscreenElement, undefined, { timeout: 10_000 });
  await page.waitForTimeout(150);
});

When('the visitor moves focus to the fullscreen control', async function (this: BecampWorld) {
  await focusControl(await boardPage(this));
});

Then('the document enters fullscreen', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  await page.waitForFunction(() => Boolean(document.fullscreenElement), undefined, { timeout: 10_000 });
});

Then('the document leaves fullscreen', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  await page.waitForFunction(() => !document.fullscreenElement, undefined, { timeout: 10_000 });
});

Then("the browser's navigation interface is hidden", async function (this: BecampWorld) {
  const state = await controlState(this.scratch.page as Page);
  assert.ok(state.requests.length > 0, 'no fullscreen request was made');
  assert.equal(
    state.requests.at(-1)?.navigationUI,
    'hide',
    'the board did not ask for the navigation interface to be hidden'
  );
});

Then('fullscreen is not toggled', async function (this: BecampWorld) {
  const state = await controlState(this.scratch.page as Page);
  assert.deepEqual(state.requests, [], 'a modified keypress asked for fullscreen');
  assert.equal(state.fullscreen, false, 'the board went fullscreen on a modified keypress');
});

Then('the control reads {string}', async function (this: BecampWorld, label: string) {
  const page = this.scratch.page as Page;
  await page.waitForTimeout(100);
  assert.equal((await controlState(page)).label, label);
});

Then('its icon shows inward-pointing corners', async function (this: BecampWorld) {
  assert.equal((await controlState(this.scratch.page as Page)).icon, ICON_INWARD);
});

Then('its icon shows outward-pointing corners', async function (this: BecampWorld) {
  assert.equal((await controlState(this.scratch.page as Page)).icon, ICON_OUTWARD);
});

Then('it reports aria-pressed {string}', async function (this: BecampWorld, value: string) {
  assert.equal((await controlState(this.scratch.page as Page)).pressed, value);
});

Then('the control updates to match', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  const state = await controlState(page);
  assert.equal(state.fullscreen, false, 'the document is still fullscreen');
  assert.equal(state.label, 'Fullscreen', `the control still reads "${state.label}"`);
  assert.equal(state.pressed, 'false', 'the control still reports aria-pressed true');
  assert.equal(state.icon, ICON_OUTWARD, 'the control still shows the exit icon');
});

Then('the same five rows and room columns are shown', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  const layout = await page.evaluate(() => ({
    rows: document.querySelectorAll('.row-session').length,
    cols: document.querySelectorAll('.col-head').length,
  }));
  assert.equal(layout.rows, 5, 'the board no longer shows five rows');
  assert.equal(layout.cols, ROOMS.length, 'the board no longer shows a column per room');
});

Then('the grid grows to fill the larger area', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  const after = await page.evaluate(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
    board: document.getElementById('board')!.getBoundingClientRect().height,
  }));
  const before = this.scratch.sizeBefore as { w: number; h: number };
  assert.ok(
    Math.abs(after.board - after.h) <= 1,
    `the board is ${after.board}px tall in a ${after.h}px viewport`
  );
  assert.ok(after.h >= before.h && after.w >= before.w, 'the viewport shrank on entering fullscreen');
});

Then('the board continues to fill its own frame', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  const size = await page.evaluate(() => ({
    h: window.innerHeight,
    board: document.getElementById('board')!.getBoundingClientRect().height,
  }));
  assert.ok(Math.abs(size.board - size.h) <= 1, 'the board no longer fills its frame');
});

Then('the layout is left unchanged', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  const after = await page.evaluate(() => ({
    rows: document.querySelectorAll('.row-session').length,
    cols: document.querySelectorAll('.col-head').length,
    board: document.getElementById('board')!.getBoundingClientRect().height,
  }));
  assert.deepEqual(after, this.scratch.layoutBefore, 'the refused request changed the layout');
});

Then('a visible focus ring is shown', async function (this: BecampWorld) {
  const page = this.scratch.page as Page;
  const ring = await page.evaluate(() => {
    const el = document.getElementById('fs-btn');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), colour: cs.outlineColor };
  });
  assert.ok(ring, 'no fullscreen control found');
  assert.notEqual(ring.style, 'none', 'the focused control has no outline');
  assert.ok(ring.width > 0, 'the focus ring has no width');
});

Then('the control is visible even if it had faded out', async function (this: BecampWorld) {
  const opacity = await settledOpacity(this.scratch.page as Page, 1);
  assert.ok(opacity >= 0.99, `the focused control is at opacity ${opacity}`);
});

/* ══════════════════════════════════════════════════════════════════════════
   sessions-board-viewport-scaling.feature
   ══════════════════════════════════════════════════════════════════════════ */

Given(/^a display of (\d+) by (\d+) pixels$/, function (this: BecampWorld, w: string, h: string) {
  this.scratch.viewport = { width: Number(w), height: Number(h) };
});

Given(/^a display wider than \d+:\d+$/, function (this: BecampWorld) {
  this.scratch.viewport = { width: 2560, height: 1080 };
});

Given(/^a display narrower than \d+:\d+$/, function (this: BecampWorld) {
  this.scratch.viewport = { width: 1024, height: 768 };
});

Given('a session title long enough to need three lines', function (this: BecampWorld) {
  const title =
    'A deliberately long session title that has to wrap across at least three lines inside its card before anyone reads the end of it';
  this.scratch.records = boardRecords({ topic: { slot: 0, room: 0, value: title } });
  this.scratch.longTitle = title;
});

Given('a speaker name wider than its card', function (this: BecampWorld) {
  const name = 'Bartholomew Maximilian Fitzgerald-Harrington-Vandermeersch the Third';
  this.scratch.records = boardRecords({ speaker: { slot: 0, room: 0, value: name } });
  this.scratch.longSpeaker = name;
});

/** scrollWidth/scrollHeight against the client box, for the whole page. */
const overflow = (page: Page) =>
  page.evaluate(() => {
    const el = document.documentElement;
    return {
      x: el.scrollWidth - el.clientWidth,
      y: el.scrollHeight - el.clientHeight,
      height: el.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  });

type OverflowSample = { viewport?: { width: number; height: number }; x: number; y: number; height: number; viewportHeight: number };

/** Every sampled size, or the single page the scenario opened. */
async function overflowSamples(world: BecampWorld): Promise<OverflowSample[]> {
  const swept = world.scratch.overflowSamples as OverflowSample[] | undefined;
  if (swept?.length) return swept;
  return [await overflow(await boardPage(world))];
}

const sizeOf = (s: OverflowSample) => (s.viewport ? `${s.viewport.width}x${s.viewport.height}` : 'the display');

Then('the page height equals the viewport height', async function (this: BecampWorld) {
  for (const o of await overflowSamples(this)) {
    assert.ok(
      Math.abs(o.height - o.viewportHeight) <= 1,
      `at ${sizeOf(o)} the page is ${o.height}px tall in a ${o.viewportHeight}px viewport`
    );
  }
});

Then('neither axis scrolls', async function (this: BecampWorld) {
  for (const o of await overflowSamples(this)) {
    assert.ok(o.x <= 1, `at ${sizeOf(o)} the page scrolls horizontally by ${o.x}px`);
    assert.ok(o.y <= 1, `at ${sizeOf(o)} the page scrolls vertically by ${o.y}px`);
  }
});

Then('all five session rows are visible', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const boxes = await page.$$eval('.row-session', (els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    })
  );
  assert.equal(boxes.length, 5, 'the board does not show five session rows');
  const viewport = await page.evaluate(() => window.innerHeight);
  for (const [i, b] of boxes.entries()) {
    assert.ok(b.height > 0, `row ${i + 1} has no height`);
    assert.ok(b.top >= -1 && b.bottom <= viewport + 1, `row ${i + 1} falls outside the viewport`);
  }
});

Then('the masthead is visible', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const box = await page.evaluate(() => {
    const el = document.querySelector('#board > header');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height, viewport: window.innerHeight };
  });
  assert.ok(box, 'no masthead found');
  assert.ok(box.height > 0 && box.top >= -1 && box.bottom <= box.viewport + 1, 'the masthead is not fully visible');
});

/* Clipped means "cut off by an ancestor that hides its overflow" — the board
   itself and the session cards both do. Comparing scroll and client heights
   would instead flag sub-pixel line-box rounding, which nobody can see. */
const clippedBy = (page: Page, selector: string) =>
  page.$$eval(selector, (els) =>
    els
      .filter((el) => {
        let clip: HTMLElement | null = el.parentElement;
        while (clip && getComputedStyle(clip).overflow === 'visible') clip = clip.parentElement;
        if (!clip) return false;
        const box = el.getBoundingClientRect();
        const edge = clip.getBoundingClientRect();
        return (
          box.bottom > edge.bottom + 1 ||
          box.top < edge.top - 1 ||
          box.right > edge.right + 1 ||
          box.left < edge.left - 1
        );
      })
      .map((el) => (el.textContent ?? '').trim().slice(0, 60))
  );

Then('no content is clipped', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const clipped = await clippedBy(page, '.card-title, .col-room, .slot-time, .slot-ord, .card-type');
  assert.deepEqual(clipped, [], 'content is cut off by a box that hides its overflow');
});

/** The board's one scaling unit, measured from a probe that inherits it. */
const scaleUnit = (page: Page) =>
  page.evaluate(() => {
    const board = document.getElementById('board')!;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;width:0;height:var(--s);';
    board.appendChild(probe);
    const s = probe.getBoundingClientRect().height;
    probe.remove();
    return { s, w: window.innerWidth, h: window.innerHeight };
  });

Then('sizes are driven by the viewport height', async function (this: BecampWorld) {
  const u = await scaleUnit(await boardPage(this));
  assert.ok(
    Math.abs(u.s - u.h / 100) < 0.2,
    `the scaling unit is ${u.s}px; 1vh is ${u.h / 100}px and 0.5625vw is ${(u.w * 0.5625) / 100}px`
  );
});

Then('sizes are driven by the viewport width', async function (this: BecampWorld) {
  const u = await scaleUnit(await boardPage(this));
  assert.ok(
    Math.abs(u.s - (u.w * 0.5625) / 100) < 0.2,
    `the scaling unit is ${u.s}px; 1vh is ${u.h / 100}px and 0.5625vw is ${(u.w * 0.5625) / 100}px`
  );
});

Then('the grid does not overflow horizontally', async function (this: BecampWorld) {
  const o = await overflow(await boardPage(this));
  assert.ok(o.x <= 1, `the grid overflows horizontally by ${o.x}px`);
});

Then('the grid does not overflow vertically', async function (this: BecampWorld) {
  const o = await overflow(await boardPage(this));
  assert.ok(o.y <= 1, `the grid overflows vertically by ${o.y}px`);
});

Then('the title wraps within its card', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const title = this.scratch.longTitle as string;
  const box = await page.evaluate((needle: string) => {
    const el = Array.from(document.querySelectorAll<HTMLElement>('.card-title')).find((e) =>
      (e.textContent ?? '').includes(needle)
    );
    if (!el) return null;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const card = el.closest('.card')!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { lines: Math.round(r.height / lineHeight), right: r.right, cardRight: card.right };
  }, title);
  assert.ok(box, 'the long title is not on the board');
  assert.ok(box.lines >= 3, `the title occupies ${box.lines} lines`);
  assert.ok(box.right <= box.cardRight + 1, 'the title spills outside its card');
});

Then('no text is cut off', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const cut = await clippedBy(page, '.card-title');
  assert.deepEqual(cut, [], 'a session title is cut off');
});

Then('the name is truncated with an ellipsis', async function (this: BecampWorld) {
  const page = await boardPage(this);
  const who = await page.evaluate((needle: string) => {
    const el = Array.from(document.querySelectorAll<HTMLElement>('.card-who')).find((e) =>
      (e.textContent ?? '').includes(needle)
    );
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      overflowing: el.scrollWidth > el.clientWidth,
      textOverflow: cs.textOverflow,
      whiteSpace: cs.whiteSpace,
      height: el.getBoundingClientRect().height,
      lineHeight: parseFloat(cs.lineHeight),
    };
  }, this.scratch.longSpeaker as string);
  assert.ok(who, 'the long speaker name is not on the board');
  assert.ok(who.overflowing, 'the name is not wider than its card after all');
  assert.equal(who.textOverflow, 'ellipsis', 'the name is not truncated with an ellipsis');
  assert.equal(who.whiteSpace, 'nowrap', 'the name is allowed to wrap');
  assert.ok(who.height <= who.lineHeight + 1, 'the name occupies more than one line');
});

Then("the card's height is unchanged", async function (this: BecampWorld) {
  const page = await boardPage(this);
  const heights = await page.$$eval('.row-session', (els) =>
    els.map((row) => Array.from(row.querySelectorAll('.card')).map((c) => c.getBoundingClientRect().height))
  );
  const first = heights[0];
  const spread = Math.max(...first) - Math.min(...first);
  assert.ok(spread <= 1.5, `cards in the row differ in height by ${spread.toFixed(2)}px`);
});
