import { ApiProperty } from '@nestjs/swagger';
import { AuditEventResponseDto } from './audit-event-response.dto.js';

export class EventTypeCountDto {
  @ApiProperty({ example: 'AUTH' })
  eventType!: string;

  @ApiProperty({ example: 52 })
  count!: number;
}

export class DailyEventCountDto {
  @ApiProperty({ example: '2026-11-05', description: 'UTC calendar day' })
  date!: string;

  @ApiProperty({ example: 23 })
  count!: number;
}

export class AuditEventStatsResponseDto {
  @ApiProperty({ example: 184 })
  totalEvents!: number;

  @ApiProperty({ example: 23 })
  eventsLast24h!: number;

  @ApiProperty({ example: 14, description: 'Distinct non-null actorId values' })
  uniqueActors!: number;

  @ApiProperty({
    type: EventTypeCountDto,
    nullable: true,
    description: 'null when there are no events',
  })
  topEventType!: EventTypeCountDto | null;

  @ApiProperty({ type: [EventTypeCountDto], description: 'Sorted by count, descending' })
  byEventType!: EventTypeCountDto[];

  @ApiProperty({
    type: [DailyEventCountDto],
    description: 'Last 14 UTC days, oldest first, zero-filled',
  })
  dailyVolume!: DailyEventCountDto[];

  @ApiProperty({ type: [AuditEventResponseDto], description: 'The 5 most recent events' })
  recentEvents!: AuditEventResponseDto[];

  @ApiProperty({ format: 'date-time' })
  generatedAt!: string;
}

export class AuditEventFacetsResponseDto {
  @ApiProperty({ type: [String], example: ['AUTH', 'PROJECT', 'USER'] })
  eventTypes!: string[];

  @ApiProperty({ type: [String], example: ['PROJECT_CREATED', 'USER_SIGNED_IN'] })
  actions!: string[];

  @ApiProperty({ type: [String], example: ['API_KEY', 'PROJECT', 'USER'] })
  resourceTypes!: string[];

  @ApiProperty({ type: [String], example: ['admin-dashboard', 'billing-service'] })
  sources!: string[];
}
