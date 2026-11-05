/** Fields a list may be sorted by. Anything else is rejected before reaching the database. */
export const AUDIT_EVENT_SORT_FIELDS = [
  'createdAt',
  'eventType',
  'action',
  'resourceType',
  'actorEmail',
  'source',
] as const;
export type AuditEventSortField = (typeof AUDIT_EVENT_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
} as const;

export const SEARCH_MAX_LENGTH = 200;

/** All filters are optional and combine with AND. */
export interface AuditEventFilters {
  /** Case-insensitive substring match across descriptive text fields; matched literally. */
  readonly search?: string;
  readonly eventType?: string;
  readonly action?: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly actorId?: string;
  readonly source?: string;
  readonly correlationId?: string;
  /** Inclusive lower bound on `createdAt`. */
  readonly createdFrom?: Date;
  /** Exclusive upper bound on `createdAt`. */
  readonly createdBefore?: Date;
}

export interface AuditEventQuery {
  readonly page: number;
  readonly limit: number;
  readonly sortBy: AuditEventSortField;
  readonly sortOrder: SortOrder;
  readonly filters: AuditEventFilters;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export function pageOffset(query: Pick<AuditEventQuery, 'page' | 'limit'>): number {
  return (query.page - 1) * query.limit;
}

export function toPage<T>(
  items: readonly T[],
  total: number,
  query: Pick<AuditEventQuery, 'page' | 'limit'>,
): Page<T> {
  return {
    items,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  };
}
