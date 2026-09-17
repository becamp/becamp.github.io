/* Attendee directory + page content: docs/bdd/attendees-directory-gating.feature,
   attendees-directory-listing.feature, attendees-email-privacy.feature,
   home-peer-count.feature, event-details.feature, faq-accordion.feature and
   faq-deep-links.feature.

   Kept deliberately self-contained (no imports from common.steps.ts or another
   area's step file — see CONTRACT.md rule 1) even where that duplicates a small
   helper such as rendering a page or reading the header nav. */

import { Given, When, Then, BeforeStep } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ITestStepHookParameter } from '@cucumber/cucumber';
import { buildSite, QUERIES, type BuiltSite } from '../support/build.js';
import { openPage } from '../support/browser.js';
import { guests, type AirtableRecord } from '../support/fixtures.js';
import { all, text, texts, pageText, hasClass, classList, linkByText } from '../support/dom.js';
import type { BecampWorld } from '../support/world.js';

const md5 = (value: string) => createHash('md5').update(value).digest('hex');

/** Builds if needed, then parks the named page on the world, like common.steps.ts's
    `render` — duplicated locally rather than imported (CONTRACT.md rule 1). */
async function renderPage(world: BecampWorld, path: string): Promise<Document> {
  world.site ??= await buildSite(world.buildOptions);
  world.currentPage = path;
  world.document = world.site.page(path);
  return world.document;
}

const navLinkHrefs = (doc: Document) => all(doc, 'header nav a').map((a) => a.getAttribute('href') ?? '');

/* ── Padding registrants: enough rows to clear the 20-registrant unlock
   threshold without appearing in the directory (directory: false), so a
   scenario can hand-pick exactly the opted-in registrants it wants to assert
   on and still see the grid (not the locked notice). ────────────────────── */
const PAD_SIZE = 20;
const paddingGuests = (): AirtableRecord[] =>
  guests.named(
    Array.from({ length: PAD_SIZE }, (_, i) => ({
      name: `Padding Guest ${i}`,
      email: `padding-guest-${i}@example.test`,
      directory: false,
    }))
  );

const attendeeNames = (doc: Document) => texts(doc, 'main ul li p');

const attendeeRow = (doc: Document, name: string): Element | undefined =>
  all(doc, 'main ul li').find((li) => text(li.querySelector('p')) === name);

/* ══════════════════════════════════════════════════════════════════════════
   attendees-directory-gating.feature
   ══════════════════════════════════════════════════════════════════════════ */

Given('the directory is locked', function (this: BecampWorld) {
  this.buildOptions.records = { ...this.buildOptions.records, Guests: guests.many(5) };
});

Then('no attendee grid is shown', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const grid = this.document.querySelector('main ul li img[src*="gravatar"]');
  assert.ok(!grid, 'the attendee grid is present even though the directory should be locked');
});

/* Used as a Given (directory-listing.feature) and a Then (directory-gating.feature) —
   Cucumber doesn't distinguish the keyword, only the text, so one definition serves
   both: build/render if nothing has been rendered yet, then assert the grid is there. */
Given('the attendee grid is shown', async function (this: BecampWorld) {
  if (!this.document) {
    this.buildOptions.records = {
      ...this.buildOptions.records,
      Guests: this.buildOptions.records?.Guests ?? guests.many(25),
    };
    await renderPage(this, '/attendees');
  }
  const grid = this.document!.querySelector('main ul li img[src*="gravatar"]');
  assert.ok(grid, 'the attendee grid is not shown');
});

Then('a notice reads {string}', function (this: BecampWorld, expected: string) {
  assert.ok(this.document, 'no page has been rendered');
  assert.ok(pageText(this.document).includes(expected), `page does not contain the notice "${expected}"`);
});

Then('no registrant count is stated', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  assert.ok(
    !/\d+\s+people have registered/.test(pageText(this.document)),
    'a registrant count is stated even though the directory should be locked'
  );
});

Then('the page states that {int} people have registered', function (this: BecampWorld, count: number) {
  assert.ok(this.document, 'no page has been rendered');
  assert.ok(
    pageText(this.document).includes(`${count} people have registered`),
    `page does not state that ${count} people have registered`
  );
});

Then('a "Register now" call to action is shown', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  assert.ok(linkByText(this.document, 'Register now'), 'no "Register now" call to action found');
});

Then('no navigation link points at the attendees page', async function (this: BecampWorld) {
  const doc = this.document ?? (await renderPage(this, '/'));
  assert.ok(!navLinkHrefs(doc).includes('/attendees'), 'a navigation link still points at /attendees');
});

/* ══════════════════════════════════════════════════════════════════════════
   attendees-directory-listing.feature
   ══════════════════════════════════════════════════════════════════════════ */

Given('a registrant who ticked the directory box', function (this: BecampWorld) {
  const list = ((this.scratch.namedRegistrants ?? []) as Array<{ name: string; email: string; directory: boolean }>);
  const entry = { name: 'Opted Guest', email: 'opted.guest@example.test', directory: true };
  list.push(entry);
  this.scratch.namedRegistrants = list;
  this.scratch.firstRegistrantName = entry.name;
  this.buildOptions.records = { ...this.buildOptions.records, Guests: [...paddingGuests(), ...guests.named(list)] };
});

Given('a registrant who left it unticked', function (this: BecampWorld) {
  const list = ((this.scratch.namedRegistrants ?? []) as Array<{ name: string; email: string; directory: boolean }>);
  const entry = { name: 'Unopted Guest', email: 'unopted.guest@example.test', directory: false };
  list.push(entry);
  this.scratch.namedRegistrants = list;
  this.scratch.secondRegistrantName = entry.name;
  this.buildOptions.records = { ...this.buildOptions.records, Guests: [...paddingGuests(), ...guests.named(list)] };
});

Then('the first registrant is listed', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  assert.ok(
    attendeeNames(this.document).includes(this.scratch.firstRegistrantName),
    'the opted-in registrant is not listed'
  );
});

Then('the second registrant is not listed', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  assert.ok(
    !attendeeNames(this.document).includes(this.scratch.secondRegistrantName),
    'the opted-out registrant is unexpectedly listed'
  );
});

Given('an opted-in registrant with no {word}', function (this: BecampWorld, field: string) {
  const good = guests.many(5); // five valid, opted-in, alphabetically-named registrants
  const bad: Record<string, any> = { directory: true };
  if (field !== 'name') bad.name = 'Orphan Guest';
  if (field !== 'email') bad.email = 'orphan.guest@example.test';
  this.buildOptions.records = {
    ...this.buildOptions.records,
    Guests: [...paddingGuests(), ...good, ...guests.named([bad])],
  };
  this.scratch.expectedListedNames = good.map((r) => r.fields['Guest Name']);
  this.scratch.missingFieldName = field === 'name' ? undefined : 'Orphan Guest';
});

Then('that registrant is not listed', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const names = attendeeNames(this.document);
  const expected = this.scratch.expectedListedNames as string[];
  assert.deepEqual(names, expected, 'the attendee list does not match the known-good registrants');
  if (this.scratch.missingFieldName) {
    assert.ok(!names.includes(this.scratch.missingFieldName), 'the malformed registrant was listed anyway');
  }
});

Given('opted-in registrants named {string}, {string} and {string}', function (
  this: BecampWorld,
  a: string,
  b: string,
  c: string
) {
  const toEmail = (name: string) => `${name.toLowerCase().replace(/\s+/g, '.')}@example.test`;
  const named = [a, b, c].map((name) => ({ name, email: toEmail(name), directory: true }));
  this.buildOptions.records = { ...this.buildOptions.records, Guests: [...paddingGuests(), ...guests.named(named)] };
});

Then('they appear in the order {string}, {string} and {string}', function (
  this: BecampWorld,
  a: string,
  b: string,
  c: string
) {
  assert.ok(this.document, 'no page has been rendered');
  assert.deepEqual(attendeeNames(this.document), [a, b, c]);
});

Given('an opted-in registrant', function (this: BecampWorld) {
  const name = 'Priya Opted';
  const email = 'priya.opted@example.test';
  this.scratch.registrantName = name;
  this.scratch.registrantEmailHash = md5(email.trim().toLowerCase());
  this.buildOptions.records = {
    ...this.buildOptions.records,
    Guests: [...paddingGuests(), ...guests.named([{ name, email, directory: true }])],
  };
});

Then('their name is shown', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  assert.ok(attendeeNames(this.document).includes(this.scratch.registrantName), 'registrant name is not shown');
});

Then('an avatar is requested from Gravatar using the hash of their email', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const row = attendeeRow(this.document, this.scratch.registrantName);
  assert.ok(row, 'no row found for the registrant');
  const img = row!.querySelector('img');
  assert.ok(img, 'no avatar image found');
  const src = img!.getAttribute('src') ?? '';
  assert.ok(src.includes('gravatar'), `avatar src "${src}" is not a Gravatar URL`);
  assert.ok(src.includes(this.scratch.registrantEmailHash), 'avatar src does not include the hash of the email');
});

Then('the avatar request asks for a PG rating', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const row = attendeeRow(this.document, this.scratch.registrantName);
  const src = row?.querySelector('img')?.getAttribute('src') ?? '';
  assert.match(src, /[?&]rating=pg\b/, `avatar src "${src}" does not request a PG rating`);
});

Then('the avatar falls back to a generated image when Gravatar has none', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const row = attendeeRow(this.document, this.scratch.registrantName);
  const src = row?.querySelector('img')?.getAttribute('src') ?? '';
  assert.match(src, /[?&]d=/, `avatar src "${src}" declares no default-image fallback`);
});

Then('each avatar image is marked for lazy loading', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const imgs = all(this.document, 'main ul li img');
  assert.ok(imgs.length > 0, 'no avatar images found');
  for (const img of imgs) assert.equal(img.getAttribute('loading'), 'lazy');
});

Then('each avatar declares its intrinsic width and height', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const imgs = all(this.document, 'main ul li img');
  assert.ok(imgs.length > 0, 'no avatar images found');
  for (const img of imgs) {
    assert.ok(img.getAttribute('width'), 'avatar image is missing a width attribute');
    assert.ok(img.getAttribute('height'), 'avatar image is missing a height attribute');
  }
});

Then('each avatar has an empty alt attribute', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const imgs = all(this.document, 'main ul li img');
  assert.ok(imgs.length > 0, 'no avatar images found');
  for (const img of imgs) assert.equal(img.getAttribute('alt'), '');
});

Then('the adjacent name carries the meaning', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const rows = all(this.document, 'main ul li');
  assert.ok(rows.length > 0, 'no attendee rows found');
  for (const row of rows) {
    assert.ok(text(row.querySelector('p')).length > 0, 'an attendee row has no visible name text');
  }
});

Then('the grid shows three columns on a narrow viewport', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const grid = this.document.querySelector('main ul.grid');
  assert.ok(grid, 'no attendee grid found');
  assert.ok(hasClass(grid, 'grid-cols-3'), 'attendee grid is not 3 columns by default');
});

Then('more columns as the viewport widens', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const grid = this.document.querySelector('main ul.grid');
  assert.ok(grid, 'no attendee grid found');
  const classes = classList(grid);
  for (const cls of ['sm:grid-cols-5', 'lg:grid-cols-7', 'xl:grid-cols-8']) {
    assert.ok(classes.includes(cls), `attendee grid is missing the responsive class "${cls}"`);
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   attendees-email-privacy.feature
   ══════════════════════════════════════════════════════════════════════════ */

Given('an opted-in registrant with the email {string}', function (this: BecampWorld, email: string) {
  this.scratch.email = email;
  this.buildOptions.records = {
    ...this.buildOptions.records,
    Guests: [...paddingGuests(), ...guests.named([{ name: 'Email Privacy Test', email, directory: true }])],
  };
});

Given('a registrant whose stored email is {string}', function (this: BecampWorld, email: string) {
  this.scratch.email = email;
  this.buildOptions.records = {
    ...this.buildOptions.records,
    Guests: [...paddingGuests(), ...guests.named([{ name: 'Tidy Hash Test', email, directory: true }])],
  };
});

When('the attendees page is built', async function (this: BecampWorld) {
  this.site ??= await buildSite(this.buildOptions);
});

When('the hash is computed', async function (this: BecampWorld) {
  this.site ??= await buildSite(this.buildOptions);
});

Then('the published HTML contains the MD5 hash of that address', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const hash = md5(this.scratch.email.trim().toLowerCase());
  assert.ok(this.site.html('/attendees').includes(hash), 'published HTML does not contain the expected hash');
});

Then('the published HTML does not contain the address itself', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(
    !this.site.html('/attendees').includes(this.scratch.email),
    'published HTML contains the raw email address'
  );
});

Then('it is the hash of {string}', function (this: BecampWorld, tidied: string) {
  assert.ok(this.site, 'no build was run');
  const expected = md5(tidied);
  assert.ok(
    this.site.html('/attendees').includes(expected),
    `expected the hash of "${tidied}" (${expected}) in the published HTML`
  );
});

Then('the avatar resolves to the same image as the tidied address', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const expected = md5(this.scratch.email.trim().toLowerCase());
  const doc = this.site.page('/attendees');
  assert.ok(doc.querySelector(`img[src*="${expected}"]`), 'no avatar image uses the hash of the tidied address');
});

When('the attendee list is fetched from Airtable', async function (this: BecampWorld) {
  this.buildOptions.records = {
    ...this.buildOptions.records,
    Guests: this.buildOptions.records?.Guests ?? guests.many(5),
  };
  this.site = await buildSite(this.buildOptions);
});

Then('the request asks only for the guest name, email and directory permission fields', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const expected = new URLSearchParams(QUERIES.guestDirectory);
  const req = this.site.requests.find((r) => r.table === 'Guests' && r.params.toString() === expected.toString());
  assert.ok(req, 'no Airtable request matched the directory field set');
  assert.deepEqual(req!.params.getAll('fields[]'), ['Guest Name', 'Email', 'Directory Permission']);
  const otherKeys = new Set([...req!.params.keys()].filter((k) => k !== 'fields[]'));
  assert.deepEqual([...otherKeys], [], 'the request asked for more than the three directory fields');
});

When('the registrant count is fetched from Airtable', async function (this: BecampWorld) {
  this.buildOptions.records = {
    ...this.buildOptions.records,
    Guests: this.buildOptions.records?.Guests ?? guests.many(5),
  };
  this.site = await buildSite(this.buildOptions);
});

Then('the request asks only for the guest name field', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const expected = new URLSearchParams(QUERIES.guestCount);
  const req = this.site.requests.find((r) => r.table === 'Guests' && r.params.toString() === expected.toString());
  assert.ok(req, 'no Airtable request matched the count-only field set');
  assert.deepEqual(req!.params.getAll('fields[]'), ['Guest Name']);
});

Then('only the number of rows is used', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const expected = new URLSearchParams(QUERIES.guestCount);
  const req = this.site.requests.find((r) => r.table === 'Guests' && r.params.toString() === expected.toString());
  assert.ok(req, 'no Airtable request matched the count-only field set');
  /* Only Guest Name is asked for; no email or directory-permission field
     reaches the code that turns the response into a count. */
  assert.equal(req!.params.getAll('fields[]').length, 1);
});

/* ══════════════════════════════════════════════════════════════════════════
   home-peer-count.feature
   ══════════════════════════════════════════════════════════════════════════ */

Then('no peer count line is shown', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  assert.ok(!pageText(this.document).includes('peers at beCamp'), 'a peer count line is unexpectedly shown');
});

Then('the hero reads {string}', function (this: BecampWorld, expected: string) {
  assert.ok(this.document, 'no page has been rendered');
  assert.ok(pageText(this.document).includes(expected), `hero does not read "${expected}"`);
});

Given('the peer count line is shown', async function (this: BecampWorld) {
  this.buildOptions.records = {
    ...this.buildOptions.records,
    Guests: this.buildOptions.records?.Guests ?? guests.many(25),
  };
  await renderPage(this, '/');
});

Then('the attendee directory is also unlocked', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const doc = this.site.page('/attendees');
  assert.ok(doc.querySelector('main ul li img[src*="gravatar"]'), 'the attendee grid is not present');
});

Then('both read the same memoized registrant count', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const homeMatch = pageText(this.site.page('/')).match(/Join your (\d+) peers/);
  assert.ok(homeMatch, 'home page has no peer count line');
  const attendeesMatch = pageText(this.site.page('/attendees')).match(/(\d+) people have registered/);
  assert.ok(attendeesMatch, 'attendees page has no registrant count line');
  assert.equal(homeMatch![1], attendeesMatch![1], 'home and attendees pages disagree on the registrant count');
  const countRequests = this.site.requests.filter(
    (r) => r.table === 'Guests' && r.params.toString() === new URLSearchParams(QUERIES.guestCount).toString()
  );
  assert.equal(countRequests.length, 1, 'the registrant count was fetched more than once — not memoized');
});

/* ══════════════════════════════════════════════════════════════════════════
   event-details.feature
   ══════════════════════════════════════════════════════════════════════════ */

/** The outer EventInfoCard `<div>` whose title paragraph matches. */
function findEventCard(doc: Document, title: string): Element | undefined {
  const titleP = all(doc, 'p').find((p) => hasClass(p, 'text-xl') && text(p) === title);
  const inner = titleP?.parentElement ?? undefined; // "flex h-full flex-col ..." div
  return inner?.parentElement ?? inner; // outer card div
}

function venuesOf(card: Element): Array<{ note: string; name: string }> {
  return all(card, 'div.flex.gap-3').map((row) => ({
    note: text(row.querySelector('span')),
    name: text(row.querySelector('p')),
  }));
}

Then('a card reads {string} for {string}', function (this: BecampWorld, day: string, title: string) {
  assert.ok(this.document, 'no page has been rendered');
  const card = findEventCard(this.document, title);
  assert.ok(card, `no event card found with title "${title}"`);
  this.scratch.card = card;
  const dayP = card!.querySelector('p.font-mono');
  assert.equal(text(dayP), day);
});

When('the Friday card is rendered', async function (this: BecampWorld) {
  const doc = await renderPage(this, '/');
  const card = findEventCard(doc, 'Reception & Pitch night');
  assert.ok(card, 'Friday event card not found');
  this.scratch.card = card;
});

When('the Saturday card is rendered', async function (this: BecampWorld) {
  const doc = await renderPage(this, '/');
  const card = findEventCard(doc, 'Sessions');
  assert.ok(card, 'Saturday event card not found');
  this.scratch.card = card;
});

Then(/^"([^"]+)" is listed at (.+)$/, function (this: BecampWorld, venueName: string, note: string) {
  const card = this.scratch.card as Element | undefined;
  assert.ok(card, 'no card selected — set this.scratch.card first');
  const match = venuesOf(card!).find((v) => v.name === venueName);
  assert.ok(match, `venue "${venueName}" not found in card`);
  assert.equal(match!.note, note, `venue "${venueName}" note is "${match!.note}", expected "${note}"`);
});

Then(/^"([^"]+)" is listed$/, function (this: BecampWorld, venueName: string) {
  const card = this.scratch.card as Element | undefined;
  assert.ok(card, 'no card selected — set this.scratch.card first');
  assert.ok(venuesOf(card!).some((v) => v.name === venueName), `venue "${venueName}" not listed`);
});

Then('no time annotation is shown, since there is only one venue', function (this: BecampWorld) {
  const card = this.scratch.card as Element | undefined;
  assert.ok(card, 'no card selected — set this.scratch.card first');
  for (const v of venuesOf(card!)) assert.equal(v.note, '', 'unexpected time annotation present');
});

function timeAfterHeading(doc: Document, headingSubstring: string): string {
  const heading = all(doc, 'h2').find((h) => text(h).includes(headingSubstring));
  assert.ok(heading, `no heading containing "${headingSubstring}"`);
  return text(heading!.nextElementSibling).replace(/[–—]/g, 'to');
}

Then('the reception is listed as 4:30pm to 5:30pm', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  assert.equal(timeAfterHeading(this.document, 'Reception'), '4:30pm to 5:30pm');
});

Then('Pitch Night is listed as 5:30pm to 8:30pm', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  assert.equal(timeAfterHeading(this.document, 'Pitch Night'), '5:30pm to 8:30pm');
});

Then('Saturday sessions are listed as 9am to 4pm', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  assert.equal(timeAfterHeading(this.document, 'Sessions'), '9am to 4pm');
});

/* Countdown scenarios concern constants in CountdownBar.astro's client script.
   Rather than driving the script in a browser (another area's job — see
   CONTRACT.md and the task brief), this greps the built output for the exact
   instant the script encodes, which is what "the build emits". */
function allBuiltFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...allBuiltFiles(full));
    else out.push(full);
  }
  return out;
}

function buildContainsLiteral(site: BuiltSite, needle: string): boolean {
  return allBuiltFiles(site.outDir).some((f) => {
    if (!/\.(js|mjs|html)$/.test(f)) return false;
    try {
      return readFileSync(f, 'utf8').includes(needle);
    } catch {
      return false;
    }
  });
}

When('the countdown bar is rendered before the event', async function (this: BecampWorld) {
  this.site ??= await buildSite(this.buildOptions);
});

Then('it counts down to Friday 2 October 2026 at 4:30pm Eastern', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(
    buildContainsLiteral(this.site, '2026-10-02T16:30:00-04:00'),
    'built output does not encode the reception start time the countdown targets'
  );
});

/* "The countdown ends when sessions end" is tagged @manual in the feature file:
   verifying the bar removes itself needs the client script actually running
   against a frozen clock, which the task brief reserves for another area. */

When('the home page or the registration page is rendered', async function (this: BecampWorld) {
  this.site ??= await buildSite(this.buildOptions);
  this.scratch.multiDocs = [this.site.page('/'), this.site.page('/register')];
});

Then('it reads {string}', function (this: BecampWorld, expected: string) {
  const docs = (this.scratch.multiDocs as Document[] | undefined) ?? (this.document ? [this.document] : []);
  assert.ok(docs.length > 0, 'no page has been rendered');
  for (const doc of docs) {
    assert.ok(pageText(doc).includes(expected), `page does not read "${expected}"`);
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   faq-accordion.feature
   ══════════════════════════════════════════════════════════════════════════ */

When('a page with FAQs is rendered', async function (this: BecampWorld) {
  await renderPage(this, '/faqs');
});

Then('every answer is hidden', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const details = all(this.document, 'details');
  assert.ok(details.length > 0, 'no FAQ items found');
  for (const d of details) assert.ok(!d.hasAttribute('open'), 'a FAQ item is open by default');
});

/** The "+" span is visible by default and hides itself when the item opens; the
    "−" span is hidden by default and shows itself when the item opens. */
Then('every question shows a {string} indicator', function (this: BecampWorld, indicator: string) {
  assert.ok(this.document, 'no page has been rendered');
  const details = all(this.document, 'details');
  assert.ok(details.length > 0, 'no FAQ items found');
  for (const d of details) {
    const summary = d.querySelector('summary');
    assert.ok(summary, 'FAQ item has no summary');
    const span = all(summary!, 'span').find((s) => text(s) === indicator);
    assert.ok(span, `no "${indicator}" indicator span found`);
    assert.ok(!classList(span).includes('hidden'), `"${indicator}" indicator is not visible by default`);
  }
});

Then('no browser default disclosure triangle is shown', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const summaries = all(this.document, 'summary');
  assert.ok(summaries.length > 0, 'no FAQ summaries found');
  for (const s of summaries) {
    assert.ok(hasClass(s, 'list-none'), 'summary does not suppress the default list marker');
    assert.ok(classList(s).some((c) => c.includes('details-marker')), 'summary does not hide the webkit marker');
  }
});

Then('the "+" and "−" indicators are used instead', function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const details = all(this.document, 'details');
  for (const d of details) {
    const summary = d.querySelector('summary');
    const spans = all(summary!, 'span');
    assert.ok(spans.some((s) => text(s) === '+'), 'no "+" indicator span found');
    assert.ok(spans.some((s) => text(s) === '−'), 'no "−" indicator span found');
  }
});

async function openFaqsPage(world: BecampWorld) {
  world.site ??= await buildSite(world.buildOptions);
  const { page } = await openPage(world.site, '/faqs', world.scratch.browser ?? {});
  world.scratch.page = page;
  return page;
}

Given('a collapsed FAQ question', async function (this: BecampWorld) {
  const page = await openFaqsPage(this);
  this.scratch.faqId = await page.locator('details').first().getAttribute('id');
  assert.ok(this.scratch.faqId, 'no FAQ item found on /faqs');
});

Given('an open FAQ question', async function (this: BecampWorld) {
  const page = await openFaqsPage(this);
  const id = await page.locator('details').first().getAttribute('id');
  assert.ok(id, 'no FAQ item found on /faqs');
  this.scratch.faqId = id;
  await page.locator(`#${id} summary`).click();
  const isOpen = await page.locator(`#${id}`).evaluate((el: any) => el.open);
  assert.ok(isOpen, 'setup failed: the FAQ question did not open');
});

Given('two collapsed FAQ questions', async function (this: BecampWorld) {
  const page = await openFaqsPage(this);
  const ids = await page.locator('details').evaluateAll((els) => els.slice(0, 2).map((el) => el.id));
  assert.equal(ids.length, 2, 'fewer than two FAQ items found on /faqs');
  this.scratch.faqIds = ids;
});

When('the visitor activates it', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page open — set it in a Given step first');
  const id = this.scratch.faqId;
  assert.ok(id, 'no FAQ question selected');
  await page.locator(`#${id} summary`).click();
});

When('they activate a FAQ question', async function (this: BecampWorld) {
  const page = await openFaqsPage(this);
  const id = await page.locator('details').first().getAttribute('id');
  assert.ok(id, 'no FAQ item found on /faqs');
  this.scratch.faqId = id;
  await page.locator(`#${id} summary`).click();
});

When('the visitor opens both', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page open — set it in a Given step first');
  for (const id of this.scratch.faqIds as string[]) {
    await page.locator(`#${id} summary`).click();
  }
});

Then('its answer is shown', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page open');
  const id = this.scratch.faqId;
  assert.ok(id, 'no FAQ question selected');
  const isOpen = await page.locator(`#${id}`).evaluate((el: any) => el.open);
  assert.ok(isOpen, 'FAQ answer is not shown (the <details> is not open)');
});

Then('its answer is hidden', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page open');
  const id = this.scratch.faqId;
  assert.ok(id, 'no FAQ question selected');
  const isOpen = await page.locator(`#${id}`).evaluate((el: any) => el.open);
  assert.ok(!isOpen, 'FAQ answer is still shown (the <details> is open)');
});

Then('both answers are shown', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page open');
  for (const id of this.scratch.faqIds as string[]) {
    const isOpen = await page.locator(`#${id}`).evaluate((el: any) => el.open);
    assert.ok(isOpen, `FAQ question ${id} is not open`);
  }
});

async function indicatorVisible(page: any, id: string, indicator: string): Promise<boolean> {
  const spans = page.locator(`#${id} summary span`);
  const count = await spans.count();
  for (let i = 0; i < count; i++) {
    const span = spans.nth(i);
    if (((await span.textContent()) ?? '').trim() === indicator) return span.isVisible();
  }
  return false;
}

Then('the indicator changes to {string}', async function (this: BecampWorld, indicator: string) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page open');
  assert.ok(await indicatorVisible(page, this.scratch.faqId, indicator), `indicator "${indicator}" is not visible`);
});

Then('the indicator changes back to {string}', async function (this: BecampWorld, indicator: string) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page open');
  assert.ok(await indicatorVisible(page, this.scratch.faqId, indicator), `indicator "${indicator}" is not visible`);
});

Then('the question text changes to the link colour', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page open');
  const id = this.scratch.faqId;
  const span = page.locator(`#${id} summary span`).first();
  const color = await span.evaluate((el: Element) => getComputedStyle(el).color);
  /* --color-link in src/styles/global.css: #51a2ff. */
  assert.equal(color, 'rgb(81, 162, 255)', `question text colour is ${color}, expected the link colour`);
});

/* ══════════════════════════════════════════════════════════════════════════
   faq-deep-links.feature
   ══════════════════════════════════════════════════════════════════════════ */

Given('a FAQ question {string}', function (this: BecampWorld, question: string) {
  this.scratch.faqQuestion = question;
});

function findFaqId(doc: Document, question: string): string | undefined {
  for (const d of all(doc, 'details')) {
    const questionSpan = d.querySelector('summary span');
    if (questionSpan && text(questionSpan) === question) return d.getAttribute('id') ?? undefined;
  }
  return undefined;
}

Then('its anchor is {string}', async function (this: BecampWorld, anchor: string) {
  const question = this.scratch.faqQuestion as string;
  this.site ??= await buildSite(this.buildOptions);
  const id = findFaqId(this.site.page('/faqs'), question) ?? findFaqId(this.site.page('/'), question);
  assert.ok(id, `no FAQ item found for question "${question}"`);
  assert.equal(id, anchor);
});

/* The shared step `it links to {string}` (common.steps.ts) reads
   this.scratch.link. Here it directly follows the shared `the schedule page is
   rendered` step, which this area cannot touch to set it — so this hook (owned
   by this file, not support/ or common.steps.ts) locates the one link this
   scenario cares about right before that assertion runs, and only if nothing
   upstream already set it. */
BeforeStep(function (this: BecampWorld, { pickleStep }: ITestStepHookParameter) {
  const TARGET = 'it links to "/faqs#how-are-topics-decided"';
  if (pickleStep.text !== TARGET || this.scratch.link || !this.document) return;
  const link = all(this.document, 'a').find((a) => a.getAttribute('href') === '/faqs#how-are-topics-decided');
  if (link) this.scratch.link = link;
});

When('the visitor opens {string}', async function (this: BecampWorld, path: string) {
  this.site ??= await buildSite(this.buildOptions);
  const { page } = await openPage(this.site, path, this.scratch.browser ?? {});
  this.scratch.page = page;
});

Then('that question is scrolled into view', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page open');
  await page.waitForTimeout(800); // the deep-link script smooth-scrolls to the item
  const isOpen = await page.locator('#how-are-topics-decided').evaluate((el: any) => el.open);
  assert.ok(isOpen, 'deep-linked FAQ item did not open');
  const box = await page.locator('#how-are-topics-decided').boundingBox();
  assert.ok(box, 'FAQ element not found');
  const viewportHeight = page.viewportSize()?.height ?? 900;
  assert.ok(
    box.y >= -1 && box.y < viewportHeight,
    `FAQ element top (${box.y}) is outside the viewport after following the deep link`
  );
});

Then('it is not hidden behind the sticky header', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page open');
  const scrollMarginTop = await page
    .locator('#how-are-topics-decided')
    .evaluate((el: Element) => getComputedStyle(el).scrollMarginTop);
  assert.notEqual(
    scrollMarginTop,
    '0px',
    'the FAQ element reserves no scroll-margin, so an anchor jump can land it under the sticky header'
  );
});

Then('a shortened set of common questions is shown', async function (this: BecampWorld) {
  assert.ok(this.document, 'no page has been rendered');
  const homeCount = all(this.document, 'details').length;
  assert.ok(homeCount > 0, 'home page has no FAQ items');
  this.site ??= await buildSite(this.buildOptions);
  const fullCount = all(this.site.page('/faqs'), 'details').length;
  assert.ok(homeCount < fullCount, `home page FAQ count (${homeCount}) is not shorter than /faqs (${fullCount})`);
});

Then('a link to {string} offers all of them', function (this: BecampWorld, href: string) {
  assert.ok(this.document, 'no page has been rendered');
  const link = all(this.document, 'a').find((a) => a.getAttribute('href') === href);
  assert.ok(link, `no link to "${href}" found`);
  assert.ok(text(link).length > 0, 'the link has no visible text');
});
