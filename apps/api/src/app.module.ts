import { type DynamicModule, Module } from '@nestjs/common';
import type { AppConfig } from './config/app-config.js';
import { AppConfigModule } from './config/app-config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuditEventsModule } from './modules/audit-events/audit-events.module.js';
import { HealthModule } from './modules/health/health.module.js';

/** Root module. Configuration is passed in explicitly so tests can build the app with their own. */
@Module({})
export class AppModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [AppConfigModule.forRoot(config), DatabaseModule, HealthModule, AuditEventsModule],
    };
  }
}
