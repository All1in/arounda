import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnsplashApiError } from '@/lib/unsplash/errors';
import type { RawUnsplashPhoto } from '@/lib/unsplash/types';

const unsplashFetch = vi.hoisted(() => vi.fn());
vi.mock('@/lib/unsplash/client', () => ({ unsplashFetch }));

const {
  FEED_REVALIDATE_SECONDS,
  PER_PAGE,
  PHOTO_REVALIDATE_SECONDS,
  getPhoto,
  getPhotos,
  searchPhotos,
} = await import('@/lib/unsplash/photos');

function rawPhoto(id: string): RawUnsplashPhoto {
  return {
    id,
    width: 4000,
    height: 3000,
    urls: { raw: `https://images.unsplash.com/photo-${id}` },
    links: { html: `https://unsplash.com/photos/${id}` },
    user: { name: 'Ada', username: 'ada', links: { html: 'https://unsplash.com/@ada' } },
  };
}

beforeEach(() => {
  unsplashFetch.mockReset();
});

describe('getPhotos', () => {
  it('requests the latest feed with the shared page size and the feed revalidate window', async () => {
    unsplashFetch.mockResolvedValue({ data: [], total: 0 });

    await getPhotos({ page: 4 });

    expect(unsplashFetch).toHaveBeenCalledWith(
      '/photos',
      { page: 4, per_page: PER_PAGE, order_by: 'latest' },
      { revalidate: FEED_REVALIDATE_SECONDS },
    );
  });

  it('derives the page count from the X-Total header', async () => {
    unsplashFetch.mockResolvedValue({ data: [rawPhoto('a')], total: 61 });

    const result = await getPhotos({ page: 1 });

    // 61 / 30 = 3 pages, not 2
    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(61);
    expect(result.photos.map((photo) => photo.id)).toEqual(['a']);
  });

  it('reports an unknown page count as null rather than zero', async () => {
    unsplashFetch.mockResolvedValue({ data: [rawPhoto('a')], total: undefined });

    const result = await getPhotos({ page: 1 });

    // null = unknown (Prev/Next fallback). 0 would mean no pages at all.
    expect(result.totalPages).toBeNull();
  });

  it('drops unusable and duplicate entries', async () => {
    unsplashFetch.mockResolvedValue({
      data: [rawPhoto('a'), rawPhoto('a'), { id: 'b' }, null],
      total: 30,
    });

    const result = await getPhotos({ page: 1 });

    // 'a' twice collapses to one; 'b' has no urls.raw
    expect(result.photos.map((photo) => photo.id)).toEqual(['a']);
  });

  it('lets a failure propagate so the caller can branch on its kind', async () => {
    unsplashFetch.mockRejectedValue(new UnsplashApiError('rate_limit', 'nope'));

    await expect(getPhotos({ page: 1 })).rejects.toBeInstanceOf(UnsplashApiError);
  });
});

describe('searchPhotos', () => {
  it('requests search with a safe content filter and the feed revalidate window', async () => {
    unsplashFetch.mockResolvedValue({ data: { results: [], total: 0, total_pages: 0 } });

    await searchPhotos({ query: 'blue sky', page: 2 });

    expect(unsplashFetch).toHaveBeenCalledWith(
      '/search/photos',
      { query: 'blue sky', page: 2, per_page: PER_PAGE, content_filter: 'high' },
      { revalidate: FEED_REVALIDATE_SECONDS },
    );
  });

  it('reads the page count and total from the search envelope', async () => {
    unsplashFetch.mockResolvedValue({
      data: { results: [rawPhoto('a'), rawPhoto('b')], total: 334, total_pages: 12 },
    });

    const result = await searchPhotos({ query: 'lake', page: 1 });

    expect(result.photos.map((photo) => photo.id)).toEqual(['a', 'b']);
    expect(result.totalPages).toBe(12);
    expect(result.total).toBe(334);
  });

  it.each([
    ['a null body', null],
    ['an empty object', {}],
    ['a string where results should be', { results: 'nope', total: 'x', total_pages: null }],
  ])('survives %s', async (_label, data) => {
    unsplashFetch.mockResolvedValue({ data });

    const result = await searchPhotos({ query: 'lake', page: 1 });

    expect(result.photos).toEqual([]);
    expect(result.totalPages).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('getPhoto', () => {
  it('requests one photo with the long revalidate window', async () => {
    unsplashFetch.mockResolvedValue({ data: rawPhoto('abc12345678') });

    await getPhoto('abc12345678');

    expect(unsplashFetch).toHaveBeenCalledWith(
      '/photos/abc12345678',
      {},
      { revalidate: PHOTO_REVALIDATE_SECONDS },
    );
  });

  it('caches a single photo for longer than a feed page', () => {
    expect(PHOTO_REVALIDATE_SECONDS).toBeGreaterThan(FEED_REVALIDATE_SECONDS);
  });

  it('returns the normalized photo', async () => {
    unsplashFetch.mockResolvedValue({ data: rawPhoto('abc12345678') });

    const photo = await getPhoto('abc12345678');

    expect(photo?.id).toBe('abc12345678');
    expect(photo?.photographer.name).toBe('Ada');
  });

  // this is what the photo route turns into a 404 — only not_found may become null
  it('turns a not_found error into null', async () => {
    unsplashFetch.mockRejectedValue(new UnsplashApiError('not_found', 'gone', { status: 404 }));

    await expect(getPhoto('abc12345678')).resolves.toBeNull();
  });

  it.each(['rate_limit', 'unauthorized', 'timeout', 'network', 'server', 'invalid_response'])(
    'rethrows a %s error instead of reporting the photo as missing',
    async (kind) => {
      const thrown = new UnsplashApiError(
        kind as ConstructorParameters<typeof UnsplashApiError>[0],
        'boom',
      );
      unsplashFetch.mockRejectedValue(thrown);

      await expect(getPhoto('abc12345678')).rejects.toBe(thrown);
    },
  );

  it('rethrows a non-Unsplash error untouched', async () => {
    const thrown = new TypeError('something else broke');
    unsplashFetch.mockRejectedValue(thrown);

    await expect(getPhoto('abc12345678')).rejects.toBe(thrown);
  });

  it('returns null when the payload cannot be normalized', async () => {
    unsplashFetch.mockResolvedValue({ data: { id: 'abc12345678' } });

    await expect(getPhoto('abc12345678')).resolves.toBeNull();
  });
});
