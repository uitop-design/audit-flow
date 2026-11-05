import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  hasNarrowingFilters,
  parseAuditEventFilters,
  serializeAuditEventFilters,
  toListParams,
} from './filters';

const parse = (query: string) => parseAuditEventFilters(new URLSearchParams(query));

describe('parseAuditEventFilters', () => {
  it('applies defaults to an empty URL', () => {
    expect(parse('')).toEqual({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('reads every supported parameter', () => {
    expect(
      parse(
        'page=3&limit=50&search=alice&eventType=AUTH&action=USER_SIGNED_IN&resourceType=SESSION&resourceId=ses_1&actorId=usr_1&source=web-app&correlationId=req_1&from=2026-11-01&to=2026-11-05&sortBy=actorEmail&sortOrder=asc',
      ),
    ).toEqual({
      page: 3,
      limit: 50,
      search: 'alice',
      eventType: 'AUTH',
      action: 'USER_SIGNED_IN',
      resourceType: 'SESSION',
      resourceId: 'ses_1',
      actorId: 'usr_1',
      source: 'web-app',
      correlationId: 'req_1',
      from: '2026-11-01',
      to: '2026-11-05',
      sortBy: 'actorEmail',
      sortOrder: 'asc',
    });
  });

  it.each([
    ['page=0', { page: 1 }],
    ['page=abc', { page: 1 }],
    ['limit=33', { limit: 20 }],
    ['sortBy=ipAddress', { sortBy: 'createdAt' }],
    ['sortOrder=sideways', { sortOrder: 'desc' }],
    ['from=yesterday', { from: undefined }],
    ['eventType=', { eventType: undefined }],
    ['search=%20%20', { search: undefined }],
  ])('drops the invalid value in %s', (query, expected) => {
    expect(parse(query)).toMatchObject(expected);
  });

  it('drops the end of a reversed date range', () => {
    expect(parse('from=2026-11-05&to=2026-11-01')).toMatchObject({
      from: '2026-11-05',
      to: undefined,
    });
  });

  it('ignores unknown parameters', () => {
    expect(parse('foo=bar')).toEqual(DEFAULT_FILTERS);
  });
});

describe('serializeAuditEventFilters', () => {
  it('omits defaults and empty values', () => {
    expect(serializeAuditEventFilters(DEFAULT_FILTERS).toString()).toBe('');
    expect(
      serializeAuditEventFilters({
        ...DEFAULT_FILTERS,
        page: 2,
        eventType: 'AUTH',
        search: undefined,
      }).toString(),
    ).toBe('page=2&eventType=AUTH');
  });

  it('round-trips through the URL', () => {
    const filters = parse(
      'page=2&limit=50&search=a%26b&from=2026-11-01&sortBy=source&sortOrder=asc',
    );
    expect(parseAuditEventFilters(serializeAuditEventFilters(filters))).toEqual(filters);
  });
});

describe('toListParams', () => {
  it('turns the inclusive day range into a half-open instant range (TZ=UTC)', () => {
    expect(toListParams(parse('from=2026-11-01&to=2026-11-05'))).toMatchObject({
      dateFrom: '2026-11-01T00:00:00.000Z',
      dateTo: '2026-11-06T00:00:00.000Z',
    });
  });

  it('handles month ends and open-ended ranges', () => {
    expect(toListParams(parse('to=2026-10-31'))).toMatchObject({
      dateFrom: undefined,
      dateTo: '2026-11-01T00:00:00.000Z',
    });
  });

  it('passes paging, sorting and filters through', () => {
    expect(toListParams(parse('page=2&eventType=AUTH&sortBy=action&sortOrder=asc'))).toMatchObject({
      page: 2,
      limit: 20,
      eventType: 'AUTH',
      sortBy: 'action',
      sortOrder: 'asc',
    });
  });
});

describe('hasNarrowingFilters', () => {
  it('ignores paging and sorting', () => {
    expect(hasNarrowingFilters(parse('page=3&limit=50&sortBy=source'))).toBe(false);
    expect(hasNarrowingFilters(parse('from=2026-11-01'))).toBe(true);
  });
});
