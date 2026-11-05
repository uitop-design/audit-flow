import type { AuditEvent } from './audit-event.js';

export const STATS_DAILY_WINDOW_DAYS = 14;
export const STATS_RECENT_EVENTS_LIMIT = 5;
export const FACET_VALUES_LIMIT = 500;

export interface EventTypeCount {
  readonly eventType: string;
  readonly count: number;
}

export interface DailyEventCount {
  /** UTC calendar day, `YYYY-MM-DD`. */
  readonly date: string;
  readonly count: number;
}

/** Aggregates computed by the database in one consistent snapshot. */
export interface AuditEventStatsSnapshot {
  readonly totalEvents: number;
  readonly eventsLast24h: number;
  /** Distinct non-null `actorId` values. */
  readonly uniqueActors: number;
  /** Sorted by count descending, then event type. */
  readonly byEventType: readonly EventTypeCount[];
  /** The last {@link STATS_DAILY_WINDOW_DAYS} UTC days, oldest first, zero-filled. */
  readonly dailyVolume: readonly DailyEventCount[];
  readonly recentEvents: readonly AuditEvent[];
  /** Database time the snapshot was taken at. */
  readonly generatedAt: Date;
}

export interface AuditEventStats extends AuditEventStatsSnapshot {
  readonly topEventType: EventTypeCount | null;
}

export interface AuditEventFacets {
  readonly eventTypes: readonly string[];
  readonly actions: readonly string[];
  readonly resourceTypes: readonly string[];
  readonly sources: readonly string[];
}
