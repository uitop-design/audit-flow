import { Inject, Injectable } from '@nestjs/common';
import type { AuditEvent, NewAuditEvent } from '../domain/audit-event.js';
import {
  AUDIT_EVENT_REPOSITORY,
  type AuditEventRepository,
} from '../domain/audit-event.repository.js';
import { AuditEventNotFoundError } from '../domain/audit-event-not-found.error.js';
import type { AuditEventQuery, Page } from '../domain/audit-event-query.js';
import type { AuditEventFacets, AuditEventStats } from '../domain/audit-event-stats.js';

/** Audit event use cases. Recording and reading are the only operations that exist. */
@Injectable()
export class AuditEventService {
  constructor(@Inject(AUDIT_EVENT_REPOSITORY) private readonly repository: AuditEventRepository) {}

  record(event: NewAuditEvent): Promise<AuditEvent> {
    return this.repository.append(event);
  }

  list(query: AuditEventQuery): Promise<Page<AuditEvent>> {
    return this.repository.findPage(query);
  }

  async getById(id: string): Promise<AuditEvent> {
    const event = await this.repository.findById(id);
    if (!event) {
      throw new AuditEventNotFoundError(id);
    }
    return event;
  }

  async getStats(): Promise<AuditEventStats> {
    const snapshot = await this.repository.getStatsSnapshot();
    return { ...snapshot, topEventType: snapshot.byEventType[0] ?? null };
  }

  getFacets(): Promise<AuditEventFacets> {
    return this.repository.getFacets();
  }
}
