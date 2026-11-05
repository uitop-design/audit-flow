import { type AuditEvent as AuditEventRecord, Prisma } from '../../../generated/prisma/client.js';
import type { NewAuditEvent } from '../domain/audit-event.js';
import { toAuditEvent, toCreateInput } from './audit-event.mapper.js';

const newEvent: NewAuditEvent = {
  eventType: 'AUTH',
  action: 'USER_SIGNED_IN',
  resourceType: 'SESSION',
  resourceId: null,
  actorId: 'usr_1',
  actorEmail: null,
  actorName: null,
  description: 'Signed in',
  metadata: {},
  before: null,
  after: { mfa: true },
  ipAddress: null,
  userAgent: null,
  correlationId: null,
  source: 'web-app',
};

function record(overrides: Partial<AuditEventRecord> = {}): AuditEventRecord {
  return {
    ...newEvent,
    id: '019a5a3c-7e2b-7c41-9f0e-3b8d2a6c1f44',
    createdAt: new Date('2026-11-05T12:00:00.000Z'),
    ...overrides,
  };
}

describe('toCreateInput', () => {
  it('stores a missing snapshot as SQL NULL, not JSON null', () => {
    const input = toCreateInput(newEvent);

    expect(input.before).toBe(Prisma.DbNull);
    expect(input.after).toEqual({ mfa: true });
  });

  it('never sets id or createdAt', () => {
    const input = toCreateInput(newEvent);

    expect(input).not.toHaveProperty('id');
    expect(input).not.toHaveProperty('createdAt');
  });
});

describe('toAuditEvent', () => {
  it('returns a frozen domain event', () => {
    const event = toAuditEvent(record());

    expect(event).toMatchObject({ id: record().id, before: null, after: { mfa: true } });
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.after)).toBe(true);
  });

  it('refuses rows whose JSON columns are not objects', () => {
    expect(() => toAuditEvent(record({ metadata: [1, 2] }))).toThrow(
      'audit_events.metadata is not a JSON object',
    );
  });
});
