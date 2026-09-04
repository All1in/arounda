import 'server-only';

import type { Photo } from '@/types/photo';
import { withUtm } from '@/lib/unsplash/attribution';
import type { RawUnsplashPhoto } from '@/lib/unsplash/types';

const MAX_ALT_LENGTH = 160;
const FALLBACK_COLOR = '#f2f2f2';
const FALLBACK_WIDTH = 4;
const FALLBACK_HEIGHT = 3;

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

export function normalizePhoto(raw: RawUnsplashPhoto | null | undefined): Photo | null {
  if (!raw) return null;

  const id = cleanText(raw.id);
  const rawUrl = cleanText(raw.urls?.raw);
  if (!id || !rawUrl) return null;

  const width = typeof raw.width === 'number' && raw.width > 0 ? raw.width : 0;
  const height = typeof raw.height === 'number' && raw.height > 0 ? raw.height : 0;
  const hasDimensions = width > 0 && height > 0;

  const name = cleanText(raw.user?.name) ?? 'Unknown';
  const description = cleanText(raw.description);
  const altSource = cleanText(raw.alt_description) ?? description ?? `Photo by ${name}`;

  const tags = Array.from(
    new Set(
      (raw.tags ?? [])
        .map((tag) => cleanText(tag?.title))
        .filter((title): title is string => title !== null),
    ),
  );

  return {
    id,
    width: hasDimensions ? width : FALLBACK_WIDTH,
    height: hasDimensions ? height : FALLBACK_HEIGHT,
    color: cleanText(raw.color) ?? FALLBACK_COLOR,
    rawUrl,
    alt: truncate(altSource, MAX_ALT_LENGTH),
    description,
    likes: typeof raw.likes === 'number' && Number.isFinite(raw.likes) ? raw.likes : 0,
    createdAt: cleanText(raw.created_at),
    tags,
    unsplashUrl: withUtm(raw.links?.html) ?? 'https://unsplash.com',
    photographer: {
      name,
      username: cleanText(raw.user?.username) ?? '',
      profileUrl: withUtm(raw.user?.links?.html),
      avatarUrl: cleanText(raw.user?.profile_image?.medium),
    },
  };
}

export function normalizePhotos(
  raw: (RawUnsplashPhoto | null | undefined)[] | null | undefined,
): Photo[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const photos: Photo[] = [];

  for (const item of raw) {
    const photo = normalizePhoto(item);
    if (!photo || seen.has(photo.id)) continue;
    seen.add(photo.id);
    photos.push(photo);
  }

  return photos;
}
