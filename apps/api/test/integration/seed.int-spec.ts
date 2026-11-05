import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service.js';
import { generateSeedEvents } from '../../src/seed/generate-seed-events.js';
import { reseedAuditEvents } from '../../src/seed/reseed-audit-events.js';
import { eventPayload } from '../support/audit-events.js';
import { createTestApp } from '../support/create-test-app.js';

describe('demo data seeding', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  const events = generateSeedEvents({ now: new Date() });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('replaces existing events and is idempotent', async () => {
    await http()
      .post('/api/v1/audit-events')
      .send(eventPayload({ action: 'PRE_EXISTING' }))
      .expect(201);

    expect(await reseedAuditEvents(prisma, events)).toBe(events.length);
    expect(await reseedAuditEvents(prisma, events)).toBe(events.length);

    expect(await prisma.auditEvent.count()).toBe(events.length);
    expect(await prisma.auditEvent.count({ where: { action: 'PRE_EXISTING' } })).toBe(0);
  });

  it('assigns UUIDv7 ids whose embedded time matches createdAt', async () => {
    await reseedAuditEvents(prisma, events);

    const [{ mismatched }] = await prisma.$queryRaw<[{ mismatched: number }]>`
      SELECT count(*)::int AS mismatched
      FROM audit_events
      WHERE uuid_extract_timestamp(id) <> created_at`;
    expect(mismatched).toBe(0);
  });

  it('is visible through the API: list, filters, stats and facets', async () => {
    await reseedAuditEvents(prisma, events);

    const list = await http().get('/api/v1/audit-events').query({ limit: 20 }).expect(200);
    expect(list.body.meta).toEqual({
      page: 1,
      limit: 20,
      total: events.length,
      totalPages: Math.ceil(events.length / 20),
    });

    const authCount = events.filter((event) => event.eventType === 'AUTH').length;
    const auth = await http().get('/api/v1/audit-events').query({ eventType: 'AUTH' }).expect(200);
    expect(auth.body.meta.total).toBe(authCount);

    const stats = await http().get('/api/v1/audit-events/stats').expect(200);
    expect(stats.body.totalEvents).toBe(events.length);
    expect(stats.body.eventsLast24h).toBeGreaterThan(0);
    expect(stats.body.recentEvents).toHaveLength(5);

    const facets = await http().get('/api/v1/audit-events/facets').expect(200);
    expect(facets.body.eventTypes).toEqual(
      [...new Set(events.map((event) => event.eventType))].sort(),
    );
  });

  it('returns the newest seeded event first, matching the generator', async () => {
    await reseedAuditEvents(prisma, events);
    const newest = events.at(-1);

    const list = await http().get('/api/v1/audit-events').query({ limit: 1 }).expect(200);

    expect(list.body.data[0]).toMatchObject({
      action: newest?.action,
      description: newest?.description,
      createdAt: newest?.createdAt.toISOString(),
    });
  });
});
