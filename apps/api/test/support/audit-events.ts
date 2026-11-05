import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/database/prisma.service.js';
import type { Prisma } from '../../src/generated/prisma/client.js';

/** A valid ingestion payload; override fields per test. */
export function eventPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    eventType: 'USER',
    action: 'USER_UPDATED',
    resourceType: 'USER',
    resourceId: 'usr_123',
    actorId: 'usr_456',
    actorEmail: 'admin@example.com',
    actorName: 'John Doe',
    description: 'Updated user permissions',
    metadata: { source: 'admin-dashboard' },
    before: { role: 'USER' },
    after: { role: 'ADMIN' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    correlationId: 'req_abc123',
    source: 'example-app',
    ...overrides,
  };
}

/**
 * Removes all events. TRUNCATE is the only way to clear the table: the immutability trigger
 * rejects DELETE. Test databases only (see resolveTestDatabaseUrl).
 */
export async function clearAuditEvents(app: INestApplication): Promise<void> {
  await app.get(PrismaService).$executeRaw`TRUNCATE TABLE audit_events`;
}

export type SeedEvent = Partial<Prisma.AuditEventCreateManyInput> & { createdAt: Date };

/**
 * Inserts events directly with explicit timestamps, which the API never allows, so time-based
 * behaviour can be tested deterministically.
 */
export async function insertAuditEvents(app: INestApplication, events: SeedEvent[]): Promise<void> {
  await app.get(PrismaService).auditEvent.createMany({
    data: events.map((event) => ({
      eventType: 'USER',
      action: 'USER_UPDATED',
      resourceType: 'USER',
      description: 'Seeded event',
      source: 'test-suite',
      ...event,
    })),
  });
}

export function hoursAgo(hours: number, from = new Date()): Date {
  return new Date(from.getTime() - hours * 60 * 60 * 1000);
}
