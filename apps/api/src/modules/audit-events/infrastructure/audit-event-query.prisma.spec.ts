import { AUDIT_EVENT_SORT_FIELDS } from '../domain/audit-event-query.js';
import { buildOrderBy, buildWhere, escapeLikePattern } from './audit-event-query.prisma.js';

describe('buildOrderBy', () => {
  it('sorts by createdAt with id as a same-direction tie-breaker', () => {
    expect(buildOrderBy('createdAt', 'asc')).toEqual([{ createdAt: 'asc' }, { id: 'asc' }]);
    expect(buildOrderBy('createdAt', 'desc')).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
  });

  it('falls back to newest first, then id, for other fields', () => {
    expect(buildOrderBy('eventType', 'asc')).toEqual([
      { eventType: 'asc' },
      { createdAt: 'desc' },
      { id: 'desc' },
    ]);
  });

  it('keeps null actor emails last in both directions', () => {
    expect(buildOrderBy('actorEmail', 'asc')[0]).toEqual({
      actorEmail: { sort: 'asc', nulls: 'last' },
    });
    expect(buildOrderBy('actorEmail', 'desc')[0]).toEqual({
      actorEmail: { sort: 'desc', nulls: 'last' },
    });
  });

  it.each(AUDIT_EVENT_SORT_FIELDS)('orders by the %s column itself', (field) => {
    const [primary] = buildOrderBy(field, 'asc');
    expect(Object.keys(primary ?? {})).toEqual([field]);
  });
});

describe('buildWhere', () => {
  it('produces no constraints for an empty filter', () => {
    const where = buildWhere({});

    expect(where).toEqual({ AND: [expect.any(Object)] });
    expect(Object.values(where.AND as object[])[0]).toEqual({
      eventType: undefined,
      action: undefined,
      resourceType: undefined,
      resourceId: undefined,
      actorId: undefined,
      source: undefined,
      correlationId: undefined,
    });
  });

  it('uses a half-open createdAt window', () => {
    const createdFrom = new Date('2026-11-01T00:00:00Z');
    const createdBefore = new Date('2026-11-02T00:00:00Z');

    expect(buildWhere({ createdFrom, createdBefore }).AND).toContainEqual({
      createdAt: { gte: createdFrom, lt: createdBefore },
    });
  });

  it('searches the descriptive text fields case-insensitively', () => {
    const where = buildWhere({ search: 'alice' });
    const searchCondition = (where.AND as Array<{ OR?: Array<Record<string, unknown>> }>).find(
      (condition) => condition.OR,
    );

    expect(searchCondition?.OR?.map((clause) => Object.keys(clause)[0])).toEqual([
      'description',
      'actorEmail',
      'actorName',
      'actorId',
      'resourceId',
      'action',
      'correlationId',
    ]);
    expect(searchCondition?.OR?.[0]).toEqual({
      description: { contains: 'alice', mode: 'insensitive' },
    });
  });
});

describe('escapeLikePattern', () => {
  it.each([
    ['plain text', 'plain text'],
    ['50%', '50\\%'],
    ['carol_admin', 'carol\\_admin'],
    ['C:\\path', 'C:\\\\path'],
    ['%_\\', '\\%\\_\\\\'],
  ])('escapes %p as %p', (input, expected) => {
    expect(escapeLikePattern(input)).toBe(expected);
  });

  it('is applied to search terms', () => {
    const where = buildWhere({ search: '100%' });
    const searchCondition = (where.AND as Array<{ OR?: Array<Record<string, unknown>> }>).find(
      (condition) => condition.OR,
    );

    expect(searchCondition?.OR?.[0]).toEqual({
      description: { contains: '100\\%', mode: 'insensitive' },
    });
  });
});
