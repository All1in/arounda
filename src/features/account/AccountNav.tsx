'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Avatar from '@/features/account/Avatar';
import { logout } from '@/features/account/store';
import { useAccount } from '@/features/account/useAccount';
import styles from './AccountNav.module.scss';

export default function AccountNav() {
  const { account, signedIn, ready } = useAccount();
  const router = useRouter();
  const pathname = usePathname();

  if (!ready) {
    return <div className={styles.placeholder} aria-hidden="true" />;
  }

  function handleLogout() {
    logout();
    if (pathname === '/profile') router.push('/');
  }

  if (!signedIn || !account) {
    return (
      <nav className={styles.nav} aria-label="Account">
        <Link className={styles.link} href="/login">
          Log in
        </Link>
        <Link className={styles.primary} href="/register">
          Sign up
        </Link>
      </nav>
    );
  }

  return (
    <nav className={styles.nav} aria-label="Account">
      <Link className={styles.profile} href="/profile">
        <Avatar name={account.name} />
        <span className={styles.name}>{account.name}</span>
      </Link>
      <button type="button" className={styles.logout} onClick={handleLogout}>
        Log out
      </button>
    </nav>
  );
}
