import { ConsoleLogger } from '@nestjs/common';
import type { AppConfig } from '../../config/app-config.js';
import { LOG_LEVELS, type LogLevel } from '../../config/env.schema.js';

export function enabledLogLevels(level: LogLevel): LogLevel[] {
  return LOG_LEVELS.slice(0, LOG_LEVELS.indexOf(level) + 1);
}

/** Human-readable logs in development, one JSON object per line in production. */
export function createLogger(config: AppConfig): ConsoleLogger {
  return new ConsoleLogger({
    logLevels: enabledLogLevels(config.logLevel),
    json: config.nodeEnv === 'production',
  });
}
