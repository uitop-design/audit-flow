import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIP,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Trim } from '../../../../common/decorators/trim.decorator.js';
import type { JsonObject } from '../../../../common/json.js';
import { IsJsonObject, MaxJsonBytes } from '../../../../common/validators/json.validators.js';
import {
  CORRELATION_ID_PATTERN,
  IDENTIFIER_PATTERN,
  AUDIT_EVENT_LIMITS as LIMITS,
  SOURCE_PATTERN,
} from '../../domain/audit-event.js';

const identifierMessage = (example: string) => ({
  message: `$property must be SCREAMING_SNAKE_CASE, e.g. ${example}`,
});

const JSON_OBJECT_SCHEMA = { type: 'object', additionalProperties: true } as const;

/**
 * Request body for recording an event. `id` and `createdAt` are not accepted: the server assigns both.
 *
 * class-validator evaluates property decorators bottom-up and the pipe stops at the first failure,
 * so the most basic check (type) sits closest to the property and stricter rules sit above it.
 */
export class CreateAuditEventDto {
  @ApiProperty({
    example: 'USER',
    maxLength: LIMITS.eventTypeMaxLength,
    pattern: IDENTIFIER_PATTERN.source,
    description: 'Broad category of the event.',
  })
  @Trim()
  @Matches(IDENTIFIER_PATTERN, identifierMessage('USER'))
  @MaxLength(LIMITS.eventTypeMaxLength)
  @IsString()
  eventType!: string;

  @ApiProperty({
    example: 'USER_UPDATED',
    maxLength: LIMITS.actionMaxLength,
    pattern: IDENTIFIER_PATTERN.source,
    description: 'What happened.',
  })
  @Trim()
  @Matches(IDENTIFIER_PATTERN, identifierMessage('USER_UPDATED'))
  @MaxLength(LIMITS.actionMaxLength)
  @IsString()
  action!: string;

  @ApiProperty({
    example: 'USER',
    maxLength: LIMITS.resourceTypeMaxLength,
    pattern: IDENTIFIER_PATTERN.source,
    description: 'Kind of resource that was acted on.',
  })
  @Trim()
  @Matches(IDENTIFIER_PATTERN, identifierMessage('PROJECT'))
  @MaxLength(LIMITS.resourceTypeMaxLength)
  @IsString()
  resourceType!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'usr_123',
    maxLength: LIMITS.resourceIdMaxLength,
  })
  @Trim()
  @IsOptional()
  @MaxLength(LIMITS.resourceIdMaxLength)
  @IsNotEmpty()
  @IsString()
  resourceId?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'usr_456',
    maxLength: LIMITS.actorIdMaxLength,
  })
  @Trim()
  @IsOptional()
  @MaxLength(LIMITS.actorIdMaxLength)
  @IsNotEmpty()
  @IsString()
  actorId?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    format: 'email',
    example: 'admin@example.com',
    maxLength: LIMITS.actorEmailMaxLength,
  })
  @Trim()
  @IsOptional()
  @IsEmail()
  @MaxLength(LIMITS.actorEmailMaxLength)
  @IsString()
  actorEmail?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'John Doe',
    maxLength: LIMITS.actorNameMaxLength,
  })
  @Trim()
  @IsOptional()
  @MaxLength(LIMITS.actorNameMaxLength)
  @IsNotEmpty()
  @IsString()
  actorName?: string | null;

  @ApiProperty({ example: 'Updated user permissions', maxLength: LIMITS.descriptionMaxLength })
  @Trim()
  @MaxLength(LIMITS.descriptionMaxLength)
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    ...JSON_OBJECT_SCHEMA,
    example: { source: 'admin-dashboard' },
    description: `Free-form context. Defaults to {}. At most ${LIMITS.metadataMaxBytes} bytes as JSON.`,
  })
  @IsOptional()
  @MaxJsonBytes(LIMITS.metadataMaxBytes)
  @IsJsonObject()
  metadata?: JsonObject | null;

  @ApiPropertyOptional({
    ...JSON_OBJECT_SCHEMA,
    nullable: true,
    example: { role: 'USER' },
    description: `State before the change. At most ${LIMITS.snapshotMaxBytes} bytes as JSON.`,
  })
  @IsOptional()
  @MaxJsonBytes(LIMITS.snapshotMaxBytes)
  @IsJsonObject()
  before?: JsonObject | null;

  @ApiPropertyOptional({
    ...JSON_OBJECT_SCHEMA,
    nullable: true,
    example: { role: 'ADMIN' },
    description: `State after the change. At most ${LIMITS.snapshotMaxBytes} bytes as JSON.`,
  })
  @IsOptional()
  @MaxJsonBytes(LIMITS.snapshotMaxBytes)
  @IsJsonObject()
  after?: JsonObject | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '127.0.0.1',
    description: 'IPv4 or IPv6',
  })
  @Trim()
  @IsOptional()
  @IsIP()
  ipAddress?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Mozilla/5.0',
    maxLength: LIMITS.userAgentMaxLength,
  })
  @Trim()
  @IsOptional()
  @MaxLength(LIMITS.userAgentMaxLength)
  @IsNotEmpty()
  @IsString()
  userAgent?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'req_abc123',
    maxLength: LIMITS.correlationIdMaxLength,
    pattern: CORRELATION_ID_PATTERN.source,
    description: 'Groups events that belong to one operation or request.',
  })
  @Trim()
  @IsOptional()
  @Matches(CORRELATION_ID_PATTERN, {
    message: '$property may contain only letters, digits and . _ : -',
  })
  @MaxLength(LIMITS.correlationIdMaxLength)
  @IsString()
  correlationId?: string | null;

  @ApiProperty({
    example: 'example-app',
    maxLength: LIMITS.sourceMaxLength,
    pattern: SOURCE_PATTERN.source,
    description: 'The system that produced the event.',
  })
  @Trim()
  @Matches(SOURCE_PATTERN, {
    message:
      '$property must be lower-case letters, digits, dots, underscores or hyphens, e.g. billing-service',
  })
  @MaxLength(LIMITS.sourceMaxLength)
  @IsString()
  source!: string;
}
