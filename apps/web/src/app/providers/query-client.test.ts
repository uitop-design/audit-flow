import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { shouldRetryQuery } from './query-client';

describe('shouldRetryQuery', () => {
  it.each([400, 404, 422])('does not retry client errors (%i)', (status) => {
    expect(shouldRetryQuery(0, new ApiError('nope', status))).toBe(false);
  });

  it('retries server and network errors at most twice', () => {
    for (const error of [
      new ApiError('down', 503),
      new ApiError('offline', 0),
      new Error('boom'),
    ]) {
      expect(shouldRetryQuery(0, error)).toBe(true);
      expect(shouldRetryQuery(1, error)).toBe(true);
      expect(shouldRetryQuery(2, error)).toBe(false);
    }
  });
});
