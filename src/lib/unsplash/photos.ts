import 'server-only';

import type { Photo } from '@/types/photo';
import { MAX_PAGE } from '@/lib/pagination';
import { unsplashFetch } from '@/lib/unsplash/client';
import { UnsplashApiError } from '@/lib/unsplash/errors';
import { normalizePhoto, normalizePhotos } from '@/lib/unsplash/normalize';
import type { RawUnsplashPhoto, RawUnsplashSearchResponse } from '@/lib/unsplash/types';

export const PER_PAGE = 30;

// Demo key is 50 req/hour, so the cache window is the quota. Feeds move; a single photo doesn't.
export const FEED_REVALIDATE_SECONDS = 3600;
export const PHOTO_REVALIDATE_SECONDS = 86400;

export interface FeedResult {
  photos: Photo[];
  totalPages: number | null;
  total?: number;
}

// parsePage refuses to read past MAX_PAGE, so the count must not link past it either
function clampPages(pages: number): number {
  return Math.min(pages, MAX_PAGE);
}

export async function getPhotos({ page }: { page: number }): Promise<FeedResult> {
  const { data, total } = await unsplashFetch<RawUnsplashPhoto[]>(
    '/photos',
    {
      page,
      per_page: PER_PAGE,
      order_by: 'latest',
    },
    { revalidate: FEED_REVALIDATE_SECONDS },
  );

  return {
    photos: normalizePhotos(data),
    totalPages: total === undefined ? null : clampPages(Math.ceil(total / PER_PAGE)),
    total,
  };
}

export async function searchPhotos({
  query,
  page,
}: {
  query: string;
  page: number;
}): Promise<FeedResult> {
  const { data } = await unsplashFetch<RawUnsplashSearchResponse>(
    '/search/photos',
    {
      query,
      page,
      per_page: PER_PAGE,
      content_filter: 'high',
    },
    { revalidate: FEED_REVALIDATE_SECONDS },
  );

  return {
    photos: normalizePhotos(data?.results),
    totalPages: typeof data?.total_pages === 'number' ? clampPages(data.total_pages) : 0,
    total: typeof data?.total === 'number' ? data.total : 0,
  };
}

export async function getPhoto(id: string): Promise<Photo | null> {
  try {
    const { data } = await unsplashFetch<RawUnsplashPhoto>(
      `/photos/${encodeURIComponent(id)}`,
      {},
      { revalidate: PHOTO_REVALIDATE_SECONDS },
    );
    return normalizePhoto(data);
  } catch (error) {
    if (error instanceof UnsplashApiError && error.kind === 'not_found') {
      return null;
    }
    throw error;
  }
}
