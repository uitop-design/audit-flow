import type { JsonObject } from '../../../common/json.js';

/** Field limits shared by request validation and the database schema. */
export const AUDIT_EVENT_LIMITS = {
  eventTypeMaxLength: 64,
  actionMaxLength: 100,
  resourceTypeMaxLength: 64,
  resourceIdMaxLength: 255,
  actorIdMaxLength: 255,
  actorEmailMaxLength: 320,
  actorNameMaxLength: 200,
  descriptionMaxLength: 1000,
  userAgentMaxLength: 512,
  correlationIdMaxLength: 128,
  sourceMaxLength: 100,
  metadataMaxBytes: 16 * 1024,
  snapshotMaxBytes: 32 * 1024,
} as const;

/** `eventType`, `action` and `resourceType` are SCREAMING_SNAKE_CASE identifiers, e.g. `USER_UPDATED`. */
export const IDENTIFIER_PATTERN = /^[A-Z][A-Z0-9_]*$/;
/** `source` names the producing system in lower kebab case, e.g. `billing-service`. */
export const SOURCE_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
export const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

/**
 * An event as submitted by a producer. It has no `id` or `createdAt`: both are assigned by the
 * system when the event is recorded, so a producer cannot express them.
 */
export interface NewAuditEvent {
  readonly eventType: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string | null;
  readonly actorId: string | null;
  readonly actorEmail: string | null;
  readonly actorName: string | null;
  readonly description: string;
  readonly metadata: JsonObject;
  readonly before: JsonObject | null;
  readonly after: JsonObject | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly correlationId: string | null;
  readonly source: string;
}

/** A recorded, immutable audit event. */
export interface AuditEvent extends NewAuditEvent {
  readonly id: string;
  readonly createdAt: Date;
}

/**
 * Deep-freezes a recorded event so application code cannot mutate it in memory either.
 * (The database independently rejects UPDATE and DELETE.)
 */
export function sealAuditEvent(event: AuditEvent): AuditEvent {
  return deepFreeze(event);
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value;
}
