import { loadRootEnvFile } from '../../src/config/env-file.js';

/**
 * Returns the integration-test database URL. Refuses anything whose database name does not
 * end in `_test`, so a misconfigured environment can never point destructive tests at real data.
 */
export function resolveTestDatabaseUrl(): string {
  loadRootEnvFile();
  const value = process.env.TEST_DATABASE_URL;
  if (!value) {
    throw new Error('TEST_DATABASE_URL is not set. Copy .env.example to .env or export it.');
  }
  const databaseName = new URL(value).pathname.replace(/^\//, '');
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `TEST_DATABASE_URL must point to a database whose name ends in "_test" (got "${databaseName}").`,
    );
  }
  return value;
}
