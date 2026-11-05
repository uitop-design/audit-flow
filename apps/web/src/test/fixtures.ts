import type {
  AuditEvent,
  AuditEventFacets,
  AuditEventList,
  AuditEventStats,
  HealthReport,
} from '@/lib/api/types';

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

export function buildAuditEventList(
  events: AuditEvent[],
  meta: Partial<AuditEventList['meta']> = {},
): AuditEventList {
  const limit = meta.limit ?? 20;
  const total = meta.total ?? events.length;
  return {
    data: events,
    meta: { page: 1, limit, total, totalPages: Math.ceil(total / limit), ...meta },
  };
}

export function buildFacets(overrides: Partial<AuditEventFacets> = {}): AuditEventFacets {
  return {
    eventTypes: ['AUTH', 'PROJECT', 'USER'],
    actions: ['PROJECT_CREATED', 'USER_SIGNED_IN', 'USER_UPDATED'],
    resourceTypes: ['PROJECT', 'SESSION', 'USER'],
    sources: ['admin-dashboard', 'web-app'],
    ...overrides,
  };
}

export function buildStats(overrides: Partial<AuditEventStats> = {}): AuditEventStats {
  return {
    totalEvents: 180,
    eventsLast24h: 27,
    uniqueActors: 10,
    topEventType: { eventType: 'AUTH', count: 70 },
    byEventType: [
      { eventType: 'AUTH', count: 70 },
      { eventType: 'API_KEY', count: 32 },
      { eventType: 'PROJECT', count: 78 },
    ],
    dailyVolume: Array.from({ length: 14 }, (_, index) => ({
      date: `2026-11-${String(index + 1).padStart(2, '0')}`,
      count: index === 13 ? 22 : index,
    })),
    recentEvents: [
      buildAuditEvent({ id: 'evt-1', description: 'Signed in with SSO', eventType: 'AUTH' }),
      buildAuditEvent({
        id: 'evt-2',
        actorId: null,
        actorEmail: null,
        actorName: null,
        description: 'Removed expired sessions',
        eventType: 'SYSTEM',
      }),
    ],
    generatedAt: '2026-11-05T12:00:00.000Z',
    ...overrides,
  };
}
