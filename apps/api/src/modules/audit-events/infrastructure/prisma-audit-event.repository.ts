import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { Prisma } from '../../../generated/prisma/client.js';
import type { AuditEvent, NewAuditEvent } from '../domain/audit-event.js';
import type { AuditEventRepository } from '../domain/audit-event.repository.js';
import {
  type AuditEventQuery,
  type Page,
  pageOffset,
  toPage,
} from '../domain/audit-event-query.js';
import {
  type AuditEventFacets,
  type AuditEventStatsSnapshot,
  FACET_VALUES_LIMIT,
  STATS_DAILY_WINDOW_DAYS,
  STATS_RECENT_EVENTS_LIMIT,
} from '../domain/audit-event-stats.js';
import { toAuditEvent, toCreateInput } from './audit-event.mapper.js';
import { buildOrderBy, buildWhere } from './audit-event-query.prisma.js';

/** Every read that combines several queries runs in one snapshot, so the numbers agree. */
const SNAPSHOT = { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead };

interface CountersRow {
  total: number;
  last24h: number;
  uniqueActors: number;
  generatedAt: Date;
}

interface DailyRow {
  date: string;
  count: number;
}

@Injectable()
export class PrismaAuditEventRepository implements AuditEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async append(event: NewAuditEvent): Promise<AuditEvent> {
    const record = await this.prisma.auditEvent.create({ data: toCreateInput(event) });
    return toAuditEvent(record);
  }

  async findById(id: string): Promise<AuditEvent | null> {
    const record = await this.prisma.auditEvent.findUnique({ where: { id } });
    return record ? toAuditEvent(record) : null;
  }

  async findPage(query: AuditEventQuery): Promise<Page<AuditEvent>> {
    const where = buildWhere(query.filters);
    const [records, total] = await this.prisma.$transaction(
      [
        this.prisma.auditEvent.findMany({
          where,
          orderBy: buildOrderBy(query.sortBy, query.sortOrder),
          skip: pageOffset(query),
          take: query.limit,
        }),
        this.prisma.auditEvent.count({ where }),
      ],
      SNAPSHOT,
    );
    return toPage(records.map(toAuditEvent), total, query);
  }

  async getStatsSnapshot(): Promise<AuditEventStatsSnapshot> {
    const [[counters], byEventType, dailyVolume, recent] = await this.prisma.$transaction(
      [
        this.prisma.$queryRaw<[CountersRow]>`
          SELECT
            count(*)::int AS "total",
            count(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS "last24h",
            count(DISTINCT actor_id)::int AS "uniqueActors",
            now() AS "generatedAt"
          FROM audit_events`,
        this.prisma.auditEvent.groupBy({
          by: ['eventType'],
          _count: { _all: true },
          orderBy: [{ _count: { eventType: 'desc' } }, { eventType: 'asc' }],
        }),
        // One row per UTC day in the window, including days without events.
        this.prisma.$queryRaw<DailyRow[]>`
          SELECT to_char(day, 'YYYY-MM-DD') AS "date", count(e.id)::int AS "count"
          FROM generate_series(
            date_trunc('day', now() AT TIME ZONE 'UTC') - make_interval(days => ${STATS_DAILY_WINDOW_DAYS - 1}::int),
            date_trunc('day', now() AT TIME ZONE 'UTC'),
            interval '1 day'
          ) AS day
          LEFT JOIN audit_events e
            ON e.created_at >= day AT TIME ZONE 'UTC'
           AND e.created_at < (day + interval '1 day') AT TIME ZONE 'UTC'
          GROUP BY day
          ORDER BY day`,
        this.prisma.auditEvent.findMany({
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: STATS_RECENT_EVENTS_LIMIT,
        }),
      ],
      SNAPSHOT,
    );

    return {
      totalEvents: counters.total,
      eventsLast24h: counters.last24h,
      uniqueActors: counters.uniqueActors,
      byEventType: byEventType.map((row) => ({ eventType: row.eventType, count: row._count._all })),
      dailyVolume,
      recentEvents: recent.map(toAuditEvent),
      generatedAt: counters.generatedAt,
    };
  }

  async getFacets(): Promise<AuditEventFacets> {
    const [eventTypes, actions, resourceTypes, sources] = await this.prisma.$transaction(
      [
        this.prisma.auditEvent.groupBy({
          by: ['eventType'],
          orderBy: { eventType: 'asc' },
          take: FACET_VALUES_LIMIT,
        }),
        this.prisma.auditEvent.groupBy({
          by: ['action'],
          orderBy: { action: 'asc' },
          take: FACET_VALUES_LIMIT,
        }),
        this.prisma.auditEvent.groupBy({
          by: ['resourceType'],
          orderBy: { resourceType: 'asc' },
          take: FACET_VALUES_LIMIT,
        }),
        this.prisma.auditEvent.groupBy({
          by: ['source'],
          orderBy: { source: 'asc' },
          take: FACET_VALUES_LIMIT,
        }),
      ],
      SNAPSHOT,
    );

    return {
      eventTypes: eventTypes.map((row) => row.eventType),
      actions: actions.map((row) => row.action),
      resourceTypes: resourceTypes.map((row) => row.resourceType),
      sources: sources.map((row) => row.source),
    };
  }
}
