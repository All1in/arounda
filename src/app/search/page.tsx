import type { Metadata } from 'next';
import { Suspense } from 'react';
import EmptyState from '@/components/feedback/EmptyState';
import GalleryFeed from '@/components/gallery/GalleryFeed';
import GalleryToolbar from '@/components/gallery/GalleryToolbar';
import GridSkeleton from '@/components/gallery/GridSkeleton';
import { getLayoutMode } from '@/lib/layout-mode.server';
import { parsePage } from '@/lib/pagination';
import { normalizeQuery } from '@/lib/search';
import { APP_NAME } from '@/lib/unsplash/attribution';

interface SearchPageProps {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = normalizeQuery((await searchParams).q);

  return {
    title: query === '' ? `Search photos — ${APP_NAME}` : `${query} — Photos`,
    description:
      query === ''
        ? `Search free high-resolution photos on ${APP_NAME}.`
        : `Free high-resolution photos matching “${query}”.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = normalizeQuery(params.q);
  const page = parsePage(params.page);
  const mode = await getLayoutMode();

  if (query === '') {
    return (
      <>
        <GalleryToolbar>
          <h1>Search photos</h1>
        </GalleryToolbar>
        <EmptyState
          title="What are you looking for?"
          description="Type something in the search field above."
          links={[{ href: '/', label: 'Browse the latest photos' }]}
        />
      </>
    );
  }

  return (
    <>
      <GalleryToolbar>
        <h1>Results for “{query}”</h1>
      </GalleryToolbar>

      <Suspense key={`${query}:${page}`} fallback={<GridSkeleton columns={mode} />}>
        <GalleryFeed
          source={{ kind: 'search', query }}
          page={page}
          basePath="/search"
          baseQuery={{ q: query }}
          showTotal
        />
      </Suspense>
    </>
  );
}
