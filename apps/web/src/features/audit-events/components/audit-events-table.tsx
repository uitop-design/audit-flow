import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import type * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AuditEvent } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { SORTABLE_FIELDS, type SortField, type SortOrder } from '../lib/filters';
import { auditEventColumns } from './audit-event-columns';

interface AuditEventsTableProps {
  events: AuditEvent[];
  sortBy: SortField;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
  /** First load: show skeleton rows. */
  isLoading: boolean;
  /** A new page or filter is loading while the previous rows stay visible. */
  isRefreshing: boolean;
  skeletonRows: number;
  /** Opens an event's details; rows are clickable as a shortcut for the link in the action cell. */
  onOpenEvent: (event: AuditEvent) => void;
  /** The event whose details are open, highlighted in the table. */
  selectedEventId?: string;
}

/** Row clicks open details unless the user clicked a control or is selecting text. */
function isRowActivation(event: React.MouseEvent): boolean {
  const target = event.target as HTMLElement;
  return !target.closest('a, button') && !window.getSelection()?.toString();
}

function isSortField(value: string): value is SortField {
  return (SORTABLE_FIELDS as readonly string[]).includes(value);
}

/**
 * Presentation of one page of events. Sorting and paging happen on the server: the table only
 * reports intents, it never sorts or slices rows itself.
 */
export function AuditEventsTable({
  events,
  sortBy,
  sortOrder,
  onSortChange,
  isLoading,
  isRefreshing,
  skeletonRows,
  onOpenEvent,
  selectedEventId,
}: AuditEventsTableProps) {
  const sorting: SortingState = [{ id: sortBy, desc: sortOrder === 'desc' }];

  const table = useReactTable({
    data: events,
    columns: auditEventColumns,
    getRowId: (event) => event.id,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    // A list is always sorted; toggling flips direction instead of removing the sort.
    enableSortingRemoval: false,
    // Explicit first direction (ascending; the time column opts into descending). Otherwise TanStack
    // infers it from the first row's value, which flips when that value happens to be null.
    sortDescFirst: false,
    state: { sorting },
    onSortingChange: (updater) => {
      const [next] = functionalUpdate(updater, sorting);
      if (next && isSortField(next.id)) {
        onSortChange(next.id, next.desc ? 'desc' : 'asc');
      }
    },
  });

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {/* A minimum width keeps columns legible; narrow screens scroll the table, not the page. */}
      <Table
        aria-busy={isLoading || isRefreshing}
        className={cn(
          'min-w-[1040px] table-fixed',
          isRefreshing && 'opacity-60 transition-opacity',
        )}
      >
        <TableHeader className="bg-muted/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className={cn('h-9', header.column.columnDef.meta?.className)}
                    aria-sort={
                      sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'
                    }
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: skeletonRows }, (_, index) => (
                // Placeholder rows have no identity; their position is their key.
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows never reorder.
                <TableRow key={index} data-testid="skeleton-row">
                  {table.getVisibleLeafColumns().map((column) => (
                    <TableCell key={column.id} className={column.columnDef.meta?.className}>
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                      <Skeleton className="mt-1.5 h-3 w-2/3 max-w-[110px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.id === selectedEventId ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={(event) => isRowActivation(event) && onOpenEvent(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn('py-2.5', cell.column.columnDef.meta?.className)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
