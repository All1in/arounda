import { describe, expect, it } from 'vitest';
import { DEFAULT_MODE, LAYOUT_MODES, parseLayoutMode } from '@/lib/layout-mode';

describe('parseLayoutMode', () => {
  it('accepts the two supported modes as cookie strings', () => {
    expect(parseLayoutMode('3')).toBe(3);
    expect(parseLayoutMode('5')).toBe(5);
  });

  it('accepts them as numbers', () => {
    expect(parseLayoutMode(3)).toBe(3);
    expect(parseLayoutMode(5)).toBe(5);
  });

  // all of these are reachable from a cookie
  it.each([
    ['a missing cookie', undefined],
    ['a null value', null],
    ['an empty string', ''],
    ['a non-numeric string', 'abc'],
    ['an unsupported column count', '99'],
    ['zero', '0'],
    ['a negative number', '-3'],
    ['a float that truncates outside the set', '4.5'],
    ['an injected script', '<script>alert(1)</script>'],
    ['an object', { toString: () => '5' }],
    ['an array', ['5']],
    ['a boolean', true],
  ])('falls back to the default mode for %s', (_label, input) => {
    expect(parseLayoutMode(input)).toBe(DEFAULT_MODE);
  });

  // parseInt truncates, so "3.5" lands on 3. Leniency, not validation.
  it('truncates a float onto a supported mode instead of rejecting it', () => {
    expect(parseLayoutMode('3.5')).toBe(3);
    expect(parseLayoutMode('5.9')).toBe(5);
  });

  it('never returns a value outside the supported set', () => {
    const inputs = [undefined, null, '', '0', '1', '2', '3', '4', '5', '6', 'x', 3, 5, 7, {}, []];

    for (const input of inputs) {
      expect(LAYOUT_MODES).toContain(parseLayoutMode(input));
    }
  });

  it('defaults to three columns', () => {
    expect(DEFAULT_MODE).toBe(3);
  });
});
