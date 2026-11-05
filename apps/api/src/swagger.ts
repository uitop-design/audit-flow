import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'api/docs';
export const OPENAPI_JSON_PATH = 'api/docs-json';

const DESCRIPTION = `
REST API for recording and querying immutable audit events.

> **No authentication in this MVP.** All endpoints, including event ingestion, assume a trusted
> network. Before exposing this API, protect ingestion with service-to-service credentials and
> rate limiting, and protect read endpoints with operator authentication and access control.

Audit events can contain personal data (emails, IP addresses, user agents, before/after snapshots).
Treat responses as sensitive.
`.trim();

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('AuditFlow API')
    .setDescription(DESCRIPTION)
    .setVersion('1.0.0')
    .build();
  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup(SWAGGER_PATH, app, () => createOpenApiDocument(app), {
    jsonDocumentUrl: OPENAPI_JSON_PATH,
    customSiteTitle: 'AuditFlow API',
  });
}
