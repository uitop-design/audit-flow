export type JsonObject = Record<string, unknown>;

export interface FieldChange {
  key: string;
  kind: 'added' | 'removed' | 'changed';
  before?: unknown;
  after?: unknown;
}

export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) =>
      isDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    )
  );
}

/**
 * Top-level differences between two snapshots, in a stable order (keys of `after`, then keys only in
 * `before`). Used only for display; the stored event is never interpreted beyond this.
 */
export function diffSnapshots(before: JsonObject | null, after: JsonObject | null): FieldChange[] {
  const previous = before ?? {};
  const next = after ?? {};
  const keys = [...new Set([...Object.keys(next), ...Object.keys(previous)])];
  const changes: FieldChange[] = [];
  for (const key of keys) {
    const inBefore = Object.hasOwn(previous, key);
    const inAfter = Object.hasOwn(next, key);
    if (inBefore && !inAfter) {
      changes.push({ key, kind: 'removed', before: previous[key] });
    } else if (!inBefore && inAfter) {
      changes.push({ key, kind: 'added', after: next[key] });
    } else if (!isDeepEqual(previous[key], next[key])) {
      changes.push({ key, kind: 'changed', before: previous[key], after: next[key] });
    }
  }
  return changes;
}

/** Compact one-line JSON for change summaries, truncated with an ellipsis. */
export function previewJson(value: unknown, maxLength = 60): string {
  const text = JSON.stringify(value) ?? String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}
