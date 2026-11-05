import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { buildHealthReport } from './fixtures';

/** Defaults every test gets; individual tests override with `server.use(...)`. */
export const defaultHandlers = [
  http.get('*/api/v1/health', () => HttpResponse.json(buildHealthReport())),
];

export const server = setupServer(...defaultHandlers);
