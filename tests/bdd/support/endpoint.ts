/* Drives the registration function the way Vercel would: a request object in,
   a recorded response out, with global fetch replaced so no request reaches
   Google or Airtable and every one the handler makes can be inspected. */

import handler from '../../../api/register.js';

export interface EndpointRequest {
  method?: string;
  origin?: string;
  body?: Record<string, unknown>;
}

export interface RecordedCall {
  url: string;
  method?: string;
  body?: string;
}

export interface EndpointResult {
  status?: number;
  body?: string;
  redirectStatus?: number;
  redirectUrl?: string;
  /** Parsed from the redirect URL when there is one. */
  params: URLSearchParams;
  calls: RecordedCall[];
  airtableCalls: RecordedCall[];
  recaptchaCalls: RecordedCall[];
  /** The record body the handler sent to Airtable, if it sent one. */
  airtableFields?: Record<string, unknown>;
  logs: { log: string[]; warn: string[]; error: string[] };
}

export interface EndpointEnv {
  RECAPTCHA_SECRET_KEY?: string;
  AIRTABLE_TOKEN?: string;
  AIRTABLE_BASE_ID?: string;
  AIRTABLE_TABLE?: string;
  VERCEL_ENV?: string;
}

export interface EndpointStubs {
  /** What Google's siteverify should answer. */
  recaptcha?: { success: boolean; score?: number; errorCodes?: string[] } | 'network-error';
  /** What the Airtable write should answer. */
  airtable?: { ok: true } | { ok: false; status: number; body?: string } | 'network-error';
}

const DEFAULT_ENV: EndpointEnv = {
  AIRTABLE_TOKEN: 'test-token',
  AIRTABLE_BASE_ID: 'testbase',
  AIRTABLE_TABLE: 'Guests',
};

/* Env keys the handler reads. Every one is restored afterwards, whether it was
   set, empty, or absent. */
const ENV_KEYS = [
  'RECAPTCHA_SECRET_KEY',
  'AIRTABLE_TOKEN',
  'AIRTABLE_BASE_ID',
  'AIRTABLE_TABLE',
  'VERCEL_ENV',
] as const;

export async function callEndpoint(
  request: EndpointRequest,
  env: EndpointEnv = DEFAULT_ENV,
  stubs: EndpointStubs = {}
): Promise<EndpointResult> {
  const result: EndpointResult = {
    params: new URLSearchParams(),
    calls: [],
    airtableCalls: [],
    recaptchaCalls: [],
    logs: { log: [], warn: [], error: [] },
  };

  const res = {
    status(code: number) {
      result.status = code;
      return res;
    },
    send(body: string) {
      result.body = body;
      return res;
    },
    redirect(code: number, url: string) {
      result.redirectStatus = code;
      result.redirectUrl = url;
      const q = url.indexOf('?');
      result.params = new URLSearchParams(q === -1 ? '' : url.slice(q + 1));
      return res;
    },
  };

  const req = {
    method: request.method ?? 'POST',
    headers: { origin: request.origin ?? 'https://be.camp' },
    body: request.body ?? {},
  };

  const saved: Record<string, string | undefined> = {};
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    const next = (env as Record<string, string | undefined>)[k];
    if (next === undefined) delete process.env[k];
    else process.env[k] = next;
  }

  const realFetch = globalThis.fetch;
  const realLog = console.log;
  const realWarn = console.warn;
  const realError = console.error;
  const capture = (bucket: string[]) => (...args: unknown[]) => {
    bucket.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '));
  };
  console.log = capture(result.logs.log);
  console.warn = capture(result.logs.warn);
  console.error = capture(result.logs.error);

  globalThis.fetch = (async (input: any, init?: any) => {
    const url = String(typeof input === 'string' ? input : input?.url ?? input);
    const call: RecordedCall = {
      url,
      method: init?.method,
      body: typeof init?.body === 'string' ? init.body : init?.body?.toString?.(),
    };
    result.calls.push(call);

    if (url.includes('recaptcha/api/siteverify')) {
      result.recaptchaCalls.push(call);
      const stub = stubs.recaptcha;
      if (stub === 'network-error') throw new Error('simulated verify failure');
      if (!stub) return Response.json({ success: true, score: 0.9 });
      return Response.json({
        success: stub.success,
        ...(stub.score === undefined ? {} : { score: stub.score }),
        ...(stub.errorCodes ? { 'error-codes': stub.errorCodes } : {}),
      });
    }

    if (url.startsWith('https://api.airtable.com/')) {
      result.airtableCalls.push(call);
      try {
        const parsed = JSON.parse(call.body ?? '{}');
        result.airtableFields = parsed?.records?.[0]?.fields;
      } catch {
        /* a body that isn't JSON is itself the finding — leave it unparsed */
      }
      const stub = stubs.airtable;
      if (stub === 'network-error') throw new Error('simulated Airtable failure');
      if (stub && stub.ok === false) {
        return new Response(stub.body ?? 'error', { status: stub.status });
      }
      return Response.json({ records: [{ id: 'recTest', fields: {} }] });
    }

    throw new Error(`Unexpected request from the endpoint: ${url}`);
  }) as typeof fetch;

  try {
    await handler(req as any, res as any);
  } finally {
    globalThis.fetch = realFetch;
    console.log = realLog;
    console.warn = realWarn;
    console.error = realError;
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }

  return result;
}

/** Field IDs the handler writes, with the column each points at. */
export const FIELD_IDS = {
  name: 'fldojBhhSjxaBuZfR',
  email: 'fldJL5gVTtMNkCo9J',
  reception: 'fldeajWts1m6Ye5XJ',
  pitchNight: 'fldUkjgZIRmtDKb44',
  saturday: 'fldddGhk851IyFeSd',
  directory: 'fldDwMDhMx5U0IYzq',
  volunteerFriday: 'fld1s3EixWDgnVVmU',
  volunteerSaturday: 'fldDEEDbEBhOZlxfq',
  shirtSize: 'fldiR5qR1YsLJjOU3',
} as const;

export const ALLOWED_ORIGINS = [
  'https://be.camp',
  'https://www.be.camp',
  'https://be-camp-website.vercel.app',
  'http://localhost:4321',
];

export const HONEYPOT_FIELD = 'bc-hp';
export const BOT_SCORE = 0.2;
export const DEFAULT_ENDPOINT_ENV = DEFAULT_ENV;
