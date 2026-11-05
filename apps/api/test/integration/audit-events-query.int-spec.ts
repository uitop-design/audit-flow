import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { clearAuditEvents, insertAuditEvents, type SeedEvent } from '../support/audit-events.js';
import { createTestApp } from '../support/create-test-app.js';

const BASE = new Date('2026-11-01T12:00:00.000Z');
const at = (minutes: number) => new Date(BASE.getTime() + minutes * 60_000);

/** A small, hand-checked dataset; each test reads it through the public API. */
const FIXTURES: SeedEvent[] = [
  {
    createdAt: at(0),
    eventType: 'AUTH',
    action: 'USER_SIGNED_IN',
    resourceType: 'SESSION',
    actorId: 'usr_alice',
    actorEmail: 'alice@example.com',
    actorName: 'Alice Martin',
    description: 'Signed in with password',
    source: 'web-app',
    correlationId: 'req_1',
  },
  {
    createdAt: at(10),
    eventType: 'PROJECT',
    action: 'PROJECT_CREATED',
    resourceType: 'PROJECT',
    resourceId: 'prj_apollo',
    actorId: 'usr_alice',
    actorEmail: 'alice@example.com',
    description: 'Created project Apollo',
    source: 'web-app',
    correlationId: 'req_2',
  },
  {
    createdAt: at(20),
    eventType: 'PROJECT',
    action: 'PROJECT_DELETED',
    resourceType: 'PROJECT',
    resourceId: 'prj_legacy',
    actorId: 'usr_bob',
    actorEmail: 'bob@example.com',
    description: 'Deleted project Legacy (50% migrated)',
    source: 'admin-dashboard',
    correlationId: 'req_2',
  },
  {
    createdAt: at(30),
    eventType: 'PERMISSION',
    action: 'ROLE_CHANGED',
    resourceType: 'USER',
    resourceId: 'usr_carol',
    actorId: 'usr_bob',
    actorEmail: 'bob@example.com',
    description: 'Changed role of carol_admin to ADMIN',
    source: 'admin-dashboard',
  },
  {
    createdAt: at(40),
    eventType: 'API_KEY',
    action: 'API_KEY_REVOKED',
    resourceType: 'API_KEY',
    resourceId: 'key_9',
    description: 'Revoked unused key',
    source: 'scheduler',
  },
];

describe('GET /api/v1/audit-events', () => {
  let app: NestExpressApplication;
  const http = () => request(app.getHttpServer());
  const list = async (query: Record<string, string | number>) =>
    (await http().get('/api/v1/audit-events').query(query).expect(200)).body as {
      data: Array<{ action: string; actorEmail: string | null; eventType: string; id: string }>;
      meta: { page: number; limit: number; total: number; totalPages: number };
    };
  const actions = async (query: Record<string, string | number>) =>
    (await list(query)).data.map((event) => event.action);

  beforeAll(async () => {
    app = await createTestApp();
    await clearAuditEvents(app);
    await insertAuditEvents(app, FIXTURES);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('defaults', () => {
    it('returns newest first with pagination meta', async () => {
      const body = await list({});

      expect(body.data.map((event) => event.action)).toEqual([
        'API_KEY_REVOKED',
        'ROLE_CHANGED',
        'PROJECT_DELETED',
        'PROJECT_CREATED',
        'USER_SIGNED_IN',
      ]);
      expect(body.meta).toEqual({ page: 1, limit: 20, total: 5, totalPages: 1 });
    });
  });

  describe('filters', () => {
    it.each([
      [{ eventType: 'PROJECT' }, ['PROJECT_DELETED', 'PROJECT_CREATED']],
      [{ action: 'ROLE_CHANGED' }, ['ROLE_CHANGED']],
      [{ resourceType: 'PROJECT', resourceId: 'prj_apollo' }, ['PROJECT_CREATED']],
      [{ actorId: 'usr_bob' }, ['ROLE_CHANGED', 'PROJECT_DELETED']],
      [{ source: 'scheduler' }, ['API_KEY_REVOKED']],
      [{ correlationId: 'req_2' }, ['PROJECT_DELETED', 'PROJECT_CREATED']],
      [{ eventType: 'PROJECT', actorId: 'usr_alice' }, ['PROJECT_CREATED']],
      [{ eventType: 'BILLING' }, []],
    ])('%j', async (query, expected) => {
      expect(await actions(query)).toEqual(expected);
    });

    it('matches exact values only, case-sensitively', async () => {
      expect(await actions({ eventType: 'project' })).toEqual([]);
      expect(await actions({ actorId: 'usr_ali' })).toEqual([]);
    });
  });

  describe('date window', () => {
    it('includes dateFrom and excludes dateTo', async () => {
      expect(
        await actions({ dateFrom: at(10).toISOString(), dateTo: at(30).toISOString() }),
      ).toEqual(['PROJECT_DELETED', 'PROJECT_CREATED']);
    });

    it('supports open-ended ranges', async () => {
      expect(await actions({ dateFrom: at(30).toISOString() })).toEqual([
        'API_KEY_REVOKED',
        'ROLE_CHANGED',
      ]);
      expect(await actions({ dateTo: at(10).toISOString() })).toEqual(['USER_SIGNED_IN']);
    });

    it('interprets time zone offsets', async () => {
      // 14:20+02:00 == 12:20Z, so only events strictly before minute 20 match.
      expect(await actions({ dateTo: '2026-11-01T14:20:00+02:00' })).toEqual([
        'PROJECT_CREATED',
        'USER_SIGNED_IN',
      ]);
    });
  });

  describe('search', () => {
    it.each([
      ['alice', ['PROJECT_CREATED', 'USER_SIGNED_IN']],
      ['ALICE', ['PROJECT_CREATED', 'USER_SIGNED_IN']],
      ['apollo', ['PROJECT_CREATED']],
      ['Martin', ['USER_SIGNED_IN']],
      ['prj_legacy', ['PROJECT_DELETED']],
      ['ROLE_CH', ['ROLE_CHANGED']],
      ['req_1', ['USER_SIGNED_IN']],
      ['nothing-matches-this', []],
    ])('finds %p', async (search, expected) => {
      expect(await actions({ search })).toEqual(expected);
    });

    it('treats % and _ literally rather than as wildcards', async () => {
      expect(await actions({ search: '50%' })).toEqual(['PROJECT_DELETED']);
      expect(await actions({ search: '%' })).toEqual(['PROJECT_DELETED']);
      expect(await actions({ search: 'carol_' })).toEqual(['ROLE_CHANGED']);
      expect(await actions({ search: '_' })).toEqual(
        // Only values that really contain an underscore.
        ['API_KEY_REVOKED', 'ROLE_CHANGED', 'PROJECT_DELETED', 'PROJECT_CREATED', 'USER_SIGNED_IN'],
      );
    });

    it('combines with other filters', async () => {
      expect(await actions({ search: 'project', actorId: 'usr_bob' })).toEqual(['PROJECT_DELETED']);
    });
  });

  describe('pagination', () => {
    it('slices pages and reports totals', async () => {
      const first = await list({ limit: 2, page: 1 });
      const second = await list({ limit: 2, page: 2 });
      const third = await list({ limit: 2, page: 3 });

      expect(first.meta).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });
      expect(third.data).toHaveLength(1);
      const ids = [...first.data, ...second.data, ...third.data].map((event) => event.id);
      expect(new Set(ids).size).toBe(5);
    });

    it('returns an empty page past the end, with accurate meta', async () => {
      expect(await list({ page: 99 })).toEqual({
        data: [],
        meta: { page: 99, limit: 20, total: 5, totalPages: 1 },
      });
    });

    it('counts the filtered total, not the table', async () => {
      expect((await list({ eventType: 'PROJECT', limit: 1 })).meta).toEqual({
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
      });
    });

    it('rejects limits above 100', async () => {
      await http().get('/api/v1/audit-events').query({ limit: 101 }).expect(400);
    });
  });

  describe('sorting', () => {
    it('sorts ascending by createdAt', async () => {
      expect(await actions({ sortBy: 'createdAt', sortOrder: 'asc' })).toEqual([
        'USER_SIGNED_IN',
        'PROJECT_CREATED',
        'PROJECT_DELETED',
        'ROLE_CHANGED',
        'API_KEY_REVOKED',
      ]);
    });

    it('sorts by event type, newest first within a type', async () => {
      const body = await list({ sortBy: 'eventType', sortOrder: 'asc' });

      expect(body.data.map((event) => `${event.eventType}:${event.action}`)).toEqual([
        'API_KEY:API_KEY_REVOKED',
        'AUTH:USER_SIGNED_IN',
        'PERMISSION:ROLE_CHANGED',
        'PROJECT:PROJECT_DELETED',
        'PROJECT:PROJECT_CREATED',
      ]);
    });

    it('keeps events without an actor email last in both directions', async () => {
      const ascending = await list({ sortBy: 'actorEmail', sortOrder: 'asc' });
      const descending = await list({ sortBy: 'actorEmail', sortOrder: 'desc' });

      expect(ascending.data.map((event) => event.actorEmail)).toEqual([
        'alice@example.com',
        'alice@example.com',
        'bob@example.com',
        'bob@example.com',
        null,
      ]);
      expect(descending.data.at(-1)?.actorEmail).toBeNull();
    });

    it('rejects fields outside the whitelist without touching the database', async () => {
      const response = await http()
        .get('/api/v1/audit-events')
        .query({ sortBy: 'description; DROP TABLE audit_events' })
        .expect(400);

      expect(response.body.details[0].field).toBe('sortBy');
      expect((await list({})).meta.total).toBe(5);
    });
  });

  describe('invalid queries', () => {
    it.each([
      [{ unknownParam: 'x' }, 'unknownParam'],
      [{ dateFrom: '2026-11-01' }, 'dateFrom'],
      [{ dateFrom: at(30).toISOString(), dateTo: at(10).toISOString() }, 'dateTo'],
      [{ sortOrder: 'sideways' }, 'sortOrder'],
      [{ page: 0 }, 'page'],
    ])('rejects %j', async (query, field) => {
      const response = await http().get('/api/v1/audit-events').query(query).expect(400);

      expect(response.body.details.map((issue: { field: string }) => issue.field)).toContain(field);
    });

    it('rejects repeated parameters', async () => {
      await http().get('/api/v1/audit-events?eventType=AUTH&eventType=USER').expect(400);
    });
  });
});

describe('GET /api/v1/audit-events/:id', () => {
  let app: NestExpressApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    await clearAuditEvents(app);
    await insertAuditEvents(app, FIXTURES);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the full event', async () => {
    const [first] = (await http().get('/api/v1/audit-events').query({ limit: 1 })).body.data;

    const response = await http().get(`/api/v1/audit-events/${first.id}`).expect(200);

    expect(response.body).toEqual(first);
  });

  it('returns 404 for an unknown id', async () => {
    const id = '019a0000-0000-7000-8000-000000000000';

    const response = await http().get(`/api/v1/audit-events/${id}`).expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: `Audit event ${id} not found`,
    });
  });

  it('returns 400 for a malformed id', async () => {
    const response = await http().get('/api/v1/audit-events/not-a-uuid').expect(400);

    expect(response.body.message).toBe('Validation failed (uuid is expected)');
  });
});
