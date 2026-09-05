'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { COOKIE_MAX_AGE, COOKIE_NAME } from '@/lib/layout-mode';
import type { ColumnCount } from '@/lib/masonry';

interface LayoutModeContextValue {
  mode: ColumnCount;
  setMode: (next: ColumnCount) => void;
}

const LayoutModeContext = createContext<LayoutModeContextValue | null>(null);

export default function LayoutModeProvider({
  initialMode,
  children,
}: {
  initialMode: ColumnCount;
  children: ReactNode;
}) {
  const [mode, setModeState] = useState<ColumnCount>(initialMode);

  const setMode = useCallback((next: ColumnCount) => {
    setModeState(next);
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return <LayoutModeContext.Provider value={value}>{children}</LayoutModeContext.Provider>;
}

export function useLayoutMode(): LayoutModeContextValue {
  const context = useContext(LayoutModeContext);
  if (!context) {
    throw new Error('useLayoutMode must be used inside LayoutModeProvider');
  }
  return context;
}
