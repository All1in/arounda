'use client';

import { createContext, useSyncExternalStore, type ReactNode } from 'react';
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  type StoreSnapshot,
} from '@/features/account/store';

// null until read in the browser, so SSR and the first client render agree
export type AccountContextValue = StoreSnapshot | null;

export const AccountContext = createContext<AccountContextValue>(null);

export default function AccountProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return <AccountContext.Provider value={snapshot}>{children}</AccountContext.Provider>;
}
