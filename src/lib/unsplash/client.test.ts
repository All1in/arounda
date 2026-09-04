import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { unsplashFetch } from '@/lib/unsplash/client';
import { UnsplashApiError, type UnsplashErrorKind } from '@/lib/unsplash/errors';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function errorResponse(status: number, headers: Record<string, string> = {}) {
  return new Response('{}', { status, headers });
}

// a bare .catch() never runs if the promise resolves — the test would pass asserting nothing
async function rejectsWith(
  promise: Promise<unknown>,
  kind: UnsplashErrorKind,
): Promise<UnsplashApiError> {
  const settled = await promise.then(
    () => null,
    (reason: unknown) => reason,
  );

  expect(settled, 'expected unsplashFetch to reject').toBeInstanceOf(UnsplashApiError);

  const error = settled as UnsplashApiError;
  expect(error.kind).toBe(kind);
  return error;
}

describe('unsplashFetch', () => {
  beforeEach(() => {
    process.env.UNSPLASH_ACCESS_KEY = 'test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the Client-ID authorization and API version headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: 'a' }]));
    vi.stubGlobal('fetch', fetchMock);

    await unsplashFetch('/photos', { page: 2, per_page: 30, order_by: undefined });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.unsplash.com/photos?page=2&per_page=30');
    expect((init.headers as Record<string, string>).Authorization).toBe('Client-ID test-key');
    expect((init.headers as Record<string, string>)['Accept-Version']).toBe('v1');
  });

  it('parses the X-Total header', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse([], { headers: { 'x-total': '900' } })),
    );

    const result = await unsplashFetch<unknown[]>('/photos');
    expect(result.total).toBe(900);
  });

  it('leaves total undefined when the header is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));

    const result = await unsplashFetch<unknown[]>('/photos');
    expect(result.total).toBeUndefined();
  });

  it('maps 403 with an exhausted rate limit to rate_limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(403, { 'x-ratelimit-remaining': '0' })),
    );

    await rejectsWith(unsplashFetch('/photos'), 'rate_limit');
  });

  it('maps 429 to rate_limit and reads Retry-After', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(429, { 'retry-after': '120' })));

    const error = await rejectsWith(unsplashFetch('/photos'), 'rate_limit');
    expect(error.retryAfterSeconds).toBe(120);
  });

  // fallback when Retry-After is missing; drives the "try again in N minutes" copy
  it('derives the wait from an X-Ratelimit-Reset timestamp', async () => {
    const inTenMinutes = Math.floor(Date.now() / 1000) + 600;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(429, { 'x-ratelimit-reset': String(inTenMinutes) })),
    );

    const error = await rejectsWith(unsplashFetch('/photos'), 'rate_limit');
    expect(error.retryAfterSeconds).toBeGreaterThan(590);
    expect(error.retryAfterSeconds).toBeLessThanOrEqual(600);
  });

  it('reads a small X-Ratelimit-Reset as a duration rather than a timestamp', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(429, { 'x-ratelimit-reset': '300' })),
    );

    const error = await rejectsWith(unsplashFetch('/photos'), 'rate_limit');
    expect(error.retryAfterSeconds).toBe(300);
  });

  it('ignores an X-Ratelimit-Reset that is already in the past', async () => {
    const longAgo = Math.floor(Date.now() / 1000) - 600;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(429, { 'x-ratelimit-reset': String(longAgo) })),
    );

    const error = await rejectsWith(unsplashFetch('/photos'), 'rate_limit');
    expect(error.retryAfterSeconds).toBeUndefined();
  });

  it('prefers Retry-After over X-Ratelimit-Reset when both are present', async () => {
    const inTenMinutes = Math.floor(Date.now() / 1000) + 600;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        errorResponse(429, {
          'retry-after': '45',
          'x-ratelimit-reset': String(inTenMinutes),
        }),
      ),
    );

    const error = await rejectsWith(unsplashFetch('/photos'), 'rate_limit');
    expect(error.retryAfterSeconds).toBe(45);
  });

  it('leaves the wait undefined when neither header is present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(403, { 'x-ratelimit-remaining': '0' })),
    );

    const error = await rejectsWith(unsplashFetch('/photos'), 'rate_limit');
    expect(error.retryAfterSeconds).toBeUndefined();
  });

  it('maps 401 and a plain 403 to unauthorized', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(401)));
    await rejectsWith(unsplashFetch('/photos'), 'unauthorized');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(403, { 'x-ratelimit-remaining': '48' })),
    );
    await rejectsWith(unsplashFetch('/photos'), 'unauthorized');
  });

  it('maps 404 to not_found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(404)));
    await rejectsWith(unsplashFetch('/photos/x'), 'not_found');
  });

  it('maps 500 to server', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(500)));
    await rejectsWith(unsplashFetch('/photos'), 'server');
  });

  it('maps an aborted request to timeout', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'TimeoutError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    await rejectsWith(unsplashFetch('/photos'), 'timeout');
  });

  it('maps a failed fetch to network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await rejectsWith(unsplashFetch('/photos'), 'network');
  });

  it('maps unreadable JSON to invalid_response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status: 200 })));

    await rejectsWith(unsplashFetch('/photos'), 'invalid_response');
  });

  it('throws when the access key is missing', async () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));

    await expect(unsplashFetch('/photos')).rejects.toThrow('UNSPLASH_ACCESS_KEY is not set');
  });
});
