import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ErrorResponseBody } from '../filters/error-response.js';
import type { ValidationIssue } from '../pipes/validation.pipe.js';

export class ValidationIssueDto implements ValidationIssue {
  @ApiProperty({ example: 'actorEmail' })
  field!: string;

  @ApiProperty({ example: 'actorEmail must be an email' })
  message!: string;
}

export class ErrorResponseDto implements ErrorResponseBody {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({ example: 'Request validation failed' })
  message!: string;

  @ApiPropertyOptional({
    type: [ValidationIssueDto],
    description: 'Present only for validation errors',
  })
  details?: ValidationIssueDto[];

  @ApiProperty({ example: '/api/v1/audit-events' })
  path!: string;

  @ApiProperty({ example: '6f1c2b9e-1d2a-4c6f-9a51-0f3b8f8e2d11' })
  requestId!: string;

  @ApiProperty({ example: '2026-11-05T14:03:22.418Z', format: 'date-time' })
  timestamp!: string;
}
