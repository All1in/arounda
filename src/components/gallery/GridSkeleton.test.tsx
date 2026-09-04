import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GridSkeleton from './GridSkeleton';

describe('GridSkeleton', () => {
  it('announces that photos are loading without exposing the placeholder tiles', () => {
    const { container } = render(<GridSkeleton />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading photos');
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('defaults to three columns', () => {
    const { container } = render(<GridSkeleton />);
    const grid = container.querySelector('[data-cols]') as HTMLElement;

    expect(grid.dataset.cols).toBe('3');
    expect(grid.children).toHaveLength(3);
  });

  // column count has to match the grid this replaces
  it.each([3, 5] as const)('matches the %i-column grid it stands in for', (columns) => {
    const { container } = render(<GridSkeleton columns={columns} />);
    const grid = container.querySelector('[data-cols]') as HTMLElement;

    expect(grid.dataset.cols).toBe(String(columns));
    expect(grid.children).toHaveLength(columns);
  });

  it('reserves height on every tile so the fallback does not collapse', () => {
    const { container } = render(<GridSkeleton columns={5} />);
    const tiles = [...container.querySelectorAll('[style*="aspect-ratio"]')];

    expect(tiles.length).toBeGreaterThan(0);
    for (const tile of tiles) {
      expect((tile as HTMLElement).style.aspectRatio).not.toBe('');
    }
  });

  it('renders the same markup twice, so server and client fallbacks agree', () => {
    const first = render(<GridSkeleton columns={5} />).container.innerHTML;
    const second = render(<GridSkeleton columns={5} />).container.innerHTML;

    expect(first).toBe(second);
  });
});
