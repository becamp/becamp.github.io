import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const name = data.get('name')?.toString().trim();
  const email = data.get('email')?.toString().trim();

  if (!name || !email) return redirect('/register?status=error', 303);

  /* Honeypot: real users never fill this field. Pretend success so bots don't adapt. */
  if (data.get('website')) return redirect('/register?status=success', 303);

  /* reCAPTCHA v3 verification, active only when the secret is configured. */
  const recaptchaSecret = import.meta.env.RECAPTCHA_SECRET_KEY;
  if (recaptchaSecret) {
    const token = data.get('recaptcha-token')?.toString();
    if (!token) return redirect('/register?status=error', 303);

    const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: recaptchaSecret, response: token }),
    });
    const result = await verify.json();
    if (!result.success || (typeof result.score === 'number' && result.score < 0.5)) {
      console.error('reCAPTCHA rejected', JSON.stringify(result));
      return redirect('/register?status=error', 303);
    }
  }

  /* Field names must match the Airtable column names exactly. */
  const fields: Record<string, string | boolean> = {
    'Guest Name': name,
    Email: email,
    "I'll be attending Pitch Night on Friday Oct 19th from 5pm -> 10pm": data.get('attend-friday') === 'on',
    "I'll be attending Sessions Oct 19th from 9am -> 4pm": data.get('attend-saturday') === 'on',
    'Directory Permission': data.get('attendee-directory') === 'on',
    'Yes, I can help out on Friday!': data.get('volunteer-friday') === 'on',
    'Yes, I can help out on Saturday!': data.get('volunteer-saturday') === 'on',
  };

  /* Only sent while the form shows the field; value must match a single-select option. */
  const shirtSize = data.get('shirt-size')?.toString();
  if (shirtSize) fields['T-shirt Size'] = shirtSize;

  const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE } = import.meta.env;

  const res = await fetch(
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

  if (!res.ok) {
    console.error('Airtable error', res.status, await res.text());
    return redirect('/register?status=error', 303);
  }

  return redirect('/register?status=success', 303);
};
