import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';

const MAX_RETRIES = 2;

/** Client errors (4xx) will not succeed on retry; server and network errors might. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.isClientError) {
    return false;
  }
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetryQuery,
      },
    },
  });
}
