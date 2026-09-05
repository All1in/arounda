export type PageRangeItem = number | 'ellipsis';

// a deliberate ceiling: deep pages are all empty and each distinct one costs an API request
export const MAX_PAGE = 500;

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return 1;

  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return 1;

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;

  return Math.min(parsed, MAX_PAGE);
}

// page 1 is the bare path, never ?page=1 — one page, one URL
export function buildPageHref(
  basePath: string,
  baseQuery: Record<string, string>,
  page: number,
): string {
  const params = new URLSearchParams(baseQuery);
  if (page > 1) params.set('page', String(page));

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function buildPageRange(current: number, total: number, siblings = 1): PageRangeItem[] {
  if (total <= 0) return [];

  const page = Math.min(Math.max(current, 1), total);
  const maxVisible = siblings * 2 + 5; // first + last + 2 ellipses + current + siblings

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, total);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < total - 1;

  const items: PageRangeItem[] = [1];

  if (showLeftEllipsis) {
    items.push('ellipsis');
  } else {
    for (let i = 2; i < left; i += 1) items.push(i);
  }

  for (let i = left; i <= right; i += 1) {
    if (i !== 1 && i !== total) items.push(i);
  }

  if (showRightEllipsis) {
    items.push('ellipsis');
  } else {
    for (let i = right + 1; i < total; i += 1) items.push(i);
  }

  items.push(total);
  return items;
}
