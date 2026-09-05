import type { Metadata } from 'next';
import RegisterForm from '@/features/account/RegisterForm';
import { APP_NAME } from '@/lib/unsplash/attribution';
import styles from '@/features/account/AccountPage.module.scss';

export const metadata: Metadata = {
  title: `Sign up — ${APP_NAME}`,
  description: `Create an account to save photos to your collection on ${APP_NAME}.`,
};

export default function RegisterPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>Create an account</h1>
      <p className={styles.subtitle}>Save the photos you love and keep them in one place.</p>
      <RegisterForm />
    </section>
  );
}
