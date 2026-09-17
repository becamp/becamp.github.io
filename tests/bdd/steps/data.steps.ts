/* The build-time data layer in src/lib/airtable.ts, observed through a real
   build: which requests it makes, what it logs, what it writes to the snapshot
   directory, and what ends up in the published HTML. */

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { load as loadYaml } from 'js-yaml';
import { buildSite, snapshots, QUERIES, PROJECT_ROOT, type TableName } from '../support/build.js';
import { guests, schedule, sponsors, TIME_SLOTS } from '../support/fixtures.js';
import { all, text } from '../support/dom.js';
import type { BecampWorld } from '../support/world.js';

const ensureSite = async (world: BecampWorld) => (world.site ??= await buildSite(world.buildOptions));

const requestsFor = (world: BecampWorld, table: string) => {
  assert.ok(world.site, 'no build was run');
  return world.site.requests.filter((r) => r.table === table);
};

/* ── Given: what the tables hold ────────────────────────────────────────── */

Given('Airtable returns records for a table', function (this: BecampWorld) {
  this.buildOptions.records = { Sponsors: sponsors.assorted() };
  this.scratch.table = 'Sponsors';
  this.scratch.query = QUERIES.sponsors;
});

Given('a snapshot exists for a table', function (this: BecampWorld) {
  const records = sponsors.assorted();
  this.buildOptions.snapshots = [{ table: 'Sponsors', params: QUERIES.sponsors, records }];
  this.scratch.table = 'Sponsors';
  this.scratch.query = QUERIES.sponsors;
  this.scratch.snapshotRecords = records;
});

Given('no snapshot exists for a table', function (this: BecampWorld) {
  this.buildOptions.clearSnapshots = true;
  this.buildOptions.snapshots = undefined;
  this.scratch.table = 'Sponsors';
});

Given('the previous build saved a snapshot', function (this: BecampWorld) {
  const records = sponsors.assorted();
  this.buildOptions.snapshots = [{ table: 'Sponsors', params: QUERIES.sponsors, records }];
  this.scratch.snapshotRecords = records;
});

Given(
  'the Guests table is fetched once for the count and once for the directory',
  function (this: BecampWorld) {
    this.buildOptions.records = { Guests: guests.many(25) };
    this.scratch.table = 'Guests';
  }
);

Given('a table named {string}', function (this: BecampWorld, table: string) {
  this.scratch.table = table;
  this.buildOptions.records = { [table as TableName]: schedule.fullDay() } as any;
});

Given('Airtable returns records and no offset', function (this: BecampWorld) {
  this.buildOptions.records = { 'Saturday Schedule': schedule.fullDay() };
  this.scratch.table = 'Saturday Schedule';
  /* No pageSize: one response, no cursor. */
});

Given(
  'Airtable returns records with an offset twice, then records with no offset',
  function (this: BecampWorld) {
    /* Ten slot rows served four at a time: pages of 4, 4 and 2 — the third
       carries no cursor, so the loop stops after three requests. */
    const records = schedule.fullDay();
    assert.equal(records.length, 10, 'the fixture must hold ten rows for a 4/4/2 split');
    this.buildOptions.records = { 'Saturday Schedule': records };
    this.buildOptions.pageSize = 4;
    this.scratch.table = 'Saturday Schedule';
    this.scratch.expectedRecords = records;
  }
);

Given('the snapshot directory cannot be written to', function (this: BecampWorld) {
  /* A file where the directory should be: mkdir and write both fail, which is
     the condition the code swallows as best-effort. */
  snapshots.clear();
  writeFileSync(snapshots.dir, 'not a directory');
  this.scratch.blockedSnapshotDir = true;
  this.buildOptions.records = { Sponsors: sponsors.assorted() };
  this.buildOptions.clearSnapshots = false;
});

Given('the snapshot opt-out is requested', function (this: BecampWorld) {
  this.buildOptions.useSnapshot = true;
});

Given('a build renders eight pages', function (this: BecampWorld) {
  this.buildOptions.records = { Guests: guests.many(25) };
});

Given('the count has been fetched', async function (this: BecampWorld) {
  this.buildOptions.records = { Guests: guests.many(25) };
  await ensureSite(this);
});

/* ── When ───────────────────────────────────────────────────────────────── */

When('the {string} table is requested', async function (this: BecampWorld, table: string) {
  this.scratch.table = table;
  await ensureSite(this);
});

When('the registrant count is requested', async function (this: BecampWorld) {
  await ensureSite(this);
});

When('the attendee list is requested', async function (this: BecampWorld) {
  await ensureSite(this);
});

When('the Saturday schedule is requested', async function (this: BecampWorld) {
  await ensureSite(this);
});

When('the table is fetched', async function (this: BecampWorld) {
  await ensureSite(this);
});

When('the fetch completes', async function (this: BecampWorld) {
  await ensureSite(this);
});

When('both fetches complete', async function (this: BecampWorld) {
  await ensureSite(this);
});

When('a successful fetch tries to save its snapshot', async function (this: BecampWorld) {
  await ensureSite(this);
  if (this.scratch.blockedSnapshotDir) rmSync(snapshots.dir, { force: true });
});

/* One handler: an anonymous {} also matches the bare word "fails", so a
   separate step for that phrasing would be ambiguous with this one. */
When(/^the Airtable request (.+)$/, async function (this: BecampWorld, failure: string) {
  const f = failure.trim();
  const mode =
    f === 'returns a non-OK status' ? 'status' : f === 'exhausts the API quota' ? 'quota' : 'network';
  this.buildOptions.fail = { ...(this.buildOptions.fail ?? {}), Sponsors: mode as any };
  await ensureSite(this);
});

When('that table is requested', async function (this: BecampWorld) {
  await ensureSite(this);
});

When('the header and footer on each page request the registrant count', async function (this: BecampWorld) {
  await ensureSite(this);
});

When('the navigation gate and the directory gate are evaluated', async function (this: BecampWorld) {
  await ensureSite(this);
});

/* ── Then: requests ────────────────────────────────────────────────────── */

Then('an empty list is returned', function (this: BecampWorld) {
  /* Observable as a built site with no content from that table, and no request. */
  assert.ok(this.site, 'no build was run');
  assert.deepEqual(this.site.requests.map((r) => r.url), []);
  assert.equal(this.site.failure, undefined, 'the build should still succeed');
});

Then('a warning naming the skipped table is logged', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const table = this.scratch.table as string;
  assert.ok(
    this.site.logs.warn.some((l) => l.includes('credentials missing') && l.includes(table)),
    `no warning named "${table}". Saw: ${JSON.stringify(this.site.logs.warn)}`
  );
});

Then('one request is made', function (this: BecampWorld) {
  assert.equal(requestsFor(this, this.scratch.table as string).length, 1);
});

Then('every record is returned', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const doc = this.site.page('/schedule');
  /* Every canonical slot has a session in the fixture, so every slot row shows
     one rather than a placeholder. */
  const body = text(doc.body);
  for (const slot of TIME_SLOTS) {
    assert.ok(body.includes(`Session for ${slot}`), `the page is missing the session for ${slot}`);
  }
});

Then('three requests are made', function (this: BecampWorld) {
  assert.equal(requestsFor(this, 'Saturday Schedule').length, 3);
});

Then("each request after the first carries the previous response's offset", function (this: BecampWorld) {
  const reqs = requestsFor(this, 'Saturday Schedule');
  assert.equal(reqs[0].params.get('offset'), null, 'the first request should carry no cursor');
  assert.equal(reqs[1].params.get('offset'), '4');
  assert.equal(reqs[2].params.get('offset'), '8');
});

Then('the returned records are the three pages concatenated', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const body = text(this.site.page('/schedule').body);
  for (const slot of TIME_SLOTS) {
    assert.ok(body.includes(`Session for ${slot}`), `row for ${slot} is missing — a page was dropped`);
  }
});

Then('the table name is URL-encoded in the request path', function (this: BecampWorld) {
  const reqs = requestsFor(this, this.scratch.table as string);
  assert.ok(reqs.length > 0, 'no request was made for that table');
  assert.match(reqs[0].url, /\/Saturday%20Schedule\?/);
});

Then('exactly one request is made to Airtable', function (this: BecampWorld) {
  const counts = requestsFor(this, 'Guests').filter(
    (r) => r.params.toString() === new URLSearchParams(QUERIES.guestCount).toString()
  );
  assert.equal(counts.length, 1, `the count was fetched ${counts.length} times`);
});

Then('every caller receives the same count', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  /* One count, so every page states the same number. */
  const hero = text(this.site.page('/').body);
  const attendees = text(this.site.page('/attendees').body);
  const n = hero.match(/Join your (\d+) peers/)?.[1];
  assert.ok(n, 'the hero does not state a peer count');
  assert.ok(attendees.includes(`${n} people have registered`), 'the pages disagree about the count');
});

Then('both read the same memoized count', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const counts = requestsFor(this, 'Guests').filter(
    (r) => r.params.toString() === new URLSearchParams(QUERIES.guestCount).toString()
  );
  assert.equal(counts.length, 1);
});

Then('they cannot disagree about whether the directory is unlocked', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const navHasLink = text(this.site.page('/').querySelector('header') as Element).includes('Attendees');
  const gridPresent = Boolean(this.site.page('/attendees').querySelector('main ul li img[src*="gravatar"]'));
  assert.equal(navHasLink, gridPresent, 'the navigation gate and the directory gate disagree');
});

Then('the count is zero', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(
    !text(this.site.page('/').body).match(/Join your \d+ peers/),
    'a peer count was shown despite no data'
  );
});

/* ── Then: snapshots ───────────────────────────────────────────────────── */

Then('the records are written to the snapshot directory', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const table = this.scratch.table as TableName;
  const query = this.scratch.query as string;
  assert.ok(snapshots.exists(table, query), 'no snapshot was written');
  assert.ok(snapshots.read(table, query).length > 0, 'the snapshot is empty');
});

Then('the snapshot is keyed by both the table and the query', function (this: BecampWorld) {
  const table = this.scratch.table as TableName;
  const query = this.scratch.query as string;
  const expected = `${table.replace(/[^a-z0-9]+/gi, '-')}-${createHash('md5')
    .update(query)
    .digest('hex')
    .slice(0, 8)}.json`;
  assert.ok(
    snapshots.path(table, query).endsWith(expected),
    'the snapshot filename does not carry both the table and a hash of the query'
  );
});

Then('each is stored under its own snapshot file', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const a = snapshots.path('Guests', QUERIES.guestCount);
  const b = snapshots.path('Guests', QUERIES.guestDirectory);
  assert.notEqual(a, b, 'both Guests queries share one snapshot file');
  assert.ok(existsSync(a), 'the count snapshot is missing');
  assert.ok(existsSync(b), 'the directory snapshot is missing');
});

Then("the snapshot's records are used", function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.equal(this.site.failure, undefined, `the build failed instead of falling back: ${this.site.failure?.message}`);
  const body = text(this.site.page('/sponsors').body);
  assert.ok(body.includes('SpiffWorks'), 'the stale snapshot content was not published');
});

Then('a warning naming the table and the record count is logged', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const expected = (this.scratch.snapshotRecords as unknown[]).length;
  assert.ok(
    this.site.logs.warn.some((l) => l.includes('Sponsors') && l.includes(`${expected} records`)),
    `no warning named the table and ${expected} records. Saw: ${JSON.stringify(this.site.logs.warn)}`
  );
});

Then('the warning is raised as an annotation on the workflow run', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(
    this.site.logs.warn.some((l) => l.startsWith('::warning::')),
    'the warning is not in GitHub Actions annotation form'
  );
});

Then('the error is raised', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(this.site.failure, 'the build did not fail');
});

Then('no hollow site is published', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(this.site.failure, 'the build completed, so a hollow site would have been published');
  assert.ok(!this.site.has('/sponsors'), 'a sponsors page was emitted despite the failure');
});

Then('the fetched records are still returned', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.equal(this.site.failure, undefined, 'a best-effort snapshot write failed the build');
  assert.ok(text(this.site.page('/sponsors').body).includes('SpiffWorks'), 'the fetched content is missing');
});

Then('the build continues', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.equal(this.site.failure, undefined);
});

Then('the content comes from the last snapshot', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.deepEqual(this.site.requests.map((r) => r.url), [], 'the API was queried');
  assert.ok(text(this.site.page('/sponsors').body).includes('SpiffWorks'), 'snapshot content was not used');
});

Then('a line noting the snapshot and its record count is logged', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(
    this.site.logs.log.some((l) => l.includes('using snapshot') && l.includes('API not queried')),
    `no snapshot line was logged. Saw: ${JSON.stringify(this.site.logs.log)}`
  );
});

Then('a warning noting the missing snapshot is logged', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(
    this.site.logs.warn.some((l) => l.includes('snapshot requested but none found')),
    `no missing-snapshot warning. Saw: ${JSON.stringify(this.site.logs.warn)}`
  );
});

Then('the records are fetched live', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(this.site.requests.length > 0, 'no live request was made');
});

/* ── Then: the pages the data feeds ────────────────────────────────────── */

Then('the sponsors section shows only its invitation tiles', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const doc = this.site.page('/sponsors');
  const body = text(doc.body);
  assert.ok(body.includes('Click to become a sponsor'), 'the sponsor invitation is missing');
  assert.ok(body.includes('Click to become a Premier Sponsor'), 'the premier invitation is missing');
});

Then('the schedule shows its placeholder rows', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const doc = this.site.page('/schedule');
  const tbd = all(doc, 'p').filter((p) => text(p) === 'TBD');
  assert.equal(tbd.length, 10, `expected ten TBD rows, found ${tbd.length}`);
});

Then('the attendee directory shows its locked notice', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.match(text(this.site.page('/attendees').body), /The attendee directory unlocks once 20 people/);
});

Then('the attendee directory stays locked', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(
    !this.site.page('/attendees').querySelector('main ul li img[src*="gravatar"]'),
    'the directory grid was rendered'
  );
});

/* ── Preview data ──────────────────────────────────────────────────────── */

Then('the count is {int}', function (this: BecampWorld, expected: number) {
  assert.ok(this.site, 'no build was run');
  assert.match(text(this.site.page('/').body), new RegExp(`Join your ${expected} peers`));
});

Then('{int} sample attendees are returned', function (this: BecampWorld, expected: number) {
  assert.ok(this.site, 'no build was run');
  const cards = all(this.site.page('/attendees'), 'main ul li');
  assert.equal(cards.length, expected);
});

Then('each has an avatar hash derived from a sample address', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const imgs = all(this.site.page('/attendees'), 'main ul li img');
  assert.ok(imgs.length > 0, 'no avatars were rendered');
  for (const img of imgs) {
    assert.match(img.getAttribute('src') ?? '', /secure\.gravatar\.com\/avatar\/[0-9a-f]{32}\?/);
  }
  /* The documented derivation: first.last@example.com, lowercased. */
  const first = text(all(this.site.page('/attendees'), 'main ul li p')[0]);
  const expected = createHash('md5')
    .update(`${first.toLowerCase().replace(/\s+/g, '.')}@example.com`)
    .digest('hex');
  assert.ok(
    imgs.some((i) => (i.getAttribute('src') ?? '').includes(expected)),
    `no avatar matched the documented hash for "${first}"`
  );
});

Then('a full sample day of sessions is returned', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const doc = this.site.page('/schedule');
  const rows = all(doc, 'p').filter((p) => TIME_SLOTS.includes(text(p)));
  assert.equal(rows.length, TIME_SLOTS.length, 'not every canonical slot has a row');
  assert.equal(all(doc, 'p').filter((p) => text(p) === 'TBD').length, 0, 'placeholder rows are still shown');
});

Then(
  'parallel tracks fill the morning and afternoon session blocks',
  function (this: BecampWorld) {
    assert.ok(this.site, 'no build was run');
    const doc = this.site.page('/schedule');
    const tracked = all(doc, '[style*="--tracks"]');
    assert.ok(tracked.length >= 4, `expected several multi-track rows, found ${tracked.length}`);
    for (const row of tracked) {
      assert.match(row.getAttribute('style') ?? '', /--tracks:\s*3/);
    }
  }
);

Then(
  'lunch, lightning talks, the break, the retrospective and drinks occupy single rows',
  function (this: BecampWorld) {
    assert.ok(this.site, 'no build was run');
    const body = text(this.site.page('/schedule').body);
    for (const item of ['Lunch', 'Lightning Talks', 'Break & Sponsor Raffle', 'Retrospective', 'Drinks somewhere']) {
      assert.ok(body.includes(item), `"${item}" is missing from the schedule`);
    }
  }
);

Then('the sample sessions are legible', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const doc = this.site.page('/schedule');
  const grid = all(doc, 'div').find((d) => (d.getAttribute('class') ?? '').includes('divide-divider'));
  assert.ok(grid, 'no schedule grid was found');
  assert.ok(!(grid.getAttribute('class') ?? '').includes('blur-'), 'the grid is still blurred');
});

Then('the grid is not blurred', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.ok(!this.site.html('/schedule').includes('blur-[3px]'), 'the teaser blur is still applied');
});

Then('the navigation includes the {string} link', function (this: BecampWorld, label: string) {
  assert.ok(this.site, 'no build was run');
  const header = this.site.page('/').querySelector('header');
  assert.ok(text(header as Element).includes(label), `the navigation has no "${label}" link`);
});

Then('USE_FAKE_DATA is read from a repository variable', function (this: BecampWorld) {
  const wf = loadYaml(
    readFileSync(join(PROJECT_ROOT, '.github/workflows/deploy-pages.yml'), 'utf8')
  ) as any;
  const env = wf.jobs.build.steps.find((s: any) => s.env?.USE_FAKE_DATA)?.env;
  assert.ok(env, 'no build step sets USE_FAKE_DATA');
  assert.match(env.USE_FAKE_DATA, /\$\{\{\s*vars\.USE_FAKE_DATA\s*\}\}/);
});

/* ── The deploy workflow, asserted against the YAML it declares ────────── */

const workflow = () =>
  loadYaml(readFileSync(join(PROJECT_ROOT, '.github/workflows/deploy-pages.yml'), 'utf8')) as any;

const buildStepEnv = () => {
  const step = workflow().jobs.build.steps.find((s: any) => s.env);
  assert.ok(step, 'no build step declares env');
  return step.env;
};

Given('a push to the main branch', function (this: BecampWorld) {
  const on = workflow().on;
  assert.ok(on.push, 'the workflow does not run on push');
  assert.deepEqual(on.push.branches, ['main']);
  this.scratch.event = 'push';
});

const optOut = (world: BecampWorld) => {
  world.buildOptions.useSnapshot = true;
  /* Every query the build makes needs a snapshot, or the ones without fall
     through to a live fetch and the API is queried after all. */
  world.buildOptions.snapshots = [
    { table: 'Sponsors', params: QUERIES.sponsors, records: sponsors.assorted() },
    { table: 'Guests', params: QUERIES.guestCount, records: guests.many(25) },
    { table: 'Guests', params: QUERIES.guestDirectory, records: guests.many(25) },
    { table: 'Saturday Schedule', params: QUERIES.schedule, records: schedule.fullDay() },
  ];
  world.scratch.table = 'Sponsors';
};

Given('the commit message contains {string}', function (this: BecampWorld, marker: string) {
  this.scratch.commitMessage = `chore: tweak copy ${marker}`;
  /* The workflow expression resolves true for this event, so the build sees
     AIRTABLE_USE_SNAPSHOT=true. */
  assert.equal(snapshotFlagFor(this), true, 'the workflow would not skip the API for this commit');
  optOut(this);
});

Given('the commit message does not contain {string}', function (this: BecampWorld, _marker: string) {
  this.scratch.commitMessage = 'chore: tweak copy';
  assert.equal(snapshotFlagFor(this), false, 'the workflow would skip the API for this commit');
  this.buildOptions.useSnapshot = false;
  this.buildOptions.records = { Sponsors: sponsors.assorted() };
});

Given('the workflow is dispatched manually', function (this: BecampWorld) {
  const on = workflow().on;
  assert.ok('workflow_dispatch' in on, 'the workflow cannot be dispatched manually');
  this.scratch.event = 'workflow_dispatch';
});

Given('the snapshot input is checked', function (this: BecampWorld) {
  const input = workflow().on.workflow_dispatch.inputs?.use_snapshot;
  assert.ok(input, 'the manual run offers no snapshot input');
  assert.equal(input.type, 'boolean');
  assert.equal(input.default, false);
  this.scratch.useSnapshotInput = true;
  assert.equal(snapshotFlagFor(this), true, 'a checked input would not skip the API');
  optOut(this);
});

Given('the scheduled daily build runs', function (this: BecampWorld) {
  const schedules = workflow().on.schedule;
  assert.ok(Array.isArray(schedules) && schedules.length > 0, 'the workflow has no schedule');
  this.scratch.event = 'schedule';
  this.scratch.cron = schedules[0].cron;
});

Given('no one has pushed for a day', function (this: BecampWorld) {
  this.scratch.event = 'schedule';
});

Given('content is edited in Airtable', function (this: BecampWorld) {
  this.scratch.contentEdited = true;
});

Given('a commit is pushed to the main branch', function (this: BecampWorld) {
  const on = workflow().on;
  assert.deepEqual(on.push.branches, ['main']);
  this.scratch.event = 'push';
});

Given('the Saturday schedule has been arranged in Airtable on Pitch Night', function (this: BecampWorld) {
  this.buildOptions.records = { 'Saturday Schedule': schedule.fullDay() };
});

Given('the workflow is dispatched manually with the snapshot input checked', function (this: BecampWorld) {
  const input = workflow().on.workflow_dispatch.inputs?.use_snapshot;
  assert.ok(input, 'the manual run offers no snapshot input');
  this.scratch.event = 'workflow_dispatch';
  this.scratch.useSnapshotInput = true;
  optOut(this);
});

/* AIRTABLE_USE_SNAPSHOT is a GitHub expression; resolve it for the scenario's
   event rather than asserting the raw string. */
const snapshotFlagFor = (world: BecampWorld) => {
  const expr = buildStepEnv().AIRTABLE_USE_SNAPSHOT as string;
  assert.ok(expr, 'the build step does not set AIRTABLE_USE_SNAPSHOT');
  const event = world.scratch.event;
  if (event === 'push') {
    assert.match(expr, /github\.event_name == 'push'/);
    assert.match(expr, /\[skip airtable\]/);
    return String(world.scratch.commitMessage ?? '').includes('[skip airtable]');
  }
  if (event === 'workflow_dispatch') {
    assert.match(expr, /inputs\.use_snapshot == true/);
    return Boolean(world.scratch.useSnapshotInput);
  }
  /* The schedule event matches neither branch of the expression. */
  return false;
};

When('the workflow runs', async function (this: BecampWorld) {
  this.scratch.resolvedSnapshotFlag = snapshotFlagFor(this);
  /* A run is a build: resolve the workflow's flag, then build under it, so the
     assertions that follow can look at what the build actually did. */
  this.buildOptions.records ??= {
    Sponsors: sponsors.assorted(),
    Guests: guests.many(25),
    'Saturday Schedule': schedule.fullDay(),
  };
  await ensureSite(this);
});

Then('the site is built and deployed', function (this: BecampWorld) {
  const wf = workflow();
  assert.ok(wf.jobs.build, 'there is no build job');
  assert.ok(wf.jobs.deploy, 'there is no deploy job');
  assert.deepEqual(wf.jobs.deploy.needs, 'build');
});

Then('fresh sponsors and schedule data are fetched from Airtable', function (this: BecampWorld) {
  assert.equal(snapshotFlagFor(this), false, 'the scheduled build would skip the API');
});

Then('the site is redeployed', function (this: BecampWorld) {
  assert.ok(workflow().jobs.deploy, 'there is no deploy job');
});

Then('the schedule is fetched and published', function (this: BecampWorld) {
  assert.equal(
    snapshotFlagFor(this),
    false,
    'a manual run without the snapshot box would skip the API'
  );
});

Then('the schedule page renders the full grid rather than the teaser', async function (this: BecampWorld) {
  this.buildOptions.useFakeData = true;
  const site = await buildSite(this.buildOptions);
  assert.ok(!site.html('/schedule').includes('blur-[3px]'), 'the grid is still teased');
});

Then('a read-only token is preferred', function (this: BecampWorld) {
  const token = buildStepEnv().AIRTABLE_TOKEN as string;
  assert.match(token, /secrets\.AIRTABLE_READ_TOKEN\s*\|\|/);
});

Then('the write-scoped token is used only if no read-only token is provisioned', function (this: BecampWorld) {
  const token = buildStepEnv().AIRTABLE_TOKEN as string;
  assert.match(token, /secrets\.AIRTABLE_READ_TOKEN\s*\|\|\s*secrets\.AIRTABLE_TOKEN/);
});

When('the workflow definition is read', function (this: BecampWorld) {
  this.scratch.steps = workflow().jobs.build.steps.concat(workflow().jobs.deploy.steps);
});

Then('every third-party action is pinned to a commit SHA', function (this: BecampWorld) {
  const steps = this.scratch.steps as any[];
  const uses = steps.map((s) => s.uses).filter(Boolean);
  assert.ok(uses.length > 0, 'the workflow uses no actions');
  for (const u of uses) {
    assert.match(u, /@[0-9a-f]{40}$/, `"${u}" is not pinned to a commit SHA`);
  }
});

Then('no mutable tag is used for a job that holds the Airtable token', function (this: BecampWorld) {
  const uses = workflow().jobs.build.steps.map((s: any) => s.uses).filter(Boolean);
  for (const u of uses) {
    assert.doesNotMatch(u, /@v\d/, `"${u}" is pinned to a mutable tag`);
  }
});

Then('the change appears on the site after the next daily rebuild', function (this: BecampWorld) {
  const cron = workflow().on.schedule[0].cron;
  const [minute, hour, dom, month, dow] = String(cron).split(/\s+/);
  assert.equal(dom, '*');
  assert.equal(month, '*');
  assert.equal(dow, '*', 'the rebuild does not run every day');
  assert.match(minute, /^\d+$/);
  assert.match(hour, /^\d+$/);
});

Then('the scheduled build runs at {int}:{int}am Eastern', function (this: BecampWorld, h: number, m: number) {
  const cron = String(workflow().on.schedule[0].cron);
  const [minute, hour] = cron.split(/\s+/);
  /* The cron is UTC; Eastern Daylight Time is UTC-4. */
  assert.equal(Number(minute), m);
  assert.equal((Number(hour) - 4 + 24) % 24, h, `cron "${cron}" is not ${h}:${String(m).padStart(2, '0')} Eastern`);
});

Then('no request is made to the Airtable API for that table', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  assert.deepEqual(this.site.requests.map((r) => r.url), []);
});

Then('published content is never more than a day old', function (this: BecampWorld) {
  const schedules = workflow().on.schedule;
  assert.ok(schedules?.length, 'nothing rebuilds the site on a schedule');
  assert.equal(snapshotFlagFor({ ...this, scratch: { event: 'schedule' } } as BecampWorld), false);
});

Then('the newest snapshot is restored from the workflow cache', function (this: BecampWorld) {
  const cache = workflow().jobs.build.steps.find((s: any) => String(s.uses ?? '').includes('actions/cache'));
  assert.ok(cache, 'the workflow does not cache the snapshot directory');
  assert.equal(cache.with.path, '.airtable-cache');
  assert.match(String(cache.with['restore-keys']), /airtable-snapshot-/);
});

Then('the run saves its own snapshot under a fresh key', function (this: BecampWorld) {
  const cache = workflow().jobs.build.steps.find((s: any) => String(s.uses ?? '').includes('actions/cache'));
  assert.ok(cache, 'the workflow does not cache the snapshot directory');
  assert.match(String(cache.with.key), /\$\{\{\s*github\.run_id\s*\}\}/);
});

When('a new workflow run starts', function (this: BecampWorld) {
  this.scratch.event = 'push';
});

/* Scoped to one table: USE_FAKE_DATA fakes the count, directory and schedule
   but never sponsors, so a build in preview mode still queries Sponsors. */
Then(/^no (Guests|Saturday Schedule|Sponsors) request is made to Airtable$/, function (this: BecampWorld, table: string) {
  assert.ok(this.site, 'no build was run');
  assert.deepEqual(
    requestsFor(this, table).map((r) => r.url),
    [],
    `the build queried ${table}`
  );
});


/* ── Remaining preview and schedule steps ──────────────────────────────── */

/* The unquoted form in an Examples table: `unset`, `"false"`, `"1"`, `"TRUE"`.
   Only the exact string "true" turns preview data on. */
Given(/^USE_FAKE_DATA is (unset)$/, function (this: BecampWorld, _raw: string) {
  this.buildOptions.useFakeData = false;
  this.buildOptions.records = {
    Sponsors: sponsors.assorted(),
    Guests: guests.many(3),
    'Saturday Schedule': schedule.fullDay(),
  };
});

When('the schedule page is rendered before Pitch Night', async function (this: BecampWorld) {
  /* Today is before the reveal instant, so an ordinary build is the teased
     state; the assertion is that preview data lifts it anyway. */
  assert.ok(
    Date.now() < new Date('2026-10-02T20:30:00-04:00').getTime(),
    'this scenario only means anything before the Pitch Night reveal'
  );
  this.site = await buildSite(this.buildOptions);
  this.currentPage = '/schedule';
  this.document = this.site.page('/schedule');
});

When('the deploy workflow runs', function (this: BecampWorld) {
  this.scratch.event = 'push';
});

When('no manual build is triggered', function (this: BecampWorld) {
  this.scratch.event = 'schedule';
});

/* Concurrency is internal to one build: the header and footer both await the
   same memoized promise while it is still in flight. One request proves it. */
Given('two callers request the count before the first has resolved', function (this: BecampWorld) {
  this.buildOptions.records = { Guests: guests.many(25) };
});

When('both awaits settle', async function (this: BecampWorld) {
  await ensureSite(this);
});

Then('only one request was made', function (this: BecampWorld) {
  const counts = requestsFor(this, 'Guests').filter(
    (r) => r.params.toString() === new URLSearchParams(QUERIES.guestCount).toString()
  );
  assert.equal(counts.length, 1, `the count was fetched ${counts.length} times`);
});

Then('both receive the same count', function (this: BecampWorld) {
  assert.ok(this.site, 'no build was run');
  const hero = text(this.site.page('/').body).match(/Join your (\d+) peers/)?.[1];
  const attendees = text(this.site.page('/attendees').body).match(/(\d+) people have registered/)?.[1];
  assert.ok(hero && attendees, 'a page did not state the count');
  assert.equal(hero, attendees);
});
