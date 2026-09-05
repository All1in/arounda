import EmptyState from '@/components/feedback/EmptyState';
import RateLimitNotice from '@/components/feedback/RateLimitNotice';
import { UnsplashApiError } from '@/lib/unsplash/errors';
import { buildPageHref } from '@/lib/pagination';
import { getPhotos, searchPhotos, type FeedResult } from '@/lib/unsplash/photos';
import Pagination from './Pagination';
import PhotoGrid from './PhotoGrid';
import styles from './GalleryFeed.module.scss';

export type FeedSource = { kind: 'latest' } | { kind: 'search'; query: string };

export interface GalleryFeedProps {
  source: FeedSource;
  page: number;
  basePath: string;
  baseQuery?: Record<string, string>;
  showTotal?: boolean;
}

export default async function GalleryFeed({
  source,
  page,
  basePath,
  baseQuery = {},
  showTotal = false,
}: GalleryFeedProps) {
  let result: FeedResult;

  try {
    result =
      source.kind === 'latest'
        ? await getPhotos({ page })
        : await searchPhotos({ query: source.query, page });
  } catch (error) {
    if (error instanceof UnsplashApiError) {
      console.error(
        `[unsplash] ${error.kind}${error.status ? ` (${error.status})` : ''} while loading ${basePath}`,
      );
      if (error.kind === 'rate_limit') {
        return <RateLimitNotice retryAfterSeconds={error.retryAfterSeconds} />;
      }
    }
    throw error;
  }

  const { photos, totalPages, total } = result;

  if (photos.length === 0) {
    if (page > 1) {
      const links = [{ href: buildPageHref(basePath, baseQuery, 1), label: 'Back to page 1' }];
      if (totalPages && totalPages > 1) {
        links.push({
          href: buildPageHref(basePath, baseQuery, totalPages),
          label: `Go to page ${totalPages}`,
        });
      }
      return (
        <EmptyState
          title="No more photos"
          description="This page is past the last result."
          links={links}
        />
      );
    }

    return source.kind === 'search' ? (
      <EmptyState
        title={`No results for “${source.query}”`}
        description="Try a different search."
        links={[{ href: '/', label: 'Back to the feed' }]}
      />
    ) : (
      <EmptyState title="No photos to show" description="Please try again later." />
    );
  }

  return (
    <>
      {showTotal && typeof total === 'number' ? (
        <p className={styles.total} aria-live="polite">
          {total.toLocaleString('en-US')} photo{total === 1 ? '' : 's'}
        </p>
      ) : null}

      <PhotoGrid photos={photos} showSaveButton />

      <Pagination
        current={page}
        totalPages={totalPages}
        basePath={basePath}
        baseQuery={baseQuery}
        // Unsplash returns short pages, so "full page = there's another" would disable Next.
        hasNext={photos.length > 0}
      />
    </>
  );
}
