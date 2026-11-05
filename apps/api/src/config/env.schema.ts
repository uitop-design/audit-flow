import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export const NODE_ENVS = ['development', 'test', 'production'] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

/** Ordered from most to least severe; a configured level enables itself and everything above it. */
export const LOG_LEVELS = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/** Raw environment variables as validated at startup. Defaults apply when a variable is unset. */
export class EnvironmentVariables {
  @IsIn(NODE_ENVS)
  NODE_ENV: NodeEnv = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65_535)
  PORT = 3000;

  @Matches(/^postgres(ql)?:\/\/.+/, {
    message: 'DATABASE_URL must be a postgresql:// connection string',
  })
  DATABASE_URL!: string;

  @IsString()
  CORS_ORIGINS = 'http://localhost:5173';

  @IsOptional()
  @IsIn(['true', 'false'])
  SWAGGER_ENABLED?: 'true' | 'false';

  @IsIn(LOG_LEVELS)
  LOG_LEVEL: LogLevel = 'log';
}

export const ENVIRONMENT_VARIABLE_NAMES = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'CORS_ORIGINS',
  'SWAGGER_ENABLED',
  'LOG_LEVEL',
] as const satisfies readonly (keyof EnvironmentVariables)[];
