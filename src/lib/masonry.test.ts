import { describe, expect, it } from 'vitest';
import { distributeIntoColumns } from '@/lib/masonry';
import type { Photo } from '@/types/photo';

function makePhoto(id: string, width: number, height: number): Photo {
  return {
    id,
    width,
    height,
    color: '#f2f2f2',
    rawUrl: `https://images.unsplash.com/photo-${id}`,
    alt: `Photo ${id}`,
    description: null,
    likes: 0,
    createdAt: null,
    tags: [],
    unsplashUrl: 'https://unsplash.com/photos/x',
    photographer: { name: 'Ann', username: 'ann', profileUrl: null, avatarUrl: null },
  };
}

const square = (id: string) => makePhoto(id, 100, 100);

describe('distributeIntoColumns', () => {
  it('places the first N photos in columns 0..N-1 in order', () => {
    const photos = ['a', 'b', 'c'].map(square);
    const columns = distributeIntoColumns(photos, 3);

    expect(columns.map((column) => column.map((photo) => photo.id))).toEqual([['a'], ['b'], ['c']]);
  });

  it('sends the next photo to the shortest column', () => {
    const photos = [
      makePhoto('tall', 100, 300),
      makePhoto('b', 100, 100),
      makePhoto('c', 100, 100),
      makePhoto('d', 100, 100),
    ];
    const columns = distributeIntoColumns(photos, 3);

    expect(columns[0]?.map((p) => p.id)).toEqual(['tall']);
    expect(columns[1]?.map((p) => p.id)).toEqual(['b', 'd']);
    expect(columns[2]?.map((p) => p.id)).toEqual(['c']);
  });

  it('breaks ties by choosing the lowest column index', () => {
    const photos = ['a', 'b', 'c', 'd', 'e', 'f'].map(square);
    const columns = distributeIntoColumns(photos, 3);

    expect(columns.map((column) => column.map((p) => p.id))).toEqual([
      ['a', 'd'],
      ['b', 'e'],
      ['c', 'f'],
    ]);
  });

  it('leaves trailing columns empty when there are fewer photos than columns', () => {
    const columns = distributeIntoColumns([square('a'), square('b')], 5);

    expect(columns).toHaveLength(5);
    expect(columns[0]).toHaveLength(1);
    expect(columns[1]).toHaveLength(1);
    expect(columns[2]).toEqual([]);
    expect(columns[3]).toEqual([]);
    expect(columns[4]).toEqual([]);
  });

  it('preserves the total number of photos', () => {
    const photos = Array.from({ length: 30 }, (_, index) =>
      makePhoto(`p${index}`, 100 + index, 80 + index * 3),
    );

    for (const columnCount of [3, 5] as const) {
      const columns = distributeIntoColumns(photos, columnCount);
      expect(columns).toHaveLength(columnCount);
      expect(columns.flat()).toHaveLength(30);
      expect(new Set(columns.flat().map((p) => p.id)).size).toBe(30);
    }
  });

  it('works with 4:3 fallback dimensions', () => {
    const photos = Array.from({ length: 5 }, (_, index) => makePhoto(`f${index}`, 4, 3));
    const columns = distributeIntoColumns(photos, 5);

    expect(columns.map((column) => column.length)).toEqual([1, 1, 1, 1, 1]);
  });
});
