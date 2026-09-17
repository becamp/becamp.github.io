# BDD implementation status

Run the suite: `npm run test:bdd` (add a path to focus: `npm run test:bdd -- docs/bdd/one.feature`).

As of the last run: **404 scenarios — 209 passing, 13 failing, 1 ambiguous, 181
undefined.** (Scenario Outlines inflate the count: each example is a scenario.
`@manual` scenarios are excluded from the total — 17 of them in the session
board alone.)

## Harness — complete

| Piece | What it does |
| --- | --- |
| `support/build.ts` + `build-worker.ts` | Builds the real site per scenario, memoized on its options |
| `support/endpoint.ts` | Drives `api/register.ts` with a fake request/response and stubbed fetch |
| `support/browser.ts` | Playwright over the built output, served on a local HTTP port |
| `support/fixtures.ts` | Airtable records shaped as the API returns them |
| `support/dom.ts`, `world.ts`, `hooks.ts` | Assertions, per-scenario state, teardown |
| `CONTRACT.md` | The rules and shared-step list any further work must follow |

Two properties worth keeping:

- **No request leaves the machine.** `fetch` is replaced in the build worker and
  in the endpoint harness. Airtable URLs are served from fixtures, sponsor logo
  URLs return a real PNG, everything else gets a 204.
- **The repository's own `.env` is never read.** `vite.envDir` points the build
  at a generated one, so credentials in the working tree cannot leak into a run.

Builds run in a **child process per configuration**. This is not an
optimisation — `src/lib/airtable.ts` memoizes the registrant count in a
module-level promise and Vite reuses its SSR module graph, so in-process builds
leaked the first build's data into every later one and made results depend on
scenario order. Do not undo it.

## Areas

| Area | Files | Scenarios | State |
| --- | --- | --- | --- |
| Registration | 11 | 60 pass, 1 fail, 18 undefined | Endpoint and markup done; three browser-driven files outstanding |
| Data layer (`airtable-*`) | 5 | 25 pass | Complete |
| Preview data | 1 | 10 pass | Complete |
| Deploy workflow | 1 | 7 pass | Complete |
| Schedule + sponsors | 9 | undefined | Not started |
| Attendees + content | 7 | undefined | Not started |
| Site-wide | 8 | undefined | Not started |
| Interactive (browser) | 10 | undefined | Not started |
| Session board | 7 | 75 pass, 3 fail, 17 `@manual` | Complete; the three failures are findings 3 and 4 |

The session board area is driven almost entirely through the browser: focus,
its labelling, the idle fade and fullscreen are applied by the page's own
script, so `steps/sessions-board.steps.ts` opens the real built output rather
than reading static markup. Its clock comes from a shifted `Date` rather than a
frozen one, which is what lets the "left running" scenario watch focus hand over
on the board's own 15-second tick.

Outstanding registration files, all needing the browser: 
`registration-form-value-retention`, `registration-double-submit-prevention`,
`registration-recaptcha-client-timeout`.

## Findings — spec and code disagree

**1. A reCAPTCHA response with no score is not logged.**
`registration-recaptcha-scoring.feature:44` ("No usable verdict is treated as
unknown, never as a bot") asserts a warning for every no-verdict case. Two of
the three hold: a network failure logs *"verify request failed"* and a
`success: false` logs *"could not verify"*. But when Google answers
`success: true` with no `score`, `scoreToken` returns `null` silently
(`api/register.ts:56`). The submission is still accepted, which is correct — only
the log is missing, so the case is invisible in the Vercel logs.
**This test is left failing on purpose.** Adding one `console.warn` before that
return would fix it.

**2. `USE_FAKE_DATA` never fakes sponsors.**
`preview-fake-data.feature` originally asserted "no request is made to Airtable"
under preview data. That is wrong: the switch covers the registrant count, the
attendee directory and the Saturday schedule, but `getSponsors()` has no preview
branch, so a preview build still queries the Sponsors table. The scenarios now
name the table they mean. Worth deciding whether sponsors *should* be faked too
— the switch documents itself as "one switch for all preview data".

**3. The board never says the day is over.**
`sessions-board-focus-advance.feature:55` ("After the last session the board
shows no focus") asserts the board *reports* the day as over. After 3:35pm
`focusedSlot()` correctly returns `null` and no row is focused — that half
passes — but the production board then shows nothing at all about the day
having ended: every row falls back to its "Session N" ordinal and the masthead
still reads "Now". The only "day over" wording in `src/pages/sessions.astro` is
inside the `import.meta.env.DEV` debug panel, which is stripped from a real
build. **This test is left failing on purpose.**

**4. The flame backdrop makes short displays scroll.**
`sessions-board-viewport-scaling.feature:7` ("Nothing scrolls") and `:33` ("A
narrower-than-16:9 display scales to its width") both fail at 1024x768. The
board itself is exactly right — `#board` is 768px tall in a 768px viewport at
every size tested — but `Layout.astro`'s `FlameBackdrop` is an absolutely
positioned 645px-tall canvas whose bottom lands at 801px, so the *document*
scrolls 33px even though the grid does not. It is invisible on a 1080p display
and appears on the 4:3 projector the feature file names. The board opts out of
the countdown bar (`countdown={false}`) but not out of the backdrop.
**These two tests are left failing on purpose.**

## Harness flakiness — concurrent builds share `.astro/.prerender`

`sessions-board-rows.feature` intermittently fails with

```
build failed: Cannot find module '<root>/.astro/.prerender/chunks/remote_<hash>.mjs'
  imported from '<root>/.astro/.prerender/prerender-entry.<hash>.mjs'
```

on a varying set of scenarios — 10, then 5, then 0 failures across consecutive
runs of the same unchanged file. It is never an assertion failure: the build
itself dies, so the scenario cannot even render.

`support/build.ts` gives each configuration its own `outDir` under `tmpdir()`,
but Astro's prerender staging directory, `.astro/.prerender`, lives in the
project root and is shared by every build. A build cleans it on entry, so a
child process that has not fully flushed when the next one starts leaves an
entry file pointing at a chunk the next build already deleted.

It bites this file hardest because it drives the most distinct build
configurations of any feature file — four clock settings plus three schedule
overrides — and so runs the most builds in the shortest time. It is worst from
a cold cache: deleting `.astro` before a run reproduced it immediately. Feature
files that build once or twice (`sessions-board-idle-chrome`,
`sessions-board-focus-labelling`) have never shown it.

Re-running is the workaround. The fix belongs in `support/build.ts` — staging
each build's prerender directory per key, as `outDir` already is — and is left
for whoever owns the harness (CONTRACT.md rule 1).

## Harness bug — `openPage`'s clock option does not work

`OpenOptions.now` in `support/browser.ts` has never worked, and nothing used it
before the session board. `tsx` compiles the class inside that init script with
esbuild's name-keeping helper:

```js
class FrozenDate extends RealDate{static{__name(this,"FrozenDate")}...}
```

Playwright serializes the function and runs it in the page, where `__name` does
not exist, so the script throws and the real clock is never replaced. The same
applies to the `hasTouch` init script (`__name(()=>5,"get")`) and to any
`page.evaluate` callback that gives a function a name — assigning an arrow to a
`const`, or to an object property, is enough.

`steps/sessions-board.steps.ts` works around it without touching `support/`: it
passes its clock and its `requestFullscreen` recorder to Playwright **as
strings**, which the transpiler never sees, and keeps named functions out of
every `page.evaluate` body. The fix belongs in `support/browser.ts` — passing
that init script as a string would do it — and is left for whoever owns the
harness (CONTRACT.md rule 1).

## Ambiguity between two existing areas

`the hash is computed` is defined twice, in `steps/attendees-content.steps.ts:311`
and `steps/registration.steps.ts:256`, so `attendees-email-privacy.feature:11`
fails as ambiguous. Both are pre-existing and neither belongs to the session
board; under CONTRACT.md rule 2 the phrase should move to `common.steps.ts`.

## Tagged `@manual`

`cucumber.mjs` runs `not @manual`, so these are excluded from the count rather
than silently passing.

- `registration-tshirt-availability.feature` — "The field is withdrawn when
  shirts are gone". `shirtsAvailable` is a hardcoded `const` in
  `register.astro` with no injection point, so the withdrawn branch is
  unreachable from a test. Same shape as `INCLUDE_UNCONFIRMED` in
  `src/lib/airtable.ts`.
- `sessions-board-debug-clock.feature` — all 16 scenarios, tagged at the
  feature rather than one by one because a single reason covers every one of
  them: the panel is wrapped in `import.meta.env.DEV`, and the harness builds
  production output, where the markup is absent and the script branch is
  dead-stripped (`grep -c 'id="debug"' dist/sessions/index.html` → 0). There is
  no dev-server path in `support/browser.ts` to point at instead. The feature
  says so itself: *"This panel is mockup scaffolding. It is not intended to
  reach the display."*
- `sessions-board-presentation-mode.feature` — "The browser's own exit keeps the
  control in step". Escape leaving fullscreen is browser-chrome behaviour, and
  headless Chromium has no chrome to do it: `page.keyboard.press('Escape')`
  leaves `document.fullscreenElement` set. The board's half of this — re-syncing
  the control whenever fullscreen ends — is covered by "The control returns to
  its resting state on exit", which exits through `document.exitFullscreen()`.

## Notes for whoever continues

- Read `CONTRACT.md` first. Cucumber's step registry is global; the 24 phrases
  shared across areas live in `steps/common.steps.ts` and must not be
  redefined.
- Cucumber matches on declared **function arity**. A step with `{string}` needs
  a parameter in the signature, and rest args (`...args`) count as zero.
- An anonymous `{}` in a step expression also matches a bare word, so a
  specific step and a generic one over the same phrasing will be ambiguous.
  Prefer one anchored regex.
- Several shared steps read as both setup and assertion depending on the area
  (`the attendee directory is unlocked`, `no request is made to Airtable`). They
  branch on what the world already holds; keep that property.
- Nothing you hand to `page.evaluate` or `addInitScript` may *name* a function —
  see the harness-bug section above. An anonymous arrow passed straight to
  `.map()` or `.filter()` is fine; `const helper = () => ...` is not.
- Transitioned properties need to settle before they can be asserted. The
  fullscreen control fades over 200ms and rests at opacity 0.0039, not 0, so
  the idle steps wait for the value and compare with a tolerance.
