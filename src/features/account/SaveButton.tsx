'use client';

import { useRouter } from 'next/navigation';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { useAccount } from '@/features/account/useAccount';
import { useSavedPhotos } from '@/features/account/useSavedPhotos';
import type { Photo } from '@/types/photo';
import styles from './SaveButton.module.scss';

function ToggleIcon({ saved }: { saved: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d={saved ? 'M5 12.5 10 17.5 19 8.5' : 'M12 5v14M5 12h14'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SaveButton({
  photo,
  variant = 'card',
}: {
  photo: Photo;
  variant?: 'card' | 'page';
}) {
  const router = useRouter();
  const { signedIn } = useAccount();
  const { isSaved, toggle } = useSavedPhotos();

  const saved = isSaved(photo.id);
  const label = saved ? 'Remove from collection' : 'Save to collection';

  function handleClick() {
    if (!signedIn) {
      router.push('/login');
      return;
    }
    toggle(photo);
  }

  return (
    <button
      type="button"
      className={variant === 'page' ? styles.pageButton : styles.cardButton}
      aria-pressed={saved}
      onClick={handleClick}
    >
      <ToggleIcon saved={saved} />
      {variant === 'page' ? <span>{label}</span> : <VisuallyHidden>{label}</VisuallyHidden>}
    </button>
  );
}
