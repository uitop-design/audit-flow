import { readFileSync } from 'node:fs';

// Reuse the build's SWC settings (decorators + metadata) so tests compile exactly like the app.
const swcConfig = JSON.parse(readFileSync(new URL('./.swcrc', import.meta.url), 'utf8'));
delete swcConfig.$schema;

/** @type {import('jest').Config['projects'][number]} */
const shared = {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: { '^.+\\.ts$': ['@swc/jest', { ...swcConfig, sourceMaps: 'inline' }] },
  // main.ts loads reflect-metadata before anything else; tests must do the same.
  setupFiles: ['reflect-metadata'],
};

/** @type {import('jest').Config} */
export default {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      roots: ['<rootDir>/src'],
      testMatch: ['**/*.spec.ts'],
    },
    {
      ...shared,
      displayName: 'integration',
      roots: ['<rootDir>/test'],
      testMatch: ['**/*.int-spec.ts'],
      setupFiles: [...shared.setupFiles, '<rootDir>/test/support/setup-env.ts'],
    },
  ],
};
