import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LayoutModeProvider from '@/components/gallery/LayoutModeProvider';
import AccountProvider from '@/features/account/AccountProvider';
import { UnsplashApiError } from '@/lib/unsplash/errors';
import type { Photo } from '@/types/photo';
import type { GalleryFeedProps } from './GalleryFeed';

const getPhotos = vi.hoisted(() => vi.fn());
const searchPhotos = vi.hoisted(() => vi.fn());

vi.mock('@/lib/unsplash/photos', () => ({ getPhotos, searchPhotos, PER_PAGE: 30 }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

const GalleryFeed = (await import('./GalleryFeed')).default;

function photo(id: string): Photo {
  return {
    id,
    width: 4000,
    height: 3000,
    color: '#101010',
    rawUrl: `https://images.unsplash.com/photo-${id}`,
    alt: `Photo ${id}`,
    description: null,
    likes: 0,
    createdAt: null,
    tags: [],
    unsplashUrl: `https://unsplash.com/photos/${id}`,
    photographer: { name: 'Ada', username: 'ada', profileUrl: null, avatarUrl: null },
  };
}

// async RSC — await it to JSX, then wrap in the providers the client children need
async function renderFeed(props: GalleryFeedProps) {
  const ui = await GalleryFeed(props);

  return render(
    <LayoutModeProvider initialMode={3}>
      <AccountProvider>{ui}</AccountProvider>
    </LayoutModeProvider>,
  );
}

const latest: GalleryFeedProps = {
  source: { kind: 'latest' },
  page: 1,
  basePath: '/',
  baseQuery: {},
};

beforeEach(() => {
  getPhotos.mockReset();
  searchPhotos.mockReset();
  // the component logs every UnsplashApiError
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GalleryFeed', () => {
  it('renders the grid and pagination for a page of results', async () => {
    getPhotos.mockResolvedValue({ photos: [photo('a'), photo('b')], totalPages: 4, total: 100 });

    await renderFeed({ ...latest, page: 2 });

    expect(screen.getByRole('region', { name: 'Photos' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });

  it('reads the latest feed for the latest source and the query for a search source', async () => {
    getPhotos.mockResolvedValue({ photos: [photo('a')], totalPages: 1, total: 1 });
    await renderFeed({ ...latest, page: 3 });
    expect(getPhotos).toHaveBeenCalledWith({ page: 3 });
    expect(searchPhotos).not.toHaveBeenCalled();

    searchPhotos.mockResolvedValue({ photos: [photo('b')], totalPages: 1, total: 1 });
    await renderFeed({
      source: { kind: 'search', query: 'blue sky' },
      page: 2,
      basePath: '/search',
      baseQuery: { q: 'blue sky' },
    });
    expect(searchPhotos).toHaveBeenCalledWith({ query: 'blue sky', page: 2 });
  });

  it('shows the result count only when asked for', async () => {
    searchPhotos.mockResolvedValue({ photos: [photo('a')], totalPages: 1, total: 10003 });

    const { unmount } = await renderFeed({
      source: { kind: 'search', query: 'nature' },
      page: 1,
      basePath: '/search',
      baseQuery: { q: 'nature' },
      showTotal: true,
    });
    expect(screen.getByText('10,003 photos')).toBeInTheDocument();
    unmount();

    getPhotos.mockResolvedValue({ photos: [photo('a')], totalPages: 1, total: 10003 });
    await renderFeed(latest);
    expect(screen.queryByText('10,003 photos')).not.toBeInTheDocument();
  });

  it('singularises the result count', async () => {
    searchPhotos.mockResolvedValue({ photos: [photo('a')], totalPages: 1, total: 1 });

    await renderFeed({
      source: { kind: 'search', query: 'x' },
      page: 1,
      basePath: '/search',
      baseQuery: { q: 'x' },
      showTotal: true,
    });

    expect(screen.getByText('1 photo')).toBeInTheDocument();
  });

  it('prompts to try another search when a search returns nothing on page 1', async () => {
    searchPhotos.mockResolvedValue({ photos: [], totalPages: 0, total: 0 });

    await renderFeed({
      source: { kind: 'search', query: 'zzzqqq' },
      page: 1,
      basePath: '/search',
      baseQuery: { q: 'zzzqqq' },
    });

    expect(screen.getByRole('heading', { name: 'No results for “zzzqqq”' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('reports an empty latest feed as a service problem, not as a missing search', async () => {
    getPhotos.mockResolvedValue({ photos: [], totalPages: null });

    await renderFeed(latest);

    expect(screen.getByRole('heading', { name: 'No photos to show' })).toBeInTheDocument();
  });

  it('offers a way back when the page is past the last result', async () => {
    getPhotos.mockResolvedValue({ photos: [], totalPages: 12, total: 350 });

    await renderFeed({ ...latest, page: 99 });

    expect(screen.getByRole('heading', { name: 'No more photos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to page 1' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Go to page 12' })).toHaveAttribute(
      'href',
      '/?page=12',
    );
  });

  it('keeps the search query in the links out of an out-of-range page', async () => {
    searchPhotos.mockResolvedValue({ photos: [], totalPages: 5, total: 130 });

    await renderFeed({
      source: { kind: 'search', query: 'blue sky' },
      page: 40,
      basePath: '/search',
      baseQuery: { q: 'blue sky' },
    });

    expect(screen.getByRole('link', { name: 'Back to page 1' })).toHaveAttribute(
      'href',
      '/search?q=blue+sky',
    );
    expect(screen.getByRole('link', { name: 'Go to page 5' })).toHaveAttribute(
      'href',
      '/search?q=blue+sky&page=5',
    );
  });

  it('omits the last-page link when the total is unknown', async () => {
    getPhotos.mockResolvedValue({ photos: [], totalPages: null });

    await renderFeed({ ...latest, page: 4 });

    expect(screen.getByRole('link', { name: 'Back to page 1' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Go to page/ })).not.toBeInTheDocument();
  });

  it('renders a notice instead of throwing when the key is rate limited', async () => {
    getPhotos.mockRejectedValue(
      new UnsplashApiError('rate_limit', 'nope', { status: 429, retryAfterSeconds: 120 }),
    );

    await renderFeed(latest);

    expect(screen.getByRole('status')).toHaveTextContent('rate limit was reached');
    expect(screen.getByText(/about 2 minutes/)).toBeInTheDocument();
  });

  it.each(['unauthorized', 'timeout', 'network', 'server', 'invalid_response'] as const)(
    'rethrows a %s error so the error boundary handles it',
    async (kind) => {
      getPhotos.mockRejectedValue(new UnsplashApiError(kind, 'nope', { status: 500 }));

      await expect(renderFeed(latest)).rejects.toBeInstanceOf(UnsplashApiError);
    },
  );

  it('rethrows errors that are not UnsplashApiError at all', async () => {
    getPhotos.mockRejectedValue(new TypeError('something else entirely'));

    await expect(renderFeed(latest)).rejects.toBeInstanceOf(TypeError);
  });

  it('logs the failure kind, status and path without leaking the key', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPhotos.mockRejectedValue(
      new UnsplashApiError('rate_limit', 'nope', { status: 403, retryAfterSeconds: 60 }),
    );

    await renderFeed({ ...latest, basePath: '/tags/x' });

    expect(logged).toHaveBeenCalledWith('[unsplash] rate_limit (403) while loading /tags/x');
  });
});
