import 'server-only';

import { cookies } from 'next/headers';
import { COOKIE_NAME, parseLayoutMode } from '@/lib/layout-mode';
import type { ColumnCount } from '@/lib/masonry';

// layout-mode.ts stays client-safe (LayoutModeProvider imports its constants), so the
// cookie read lives here instead.
export async function getLayoutMode(): Promise<ColumnCount> {
  return parseLayoutMode((await cookies()).get(COOKIE_NAME)?.value);
}
