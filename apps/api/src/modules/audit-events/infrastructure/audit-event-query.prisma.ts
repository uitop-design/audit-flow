import type { Prisma } from '../../../generated/prisma/client.js';
import type {
  AuditEventFilters,
  AuditEventSortField,
  SortOrder,
} from '../domain/audit-event-query.js';

type WhereInput = Prisma.AuditEventWhereInput;
type OrderByInput = Prisma.AuditEventOrderByWithRelationInput;

/** Maps each whitelisted sort field to a concrete column ordering. Nullable columns sort nulls last. */
const SORT_COLUMNS: Record<AuditEventSortField, (order: SortOrder) => OrderByInput> = {
  createdAt: (order) => ({ createdAt: order }),
  eventType: (order) => ({ eventType: order }),
  action: (order) => ({ action: order }),
  resourceType: (order) => ({ resourceType: order }),
  actorEmail: (order) => ({ actorEmail: { sort: order, nulls: 'last' } }),
  source: (order) => ({ source: order }),
};

/**
 * Deterministic ordering: the requested column, then newest first, then `id` as a unique
 * tie-breaker so rows never shift between pages.
 */
export function buildOrderBy(sortBy: AuditEventSortField, sortOrder: SortOrder): OrderByInput[] {
  if (sortBy === 'createdAt') {
    return [{ createdAt: sortOrder }, { id: sortOrder }];
  }
  return [SORT_COLUMNS[sortBy](sortOrder), { createdAt: 'desc' }, { id: 'desc' }];
}

/**
 * Prisma's `contains` becomes `ILIKE '%value%'` without escaping the value, so `%` and `_` typed by
 * a user would act as wildcards. Escape them (and the escape character itself) to match literally.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export function buildWhere(filters: AuditEventFilters): WhereInput {
  const conditions: WhereInput[] = [];

  const exactMatches: WhereInput = {
    eventType: filters.eventType,
    action: filters.action,
    resourceType: filters.resourceType,
    resourceId: filters.resourceId,
    actorId: filters.actorId,
    source: filters.source,
    correlationId: filters.correlationId,
  };
  conditions.push(exactMatches);

  if (filters.createdFrom || filters.createdBefore) {
    conditions.push({ createdAt: { gte: filters.createdFrom, lt: filters.createdBefore } });
  }

  if (filters.search) {
    const contains = { contains: escapeLikePattern(filters.search), mode: 'insensitive' } as const;
    conditions.push({
      OR: [
        { description: contains },
        { actorEmail: contains },
        { actorName: contains },
        { actorId: contains },
        { resourceId: contains },
        { action: contains },
        { correlationId: contains },
      ],
    });
  }

  return { AND: conditions };
}
