import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  type AuditEventFilters,
  DEFAULT_FILTERS,
  parseAuditEventFilters,
  serializeAuditEventFilters,
} from '../lib/filters';

export type FilterPatch = Partial<AuditEventFilters>;

interface UpdateOptions {
  /** Replace the history entry instead of pushing one (used while typing a search). */
  replace?: boolean;
}

/** URL-backed filter state for the events page. The URL is the single source of truth. */
export function useAuditEventFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseAuditEventFilters(searchParams), [searchParams]);

  const updateFilters = useCallback(
    (patch: FilterPatch, options: UpdateOptions = {}) => {
      setSearchParams(
        (current) => {
          const next = { ...parseAuditEventFilters(current), ...patch };
          // Any change other than paging returns to the first page; the old page may not exist.
          if (patch.page === undefined) {
            next.page = 1;
          }
          return serializeAuditEventFilters(next);
        },
        { replace: options.replace },
      );
    },
    [setSearchParams],
  );

  /** Removes every narrowing filter but keeps page size and sorting. */
  const clearFilters = useCallback(() => {
    setSearchParams((current) => {
      const { limit, sortBy, sortOrder } = parseAuditEventFilters(current);
      return serializeAuditEventFilters({ ...DEFAULT_FILTERS, limit, sortBy, sortOrder });
    });
  }, [setSearchParams]);

  return { filters, updateFilters, clearFilters };
}
