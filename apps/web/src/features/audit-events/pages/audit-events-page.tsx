import { useQuery } from '@tanstack/react-query';
import { FileSearch, Inbox } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import { auditEventListQuery } from '../api/audit-events.queries';
import { AuditEventsTable } from '../components/audit-events-table';
import { AuditEventsToolbar } from '../components/audit-events-toolbar';
import { TablePagination } from '../components/table-pagination';
import { useAuditEventFilters } from '../hooks/use-audit-event-filters';
import { hasNarrowingFilters, toListParams } from '../lib/filters';

const MAX_SKELETON_ROWS = 10;

export function AuditEventsPage() {
  const { filters, updateFilters, clearFilters } = useAuditEventFilters();
  const query = useQuery(auditEventListQuery(toListParams(filters)));
  const list = query.data;

  return (
    <>
      <PageHeader
        title="Audit events"
        description={
          list
            ? `${formatNumber(list.meta.total)} matching events. Newest first by default.`
            : 'Every recorded action.'
        }
      />
      <AuditEventsToolbar filters={filters} onChange={updateFilters} onClear={clearFilters} />
      {query.isError && !list ? (
        <ErrorState
          error={query.error}
          title="Could not load audit events"
          onRetry={() => query.refetch()}
        />
      ) : list && list.data.length === 0 ? (
        <NoResults
          total={list.meta.total}
          totalPages={list.meta.totalPages}
          filtered={hasNarrowingFilters(filters)}
          onClear={clearFilters}
          onLastPage={() => updateFilters({ page: list.meta.totalPages })}
        />
      ) : (
        <div className="space-y-3">
          <AuditEventsTable
            events={list?.data ?? []}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortChange={(sortBy, sortOrder) => updateFilters({ sortBy, sortOrder })}
            isLoading={query.isPending}
            isRefreshing={query.isPlaceholderData}
            skeletonRows={Math.min(filters.limit, MAX_SKELETON_ROWS)}
          />
          {list ? (
            <TablePagination
              page={filters.page}
              limit={filters.limit}
              total={list.meta.total}
              totalPages={list.meta.totalPages}
              onPageChange={(page) => updateFilters({ page })}
              onPageSizeChange={(limit) => updateFilters({ limit })}
            />
          ) : null}
        </div>
      )}
    </>
  );
}

interface NoResultsProps {
  total: number;
  totalPages: number;
  filtered: boolean;
  onClear: () => void;
  onLastPage: () => void;
}

function NoResults({ total, totalPages, filtered, onClear, onLastPage }: NoResultsProps) {
  if (total > 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="This page is past the end of the results"
        description={`There are ${formatNumber(total)} matching events across ${formatNumber(totalPages)} pages.`}
        action={
          <Button variant="outline" size="sm" onClick={onLastPage}>
            Go to last page
          </Button>
        }
      />
    );
  }
  if (filtered) {
    return (
      <EmptyState
        icon={FileSearch}
        title="No events match these filters"
        description="Try a broader search or a different date range."
        action={
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        }
      />
    );
  }
  return (
    <EmptyState
      icon={Inbox}
      title="No audit events yet"
      description={
        <>
          Events appear here as soon as an application records them. For demo data, run{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">pnpm db:seed</code>.
        </>
      }
    />
  );
}
