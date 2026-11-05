import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { requestPath } from '../http/request-path.js';

const logger = new Logger('HTTP');

/**
 * Logs one line per completed request. Bodies and query strings are never logged:
 * audit payloads and search terms can contain personal data.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = performance.now();
  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - startedAt);
    const line = `${req.method} ${requestPath(req)} ${res.statusCode} ${durationMs}ms requestId=${req.requestId}`;
    if (res.statusCode >= 500) {
      logger.error(line);
    } else if (res.statusCode >= 400) {
      logger.warn(line);
    } else {
      logger.log(line);
    }
  });
  next();
}
