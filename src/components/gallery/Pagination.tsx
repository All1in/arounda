import Link from 'next/link';
import { buildPageHref, buildPageRange } from '@/lib/pagination';
import styles from './Pagination.module.scss';

export interface PaginationProps {
  current: number;
  totalPages: number | null;
  basePath: string;
  baseQuery?: Record<string, string>;
  hasNext?: boolean;
}

export default function Pagination({
  current,
  totalPages,
  basePath,
  baseQuery = {},
  hasNext = false,
}: PaginationProps) {
  const href = (target: number) => buildPageHref(basePath, baseQuery, target);

  // clamp like buildPageRange already does, or the highlight and the arrows disagree
  const page =
    totalPages === null ? Math.max(current, 1) : Math.min(Math.max(current, 1), totalPages);

  const hasPrev = page > 1;
  const nextAvailable = totalPages === null ? hasNext : page < totalPages;

  if (!hasPrev && !nextAvailable) return null;

  const range = totalPages === null ? [] : buildPageRange(page, totalPages);

  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      <ul className={styles.list} role="list">
        <li>
          {hasPrev ? (
            <Link className={styles.link} href={href(page - 1)} rel="prev">
              Previous
            </Link>
          ) : (
            <span className={styles.disabled} aria-disabled="true">
              Previous
            </span>
          )}
        </li>

        {range.map((item, index) =>
          item === 'ellipsis' ? (
            <li key={`ellipsis-${index}`} className={styles.ellipsis} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                className={item === page ? styles.current : styles.page}
                href={href(item)}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </Link>
            </li>
          ),
        )}

        <li>
          {nextAvailable ? (
            <Link className={styles.link} href={href(page + 1)} rel="next">
              Next
            </Link>
          ) : (
            <span className={styles.disabled} aria-disabled="true">
              Next
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
