import { VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { createJsonBodyParser } from './common/middleware/json-body-parser.middleware.js';
import {
  REQUEST_ID_HEADER,
  requestIdMiddleware,
} from './common/middleware/request-id.middleware.js';
import { requestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { createValidationPipe } from './common/pipes/validation.pipe.js';
import type { AppConfig } from './config/app-config.js';
import { setupSwagger } from './swagger.js';

export const JSON_BODY_LIMIT = '128kb';

/**
 * Applies the HTTP pipeline shared by the real server and integration tests.
 * The app must be created with `bodyParser: false` so the JSON parser below is the only one.
 * Middleware order matters: request id first, so every later log line and error carries it.
 */
export function configureApp(app: NestExpressApplication, config: AppConfig): void {
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(helmet());
  app.enableCors({
    origin: [...config.corsOrigins],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', REQUEST_ID_HEADER],
    exposedHeaders: [REQUEST_ID_HEADER, 'Location'],
    maxAge: 600,
  });
  app.use(createJsonBodyParser(JSON_BODY_LIMIT));

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (config.swaggerEnabled) {
    setupSwagger(app);
  }
}
