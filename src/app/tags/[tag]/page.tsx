import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import GalleryFeed from '@/components/gallery/GalleryFeed';
import GalleryToolbar from '@/components/gallery/GalleryToolbar';
import GridSkeleton from '@/components/gallery/GridSkeleton';
import { getLayoutMode } from '@/lib/layout-mode.server';
import { parsePage } from '@/lib/pagination';
import { normalizeQuery } from '@/lib/search';

// Next 16 hands `params` decoded to generateMetadata but percent-encoded to the page,
// so only the page decodes. Decoding in both places double-decoded the tag.
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
  const tag = normalizeQuery((await params).tag);

  return {
    title: `${tag} photos`,
    description: `Free high-resolution photos tagged “${tag}”.`,
  };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const tag = normalizeQuery(decodeTagParam((await params).tag));
  if (tag === '') notFound();

  const page = parsePage((await searchParams).page);
  const mode = await getLayoutMode();

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
