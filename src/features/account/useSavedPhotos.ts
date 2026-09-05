'use client';

import { useContext } from 'react';
import { AccountContext } from '@/features/account/AccountProvider';
import { isPhotoSaved, removeSavedPhoto, toggleSavedPhoto } from '@/features/account/store';
import type { Photo } from '@/types/photo';

const NONE: Photo[] = [];

export interface SavedPhotosView {
  saved: Photo[];
  ready: boolean;
  isSaved: (id: string) => boolean;
  toggle: (photo: Photo) => void;
  remove: (id: string) => void;
}

export function useSavedPhotos(): SavedPhotosView {
  const snapshot = useContext(AccountContext);
  const saved = snapshot?.saved ?? NONE;

  return {
    saved,
    ready: snapshot !== null,
    isSaved: (id) => isPhotoSaved(saved, id),
    toggle: toggleSavedPhoto,
    remove: removeSavedPhoto,
  };
}
