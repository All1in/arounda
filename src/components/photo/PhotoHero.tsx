import Image from 'next/image';
import type { Photo } from '@/types/photo';
import styles from './PhotoHero.module.scss';

export default function PhotoHero({ photo }: { photo: Photo }) {
  return (
    <div
      className={styles.frame}
      style={{
        aspectRatio: `${photo.width} / ${photo.height}`,
        maxWidth: `calc(80vh * ${photo.width} / ${photo.height})`,
        backgroundColor: photo.color,
      }}
    >
      <Image
        className={styles.image}
        src={photo.rawUrl}
        alt={photo.alt}
        fill
        sizes="(max-width: 1023px) 100vw, 1000px"
        priority
      />
    </div>
  );
}
