import { useQuery } from '@tanstack/react-query';
import { humanizeIdentifier } from '@/lib/format';
import { auditEventFacetsQuery } from '../api/audit-events.queries';
import type { FilterPatch } from '../hooks/use-audit-event-filters';
import type { AuditEventFilters } from '../lib/filters';
import { ActiveFilters } from './active-filters';
import { DateRangeFilter } from './date-range-filter';
import { FacetSelect } from './facet-select';
import { MoreFilters } from './more-filters';
import { SearchInput } from './search-input';

interface AuditEventsToolbarProps {
  filters: AuditEventFilters;
  onChange: (patch: FilterPatch, options?: { replace?: boolean }) => void;
  onClear: () => void;
}

export function AuditEventsToolbar({ filters, onChange, onClear }: AuditEventsToolbarProps) {
  // Facet loading failures are non-fatal: selects still show any value already in the URL.
  const facets = useQuery(auditEventFacetsQuery).data;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <SearchInput
          value={filters.search}
          onSearch={(search) => onChange({ search }, { replace: true })}
        />
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <FacetSelect
            label="Event type"
            value={filters.eventType}
            options={facets?.eventTypes}
            onChange={(eventType) => onChange({ eventType })}
          />
          <FacetSelect
            label="Action"
            value={filters.action}
            options={facets?.actions}
            onChange={(action) => onChange({ action })}
            formatOption={humanizeIdentifier}
          />
          <FacetSelect
            label="Resource type"
            value={filters.resourceType}
            options={facets?.resourceTypes}
            onChange={(resourceType) => onChange({ resourceType })}
            formatOption={humanizeIdentifier}
          />
          <DateRangeFilter from={filters.from} to={filters.to} onChange={onChange} />
          <MoreFilters values={filters} onApply={onChange} />
        </div>
      </div>
      <ActiveFilters filters={filters} onRemove={onChange} onClear={onClear} />
    </div>
  );
}
