import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import RateLimitNotice from '@/components/feedback/RateLimitNotice';
import PhotoHero from '@/components/photo/PhotoHero';
import PhotoMeta from '@/components/photo/PhotoMeta';
import SaveButton from '@/features/account/SaveButton';
import { UnsplashApiError } from '@/lib/unsplash/errors';
import { getPhoto } from '@/lib/unsplash/photos';
import type { Photo } from '@/types/photo';
import styles from './page.module.scss';

const PHOTO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

interface PhotoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const { id } = await params;
  if (!PHOTO_ID_PATTERN.test(id)) return { title: 'Photo not found' };

  try {
    const photo = await getPhoto(id);
    if (!photo) return { title: 'Photo not found' };

    return {
      title: `${photo.alt} by ${photo.photographer.name}`,
      description: photo.description ?? photo.alt,
    };
  } catch {
    return { title: 'Photo' };
  }
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params;
  if (!PHOTO_ID_PATTERN.test(id)) notFound();

  let photo: Photo | null;
  try {
    photo = await getPhoto(id);
  } catch (error) {
    if (error instanceof UnsplashApiError) {
      console.error(
        `[unsplash] ${error.kind}${error.status ? ` (${error.status})` : ''} while loading /photos/${id}`,
      );
      if (error.kind === 'rate_limit') {
        return <RateLimitNotice retryAfterSeconds={error.retryAfterSeconds} />;
      }
    }
    throw error;
  }

  if (!photo) notFound();

  return (
    <article className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.photographer}>
          {photo.photographer.avatarUrl ? (
            <Image
              className={styles.avatar}
              src={photo.photographer.avatarUrl}
              alt=""
              width={32}
              height={32}
            />
          ) : null}
          <span className={styles.names}>
            {photo.photographer.profileUrl ? (
              <a
                className={styles.name}
                href={photo.photographer.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {photo.photographer.name}
              </a>
            ) : (
              <span className={styles.name}>{photo.photographer.name}</span>
            )}
            {photo.photographer.username ? (
              <span className={styles.username}>@{photo.photographer.username}</span>
            ) : null}
          </span>
        </div>

        <div className={styles.topActions}>
          <SaveButton photo={photo} variant="page" />
          <a
            className={styles.viewOn}
            href={photo.unsplashUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Unsplash
          </a>
        </div>
      </div>

      <PhotoHero photo={photo} />
      <PhotoMeta photo={photo} />
    </article>
  );
}
