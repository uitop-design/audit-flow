import { enabledLogLevels } from './create-logger.js';

describe('enabledLogLevels', () => {
  it('enables the configured level and every more severe level', () => {
    expect(enabledLogLevels('warn')).toEqual(['fatal', 'error', 'warn']);
    expect(enabledLogLevels('verbose')).toEqual([
      'fatal',
      'error',
      'warn',
      'log',
      'debug',
      'verbose',
    ]);
  });
});
