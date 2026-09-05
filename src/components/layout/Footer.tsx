import { APP_NAME, UNSPLASH_HOME_URL } from '@/lib/unsplash/attribution';
import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.credit}>
          Photos provided by{' '}
          <a href={UNSPLASH_HOME_URL} target="_blank" rel="noopener noreferrer">
            Unsplash
          </a>
          .
        </p>
        <p className={styles.name}>{APP_NAME}</p>
      </div>
    </footer>
  );
}
