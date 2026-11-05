import { describe, expect, it } from 'vitest';
import {
  formatCompactTimestamp,
  formatRelativeTime,
  formatUtcDay,
  humanizeIdentifier,
  isWithinLastWeek,
} from './format';

describe('humanizeIdentifier', () => {
  it.each([
    ['USER_SIGNED_IN', 'User signed in'],
    ['API_KEY_CREATED', 'API key created'],
    ['MFA_ENABLED', 'MFA enabled'],
    ['AUTH', 'Auth'],
    ['DATA_EXPORT_REQUESTED', 'Data export requested'],
  ])('%s → %s', (input, expected) => {
    expect(humanizeIdentifier(input)).toBe(expected);
  });
});

describe('timestamps (TZ=UTC)', () => {
  const now = new Date('2026-11-05T12:00:00.000Z');

  it('formats dense table timestamps, adding the year only for other years', () => {
    expect(formatCompactTimestamp('2026-11-05T09:03:07.000Z', now)).toBe('Nov 5, 09:03:07');
    expect(formatCompactTimestamp('2025-12-31T23:59:59.000Z', now)).toBe('Dec 31, 2025, 23:59:59');
  });

  it('describes recent times relatively and older ones as dates', () => {
    const at = (iso: string) => formatRelativeTime(iso, now.getTime());
    expect(at('2026-11-05T11:59:40.000Z')).toBe('just now');
    expect(at('2026-11-05T11:55:00.000Z')).toBe('5 min. ago');
    expect(at('2026-11-05T09:00:00.000Z')).toBe('3 hr. ago');
    expect(at('2026-11-04T12:00:00.000Z')).toBe('yesterday');
    expect(at('2026-10-01T12:00:00.000Z')).toBe('Oct 1, 2026');
    expect(isWithinLastWeek('2026-10-29T12:00:01.000Z', now.getTime())).toBe(true);
    expect(isWithinLastWeek('2026-10-29T11:59:59.000Z', now.getTime())).toBe(false);
  });

  it('formats UTC aggregate days without shifting them', () => {
    expect(formatUtcDay('2026-11-05')).toBe('Nov 5');
  });
});
