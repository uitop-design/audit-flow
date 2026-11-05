import type { ArgumentMetadata } from '@nestjs/common';
import {
  createValidationPipe,
  RequestValidationException,
  type ValidationIssue,
} from '../../../../common/pipes/validation.pipe.js';
import { ListAuditEventsQueryDto } from './list-audit-events-query.dto.js';

const metadata: ArgumentMetadata = { type: 'query', metatype: ListAuditEventsQueryDto };

function parse(query: Record<string, unknown>): Promise<ListAuditEventsQueryDto> {
  return createValidationPipe().transform(query, metadata);
}

async function issuesFor(query: Record<string, unknown>): Promise<ValidationIssue[]> {
  try {
    await parse(query);
  } catch (error) {
    if (error instanceof RequestValidationException) {
      return [...error.issues];
    }
    throw error;
  }
  throw new Error('Expected validation to fail');
}

describe('ListAuditEventsQueryDto', () => {
  it('applies defaults', async () => {
    await expect(parse({})).resolves.toMatchObject({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('converts numeric query strings', async () => {
    await expect(parse({ page: '3', limit: '50' })).resolves.toMatchObject({ page: 3, limit: 50 });
  });

  it.each([
    ['page', '0', 'page must not be less than 1'],
    ['page', '1.5', 'page must be an integer number'],
    ['page', 'abc', 'page must be an integer number'],
    ['limit', '0', 'limit must not be less than 1'],
    ['limit', '101', 'limit must not be greater than 100'],
  ])('rejects %s=%s', async (field, value, message) => {
    expect(await issuesFor({ [field]: value })).toEqual([{ field, message }]);
  });

  it('only allows whitelisted sort fields', async () => {
    const [issue] = await issuesFor({ sortBy: 'ipAddress' });

    expect(issue?.field).toBe('sortBy');
    expect(issue?.message).toMatch(/^sortBy must be one of the following values: createdAt, /);
  });

  it('rejects an unknown sort order', async () => {
    expect((await issuesFor({ sortOrder: 'random' }))[0]?.field).toBe('sortOrder');
  });

  it('rejects unknown parameters instead of ignoring them', async () => {
    expect(await issuesFor({ eventtype: 'USER' })).toEqual([
      { field: 'eventtype', message: 'property eventtype should not exist' },
    ]);
  });

  it('rejects repeated parameters', async () => {
    expect(await issuesFor({ eventType: ['USER', 'AUTH'] })).toEqual([
      { field: 'eventType', message: 'eventType must be a string' },
    ]);
  });

  it('rejects empty filter values', async () => {
    expect(await issuesFor({ eventType: '' })).toEqual([
      { field: 'eventType', message: 'eventType should not be empty' },
    ]);
  });

  it('trims search and rejects a blank one', async () => {
    await expect(parse({ search: '  alice ' })).resolves.toMatchObject({ search: 'alice' });
    expect((await issuesFor({ search: '   ' }))[0]?.field).toBe('search');
  });

  it('requires date-times with a time zone', async () => {
    expect(await issuesFor({ dateFrom: '2026-11-01' })).toEqual([
      {
        field: 'dateFrom',
        message:
          'dateFrom must be an ISO 8601 date-time with a time zone, e.g. 2026-11-05T00:00:00Z',
      },
    ]);
  });

  it('requires dateTo to be later than dateFrom', async () => {
    expect(
      await issuesFor({ dateFrom: '2026-11-02T00:00:00Z', dateTo: '2026-11-01T00:00:00Z' }),
    ).toEqual([{ field: 'dateTo', message: 'dateTo must be later than dateFrom' }]);
    expect(
      await issuesFor({ dateFrom: '2026-11-01T00:00:00Z', dateTo: '2026-11-01T00:00:00Z' }),
    ).toEqual([{ field: 'dateTo', message: 'dateTo must be later than dateFrom' }]);
  });

  it('compares instants across time zones', async () => {
    // 01:00+02:00 is 23:00Z the previous day, i.e. before dateFrom.
    expect(
      await issuesFor({ dateFrom: '2026-11-01T00:00:00Z', dateTo: '2026-11-01T01:00:00+02:00' }),
    ).toEqual([{ field: 'dateTo', message: 'dateTo must be later than dateFrom' }]);
  });
});
