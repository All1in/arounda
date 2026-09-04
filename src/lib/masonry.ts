import type { Photo } from '@/types/photo';

export type ColumnCount = 3 | 5;

export function distributeIntoColumns(photos: Photo[], columnCount: ColumnCount): Photo[][] {
  const columns: Photo[][] = Array.from({ length: columnCount }, () => []);
  const heights: number[] = new Array<number>(columnCount).fill(0);

  for (const photo of photos) {
    let shortest = 0;
    for (let i = 1; i < columnCount; i += 1) {
      if ((heights[i] ?? 0) < (heights[shortest] ?? 0)) {
        shortest = i;
      }
    }

    columns[shortest]?.push(photo);
    heights[shortest] = (heights[shortest] ?? 0) + photo.height / photo.width;
  }

  return columns;
}
