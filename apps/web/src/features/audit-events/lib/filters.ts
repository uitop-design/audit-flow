import { z } from 'zod';
import type { ListAuditEventsParams } from '@/lib/api/types';

/**
 * The events page keeps all of its state in the URL. This module parses search params into a typed
 * filter object (dropping anything invalid instead of sending it to the API), serialises it back
 * without defaults, and converts it into API query parameters. The API remains the authority on
 * validation; these rules only keep the URL tidy and predictable.
 */

/** Columns the table can sort by. Checked at compile time against the API contract's enum. */
export const SORTABLE_FIELDS = [
  'createdAt',
  'actorEmail',
  'action',
  'resourceType',
  'eventType',
  'source',
] as const satisfies readonly NonNullable<ListAuditEventsParams['sortBy']>[];
export type SortField = (typeof SORTABLE_FIELDS)[number];
export type SortOrder = NonNullable<ListAuditEventsParams['sortOrder']>;

export const PAGE_SIZES = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional().catch(undefined);
const optionalDay = z.iso.date().optional().catch(undefined);

const filtersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce
    .number()
    .refine((value) => (PAGE_SIZES as readonly number[]).includes(value))
    .catch(DEFAULT_PAGE_SIZE),
  search: optionalText(200),
  eventType: optionalText(64),
  action: optionalText(100),
  resourceType: optionalText(64),
  resourceId: optionalText(255),
  actorId: optionalText(255),
  source: optionalText(100),
  correlationId: optionalText(128),
  /** First day of the range, inclusive, in the viewer's time zone (`YYYY-MM-DD`). */
  from: optionalDay,
  /** Last day of the range, inclusive. */
  to: optionalDay,
  sortBy: z.enum(SORTABLE_FIELDS).catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).catch('desc'),
});

export type AuditEventFilters = z.infer<typeof filtersSchema>;

export const DEFAULT_FILTERS: AuditEventFilters = filtersSchema.parse({});

/** Filters that narrow the result set (as opposed to paging and sorting). */
export const NARROWING_KEYS = [
  'search',
  'eventType',
  'action',
  'resourceType',
  'resourceId',
  'actorId',
  'source',
  'correlationId',
  'from',
  'to',
] as const satisfies readonly (keyof AuditEventFilters)[];

export function parseAuditEventFilters(params: URLSearchParams): AuditEventFilters {
  const filters = filtersSchema.parse(Object.fromEntries(params));
  // A reversed range cannot match anything; keep the start and drop the end.
  if (filters.from && filters.to && filters.from > filters.to) {
    return { ...filters, to: undefined };
  }
  return filters;
}

/** Writes only non-default values, so URLs stay short and shareable. */
export function serializeAuditEventFilters(filters: AuditEventFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== DEFAULT_FILTERS[key as keyof AuditEventFilters]) {
      params.set(key, String(value));
    }
  }
  return params;
}

export function hasNarrowingFilters(filters: AuditEventFilters): boolean {
  return NARROWING_KEYS.some((key) => filters[key] !== undefined);
}

/** Local midnight of a `YYYY-MM-DD` day. */
export function startOfDay(day: string): Date {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

export function toDayString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Converts URL filters into API parameters. The inclusive day range becomes the API's half-open
 * instant range: [start of `from`, start of the day after `to`), both in the viewer's time zone.
 */
export function toListParams(filters: AuditEventFilters): ListAuditEventsParams {
  const dayAfterTo = filters.to ? startOfDay(filters.to) : undefined;
  dayAfterTo?.setDate(dayAfterTo.getDate() + 1);
  return {
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
    eventType: filters.eventType,
    action: filters.action,
    resourceType: filters.resourceType,
    resourceId: filters.resourceId,
    actorId: filters.actorId,
    source: filters.source,
    correlationId: filters.correlationId,
    dateFrom: filters.from ? startOfDay(filters.from).toISOString() : undefined,
    dateTo: dayAfterTo?.toISOString(),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}
