import type { Type } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/bootstrap.js';
import { loadConfig } from '../../src/config/app-config.js';

export interface TestAppOptions {
  /** Environment overrides applied on top of the test environment. */
  env?: Record<string, string>;
  /** Extra controllers, used to exercise the HTTP pipeline before feature routes exist. */
  controllers?: Type[];
}

/** Builds the application exactly as `main.ts` does, against the test database. */
export async function createTestApp(options: TestAppOptions = {}): Promise<NestExpressApplication> {
  const config = loadConfig({
    ...process.env,
    SWAGGER_ENABLED: 'true',
    CORS_ORIGINS: 'http://localhost:5173',
    ...options.env,
  });
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRoot(config)],
    controllers: options.controllers ?? [],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bodyParser: false,
    logger: false,
  });
  configureApp(app, config);
  await app.init();
  return app;
}
