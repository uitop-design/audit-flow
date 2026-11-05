import { resolveTestDatabaseUrl } from './test-database.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = resolveTestDatabaseUrl();
