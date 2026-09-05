import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Avatar from './Avatar';

function initialOf(name: string, size?: number) {
  const { container } = render(<Avatar name={name} size={size} />);
  return container.firstElementChild as HTMLElement;
}

describe('Avatar', () => {
  it('shows the first letter, uppercased', () => {
    expect(initialOf('ada lovelace')).toHaveTextContent('A');
  });

  it('ignores leading whitespace', () => {
    expect(initialOf('   Ada')).toHaveTextContent('A');
  });

  // Array.from splits by code point
  it('takes a whole character, not half a surrogate pair', () => {
    const el = initialOf('🌍 Earth');
    expect(el.textContent).toBe('🌍');
  });

  it('handles non-Latin names', () => {
    expect(initialOf('Ада')).toHaveTextContent('А');
  });

  it('renders empty rather than crashing on an empty name', () => {
    expect(initialOf('   ').textContent).toBe('');
  });

  it('stays out of the accessibility tree', () => {
    expect(initialOf('Ada')).toHaveAttribute('aria-hidden', 'true');
  });

  it('scales the glyph with the box', () => {
    const small = initialOf('Ada');
    expect(small.style.width).toBe('28px');
    expect(small.style.fontSize).toBe('12px');

    const large = initialOf('Ada', 48);
    expect(large.style.width).toBe('48px');
    expect(large.style.fontSize).toBe('20px');
  });
});
