/* A real browser over the real built output, for behaviour that only exists at
   runtime: the countdown's reveal, the mobile menu, the video lightbox, the
   footer parallax, fullscreen, idle chrome.

   The built site is served over HTTP rather than opened as file:// — Astro emits
   root-relative asset paths (/_astro/...), which file:// cannot resolve, so the
   page's scripts would never run. */

import { createServer, type Server } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { BuiltSite } from './build.js';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
};

const servers = new Map<string, Promise<{ server: Server; origin: string }>>();

/** Serves a built site on a free port. Memoized per output directory. */
export function serve(site: BuiltSite) {
  let pending = servers.get(site.outDir);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
        let file = join(site.outDir, path);

        if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
        if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
        if (!existsSync(file)) {
          /* Mirror a static host: unknown paths get the 404 page. */
          const notFound = join(site.outDir, '404.html');
          if (existsSync(notFound)) {
            res.writeHead(404, { 'Content-Type': TYPES['.html'] });
            createReadStream(notFound).pipe(res);
            return;
          }
          res.writeHead(404).end('not found');
          return;
        }

        res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
        createReadStream(file).pipe(res);
      });

      server.on('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve({ server, origin: `http://127.0.0.1:${port}` });
      });
    });
    servers.set(site.outDir, pending);
  }
  return pending;
}

let browser: Browser | undefined;
const contexts: BrowserContext[] = [];

async function getBrowser() {
  browser ??= await chromium.launch();
  return browser;
}

export interface OpenOptions {
  /** Emulate prefers-reduced-motion: reduce. */
  reducedMotion?: boolean;
  /** Run the page with scripting disabled, to check the noscript path. */
  javaScriptEnabled?: boolean;
  /** Viewport, for the responsive and display-scaling scenarios. */
  viewport?: { width: number; height: number };
  /** Pretend to be an iOS device. */
  userAgent?: string;
  /** Extra touch points, for the iPadOS-masquerading-as-macOS case. */
  hasTouch?: boolean;
  /** Seed localStorage before the first navigation. */
  storage?: Record<string, string>;
  /** Seed sessionStorage before the first navigation. */
  session?: Record<string, string>;
  /** Freeze Date.now() at this instant before any page script runs. */
  now?: number;
}

export interface OpenedPage {
  page: Page;
  origin: string;
  context: BrowserContext;
}

/** Opens a page of a built site in a fresh browser context. */
export async function openPage(site: BuiltSite, path: string, opts: OpenOptions = {}): Promise<OpenedPage> {
  const { origin } = await serve(site);
  const b = await getBrowser();

  const context = await b.newContext({
    reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference',
    javaScriptEnabled: opts.javaScriptEnabled ?? true,
    viewport: opts.viewport ?? { width: 1280, height: 900 },
    ...(opts.userAgent ? { userAgent: opts.userAgent } : {}),
    ...(opts.hasTouch ? { hasTouch: true } : {}),
  });
  contexts.push(context);

  if (opts.hasTouch) {
    /* Playwright's hasTouch does not raise maxTouchPoints, which is what the
       iPadOS check actually reads. */
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
    });
  }

  if (opts.now !== undefined) {
    await context.addInitScript((fixed: number) => {
      const RealDate = Date;
      const offset = fixed - RealDate.now();
      // @ts-ignore - replacing the global on purpose
      class FrozenDate extends RealDate {
        constructor(...args: any[]) {
          if (args.length === 0) super(RealDate.now() + offset);
          // @ts-ignore
          else super(...args);
        }
        static now() {
          return RealDate.now() + offset;
        }
      }
      // @ts-ignore
      globalThis.Date = FrozenDate;
    }, opts.now);
  }

  if (opts.storage) {
    await context.addInitScript((entries: Record<string, string>) => {
      try {
        for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v);
      } catch {
        /* the scenario is about storage being unavailable — let the page cope */
      }
    }, opts.storage);
  }

  if (opts.session) {
    await context.addInitScript((entries: Record<string, string>) => {
      try {
        for (const [k, v] of Object.entries(entries)) sessionStorage.setItem(k, v);
      } catch {
        /* same: the page must cope without it */
      }
    }, opts.session);
  }

  /* Nothing may leave the machine. The page's own markup references Google's
     reCAPTCHA script and Google Fonts; left unblocked, a run would depend on
     the network and on whether those actually load. Aborting them is also what
     the content-blocker scenarios describe. */
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(origin) || url.startsWith('data:') || url.startsWith('blob:')) {
      return route.continue();
    }
    return route.abort();
  });

  const page = await context.newPage();
  const url = path.startsWith('http') ? path : `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  await page.goto(url, { waitUntil: 'load' });
  return { page, origin, context };
}

/** Closes every context and the shared browser. Called from an AfterAll hook. */
export async function closeBrowser() {
  await Promise.all(contexts.splice(0).map((c) => c.close().catch(() => {})));
  await browser?.close().catch(() => {});
  browser = undefined;
  for (const [, pending] of servers) {
    const { server } = await pending;
    server.close();
  }
  servers.clear();
}

export const IOS_USER_AGENTS = {
  iPhone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  iPad:
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  iPod:
    'Mozilla/5.0 (iPod touch; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  macWithTouch:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  desktop:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
};

/** Instants the countdown scenarios need, as epoch milliseconds. */
export const EVENT = {
  start: new Date('2026-10-02T16:30:00-04:00').getTime(),
  end: new Date('2026-10-03T16:00:00-04:00').getTime(),
  beforeStart: new Date('2026-09-01T12:00:00-04:00').getTime(),
  during: new Date('2026-10-03T10:00:00-04:00').getTime(),
  afterEnd: new Date('2026-10-04T12:00:00-04:00').getTime(),
};
