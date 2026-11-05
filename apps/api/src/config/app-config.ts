import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  ENVIRONMENT_VARIABLE_NAMES,
  EnvironmentVariables,
  type LogLevel,
  type NodeEnv,
} from './env.schema.js';

/**
 * Typed, validated application configuration. Also serves as the DI token, so consumers
 * inject `AppConfig` instead of reading `process.env`.
 */
export abstract class AppConfig {
  abstract readonly nodeEnv: NodeEnv;
  abstract readonly port: number;
  abstract readonly databaseUrl: string;
  abstract readonly corsOrigins: readonly string[];
  abstract readonly swaggerEnabled: boolean;
  abstract readonly logLevel: LogLevel;
}

export class ConfigValidationError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(
      `Invalid environment configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`,
    );
    this.name = 'ConfigValidationError';
  }
}

export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  // Only known variables are considered; empty values count as unset so defaults apply.
  const raw = Object.fromEntries(
    ENVIRONMENT_VARIABLE_NAMES.flatMap((name) => {
      const value = env[name]?.trim();
      return value ? [[name, value]] : [];
    }),
  );

  const variables = plainToInstance(EnvironmentVariables, raw);
  const issues = validateSync(variables, { stopAtFirstError: true }).flatMap((error) =>
    Object.values(error.constraints ?? {}).map((message) => `${error.property}: ${message}`),
  );

  const corsOrigins = variables.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  for (const origin of corsOrigins) {
    if (!isExactOrigin(origin)) {
      issues.push(
        `CORS_ORIGINS: "${origin}" is not an exact origin such as http://localhost:5173 (wildcards are not allowed)`,
      );
    }
  }

  if (issues.length > 0) {
    throw new ConfigValidationError(issues);
  }

  return Object.freeze({
    nodeEnv: variables.NODE_ENV,
    port: variables.PORT,
    databaseUrl: variables.DATABASE_URL,
    corsOrigins: Object.freeze(corsOrigins),
    swaggerEnabled: variables.SWAGGER_ENABLED
      ? variables.SWAGGER_ENABLED === 'true'
      : variables.NODE_ENV !== 'production',
    logLevel: variables.LOG_LEVEL,
  });
}

function isExactOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin === value;
  } catch {
    return false;
  }
}
