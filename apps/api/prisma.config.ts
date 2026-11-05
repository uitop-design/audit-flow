import { defineConfig } from 'prisma/config';
import { loadRootEnvFile } from './src/config/env-file.js';

loadRootEnvFile();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
