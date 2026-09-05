import styles from './DemoNotice.module.scss';

export default function DemoNotice() {
  return (
    <p className={styles.notice}>
      Demo account: stored only in this browser (localStorage). No password, no server.
    </p>
  );
}
