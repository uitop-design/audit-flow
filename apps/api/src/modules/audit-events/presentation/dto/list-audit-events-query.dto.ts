import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../../../common/decorators/trim.decorator.js';
import {
  IsIsoDateTimeWithOffset,
  IsLaterThan,
} from '../../../../common/validators/date.validators.js';
import { AUDIT_EVENT_LIMITS as LIMITS } from '../../domain/audit-event.js';
import {
  AUDIT_EVENT_SORT_FIELDS,
  type AuditEventSortField,
  PAGINATION,
  SEARCH_MAX_LENGTH,
  SORT_ORDERS,
  type SortOrder,
} from '../../domain/audit-event-query.js';

/**
 * Query string for listing events. Unknown parameters are rejected rather than ignored.
 * Validators are ordered bottom-up (basic checks nearest the property); see CreateAuditEventDto.
 */
export class ListAuditEventsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @Min(1)
  @IsInt()
  page = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: PAGINATION.maxLimit,
    default: PAGINATION.defaultLimit,
  })
  @Type(() => Number)
  @Max(PAGINATION.maxLimit)
  @Min(1)
  @IsInt()
  limit: number = PAGINATION.defaultLimit;

  @ApiPropertyOptional({
    maxLength: SEARCH_MAX_LENGTH,
    description:
      'Case-insensitive substring match on description, actor email/name/id, resource id, action and correlation id.',
  })
  @Trim()
  @IsOptional()
  @MaxLength(SEARCH_MAX_LENGTH)
  @IsNotEmpty()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'USER', description: 'Exact match' })
  @IsOptional()
  @MaxLength(LIMITS.eventTypeMaxLength)
  @IsNotEmpty()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({ example: 'USER_UPDATED', description: 'Exact match' })
  @IsOptional()
  @MaxLength(LIMITS.actionMaxLength)
  @IsNotEmpty()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: 'PROJECT', description: 'Exact match' })
  @IsOptional()
  @MaxLength(LIMITS.resourceTypeMaxLength)
  @IsNotEmpty()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Exact match' })
  @IsOptional()
  @MaxLength(LIMITS.resourceIdMaxLength)
  @IsNotEmpty()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Exact match' })
  @IsOptional()
  @MaxLength(LIMITS.actorIdMaxLength)
  @IsNotEmpty()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({ example: 'admin-dashboard', description: 'Exact match' })
  @IsOptional()
  @MaxLength(LIMITS.sourceMaxLength)
  @IsNotEmpty()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Exact match; finds every event of one operation.' })
  @IsOptional()
  @MaxLength(LIMITS.correlationIdMaxLength)
  @IsNotEmpty()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-11-01T00:00:00Z',
    description: 'Inclusive lower bound on createdAt. Must include a time zone.',
  })
  @IsOptional()
  @IsIsoDateTimeWithOffset()
  dateFrom?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-11-06T00:00:00Z',
    description:
      'Exclusive upper bound on createdAt. Must include a time zone and be later than dateFrom.',
  })
  @IsOptional()
  @IsLaterThan('dateFrom')
  @IsIsoDateTimeWithOffset()
  dateTo?: string;

  @ApiPropertyOptional({ enum: AUDIT_EVENT_SORT_FIELDS, default: 'createdAt' })
  @IsIn(AUDIT_EVENT_SORT_FIELDS)
  sortBy: AuditEventSortField = 'createdAt';

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'desc' })
  @IsIn(SORT_ORDERS)
  sortOrder: SortOrder = 'desc';
}
