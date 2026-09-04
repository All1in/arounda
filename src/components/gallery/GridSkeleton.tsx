import VisuallyHidden from '@/components/ui/VisuallyHidden';
import type { ColumnCount } from '@/lib/masonry';
import styles from './GridSkeleton.module.scss';

// Fixed rather than random so the server and client skeletons match.
const RATIOS = [1.5, 0.75, 1.2, 0.66, 1.33, 0.8, 1.5, 1, 0.7, 1.25];

export default function GridSkeleton({ columns = 3 }: { columns?: ColumnCount }) {
  return (
    <div className={styles.wrapper} role="status" aria-busy="true">
      <VisuallyHidden>Loading photos</VisuallyHidden>
      <div className={styles.grid} data-cols={columns} aria-hidden="true">
        {Array.from({ length: columns }, (_, columnIndex) => (
          <div className={styles.column} key={columnIndex}>
            {RATIOS.map((ratio, index) => (
              <div
                className={styles.tile}
                key={index}
                style={{
                  aspectRatio: `1 / ${RATIOS[(index + columnIndex) % RATIOS.length] ?? ratio}`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
