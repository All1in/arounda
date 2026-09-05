import type { ReactNode } from 'react';
import LayoutToggle from './LayoutToggle';
import styles from './GalleryToolbar.module.scss';

export default function GalleryToolbar({ children }: { children: ReactNode }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.heading}>{children}</div>
      <LayoutToggle />
    </div>
  );
}
