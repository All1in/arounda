import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import LayoutModeProvider from '@/components/gallery/LayoutModeProvider';
import AccountProvider from '@/features/account/AccountProvider';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import SkipLink from '@/components/layout/SkipLink';
import { getLayoutMode } from '@/lib/layout-mode.server';
import { APP_NAME } from '@/lib/unsplash/attribution';
import './globals.scss';

export const metadata: Metadata = {
  title: `${APP_NAME} — Free high-resolution photos`,
  description: `Browse and search free high-resolution photos on ${APP_NAME}, powered by the Unsplash API.`,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const mode = await getLayoutMode();

  return (
    <html lang="en">
      <body>
        <LayoutModeProvider initialMode={mode}>
          <AccountProvider>
            <SkipLink />
            <Header />
            <main id="main" className="mainContent">
              {children}
            </main>
            <Footer />
          </AccountProvider>
        </LayoutModeProvider>
      </body>
    </html>
  );
}
