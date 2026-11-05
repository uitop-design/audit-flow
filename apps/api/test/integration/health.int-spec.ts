import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from '../support/create-test-app.js';

describe('GET /api/v1/health', () => {
  describe('when the database is reachable', () => {
    let app: NestExpressApplication;

    beforeAll(async () => {
      app = await createTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('reports ok with database latency', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        checks: { database: { status: 'up', latencyMs: expect.any(Number) } },
        uptimeSeconds: expect.any(Number),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
      });
    });

    it('is never cached', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/health');

      expect(response.headers['cache-control']).toBe('no-store');
    });
  });

  describe('when the database is unreachable', () => {
    let app: NestExpressApplication;

    beforeAll(async () => {
      // Port 1 refuses connections immediately; the app must still start and report the outage.
      app = await createTestApp({
        env: { DATABASE_URL: 'postgresql://auditflow:secret-password@127.0.0.1:1/auditflow_test' },
      });
    });

    afterAll(async () => {
      await app.close();
    });

    it('responds 503 without leaking connection details', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/health').expect(503);

      expect(response.body).toMatchObject({
        status: 'error',
        checks: { database: { status: 'down' } },
      });
      expect(JSON.stringify(response.body)).not.toMatch(
        /127\.0\.0\.1|secret-password|ECONNREFUSED/,
      );
    });
  });
});
