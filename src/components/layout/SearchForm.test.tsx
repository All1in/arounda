import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SearchForm from './SearchForm';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(''),
}));

const push = mocks.push;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => '/',
  useSearchParams: () => mocks.searchParams,
}));

describe('SearchForm', () => {
  beforeEach(() => {
    push.mockClear();
    mocks.searchParams = new URLSearchParams('');
  });

  it('is an accessible search landmark with a labelled input', () => {
    render(<SearchForm />);

    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByLabelText('Search photos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('works as a plain GET form without JavaScript', () => {
    render(<SearchForm />);
    const form = screen.getByRole('search');

    expect(form).toHaveAttribute('action', '/search');
    expect(form).toHaveAttribute('method', 'get');
    expect(screen.getByLabelText('Search photos')).toHaveAttribute('name', 'q');
  });

  it('navigates to the encoded search route on submit', () => {
    render(<SearchForm />);

    fireEvent.change(screen.getByLabelText('Search photos'), {
      target: { value: '  golden   retriever ' },
    });
    fireEvent.submit(screen.getByRole('search'));

    expect(push).toHaveBeenCalledWith('/search?q=golden%20retriever');
  });

  it('does nothing when the query is only whitespace', () => {
    render(<SearchForm />);
    const input = screen.getByLabelText('Search photos');

    fireEvent.change(input, { target: { value: '    ' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(push).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
  });

  it('shows the active query and returns to the feed when it is cleared', () => {
    mocks.searchParams = new URLSearchParams('q=cats');
    render(<SearchForm />);

    const input = screen.getByLabelText('Search photos');
    expect(input).toHaveValue('cats');

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(push).toHaveBeenCalledWith('/');
  });

  it('replaces an active query with a new one', () => {
    mocks.searchParams = new URLSearchParams('q=cats');
    render(<SearchForm />);

    fireEvent.change(screen.getByLabelText('Search photos'), { target: { value: 'dogs' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(push).toHaveBeenCalledWith('/search?q=dogs');
  });
});
