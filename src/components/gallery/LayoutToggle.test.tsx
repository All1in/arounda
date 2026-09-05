import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Photo } from '@/types/photo';
import LayoutModeProvider from './LayoutModeProvider';
import LayoutToggle from './LayoutToggle';
import PhotoGrid from './PhotoGrid';

function makePhoto(id: string): Photo {
  return {
    id,
    width: 400,
    height: 300,
    color: '#eeeeee',
    rawUrl: `https://images.unsplash.com/photo-${id}`,
    alt: `Photo ${id}`,
    description: null,
    likes: 1,
    createdAt: null,
    tags: [],
    unsplashUrl: 'https://unsplash.com/photos/x',
    photographer: { name: 'Ann', username: 'ann', profileUrl: null, avatarUrl: null },
  };
}

const photos = Array.from({ length: 12 }, (_, index) => makePhoto(`p${index}`));

function renderGallery() {
  return render(
    <LayoutModeProvider initialMode={3}>
      <LayoutToggle />
      <PhotoGrid photos={photos} />
    </LayoutModeProvider>,
  );
}

describe('LayoutToggle + PhotoGrid', () => {
  it('starts in the initial mode with matching pressed state', () => {
    renderGallery();

    expect(screen.getByRole('button', { name: '3 columns' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '5 columns' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('region', { name: 'Photos' }).children).toHaveLength(3);
  });

  it('switches to five columns and persists the choice in a cookie', () => {
    renderGallery();

    fireEvent.click(screen.getByRole('button', { name: '5 columns' }));

    expect(screen.getByRole('region', { name: 'Photos' }).children).toHaveLength(5);
    expect(screen.getByRole('button', { name: '5 columns' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '3 columns' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(document.cookie).toContain('gallery_cols=5');
  });

  it('keeps every photo when the column count changes', () => {
    renderGallery();

    expect(screen.getAllByRole('img')).toHaveLength(photos.length);
    fireEvent.click(screen.getByRole('button', { name: '5 columns' }));
    expect(screen.getAllByRole('img')).toHaveLength(photos.length);
  });

  it('exposes the toggle as a labelled group', () => {
    renderGallery();
    expect(screen.getByRole('group', { name: 'Gallery layout' })).toBeInTheDocument();
  });
});
