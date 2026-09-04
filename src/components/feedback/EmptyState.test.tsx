import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders the title as a heading so the message is reachable by heading navigation', () => {
    render(<EmptyState title="No more photos" />);

    expect(screen.getByRole('heading', { name: 'No more photos' })).toBeInTheDocument();
  });

  it('defaults to h2, for the states that sit under a page heading', () => {
    render(<EmptyState title="No results for “xyz”" />);

    expect(screen.getByRole('heading', { level: 2, name: 'No results for “xyz”' })).toBeVisible();
  });

  it('renders an h1 when it is the only heading on the page', () => {
    render(<EmptyState headingLevel={1} title="Photo not found" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Photo not found' })).toBeVisible();
  });

  it('renders the description and every link', () => {
    render(
      <EmptyState
        title="Nothing saved yet"
        description="Add a photo to your collection."
        links={[
          { href: '/', label: 'Browse photos' },
          { href: '/login', label: 'Log in' },
        ]}
      />,
    );

    expect(screen.getByText('Add a photo to your collection.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse photos' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('omits the description and links when they are not given', () => {
    const { container } = render(<EmptyState title="Page not found" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });
});
