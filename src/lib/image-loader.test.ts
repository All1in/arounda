import { describe, expect, it } from 'vitest';
import unsplashImageLoader from '@/lib/image-loader';

describe('unsplashImageLoader', () => {
  it('appends the imgix parameters', () => {
    const result = new URL(
      unsplashImageLoader({ src: 'https://images.unsplash.com/photo-1', width: 800, quality: 60 }),
    );

    expect(result.searchParams.get('w')).toBe('800');
    expect(result.searchParams.get('q')).toBe('60');
    expect(result.searchParams.get('auto')).toBe('format');
    expect(result.searchParams.get('fit')).toBe('max');
  });

  it('defaults the quality to 75', () => {
    const result = new URL(
      unsplashImageLoader({ src: 'https://images.unsplash.com/photo-1', width: 400 }),
    );

    expect(result.searchParams.get('q')).toBe('75');
  });

  it('preserves the existing query string, including ixid', () => {
    const result = new URL(
      unsplashImageLoader({
        src: 'https://images.unsplash.com/photo-1?ixid=M3w1fDB8&ixlib=rb-4.0.3',
        width: 640,
      }),
    );

    expect(result.searchParams.get('ixid')).toBe('M3w1fDB8');
    expect(result.searchParams.get('ixlib')).toBe('rb-4.0.3');
    expect(result.searchParams.get('w')).toBe('640');
  });

  it('drops a conflicting height so the width drives the resize', () => {
    const result = new URL(
      unsplashImageLoader({
        src: 'https://images.unsplash.com/profile-1?ixlib=rb-4.1.0&crop=faces&fit=max&w=64&h=64',
        width: 48,
      }),
    );

    expect(result.searchParams.get('w')).toBe('48');
    expect(result.searchParams.has('h')).toBe(false);
    expect(result.searchParams.get('crop')).toBe('faces');
    expect(result.searchParams.get('ixlib')).toBe('rb-4.1.0');
  });

  it('handles the plus.unsplash.com host', () => {
    const result = unsplashImageLoader({ src: 'https://plus.unsplash.com/photo-9', width: 320 });
    expect(result).toContain('w=320');
  });

  it('leaves foreign hosts and relative paths untouched', () => {
    expect(unsplashImageLoader({ src: 'https://example.com/a.jpg', width: 100 })).toBe(
      'https://example.com/a.jpg',
    );
    expect(unsplashImageLoader({ src: '/local.png', width: 100 })).toBe('/local.png');
  });
});
