import type { Request } from 'express';

/** The request path without its query string, safe to log and to echo in error bodies. */
export function requestPath(req: Request): string {
  return req.originalUrl.split('?', 1)[0] ?? req.originalUrl;
}
