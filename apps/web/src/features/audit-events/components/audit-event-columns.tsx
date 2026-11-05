import type { ColumnDef } from '@tanstack/react-table';
import type { AuditEvent } from '@/lib/api/types';
import { ActionCell, ActorCell, ResourceCell, TimestampCell } from './audit-event-cells';
import { EventTypeBadge } from './event-type-badge';
import { SortableHeader } from './sortable-header';

/**
 * Accessor keys equal the API's sort fields, so table sorting state maps directly to `sortBy`.
 * (TanStack only allows sorting columns that have an accessor.) Text columns sort ascending first;
 * time sorts newest first.
 */
export const auditEventColumns: ColumnDef<AuditEvent>[] = [
  {
    accessorKey: 'createdAt',
    sortDescFirst: true,
    header: ({ column }) => <SortableHeader column={column} label="Timestamp" />,
    cell: ({ row }) => <TimestampCell createdAt={row.original.createdAt} />,
    meta: { className: 'w-[150px]' },
  },
  {
    accessorKey: 'actorEmail',
    header: ({ column }) => <SortableHeader column={column} label="Actor" />,
    cell: ({ row }) => <ActorCell event={row.original} />,
    meta: { className: 'w-[210px] max-w-[210px]' },
  },
  {
    accessorKey: 'action',
    header: ({ column }) => <SortableHeader column={column} label="Action" />,
    cell: ({ row }) => <ActionCell event={row.original} />,
    meta: { className: 'min-w-[240px] max-w-[360px]' },
  },
  {
    accessorKey: 'resourceType',
    header: ({ column }) => <SortableHeader column={column} label="Resource" />,
    cell: ({ row }) => <ResourceCell event={row.original} />,
    meta: { className: 'w-[170px] max-w-[170px]' },
  },
  {
    accessorKey: 'eventType',
    header: ({ column }) => <SortableHeader column={column} label="Event type" />,
    cell: ({ row }) => <EventTypeBadge eventType={row.original.eventType} />,
    meta: { className: 'w-[130px]' },
  },
  {
    accessorKey: 'source',
    header: ({ column }) => <SortableHeader column={column} label="Source" />,
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground text-xs">{row.original.source}</span>
    ),
    meta: { className: 'w-[150px]' },
  },
];
