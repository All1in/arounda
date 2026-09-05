import Link from 'next/link';
import { Suspense } from 'react';
import AccountNav from '@/features/account/AccountNav';
import { APP_NAME } from '@/lib/unsplash/attribution';
import SearchForm from './SearchForm';
import styles from './Header.module.scss';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.wordmark}>
          {APP_NAME}
        </Link>

        <div className={styles.search}>
          <Suspense fallback={<div className={styles.searchFallback} />}>
            <SearchForm />
          </Suspense>
        </div>

        <div className={styles.account}>
          <AccountNav />
        </div>
      </div>
    </header>
  );
}
