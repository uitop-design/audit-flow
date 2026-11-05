import type { components, operations } from './schema';

/**
 * Friendly names for the API contract. Everything here is generated from the API's OpenAPI
 * document (`pnpm api:types`), so the frontend never redefines server shapes by hand.
 */
type Schemas = components['schemas'];

export type AuditEvent = Schemas['AuditEventResponseDto'];
export type AuditEventList = Schemas['AuditEventListResponseDto'];
export type PaginationMeta = Schemas['PaginationMetaDto'];
export type AuditEventStats = Schemas['AuditEventStatsResponseDto'];
export type AuditEventFacets = Schemas['AuditEventFacetsResponseDto'];
export type HealthReport = Schemas['HealthResponseDto'];
export type ErrorResponse = Schemas['ErrorResponseDto'];
export type ValidationIssue = Schemas['ValidationIssueDto'];

export type ListAuditEventsParams = NonNullable<
  operations['AuditEventsController_list_v1']['parameters']['query']
>;
