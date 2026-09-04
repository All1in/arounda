import 'server-only';

export function getUnsplashAccessKey(): string {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    throw new Error('UNSPLASH_ACCESS_KEY is not set');
  }
  return key;
}
