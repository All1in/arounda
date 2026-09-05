'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, type FormEvent } from 'react';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { normalizeQuery } from '@/lib/search';
import styles from './SearchForm.module.scss';

export default function SearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = normalizeQuery(inputRef.current?.value);

    if (value === '') {
      if (query === '') {
        inputRef.current?.focus();
        return;
      }
      router.push('/');
      return;
    }

    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <form
      role="search"
      action="/search"
      method="get"
      className={styles.form}
      onSubmit={handleSubmit}
    >
      <label htmlFor="site-search" className="srOnly">
        Search photos
      </label>
      <button type="submit" className={styles.submit}>
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M10.5 3a7.5 7.5 0 1 1-4.72 13.34l-3.06 3.06a1 1 0 0 1-1.42-1.42l3.06-3.06A7.5 7.5 0 0 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
            fill="currentColor"
          />
        </svg>
        <VisuallyHidden>Search</VisuallyHidden>
      </button>
      <input
        key={`${pathname}?${query}`}
        id="site-search"
        ref={inputRef}
        className={styles.input}
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Search photos"
        autoComplete="off"
        maxLength={100}
      />
    </form>
  );
}
