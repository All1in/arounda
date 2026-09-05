'use client';

import EmptyState from '@/components/feedback/EmptyState';
import Pagination from '@/components/gallery/Pagination';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import Avatar from '@/features/account/Avatar';
import { STORAGE_UNAVAILABLE_MESSAGE } from '@/features/account/store';
import { useAccount } from '@/features/account/useAccount';
import { useSavedPhotos } from '@/features/account/useSavedPhotos';
import styles from './ProfileCollection.module.scss';

const PAGE_SIZE = 30;

export default function ProfileCollection({ page }: { page: number }) {
  const { account, signedIn, storageAvailable, ready } = useAccount();
  const { saved } = useSavedPhotos();

  if (!ready) {
    return (
      <p className={styles.status} role="status">
        Loading your collection…
      </p>
    );
  }

  if (!storageAvailable) {
    return (
      <p className={styles.status} role="status">
        {STORAGE_UNAVAILABLE_MESSAGE}
      </p>
    );
  }

  if (!signedIn || !account) {
    return (
      <EmptyState
        title="Sign in to see your collection"
        description="The photos you save are kept in your account."
        links={[
          { href: '/login', label: 'Log in' },
          { href: '/register', label: 'Create an account' },
        ]}
      />
    );
  }

  const totalPages = Math.ceil(saved.length / PAGE_SIZE);
  const visible = saved.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className={styles.header}>
        <Avatar name={account.name} size={48} />
        <div className={styles.identity}>
          <p className={styles.name}>{account.name}</p>
          <p className={styles.count}>
            {saved.length.toLocaleString('en-US')} photo{saved.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Add a photo to your collection with the + button on any image."
          links={[{ href: '/', label: 'Browse the latest photos' }]}
        />
      ) : page > totalPages ? (
        <EmptyState
          title="No more photos"
          description="This page is past the end of your collection."
          links={[{ href: '/profile', label: 'Back to page 1' }]}
        />
      ) : (
        <>
          <PhotoGrid photos={visible} showSaveButton />
          <Pagination current={page} totalPages={totalPages} basePath="/profile" />
        </>
      )}
    </>
  );
}
