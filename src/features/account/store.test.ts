import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Photo } from '@/types/photo';

type Store = typeof import('./store');

let store: Store;

function makePhoto(id: string): Photo {
  return {
    id,
    width: 4000,
    height: 3000,
    color: '#101010',
    rawUrl: `https://images.unsplash.com/photo-${id}`,
    alt: `Photo ${id}`,
    description: null,
    likes: 3,
    createdAt: '2024-05-01T10:00:00Z',
    tags: ['lake'],
    unsplashUrl: `https://unsplash.com/photos/${id}`,
    photographer: { name: 'Ada', username: 'ada', profileUrl: null, avatarUrl: null },
  };
}

beforeEach(async () => {
  window.localStorage.clear();
  vi.resetModules();
  store = await import('./store');
});

describe('account store — registration', () => {
  it('stores the account, signs in and persists across a reload', async () => {
    expect(store.registerAccount({ name: '  Ada Lovelace ', email: 'ADA@example.com ' })).toEqual({
      ok: true,
    });

    expect(store.getSnapshot()).toMatchObject({
      account: { name: 'Ada Lovelace', email: 'ada@example.com' },
      signedIn: true,
    });

    vi.resetModules();
    const reloaded: Store = await import('./store');
    expect(reloaded.getSnapshot()).toMatchObject({
      account: { email: 'ada@example.com' },
      signedIn: true,
    });
  });

  it('rejects a name outside 2–50 characters', () => {
    expect(store.registerAccount({ name: 'A', email: 'ada@example.com' })).toEqual({
      ok: false,
      field: 'name',
      message: store.INVALID_NAME_MESSAGE,
    });
    expect(store.registerAccount({ name: 'x'.repeat(51), email: 'ada@example.com' })).toEqual({
      ok: false,
      field: 'name',
      message: store.INVALID_NAME_MESSAGE,
    });
    expect(store.getSnapshot().account).toBeNull();
  });

  it('rejects a malformed email', () => {
    expect(store.registerAccount({ name: 'Ada', email: 'ada@example' })).toEqual({
      ok: false,
      field: 'email',
      message: store.INVALID_EMAIL_MESSAGE,
    });
  });

  it('rejects a duplicate email regardless of case', () => {
    store.registerAccount({ name: 'Ada', email: 'ada@example.com' });

    expect(store.registerAccount({ name: 'Ada Again', email: 'Ada@Example.com' })).toEqual({
      ok: false,
      field: 'email',
      message: store.DUPLICATE_EMAIL_MESSAGE,
    });
  });
});

describe('account store — field validators', () => {
  it('shares the name rule and message with the registration guard', () => {
    expect(store.validateName('A')).toBe('Enter a name between 2 and 50 characters.');
    expect(store.validateName('x'.repeat(51))).toBe(store.INVALID_NAME_MESSAGE);
    expect(store.validateName('  Ad  ')).toBeNull();

    expect(store.registerAccount({ name: 'A', email: 'ada@example.com' })).toEqual({
      ok: false,
      field: 'name',
      message: store.validateName('A'),
    });
  });

  it('shares the email rule and message with both guards', () => {
    expect(store.validateEmail('nope')).toBe('Enter a valid email address.');
    expect(store.validateEmail(' ADA@example.com ')).toBeNull();

    expect(store.loginAccount({ email: 'nope' })).toEqual({
      ok: false,
      field: 'email',
      message: store.validateEmail('nope'),
    });
  });
});

describe('account store — login and logout', () => {
  beforeEach(() => {
    store.registerAccount({ name: 'Ada', email: 'ada@example.com' });
    store.logout();
  });

  it('keeps the account record but clears the signed-in flag on logout', () => {
    expect(store.getSnapshot()).toMatchObject({
      account: { email: 'ada@example.com' },
      signedIn: false,
    });
  });

  it('signs in an existing email', () => {
    expect(store.loginAccount({ email: ' Ada@example.com ' })).toEqual({ ok: true });
    expect(store.getSnapshot().signedIn).toBe(true);
  });

  it('reports an unknown email without signing in', () => {
    expect(store.loginAccount({ email: 'grace@example.com' })).toEqual({
      ok: false,
      field: 'email',
      message: store.UNKNOWN_EMAIL_MESSAGE,
    });
    expect(store.getSnapshot().signedIn).toBe(false);
  });

  it('validates the email before looking it up', () => {
    expect(store.loginAccount({ email: 'nope' })).toEqual({
      ok: false,
      field: 'email',
      message: store.INVALID_EMAIL_MESSAGE,
    });
  });
});

describe('account store — saved photos', () => {
  it('saves newest first and toggles the same photo off', () => {
    store.toggleSavedPhoto(makePhoto('one'));
    store.toggleSavedPhoto(makePhoto('two'));

    expect(store.getSnapshot().saved.map((photo) => photo.id)).toEqual(['two', 'one']);

    store.toggleSavedPhoto(makePhoto('two'));
    expect(store.getSnapshot().saved.map((photo) => photo.id)).toEqual(['one']);
  });

  it('removes a saved photo by id and ignores unknown ids', () => {
    store.toggleSavedPhoto(makePhoto('one'));
    store.removeSavedPhoto('missing');
    expect(store.getSnapshot().saved).toHaveLength(1);

    store.removeSavedPhoto('one');
    expect(store.getSnapshot().saved).toEqual([]);
  });

  it('persists the full photo snapshot so the profile needs no API call', async () => {
    store.toggleSavedPhoto(makePhoto('one'));

    vi.resetModules();
    const reloaded: Store = await import('./store');
    expect(reloaded.getSnapshot().saved[0]).toEqual(makePhoto('one'));
  });

  it('notifies subscribers on every change', () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.toggleSavedPhoto(makePhoto('one'));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.toggleSavedPhoto(makePhoto('two'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns a stable snapshot reference until something changes', () => {
    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);

    store.toggleSavedPhoto(makePhoto('one'));
    expect(store.getSnapshot()).not.toBe(first);
  });
});

describe('account store — corrupt and unavailable storage', () => {
  it('treats invalid JSON as empty', async () => {
    window.localStorage.setItem('gallery.account', '{not json');
    window.localStorage.setItem('gallery.saved', 'nope');

    vi.resetModules();
    const reloaded: Store = await import('./store');
    expect(reloaded.getSnapshot()).toMatchObject({ account: null, signedIn: false, saved: [] });
  });

  it('drops saved entries that are no longer usable photos', async () => {
    window.localStorage.setItem(
      'gallery.saved',
      JSON.stringify([{ id: 'one' }, makePhoto('two'), makePhoto('two')]),
    );

    vi.resetModules();
    const reloaded: Store = await import('./store');
    expect(reloaded.getSnapshot().saved.map((photo) => photo.id)).toEqual(['two']);
  });

  it('reports unavailable storage instead of throwing', async () => {
    const failing = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    vi.spyOn(window, 'localStorage', 'get').mockReturnValue(failing as unknown as Storage);

    vi.resetModules();
    const reloaded: Store = await import('./store');

    expect(reloaded.getSnapshot()).toMatchObject({
      account: null,
      saved: [],
      storageAvailable: false,
    });
    expect(reloaded.registerAccount({ name: 'Ada', email: 'ada@example.com' })).toEqual({
      ok: false,
      field: 'form',
      message: reloaded.STORAGE_UNAVAILABLE_MESSAGE,
    });

    vi.restoreAllMocks();
  });
});
