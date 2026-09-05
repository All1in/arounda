import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import GalleryFeed from '@/components/gallery/GalleryFeed';
import GalleryToolbar from '@/components/gallery/GalleryToolbar';
import GridSkeleton from '@/components/gallery/GridSkeleton';
import { COOKIE_NAME, parseLayoutMode } from '@/lib/layout-mode';
import { parsePage } from '@/lib/pagination';
import { normalizeQuery } from '@/lib/search';

// Next 16 decodes params for generateMetadata but not for the page.
function decodeTagParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

interface TagPageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const tag = normalizeQuery(decodeTagParam((await params).tag));

  return {
    title: `${tag} photos`,
    description: `Free high-resolution photos tagged “${tag}”.`,
  };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const tag = normalizeQuery(decodeTagParam((await params).tag));
  if (tag === '') notFound();

  const page = parsePage((await searchParams).page);
  const mode = parseLayoutMode((await cookies()).get(COOKIE_NAME)?.value);

  return (
    <>
      <GalleryToolbar>
        <h1>Photos tagged “{tag}”</h1>
      </GalleryToolbar>

      <Suspense key={`${tag}:${page}`} fallback={<GridSkeleton columns={mode} />}>
        <GalleryFeed
          source={{ kind: 'search', query: tag }}
          page={page}
          basePath={`/tags/${encodeURIComponent(tag)}`}
          baseQuery={{}}
        />
      </Suspense>
    </>
  );
}
