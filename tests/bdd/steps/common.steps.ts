/* Steps shared across every area. Cucumber's step registry is global, so
   anything phrased the same way in two feature files MUST live here rather than
   in an area file, or the suite fails with an ambiguous-step error.

   Area step files own only phrasings unique to their area. */

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { buildSite } from '../support/build.js';
import { openPage } from '../support/browser.js';
import { guests } from '../support/fixtures.js';
import { pageText, text, texts, hrefs } from '../support/dom.js';
import type { BecampWorld } from '../support/world.js';

/* ── Page names as the features write them ──────────────────────────────── */

const PAGES: Record<string, string> = {
  home: '/',
  'the home': '/',
  schedule: '/schedule',
  sponsors: '/sponsors',
  attendees: '/attendees',
  about: '/about',
  faqs: '/faqs',
  register: '/register',
  registration: '/register',
  '404': '/404.html',
  'not-found': '/404.html',
  sessions: '/sessions',
};

export const pathFor = (name: string) => {
  const key = name.toLowerCase().replace(/\s+page$/, '').trim();
  const path = PAGES[key] ?? (key.startsWith('/') ? key : undefined);
  if (!path) throw new Error(`Unknown page "${name}". Add it to PAGES in common.steps.ts.`);
  return path;
};

/** Builds if needed, then parks the named page on the world for Then steps. */
export async function render(world: BecampWorld, name: string) {
  world.site ??= await buildSite(world.buildOptions);
  const path = pathFor(name);
  world.currentPage = path;
  world.document = world.site.page(path);
  return world.document;
}

/* ── Registrant counts, which gate several areas ────────────────────────── */

Given('{int} people have registered', function (this: BecampWorld, count: number) {
  this.buildOptions.records = { ...this.buildOptions.records, Guests: guests.many(count) };
});

Given('the registrant count is above the unlock threshold', function (this: BecampWorld) {
  this.buildOptions.records = { ...this.buildOptions.records, Guests: guests.many(25) };
});

Given('the registrant count is below the unlock threshold', function (this: BecampWorld) {
  this.buildOptions.records = { ...this.buildOptions.records, Guests: guests.many(5) };
});

/* ── Build configuration ────────────────────────────────────────────────── */

Given('USE_FAKE_DATA is {string}', function (this: BecampWorld, value: string) {
  this.buildOptions.useFakeData = value === 'true';
});

Given('no Airtable token or base ID is configured', function (this: BecampWorld) {
  this.buildOptions.credentials = false;
});

Given('no Airtable credentials are configured', function (this: BecampWorld) {
  this.buildOptions.credentials = false;
});

Given('Airtable credentials are configured', function (this: BecampWorld) {
  this.buildOptions.credentials = true;
});

/* ── Rendering ──────────────────────────────────────────────────────────── */

/* Anchored regexes rather than {word}: a Cucumber {word} also matches a quoted
   token, which made the bare and quoted forms ambiguous for every page name. */
When(/^the ([a-z0-9-]+) page is rendered$/, async function (this: BecampWorld, name: string) {
  await render(this, name);
});

When(/^the ([a-z0-9-]+) page is rendered with sessions$/, async function (this: BecampWorld, name: string) {
  await render(this, name);
});

When('any page is rendered', async function (this: BecampWorld) {
  await render(this, 'home');
});

When('the site is built', async function (this: BecampWorld) {
  this.site = await buildSite(this.buildOptions);
});

When(/^the "([^"]+)" page is rendered$/, async function (this: BecampWorld, name: string) {
  await render(this, name);
});

/* ── Generic page assertions ────────────────────────────────────────────── */

Then('the page shows {string}', async function (this: BecampWorld, needle: string) {
  /* After an endpoint call with no page open, follow the redirect the endpoint
     actually sent — the banner it names is revealed by the page's own script,
     so this needs a browser rather than the static HTML. */
  if (!this.document && this.response?.redirectUrl) {
    const target = new URL(this.response.redirectUrl);
    this.site ??= await buildSite(this.buildOptions);
    const { page } = await openPage(this.site, `${target.pathname}${target.search}`);
    this.scratch.page = page;
    await page.waitForTimeout(150);
    const rendered = (await page.textContent('body'))?.replace(/\s+/g, ' ') ?? '';
    assert.ok(rendered.includes(needle), `the redirect target does not show "${needle}"`);
    return;
  }
  assert.ok(this.document, 'no page has been rendered');
  const body = pageText(this.document);
  assert.ok(body.includes(needle), `page ${this.currentPage} does not contain "${needle}"`);
});

Then('the page does not show {string}', function (this: BecampWorld, needle: string) {
  assert.ok(this.document, 'no page has been rendered');
  assert.ok(!pageText(this.document).includes(needle), `page ${this.currentPage} unexpectedly contains "${needle}"`);
});

Then('the build succeeds', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.equal(this.site.failure, undefined, `build failed: ${this.site.failure?.message}`);
});

Then('the build fails', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(this.site.failure, 'expected the build to fail, but it completed');
});

/* Two areas assert this: the data layer means "the build made no request", the
   endpoint means "the handler wrote no record". Whichever ran is what is
   checked. */
Then('no request is made to Airtable', function (this: BecampWorld) {
  if (this.response) {
    assert.deepEqual(
      this.response.airtableCalls.map((c) => c.url),
      [],
      'the endpoint wrote to Airtable'
    );
    return;
  }
  assert.ok(this.site, 'neither a build nor an endpoint call has happened');
  assert.deepEqual(
    this.site.requests.map((r) => r.url),
    [],
    'the build requested Airtable'
  );
});

Then('content is read from Airtable', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(this.site.requests.length > 0, 'expected at least one Airtable request');
});

Then('content is fetched from the Airtable API', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(this.site.requests.length > 0, 'expected at least one Airtable request');
});

Then('no request is made to the Airtable API', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.deepEqual(this.site.requests.map((r) => r.url), [], 'expected no Airtable requests');
});

/* ── Navigation, asserted from several areas ────────────────────────────── */

export const navLinks = (doc: Document) =>
  Array.from(doc.querySelectorAll('header nav a')).map((a) => ({
    href: a.getAttribute('href') ?? '',
    label: (a.textContent ?? '').trim(),
  }));

export const footerLinks = (doc: Document) =>
  Array.from(doc.querySelectorAll('#site-footer a')).map((a) => ({
    href: a.getAttribute('href') ?? '',
    label: (a.textContent ?? '').trim(),
  }));

Then('the header navigation has no {string} link', function (this: BecampWorld, label: string) {
  assert.ok(this.document);
  const found = navLinks(this.document).filter((l) => l.label === label);
  assert.deepEqual(found, [], `header still links to "${label}"`);
});

Then('the footer navigation has no {string} link', function (this: BecampWorld, label: string) {
  assert.ok(this.document);
  const found = footerLinks(this.document).filter((l) => l.label === label);
  assert.deepEqual(found, [], `footer still links to "${label}"`);
});

Then(
  'the header navigation includes an {string} link to {string}',
  function (this: BecampWorld, label: string, href: string) {
    assert.ok(this.document);
    const found = navLinks(this.document).find((l) => l.label === label);
    assert.ok(found, `header has no "${label}" link`);
    assert.equal(found.href, href);
  }
);

Then(
  'the footer navigation includes an {string} link to {string}',
  function (this: BecampWorld, label: string, href: string) {
    assert.ok(this.document);
    const found = footerLinks(this.document).find((l) => l.label === label);
    assert.ok(found, `footer has no "${label}" link`);
    assert.equal(found.href, href);
  }
);

Then('the header navigation includes an {string} link', function (this: BecampWorld, label: string) {
  assert.ok(this.document);
  assert.ok(navLinks(this.document).some((l) => l.label === label), `header has no "${label}" link`);
});

export { texts, hrefs };

/* ── Phrases used by more than one area ──────────────────────────────────────
   These live here because Cucumber's registry is global. Several are
   context-dependent; the conventions are documented in tests/bdd/CONTRACT.md.
   `this.scratch.card` carries the element a card assertion applies to, and
   `this.scratch.pageLoad` a function an area sets when it can simulate that
   event. */

Then('the card shows the topic', function (this: BecampWorld) {
  const card = this.scratch.card as Element | undefined;
  assert.ok(card, 'no card was selected — set this.scratch.card first');
  const topic = this.scratch.expectedTopic as string | undefined;
  assert.ok(text(card).length > 0, 'card has no text');
  if (topic) assert.ok(text(card).includes(topic), `card does not show topic "${topic}"`);
});

Then('the card shows the speaker', function (this: BecampWorld) {
  const card = this.scratch.card as Element | undefined;
  assert.ok(card, 'no card was selected — set this.scratch.card first');
  const speaker = this.scratch.expectedSpeaker as string | undefined;
  assert.ok(speaker, 'no expected speaker was recorded — set this.scratch.expectedSpeaker');
  assert.ok(text(card).includes(speaker), `card does not show speaker "${speaker}"`);
});

When('the page load event fires', async function (this: BecampWorld) {
  const fire = this.scratch.pageLoad as (() => Promise<void> | void) | undefined;
  assert.ok(
    fire,
    'this step needs this.scratch.pageLoad to be set by an earlier step in your area'
  );
  await fire();
});

Given('the visitor prefers reduced motion', function (this: BecampWorld) {
  this.scratch.browser = { ...(this.scratch.browser ?? {}), reducedMotion: true };
});

Given('the visitor has JavaScript disabled', function (this: BecampWorld) {
  this.scratch.browser = { ...(this.scratch.browser ?? {}), javaScriptEnabled: false };
});

Given('the visitor is on the home page', async function (this: BecampWorld) {
  this.scratch.startPath = '/';
  await render(this, 'home');
});

When('the visitor presses Escape', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page is open — open one in your area first');
  await page.keyboard.press('Escape');
});

/* Read as an endpoint submission in one area and as a real click in another.
   With a browser page open, submit there; otherwise prepare the request body. */
Given('the visitor submits the registration form', async function (this: BecampWorld) {
  if (this.scratch.page) {
    await this.scratch.page.evaluate(() => {
      const form = document.getElementById('registration-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await this.scratch.page.waitForTimeout(120);
    this.scratch.submitted = true;
    return;
  }
  this.request = {
    ...this.request,
    body: { name: 'Ada Lovelace', email: 'ada@example.com', ...(this.request.body ?? {}) },
  };
  this.scratch.submitted = true;
});

/* The features write the path; the endpoint redirects to an absolute URL on
   whichever allowed origin posted. */
Then('they are redirected to {string}', function (this: BecampWorld, target: string) {
  assert.ok(this.response, 'the endpoint has not been called');
  const url = this.response.redirectUrl ?? '';
  assert.ok(url.endsWith(target), `redirected to ${url}, expected it to end with ${target}`);
});

Then('each venue offers a directions link', function (this: BecampWorld) {
  const scope = (this.scratch.card as Element | undefined) ?? this.document;
  assert.ok(scope, 'nothing to inspect');
  const links = Array.from(scope.querySelectorAll('a')).filter((a) =>
    text(a).toLowerCase().includes('directions')
  );
  assert.ok(links.length > 0, 'no directions link found');
  for (const a of links) {
    assert.match(a.getAttribute('href') ?? '', /google\.com\/maps/, 'directions link is not a map link');
  }
});

Then('it links to {string}', function (this: BecampWorld, target: string) {
  const el = this.scratch.link as Element | undefined;
  assert.ok(el, 'no link was selected — set this.scratch.link first');
  assert.equal(el.getAttribute('href'), target);
});

Then('the link opens in a new tab', function (this: BecampWorld) {
  const el = this.scratch.link as Element | undefined;
  assert.ok(el, 'no link was selected — set this.scratch.link first');
  assert.equal(el.getAttribute('target'), '_blank');
});

/* Read as a precondition in one area and as an outcome in another. With no
   build yet it arranges enough registrants to unlock; either way it then
   asserts the grid is really there. */
Then('the attendee directory is unlocked', async function (this: BecampWorld) {
  if (!this.site) {
    this.buildOptions.records = {
      ...this.buildOptions.records,
      Guests: this.buildOptions.records?.Guests ?? guests.many(25),
    };
  }
  const doc = await render(this, 'attendees');
  assert.ok(
    doc.querySelector('main ul li img[src*="gravatar"]'),
    'the attendee grid is not present, so the directory is still locked'
  );
});

Then('the page does not scroll horizontally', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no browser page is open — open one in your area first');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  assert.ok(overflow <= 1, `page overflows horizontally by ${overflow}px`);
});

Then('no error is surfaced to the visitor', function (this: BecampWorld) {
  /* With a browser open, the honest reading is "nothing threw" — a status
     banner may be showing on purpose, since that is what triggers a restore. */
  if (this.scratch.pageErrors) {
    assert.deepEqual(this.scratch.pageErrors, [], 'the page raised an uncaught error');
    return;
  }
  if (this.response) {
    assert.notEqual(this.response.params.get('status'), 'error', 'the visitor was sent an error');
    return;
  }
  assert.ok(this.document, 'nothing to inspect');
  const banner = this.document.querySelector('#form-status-error');
  assert.ok(
    !banner || (banner.getAttribute('class') ?? '').includes('hidden'),
    'the error banner is visible'
  );
});
