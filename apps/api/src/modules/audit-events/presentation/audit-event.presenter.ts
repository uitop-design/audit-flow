import type { AuditEvent, NewAuditEvent } from '../domain/audit-event.js';
import type { AuditEventQuery, Page } from '../domain/audit-event-query.js';
import type { AuditEventFacets, AuditEventStats } from '../domain/audit-event-stats.js';
import type {
  AuditEventListResponseDto,
  AuditEventResponseDto,
} from './dto/audit-event-response.dto.js';
import type {
  AuditEventFacetsResponseDto,
  AuditEventStatsResponseDto,
} from './dto/audit-event-stats-response.dto.js';
import type { CreateAuditEventDto } from './dto/create-audit-event.dto.js';
import type { ListAuditEventsQueryDto } from './dto/list-audit-events-query.dto.js';

/** Translates between HTTP DTOs and the domain. Optional input fields default to null / {}. */
export function toNewAuditEvent(dto: CreateAuditEventDto): NewAuditEvent {
  return {
    eventType: dto.eventType,
    action: dto.action,
    resourceType: dto.resourceType,
    resourceId: dto.resourceId ?? null,
    actorId: dto.actorId ?? null,
    actorEmail: dto.actorEmail ?? null,
    actorName: dto.actorName ?? null,
    description: dto.description,
    metadata: dto.metadata ?? {},
    before: dto.before ?? null,
    after: dto.after ?? null,
    ipAddress: dto.ipAddress ?? null,
    userAgent: dto.userAgent ?? null,
    correlationId: dto.correlationId ?? null,
    source: dto.source,
  };
}

export function toAuditEventQuery(dto: ListAuditEventsQueryDto): AuditEventQuery {
  return {
    page: dto.page,
    limit: dto.limit,
    sortBy: dto.sortBy,
    sortOrder: dto.sortOrder,
    filters: {
      search: dto.search,
      eventType: dto.eventType,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      actorId: dto.actorId,
      source: dto.source,
      correlationId: dto.correlationId,
      createdFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
      createdBefore: dto.dateTo ? new Date(dto.dateTo) : undefined,
    },
  };
}

export function toAuditEventResponse(event: AuditEvent): AuditEventResponseDto {
  return {
    id: event.id,
    eventType: event.eventType,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    actorId: event.actorId,
    actorEmail: event.actorEmail,
    actorName: event.actorName,
    description: event.description,
    metadata: event.metadata,
    before: event.before,
    after: event.after,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    correlationId: event.correlationId,
    source: event.source,
    createdAt: event.createdAt.toISOString(),
  };
}

export function toAuditEventListResponse(page: Page<AuditEvent>): AuditEventListResponseDto {
  return {
    data: page.items.map(toAuditEventResponse),
    meta: {
      page: page.page,
      limit: page.limit,
      total: page.total,
      totalPages: page.totalPages,
    },
  };
}

export function toAuditEventStatsResponse(stats: AuditEventStats): AuditEventStatsResponseDto {
  return {
    totalEvents: stats.totalEvents,
    eventsLast24h: stats.eventsLast24h,
    uniqueActors: stats.uniqueActors,
    topEventType: stats.topEventType,
    byEventType: [...stats.byEventType],
    dailyVolume: [...stats.dailyVolume],
    recentEvents: stats.recentEvents.map(toAuditEventResponse),
    generatedAt: stats.generatedAt.toISOString(),
  };
}

export function toAuditEventFacetsResponse(facets: AuditEventFacets): AuditEventFacetsResponseDto {
  return {
    eventTypes: [...facets.eventTypes],
    actions: [...facets.actions],
    resourceTypes: [...facets.resourceTypes],
    sources: [...facets.sources],
  };
}
