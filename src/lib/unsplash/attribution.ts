export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Lumina';

export function withUtm(url: string | null | undefined): string | null {
  if (typeof url !== 'string' || url.trim() === '') return null;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('utm_source', APP_NAME);
    parsed.searchParams.set('utm_medium', 'referral');
    return parsed.toString();
  } catch {
    return null;
  }
}

export const UNSPLASH_HOME_URL = withUtm('https://unsplash.com') ?? 'https://unsplash.com';
