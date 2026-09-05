import styles from './Avatar.module.scss';

export default function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? '';

  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
