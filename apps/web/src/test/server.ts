import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { buildAuditEventList, buildFacets, buildHealthReport, buildStats } from './fixtures';

/** Defaults every test gets; individual tests override with `server.use(...)`. */
export const defaultHandlers = [
  http.get('*/api/v1/health', () => HttpResponse.json(buildHealthReport())),
  http.get('*/api/v1/audit-events/facets', () => HttpResponse.json(buildFacets())),
  http.get('*/api/v1/audit-events/stats', () => HttpResponse.json(buildStats())),
  http.get('*/api/v1/audit-events', () => HttpResponse.json(buildAuditEventList([]))),
];

export const server = setupServer(...defaultHandlers);
