import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DatabaseCheckDto {
  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  status!: 'up' | 'down';

  @ApiPropertyOptional({ example: 2, description: 'Round-trip time of a trivial query' })
  latencyMs?: number;
}

export class HealthChecksDto {
  @ApiProperty({ type: DatabaseCheckDto })
  database!: DatabaseCheckDto;
}

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  status!: 'ok' | 'error';

  @ApiProperty({ type: HealthChecksDto })
  checks!: HealthChecksDto;

  @ApiProperty({ example: 512 })
  uptimeSeconds!: number;

  @ApiProperty({ example: '2026-11-05T14:03:22.418Z', format: 'date-time' })
  timestamp!: string;
}
