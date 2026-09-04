export type UnsplashErrorKind =
  | 'rate_limit'
  | 'unauthorized'
  | 'not_found'
  | 'timeout'
  | 'network'
  | 'server'
  | 'invalid_response';

export interface UnsplashApiErrorOptions {
  status?: number;
  retryAfterSeconds?: number;
  cause?: unknown;
}

export class UnsplashApiError extends Error {
  readonly kind: UnsplashErrorKind;
  readonly status?: number;
  readonly retryAfterSeconds?: number;

  constructor(kind: UnsplashErrorKind, message: string, options: UnsplashApiErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'UnsplashApiError';
    this.kind = kind;
    this.status = options.status;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}
