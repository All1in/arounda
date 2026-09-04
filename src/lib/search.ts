const MAX_QUERY_LENGTH = 100;

export function normalizeQuery(value: string | string[] | undefined | null): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return '';

  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH);
}
