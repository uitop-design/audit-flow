import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuditEvent, AuditEventList } from '@/lib/api/types';
import { auditEventDetailQuery, auditEventKeys } from '../api/audit-events.queries';

/**
 * Loads one event. While the request is in flight, the copy from an already-loaded list page is
 * shown, so opening a row is instant; events are immutable, so that copy cannot be outdated.
 */
export function useAuditEventDetail(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    ...auditEventDetailQuery(id),
    placeholderData: () =>
      findInLoadedLists(
        queryClient.getQueriesData<AuditEventList>({ queryKey: auditEventKeys.lists() }),
        id,
      ),
  });
}

function findInLoadedLists(
  lists: [unknown, AuditEventList | undefined][],
  id: string,
): AuditEvent | undefined {
  for (const [, list] of lists) {
    const match = list?.data.find((event) => event.id === id);
    if (match) {
      return match;
    }
  }
  return undefined;
}
