import { Bot } from 'lucide-react';
import { Link } from 'react-router';
import { EventTypeBadge } from '@/features/audit-events/components/event-type-badge';
import type { AuditEvent } from '@/lib/api/types';
import { formatDateTime, formatRelativeTime } from '@/lib/format';

function initials(name: string): string {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function RecentActivity({ events }: { events: AuditEvent[] }) {
  return (
    <ol className="divide-y">
      {events.map((event) => {
        const actor = event.actorName ?? event.actorEmail ?? event.actorId;
        return (
          <li key={event.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted/50 font-medium text-[11px] text-muted-foreground"
              aria-hidden="true"
            >
              {actor ? initials(actor) : <Bot className="size-3.5" />}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm leading-snug">
                <span className="font-medium">{actor ?? 'System'}</span>{' '}
                <span className="text-muted-foreground">·</span>{' '}
                <Link
                  to={`/events/${event.id}`}
                  className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {event.description}
                </Link>
              </p>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                <EventTypeBadge eventType={event.eventType} />
                <time dateTime={event.createdAt} title={formatDateTime(event.createdAt)}>
                  {formatRelativeTime(event.createdAt)}
                </time>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
