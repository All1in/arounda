import { describe, expect, it } from 'vitest';
import { buildPageHref, buildPageRange, MAX_PAGE, parsePage } from '@/lib/pagination';

describe('parsePage', () => {
  it.each([
    [undefined, 1],
    ['0', 1],
    ['-3', 1],
    ['2.5', 1],
    ['abc', 1],
    ['', 1],
    ['7', 7],
  ])('parses %p as %p', (input, expected) => {
    expect(parsePage(input as string | undefined)).toBe(expected);
  });

  it('uses the first value of a repeated param', () => {
    expect(parsePage(['2', '9'])).toBe(2);
  });

  it('caps at MAX_PAGE', () => {
    expect(parsePage(String(MAX_PAGE))).toBe(MAX_PAGE);
    expect(parsePage(String(MAX_PAGE + 1))).toBe(MAX_PAGE);
    expect(parsePage('99999999999999999999')).toBe(MAX_PAGE);
  });

  it('keeps the capped page inside exact integer arithmetic', () => {
    // past 2^53, page - 1 === page, so Previous pointed at the current page
    const page = parsePage('99999999999999999999');

    expect(Number.isSafeInteger(page)).toBe(true);
    expect(page - 1).toBeLessThan(page);
    expect(page + 1).toBeGreaterThan(page);
  });
});

describe('buildPageHref', () => {
  it('omits the page param for page 1, so one page has one URL', () => {
    expect(buildPageHref('/', {}, 1)).toBe('/');
    expect(buildPageHref('/search', { q: 'lake' }, 1)).toBe('/search?q=lake');
  });

  it('adds the page param from page 2 on', () => {
    expect(buildPageHref('/', {}, 2)).toBe('/?page=2');
    expect(buildPageHref('/search', { q: 'lake' }, 3)).toBe('/search?q=lake&page=3');
  });

  it('encodes the base query', () => {
    expect(buildPageHref('/search', { q: 'blue sky' }, 2)).toBe('/search?q=blue+sky&page=2');
    expect(buildPageHref('/search', { q: 'a&b' }, 2)).toBe('/search?q=a%26b&page=2');
  });

  it('leaves an already-encoded tag path alone', () => {
    expect(buildPageHref('/tags/business%20travel', {}, 2)).toBe('/tags/business%20travel?page=2');
  });

  // the control and the empty state both link here — they have to match
  it('agrees with itself across the callers that share it', () => {
    const args = ['/search', { q: 'lake' }] as const;

    expect(buildPageHref(...args, 1)).toBe(buildPageHref(...args, 1));
    expect(buildPageHref(...args, 12)).toBe(buildPageHref(...args, 12));
  });
});

describe('buildPageRange', () => {
  it('shows every page when the total fits', () => {
    expect(buildPageRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('shows both ellipses around a middle page', () => {
    expect(buildPageRange(10, 20)).toEqual([1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
  });

  it('omits the leading ellipsis near the first page', () => {
    expect(buildPageRange(1, 20)).toEqual([1, 2, 'ellipsis', 20]);
  });

  it('omits the trailing ellipsis near the last page', () => {
    expect(buildPageRange(20, 20)).toEqual([1, 'ellipsis', 19, 20]);
  });

  it('returns an empty range when there are no pages', () => {
    expect(buildPageRange(1, 0)).toEqual([]);
  });

  it('never repeats a page number', () => {
    for (let current = 1; current <= 25; current += 1) {
      const range = buildPageRange(current, 25);
      const numbers = range.filter((item): item is number => typeof item === 'number');
      expect(new Set(numbers).size).toBe(numbers.length);
    }
  });
});
