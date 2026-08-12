export const SPONSOR_EMAIL = 'ozanzal+becamp@gmail.com';

const mailto = (subject: string) =>
  SPONSOR_EMAIL ? `mailto:${SPONSOR_EMAIL}?subject=${encodeURIComponent(subject)}` : '#';

export const BECOME_SPONSOR_HREF = mailto('beCamp: Become a Sponsor');
export const BECOME_PREMIER_HREF = mailto('beCamp: Become a Premier Sponsor');
