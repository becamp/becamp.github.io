/* Minimal typings for the Vercel Node runtime. The @vercel/node package was a
   devDependency used solely for these two types while dragging in a transitive
   tree with dozens of known advisories — these cover every member this handler
   touches. */
interface VercelRequest {
  method?: string;
  headers: { origin?: string };
  body?: any;
}
interface VercelResponse {
  status(code: number): VercelResponse;
  send(body: string): VercelResponse;
  redirect(statusCode: number, url: string): VercelResponse;
}

/* Origins allowed to submit the form; the redirect goes back to whichever one posted. */
const ALLOWED_ORIGINS = [
  'https://be.camp',
  'https://www.be.camp',
  'https://be-camp-website.vercel.app',
  'http://localhost:4321',
];

/* Kept in sync with the hidden input in src/pages/register.astro. Intentionally
   meaningless: any name a password manager recognises (website, url, company)
   gets autofilled for real people. */
const HONEYPOT_FIELD = 'bc-hp';

/* Only a token Google actively scores below this is treated as a bot. Google's
   own 0.5 is an illustration, not a recommendation — on a low-traffic site a
   first-time human routinely lands under it. */
const BOT_SCORE = 0.2;

/* Returns Google's score, or null when there is no usable verdict — an expired
   or already-spent token, a network failure, a response without a score. A null
   is treated as "unknown", never as "bot". */
async function scoreToken(secret: string, token: string, email: string): Promise<number | null> {
  let result: any;
  try {
    const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    result = await verify.json();
  } catch (err) {
    console.warn(`reCAPTCHA verify request failed for ${email} — accepting unverified`, err);
    return null;
  }
  if (!result?.success) {
    /* invalid-input-response / timeout-or-duplicate: usually a stale token from
       a slow first load or a resubmit, not a bot. */
    console.warn(`reCAPTCHA could not verify ${email} (${JSON.stringify(result?.['error-codes'] ?? [])}) — accepting unverified`);
    return null;
  }
  if (typeof result.score !== 'number') return null;
  console.log(`reCAPTCHA score ${result.score} for ${email}`);
  return result.score;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const origin = req.headers.origin ?? '';
  if (!ALLOWED_ORIGINS.includes(origin)) return res.status(403).send('Forbidden');

  /* The reason rides along on the query string so the form can say something
     more useful than "try again" — every failure used to look identical from
     the browser, which made the Slack reports impossible to diagnose. */
  const back: Back = (status, reason) =>
    res.redirect(303, `${origin}/register?status=${status}${reason ? `&reason=${reason}` : ''}`);

  /* Everything past the origin check redirects back to the form on failure —
     a network error against Google or Airtable must not surface as a bare
     Vercel 500 that strands the visitor. */
  try {
    return await submit(req, back);
  } catch (err) {
    console.error('Registration failed', err);
    return back('error', 'server');
  }
}

type ErrorReason = 'missing' | 'captcha' | 'airtable' | 'server' | 'config';
type Back = (status: 'success' | 'error', reason?: ErrorReason) => unknown;

async function submit(req: VercelRequest, back: Back) {
  const body = req.body ?? {};
  const name = body.name?.toString().trim();
  const email = body.email?.toString().trim();

  if (!name || !email) return back('error', 'missing');

  /* Honeypot: real users never fill this field. Pretend success so bots don't adapt.
     Deliberately NOT named "website" any more — password managers and Chrome
     autofill happily fill a field with that name, which silently threw away a
     real registration behind a "You're registered!" banner. Logged so an
     autofill victim is distinguishable from a bot in the Vercel logs. */
  if (body[HONEYPOT_FIELD]) {
    console.warn(`Honeypot tripped for ${email} — no row written`);
    return back('success');
  }

  /* reCAPTCHA v3, advisory rather than a gate.
     It used to reject on a missing token, an unverifiable token, or any score
     under 0.5 — and every one of those fires for real people: the script is
     blocked by content blockers, a cold first load can outrun the client's
     timeout, and v3 scores a visitor lowest on their FIRST interaction with a
     domain, which is exactly when someone registers. That produced the
     "errored the first time, worked on the second try" reports.
     Now only a token Google actively scores as a bot is turned away; anything
     Google can't render a verdict on is accepted and logged. The honeypot above
     remains the hard block. Raise BOT_SCORE toward 0.5 if spam ever shows up —
     a junk row someone deletes costs less than a lost attendee. */
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (!recaptchaSecret && process.env.VERCEL_ENV === 'production') {
    console.error('RECAPTCHA_SECRET_KEY is not set — accepting submissions without bot verification');
  }
  if (recaptchaSecret) {
    /* "unavailable" is the client's sentinel for "the reCAPTCHA script never
       answered" — no point spending a round trip to have Google reject it. */
    const token = body['recaptcha-token']?.toString();
    if (!token || token === 'unavailable') {
      console.warn(`reCAPTCHA token unavailable for ${email} — accepting unverified`);
    } else {
      const score = await scoreToken(recaptchaSecret, token, email);
      if (score !== null && score < BOT_SCORE) {
        console.error(`reCAPTCHA scored ${score} for ${email} — rejected as a bot`);
        return back('error', 'captcha');
      }
    }
  }

  /* Field names must match the Airtable column names exactly. The reception
     column must exist in the base BEFORE this deploys — Airtable rejects the
     whole write (422) on any unknown field name. */
  const fields: Record<string, string | boolean> = {
    'Guest Name': name,
    Email: email,
    "I'll be attending the reception at The Poplar on Friday Oct 2nd from 4:30pm -> 5:30pm":
      body['attend-reception'] === 'on',
    "I'll be attending Pitch Night on Friday Oct 19th from 5pm -> 10pm": body['attend-friday'] === 'on',
    "I'll be attending Sessions Oct 19th from 9am -> 4pm": body['attend-saturday'] === 'on',
    'Directory Permission': body['attendee-directory'] === 'on',
    'Yes, I can help out on Friday!': body['volunteer-friday'] === 'on',
    'Yes, I can help out on Saturday!': body['volunteer-saturday'] === 'on',
  };

  /* Only sent while the form shows the field; value must match a single-select option. */
  if (body['shirt-size']) fields['T-shirt Size'] = body['shirt-size'].toString();

  const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE } = process.env;
  /* Without this the URL silently degrades to a base-only path that Airtable
     404s on every single submission. Fail loudly in the logs instead. */
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE) {
    console.error('Airtable env vars missing — cannot write registration');
    return back('error', 'config');
  }

  const airtable = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records: [{ fields }] }),
    }
  );

  if (!airtable.ok) {
    console.error('Airtable error', airtable.status, await airtable.text());
    return back('error', 'airtable');
  }

  return back('success');
}
