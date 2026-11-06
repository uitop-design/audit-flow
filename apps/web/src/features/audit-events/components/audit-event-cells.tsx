import { Bot } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import type { AuditEvent } from '@/lib/api/types';
import {
  formatCompactTimestamp,
  formatDateTime,
  formatRelativeTime,
  humanizeIdentifier,
  isWithinLastWeek,
} from '@/lib/format';

export function TimestampCell({ createdAt }: { createdAt: string }) {
  return (
    <div className="grid gap-0.5">
      <time
        dateTime={createdAt}
        title={formatDateTime(createdAt)}
        className="whitespace-nowrap text-sm tabular-nums"
      >
        {formatCompactTimestamp(createdAt)}
      </time>
      {/* Older rows already show their date; a second date line would only repeat it. */}
      {isWithinLastWeek(createdAt) ? (
        <span className="text-muted-foreground text-xs">{formatRelativeTime(createdAt)}</span>
      ) : null}
    </div>
  );
}

/** A named user, an email-only attempt (e.g. failed sign-in), or a system process. */
export function ActorCell({ event }: { event: AuditEvent }) {
  if (!event.actorId && !event.actorEmail && !event.actorName) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
        <Bot className="size-3.5" aria-hidden="true" />
        System
      </span>
    );
  }
  const primary = event.actorName ?? event.actorEmail ?? event.actorId;
  const secondary = event.actorName ? event.actorEmail : null;
  return (
    <div className="grid min-w-0 gap-0.5">
      <span className="truncate font-medium text-sm">{primary}</span>
      {secondary ? (
        <span className="truncate text-muted-foreground text-xs">{secondary}</span>
      ) : null}
    </div>
  );
}

/** The row's primary link: opens the event's details, keeping the current filters in the URL. */
export function ActionCell({ event }: { event: AuditEvent }) {
  const { search } = useLocation();
  return (
    <div className="grid min-w-0 gap-0.5">
      <Link
        to={{ pathname: `/events/${event.id}`, search }}
        className="truncate font-medium text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        {humanizeIdentifier(event.action)}
      </Link>
      <span className="truncate text-muted-foreground text-xs" title={event.description}>
        {event.description}
      </span>
    </div>
  );
}

export function ResourceCell({ event }: { event: AuditEvent }) {
  return (
    <div className="grid min-w-0 gap-0.5">
      <span className="truncate text-sm">{humanizeIdentifier(event.resourceType)}</span>
      {event.resourceId ? (
        <span className="truncate font-mono text-muted-foreground text-xs">{event.resourceId}</span>
      ) : null}
    </div>
  );
}
