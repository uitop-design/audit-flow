import { ApiProperty } from '@nestjs/swagger';
import type { JsonObject } from '../../../../common/json.js';

const JSON_OBJECT_SCHEMA = { type: 'object', additionalProperties: true } as const;

/** An audit event as returned by the API. Every field is always present; absent values are null. */
export class AuditEventResponseDto {
  @ApiProperty({ format: 'uuid', example: '019a5a3c-7e2b-7c41-9f0e-3b8d2a6c1f44' })
  id!: string;

  @ApiProperty({ example: 'USER' })
  eventType!: string;

  @ApiProperty({ example: 'USER_UPDATED' })
  action!: string;

  @ApiProperty({ example: 'USER' })
  resourceType!: string;

  @ApiProperty({ type: String, nullable: true, example: 'usr_123' })
  resourceId!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'usr_456' })
  actorId!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'admin@example.com' })
  actorEmail!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'John Doe' })
  actorName!: string | null;

  @ApiProperty({ example: 'Updated user permissions' })
  description!: string;

  @ApiProperty({ ...JSON_OBJECT_SCHEMA, example: { source: 'admin-dashboard' } })
  metadata!: JsonObject;

  @ApiProperty({ ...JSON_OBJECT_SCHEMA, nullable: true, example: { role: 'USER' } })
  before!: JsonObject | null;

  @ApiProperty({ ...JSON_OBJECT_SCHEMA, nullable: true, example: { role: 'ADMIN' } })
  after!: JsonObject | null;

  @ApiProperty({ type: String, nullable: true, example: '127.0.0.1' })
  ipAddress!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Mozilla/5.0' })
  userAgent!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'req_abc123' })
  correlationId!: string | null;

  @ApiProperty({ example: 'example-app' })
  source!: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-05T14:03:22.418Z' })
  createdAt!: string;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 150 })
  total!: number;

  @ApiProperty({ example: 8, description: '0 when there are no results' })
  totalPages!: number;
}

export class AuditEventListResponseDto {
  @ApiProperty({ type: [AuditEventResponseDto] })
  data!: AuditEventResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
