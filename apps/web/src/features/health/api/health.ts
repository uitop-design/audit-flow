import { queryOptions } from '@tanstack/react-query';
import { ApiError, apiGet } from '@/lib/api/client';
import type { HealthReport } from '@/lib/api/types';

const HEALTH_REFRESH_MS = 30_000;

/** A 503 still carries a health report (database down), so it is data, not an error. */
export async function fetchHealth(signal?: AbortSignal): Promise<HealthReport> {
  try {
    return await apiGet<HealthReport>('/api/v1/health', { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 503 && isHealthReport(error.body)) {
      return error.body;
    }
    throw error;
  }
}

export const healthQuery = queryOptions({
  queryKey: ['health'],
  queryFn: ({ signal }) => fetchHealth(signal),
  refetchInterval: HEALTH_REFRESH_MS,
  retry: false,
});

function isHealthReport(value: unknown): value is HealthReport {
  return typeof value === 'object' && value !== null && 'status' in value && 'checks' in value;
}
