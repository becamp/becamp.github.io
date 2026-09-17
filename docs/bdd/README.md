# Behaviour specifications

One Gherkin feature file per observable behaviour of the beCamp site, extracted
from the source rather than written ahead of it. 59 files, 328 scenarios.

These describe what the site does as someone outside it can observe: what a
visitor sees, what the registration endpoint answers, what a build publishes.
They are not unit tests and name no functions or files.

Every file parses with `@cucumber/gherkin`. No runner is wired up yet, so these
are executable specifications in form only — the step definitions are still to
be written.

## Registration

| File | Behaviour |
| --- | --- |
| `registration-form-submission.feature` | A complete registration is saved and confirmed |
| `registration-missing-required-fields.feature` | Name and email are required; whitespace is trimmed |
| `registration-honeypot-rejection.feature` | The hidden trap field discards bots silently |
| `registration-recaptcha-scoring.feature` | Scoring is advisory — only a scored bot is refused |
| `registration-recaptcha-client-timeout.feature` | The form never waits indefinitely, and submits once |
| `registration-error-messaging.feature` | Each failure reason gets copy the visitor can act on |
| `registration-form-value-retention.feature` | A failed submit keeps what was typed |
| `registration-double-submit-prevention.feature` | The form cannot be posted twice |
| `registration-endpoint-access-control.feature` | Only POST, only from known origins |
| `registration-airtable-write.feature` | The record is keyed by immutable field ID |
| `registration-tshirt-availability.feature` | The size field is withdrawn when stock runs out |

## Countdown bar

| File | Behaviour |
| --- | --- |
| `countdown-first-visit-reveal.feature` | The bar introduces itself once, letter by letter |
| `countdown-returning-visit.feature` | Afterwards it simply appears |
| `countdown-event-phases.feature` | Counting down, happening now, then gone |
| `countdown-opt-out-and-noscript.feature` | Withheld on the register page; static fallback |

## Navigation

| File | Behaviour |
| --- | --- |
| `navigation-attendee-link-gating.feature` | The Attendees link waits for twenty registrants |
| `navigation-active-page-indicator.feature` | The current page is marked |
| `navigation-mobile-menu.feature` | The narrow-viewport menu opens over the page |

## Schedule page

| File | Behaviour |
| --- | --- |
| `schedule-preliminary-teaser.feature` | Blurred and captioned until Pitch Night |
| `schedule-published-grid.feature` | Sessions listed in canonical slot order |
| `schedule-open-slot-placeholders.feature` | Unfilled slots stay visible |
| `schedule-parallel-track-layout.feature` | Parallel sessions share a row, capped at five |

## Session board (`/sessions`)

Tagged `@sessions-board`. **Not yet implemented in this repository** — these
describe the behaviour agreed on the published mockup. The debug clock is
additionally tagged `@mockup`; it is scaffolding and is not intended to ship.

| File | Behaviour |
| --- | --- |
| `sessions-board-focus-advance.feature` | Focus is the first session that has not ended |
| `sessions-board-focus-labelling.feature` | "On now" only once a session has started |
| `sessions-board-breakout-only.feature` | Breakout-room sessions and nothing else |
| `sessions-board-presentation-mode.feature` | Native fullscreen, one control |
| `sessions-board-idle-chrome.feature` | Cursor and control retreat when left alone |
| `sessions-board-viewport-scaling.feature` | Fits any display without a media query |
| `sessions-board-debug-clock.feature` | The clock can be simulated to test handover |

## Attendee directory

| File | Behaviour |
| --- | --- |
| `attendees-directory-gating.feature` | Unlocks at twenty registrants |
| `attendees-directory-listing.feature` | Opted-in registrants only, alphabetical |
| `attendees-email-privacy.feature` | Addresses never leave the build |

## Sponsors

| File | Behaviour |
| --- | --- |
| `sponsors-ordering.feature` | Contribution first, alphabetical between ties |
| `sponsors-tier-separation.feature` | Premier presented separately |
| `sponsors-confirmation-gating.feature` | Only confirmed commitments are published |
| `sponsors-logo-fallback.feature` | A sponsor without a logo is shown by name |
| `sponsors-link-targets.feature` | Own site if known, write-up otherwise |

## Content and data

| File | Behaviour |
| --- | --- |
| `airtable-missing-credentials.feature` | A build with no token degrades to empty content |
| `airtable-snapshot-fallback.feature` | A failed fetch republishes the last known-good data |
| `airtable-snapshot-opt-in.feature` | Content-independent deploys can skip the API |
| `airtable-pagination.feature` | Results are read to the end |
| `airtable-registrant-count-memoization.feature` | The count is fetched once per build |
| `preview-fake-data.feature` | One switch fakes every gated section |
| `deploy-content-refresh.feature` | Push, daily cron, and manual rebuild |

## Pages and chrome

| File | Behaviour |
| --- | --- |
| `home-peer-count.feature` | The hero names how many peers are coming |
| `event-details.feature` | Dates and venues agree wherever they appear |
| `video-lightbox.feature` | The intro video opens and unloads on demand |
| `photo-marquee.feature` | The photo strip scrolls and pauses on hover |
| `faq-accordion.feature` | Answers expand and collapse without scripting |
| `faq-deep-links.feature` | Each question has a stable anchor |
| `footer-parallax.feature` | The mountains shift as you approach |
| `footer-links.feature` | The site's standing links |
| `external-link-safety.feature` | Off-site links open safely |
| `site-client-side-routing.feature` | Pages swap in place without a flash |
| `site-ios-back-navigation.feature` | The back button works on iOS |
| `site-hero-shader.feature` | The backdrop runs once and keeps running |
| `site-page-metadata.feature` | Titles, canonicals, link previews, sitemap |
| `site-legacy-redirect.feature` | `/history` still resolves |
| `site-not-found-page.feature` | An unknown URL offers a way back |
