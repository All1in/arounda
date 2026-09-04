import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Photo } from '@/types/photo';
import PhotoCard from './PhotoCard';

const photo: Photo = {
  id: 'abc12345678',
  width: 4000,
  height: 3000,
  color: '#101010',
  rawUrl: 'https://images.unsplash.com/photo-1',
  alt: 'A quiet lake at sunrise',
  description: 'A quiet lake',
  likes: 12,
  createdAt: '2024-05-01T10:00:00Z',
  tags: ['lake'],
  unsplashUrl: 'https://unsplash.com/photos/abc12345678?utm_source=Lumina',
  photographer: {
    name: 'Ada Lovelace',
    username: 'ada',
    profileUrl: 'https://unsplash.com/@ada?utm_source=Lumina',
    avatarUrl: 'https://images.unsplash.com/profile-1',
  },
};

describe('PhotoCard', () => {
  it('renders the photo with its alt text and links to the detail page', () => {
    render(<PhotoCard photo={photo} mode={3} sizes="33vw" />);

    expect(screen.getByAltText('A quiet lake at sunrise')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'A quiet lake at sunrise' })).toHaveAttribute(
      'href',
      '/photos/abc12345678',
    );
  });

  it('credits the photographer and links back to Unsplash with utm parameters', () => {
    render(<PhotoCard photo={photo} mode={3} sizes="33vw" />);

    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute(
      'href',
      'https://unsplash.com/@ada?utm_source=Lumina',
    );
    expect(screen.getByRole('link', { name: 'on Unsplash' })).toHaveAttribute(
      'href',
      'https://unsplash.com/photos/abc12345678?utm_source=Lumina',
    );
  });

  it('names the card so a screen reader does not announce a bare "article"', () => {
    render(<PhotoCard photo={photo} mode={3} sizes="33vw" />);

    expect(screen.getByRole('article', { name: 'A quiet lake at sunrise' })).toBeInTheDocument();
  });

  it('reserves the aspect ratio with a coloured placeholder', () => {
    const { container } = render(<PhotoCard photo={photo} mode={3} sizes="33vw" />);
    const frame = container.querySelector('[style*="aspect-ratio"]') as HTMLElement;

    expect(frame.style.aspectRatio).toBe('4000 / 3000');
    expect(frame.style.backgroundColor).toBe('rgb(16, 16, 16)');
  });

  it('replaces a broken image with the placeholder box', () => {
    render(<PhotoCard photo={photo} mode={3} sizes="33vw" />);

    fireEvent.error(screen.getByAltText('A quiet lake at sunrise'));

    expect(screen.queryByAltText('A quiet lake at sunrise')).not.toBeInTheDocument();
    expect(screen.getByText('Image unavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Image unavailable' })).toHaveAttribute(
      'href',
      '/photos/abc12345678',
    );
  });

  it('renders an actions slot when provided', () => {
    render(
      <PhotoCard
        photo={photo}
        mode={3}
        sizes="33vw"
        actions={<button type="button">Save</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
