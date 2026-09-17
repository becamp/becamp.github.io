/* One site build, in its own process.

   Isolation is not optional here. src/lib/airtable.ts memoizes the registrant
   count in a module-level promise, and Vite reuses its SSR module graph between
   build() calls in the same process — so a second build in one process inherits
   the first build's count and any other module state. That made results depend
   on scenario order. A child process per configuration removes the sharing.

   Invoked as: node --import tsx/esm build-worker.ts <options.json> <result.json> */

import { build } from 'astro';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==',
  'base64'
);

const [optionsFile, resultFile] = process.argv.slice(2);
if (!optionsFile || !resultFile || !optionsFile.endsWith('.json')) {
  throw new Error(
    'build-worker.ts is a CLI entrypoint, not support code. ' +
      'It must be invoked with an options file and a result file; do not add it to a glob that gets imported.'
  );
}
const opts = JSON.parse(readFileSync(optionsFile, 'utf8'));
const {
  projectRoot,
  outDir,
  snapshotDir,
  credentials = true,
  useFakeData = false,
  useSnapshot = false,
  recaptchaSiteKey,
  formEndpoint,
  records = {},
  fail = {},
  pageSize,
  snapshots,
  clearSnapshots = true,
} = opts;

const snapshotPath = (table: string, params: string) =>
  join(
    snapshotDir,
    `${table.replace(/[^a-z0-9]+/gi, '-')}-${createHash('md5').update(params).digest('hex').slice(0, 8)}.json`
  );

const envDir = mkdtempSync(join(tmpdir(), 'becamp-env-'));
const env: string[] = [];
if (credentials) env.push('AIRTABLE_TOKEN=test-token', 'AIRTABLE_BASE_ID=testbase');
env.push(`USE_FAKE_DATA=${useFakeData}`);
if (useSnapshot) env.push('AIRTABLE_USE_SNAPSHOT=true');
if (recaptchaSiteKey !== undefined && recaptchaSiteKey !== null) {
  env.push(`PUBLIC_RECAPTCHA_SITE_KEY=${recaptchaSiteKey}`);
}
if (formEndpoint !== undefined && formEndpoint !== null) {
  env.push(`PUBLIC_FORM_ENDPOINT=${formEndpoint}`);
}
writeFileSync(join(envDir, '.env'), env.join('\n') + '\n');

if (clearSnapshots) rmSync(snapshotDir, { recursive: true, force: true });
if (snapshots?.length) {
  mkdirSync(snapshotDir, { recursive: true });
  for (const s of snapshots) writeFileSync(snapshotPath(s.table, s.params), JSON.stringify(s.records));
}

const requests: Array<{ url: string; table: string; params: string; authorization?: string }> = [];
const logs = { log: [] as string[], warn: [] as string[], error: [] as string[] };

const capture = (bucket: string[]) => (...args: unknown[]) => {
  bucket.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '));
};
console.log = capture(logs.log);
console.warn = capture(logs.warn);
console.error = capture(logs.error);

globalThis.fetch = (async (input: any, init?: any) => {
  const url = String(typeof input === 'string' ? input : input?.url ?? input);

  if (url.includes('airtableusercontent.com')) {
    return new Response(PNG_1X1, { status: 200, headers: { 'Content-Type': 'image/png' } });
  }

  if (url.startsWith('https://api.airtable.com/')) {
    const parsed = new URL(url);
    const table = decodeURIComponent(parsed.pathname.split('/').pop() ?? '');
    requests.push({
      url,
      table,
      params: parsed.search.replace(/^\?/, ''),
      authorization: init?.headers?.Authorization,
    });

    const mode = fail[table];
    if (mode === 'network') throw new Error(`simulated network failure for ${table}`);
    if (mode === 'status') return new Response('simulated Airtable error', { status: 500 });
    if (mode === 'quota') {
      return new Response(JSON.stringify({ error: 'QUOTA_EXCEEDED' }), { status: 429 });
    }

    const all = records[table] ?? [];
    if (!pageSize) return Response.json({ records: all });

    const from = Number(parsed.searchParams.get('offset') ?? 0);
    const next = from + pageSize;
    return Response.json({
      records: all.slice(from, next),
      ...(next < all.length ? { offset: String(next) } : {}),
    });
  }

  /* Telemetry and anything else stays on this machine. */
  return new Response('', { status: 204 });
}) as typeof fetch;

/* The snapshot path may deliberately be a plain file in the scenario about an
   unwritable snapshot directory, so listing it must not throw. */
const listSnapshots = () => {
  try {
    return existsSync(snapshotDir) ? readdirSync(snapshotDir).sort() : [];
  } catch {
    return [];
  }
};

let failure: string | undefined;
try {
  await build({
    root: projectRoot,
    outDir,
    vite: { envDir, logLevel: 'silent' },
    logLevel: 'error',
  } as any);
} catch (err) {
  failure = err instanceof Error ? `${err.message}` : String(err);
} finally {
  rmSync(envDir, { recursive: true, force: true });
}

writeFileSync(
  resultFile,
  JSON.stringify({
    requests,
    logs,
    failure,
    snapshotFiles: listSnapshots(),
  })
);

/* Astro may leave handles open; the result is already written. */
process.exit(0);
