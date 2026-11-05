import type { ErrorResponse } from './types';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

/** Absolute URL for an API path such as `/api/v1/health`. */
export function apiUrl(path: string): URL {
  return new URL(`${API_ORIGIN}${path}`, window.location.origin);
}

export type QueryValue = string | number | boolean | null | undefined;

/** Thrown for any failed API call. `status` is 0 when the API could not be reached at all. */
export class ApiError extends Error {
  readonly status: number;
  /** Parsed response body, if it was JSON. */
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  /** The API's uniform error body, when the response carried one. */
  get errorResponse(): ErrorResponse | null {
    return isErrorResponse(this.body) ? this.body : null;
  }

  get requestId(): string | null {
    return this.errorResponse?.requestId ?? null;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

export interface ApiRequestOptions {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

/**
 * GETs a JSON resource. Response bodies are trusted to match the generated contract types; the
 * server validates everything it returns, so the client does not re-validate at runtime.
 */
export async function apiGet<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = apiUrl(path);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: options.signal,
    });
  } catch (error) {
    // Cancellation is not a failure: let TanStack Query see the abort as-is.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError('Could not reach the AuditFlow API', 0);
  }

  const body = await readJson(response);
  if (!response.ok) {
    const message = isErrorResponse(body)
      ? body.message
      : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, body);
  }
  return body as T;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).statusCode === 'number' &&
    typeof (value as Record<string, unknown>).message === 'string' &&
    typeof (value as Record<string, unknown>).requestId === 'string'
  );
}
