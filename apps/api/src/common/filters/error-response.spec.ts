import { BadRequestException, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { RequestValidationException } from '../pipes/validation.pipe.js';
import { toErrorResponse } from './error-response.js';

const context = {
  method: 'GET',
  originalUrl: '/api/v1/audit-events',
  path: '/api/v1/audit-events',
  requestId: 'req-123',
  timestamp: new Date('2026-11-05T12:00:00.000Z'),
};

describe('toErrorResponse', () => {
  it('maps validation failures to 400 with field details', () => {
    const exception = new RequestValidationException([
      { field: 'actorEmail', message: 'actorEmail must be an email' },
    ]);

    expect(toErrorResponse(exception, context)).toEqual({
      status: 400,
      unexpected: false,
      body: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Request validation failed',
        details: [{ field: 'actorEmail', message: 'actorEmail must be an email' }],
        path: '/api/v1/audit-events',
        requestId: 'req-123',
        timestamp: '2026-11-05T12:00:00.000Z',
      },
    });
  });

  it('keeps the message of expected HTTP errors and omits details', () => {
    const { status, body, unexpected } = toErrorResponse(
      new NotFoundException('Audit event not found'),
      context,
    );

    expect(status).toBe(404);
    expect(unexpected).toBe(false);
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Audit event not found',
    });
    expect(body).not.toHaveProperty('details');
  });

  it('strips the query string from the unknown-route message', () => {
    const exception = new NotFoundException('Cannot GET /api/v1/nope?email=private@example.com');

    const { body } = toErrorResponse(exception, {
      ...context,
      originalUrl: '/api/v1/nope?email=private@example.com',
      path: '/api/v1/nope',
    });

    expect(body.message).toBe('Cannot GET /api/v1/nope');
  });

  it('joins array messages produced by built-in Nest pipes', () => {
    const exception = new BadRequestException(['first problem', 'second problem']);

    expect(toErrorResponse(exception, context).body.message).toBe('first problem; second problem');
  });

  it('hides unexpected errors behind a generic 500 and flags them for logging', () => {
    const leaky = new Error('connect ECONNREFUSED postgres://admin:hunter2@db:5432');

    const response = toErrorResponse(leaky, context);

    expect(response.status).toBe(500);
    expect(response.unexpected).toBe(true);
    expect(response.body).toMatchObject({
      error: 'Internal Server Error',
      message: 'Internal server error',
    });
    expect(JSON.stringify(response.body)).not.toMatch(/hunter2|ECONNREFUSED|stack/);
  });

  it('treats non-Error throwables as unexpected', () => {
    expect(toErrorResponse('boom', context).status).toBe(500);
    expect(toErrorResponse(null, context).status).toBe(500);
  });

  it('uses the status of expected HTTP errors such as 413', () => {
    expect(toErrorResponse(new PayloadTooLargeException(), context).status).toBe(413);
  });
});
