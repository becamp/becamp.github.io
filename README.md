# be.camp

Website for [beCamp](https://be.camp), Charlottesville's free, community-run
un-conference. Static site built with [Astro](https://astro.build) and Tailwind,
with event content pulled from Airtable at build time.

The previous site (Nuxt 3) is preserved on the [`becamp-2025`](../../tree/becamp-2025) branch.

## How it fits together

```
Airtable (Sponsors, Saturday Schedule, Registrations)
    │  read at build time
    ▼
Astro static build ──► GitHub Pages ──► https://be.camp
                        (deploys on push to main + daily 10:00 UTC cron)

Registration form ──► Vercel function (api/register.ts) ──► Airtable write
```

- **The site is fully static.** Content changes in Airtable appear after the
  next build — the daily cron, a push to `main`, or a manual run of the
  "Deploy to GitHub Pages" workflow (use that to publish the Saturday schedule
  on Friday night).
- **Registration** posts to a serverless function hosted on Vercel
  (`api/register.ts`), which validates (honeypot + optional reCAPTCHA v3) and
  writes a row to the Guests table. Field names in that file must match the
  Airtable column names exactly — Airtable rejects the whole write on any
  unknown column.
- **Gated features:** the "Join your N peers" line, the `/attendees` directory,
  and its nav links all appear automatically once the Guests table has
  20+ rows. Attendee avatars come from Gravatar via an md5 of the registration
  email — emails never reach the client.
- **Countdown bar** dates live as constants at the top of
  `src/components/CountdownBar.astro`. It flips to "happening now" during the
  event and removes itself afterward.

## Local development

```sh
npm install
cp .env.example .env   # fill in what you have; everything degrades gracefully
npm run dev
```

Without Airtable credentials the build uses empty content. Set
`USE_FAKE_DATA=true` to preview the registrant count and attendee directory
with sample data.

| Command           | Action                                     |
| :---------------- | :----------------------------------------- |
| `npm run dev`     | Dev server at `localhost:4321`             |
| `npm run build`   | Production build to `./dist/`              |
| `npm run preview` | Serve the production build locally         |

## Environment

See [`.env.example`](.env.example) for the full annotated list. In short:

| Variable | Where | Purpose |
| :-- | :-- | :-- |
| `AIRTABLE_READ_TOKEN` | CI (Actions secret) | Read-scoped PAT for builds |
| `AIRTABLE_TOKEN` | Vercel | Write-scoped PAT for the registration function |
| `AIRTABLE_BASE_ID` | CI + Vercel | The beCamp base |
| `AIRTABLE_TABLE` | Vercel | Registrations table name (`Guests`) |
| `PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` | CI / Vercel | Optional bot protection |
| `PUBLIC_FORM_ENDPOINT` | CI | Where the form posts (the Vercel function URL) |
| `USE_FAKE_DATA` | `.env` / Actions **variable** | `true` fakes registrant count + attendee directory for preview |

If an Airtable fetch fails (outage, API quota exhausted), the build falls back
to the **snapshot from the last successful build** — republishing
stale-but-real content with a warning annotation on the Actions run — kept
warm across CI runs by `actions/cache`. Only when there's no snapshot to fall
back on does the build **fail loudly**; it never silently publishes a hollow
site.

### Fake data on the live site

Until real registrations pass 20, the gated features can be previewed publicly
with sample data (78 registrants, 26 invented attendees). The switch is the
`USE_FAKE_DATA` **repository variable** — repo Settings → Secrets and
variables → Actions → Variables — read by the deploy workflow. No code change
involved:

```sh
gh variable set USE_FAKE_DATA --body false   # or true
gh workflow run "Deploy to GitHub Pages"     # or wait for the daily cron
```

Anything other than `true` (including the variable not existing) means real
Airtable data, so the site fails safe to honest numbers. **Set it to `false`
at launch.**

## Deployment

Pushing to `main` (or the daily cron) runs
[`deploy-pages.yml`](.github/workflows/deploy-pages.yml), which builds and
deploys to GitHub Pages. Third-party actions are pinned to commit SHAs because
the job holds the Airtable token. The custom domain is pinned by
[`public/CNAME`](public/CNAME).

The registration function deploys separately via the Vercel project connected
to this repo. Its origin allowlist lives at the top of
[`api/register.ts`](api/register.ts).

---

Made in CVille | Designed by [Scale](https://scale.agency), co-built with [Claude Code](https://claude.com/claude-code)
