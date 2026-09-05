'use client';

import { useContext } from 'react';
import { AccountContext } from '@/features/account/AccountProvider';
import type { Account } from '@/features/account/store';

export interface AccountView {
  account: Account | null;
  signedIn: boolean;
  storageAvailable: boolean;
  ready: boolean;
}

export function useAccount(): AccountView {
  const snapshot = useContext(AccountContext);

  return {
    account: snapshot?.account ?? null,
    signedIn: snapshot?.signedIn ?? false,
    storageAvailable: snapshot?.storageAvailable ?? true,
    ready: snapshot !== null,
  };
}
