import { describe, expect, it } from 'vitest';
import { withUtm } from '@/lib/unsplash/attribution';
import { normalizePhoto, normalizePhotos } from '@/lib/unsplash/normalize';
import type { RawUnsplashPhoto } from '@/lib/unsplash/types';

function rawPhoto(overrides: Partial<RawUnsplashPhoto> = {}): RawUnsplashPhoto {
  return {
    id: 'abc12345678',
    width: 4000,
    height: 3000,
    color: '#0a0a0a',
    created_at: '2024-05-01T10:00:00Z',
    description: 'A quiet lake',
    alt_description: 'lake at sunrise',
    likes: 42,
    urls: { raw: 'https://images.unsplash.com/photo-1?ixid=abc' },
    links: { html: 'https://unsplash.com/photos/abc12345678' },
    user: {
      name: 'Ada Lovelace',
      username: 'ada',
      links: { html: 'https://unsplash.com/@ada' },
      profile_image: { medium: 'https://images.unsplash.com/profile-1' },
    },
    tags: [{ title: 'lake' }, { title: 'water' }],
    ...overrides,
  };
}

describe('withUtm', () => {
  it('adds utm_source and utm_medium', () => {
    const url = new URL(withUtm('https://unsplash.com/@ada') as string);
    expect(url.searchParams.get('utm_source')).toBe('Lumina');
    expect(url.searchParams.get('utm_medium')).toBe('referral');
  });

  it('keeps existing query parameters', () => {
    const url = new URL(withUtm('https://unsplash.com/photos/x?foo=bar') as string);
    expect(url.searchParams.get('foo')).toBe('bar');
  });

  it('returns null for missing or invalid urls', () => {
    expect(withUtm(null)).toBeNull();
    expect(withUtm('')).toBeNull();
    expect(withUtm('not a url')).toBeNull();
  });
});

describe('normalizePhoto', () => {
  it('maps a complete photo', () => {
    const photo = normalizePhoto(rawPhoto());

    expect(photo).not.toBeNull();
    expect(photo?.id).toBe('abc12345678');
    expect(photo?.width).toBe(4000);
    expect(photo?.height).toBe(3000);
    expect(photo?.alt).toBe('lake at sunrise');
    expect(photo?.description).toBe('A quiet lake');
    expect(photo?.likes).toBe(42);
    expect(photo?.tags).toEqual(['lake', 'water']);
    expect(photo?.photographer.name).toBe('Ada Lovelace');
    expect(photo?.photographer.username).toBe('ada');
    expect(photo?.unsplashUrl).toContain('utm_source=Lumina');
    expect(photo?.photographer.profileUrl).toContain('utm_medium=referral');
  });

  it('returns null without an id or a raw url', () => {
    expect(normalizePhoto(rawPhoto({ id: null }))).toBeNull();
    expect(normalizePhoto(rawPhoto({ urls: { raw: null } }))).toBeNull();
    expect(normalizePhoto(rawPhoto({ urls: null }))).toBeNull();
    expect(normalizePhoto(null)).toBeNull();
  });

  it('falls back to 4:3 when the dimensions are missing or zero', () => {
    expect(normalizePhoto(rawPhoto({ width: 0, height: 0 }))).toMatchObject({
      width: 4,
      height: 3,
    });
    expect(normalizePhoto(rawPhoto({ width: null, height: 900 }))).toMatchObject({
      width: 4,
      height: 3,
    });
  });

  it('walks the alt fallback chain', () => {
    expect(normalizePhoto(rawPhoto({ alt_description: null }))?.alt).toBe('A quiet lake');
    expect(normalizePhoto(rawPhoto({ alt_description: null, description: null }))?.alt).toBe(
      'Photo by Ada Lovelace',
    );
    expect(
      normalizePhoto(rawPhoto({ alt_description: null, description: null, user: null }))?.alt,
    ).toBe('Photo by Unknown');
  });

  it('trims the alt text to 160 characters', () => {
    const photo = normalizePhoto(rawPhoto({ alt_description: `  ${'x'.repeat(200)}  ` }));
    expect(photo?.alt).toHaveLength(160);
  });

  it('uses safe defaults for missing optional fields', () => {
    const photo = normalizePhoto(
      rawPhoto({ color: null, likes: null, created_at: null, tags: null, description: null }),
    );

    expect(photo?.color).toBe('#f2f2f2');
    expect(photo?.likes).toBe(0);
    expect(photo?.createdAt).toBeNull();
    expect(photo?.tags).toEqual([]);
    expect(photo?.description).toBeNull();
  });

  it('drops empty and duplicate tags', () => {
    const photo = normalizePhoto(
      rawPhoto({
        tags: [{ title: 'lake' }, { title: '  lake ' }, { title: '  ' }, { title: null }],
      }),
    );

    expect(photo?.tags).toEqual(['lake']);
  });
});

describe('normalizePhotos', () => {
  it('skips unusable entries and keeps the first of each duplicate id', () => {
    const photos = normalizePhotos([
      rawPhoto({ id: 'one' }),
      rawPhoto({ id: 'one', alt_description: 'duplicate' }),
      rawPhoto({ id: null }),
      rawPhoto({ id: 'two' }),
    ]);

    expect(photos.map((photo) => photo.id)).toEqual(['one', 'two']);
    expect(photos[0]?.alt).toBe('lake at sunrise');
  });

  it('returns an empty array for non-array input', () => {
    expect(normalizePhotos(null)).toEqual([]);
    expect(normalizePhotos(undefined)).toEqual([]);
  });
});
