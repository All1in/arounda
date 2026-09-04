import type { ImageLoaderProps } from 'next/image';

const UNSPLASH_IMAGE_HOSTS = new Set(['images.unsplash.com', 'plus.unsplash.com']);

export default function unsplashImageLoader({ src, width, quality }: ImageLoaderProps): string {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  if (!UNSPLASH_IMAGE_HOSTS.has(url.hostname)) {
    return src;
  }

  url.searchParams.set('w', String(width));
  url.searchParams.set('q', String(quality ?? 75));
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'max');
  // profile URLs carry their own h= — it would fight the width above
  url.searchParams.delete('h');

  return url.toString();
}
