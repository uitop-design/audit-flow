import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service.js';
import { clearAuditEvents, eventPayload } from '../support/audit-events.js';
import { createTestApp } from '../support/create-test-app.js';

describe('audit event immutability', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let event: { id: string; description: string };
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await clearAuditEvents(app);
    event = (await http().post('/api/v1/audit-events').send(eventPayload()).expect(201)).body;
  });

  afterAll(async () => {
    await app.close();
  });

  async function expectUnchanged(): Promise<void> {
    const response = await http().get(`/api/v1/audit-events/${event.id}`).expect(200);
    expect(response.body).toEqual(event);
  }

  describe('over HTTP', () => {
    it.each(['put', 'patch', 'delete'] as const)('has no %s route for an event', async (method) => {
      await http()
        [method](`/api/v1/audit-events/${event.id}`)
        .send({ description: 'tampered' })
        .expect(404);

      await expectUnchanged();
    });

    it.each(['put', 'patch', 'delete'] as const)(
      'has no %s route for the collection',
      async (method) => {
        await http()[method]('/api/v1/audit-events').send({ description: 'tampered' }).expect(404);

        await expectUnchanged();
      },
    );
  });

  describe('in the database', () => {
    it('rejects UPDATE, even through the ORM', async () => {
      await expect(
        prisma.auditEvent.update({ where: { id: event.id }, data: { description: 'tampered' } }),
      ).rejects.toThrow(/append-only: UPDATE is not allowed/);

      await expectUnchanged();
    });

    it('rejects DELETE, even through the ORM', async () => {
      await expect(prisma.auditEvent.delete({ where: { id: event.id } })).rejects.toThrow(
        /append-only: DELETE is not allowed/,
      );

      await expectUnchanged();
    });

    it('rejects bulk raw SQL updates and deletes', async () => {
      await expect(
        prisma.$executeRaw`UPDATE audit_events SET description = 'tampered'`,
      ).rejects.toThrow(/append-only/);
      await expect(prisma.$executeRaw`DELETE FROM audit_events`).rejects.toThrow(/append-only/);

      await expectUnchanged();
    });

    it('rejects JSON columns that are not objects', async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO audit_events (event_type, action, resource_type, description, source, metadata)
          VALUES ('USER', 'USER_UPDATED', 'USER', 'x', 'test', '[1, 2]'::jsonb)`,
      ).rejects.toThrow(/audit_events_metadata_is_object/);
    });
  });
});
