import { isJsonObject, type JsonObject } from '../../../common/json.js';
import { type AuditEvent as AuditEventRecord, Prisma } from '../../../generated/prisma/client.js';
import { type AuditEvent, type NewAuditEvent, sealAuditEvent } from '../domain/audit-event.js';

export function toAuditEvent(record: AuditEventRecord): AuditEvent {
  return sealAuditEvent({
    id: record.id,
    eventType: record.eventType,
    action: record.action,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    actorId: record.actorId,
    actorEmail: record.actorEmail,
    actorName: record.actorName,
    description: record.description,
    metadata: readJsonObject(record.metadata, 'metadata'),
    before: record.before === null ? null : readJsonObject(record.before, 'before'),
    after: record.after === null ? null : readJsonObject(record.after, 'after'),
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    correlationId: record.correlationId,
    source: record.source,
    createdAt: record.createdAt,
  });
}

/** `id` and `createdAt` are omitted on purpose: the database assigns both. */
export function toCreateInput(event: NewAuditEvent): Prisma.AuditEventCreateInput {
  return {
    eventType: event.eventType,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    actorId: event.actorId,
    actorEmail: event.actorEmail,
    actorName: event.actorName,
    description: event.description,
    metadata: event.metadata,
    // Absent snapshots are stored as SQL NULL, never as JSON null.
    before: event.before ?? Prisma.DbNull,
    after: event.after ?? Prisma.DbNull,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    correlationId: event.correlationId,
    source: event.source,
  };
}

function readJsonObject(value: Prisma.JsonValue, column: string): JsonObject {
  // Guaranteed by CHECK constraints; a failure here means the row was written outside the app.
  if (!isJsonObject(value)) {
    throw new Error(`audit_events.${column} is not a JSON object`);
  }
  return value;
}
