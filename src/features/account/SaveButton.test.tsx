import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import AccountProvider from '@/features/account/AccountProvider';
import SaveButton from '@/features/account/SaveButton';
import { getSnapshot, registerAccount, subscribe } from '@/features/account/store';
import type { Photo } from '@/types/photo';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/',
}));

const photo: Photo = {
  id: 'abc12345678',
  width: 4000,
  height: 3000,
  color: '#101010',
  rawUrl: 'https://images.unsplash.com/photo-1',
  alt: 'A quiet lake at sunrise',
  description: null,
  likes: 12,
  createdAt: null,
  tags: [],
  unsplashUrl: 'https://unsplash.com/photos/abc12345678',
  photographer: { name: 'Ada', username: 'ada', profileUrl: null, avatarUrl: null },
};

function renderButton(variant?: 'card' | 'page') {
  return render(
    <AccountProvider>
      <SaveButton photo={photo} variant={variant} />
    </AccountProvider>,
  );
}

// one live subscriber keeps the storage listener attached, so clearing also drops the cache
beforeAll(() => {
  subscribe(() => {});
});

beforeEach(() => {
  push.mockClear();
  window.localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage', { key: null }));
});

describe('SaveButton', () => {
  it('sends a signed-out visitor to the login page instead of saving', () => {
    renderButton();

    const button = screen.getByRole('button', { name: 'Save to collection' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button);

    expect(push).toHaveBeenCalledWith('/login');
    expect(getSnapshot().saved).toEqual([]);
  });

  it('toggles the photo in and out of the collection when signed in', () => {
    registerAccount({ name: 'Ada', email: 'ada@example.com' });
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Save to collection' }));

    const pressed = screen.getByRole('button', { name: 'Remove from collection' });
    expect(pressed).toHaveAttribute('aria-pressed', 'true');
    expect(getSnapshot().saved.map((item) => item.id)).toEqual([photo.id]);
    expect(push).not.toHaveBeenCalled();

    fireEvent.click(pressed);

    expect(screen.getByRole('button', { name: 'Save to collection' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(getSnapshot().saved).toEqual([]);
  });

  it('reflects a photo that was already saved in another tab', () => {
    registerAccount({ name: 'Ada', email: 'ada@example.com' });
    window.localStorage.setItem('gallery.saved', JSON.stringify([photo]));
    window.dispatchEvent(new StorageEvent('storage', { key: 'gallery.saved' }));

    renderButton();

    expect(screen.getByRole('button', { name: 'Remove from collection' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows a visible label in the photo page variant', () => {
    renderButton('page');

    expect(screen.getByRole('button', { name: 'Save to collection' })).toHaveTextContent(
      'Save to collection',
    );
  });
});
