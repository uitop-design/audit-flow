import { defineConfig } from 'prisma/config';
import baseConfig from './prisma.config.js';
import { resolveTestDatabaseUrl } from './test/support/test-database.js';

/** Prisma CLI config for the integration-test database (`--config prisma.test.config.ts`). */
export default defineConfig({
  ...baseConfig,
  datasource: {
    url: resolveTestDatabaseUrl(),
  },
});
