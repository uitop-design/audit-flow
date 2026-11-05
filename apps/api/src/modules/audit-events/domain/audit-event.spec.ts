import { type AuditEvent, sealAuditEvent } from './audit-event.js';
import { pageOffset, toPage } from './audit-event-query.js';

function recordedEvent(): AuditEvent {
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
    metadata: { request: { path: '/users/123', tags: ['admin'] } },
    before: { role: 'USER' },
    after: { role: 'ADMIN' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    correlationId: 'req_abc123',
    source: 'example-app',
    createdAt: new Date('2026-11-05T12:00:00.000Z'),
  };
}

describe('sealAuditEvent', () => {
  it('makes the event and every nested JSON value immutable', () => {
    const event = sealAuditEvent(recordedEvent()) as unknown as {
      description: string;
      metadata: { request: { tags: string[] } };
      after: Record<string, unknown>;
    };

    expect(() => {
      event.description = 'tampered';
    }).toThrow(TypeError);
    expect(() => {
      event.metadata.request.tags.push('root');
    }).toThrow(TypeError);
    expect(() => {
      event.after.role = 'OWNER';
    }).toThrow(TypeError);
    expect(event.description).toBe('Updated user permissions');
  });
});

describe('pagination helpers', () => {
  it('computes the row offset for a page', () => {
    expect(pageOffset({ page: 1, limit: 20 })).toBe(0);
    expect(pageOffset({ page: 3, limit: 20 })).toBe(40);
  });

  it('rounds totalPages up and reports 0 pages for no results', () => {
    expect(toPage([], 150, { page: 1, limit: 20 }).totalPages).toBe(8);
    expect(toPage([], 160, { page: 1, limit: 20 }).totalPages).toBe(8);
    expect(toPage([], 0, { page: 1, limit: 20 }).totalPages).toBe(0);
  });
});
