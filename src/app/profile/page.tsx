import type { Metadata } from 'next';
import GalleryToolbar from '@/components/gallery/GalleryToolbar';
import DemoNotice from '@/features/account/DemoNotice';
import ProfileCollection from '@/features/account/ProfileCollection';
import { parsePage } from '@/lib/pagination';
import { APP_NAME } from '@/lib/unsplash/attribution';

export const metadata: Metadata = {
  title: `Your collection — ${APP_NAME}`,
  description: 'The photos you have saved to your collection.',
};

interface ProfilePageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const page = parsePage((await searchParams).page);

  return (
    <>
      <GalleryToolbar>
        <h1>Your collection</h1>
      </GalleryToolbar>

      <DemoNotice />
      <ProfileCollection page={page} />
    </>
  );
}
