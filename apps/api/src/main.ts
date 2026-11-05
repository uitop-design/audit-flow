import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap.js';
import { createLogger } from './common/logging/create-logger.js';
import { type AppConfig, ConfigValidationError, loadConfig } from './config/app-config.js';
import { loadRootEnvFile } from './config/env-file.js';
import { SWAGGER_PATH } from './swagger.js';

function loadConfigOrExit(): AppConfig {
  loadRootEnvFile();
  try {
    return loadConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}

const config = loadConfigOrExit();
const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(config), {
  bodyParser: false,
  logger: createLogger(config),
});
configureApp(app, config);
await app.listen(config.port);

const logger = new Logger('Bootstrap');
logger.log(`API listening on http://localhost:${config.port}/api/v1`);
if (config.swaggerEnabled) {
  logger.log(`Swagger UI at http://localhost:${config.port}/${SWAGGER_PATH}`);
}
