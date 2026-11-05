/**
 * Display formatting. The UI is in English, so formats use en-US conventions; times are shown in
 * the viewer's local time zone.
 */
const LOCALE = 'en-US';

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZoneName: 'short',
});
const compactTimestampFormat = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});
const compactTimestampWithYearFormat = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric' });
const longDateFormat = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const utcDayFormat = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const numberFormat = new Intl.NumberFormat(LOCALE);
const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto', style: 'short' });

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatDateTime(value: string | Date): string {
  return dateTimeFormat.format(new Date(value));
}

/** Dense timestamp for tables: "Nov 5, 14:03:22"; the year only when it is not the current one. */
export function formatCompactTimestamp(value: string | Date, now: Date = new Date()): string {
  const date = new Date(value);
  return date.getFullYear() === now.getFullYear()
    ? compactTimestampFormat.format(date)
    : compactTimestampWithYearFormat.format(date);
}

export function formatShortDate(value: string | Date): string {
  return shortDateFormat.format(new Date(value));
}

export function formatLongDate(value: string | Date): string {
  return longDateFormat.format(new Date(value));
}

/** Formats a UTC calendar day (`YYYY-MM-DD`, as used by daily aggregates) as "Nov 5". */
export function formatUtcDay(day: string): string {
  return utcDayFormat.format(new Date(`${day}T00:00:00Z`));
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** True when a relative description ("3 hr. ago") is more useful than a date. */
export function isWithinLastWeek(value: string | Date, now: number = Date.now()): boolean {
  return now - new Date(value).getTime() < 7 * DAY;
}

/** "just now", "5 min. ago", "3 hr. ago", "yesterday", then a date for anything older than a week. */
export function formatRelativeTime(value: string | Date, now: number = Date.now()): string {
  const elapsed = now - new Date(value).getTime();
  if (elapsed < 45 * SECOND) {
    return 'just now';
  }
  if (elapsed < HOUR) {
    return relativeFormat.format(-Math.round(elapsed / MINUTE), 'minute');
  }
  if (elapsed < DAY) {
    return relativeFormat.format(-Math.round(elapsed / HOUR), 'hour');
  }
  if (elapsed < 7 * DAY) {
    return relativeFormat.format(-Math.round(elapsed / DAY), 'day');
  }
  return formatLongDate(value);
}

const ACRONYMS = new Set(['API', 'MFA', 'IP', 'ID', 'SSO', 'URL']);

/** `API_KEY_CREATED` → "API key created". */
export function humanizeIdentifier(identifier: string): string {
  return identifier
    .split('_')
    .filter(Boolean)
    .map((word, index) => {
      if (ACRONYMS.has(word)) {
        return word;
      }
      const lower = word.toLowerCase();
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(' ');
}
