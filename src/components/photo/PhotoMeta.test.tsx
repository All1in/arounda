import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Photo } from '@/types/photo';
import PhotoMeta from './PhotoMeta';

function makePhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: 'abc12345678',
    width: 4000,
    height: 3000,
    color: '#101010',
    rawUrl: 'https://images.unsplash.com/photo-1',
    alt: 'A quiet lake at sunrise',
    description: 'A quiet lake',
    likes: 12,
    createdAt: '2024-05-01T10:00:00Z',
    tags: ['lake', 'business travel'],
    unsplashUrl: 'https://unsplash.com/photos/abc12345678?utm_source=Lumina',
    photographer: {
      name: 'Ada Lovelace',
      username: 'ada',
      profileUrl: 'https://unsplash.com/@ada?utm_source=Lumina',
      avatarUrl: null,
    },
    ...overrides,
  };
}

describe('PhotoMeta', () => {
  it('titles the page with the description when there is one', () => {
    render(<PhotoMeta photo={makePhoto()} />);

    expect(screen.getByRole('heading', { level: 1, name: 'A quiet lake' })).toBeInTheDocument();
  });

  it('falls back to the alt text when the photo has no description', () => {
    render(<PhotoMeta photo={makePhoto({ description: null })} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'A quiet lake at sunrise' }),
    ).toBeInTheDocument();
  });

  it('formats the like count and pluralises it', () => {
    render(<PhotoMeta photo={makePhoto({ likes: 1234 })} />);
    expect(screen.getByText('1,234 likes')).toBeInTheDocument();
  });

  it('singularises a single like', () => {
    render(<PhotoMeta photo={makePhoto({ likes: 1 })} />);
    expect(screen.getByText('1 like')).toBeInTheDocument();
  });

  it('still renders a like count of zero', () => {
    render(<PhotoMeta photo={makePhoto({ likes: 0 })} />);
    expect(screen.getByText('0 likes')).toBeInTheDocument();
  });

  // visible string is TZ-dependent, so only the attribute is pinned
  it('exposes the publication date as a machine-readable time', () => {
    const { container } = render(<PhotoMeta photo={makePhoto()} />);
    const time = container.querySelector('time') as HTMLTimeElement;

    expect(time).toHaveAttribute('dateTime', '2024-05-01T10:00:00Z');
    expect(time.textContent).toMatch(/2024/);
  });

  it('omits the published line when the date is missing', () => {
    const { container } = render(<PhotoMeta photo={makePhoto({ createdAt: null })} />);

    expect(container.querySelector('time')).toBeNull();
    expect(screen.queryByText(/Published/)).not.toBeInTheDocument();
  });

  it('omits the published line when the date is unparseable', () => {
    const { container } = render(<PhotoMeta photo={makePhoto({ createdAt: 'not a date' })} />);

    expect(container.querySelector('time')).toBeNull();
  });

  it('links each tag to its collection with the tag encoded', () => {
    render(<PhotoMeta photo={makePhoto()} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Tags' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'lake' })).toHaveAttribute('href', '/tags/lake');
    expect(screen.getByRole('link', { name: 'business travel' })).toHaveAttribute(
      'href',
      '/tags/business%20travel',
    );
  });

  it('drops the tag section entirely when there are no tags', () => {
    render(<PhotoMeta photo={makePhoto({ tags: [] })} />);

    expect(screen.queryByRole('heading', { level: 2, name: 'Tags' })).not.toBeInTheDocument();
  });

  it('credits the photographer and Unsplash, both linked with utm parameters', () => {
    render(<PhotoMeta photo={makePhoto()} />);

    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute(
      'href',
      'https://unsplash.com/@ada?utm_source=Lumina',
    );
    expect(screen.getByRole('link', { name: 'Unsplash' })).toHaveAttribute(
      'href',
      'https://unsplash.com/photos/abc12345678?utm_source=Lumina',
    );
  });

  it('falls back to the photo URL when the photographer has no profile link', () => {
    render(
      <PhotoMeta
        photo={makePhoto({
          photographer: { name: 'Ada', username: 'ada', profileUrl: null, avatarUrl: null },
        })}
      />,
    );

    expect(screen.getByRole('link', { name: 'Ada' })).toHaveAttribute(
      'href',
      'https://unsplash.com/photos/abc12345678?utm_source=Lumina',
    );
  });
});
