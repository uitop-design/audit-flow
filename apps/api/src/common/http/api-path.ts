export const GLOBAL_PREFIX = 'api';
export const DEFAULT_API_VERSION = '1';

/** Absolute public path for a versioned resource, e.g. `/api/v1/audit-events/<id>`. */
export function apiPath(...segments: string[]): string {
  return `/${[GLOBAL_PREFIX, `v${DEFAULT_API_VERSION}`, ...segments].join('/')}`;
}
