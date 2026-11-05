import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { clearAuditEvents, hoursAgo, insertAuditEvents } from '../support/audit-events.js';
import { createTestApp } from '../support/create-test-app.js';

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

describe('audit event aggregates', () => {
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

  describe('GET /api/v1/audit-events/stats', () => {
    it('describes an empty database without inventing data', async () => {
      const response = await http().get('/api/v1/audit-events/stats').expect(200);

      expect(response.body).toMatchObject({
        totalEvents: 0,
        eventsLast24h: 0,
        uniqueActors: 0,
        topEventType: null,
        byEventType: [],
        recentEvents: [],
      });
      expect(response.body.dailyVolume).toHaveLength(14);
      expect(response.body.dailyVolume.every((day: { count: number }) => day.count === 0)).toBe(
        true,
      );
    });

    it('aggregates counts, actors, distribution and daily volume', async () => {
      const now = new Date();
      await insertAuditEvents(app, [
        { createdAt: hoursAgo(1, now), eventType: 'AUTH', actorId: 'usr_a' },
        { createdAt: hoursAgo(2, now), eventType: 'AUTH', actorId: 'usr_a' },
        { createdAt: hoursAgo(3, now), eventType: 'AUTH', actorId: 'usr_b' },
        { createdAt: hoursAgo(30, now), eventType: 'PROJECT', actorId: 'usr_c' },
        { createdAt: hoursAgo(50, now), eventType: 'PROJECT', actorId: null },
        // Outside the 14-day chart window, but still part of the totals.
        { createdAt: hoursAgo(24 * 20, now), eventType: 'BILLING', actorId: 'usr_d' },
      ]);

      const { body } = await http().get('/api/v1/audit-events/stats').expect(200);

      expect(body).toMatchObject({
        totalEvents: 6,
        eventsLast24h: 3,
        uniqueActors: 4,
        topEventType: { eventType: 'AUTH', count: 3 },
        byEventType: [
          { eventType: 'AUTH', count: 3 },
          { eventType: 'PROJECT', count: 2 },
          { eventType: 'BILLING', count: 1 },
        ],
      });

      const days: Array<{ date: string; count: number }> = body.dailyVolume;
      expect(days).toHaveLength(14);
      expect(days.at(-1)?.date).toBe(utcDay(now));
      expect(days.map((day) => day.date)).toEqual([...days.map((day) => day.date)].sort());
      expect(days.reduce((sum, day) => sum + day.count, 0)).toBe(5);
    });

    it('returns the five most recent events, newest first', async () => {
      await insertAuditEvents(
        app,
        Array.from({ length: 7 }, (_, index) => ({
          createdAt: hoursAgo(index + 1),
          action: `ACTION_${index}`,
        })),
      );

      const { body } = await http().get('/api/v1/audit-events/stats').expect(200);

      expect(body.recentEvents.map((event: { action: string }) => event.action)).toEqual([
        'ACTION_0',
        'ACTION_1',
        'ACTION_2',
        'ACTION_3',
        'ACTION_4',
      ]);
    });
  });

  describe('GET /api/v1/audit-events/facets', () => {
    it('returns empty lists for an empty database', async () => {
      const response = await http().get('/api/v1/audit-events/facets').expect(200);

      expect(response.body).toEqual({
        eventTypes: [],
        actions: [],
        resourceTypes: [],
        sources: [],
      });
    });

    it('returns distinct values, sorted', async () => {
      await insertAuditEvents(app, [
        {
          createdAt: hoursAgo(1),
          eventType: 'PROJECT',
          action: 'PROJECT_CREATED',
          resourceType: 'PROJECT',
          source: 'web-app',
        },
        {
          createdAt: hoursAgo(2),
          eventType: 'AUTH',
          action: 'USER_SIGNED_IN',
          resourceType: 'SESSION',
          source: 'web-app',
        },
        {
          createdAt: hoursAgo(3),
          eventType: 'PROJECT',
          action: 'PROJECT_CREATED',
          resourceType: 'PROJECT',
          source: 'admin-dashboard',
        },
      ]);

      const response = await http().get('/api/v1/audit-events/facets').expect(200);

      expect(response.body).toEqual({
        eventTypes: ['AUTH', 'PROJECT'],
        actions: ['PROJECT_CREATED', 'USER_SIGNED_IN'],
        resourceTypes: ['PROJECT', 'SESSION'],
        sources: ['admin-dashboard', 'web-app'],
      });
    });
  });
});
