import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../app.module.js';
import { configureApp } from '../bootstrap.js';
import { loadConfig } from '../config/app-config.js';
import { createOpenApiDocument } from '../swagger.js';

// Written next to package.json; the web app generates its API types from this file.
const OUTPUT = fileURLToPath(new URL('../../openapi.json', import.meta.url));

/**
 * Builds the OpenAPI document from the application without starting a server. Database
 * connections are lazy, so no database is needed; the placeholder URL is never contacted.
 */
const config = loadConfig({
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://openapi@localhost:5432/unused',
  SWAGGER_ENABLED: 'false',
});
const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(config), {
  bodyParser: false,
  logger: ['error', 'warn'],
});
configureApp(app, config);

const document = createOpenApiDocument(app);
writeFileSync(OUTPUT, `${JSON.stringify(document, null, 2)}\n`);
await app.close();
console.log(`OpenAPI document written to ${OUTPUT}`);
