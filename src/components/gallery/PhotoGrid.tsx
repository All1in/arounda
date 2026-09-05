'use client';

import SaveButton from '@/features/account/SaveButton';
import { distributeIntoColumns, type ColumnCount } from '@/lib/masonry';
import type { Photo } from '@/types/photo';
import { useLayoutMode } from './LayoutModeProvider';
import PhotoCard from './PhotoCard';
import styles from './PhotoGrid.module.scss';

// (1440 - 48 padding - gaps) / cols. The vw fallbacks round up on purpose.
const SIZES: Record<ColumnCount, string> = {
  3: '(min-width: 1440px) 448px, 33vw',
  5: '(min-width: 1440px) 260px, 20vw',
};

// boolean, not a render prop — functions can't cross the RSC boundary
export default function PhotoGrid({
  photos,
  showSaveButton = false,
}: {
  photos: Photo[];
  showSaveButton?: boolean;
}) {
  const { mode } = useLayoutMode();
  const columns = distributeIntoColumns(photos, mode);

  return (
    <section className={styles.grid} data-cols={mode} aria-label="Photos">
      {columns.map((column, columnIndex) => (
        <div className={styles.column} key={columnIndex}>
          {column.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              mode={mode}
              sizes={SIZES[mode]}
              priority={index === 0}
              actions={showSaveButton ? <SaveButton photo={photo} /> : undefined}
            />
          ))}
        </div>
      ))}
    </section>
  );
}
