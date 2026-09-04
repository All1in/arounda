import Link from 'next/link';
import type { Photo } from '@/types/photo';
import styles from './PhotoMeta.module.scss';

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

export default function PhotoMeta({ photo }: { photo: Photo }) {
  const publishedAt = formatDate(photo.createdAt);

  return (
    <div className={styles.meta}>
      <h1 className={styles.title}>{photo.description ?? photo.alt}</h1>

      <ul className={styles.stats} role="list">
        <li>
          {photo.likes.toLocaleString('en-US')} like{photo.likes === 1 ? '' : 's'}
        </li>
        {publishedAt ? (
          <li>
            Published <time dateTime={photo.createdAt ?? undefined}>{publishedAt}</time>
          </li>
        ) : null}
      </ul>

      {photo.tags.length > 0 ? (
        <>
          <h2 className="srOnly">Tags</h2>
          <ul className={styles.tags} role="list">
            {photo.tags.map((tag) => (
              <li key={tag}>
                <Link className={styles.tag} href={`/tags/${encodeURIComponent(tag)}`}>
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className={styles.attribution}>
        Photo by{' '}
        <a
          href={photo.photographer.profileUrl ?? photo.unsplashUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {photo.photographer.name}
        </a>{' '}
        on{' '}
        <a href={photo.unsplashUrl} target="_blank" rel="noopener noreferrer">
          Unsplash
        </a>
      </p>
    </div>
  );
}
