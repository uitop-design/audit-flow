import { ConfigValidationError, loadConfig } from './app-config.js';

const DATABASE_URL = 'postgresql://user:pass@localhost:5433/auditflow';

function captureIssues(env: Record<string, string | undefined>): readonly string[] {
  try {
    loadConfig(env);
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      return error.issues;
    }
    throw error;
  }
  throw new Error('Expected configuration to be invalid');
}

describe('loadConfig', () => {
  it('applies defaults when only DATABASE_URL is provided', () => {
    expect(loadConfig({ DATABASE_URL })).toEqual({
      nodeEnv: 'development',
      port: 3000,
      databaseUrl: DATABASE_URL,
      corsOrigins: ['http://localhost:5173'],
      swaggerEnabled: true,
      logLevel: 'log',
    });
  });

  it('parses explicit values', () => {
    const config = loadConfig({
      DATABASE_URL,
      NODE_ENV: 'production',
      PORT: '8080',
      CORS_ORIGINS: 'https://audit.example.com, http://localhost:5173',
      SWAGGER_ENABLED: 'true',
      LOG_LEVEL: 'debug',
    });

    expect(config).toMatchObject({
      nodeEnv: 'production',
      port: 8080,
      corsOrigins: ['https://audit.example.com', 'http://localhost:5173'],
      swaggerEnabled: true,
      logLevel: 'debug',
    });
  });

  it('disables Swagger by default in production', () => {
    expect(loadConfig({ DATABASE_URL, NODE_ENV: 'production' }).swaggerEnabled).toBe(false);
  });

  it('treats empty values as unset', () => {
    expect(loadConfig({ DATABASE_URL, PORT: '', LOG_LEVEL: '  ' })).toMatchObject({
      port: 3000,
      logLevel: 'log',
    });
  });

  it('returns a frozen object', () => {
    expect(Object.isFrozen(loadConfig({ DATABASE_URL }))).toBe(true);
  });

  it('requires DATABASE_URL', () => {
    expect(captureIssues({})).toEqual([
      expect.stringContaining('DATABASE_URL must be a postgresql:// connection string'),
    ]);
  });

  it('reports every invalid variable at once', () => {
    const issues = captureIssues({
      DATABASE_URL: 'mysql://localhost/db',
      NODE_ENV: 'staging',
      PORT: '70000',
      LOG_LEVEL: 'trace',
      SWAGGER_ENABLED: 'yes',
    });

    const fields = issues.map((issue) => issue.split(':')[0]);
    expect(new Set(fields)).toEqual(
      new Set(['DATABASE_URL', 'NODE_ENV', 'PORT', 'LOG_LEVEL', 'SWAGGER_ENABLED']),
    );
  });

  it.each([
    '*',
    'localhost:5173',
    'http://localhost:5173/',
    'http://localhost:5173/app',
    'ftp://example.com',
  ])('rejects %p as a CORS origin', (origin) => {
    expect(captureIssues({ DATABASE_URL, CORS_ORIGINS: origin })).toEqual([
      expect.stringContaining(`CORS_ORIGINS: "${origin}" is not an exact origin`),
    ]);
  });

  it('formats a readable error message', () => {
    expect(() => loadConfig({})).toThrow(/^Invalid environment configuration:\n {2}- DATABASE_URL/);
  });
});
