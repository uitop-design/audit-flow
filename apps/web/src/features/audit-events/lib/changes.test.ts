import { describe, expect, it } from 'vitest';
import { diffSnapshots, isDeepEqual, previewJson } from './changes';

describe('diffSnapshots', () => {
  it('reports changed, added and removed top-level fields', () => {
    expect(
      diffSnapshots(
        { role: 'USER', team: 'core', legacy: true, nested: { a: 1, b: [1, 2] } },
        { role: 'ADMIN', team: 'core', mfa: 'totp', nested: { b: [1, 2], a: 1 } },
      ),
    ).toEqual([
      { key: 'role', kind: 'changed', before: 'USER', after: 'ADMIN' },
      { key: 'mfa', kind: 'added', after: 'totp' },
      { key: 'legacy', kind: 'removed', before: true },
    ]);
  });

  it('treats a missing side as an empty object', () => {
    expect(diffSnapshots(null, { name: 'Atlas' })).toEqual([
      { key: 'name', kind: 'added', after: 'Atlas' },
    ]);
    expect(diffSnapshots({ name: 'Atlas' }, null)).toEqual([
      { key: 'name', kind: 'removed', before: 'Atlas' },
    ]);
  });

  it('distinguishes null from a missing key', () => {
    expect(diffSnapshots({ method: null }, { method: 'totp' })).toEqual([
      { key: 'method', kind: 'changed', before: null, after: 'totp' },
    ]);
  });
});

describe('isDeepEqual', () => {
  it('compares structurally', () => {
    expect(isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(isDeepEqual([1, 2], { 0: 1, 1: 2 })).toBe(false);
    expect(isDeepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(isDeepEqual(null, {})).toBe(false);
  });
});

describe('previewJson', () => {
  it('renders compact JSON and truncates long values', () => {
    expect(previewJson('ADMIN')).toBe('"ADMIN"');
    expect(previewJson({ a: 1 })).toBe('{"a":1}');
    expect(previewJson('x'.repeat(100), 10)).toBe('"xxxxxxxx…');
  });
});
