import { render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import LayoutModeProvider from '@/components/gallery/LayoutModeProvider';
import AccountProvider from '@/features/account/AccountProvider';
import ProfileCollection from '@/features/account/ProfileCollection';
import { registerAccount, subscribe } from '@/features/account/store';
import type { Photo } from '@/types/photo';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/profile',
}));

function photo(index: number): Photo {
  const id = `id${index}`.padEnd(11, 'x');

  return {
    id,
    width: 400,
    height: 300,
    color: '#dddddd',
    rawUrl: `https://images.unsplash.com/photo-${index}`,
    alt: `Photo ${index}`,
    description: null,
    likes: 0,
    createdAt: null,
    tags: [],
    unsplashUrl: 'https://unsplash.com/photos/x',
    photographer: { name: 'Ada', username: 'ada', profileUrl: null, avatarUrl: null },
  };
}

function seedSaved(count: number) {
  const photos = Array.from({ length: count }, (_, index) => photo(index));
  window.localStorage.setItem('gallery.saved', JSON.stringify(photos));
  window.dispatchEvent(new StorageEvent('storage', { key: 'gallery.saved' }));
}

function renderCollection(page = 1) {
  return render(
    <LayoutModeProvider initialMode={3}>
      <AccountProvider>
        <ProfileCollection page={page} />
      </AccountProvider>
    </LayoutModeProvider>,
  );
}

// one live subscriber keeps the storage listener attached, so clearing also drops the cache
beforeAll(() => {
  subscribe(() => {});
});

beforeEach(() => {
  window.localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage', { key: null }));
});

describe('ProfileCollection', () => {
  it('asks a signed-out visitor to sign in, and offers both routes', () => {
    renderCollection();

    expect(
      screen.getByRole('heading', { name: 'Sign in to see your collection' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.queryByRole('region', { name: 'Photos' })).not.toBeInTheDocument();
  });

  it('shows the account name and an empty state when nothing is saved', () => {
    registerAccount({ name: 'Ada Lovelace', email: 'ada@example.com' });

    renderCollection();

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('0 photos')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nothing saved yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse the latest photos' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('renders the saved photos and singularises a collection of one', () => {
    registerAccount({ name: 'Ada', email: 'ada@example.com' });
    seedSaved(1);

    renderCollection();

    expect(screen.getByText('1 photo')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('does not paginate a collection that fits on one page', () => {
    registerAccount({ name: 'Ada', email: 'ada@example.com' });
    seedSaved(30);

    renderCollection();

    expect(screen.getAllByRole('article')).toHaveLength(30);
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('pages the collection 30 at a time', () => {
    registerAccount({ name: 'Ada', email: 'ada@example.com' });
    seedSaved(35);

    const { unmount } = renderCollection(1);
    expect(screen.getByText('35 photos')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(30);
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('href', '/profile?page=2');
    unmount();

    renderCollection(2);
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });

  it('offers a way back when the page is past the end of the collection', () => {
    registerAccount({ name: 'Ada', email: 'ada@example.com' });
    seedSaved(35);

    renderCollection(9);

    expect(screen.getByRole('heading', { name: 'No more photos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to page 1' })).toHaveAttribute(
      'href',
      '/profile',
    );
    expect(screen.queryByRole('region', { name: 'Photos' })).not.toBeInTheDocument();
  });

  it('keeps the count visible even when the requested page is empty', () => {
    registerAccount({ name: 'Ada', email: 'ada@example.com' });
    seedSaved(35);

    renderCollection(9);

    expect(screen.getByText('35 photos')).toBeInTheDocument();
  });
});
