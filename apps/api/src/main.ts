import 'reflect-metadata';
import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// Phase 1 skeleton: validated configuration, security middleware and Swagger arrive in Phase 2.
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('api');
app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
app.enableShutdownHooks();

const port = Number(process.env.PORT ?? 3000);
await app.listen(port);
Logger.log(`API listening on http://localhost:${port}/api/v1`, 'Bootstrap');
