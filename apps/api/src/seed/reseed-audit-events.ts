import type { PrismaClient } from '../generated/prisma/client.js';
import type { SeedEvent } from './generate-seed-events.js';

/**
 * Replaces every audit event with `events`, atomically. Re-running never duplicates data.
 *
 * TRUNCATE is used because the immutability trigger rejects DELETE. Rows are inserted in one
 * statement, and each id is a UUIDv7 shifted to the event's `createdAt`, so the time encoded in
 * the id agrees with the timestamp, as it does for events recorded through the API. The shift is
 * relative to clock_timestamp() because uuidv7() reads the wall clock, not the transaction start.
 */
export async function reseedAuditEvents(
  prisma: PrismaClient,
  events: readonly SeedEvent[],
): Promise<number> {
  const rows = JSON.stringify(
    events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
  );

  const [, inserted] = await prisma.$transaction([
    prisma.$executeRaw`TRUNCATE TABLE audit_events`,
    prisma.$executeRaw`
      INSERT INTO audit_events (
        id, event_type, action, resource_type, resource_id, actor_id, actor_email, actor_name,
        description, metadata, before, after, ip_address, user_agent, correlation_id, source, created_at
      )
      SELECT
        uuidv7(e."createdAt" - clock_timestamp()), e."eventType", e.action, e."resourceType", e."resourceId",
        e."actorId", e."actorEmail", e."actorName", e.description, e.metadata, e.before, e.after,
        e."ipAddress", e."userAgent", e."correlationId", e.source, e."createdAt"
      FROM jsonb_to_recordset(${rows}::jsonb) AS e(
        "eventType" text, action text, "resourceType" text, "resourceId" text, "actorId" text,
        "actorEmail" text, "actorName" text, description text, metadata jsonb, before jsonb,
        after jsonb, "ipAddress" inet, "userAgent" text, "correlationId" text, source text,
        "createdAt" timestamptz
      )`,
  ]);
  return inserted;
}
