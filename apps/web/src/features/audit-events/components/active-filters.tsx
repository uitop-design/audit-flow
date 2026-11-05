import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FilterPatch } from '../hooks/use-audit-event-filters';
import type { AuditEventFilters } from '../lib/filters';
import { describeDateRange } from './date-range-filter';

interface ActiveFiltersProps {
  filters: AuditEventFilters;
  onRemove: (patch: FilterPatch) => void;
  onClear: () => void;
}

const LABELS = {
  search: 'Search',
  eventType: 'Event type',
  action: 'Action',
  resourceType: 'Resource type',
  resourceId: 'Resource ID',
  actorId: 'Actor ID',
  source: 'Source',
  correlationId: 'Correlation ID',
} as const satisfies Partial<Record<keyof AuditEventFilters, string>>;

/** One removable chip per applied filter, plus "Clear filters". */
export function ActiveFilters({ filters, onRemove, onClear }: ActiveFiltersProps) {
  const chips: { key: string; label: string; value: string; patch: FilterPatch }[] = [];
  for (const [key, label] of Object.entries(LABELS) as [keyof typeof LABELS, string][]) {
    const value = filters[key];
    if (value) {
      chips.push({ key, label, value, patch: { [key]: undefined } });
    }
  }
  const dateRange = describeDateRange(filters.from, filters.to);
  if (dateRange) {
    chips.push({
      key: 'date',
      label: 'Date',
      value: dateRange,
      patch: { from: undefined, to: undefined },
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <span className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/40 py-0.5 pr-0.5 pl-2 text-xs">
            <span className="text-muted-foreground">{chip.label}:</span>
            <span className="max-w-[220px] truncate font-medium">{chip.value}</span>
            <button
              type="button"
              onClick={() => onRemove(chip.patch)}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Remove ${chip.label.toLowerCase()} filter`}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        </li>
      ))}
      <li>
        <Button variant="ghost" size="xs" onClick={onClear}>
          Clear filters
        </Button>
      </li>
    </ul>
  );
}
