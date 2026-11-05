import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { clearAuditEvents, eventPayload } from '../support/audit-events.js';
import { createTestApp } from '../support/create-test-app.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('POST /api/v1/audit-events', () => {
  let app: NestExpressApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await clearAuditEvents(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('records the event and returns it with server-assigned id and timestamp', async () => {
    const before = Date.now();
    const response = await http().post('/api/v1/audit-events').send(eventPayload()).expect(201);
    const after = Date.now();

    const { id, createdAt, ...rest } = response.body;
    expect(id).toMatch(UUID);
    expect(Date.parse(createdAt)).toBeGreaterThanOrEqual(before - 1000);
    expect(Date.parse(createdAt)).toBeLessThanOrEqual(after + 1000);
    expect(rest).toEqual(eventPayload());
    expect(response.headers.location).toBe(`/api/v1/audit-events/${id}`);
  });

  it('persists exactly what it returned', async () => {
    const created = await http().post('/api/v1/audit-events').send(eventPayload()).expect(201);

    const { location } = created.headers;
    if (!location) {
      throw new Error('Expected a Location header');
    }
    const fetched = await http().get(location).expect(200);

    expect(fetched.body).toEqual(created.body);
  });

  it('applies defaults for omitted optional fields', async () => {
    const response = await http()
      .post('/api/v1/audit-events')
      .send({
        eventType: 'SYSTEM',
        action: 'CLEANUP_COMPLETED',
        resourceType: 'JOB',
        description: 'Nightly cleanup finished',
        source: 'scheduler',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      resourceId: null,
      actorId: null,
      actorEmail: null,
      actorName: null,
      metadata: {},
      before: null,
      after: null,
      ipAddress: null,
      userAgent: null,
      correlationId: null,
    });
  });

  it('stores explicit null snapshots as null and trims strings', async () => {
    const response = await http()
      .post('/api/v1/audit-events')
      .send(eventPayload({ before: null, description: '  Signed in  ', metadata: null }))
      .expect(201);

    expect(response.body).toMatchObject({ before: null, metadata: {}, description: 'Signed in' });
  });

  it('round-trips nested JSON and unicode without loss', async () => {
    const metadata = {
      tags: ['ü', '日本', '🚀'],
      nested: { depth: { value: 1.5, ok: true, none: null } },
    };

    const response = await http()
      .post('/api/v1/audit-events')
      .send(eventPayload({ metadata }))
      .expect(201);

    expect(response.body.metadata).toEqual(metadata);
  });

  it('accepts IPv6 addresses', async () => {
    const response = await http()
      .post('/api/v1/audit-events')
      .send(eventPayload({ ipAddress: '2001:db8::1' }))
      .expect(201);

    expect(response.body.ipAddress).toBe('2001:db8::1');
  });

  it('ignores nothing silently: client-supplied id and createdAt are rejected', async () => {
    const response = await http()
      .post('/api/v1/audit-events')
      .send(
        eventPayload({
          id: '00000000-0000-7000-8000-000000000000',
          createdAt: '2000-01-01T00:00:00.000Z',
        }),
      )
      .expect(400);

    expect(response.body.details).toEqual([
      { field: 'id', message: 'property id should not exist' },
      { field: 'createdAt', message: 'property createdAt should not exist' },
    ]);
    const list = await http().get('/api/v1/audit-events').expect(200);
    expect(list.body.meta.total).toBe(0);
  });

  it('reports every invalid field in one response', async () => {
    const response = await http()
      .post('/api/v1/audit-events')
      .send({ eventType: 'user', actorEmail: 'nope', metadata: [], source: 'example-app' })
      .expect(400);

    expect(response.body).toMatchObject({ statusCode: 400, message: 'Request validation failed' });
    expect(response.body.details.map((issue: { field: string }) => issue.field)).toEqual([
      'eventType',
      'action',
      'resourceType',
      'actorEmail',
      'description',
      'metadata',
    ]);
  });

  it('rejects a body that is not a JSON object', async () => {
    await http().post('/api/v1/audit-events').send([eventPayload()]).expect(400);
  });

  it('rejects oversized JSON fields', async () => {
    const response = await http()
      .post('/api/v1/audit-events')
      .send(eventPayload({ metadata: { blob: 'x'.repeat(17_000) } }))
      .expect(400);

    expect(response.body.details).toEqual([
      {
        field: 'metadata',
        message: 'metadata must not exceed 16384 bytes when serialized as JSON',
      },
    ]);
  });
});
