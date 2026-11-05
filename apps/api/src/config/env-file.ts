import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

// Resolves to the monorepo root from both src/config and dist/config.
const ROOT_ENV_FILE = fileURLToPath(new URL('../../../../.env', import.meta.url));

/**
 * Loads the shared root `.env` for local development. Variables that are already set in the
 * environment win, and the file is optional: CI and containers provide variables directly.
 *
 * Assigns through `process.env` rather than `process.loadEnvFile()` so it also works where
 * `process.env` is a sandboxed copy (Jest test files).
 */
export function loadRootEnvFile(): void {
  if (!existsSync(ROOT_ENV_FILE)) {
    return;
  }
  const variables = parseEnv(readFileSync(ROOT_ENV_FILE, 'utf8'));
  for (const [name, value] of Object.entries(variables)) {
    if (process.env[name] === undefined && value !== undefined) {
      process.env[name] = value;
    }
  }
}
