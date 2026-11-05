import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPayloadTooLargeResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto.js';
import { apiPath } from '../../../common/http/api-path.js';
import { AuditEventService } from '../application/audit-event.service.js';
import {
  toAuditEventFacetsResponse,
  toAuditEventListResponse,
  toAuditEventQuery,
  toAuditEventResponse,
  toAuditEventStatsResponse,
  toNewAuditEvent,
} from './audit-event.presenter.js';
import {
  AuditEventListResponseDto,
  AuditEventResponseDto,
} from './dto/audit-event-response.dto.js';
import {
  AuditEventFacetsResponseDto,
  AuditEventStatsResponseDto,
} from './dto/audit-event-stats-response.dto.js';
import { CreateAuditEventDto } from './dto/create-audit-event.dto.js';
import { ListAuditEventsQueryDto } from './dto/list-audit-events-query.dto.js';

const RESOURCE = 'audit-events';

/**
 * Audit events can be recorded and read. There are deliberately no update or delete routes:
 * recorded events are immutable.
 */
@ApiTags('audit-events')
@ApiInternalServerErrorResponse({ type: ErrorResponseDto, description: 'Unexpected error' })
@Controller(RESOURCE)
export class AuditEventsController {
  constructor(private readonly auditEvents: AuditEventService) {}

  @Post()
  @ApiOperation({
    summary: 'Record an audit event',
    description:
      'Stores an immutable audit event. The server assigns `id` and `createdAt`; clients cannot set them. ' +
      'Intended for trusted producers only: protect this endpoint before production use.',
  })
  @ApiCreatedResponse({
    type: AuditEventResponseDto,
    description: 'The recorded event',
    headers: { Location: { description: 'URL of the new event', schema: { type: 'string' } } },
  })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Invalid payload' })
  @ApiPayloadTooLargeResponse({ type: ErrorResponseDto, description: 'Body larger than 128 KB' })
  async record(
    @Body() body: CreateAuditEventDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuditEventResponseDto> {
    const event = await this.auditEvents.record(toNewAuditEvent(body));
    res.location(apiPath(RESOURCE, event.id));
    return toAuditEventResponse(event);
  }

  @Get()
  @ApiOperation({ summary: 'List audit events with filtering, sorting and pagination' })
  @ApiOkResponse({ type: AuditEventListResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Invalid query parameters' })
  async list(@Query() query: ListAuditEventsQueryDto): Promise<AuditEventListResponseDto> {
    const page = await this.auditEvents.list(toAuditEventQuery(query));
    return toAuditEventListResponse(page);
  }

  // Static segments are declared before `:id` so they are not captured by it.
  @Get('stats')
  @ApiOperation({ summary: 'Aggregate statistics for the dashboard' })
  @ApiOkResponse({ type: AuditEventStatsResponseDto })
  async stats(): Promise<AuditEventStatsResponseDto> {
    return toAuditEventStatsResponse(await this.auditEvents.getStats());
  }

  @Get('facets')
  @ApiOperation({ summary: 'Distinct values for filter options' })
  @ApiOkResponse({ type: AuditEventFacetsResponseDto })
  async facets(): Promise<AuditEventFacetsResponseDto> {
    return toAuditEventFacetsResponse(await this.auditEvents.getFacets());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one audit event' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: AuditEventResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'id is not a UUID' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'No event with this id' })
  async get(@Param('id', new ParseUUIDPipe()) id: string): Promise<AuditEventResponseDto> {
    return toAuditEventResponse(await this.auditEvents.getById(id));
  }
}
