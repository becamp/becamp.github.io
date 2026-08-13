import type { VercelRequest, VercelResponse } from '@vercel/node';

/* Origins allowed to submit the form; the redirect goes back to whichever one posted. */
const ALLOWED_ORIGINS = [
  'https://be.camp',
  'https://www.be.camp',
  'https://be-camp-website.vercel.app',
  'http://localhost:4321',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const origin = req.headers.origin ?? '';
  if (!ALLOWED_ORIGINS.includes(origin)) return res.status(403).send('Forbidden');

  const back = (status: 'success' | 'error') =>
    res.redirect(303, `${origin}/register?status=${status}`);

  const body = req.body ?? {};
  const name = body.name?.toString().trim();
  const email = body.email?.toString().trim();

  if (!name || !email) return back('error');

  /* Honeypot: real users never fill this field. Pretend success so bots don't adapt. */
  if (body.website) return back('success');

  /* reCAPTCHA v3 verification, active only when the secret is configured. */
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (recaptchaSecret) {
    const token = body['recaptcha-token']?.toString();
    if (!token) return back('error');

    const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: recaptchaSecret, response: token }),
    });
    const result = await verify.json();
    if (!result.success || (typeof result.score === 'number' && result.score < 0.5)) {
      console.error('reCAPTCHA rejected', JSON.stringify(result));
      return back('error');
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

  const airtable = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE ?? '')}`,
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
    return back('error');
  }

  return back('success');
}
