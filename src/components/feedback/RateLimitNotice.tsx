import styles from './RateLimitNotice.module.scss';

export default function RateLimitNotice({ retryAfterSeconds }: { retryAfterSeconds?: number }) {
  const minutes =
    typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0
      ? Math.max(1, Math.ceil(retryAfterSeconds / 60))
      : null;

  return (
    <div className={styles.notice} role="status">
      <p className={styles.title}>The photo service rate limit was reached.</p>
      <p className={styles.description}>
        {minutes === null
          ? 'Please try again in a few minutes.'
          : `Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`}
      </p>
    </div>
  );
}
