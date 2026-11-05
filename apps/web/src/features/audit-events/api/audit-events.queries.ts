import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiGet } from '@/lib/api/client';
import type {
  AuditEventFacets,
  AuditEventList,
  AuditEventStats,
  ListAuditEventsParams,
} from '@/lib/api/types';

export const auditEventKeys = {
  all: ['audit-events'] as const,
  lists: () => [...auditEventKeys.all, 'list'] as const,
  list: (params: ListAuditEventsParams) => [...auditEventKeys.lists(), params] as const,
  stats: () => [...auditEventKeys.all, 'stats'] as const,
  facets: () => [...auditEventKeys.all, 'facets'] as const,
};

export function auditEventListQuery(params: ListAuditEventsParams) {
  return queryOptions({
    queryKey: auditEventKeys.list(params),
    queryFn: ({ signal }) =>
      apiGet<AuditEventList>('/api/v1/audit-events', { query: params, signal }),
    // Keep showing the current page while the next one loads, so the table does not flash empty.
    placeholderData: keepPreviousData,
  });
}

export const auditEventStatsQuery = queryOptions({
  queryKey: auditEventKeys.stats(),
  queryFn: ({ signal }) => apiGet<AuditEventStats>('/api/v1/audit-events/stats', { signal }),
});

export const auditEventFacetsQuery = queryOptions({
  queryKey: auditEventKeys.facets(),
  queryFn: ({ signal }) => apiGet<AuditEventFacets>('/api/v1/audit-events/facets', { signal }),
  staleTime: 5 * 60_000,
});
