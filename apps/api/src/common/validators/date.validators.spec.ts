import { isIsoDateTimeWithOffset } from './date.validators.js';

describe('isIsoDateTimeWithOffset', () => {
  it.each([
    '2026-11-05T00:00:00Z',
    '2026-11-05T00:00Z',
    '2026-11-05T10:15:30.123Z',
    '2026-11-05T10:15:30+02:00',
    '2026-11-05T10:15:30.123456-05:30',
  ])('accepts %s', (value) => {
    expect(isIsoDateTimeWithOffset(value)).toBe(true);
  });

  it.each([
    ['date only', '2026-11-05'],
    ['no time zone', '2026-11-05T10:15:30'],
    ['space separator', '2026-11-05 10:15:30Z'],
    ['impossible month', '2026-13-05T00:00:00Z'],
    ['impossible day', '2026-02-30T00:00:00Z'],
    ['not a date', 'yesterday'],
  ])('rejects %s', (_label, value) => {
    expect(isIsoDateTimeWithOffset(value)).toBe(false);
  });
});
