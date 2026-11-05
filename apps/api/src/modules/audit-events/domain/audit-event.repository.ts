import type { AuditEvent, NewAuditEvent } from './audit-event.js';
import type { AuditEventQuery, Page } from './audit-event-query.js';
import type { AuditEventFacets, AuditEventStatsSnapshot } from './audit-event-stats.js';

export const AUDIT_EVENT_REPOSITORY = Symbol('AuditEventRepository');

/**
 * Append-only persistence port. There is intentionally no update, delete, save or upsert:
 * once recorded, an audit event can only be read.
 */
export interface AuditEventRepository {
  append(event: NewAuditEvent): Promise<AuditEvent>;
  findById(id: string): Promise<AuditEvent | null>;
  findPage(query: AuditEventQuery): Promise<Page<AuditEvent>>;
  getStatsSnapshot(): Promise<AuditEventStatsSnapshot>;
  getFacets(): Promise<AuditEventFacets>;
}
