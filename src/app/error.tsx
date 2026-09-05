'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import styles from './error.module.scss';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrapper} role="alert">
      <p className={styles.title}>Something went wrong while loading photos.</p>
      <p className={styles.description}>
        The photo service did not respond as expected. You can try again.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={() => reset()}>
          Try again
        </button>
        <Link className={styles.link} href="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
