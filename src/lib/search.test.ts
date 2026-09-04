import { describe, expect, it } from 'vitest';
import { normalizeQuery } from '@/lib/search';

describe('normalizeQuery', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeQuery('  snowy   mountain \n peaks ')).toBe('snowy mountain peaks');
  });

  it('returns an empty string for blank or missing input', () => {
    expect(normalizeQuery('   ')).toBe('');
    expect(normalizeQuery(undefined)).toBe('');
    expect(normalizeQuery(null)).toBe('');
  });

  it('uses the first value of a repeated param', () => {
    expect(normalizeQuery(['cats', 'dogs'])).toBe('cats');
  });

  it('caps the length at 100 characters', () => {
    expect(normalizeQuery('a'.repeat(150))).toHaveLength(100);
  });
});
