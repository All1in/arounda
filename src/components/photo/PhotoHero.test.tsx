import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Photo } from '@/types/photo';
import PhotoHero from './PhotoHero';

function makePhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: 'abc12345678',
    width: 4000,
    height: 3000,
    color: '#102030',
    rawUrl: 'https://images.unsplash.com/photo-1',
    alt: 'A quiet lake at sunrise',
    description: null,
    likes: 0,
    createdAt: null,
    tags: [],
    unsplashUrl: 'https://unsplash.com/photos/abc12345678',
    photographer: { name: 'Ada', username: 'ada', profileUrl: null, avatarUrl: null },
    ...overrides,
  };
}

function frameOf(photo: Photo) {
  const { container } = render(<PhotoHero photo={photo} />);
  return container.firstElementChild as HTMLElement;
}

// jsdom folds the calc() down to one vh value, so assert the arithmetic
function maxWidthVh(frame: HTMLElement) {
  const match = frame.style.maxWidth.match(/calc\(([\d.]+)vh\)/);
  return match ? Number(match[1]) : Number.NaN;
}

describe('PhotoHero', () => {
  it('carries the photo alt text', () => {
    render(<PhotoHero photo={makePhoto()} />);

    expect(screen.getByAltText('A quiet lake at sunrise')).toBeInTheDocument();
  });

  it('reserves the photo aspect ratio and paints the dominant colour behind it', () => {
    const frame = frameOf(makePhoto());

    expect(frame.style.aspectRatio).toBe('4000 / 3000');
    expect(frame.style.backgroundColor).toBe('rgb(16, 32, 48)');
  });

  it('caps a portrait photo below the viewport height so it cannot overflow it', () => {
    const frame = frameOf(makePhoto({ width: 2000, height: 3000 }));

    // 80vh tall at 2:3 is 53.33vh wide.
    expect(maxWidthVh(frame)).toBeCloseTo(53.333, 2);
  });

  it('lets a wide photo exceed the viewport height in width', () => {
    const frame = frameOf(makePhoto({ width: 4000, height: 2250 }));

    expect(frame.style.aspectRatio).toBe('4000 / 2250');
    expect(maxWidthVh(frame)).toBeCloseTo(142.222, 2);
  });

  it('works with the 4:3 fallback the normalizer uses for photos with no dimensions', () => {
    const frame = frameOf(makePhoto({ width: 4, height: 3 }));

    expect(frame.style.aspectRatio).toBe('4 / 3');
    expect(maxWidthVh(frame)).toBeCloseTo(106.667, 2);
  });

  it('derives the cap from the ratio, not from the absolute pixel dimensions', () => {
    const small = frameOf(makePhoto({ width: 4, height: 3 }));
    const large = frameOf(makePhoto({ width: 4000, height: 3000 }));

    expect(maxWidthVh(small)).toBeCloseTo(maxWidthVh(large), 3);
  });
});
