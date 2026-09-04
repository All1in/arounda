import type { ColumnCount } from '@/lib/masonry';

export const LAYOUT_MODES: readonly ColumnCount[] = [3, 5];
export const DEFAULT_MODE: ColumnCount = 3;
export const COOKIE_NAME = 'gallery_cols';
export const COOKIE_MAX_AGE = 31536000;

export function parseLayoutMode(value: unknown): ColumnCount {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  return LAYOUT_MODES.includes(parsed as ColumnCount) ? (parsed as ColumnCount) : DEFAULT_MODE;
}
