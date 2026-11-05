import { Module } from '@nestjs/common';
import { AuditEventService } from './application/audit-event.service.js';
import { AUDIT_EVENT_REPOSITORY } from './domain/audit-event.repository.js';
import { PrismaAuditEventRepository } from './infrastructure/prisma-audit-event.repository.js';
import { AuditEventsController } from './presentation/audit-events.controller.js';

@Module({
  controllers: [AuditEventsController],
  providers: [
    AuditEventService,
    { provide: AUDIT_EVENT_REPOSITORY, useClass: PrismaAuditEventRepository },
  ],
})
export class AuditEventsModule {}
