'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import type { ColumnCount } from '@/lib/masonry';
import type { Photo } from '@/types/photo';
import styles from './PhotoCard.module.scss';

export default function PhotoCard({
  photo,
  mode,
  sizes,
  priority = false,
  actions,
}: {
  photo: Photo;
  mode: ColumnCount;
  sizes: string;
  priority?: boolean;
  actions?: ReactNode;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className={styles.card} data-mode={mode} aria-label={photo.alt}>
      <div
        className={styles.frame}
        style={{ aspectRatio: `${photo.width} / ${photo.height}`, backgroundColor: photo.color }}
      >
        <Link href={`/photos/${photo.id}`} className={styles.link}>
          {imageFailed ? (
            <VisuallyHidden>Image unavailable</VisuallyHidden>
          ) : (
            <Image
              className={styles.image}
              src={photo.rawUrl}
              alt={photo.alt}
              fill
              sizes={sizes}
              priority={priority}
              onError={() => setImageFailed(true)}
            />
          )}
        </Link>

        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>

      {/* moved, not duplicated: overlay on wide tiles, caption under narrow ones (see .scss) */}
      <div className={styles.overlay}>
        <a
          className={styles.author}
          href={photo.photographer.profileUrl ?? photo.unsplashUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {photo.photographer.avatarUrl ? (
            <Image
              className={styles.avatar}
              src={photo.photographer.avatarUrl}
              alt=""
              width={24}
              height={24}
            />
          ) : null}
          <span className={styles.authorName}>{photo.photographer.name}</span>
        </a>
        <a
          className={styles.source}
          href={photo.unsplashUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          on Unsplash
        </a>
      </div>
    </article>
  );
}
