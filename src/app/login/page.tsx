import type { Metadata } from 'next';
import LoginForm from '@/features/account/LoginForm';
import { APP_NAME } from '@/lib/unsplash/attribution';
import styles from '@/features/account/AccountPage.module.scss';

export const metadata: Metadata = {
  title: `Log in — ${APP_NAME}`,
  description: `Log in to ${APP_NAME} to see the photos you have saved.`,
};

export default function LoginPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>Welcome back</h1>
      <p className={styles.subtitle}>Log in to pick up your collection where you left off.</p>
      <LoginForm />
    </section>
  );
}
