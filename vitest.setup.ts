import '@testing-library/jest-dom/vitest';
import { createElement, type ImgHTMLAttributes, type ReactNode } from 'react';
import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
    createElement('a', { href, ...rest }, children),
}));

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
    onError,
  }: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) =>
    createElement('img', { src, alt, className, onError }),
}));
