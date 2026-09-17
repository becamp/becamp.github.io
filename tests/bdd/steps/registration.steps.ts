/* Registration: the endpoint in api/register.ts, and the form markup and client
   script in src/pages/register.astro.

   Most of this area is endpoint behaviour, driven directly through
   callEndpoint() — no browser, no network, one assertion per observable fact. */

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { buildSite } from '../support/build.js';
import {
  callEndpoint,
  FIELD_IDS,
  HONEYPOT_FIELD,
  type EndpointEnv,
} from '../support/endpoint.js';
import { openPage } from '../support/browser.js';
import { all, text } from '../support/dom.js';
import type { BecampWorld } from '../support/world.js';

const FULL_ENV: EndpointEnv = {
  AIRTABLE_TOKEN: 'test-token',
  AIRTABLE_BASE_ID: 'testbase',
  AIRTABLE_TABLE: 'Guests',
};

/* The features write an absent value as the bare word `absent` and an empty one
   as "" in an Examples table. */
const literal = (raw: string) => {
  const v = raw.trim();
  if (v === 'absent') return undefined;
  if (v === '""') return '';
  return v.replace(/^"|"$/g, '');
};

const env = (world: BecampWorld): EndpointEnv => world.endpointEnv ?? FULL_ENV;

async function submit(world: BecampWorld) {
  world.response = await callEndpoint(world.request, env(world), world.endpointStubs);
  return world.response;
}

const body = (world: BecampWorld) => (world.request.body ??= {});

/* ── Given: the submission ───────────────────────────────────────────────── */

Given('the registration endpoint has valid Airtable credentials', function (this: BecampWorld) {
  this.endpointEnv = { ...env(this), ...FULL_ENV };
});

Given('the request origin is an allowed origin', function (this: BecampWorld) {
  this.request.origin = 'https://be.camp';
});

Given('a visitor has filled in their name and email address', function (this: BecampWorld) {
  Object.assign(body(this), { name: 'Ada Lovelace', email: 'ada@example.com' });
});

Given('a complete registration submission', function (this: BecampWorld) {
  Object.assign(body(this), {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    'attend-reception': 'on',
    'attend-friday': 'on',
    'attend-saturday': 'on',
    'attendee-directory': 'on',
    'volunteer-friday': 'on',
    'volunteer-saturday': 'on',
  });
});

Given(
  'a visitor has checked the reception, Pitch Night and Saturday boxes',
  function (this: BecampWorld) {
    Object.assign(body(this), {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      'attend-reception': 'on',
      'attend-friday': 'on',
      'attend-saturday': 'on',
    });
  }
);

Given('they have checked {string}', function (this: BecampWorld, label: string) {
  const map: Record<string, string> = {
    'Yes, I can help out on Friday!': 'volunteer-friday',
    'Yes, I can help out on Saturday!': 'volunteer-saturday',
  };
  const field = map[label];
  assert.ok(field, `no form field is known for "${label}"`);
  body(this)[field] = 'on';
});

Given(
  'a submission where the name is {} and the email is {}',
  function (this: BecampWorld, rawName: string, rawEmail: string) {
    const name = literal(rawName);
    const email = literal(rawEmail);
    if (name !== undefined) body(this).name = name;
    if (email !== undefined) body(this).email = email;
  }
);

Given('a submission with the name {string}', function (this: BecampWorld, name: string) {
  body(this).name = name;
});

Given('the email {string}', function (this: BecampWorld, email: string) {
  body(this).email = email;
});

Given('a submission where the field {string} contains any value', function (this: BecampWorld, field: string) {
  Object.assign(body(this), { name: 'Bot', email: 'bot@example.test', [field]: 'anything' });
});

Given('a submission where {string} is {string}', function (this: BecampWorld, field: string, value: string) {
  Object.assign(body(this), { name: 'Ada Lovelace', email: 'ada@example.com', [field]: value });
});

Given('{string} is absent', function (this: BecampWorld, field: string) {
  delete body(this)[field];
});

Given('a submission with a T-shirt size of {string}', function (this: BecampWorld, size: string) {
  Object.assign(body(this), { name: 'Ada', email: 'a@b.test', 'shirt-size': size });
});

Given('a submission with no T-shirt size', function (this: BecampWorld) {
  Object.assign(body(this), { name: 'Ada', email: 'a@b.test' });
  delete body(this)['shirt-size'];
});

Given('a POST whose origin is {}', function (this: BecampWorld, raw: string) {
  this.request.method = 'POST';
  this.request.origin = literal(raw) ?? '';
  Object.assign(body(this), { name: 'Ada', email: 'a@b.test' });
});

Given('a POST from {string}', function (this: BecampWorld, origin: string) {
  this.request.method = 'POST';
  this.request.origin = origin;
  Object.assign(body(this), { name: 'Ada', email: 'a@b.test' });
});

/* ── Given: reCAPTCHA and Airtable conditions ───────────────────────────── */

Given('RECAPTCHA_SECRET_KEY is configured on the endpoint', function (this: BecampWorld) {
  this.endpointEnv = { ...env(this), RECAPTCHA_SECRET_KEY: 'test-secret' };
  body(this)['recaptcha-token'] = 'a-token';
  Object.assign(body(this), { name: 'Ada', email: 'ada@example.com' });
});

Given('RECAPTCHA_SECRET_KEY is not configured', function (this: BecampWorld) {
  const next = { ...env(this) };
  delete next.RECAPTCHA_SECRET_KEY;
  this.endpointEnv = next;
  Object.assign(body(this), { name: 'Ada', email: 'ada@example.com' });
});

Given('the bot threshold is {float}', function (this: BecampWorld, threshold: number) {
  /* Asserted against the endpoint's own constant rather than assumed. */
  assert.equal(threshold, 0.2, 'the feature and the endpoint disagree on the bot threshold');
});

Given('VERCEL_ENV is {string}', function (this: BecampWorld, value: string) {
  this.endpointEnv = { ...env(this), VERCEL_ENV: value };
});

Given('Google returns a score of {float} for the token', function (this: BecampWorld, score: number) {
  this.endpointStubs.recaptcha = { success: true, score };
});

Given('the token verification {}', function (this: BecampWorld, outcome: string) {
  const o = outcome.trim();
  if (o === 'fails with a network error') this.endpointStubs.recaptcha = 'network-error';
  else if (o === 'returns success false with an error code') {
    this.endpointStubs.recaptcha = { success: false, errorCodes: ['timeout-or-duplicate'] };
  } else if (o === 'returns success true but carries no score') {
    this.endpointStubs.recaptcha = { success: true };
  } else throw new Error(`unknown verification outcome "${outcome}"`);
});

Given('the submitted token is the sentinel {string}', function (this: BecampWorld, token: string) {
  body(this)['recaptcha-token'] = token;
});

Given('the submission carries no reCAPTCHA token', function (this: BecampWorld) {
  delete body(this)['recaptcha-token'];
});

Given('Airtable responds with a non-OK status', function (this: BecampWorld) {
  this.endpointStubs.airtable = { ok: false, status: 422, body: 'UNKNOWN_FIELD_NAME' };
  Object.assign(body(this), { name: 'Ada', email: 'a@b.test' });
});

Given('the environment variable {} is not set', function (this: BecampWorld, variable: string) {
  const next = { ...FULL_ENV } as Record<string, string | undefined>;
  delete next[variable.trim()];
  this.endpointEnv = next as EndpointEnv;
  Object.assign(body(this), { name: 'Ada', email: 'a@b.test' });
});

Given('processing the submission throws an unexpected error', function (this: BecampWorld) {
  /* A body that is not an object makes the handler's own field reads throw,
     which is the unexpected-error path without stubbing the handler. */
  this.request.body = Object.create({
    get name() {
      throw new Error('simulated unexpected failure');
    },
  });
  this.scratch.expectUnexpected = true;
});

Given('a column in the Guests table is renamed', function (this: BecampWorld) {
  /* Renaming a column cannot break a write keyed by field ID. The observable
     consequence is that the request body carries only field IDs — asserted in
     the Then step. */
  Object.assign(body(this), { name: 'Ada', email: 'a@b.test' });
  this.scratch.expectFieldIdsOnly = true;
});

/* ── When ───────────────────────────────────────────────────────────────── */

When('the submission reaches the registration endpoint', async function (this: BecampWorld) {
  await submit(this);
});

When('a submission reaches the registration endpoint', async function (this: BecampWorld) {
  await submit(this);
});

When('it reaches the registration endpoint', async function (this: BecampWorld) {
  await submit(this);
});

When('they submit the registration form', async function (this: BecampWorld) {
  await submit(this);
});

When('a registration is submitted', async function (this: BecampWorld) {
  await submit(this);
});

When('the submission is processed', async function (this: BecampWorld) {
  await submit(this);
});

When('the record is written to Airtable', async function (this: BecampWorld) {
  await submit(this);
});

When('the endpoint handles it', async function (this: BecampWorld) {
  await submit(this);
});

When('the hash is computed', async function (this: BecampWorld) {
  await submit(this);
});

When('a {} request reaches the registration endpoint', async function (this: BecampWorld, method: string) {
  this.request.method = literal(method);
  await submit(this);
});

When('the endpoint sends the visitor back to the form', async function (this: BecampWorld) {
  Object.assign(body(this), { name: 'Ada', email: 'a@b.test' });
  await submit(this);
});

/* ── Then: redirects and status ─────────────────────────────────────────── */

Then('the response status is {int}', function (this: BecampWorld, status: number) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.equal(this.response.status, status);
});

Then('the response body is {string}', function (this: BecampWorld, expected: string) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.equal(this.response.body, expected);
});

Then('the submission is accepted for processing', function (this: BecampWorld) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.notEqual(this.response.status, 403, 'the origin was rejected');
  assert.notEqual(this.response.status, 405, 'the method was rejected');
  assert.equal(this.response.redirectStatus, 303, 'the endpoint did not redirect back to the form');
});

Then('the submission is accepted', function (this: BecampWorld) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.equal(this.response.params.get('status'), 'success');
});

Then('the visitor is redirected to {string}', function (this: BecampWorld, target: string) {
  assert.ok(this.response, 'the endpoint has not been called');
  const url = this.response.redirectUrl ?? '';
  assert.ok(url.endsWith(target), `redirected to ${url}, expected it to end with ${target}`);
});

Then('the visitor is redirected with the reason {string}', function (this: BecampWorld, reason: string) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.equal(this.response.params.get('status'), 'error');
  assert.equal(this.response.params.get('reason'), reason);
});

Then('the redirect status is {int}', function (this: BecampWorld, status: number) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.equal(this.response.redirectStatus, status);
});

Then('a browser reload of the result does not repost the form', function (this: BecampWorld) {
  assert.ok(this.response, 'the endpoint has not been called');
  /* 303 is what turns the POST into a GET; 302/307 would repost. */
  assert.equal(this.response.redirectStatus, 303);
});

Then('the redirect target begins with {string}', function (this: BecampWorld, prefix: string) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.ok(
    (this.response.redirectUrl ?? '').startsWith(prefix),
    `redirected to ${this.response.redirectUrl}, expected it to start with ${prefix}`
  );
});

Then('the response is indistinguishable from a real success', function (this: BecampWorld) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.equal(this.response.redirectStatus, 303);
  assert.equal(this.response.params.get('status'), 'success');
  assert.equal(this.response.params.get('reason'), null, 'a reason would give the bot a signal');
});

/* ── Then: the Airtable record ──────────────────────────────────────────── */

Then('no record is created in Airtable', function (this: BecampWorld) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.deepEqual(this.response.airtableCalls.map((c) => c.url), []);
});

Then('one record is created in the Airtable Guests table', function (this: BecampWorld) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.equal(this.response.airtableCalls.length, 1);
  assert.match(this.response.airtableCalls[0].url, /\/testbase\/Guests$/);
});

Then('the record is created in Airtable', function (this: BecampWorld) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.equal(this.response.airtableCalls.length, 1, 'expected exactly one Airtable write');
  assert.equal(this.response.params.get('status'), 'success');
});

Then('the record is still written successfully', function (this: BecampWorld) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.equal(this.response.params.get('status'), 'success');
  const fields = this.response.airtableFields ?? {};
  for (const key of Object.keys(fields)) {
    assert.match(key, /^fld[A-Za-z0-9]+$/, `field key "${key}" is not an immutable field ID`);
  }
});

const fieldEntry = (world: BecampWorld, id: string) => {
  assert.ok(world.response, 'the endpoint has not been called');
  const fields = world.response.airtableFields;
  assert.ok(fields, 'the endpoint sent no record to Airtable');
  assert.ok(id in fields, `the record has no field ${id}`);
  return fields[id];
};

/* One handler for every "<thing> is written to field <id>" line: the field ID
   the feature names is checked against the one the endpoint actually uses, so a
   changed ID fails here rather than silently 422ing in production. */
const WRITTEN_FIELDS: Record<string, { id: string; value: unknown }> = {
  'the name': { id: FIELD_IDS.name, value: 'Ada Lovelace' },
  'the email': { id: FIELD_IDS.email, value: 'ada@example.com' },
  'the reception choice': { id: FIELD_IDS.reception, value: true },
  'the Pitch Night choice': { id: FIELD_IDS.pitchNight, value: true },
  'the Saturday choice': { id: FIELD_IDS.saturday, value: true },
  'the directory permission': { id: FIELD_IDS.directory, value: true },
  'the Friday volunteering choice': { id: FIELD_IDS.volunteerFriday, value: true },
  'the Saturday volunteering choice': { id: FIELD_IDS.volunteerSaturday, value: true },
};

Then(/^(the .+?) is written to field "([^"]+)"$/, function (this: BecampWorld, what: string, id: string) {
  const expected = WRITTEN_FIELDS[what];
  assert.ok(expected, `no field is known for "${what}"`);
  assert.equal(id, expected.id, `the feature names ${id} for ${what}, the endpoint uses ${expected.id}`);
  assert.equal(fieldEntry(this, id), expected.value);
});

Then('the record stores the name {string}', function (this: BecampWorld, value: string) {
  assert.equal(fieldEntry(this, FIELD_IDS.name), value);
});

Then('the record stores the email {string}', function (this: BecampWorld, value: string) {
  assert.equal(fieldEntry(this, FIELD_IDS.email), value);
});

Then('the created record marks each checked box as true', function (this: BecampWorld) {
  for (const id of [FIELD_IDS.reception, FIELD_IDS.pitchNight, FIELD_IDS.saturday]) {
    assert.equal(fieldEntry(this, id), true, `field ${id} should be true`);
  }
});

Then('the created record marks every unchecked box as false', function (this: BecampWorld) {
  for (const id of [FIELD_IDS.directory, FIELD_IDS.volunteerFriday]) {
    assert.equal(fieldEntry(this, id), false, `field ${id} should be false`);
  }
});

Then('the Saturday attendance field is true', function (this: BecampWorld) {
  assert.equal(fieldEntry(this, FIELD_IDS.saturday), true);
});

Then('the Friday volunteering field is false', function (this: BecampWorld) {
  assert.equal(fieldEntry(this, FIELD_IDS.volunteerFriday), false);
});

Then('field {string} is set to {string}', function (this: BecampWorld, id: string, value: string) {
  assert.equal(fieldEntry(this, id), value);
});

Then('no T-shirt size field is sent', function (this: BecampWorld) {
  assert.ok(this.response, 'the endpoint has not been called');
  const fields = this.response.airtableFields ?? {};
  assert.ok(!(FIELD_IDS.shirtSize in fields), 'a T-shirt size was sent');
});

/* ── Then: reCAPTCHA ───────────────────────────────────────────────────── */

Then('no verification request is sent to Google', function (this: BecampWorld) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.deepEqual(this.response.recaptchaCalls.map((c) => c.url), []);
});

/* ── Then: logs ────────────────────────────────────────────────────────── */

const anyLog = (world: BecampWorld, level: 'log' | 'warn' | 'error', re: RegExp) => {
  assert.ok(world.response, 'the endpoint has not been called');
  const lines = world.response.logs[level];
  assert.ok(
    lines.some((l) => re.test(l)),
    `no ${level} line matched ${re}. Saw: ${JSON.stringify(lines)}`
  );
};

Then('a warning naming the submitted email is written to the logs', function (this: BecampWorld) {
  anyLog(this, 'warn', /bot@example\.test/);
});

Then('an autofill victim can be told apart from a bot in those logs', function (this: BecampWorld) {
  anyLog(this, 'warn', /Honeypot tripped/);
});

Then('a warning noting the submission was accepted unverified is logged', function (this: BecampWorld) {
  anyLog(this, 'warn', /accepting unverified/i);
});

Then('an error noting submissions are accepted without bot verification is logged', function (this: BecampWorld) {
  anyLog(this, 'error', /without bot verification/i);
});

Then('an error noting the missing configuration is logged', function (this: BecampWorld) {
  anyLog(this, 'error', /Airtable env vars missing/i);
});

Then('the status and response body are logged', function (this: BecampWorld) {
  anyLog(this, 'error', /Airtable error.*422|422.*UNKNOWN_FIELD_NAME/s);
});

Then('the error is logged', function (this: BecampWorld) {
  anyLog(this, 'error', /Registration failed/i);
});

Then('they never see a bare function error page', function (this: BecampWorld) {
  assert.ok(this.response, 'the endpoint has not been called');
  assert.equal(this.response.redirectStatus, 303, 'the visitor was not redirected back to the form');
  assert.equal(this.response.status, undefined, 'a raw status was sent instead of a redirect');
});

/* ── The form markup ───────────────────────────────────────────────────── */

const registerDoc = async (world: BecampWorld) => {
  world.site ??= await buildSite(world.buildOptions);
  world.currentPage = '/register';
  world.document = world.site.page('/register');
  return world.document;
};

Given('shirts are marked as available', function (this: BecampWorld) {
  /* shirtsAvailable is a hardcoded const in register.astro and is currently
     true; the available branch is what a build renders. */
  this.scratch.shirtsAvailable = true;
});

Given('the T-shirt field is shown', async function (this: BecampWorld) {
  await registerDoc(this);
});

Then('a {string} field is shown', async function (this: BecampWorld, label: string) {
  const doc = this.document ?? (await registerDoc(this));
  const found = all(doc, 'label').some((l) => text(l).startsWith(label));
  assert.ok(found, `no field labelled "${label}"`);
});

Then('it is labelled as free while supplies last', function (this: BecampWorld) {
  assert.ok(this.document);
  const label = all(this.document, 'label').find((l) => text(l).startsWith('T-shirt Size'));
  assert.ok(label, 'no T-shirt Size label');
  assert.match(text(label), /free, while supplies last/);
});

Then(
  'the options are {string}, {string}, {string}, {string} and {string}',
  function (this: BecampWorld, a: string, b: string, c: string, d: string, e: string) {
    const expected = [a, b, c, d, e];
    assert.ok(this.document);
    const options = all(this.document, '#shirt-size option').map((o) => o.getAttribute('value'));
    assert.deepEqual(options, expected);
  }
);

Then('the value sent matches an option name in the Airtable {string} field', function (this: BecampWorld, _field: string) {
  assert.ok(this.document);
  const options = all(this.document, '#shirt-size option').map((o) => o.getAttribute('value'));
  /* The endpoint forwards the value verbatim, so the form's own option list is
     the contract with the base's single-select. */
  assert.ok(options.length > 0, 'the form offers no sizes');
  for (const o of options) {
    assert.ok(o && o === o.trim() && o.toLowerCase() === o, `option "${o}" is not a tidy option name`);
  }
});

Then('the honeypot wrapper is positioned off-screen', async function (this: BecampWorld) {
  const doc = this.document ?? (await registerDoc(this));
  const input = doc.querySelector(`#${HONEYPOT_FIELD}`);
  assert.ok(input, 'no honeypot input');
  const wrapper = input.closest('div');
  assert.ok(wrapper, 'the honeypot has no wrapper');
  assert.match(wrapper.getAttribute('class') ?? '', /-left-\[9999px\]/);
});

Then('the wrapper is marked aria-hidden', function (this: BecampWorld) {
  assert.ok(this.document);
  const input = this.document.querySelector(`#${HONEYPOT_FIELD}`);
  const wrapper = input?.closest('div');
  assert.equal(wrapper?.getAttribute('aria-hidden'), 'true');
});

Then('the honeypot input has tabindex {string}', function (this: BecampWorld, value: string) {
  assert.ok(this.document);
  assert.equal(this.document.querySelector(`#${HONEYPOT_FIELD}`)?.getAttribute('tabindex'), value);
});

Then('the honeypot input has autocomplete {string}', function (this: BecampWorld, value: string) {
  assert.ok(this.document);
  assert.equal(this.document.querySelector(`#${HONEYPOT_FIELD}`)?.getAttribute('autocomplete'), value);
});

/* ── The status banners, in a real browser ─────────────────────────────── */

const openRegister = async (world: BecampWorld, query: string) => {
  world.site ??= await buildSite({ ...world.buildOptions, label: 'register banners' });
  const opened = await openPage(world.site, `/register${query}`, {
    session: world.scratch.seed as Record<string, string> | undefined,
  });
  world.scratch.page = opened.page;
  collectPageErrors(world, opened.page);
  return opened.page;
};

/* Uncaught page errors are the observable form of "no error is surfaced". */
export const collectPageErrors = (world: BecampWorld, page: any) => {
  world.scratch.pageErrors = [];
  page.on('pageerror', (err: Error) => world.scratch.pageErrors.push(err.message));
};

Given(
  'the visitor has been redirected back to the registration form with an error',
  function (this: BecampWorld) {
    this.scratch.query = '?status=error';
  }
);

Given('the query string carries the reason {string}', function (this: BecampWorld, reason: string) {
  this.scratch.query = `?status=error&reason=${reason}`;
});

Given('the query string carries a status of error and no reason', function (this: BecampWorld) {
  this.scratch.query = '?status=error';
});

Given('a visitor has been redirected to {string}', function (this: BecampWorld, target: string) {
  const q = target.indexOf('?');
  this.scratch.query = q === -1 ? '' : target.slice(q);
});

Given('the visitor opens {string} with no query string', function (this: BecampWorld, _path: string) {
  this.scratch.query = '';
});

When('the page finishes loading', async function (this: BecampWorld) {
  const page = this.scratch.page ?? (await openRegister(this, (this.scratch.query as string) ?? ''));
  await page.waitForLoadState('load');
  /* The banner work runs on astro:page-load, which has already fired by then;
     give the handler a turn to settle. */
  await page.waitForTimeout(150);
});

When('the error banner is shown', async function (this: BecampWorld) {
  const page = await openRegister(this, '?status=error&reason=airtable');
  await page.waitForTimeout(150);
});

const bannerHidden = async (world: BecampWorld, id: string) => {
  const page = world.scratch.page;
  assert.ok(page, 'no page is open');
  return page.evaluate(
    (sel: string) => document.querySelector(sel)?.classList.contains('hidden') ?? null,
    `#${id}`
  );
};

Then('the error banner is no longer hidden', async function (this: BecampWorld) {
  assert.equal(await bannerHidden(this, 'form-status-error'), false, 'the error banner is still hidden');
});

Then('the success banner is no longer hidden', async function (this: BecampWorld) {
  assert.equal(await bannerHidden(this, 'form-status-success'), false, 'the success banner is still hidden');
});

Then('the error banner stays hidden', async function (this: BecampWorld) {
  assert.equal(await bannerHidden(this, 'form-status-error'), true, 'the error banner was revealed');
});

Then('the success banner stays hidden', async function (this: BecampWorld) {
  assert.equal(await bannerHidden(this, 'form-status-success'), true, 'the success banner was revealed');
});

Then('the error banner reads {}', async function (this: BecampWorld, raw: string) {
  const expected = literal(raw);
  /* Some scenarios assert the copy straight after an endpoint call, without
     having opened the form. Take the reason the endpoint gave and load the page
     the visitor would actually land on. */
  if (!this.scratch.page) {
    assert.ok(this.response, 'neither a page nor an endpoint response to read a reason from');
    const reason = this.response.params.get('reason');
    const page = await openRegister(this, `?status=error${reason ? `&reason=${reason}` : ''}`);
    await page.waitForTimeout(150);
  }
  const page = this.scratch.page;
  const actual = (await page.textContent('#form-status-error-message'))?.replace(/\s+/g, ' ').trim();
  assert.equal(actual, expected);
});

Then('the error banner offers to register them by hand over email', async function (this: BecampWorld) {
  if (!this.scratch.page) {
    const page = await openRegister(this, '?status=error&reason=captcha');
    await page.waitForTimeout(150);
  }
  const page = this.scratch.page;
  const copy = (await page.textContent('#form-status-error'))?.replace(/\s+/g, ' ') ?? '';
  assert.match(copy, /email us and we'll register you by hand/);
  const href = await page.getAttribute('#form-status-error a[href^="mailto:"]', 'href');
  assert.ok(href, 'no mailto link is offered');
});

/* ── The client-side stash, in a real browser ──────────────────────────── */

Given('a visitor submits the registration form', async function (this: BecampWorld) {
  this.site ??= await buildSite({ ...this.buildOptions, label: 'stash' });
  const opened = await openPage(this.site, '/register');
  this.scratch.page = opened.page;
  const page = opened.page;

  /* Fill something into every kind of field, including the honeypot, so the
     exclusions are observable. */
  await page.fill('#guest-name', 'Ada Lovelace');
  await page.fill('#email', 'ada@example.com');
  await page.selectOption('#shirt-size', 'large');
  await page.check('#attendee-directory');
  await page.fill(`#${HONEYPOT_FIELD}`, 'autofilled');
  await page.evaluate(() => {
    const t = document.getElementById('recaptcha-token') as HTMLInputElement | null;
    if (t) t.value = 'a-single-use-token';
  });

  /* Submitting would navigate to an endpoint that is not running here. The
     stash is written by the form's own submit handler, so dispatch the event
     and prevent the navigation. */
  await page.evaluate(() => {
    const form = document.getElementById('registration-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => e.preventDefault(), { capture: true });
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(100);
});

When('the form values are stashed for the round trip', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'the form was not submitted');
  this.scratch.stash = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('becamp:registration') ?? 'null')
  );
  assert.ok(this.scratch.stash, 'nothing was written to sessionStorage');
});

Then('the field {string} is excluded', function (this: BecampWorld, field: string) {
  const stash = this.scratch.stash as Record<string, unknown>;
  assert.ok(stash, 'no stash was read');
  assert.ok(!(field in stash), `"${field}" was persisted: ${JSON.stringify(stash)}`);
});

Then('the honeypot field is excluded from the stash', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'the form was not submitted');
  const stash = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('becamp:registration') ?? 'null')
  );
  assert.ok(stash, 'nothing was written to sessionStorage');
  assert.ok(!(HONEYPOT_FIELD in stash), `the honeypot was persisted: ${JSON.stringify(stash)}`);
});

Then('it offers a mailto link to the organizers', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  const href = await page.getAttribute('#form-status-error a[href^="mailto:"]', 'href');
  assert.ok(href, 'the error banner has no mailto link');
  this.scratch.mailto = href;
});

Then('the link subject is {string}', function (this: BecampWorld, subject: string) {
  const href = this.scratch.mailto as string | undefined;
  assert.ok(href, 'no mailto link was captured');
  const query = href.slice(href.indexOf('?') + 1);
  assert.equal(new URLSearchParams(query).get('subject'), subject);
});

Then("it promises the visitor's details are kept below", async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  const copy = (await page.textContent('#form-status-error'))?.replace(/\s+/g, ' ') ?? '';
  assert.match(copy, /details are kept below/);
});

Then('the banner is scrolled to the centre of the viewport', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  const centred = await page.evaluate(() => {
    const el = document.getElementById('form-status-success');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const middle = rect.top + rect.height / 2;
    return Math.abs(middle - window.innerHeight / 2) < window.innerHeight / 2;
  });
  assert.equal(centred, true, 'the banner was not scrolled into view');
});

When('a size is submitted', async function (this: BecampWorld) {
  const doc = this.document ?? (await registerDoc(this));
  const first = all(doc, '#shirt-size option')[0]?.getAttribute('value');
  assert.ok(first, 'the form offers no sizes');
  Object.assign(body(this), { name: 'Ada', email: 'a@b.test', 'shirt-size': first });
  await submit(this);
});

/* ── The client script, in a real browser ────────────────────────────────────
   Three behaviours live only at runtime: the sessionStorage stash that carries
   answers across a failed round trip, the submit-button lock, and the bounded
   reCAPTCHA wait. The form posts to an endpoint that is not running here, so
   every scenario intercepts the navigation and inspects what the page did. */

const STASH_KEY = 'becamp:registration';

/* Opens /register with reCAPTCHA either absent or stubbed. The real script can
   never load (no network), so window.grecaptcha is installed before any page
   script runs, with the behaviour the scenario needs. */
async function openForm(
  world: BecampWorld,
  opts: {
    siteKey?: string;
    grecaptcha?: 'resolves' | 'never-answers' | 'rejects' | 'both-race' | 'absent';
    storage?: Record<string, string>;
    query?: string;
  } = {}
) {
  world.site ??= await buildSite({
    ...world.buildOptions,
    ...(opts.siteKey === undefined ? {} : { recaptchaSiteKey: opts.siteKey }),
    label: 'register client',
  });

  const { page } = await openPage(world.site, `/register${opts.query ?? ''}`, {
    session: opts.storage,
  });
  world.scratch.page = page;
  collectPageErrors(world, page);

  /* The real reCAPTCHA script can never load here, so a stub is installed
     before any page script runs. Its behaviour is chosen later by setting
     window.__recaptchaMode, because the scenario's When decides it. */
  await page.addInitScript(() => {
    (window as any).__recaptchaMode = 'absent';
    Object.defineProperty(window, 'grecaptcha', {
      configurable: true,
      get() {
        const mode = (window as any).__recaptchaMode;
        if (mode === 'absent') return undefined;
        return {
          ready(cb: () => void) {
            cb();
          },
          execute() {
            if (mode === 'resolves') return Promise.resolve('a-real-token');
            if (mode === 'rejects') return Promise.reject(new Error('blocked'));
            return new Promise((resolve) => {
              /* both-race answers only after the five-second fallback. */
              if (mode === 'both-race') setTimeout(() => resolve('late-token'), 5000);
            });
          },
        };
      },
    });
  });
  await page.reload({ waitUntil: 'load' });

  /* Count the POST the form actually makes, and abort it so the page stays put.
     Counting real requests beats patching form.submit: it measures what would
     reach the endpoint, which is what "submitted once" means. */
  world.scratch.posts = [];
  await page.route('**/api/register', (route) => {
    if (route.request().method() === 'POST') {
      world.scratch.posts.push(route.request().postData() ?? '');
      /* 204 rather than abort: a navigation answered with No Content leaves the
         browser on the current page, so the form and its button stay
         inspectable while the POST is still recorded. Aborting tore the
         document down and every later assertion timed out. */
      return route.fulfill({ status: 204, body: '' });
    }
    return route.continue();
  });

  return page;
}

const postCount = (world: BecampWorld) => (world.scratch.posts as string[] | undefined)?.length ?? 0;

/* Selects which stub behaviour the page's next submit will see. A bare string
   assignment, so it survives a re-evaluate on any page state. */
async function installGrecaptcha(world: BecampWorld, mode: string) {
  const page = world.scratch.page;
  assert.ok(page, 'no page is open');
  await page.evaluate(`window.__recaptchaMode = ${JSON.stringify(mode)}`);
}

const fillForm = async (world: BecampWorld) => {
  const page = world.scratch.page;
  assert.ok(page, 'no page is open');
  await page.fill('#guest-name', 'Ada Lovelace');
  await page.fill('#email', 'ada@example.com');
  await page.selectOption('#shirt-size', 'large');
  await page.check('#attendee-directory');
  await page.uncheck('#attend-friday');
};

const dispatchSubmit = async (world: BecampWorld) => {
  const page = world.scratch.page;
  assert.ok(page, 'no page is open');
  /* requestSubmit fires the submit event and, if nothing prevents it, performs
     the real POST — which the route above records and aborts. */
  await page.evaluate(() => {
    const form = document.getElementById('registration-form') as HTMLFormElement;
    form.requestSubmit();
  });
  await page.waitForTimeout(200);
};

/* ── Value retention ───────────────────────────────────────────────────── */

Given('a visitor has filled in the registration form', async function (this: BecampWorld) {
  await openForm(this);
  await fillForm(this);
});

When('they submit it', async function (this: BecampWorld) {
  await dispatchSubmit(this);
});

When('the form values are stashed', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  this.scratch.stash = await page.evaluate(
    (key: string) => JSON.parse(sessionStorage.getItem(key) ?? 'null'),
    STASH_KEY
  );
});

Then('every named text, select and checkbox value is written to sessionStorage', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  const stash = await page.evaluate(
    (key: string) => JSON.parse(sessionStorage.getItem(key) ?? 'null'),
    STASH_KEY
  );
  assert.ok(stash, 'nothing was written to sessionStorage');
  assert.equal(stash.name, 'Ada Lovelace');
  assert.equal(stash.email, 'ada@example.com');
  assert.equal(stash['shirt-size'], 'large');
  assert.equal(stash['attendee-directory'], true);
  this.scratch.stash = stash;
});

Then('checkbox fields are stored as booleans', function (this: BecampWorld) {
  const stash = this.scratch.stash as Record<string, unknown>;
  assert.ok(stash, 'no stash was read');
  for (const field of ['attend-reception', 'attend-friday', 'attend-saturday', 'attendee-directory']) {
    assert.equal(typeof stash[field], 'boolean', `${field} was stored as ${typeof stash[field]}`);
  }
  assert.equal(stash['attend-friday'], false, 'an unchecked box should be stored false');
});

Given('a submission failed and the visitor is back on the form', function (this: BecampWorld) {
  this.scratch.query = '?status=error&reason=airtable';
});

Given('a submission succeeded and the visitor is back on the form', function (this: BecampWorld) {
  this.scratch.query = '?status=success';
});

Given('a stash exists from that submission', function (this: BecampWorld) {
  this.scratch.seed = {
    [STASH_KEY]: JSON.stringify({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      'shirt-size': 'medium',
      'attend-reception': false,
      'attend-friday': true,
      'attend-saturday': true,
      'attendee-directory': true,
      'volunteer-friday': true,
      'volunteer-saturday': false,
    }),
  };
});

Given('the stashed value is not valid JSON', function (this: BecampWorld) {
  this.scratch.seed = { [STASH_KEY]: '{not json' };
  this.scratch.query = '?status=error&reason=airtable';
});

Given('the stash contains a field the current form no longer has', function (this: BecampWorld) {
  this.scratch.seed = {
    [STASH_KEY]: JSON.stringify({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      'a-field-that-was-removed': 'legacy value',
    }),
  };
  this.scratch.query = '?status=error&reason=airtable';
});

Given('sessionStorage cannot be written to', async function (this: BecampWorld) {
  await openForm(this);
  const page = this.scratch.page;
  await page.evaluate(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new DOMException('denied', 'SecurityError');
      },
    });
  });
  await fillForm(this);
});

const openWithSeed = async (world: BecampWorld) => {
  const page = await openForm(world, {
    storage: world.scratch.seed as Record<string, string> | undefined,
    query: (world.scratch.query as string) ?? '',
  });
  await page.waitForTimeout(200);
  return page;
};

When('the form attempts to restore it', async function (this: BecampWorld) {
  await openWithSeed(this);
});

When('the form is restored', async function (this: BecampWorld) {
  await openWithSeed(this);
});

Then('each text and select field is refilled from the stash', async function (this: BecampWorld) {
  const page = this.scratch.page ?? (await openWithSeed(this));
  assert.equal(await page.inputValue('#guest-name'), 'Ada Lovelace');
  assert.equal(await page.inputValue('#email'), 'ada@example.com');
  assert.equal(await page.inputValue('#shirt-size'), 'medium');
});

Then('each checkbox is restored to its stashed checked state', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  assert.equal(await page.isChecked('#attend-reception'), false, 'a false box was restored checked');
  assert.equal(await page.isChecked('#attend-friday'), true);
  assert.equal(await page.isChecked('#volunteer-friday'), true);
  assert.equal(await page.isChecked('#volunteer-saturday'), false);
});

Then('the stash is removed from sessionStorage', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  const stash = await page.evaluate((key: string) => sessionStorage.getItem(key), STASH_KEY);
  assert.equal(stash, null, 'the stash survived a successful registration');
});

Then('the submission still proceeds', async function (this: BecampWorld) {
  await dispatchSubmit(this);
  await this.scratch.page.waitForTimeout(200);
  assert.ok(postCount(this) >= 1, 'the submission did not reach the endpoint');
});

Then('no fields are changed', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  assert.equal(await page.inputValue('#guest-name'), '', 'a field was filled from an unreadable stash');
  assert.equal(await page.inputValue('#email'), '');
});

Then('the unknown field is ignored', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  const errors: string[] = this.scratch.pageErrors ?? [];
  assert.deepEqual(errors, [], 'restoring threw on the unknown field');
});

Then('every field the form still has is restored', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  assert.equal(await page.inputValue('#guest-name'), 'Ada Lovelace');
  assert.equal(await page.inputValue('#email'), 'ada@example.com');
});

/* ── Double submit ─────────────────────────────────────────────────────── */

When('they click {string}', async function (this: BecampWorld, label: string) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  assert.match(label, /Submit Registration/);
  await page.click('#registration-submit');
  await page.waitForTimeout(120);
});

Then('the submit button becomes disabled', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  assert.equal(await page.isDisabled('#registration-submit'), true);
});

Then('the submit button reads {string}', async function (this: BecampWorld, label: string) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  assert.equal((await page.textContent('#registration-submit'))?.trim(), label);
});

Given('the visitor has clicked submit', async function (this: BecampWorld) {
  await openForm(this, { siteKey: 'test-key' });
  await installGrecaptcha(this, 'never-answers');
  await fillForm(this);
  await this.scratch.page.click('#registration-submit');
  await this.scratch.page.waitForTimeout(120);
});

Given('the form is waiting on a reCAPTCHA token', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  const token = await page.inputValue('#recaptcha-token');
  assert.equal(token, '', 'a token already arrived, so the form is not waiting');
});

When('they click the submit button again', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  this.scratch.submitsBefore = postCount(this);
  await page.click('#registration-submit', { force: true });
  await page.waitForTimeout(200);
});

Then('no second submission is sent', function (this: BecampWorld) {
  assert.equal(postCount(this), this.scratch.submitsBefore, 'the form posted a second time');
});

When('the submit button is disabled', async function (this: BecampWorld) {
  await openForm(this, { siteKey: 'test-key' });
  await installGrecaptcha(this, 'never-answers');
  await fillForm(this);
  await this.scratch.page.click('#registration-submit');
  await this.scratch.page.waitForTimeout(120);
});

Then('it is rendered at reduced opacity', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  const opacity = await page.evaluate(() => {
    const b = document.getElementById('registration-submit')!;
    return getComputedStyle(b).opacity;
  });
  assert.ok(Number(opacity) < 1, `the disabled button is at full opacity (${opacity})`);
});

/* ── The bounded reCAPTCHA wait ────────────────────────────────────────── */

Given('the reCAPTCHA script has loaded', async function (this: BecampWorld) {
  await openForm(this, { siteKey: 'test-key' });
  await fillForm(this);
  this.scratch.recaptchaLoaded = true;
});

Given('a content blocker prevented the reCAPTCHA script from loading', async function (this: BecampWorld) {
  /* The site key is set, so the form's handler is bound — but grecaptcha stays
     undefined, which is exactly what a blocker leaves behind. */
  await openForm(this, { siteKey: 'test-key' });
  await installGrecaptcha(this, 'absent');
  await fillForm(this);
  const defined = await this.scratch.page.evaluate('typeof window.grecaptcha');
  assert.equal(defined, 'undefined', 'grecaptcha should be absent for this scenario');
});

Given('PUBLIC_RECAPTCHA_SITE_KEY is not set', async function (this: BecampWorld) {
  this.buildOptions.recaptchaSiteKey = undefined;
  this.site = await buildSite({ ...this.buildOptions, label: 'no recaptcha' });
  this.document = this.site.page('/register');
  this.currentPage = '/register';
});

Given('the visitor arrives on the registration page by client-side navigation', async function (this: BecampWorld) {
  /* Open the form first so the stub and the POST route are installed, then
     navigate away and back through the client router. */
  const page = await openForm(this, { siteKey: 'test-key' });
  await page.click('a[href="/"]');
  await page.waitForTimeout(250);
  await page.click('a[href="/register"]');
  await page.waitForTimeout(400);
  this.scratch.pageLoad = async () => {
    await page.evaluate(() => document.dispatchEvent(new Event('astro:page-load')));
    await page.waitForTimeout(100);
  };
});

When('the visitor submits the form', async function (this: BecampWorld) {
  await dispatchSubmit(this);
});

When('reCAPTCHA returns a token within five seconds', async function (this: BecampWorld) {
  /* Installed before the submit so the handler sees it. */
  await installGrecaptcha(this, 'resolves');
  await dispatchSubmit(this);
});

When('reCAPTCHA has not answered after five seconds', async function (this: BecampWorld) {
  await installGrecaptcha(this, 'never-answers');
  await dispatchSubmit(this);
  await this.scratch.page.waitForTimeout(5200);
});

When('the reCAPTCHA token request rejects', async function (this: BecampWorld) {
  await installGrecaptcha(this, 'rejects');
  await dispatchSubmit(this);
  await this.scratch.page.waitForTimeout(200);
});

When('the five-second fallback and the token both reach the finish line', async function (this: BecampWorld) {
  await installGrecaptcha(this, 'both-race');
  await dispatchSubmit(this);
  /* Past the 5s fallback and the 5s late token, so both have fired. */
  await this.scratch.page.waitForTimeout(5600);
});

Then('the token is placed in the hidden {string} field', async function (this: BecampWorld, field: string) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  assert.equal(await page.inputValue(`#${field}`), 'a-real-token');
});

Then('the hidden {string} field is set to {string}', async function (this: BecampWorld, field: string, value: string) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  assert.equal(await page.inputValue(`#${field}`), value);
});

Then('the form is submitted once', function (this: BecampWorld) {
  assert.equal(postCount(this), 1, `the form posted ${postCount(this)} times`);
});

Then('the form is submitted exactly once', function (this: BecampWorld) {
  assert.equal(postCount(this), 1, `the form posted ${postCount(this)} times`);
});

Then('Airtable receives no duplicate row', function (this: BecampWorld) {
  assert.equal(postCount(this), 1, 'a second post would have written a duplicate row');
});

Then('the submission proceeds as a plain form post', async function (this: BecampWorld) {
  const page = this.scratch.page;
  await page.waitForTimeout(200);
  assert.ok(postCount(this) >= 1, 'the submission was swallowed');
  assert.equal(await page.inputValue('#recaptcha-token'), '', 'a token was invented without the script');
});

Then(
  'the endpoint treats the absent token as unverified rather than as a bot',
  async function (this: BecampWorld) {
    /* The client's side is an empty token; the endpoint's side is asserted
       here directly, since that is where the decision is made. */
    const res = await callEndpoint(
      { body: { name: 'Ada', email: 'ada@example.com' } },
      { ...FULL_ENV, RECAPTCHA_SECRET_KEY: 'test-secret' }
    );
    assert.equal(res.recaptchaCalls.length, 0, 'the endpoint spent a round trip on an absent token');
    assert.equal(res.params.get('status'), 'success');
  }
);

Then('no reCAPTCHA script tag is present', function (this: BecampWorld) {
  assert.ok(this.document, 'the page was not rendered');
  const scripts = all(this.document, 'script[src]').map((s) => s.getAttribute('src') ?? '');
  assert.deepEqual(
    scripts.filter((s) => s.includes('recaptcha')),
    []
  );
});

Then('the honeypot still guards the form', function (this: BecampWorld) {
  assert.ok(this.document, 'the page was not rendered');
  assert.ok(this.document.querySelector(`#${HONEYPOT_FIELD}`), 'the honeypot is missing');
});

Then('the submit handler is bound to the current form', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  const bound = await page.evaluate(
    () => document.getElementById('registration-form')?.dataset.recaptchaBound
  );
  assert.equal(bound, '1', 'the reCAPTCHA handler was not bound after navigation');
});

Then('it is not bound a second time on a repeat event', async function (this: BecampWorld) {
  const page = this.scratch.page;
  assert.ok(page, 'no page is open');
  await page.evaluate(() => document.dispatchEvent(new Event('astro:page-load')));
  await page.waitForTimeout(100);
  await installGrecaptcha(this, 'resolves');
  await dispatchSubmit(this);
  await page.waitForTimeout(250);
  assert.equal(postCount(this), 1, `a double binding posted ${postCount(this)} times`);
});
