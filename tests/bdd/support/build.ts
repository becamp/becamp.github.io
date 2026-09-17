/* Builds the real site in-process so a scenario can observe exactly what a
   deploy would publish.

   Two levers make the build deterministic:
     - vite.envDir points at a generated .env, so import.meta.env carries only
       what the scenario asked for. The repository's own .env is never read.
     - global fetch is replaced, so no request leaves the machine, fixture data
       is served to the code under test, and every request it makes is recorded.

   Builds are memoized on their options: a scenario that asks for the same
   configuration as an earlier one reuses the output rather than rebuilding. */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { parseHTML } from 'linkedom';
import type { AirtableRecord, TableName } from './fixtures.js';

export const PROJECT_ROOT = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const SNAPSHOT_DIR = join(PROJECT_ROOT, '.airtable-cache');

export interface RecordedRequest {
  url: string;
  table?: TableName | string;
  params: URLSearchParams;
  authorization?: string;
}

export interface BuildOptions {
  /** Airtable token and base id present in import.meta.env. Default true. */
  credentials?: boolean;
  /** USE_FAKE_DATA. Default false. */
  useFakeData?: boolean;
  /** AIRTABLE_USE_SNAPSHOT. Default false. */
  useSnapshot?: boolean;
  /** PUBLIC_RECAPTCHA_SITE_KEY. Omitted when undefined. */
  recaptchaSiteKey?: string;
  /** PUBLIC_FORM_ENDPOINT. Omitted when undefined. */
  formEndpoint?: string;
  /** Fixture records served to the code under test, per table. */
  records?: Partial<Record<TableName, AirtableRecord[]>>;
  /** Tables whose fetch should fail, and how. */
  fail?: Partial<Record<TableName, 'network' | 'status' | 'quota'>>;
  /** Serve these tables in pages of this size, using Airtable's offset cursor. */
  pageSize?: number;
  /** Snapshot files to write before the build, keyed like the app keys them. */
  snapshots?: Array<{ table: TableName; params: string; records: AirtableRecord[] }>;
  /** Wipe .airtable-cache before building. Default true. */
  clearSnapshots?: boolean;
  /** Label shown in failure messages. */
  label?: string;
}

export interface BuiltSite {
  options: BuildOptions;
  outDir: string;
  /** Requests the build made to the Airtable API, in order. */
  requests: RecordedRequest[];
  /** Console output captured during the build. */
  logs: { log: string[]; warn: string[]; error: string[] };
  /** Set when the build threw rather than completing. */
  failure?: Error;
  /** Snapshot files present after the build. */
  snapshotFiles: string[];
  html(pagePath: string): string;
  page(pagePath: string): Document;
  /** True when the page exists in the output. */
  has(pagePath: string): boolean;
}

/* The app keys snapshots by table plus a hash of the query string. Mirrored
   here so a scenario can plant a snapshot the app will actually find. */
const snapshotPath = (table: string, params: string) =>
  join(
    SNAPSHOT_DIR,
    `${table.replace(/[^a-z0-9]+/gi, '-')}-${createHash('md5').update(params).digest('hex').slice(0, 8)}.json`
  );

export const QUERIES = {
  sponsors: 'filterByFormula=%7BCommitment%20confirmed%7D',
  guestCount: 'fields%5B%5D=Guest%20Name',
  guestDirectory: 'fields%5B%5D=Guest%20Name&fields%5B%5D=Email&fields%5B%5D=Directory%20Permission',
  schedule: 'fields%5B%5D=Topic&fields%5B%5D=Speaker&fields%5B%5D=Time&fields%5B%5D=Location&fields%5B%5D=Type',
} as const;

const cache = new Map<string, Promise<BuiltSite>>();

const keyOf = (o: BuildOptions) =>
  createHash('md5')
    .update(
      JSON.stringify({
        credentials: o.credentials ?? true,
        useFakeData: o.useFakeData ?? false,
        useSnapshot: o.useSnapshot ?? false,
        recaptchaSiteKey: o.recaptchaSiteKey ?? null,
        formEndpoint: o.formEndpoint ?? null,
        records: o.records ?? null,
        fail: o.fail ?? null,
        pageSize: o.pageSize ?? null,
        snapshots: o.snapshots ?? null,
        clearSnapshots: o.clearSnapshots ?? true,
      })
    )
    .digest('hex')
    .slice(0, 12);

/** Builds the site, or returns the cached result for identical options. */
export function buildSite(options: BuildOptions = {}): Promise<BuiltSite> {
  const key = keyOf(options);
  let pending = cache.get(key);
  if (!pending) {
    pending = runBuild(options, key);
    cache.set(key, pending);
  }
  return pending;
}

/** Discards memoized builds. Only needed by a scenario that mutates the repo. */
export function clearBuildCache() {
  cache.clear();
}

async function runBuild(options: BuildOptions, key: string): Promise<BuiltSite> {
  const outDir = join(tmpdir(), `becamp-out-${key}`);
  rmSync(outDir, { recursive: true, force: true });

  const optionsFile = join(tmpdir(), `becamp-opts-${key}.json`);
  const resultFile = join(tmpdir(), `becamp-result-${key}.json`);
  writeFileSync(
    optionsFile,
    JSON.stringify({ ...options, projectRoot: PROJECT_ROOT, outDir, snapshotDir: SNAPSHOT_DIR })
  );

  const worker = join(PROJECT_ROOT, 'tests/bdd/support/build-worker.ts');
  const proc = spawnSync(
    process.execPath,
    ['--import', 'tsx/esm', worker, optionsFile, resultFile],
    {
      cwd: PROJECT_ROOT,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      timeout: 180_000,
    }
  );

  if (!existsSync(resultFile)) {
    throw new Error(
      `Build worker produced no result (exit ${proc.status}).\n` +
        `stdout: ${(proc.stdout ?? '').slice(-2000)}\nstderr: ${(proc.stderr ?? '').slice(-2000)}`
    );
  }

  const raw = JSON.parse(readFileSync(resultFile, 'utf8'));
  rmSync(optionsFile, { force: true });
  rmSync(resultFile, { force: true });

  const requests: RecordedRequest[] = raw.requests.map((r: any) => ({
    url: r.url,
    table: r.table,
    params: new URLSearchParams(r.params),
    authorization: r.authorization,
  }));

  const htmlCache = new Map<string, string>();
  const domCache = new Map<string, Document>();

  const resolve = (pagePath: string) => {
    const clean = pagePath.replace(/^\/+/, '').replace(/\/+$/, '');
    if (clean === '' || clean === 'index') return join(outDir, 'index.html');
    if (clean.endsWith('.html')) return join(outDir, clean);
    return join(outDir, clean, 'index.html');
  };

  const site: BuiltSite = {
    options,
    outDir,
    requests,
    logs: raw.logs,
    failure: raw.failure ? new Error(raw.failure) : undefined,
    snapshotFiles: raw.snapshotFiles,
    has(pagePath) {
      return existsSync(resolve(pagePath));
    },
    html(pagePath) {
      const file = resolve(pagePath);
      let cached = htmlCache.get(file);
      if (cached === undefined) {
        if (!existsSync(file)) {
          const label = options.label ? ` (build: ${options.label})` : '';
          const why = raw.failure ? ` — the build failed: ${raw.failure}` : '';
          throw new Error(`No built page at ${pagePath} -> ${file}${label}${why}`);
        }
        cached = readFileSync(file, 'utf8');
        htmlCache.set(file, cached);
      }
      return cached;
    },
    page(pagePath) {
      const file = resolve(pagePath);
      let dom = domCache.get(file);
      if (!dom) {
        dom = parseHTML(site.html(pagePath)).document as unknown as Document;
        domCache.set(file, dom);
      }
      return dom;
    },
  };

  return site;
}

/* ── Snapshot helpers, for scenarios about the snapshot mechanism ─────────── */

export const snapshots = {
  path: snapshotPath,
  dir: SNAPSHOT_DIR,
  read(table: TableName, params: string): AirtableRecord[] {
    return JSON.parse(readFileSync(snapshotPath(table, params), 'utf8'));
  },
  exists(table: TableName, params: string) {
    return existsSync(snapshotPath(table, params));
  },
  clear() {
    rmSync(SNAPSHOT_DIR, { recursive: true, force: true });
  },
};

export const ensureDir = (file: string) => mkdirSync(dirname(file), { recursive: true });
