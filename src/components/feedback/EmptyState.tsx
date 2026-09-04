import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './EmptyState.module.scss';

// h2 by default — most of these sit under a toolbar that already owns the h1
export default function EmptyState({
  title,
  description,
  links,
  headingLevel = 2,
}: {
  title: string;
  description?: ReactNode;
  links?: { href: string; label: string }[];
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <div className={styles.empty}>
      <Heading className={styles.title}>{title}</Heading>
      {description ? <p className={styles.description}>{description}</p> : null}
      {links && links.length > 0 ? (
        <p className={styles.links}>
          {links.map((link) => (
            <Link key={link.href + link.label} className={styles.link} href={link.href}>
              {link.label}
            </Link>
          ))}
        </p>
      ) : null}
    </div>
  );
}
