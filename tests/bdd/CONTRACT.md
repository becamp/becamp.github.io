# Step-definition contract

Read this before writing any step definition. Cucumber's step registry is
**global**: two definitions whose text matches the same step make the whole
suite fail with an ambiguous-step error. This document is what keeps parallel
work from colliding.

## Rules

1. **Own only your area's step file.** Never edit `steps/common.steps.ts`,
   another area's step file, or anything in `support/`. If you need a change
   there, say so in your report instead of making it.
2. **Never redefine a shared phrase.** The phrases listed under *Shared
   phrases* below already exist in `common.steps.ts`. If a step in your feature
   files matches one, it is already implemented — leave it alone.
3. **Assert real behaviour.** No step may pass by doing nothing. If a scenario
   cannot be honestly automated, do not fake it — see *Untestable scenarios*.
4. **Never edit a `.feature` file.** They are the specification. If one is
   wrong or untestable, report it.
5. **Never change `src/`, `api/`, or config** to make a test pass. If a feature
   file describes behaviour the code does not have, report it as a finding — a
   failing test that reveals a real gap is a result, not a problem to hide.

## Running

```
npx cucumber-js docs/bdd/<your-file>.feature     # one file
npm run test:bdd                                  # everything
```

Always prefix with the loader, or use the npm script:
`ASTRO_TELEMETRY_DISABLED=1 NODE_OPTIONS="--import tsx/esm" npx cucumber-js ...`

## The World

Every step runs with `this` typed as `BecampWorld` (`support/world.ts`):

| Field | Purpose |
| --- | --- |
| `buildOptions` | Accumulated by Given steps; consumed by the first render |
| `site` | The `BuiltSite` once something has built |
| `document` | The page a Then step asserts against |
| `currentPage` | Path of that page |
| `request` / `endpointEnv` / `endpointStubs` | Registration endpoint inputs |
| `response` | `EndpointResult` after calling the endpoint |
| `scratch` | Free-form, for your area only |

Import the world type, never construct it:

```ts
import type { BecampWorld } from '../support/world.js';
Then('something', function (this: BecampWorld) { ... });
```

## Building the site (`support/build.ts`)

`buildSite(options)` builds the real site in a **child process** and memoizes
on the options, so asking twice for the same configuration is free.

Process isolation is deliberate: `src/lib/airtable.ts` memoizes the registrant
count in a module-level promise, and Vite reuses its SSR module graph between
builds in one process. In-process builds leaked the first build's data into
later ones. Do not try to build in-process.

```ts
const site = await buildSite({
  credentials: true,          // AIRTABLE_TOKEN + BASE_ID in import.meta.env
  useFakeData: false,         // USE_FAKE_DATA
  useSnapshot: false,         // AIRTABLE_USE_SNAPSHOT
  recaptchaSiteKey: 'k',      // PUBLIC_RECAPTCHA_SITE_KEY (omit to leave unset)
  formEndpoint: 'https://...',// PUBLIC_FORM_ENDPOINT
  records: { Sponsors: [...], Guests: [...], 'Saturday Schedule': [...] },
  fail: { Sponsors: 'network' | 'status' | 'quota' },
  pageSize: 2,                // serve tables paginated, with Airtable's offset
  snapshots: [{ table, params, records }],  // plant a snapshot first
  clearSnapshots: true,
});
```

What comes back:

| Member | Meaning |
| --- | --- |
| `site.page('/schedule')` | Parsed `Document` (linkedom) |
| `site.html('/schedule')` | Raw HTML string |
| `site.has('/sessions')` | Whether the page was emitted |
| `site.requests` | Every Airtable request, in order: `{ url, table, params, authorization }` |
| `site.logs` | `{ log, warn, error }` — console output captured during the build |
| `site.failure` | Set when the build threw rather than completing |
| `site.snapshotFiles` | Snapshot filenames present afterwards |

`QUERIES` exports the exact query strings the app uses, for snapshot keys.
`snapshots.read/exists/clear` inspect the snapshot directory.

**No request leaves the machine.** `fetch` is replaced in the worker: Airtable
URLs are served from `records`, logo URLs return a real PNG, everything else
gets a 204. The repository's own `.env` is never read — `vite.envDir` points at
a generated one.

## The registration endpoint (`support/endpoint.ts`)

```ts
const res = await callEndpoint(
  { method: 'POST', origin: 'https://be.camp', body: { name: 'Ada', email: 'a@b.c' } },
  { RECAPTCHA_SECRET_KEY: 's', AIRTABLE_TOKEN: 't', AIRTABLE_BASE_ID: 'b', AIRTABLE_TABLE: 'Guests' },
  { recaptcha: { success: true, score: 0.1 }, airtable: { ok: false, status: 500 } }
);
```

`res` gives `status`, `body`, `redirectStatus`, `redirectUrl`, `params`
(parsed from the redirect query string), `airtableFields` (the record the
handler sent), `airtableCalls`, `recaptchaCalls`, `calls`, and `logs`.

Also exported: `FIELD_IDS`, `ALLOWED_ORIGINS`, `HONEYPOT_FIELD`, `BOT_SCORE`,
`DEFAULT_ENDPOINT_ENV`. Env vars are saved and restored around every call.

## Fixtures (`support/fixtures.ts`)

`sponsors.assorted() / withLevels() / tied() / cashValues() / nameless()`,
`guests.many(count, optedIn) / named()`,
`schedule.sessions() / parallel(time, tracks) / fullDay()`,
plus `TIME_SLOTS` and `logo()`. Records are shaped exactly as Airtable returns
them, so the code under test does its own reading and coercion.

## DOM helpers (`support/dom.ts`)

`text`, `texts`, `all`, `hrefs`, `linkByText`, `containsText`, `pageText`,
`meta`, `hasClass`, `classList`.

## Shared phrases — already implemented, do not redefine

```
any page is rendered
content is fetched from the Airtable API
content is read from Airtable
each venue offers a directions link
it links to {string}
no error is surfaced to the visitor
no request is made to Airtable
no request is made to the Airtable API
the attendee directory is unlocked
the attendees page is rendered
the build fails
the build succeeds
the card shows the speaker
the card shows the topic
the header navigation has no {string} link
the header navigation includes an {string} link
the header navigation includes an {string} link to {string}
the footer navigation has no {string} link
the footer navigation includes an {string} link to {string}
the home page is rendered
the link opens in a new tab
the page does not scroll horizontally
the page does not show {string}
the page load event fires
the page shows {string}
the registration page is rendered
the schedule page is rendered
the site is built
the visitor has JavaScript disabled
the visitor is on the home page
the visitor prefers reduced motion
the visitor presses Escape
the visitor submits the registration form
they are redirected to {string}
{int} people have registered
Airtable credentials are configured
no Airtable credentials are configured
no Airtable token or base ID is configured
USE_FAKE_DATA is {string}
```

Two conventions make the context-dependent shared phrases work:

- **`the card shows the topic` / `the card shows the speaker`** read
  `this.scratch.card` (an `Element`). Set it in your own step before using them.
- **`the page load event fires`** is satisfied by `this.scratch.pageLoad`, a
  function your area sets when it has a way to simulate that.

## Untestable scenarios

Some scenarios genuinely cannot be asserted from this harness — a GPU driver
failing, a cron firing, a browser's own back-button heuristic. Do **not** write
a step that pretends. Instead:

1. Add a `@manual` tag on the line directly above that `Scenario:`, and
2. list it in your report with one sentence on why.

`cucumber.mjs` runs `not @manual`, so tagged scenarios are excluded from the
count rather than silently passing. This is the only sanctioned way to leave a
scenario unimplemented, and every use must be justified.

Editing the feature file to add a tag is the one exception to rule 4.

## Your report

End with:

- Scenarios passing / failing / tagged `@manual`, as numbers.
- Any step in `common.steps.ts` that did not behave as this document says.
- Any **finding**: a feature file that describes behaviour the code does not
  have. Name the file, the scenario, and what actually happens. Do not fix it.
