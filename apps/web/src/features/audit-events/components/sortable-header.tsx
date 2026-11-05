import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { AuditEvent } from '@/lib/api/types';

/** Header button that toggles server-side sorting for its column. */
export function SortableHeader({ column, label }: { column: Column<AuditEvent>; label: string }) {
  const sorted = column.getIsSorted();
  const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className="-ml-1.5 inline-flex items-center gap-1 rounded px-1.5 py-1 font-medium text-muted-foreground text-xs hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[sorted=true]:text-foreground"
      data-sorted={sorted !== false}
    >
      {label}
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="sr-only">
        {sorted === false
          ? ', sort'
          : `, sorted ${sorted === 'asc' ? 'ascending' : 'descending'}; click to reverse`}
      </span>
    </button>
  );
}
