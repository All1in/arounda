import styles from './SkipLink.module.scss';

export default function SkipLink() {
  return (
    <a href="#main" className={styles.skipLink}>
      Skip to content
    </a>
  );
}
