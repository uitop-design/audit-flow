import type { AuditEvent, HealthReport } from '@/lib/api/types';

/** Typed against the generated API contract, so fixtures break when the contract changes. */
export function buildHealthReport(overrides: Partial<HealthReport> = {}): HealthReport {
  return {
    status: 'ok',
    checks: { database: { status: 'up', latencyMs: 3 } },
    uptimeSeconds: 120,
    timestamp: '2026-11-05T12:00:00.000Z',
    ...overrides,
  };
}

export function buildAuditEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: '019a5a3c-7e2b-7c41-9f0e-3b8d2a6c1f44',
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
    createdAt: '2026-11-05T11:58:00.000Z',
    ...overrides,
  };
}
