import { Body, Controller, Get, Post } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import request from 'supertest';
import { createTestApp } from '../support/create-test-app.js';

class TagDto {
  @IsString()
  label!: string;
}

class EchoDto {
  @IsString()
  @MaxLength(20)
  name!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TagDto)
  tag?: TagDto;
}

/** Test-only routes that exercise the shared HTTP pipeline. */
@Controller('pipeline-probe')
class PipelineProbeController {
  @Post()
  echo(@Body() body: EchoDto): EchoDto {
    return body;
  }

  @Get('crash')
  crash(): never {
    throw new Error('connect ECONNREFUSED postgres://admin:hunter2@db:5432');
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('HTTP pipeline', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [PipelineProbeController] });
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  describe('error format', () => {
    it('returns the uniform body for unknown routes', async () => {
      const response = await http()
        .get('/api/v1/does-not-exist?email=someone@example.com')
        .expect(404);

      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Cannot GET /api/v1/does-not-exist',
        path: '/api/v1/does-not-exist',
        requestId: response.headers['x-request-id'],
        timestamp: expect.stringMatching(/Z$/),
      });
    });

    it('hides unexpected errors behind a generic 500', async () => {
      const response = await http().get('/api/v1/pipeline-probe/crash').expect(500);

      expect(response.body).toMatchObject({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal server error',
      });
      expect(JSON.stringify(response.body)).not.toMatch(/hunter2|ECONNREFUSED|at .*\.ts/);
    });
  });

  describe('validation', () => {
    it('accepts a valid body', async () => {
      const response = await http()
        .post('/api/v1/pipeline-probe')
        .send({ name: 'Ada', tag: { label: 'admin' } })
        .expect(201);

      expect(response.body).toEqual({ name: 'Ada', tag: { label: 'admin' } });
    });

    it('reports field-level details, including nested paths', async () => {
      const response = await http()
        .post('/api/v1/pipeline-probe')
        .send({ name: 'x'.repeat(21), tag: { label: 42 } })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'Request validation failed',
        details: [
          { field: 'name', message: 'name must be shorter than or equal to 20 characters' },
          { field: 'tag.label', message: 'label must be a string' },
        ],
      });
    });

    it('rejects properties the server owns or does not know', async () => {
      const response = await http()
        .post('/api/v1/pipeline-probe')
        .send({ name: 'Ada', id: 'x', createdAt: '2020-01-01T00:00:00Z' })
        .expect(400);

      expect(response.body.details).toEqual([
        { field: 'id', message: 'property id should not exist' },
        { field: 'createdAt', message: 'property createdAt should not exist' },
      ]);
    });
  });

  describe('request body parsing', () => {
    it('rejects malformed JSON with a 400 in the uniform format', async () => {
      const response = await http()
        .post('/api/v1/pipeline-probe')
        .set('Content-Type', 'application/json')
        .send('{"name": "Ada",')
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Malformed JSON request body',
        requestId: response.headers['x-request-id'],
      });
    });

    it('rejects bodies over 128 KB with 413', async () => {
      const response = await http()
        .post('/api/v1/pipeline-probe')
        .send({ name: 'Ada', padding: 'x'.repeat(130 * 1024) })
        .expect(413);

      expect(response.body).toMatchObject({
        statusCode: 413,
        error: 'Payload Too Large',
        message: 'Request body is too large',
      });
    });
  });

  describe('request id', () => {
    it('echoes a well-formed incoming X-Request-Id', async () => {
      const response = await http().get('/api/v1/health').set('X-Request-Id', 'gateway-abc.123');

      expect(response.headers['x-request-id']).toBe('gateway-abc.123');
    });

    it('replaces a malformed X-Request-Id with a generated UUID', async () => {
      const response = await http().get('/api/v1/health').set('X-Request-Id', 'bad id <script>');

      expect(response.headers['x-request-id']).toMatch(UUID);
    });

    it('generates one when none is sent', async () => {
      const response = await http().get('/api/v1/health');

      expect(response.headers['x-request-id']).toMatch(UUID);
    });
  });

  describe('security headers and CORS', () => {
    it('sets standard security headers', async () => {
      const response = await http().get('/api/v1/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('allows configured origins', async () => {
      const response = await http().get('/api/v1/health').set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('does not allow other origins', async () => {
      const response = await http().get('/api/v1/health').set('Origin', 'https://evil.example');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('OpenAPI documentation', () => {
    it('serves the OpenAPI document', async () => {
      const response = await http().get('/api/docs-json').expect(200);

      expect(response.body.info.title).toBe('AuditFlow API');
      expect(response.body.paths).toHaveProperty('/api/v1/health');
    });

    it('serves Swagger UI', async () => {
      const response = await http().get('/api/docs').expect(200);

      expect(response.headers['content-type']).toContain('text/html');
    });
  });
});
