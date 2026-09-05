import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import GalleryFeed from '@/components/gallery/GalleryFeed';
import GalleryToolbar from '@/components/gallery/GalleryToolbar';
import GridSkeleton from '@/components/gallery/GridSkeleton';
import { COOKIE_NAME, parseLayoutMode } from '@/lib/layout-mode';
import { parsePage } from '@/lib/pagination';
import { APP_NAME } from '@/lib/unsplash/attribution';

interface HomePageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  const suffix = page > 1 ? ` — Page ${page}` : '';

  return {
    title: `${APP_NAME} — Free high-resolution photos${suffix}`,
    description: `The latest free high-resolution photos on ${APP_NAME}, powered by the Unsplash API.`,
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const page = parsePage((await searchParams).page);
  const mode = parseLayoutMode((await cookies()).get(COOKIE_NAME)?.value);

  return (
    <>
      <GalleryToolbar>
        <h1>Latest photos</h1>
      </GalleryToolbar>

      <Suspense key={page} fallback={<GridSkeleton columns={mode} />}>
        <GalleryFeed source={{ kind: 'latest' }} page={page} basePath="/" baseQuery={{}} />
      </Suspense>
    </>
  );
}
