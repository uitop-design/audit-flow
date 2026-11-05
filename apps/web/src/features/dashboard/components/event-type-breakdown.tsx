import { Link } from 'react-router';
import { eventTypeColor } from '@/features/audit-events/lib/event-type';
import type { AuditEventStats } from '@/lib/api/types';
import { formatNumber, humanizeIdentifier } from '@/lib/format';

/** Share of events per type. Each row opens the events table filtered to that type. */
export function EventTypeBreakdown({
  types,
  total,
}: {
  types: AuditEventStats['byEventType'];
  total: number;
}) {
  const max = types[0]?.count ?? 0;
  return (
    <ul className="space-y-1">
      {types.map(({ eventType, count }) => {
        const share = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <li key={eventType}>
            <Link
              to={`/events?eventType=${encodeURIComponent(eventType)}`}
              className="group block rounded-md px-2 py-1.5 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring"
              aria-label={`${humanizeIdentifier(eventType)}: ${formatNumber(count)} events, ${share}%. View events`}
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{humanizeIdentifier(eventType)}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {formatNumber(count)}
                  <span className="ml-2 inline-block w-9 text-right text-xs">{share}%</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${max === 0 ? 0 : (count / max) * 100}%`,
                    backgroundColor: eventTypeColor(eventType),
                  }}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
