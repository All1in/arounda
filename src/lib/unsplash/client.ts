import 'server-only';

import { getUnsplashAccessKey } from '@/lib/env';
import { UnsplashApiError } from '@/lib/unsplash/errors';

const API_BASE_URL = 'https://api.unsplash.com';
const REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_REVALIDATE_SECONDS = 3600;

export interface UnsplashResponse<T> {
  data: T;
  total?: number;
}

export interface UnsplashFetchOptions {
  revalidate?: number;
}

function parseRetryAfterSeconds(headers: Headers): number | undefined {
  const retryAfter = headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  }

  const reset = headers.get('x-ratelimit-reset');
  if (reset) {
    const value = Number.parseInt(reset, 10);
    if (Number.isFinite(value) && value > 0) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (value > nowSeconds) return value - nowSeconds;
      if (value <= 3600) return value;
    }
  }

  return undefined;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function toApiError(response: Response): UnsplashApiError {
  const { status, headers } = response;
  const retryAfterSeconds = parseRetryAfterSeconds(headers);
  const rateLimitExhausted = headers.get('x-ratelimit-remaining') === '0';

  if (status === 429 || (status === 403 && rateLimitExhausted)) {
    return new UnsplashApiError('rate_limit', 'Unsplash rate limit reached', {
      status,
      retryAfterSeconds,
    });
  }
  if (status === 401 || status === 403) {
    return new UnsplashApiError('unauthorized', 'Unsplash rejected the access key', { status });
  }
  if (status === 404) {
    return new UnsplashApiError('not_found', 'Unsplash resource not found', { status });
  }

  return new UnsplashApiError('server', `Unsplash request failed with status ${status}`, {
    status,
  });
}

export async function unsplashFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  options: UnsplashFetchOptions = {},
): Promise<UnsplashResponse<T>> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  const url = `${API_BASE_URL}${path}${query ? `?${query}` : ''}`;

  // config error, not a network one — keep it out of the try
  const accessKey = getUnsplashAccessKey();

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS },
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new UnsplashApiError('timeout', 'Unsplash request timed out', { cause: error });
    }
    throw new UnsplashApiError('network', 'Could not reach the Unsplash API', { cause: error });
  }

  if (!response.ok) {
    throw toApiError(response);
  }

  let data: T;
  try {
    data = (await response.json()) as T;
  } catch (error) {
    throw new UnsplashApiError('invalid_response', 'Unsplash returned an unreadable response', {
      status: response.status,
      cause: error,
    });
  }

  const totalHeader = response.headers.get('x-total');
  const total = totalHeader === null ? undefined : Number.parseInt(totalHeader, 10);

  return {
    data,
    total: total !== undefined && Number.isFinite(total) && total >= 0 ? total : undefined,
  };
}
