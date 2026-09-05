'use client';

import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { LAYOUT_MODES } from '@/lib/layout-mode';
import type { ColumnCount } from '@/lib/masonry';
import { useLayoutMode } from './LayoutModeProvider';
import styles from './LayoutToggle.module.scss';

function ColumnsIcon({ count }: { count: ColumnCount }) {
  const gap = 2;
  const total = 24;
  const width = (total - gap * (count - 1)) / count;

  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      {Array.from({ length: count }, (_, index) => (
        <rect
          key={index}
          x={index * (width + gap)}
          y={2}
          width={width}
          height={20}
          rx={1}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

export default function LayoutToggle() {
  const { mode, setMode } = useLayoutMode();

  return (
    <div role="group" aria-label="Gallery layout" className={styles.group}>
      {LAYOUT_MODES.map((value) => (
        <button
          key={value}
          type="button"
          className={styles.button}
          aria-pressed={mode === value}
          onClick={() => setMode(value)}
        >
          <ColumnsIcon count={value} />
          <VisuallyHidden>{value} columns</VisuallyHidden>
        </button>
      ))}
    </div>
  );
}
