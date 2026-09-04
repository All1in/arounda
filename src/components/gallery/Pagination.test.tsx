import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('renders numbered links and marks the current page', () => {
    render(<Pagination current={3} totalPages={10} basePath="/" />);

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('href', '/?page=2');
    expect(screen.getByRole('link', { name: '10' })).toHaveAttribute('href', '/?page=10');
  });

  it('omits the page param for page 1', () => {
    render(<Pagination current={2} totalPages={5} basePath="/" />);

    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('href', '/');
  });

  it('keeps the base query on every link', () => {
    render(
      <Pagination current={2} totalPages={5} basePath="/search" baseQuery={{ q: 'blue sky' }} />,
    );

    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute(
      'href',
      '/search?q=blue+sky&page=3',
    );
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute('href', '/search?q=blue+sky');
  });

  it('disables Previous on the first page and Next on the last', () => {
    const { unmount } = render(<Pagination current={1} totalPages={4} basePath="/" />);
    expect(screen.getByText('Previous')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('rel', 'next');
    unmount();

    render(<Pagination current={4} totalPages={4} basePath="/" />);
    expect(screen.getByText('Next')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('rel', 'prev');
  });

  it('falls back to Previous/Next only when the total is unknown', () => {
    render(<Pagination current={2} totalPages={null} basePath="/" hasNext />);

    expect(screen.getByRole('link', { name: 'Previous' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('href', '/?page=3');
    expect(screen.queryByRole('link', { name: '1' })).not.toBeInTheDocument();
  });

  it('clamps a page past the end so the current page is still marked', () => {
    render(<Pagination current={9999} totalPages={12} basePath="/" />);

    expect(screen.getByRole('link', { name: '12' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('href', '/?page=11');
    expect(screen.getByText('Next')).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders nothing when there is a single page', () => {
    const { container } = render(<Pagination current={1} totalPages={1} basePath="/" />);
    expect(container).toBeEmptyDOMElement();
  });
});
