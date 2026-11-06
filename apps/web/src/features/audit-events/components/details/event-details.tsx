import { Bot, ListFilter } from 'lucide-react';
import { Link } from 'react-router';
import { CopyButton } from '@/components/shared/copy-button';
import { JsonViewer } from '@/components/shared/json-viewer';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { AuditEvent } from '@/lib/api/types';
import { formatDateTime, formatRelativeTime, humanizeIdentifier } from '@/lib/format';
import { EventTypeBadge } from '../event-type-badge';
import { ChangesSection } from './changes-section';
import { DetailItem, DetailList, DetailSection, Identifier, NotRecorded } from './detail-list';

/** Everything recorded about one event, laid out for reading top to bottom. */
export function EventDetails({ event }: { event: AuditEvent }) {
  const isSystem = !event.actorId && !event.actorEmail && !event.actorName;
  return (
    <>
      <SheetHeader className="gap-2 border-b pr-12">
        <div className="flex flex-wrap items-center gap-2">
          <EventTypeBadge eventType={event.eventType} />
          <time
            dateTime={event.createdAt}
            title={formatDateTime(event.createdAt)}
            className="text-muted-foreground text-xs"
          >
            {formatRelativeTime(event.createdAt)}
          </time>
        </div>
        <SheetTitle className="text-lg">{humanizeIdentifier(event.action)}</SheetTitle>
        <SheetDescription>{event.description}</SheetDescription>
      </SheetHeader>

      <div className="@container flex-1 space-y-6 overflow-y-auto p-4">
        <DetailSection title="Event">
          <DetailList>
            <DetailItem label="Event ID">
              <Identifier
                value={event.id}
                copy={<CopyButton value={event.id} label="event ID" />}
              />
            </DetailItem>
            <DetailItem label="Recorded at">
              <time dateTime={event.createdAt} className="tabular-nums">
                {formatDateTime(event.createdAt)}
              </time>
            </DetailItem>
            <DetailItem label="Action">
              <Identifier value={event.action} />
            </DetailItem>
            <DetailItem label="Event type">
              <Identifier value={event.eventType} />
            </DetailItem>
          </DetailList>
        </DetailSection>

        <DetailSection title="Actor">
          {isSystem ? (
            <p className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
              <Bot className="size-4" aria-hidden="true" />
              Performed by a system process, not a person.
            </p>
          ) : (
            <DetailList>
              <DetailItem label="Name">{event.actorName ?? <NotRecorded />}</DetailItem>
              <DetailItem label="Email">{event.actorEmail ?? <NotRecorded />}</DetailItem>
              <DetailItem label="Actor ID">
                <Identifier value={event.actorId} />
              </DetailItem>
            </DetailList>
          )}
        </DetailSection>

        <DetailSection title="Resource">
          <DetailList>
            <DetailItem label="Type">{humanizeIdentifier(event.resourceType)}</DetailItem>
            <DetailItem label="Resource ID">
              <Identifier value={event.resourceId} />
            </DetailItem>
          </DetailList>
        </DetailSection>

        <DetailSection title="Request context">
          <DetailList>
            <DetailItem label="Source">
              <Identifier value={event.source} />
            </DetailItem>
            <DetailItem label="IP address">
              <Identifier value={event.ipAddress} />
            </DetailItem>
            <DetailItem label="User agent">
              {event.userAgent ? (
                <span className="break-all text-xs">{event.userAgent}</span>
              ) : (
                <NotRecorded />
              )}
            </DetailItem>
            <DetailItem label="Correlation ID">
              {event.correlationId ? (
                <div className="space-y-1">
                  <Identifier
                    value={event.correlationId}
                    copy={<CopyButton value={event.correlationId} label="correlation ID" />}
                  />
                  <Link
                    to={`/events?correlationId=${encodeURIComponent(event.correlationId)}&sortOrder=asc`}
                    className="inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
                  >
                    <ListFilter className="size-3" aria-hidden="true" />
                    View all events in this operation
                  </Link>
                </div>
              ) : (
                <NotRecorded />
              )}
            </DetailItem>
          </DetailList>
        </DetailSection>

        <DetailSection title="Changes">
          <ChangesSection before={event.before} after={event.after} />
        </DetailSection>

        <DetailSection title="Metadata">
          {Object.keys(event.metadata).length > 0 ? (
            <JsonViewer value={event.metadata} label="metadata" />
          ) : (
            <p className="text-muted-foreground text-sm">No metadata recorded.</p>
          )}
        </DetailSection>
      </div>
    </>
  );
}
