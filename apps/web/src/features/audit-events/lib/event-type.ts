const CATEGORY_COUNT = 9;

/** Stable colors for the event types the demo uses; unknown types hash into the same palette. */
const KNOWN_EVENT_TYPES: Record<string, number> = {
  AUTH: 1,
  USER: 2,
  PERMISSION: 3,
  PROJECT: 4,
  API_KEY: 5,
  BILLING: 6,
  INTEGRATION: 7,
  DATA: 9,
  SYSTEM: 8,
};

export function eventTypeColor(eventType: string): string {
  const known = KNOWN_EVENT_TYPES[eventType];
  if (known !== undefined) {
    return `var(--category-${known})`;
  }
  let hash = 0;
  for (const character of eventType) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return `var(--category-${(hash % CATEGORY_COUNT) + 1})`;
}
