import type { NewAuditEvent } from '../modules/audit-events/domain/audit-event.js';
import { createRandom, type Random } from './random.js';
import { SCENARIOS, type Scenario, type ScenarioStep } from './scenarios.js';

/** A demo event with an explicit historical timestamp. */
export interface SeedEvent extends NewAuditEvent {
  readonly createdAt: Date;
}

export interface SeedOptions {
  /** Anchor for relative timestamps; all events fall within the window ending here. */
  readonly now: Date;
  /** Fixed seed: the same seed and `now` always produce the same events. */
  readonly seed?: number;
  /** Generation stops once at least this many events exist (a flow is never cut short). */
  readonly targetCount?: number;
  readonly windowDays?: number;
}

export const DEFAULT_SEED = 20_261_105;
export const DEFAULT_TARGET_COUNT = 180;
export const DEFAULT_WINDOW_DAYS = 30;

const MS_PER_SECOND = 1000;
const MS_PER_DAY = 24 * 60 * 60 * MS_PER_SECOND;

/**
 * Generates realistic demo audit events. Content and relative order are deterministic; absolute
 * timestamps are offsets back from `now`, so "last 24 hours" always has data whenever you seed.
 */
export function generateSeedEvents(options: SeedOptions): SeedEvent[] {
  const random = createRandom(options.seed ?? DEFAULT_SEED);
  const targetCount = options.targetCount ?? DEFAULT_TARGET_COUNT;
  const windowMs = (options.windowDays ?? DEFAULT_WINDOW_DAYS) * MS_PER_DAY;
  const totalWeight = SCENARIOS.reduce((sum, scenario) => sum + scenario.weight, 0);

  const events: SeedEvent[] = [];
  while (events.length < targetCount) {
    const scenario = pickWeighted(random, totalWeight);
    const steps = scenario.build(random);
    const flowDurationMs = Math.max(...steps.map((step) => step.offsetSeconds)) * MS_PER_SECOND;
    // Squaring skews ages toward the present, like real activity; flows always end in the past.
    const ageMs =
      flowDurationMs + 60 * MS_PER_SECOND + random.next() ** 2 * (windowMs - flowDurationMs);
    const startedAt = options.now.getTime() - Math.round(ageMs);
    const correlationId = `req_${random.hex(16)}`;

    for (const step of steps) {
      events.push(
        toSeedEvent(step, correlationId, new Date(startedAt + step.offsetSeconds * MS_PER_SECOND)),
      );
    }
  }

  return events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

function pickWeighted(random: Random, totalWeight: number): Scenario {
  let remaining = random.next() * totalWeight;
  for (const scenario of SCENARIOS) {
    remaining -= scenario.weight;
    if (remaining < 0) {
      return scenario;
    }
  }
  return SCENARIOS[SCENARIOS.length - 1] as Scenario;
}

function toSeedEvent(step: ScenarioStep, correlationId: string, createdAt: Date): SeedEvent {
  const actor = step.actor ?? null;
  const anonymous = step.anonymousEmail !== undefined;
  return {
    eventType: step.eventType,
    action: step.action,
    resourceType: step.resourceType,
    resourceId: step.resourceId,
    actorId: anonymous ? null : (actor?.id ?? null),
    actorEmail: anonymous ? (step.anonymousEmail ?? null) : (actor?.email ?? null),
    actorName: anonymous ? null : (actor?.name ?? null),
    description: step.description,
    metadata: step.metadata ?? {},
    before: step.before ?? null,
    after: step.after ?? null,
    ipAddress: actor?.ipAddress ?? null,
    userAgent: actor?.userAgent ?? null,
    correlationId,
    source: step.source,
    createdAt,
  };
}
