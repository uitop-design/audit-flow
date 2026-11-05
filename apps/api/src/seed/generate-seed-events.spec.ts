import type { ArgumentMetadata } from '@nestjs/common';
import { createValidationPipe } from '../common/pipes/validation.pipe.js';
import { CreateAuditEventDto } from '../modules/audit-events/presentation/dto/create-audit-event.dto.js';
import { generateSeedEvents, type SeedEvent } from './generate-seed-events.js';
import { createRandom } from './random.js';

const NOW = new Date('2026-11-05T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

describe('generateSeedEvents', () => {
  const events = generateSeedEvents({ now: NOW });

  it('generates enough events to demonstrate pagination and filtering', () => {
    expect(events.length).toBeGreaterThanOrEqual(180);
    expect(events.length).toBeLessThanOrEqual(200);
  });

  it('is deterministic for the same anchor time', () => {
    expect(generateSeedEvents({ now: NOW })).toEqual(events);
  });

  it('keeps content identical and shifts timestamps when the anchor moves', () => {
    const later = generateSeedEvents({ now: new Date(NOW.getTime() + 7 * DAY_MS) });

    const withoutTime = ({ createdAt: _createdAt, ...rest }: SeedEvent) => rest;
    expect(later.map(withoutTime)).toEqual(events.map(withoutTime));
    expect(later[0]?.createdAt.getTime()).toBe((events[0]?.createdAt.getTime() ?? 0) + 7 * DAY_MS);
  });

  it('spreads events over the last 30 days, oldest first, never in the future', () => {
    const times = events.map((event) => event.createdAt.getTime());

    expect(Math.min(...times)).toBeGreaterThanOrEqual(NOW.getTime() - 30 * DAY_MS);
    expect(Math.max(...times)).toBeLessThan(NOW.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('always has recent activity for the dashboard', () => {
    const lastDay = events.filter((event) => event.createdAt.getTime() > NOW.getTime() - DAY_MS);

    expect(lastDay.length).toBeGreaterThanOrEqual(10);
  });

  it('covers the event categories the demo needs', () => {
    const eventTypes = new Set(events.map((event) => event.eventType));
    const actions = new Set(events.map((event) => event.action));

    for (const type of ['AUTH', 'USER', 'PROJECT', 'PERMISSION', 'API_KEY', 'BILLING']) {
      expect(eventTypes).toContain(type);
    }
    for (const action of [
      'USER_SIGNED_IN',
      'USER_SIGN_IN_FAILED',
      'ROLE_CHANGED',
      'API_KEY_CREATED',
      'API_KEY_REVOKED',
      'PROJECT_CREATED',
      'PROJECT_DELETED',
      'PAYMENT_METHOD_UPDATED',
    ]) {
      expect(actions).toContain(action);
    }
  });

  it('includes before/after changes, system events and multi-step flows', () => {
    expect(events.some((event) => event.before && event.after)).toBe(true);
    expect(events.some((event) => event.actorId === null && event.actorEmail === null)).toBe(true);

    const flowSizes = new Map<string | null, number>();
    for (const event of events) {
      flowSizes.set(event.correlationId, (flowSizes.get(event.correlationId) ?? 0) + 1);
    }
    expect([...flowSizes.values()].some((size) => size > 1)).toBe(true);
  });

  it('records failed sign-ins without an authenticated actor id', () => {
    const failed = events.filter((event) => event.action === 'USER_SIGN_IN_FAILED');

    expect(failed.length).toBeGreaterThan(0);
    for (const event of failed) {
      expect(event.actorId).toBeNull();
      expect(event.actorEmail).toMatch(/@/);
    }
  });

  it('never stores credentials in JSON fields', () => {
    const keys = new Set<string>();
    const collectKeys = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(collectKeys);
      } else if (value && typeof value === 'object') {
        for (const [key, nested] of Object.entries(value)) {
          keys.add(key);
          collectKeys(nested);
        }
      }
    };
    for (const event of events) {
      collectKeys([event.metadata, event.before, event.after]);
    }

    expect([...keys].filter((key) => /password|secret|token|cardNumber|cvc/i.test(key))).toEqual(
      [],
    );
  });

  it('produces only events that the ingestion API itself would accept', async () => {
    const pipe = createValidationPipe();
    const metadata: ArgumentMetadata = { type: 'body', metatype: CreateAuditEventDto };

    for (const { createdAt: _createdAt, ...payload } of events) {
      await expect(pipe.transform(payload, metadata)).resolves.toBeInstanceOf(CreateAuditEventDto);
    }
  });
});

describe('createRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);

    expect(Array.from({ length: 5 }, () => a.next())).toEqual(
      Array.from({ length: 5 }, () => b.next()),
    );
  });

  it('keeps integers within inclusive bounds', () => {
    const random = createRandom(7);
    const values = Array.from({ length: 1000 }, () => random.int(1, 3));

    expect(new Set(values)).toEqual(new Set([1, 2, 3]));
  });
});
