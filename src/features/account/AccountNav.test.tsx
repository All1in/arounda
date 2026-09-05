import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import AccountNav from '@/features/account/AccountNav';
import AccountProvider from '@/features/account/AccountProvider';
import { getSnapshot, registerAccount, subscribe } from '@/features/account/store';

const push = vi.hoisted(() => vi.fn());
const pathname = vi.hoisted(() => ({ current: '/' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname.current,
}));

function renderNav() {
  return render(
    <AccountProvider>
      <AccountNav />
    </AccountProvider>,
  );
}

beforeAll(() => {
  subscribe(() => {});
});

beforeEach(() => {
  push.mockClear();
  pathname.current = '/';
  window.localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage', { key: null }));
});

describe('AccountNav', () => {
  it('offers both entry points while signed out', () => {
    renderNav();

    const nav = screen.getByRole('navigation', { name: 'Account' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
  });

  it('shows the account name linking to the collection once signed in', () => {
    registerAccount({ name: 'Ada Lovelace', email: 'ada@example.com' });

    renderNav();

    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });

  it('signs out in place, without navigating, from anywhere but the collection', () => {
    registerAccount({ name: 'Ada', email: 'ada@example.com' });
    renderNav();

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(getSnapshot().signedIn).toBe(false);
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });

  it('leaves the collection when signing out from it', () => {
    pathname.current = '/profile';
    registerAccount({ name: 'Ada', email: 'ada@example.com' });
    renderNav();

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(push).toHaveBeenCalledWith('/');
  });

  it('keeps the account record so the same email can log back in', () => {
    registerAccount({ name: 'Ada', email: 'ada@example.com' });
    renderNav();

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(getSnapshot().account).toMatchObject({ name: 'Ada', email: 'ada@example.com' });
  });
});
