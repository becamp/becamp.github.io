# Repository Guidelines

## Project Structure & Module Organization
- Nuxt 3 app. Key dirs: `pages/` (routes), `components/` (Vue SFCs), `layouts/`, `plugins/`, `middleware/`, `assets/sass/`, `public/`, `store/`, and `libs/`.
- Generated output: `.nuxt/` (build artifacts) and `.output/` (build/generate). Do not edit or commit.
- Content and static assets live in `public/` and `assets/`. Prior years are in `previous_years/`.

## Build, Test, and Development Commands
- `npm run dev` — Start local dev server with HMR (http://localhost:3000).
- `npm run build` — Production build.
- `npm run preview` — Serve the production build locally.
- `npm run generate` — Generate a static site (Nuxt prerender).
- `npm run generate:local` — Generate static site loading `.env` (sets `LOCAL_ENV=true`).
- `npm run lint` / `npm run lint:fix` — Lint (and auto-fix) via ESLint.
- `npm run typecheck` — TypeScript type check via Nuxt/Vue TSC.

Use Node 20 (Volta pins `20.17.0`). Example: `nvm use 20 && npm ci`.

## Coding Style & Naming Conventions
- Languages: Vue 3 SFCs, TypeScript/JavaScript, SCSS.
- Indentation: 2 spaces; favor single quotes; trailing commas per ESLint.
- Components live in `components/`; referenced as kebab-case tags (e.g., `<site-header />`). Match existing filename patterns in this folder.
- Run `npm run lint` and `npm run typecheck` before pushing.

## Testing Guidelines
- No formal test suite yet. Validate changes by:
  - Running `npm run dev` and exercising affected routes.
  - Passing ESLint and TypeScript checks.
  - Adding lightweight unit tests (Vitest + Vue Test Utils) is welcome in PRs when practical.

## Commit & Pull Request Guidelines
- Commits: present tense, imperative mood, first line ≤ 72 chars; reference issues after the first line (see `CONTRIBUTING.md`).
- PRs: use the template (`PULL_REQUEST_TEMPLATE.md`). Include:
  - Linked issue (e.g., `Fixes #123`).
  - Summary of changes and rationale.
  - Screenshots/GIFs for UI changes.
  - Scope kept focused; passing lint/type checks.

## Security & Configuration Tips
- Environment: `.env` for local only; do not commit. Keys used: `BUTTERKEY`, `AIRTABLEKEY` (exposed as public runtime config for client usage).
- Static generation with env: `npm run generate:local`.
- Analytics and sitemap configured in `nuxt.config.ts`; image domains are restricted via `@nuxt/image`.
