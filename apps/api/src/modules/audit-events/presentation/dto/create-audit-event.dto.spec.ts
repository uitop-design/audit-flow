import type { ArgumentMetadata } from '@nestjs/common';
import {
  createValidationPipe,
  RequestValidationException,
  type ValidationIssue,
} from '../../../../common/pipes/validation.pipe.js';
import { CreateAuditEventDto } from './create-audit-event.dto.js';

const metadata: ArgumentMetadata = { type: 'body', metatype: CreateAuditEventDto };

const minimal = {
  eventType: 'USER',
  action: 'USER_UPDATED',
  resourceType: 'USER',
  description: 'Updated user permissions',
  source: 'example-app',
};

function validate(body: unknown): Promise<CreateAuditEventDto> {
  return createValidationPipe().transform(body, metadata);
}

async function issuesFor(body: unknown): Promise<ValidationIssue[]> {
  try {
    await validate(body);
  } catch (error) {
    if (error instanceof RequestValidationException) {
      return [...error.issues];
    }
    throw error;
  }
  throw new Error('Expected validation to fail');
}

async function messageFor(field: string, body: unknown): Promise<string | undefined> {
  return (await issuesFor(body)).find((issue) => issue.field === field)?.message;
}

describe('CreateAuditEventDto', () => {
  it('accepts the minimal payload', async () => {
    await expect(validate(minimal)).resolves.toMatchObject(minimal);
  });

  it('trims strings before validating them', async () => {
    const dto = await validate({ ...minimal, description: '  Signed in  ', actorId: ' usr_1 ' });

    expect(dto.description).toBe('Signed in');
    expect(dto.actorId).toBe('usr_1');
  });

  it('keeps arbitrary keys inside JSON fields', async () => {
    const dto = await validate({
      ...minimal,
      metadata: { nested: { list: [1, 'two', null] }, flag: true },
      before: { role: 'USER' },
    });

    expect(dto.metadata).toEqual({ nested: { list: [1, 'two', null] }, flag: true });
    expect(dto.before).toEqual({ role: 'USER' });
  });

  it('accepts explicit nulls for optional fields', async () => {
    await expect(
      validate({ ...minimal, resourceId: null, before: null, ipAddress: null, metadata: null }),
    ).resolves.toBeDefined();
  });

  describe('required fields', () => {
    it.each(['eventType', 'action', 'resourceType', 'description', 'source'])(
      'reports a missing %s as "must be a string"',
      async (field) => {
        const body: Record<string, unknown> = { ...minimal };
        delete body[field];

        expect(await messageFor(field, body)).toBe(`${field} must be a string`);
      },
    );

    it('rejects a whitespace-only description', async () => {
      expect(await messageFor('description', { ...minimal, description: '   ' })).toBe(
        'description should not be empty',
      );
    });
  });

  describe('identifier format', () => {
    it.each(['user', 'User_Updated', 'USER-UPDATED', '1USER', 'USER UPDATED'])(
      'rejects eventType %p',
      async (eventType) => {
        expect(await messageFor('eventType', { ...minimal, eventType })).toBe(
          'eventType must be SCREAMING_SNAKE_CASE, e.g. USER',
        );
      },
    );

    it('rejects a source that is not lower kebab case', async () => {
      expect(await messageFor('source', { ...minimal, source: 'Billing Service' })).toMatch(
        /^source must be lower-case/,
      );
    });

    it('rejects a correlation id with unsupported characters', async () => {
      expect(await messageFor('correlationId', { ...minimal, correlationId: 'req abc' })).toBe(
        'correlationId may contain only letters, digits and . _ : -',
      );
    });
  });

  describe('lengths', () => {
    it.each([
      ['eventType', 'A'.repeat(65), 64],
      ['description', 'x'.repeat(1001), 1000],
      ['actorName', 'x'.repeat(201), 200],
      ['userAgent', 'x'.repeat(513), 512],
    ])('rejects a %s longer than its limit', async (field, value, limit) => {
      expect(await messageFor(field, { ...minimal, [field]: value })).toBe(
        `${field} must be shorter than or equal to ${limit} characters`,
      );
    });
  });

  describe('formats', () => {
    it('rejects an invalid email', async () => {
      expect(await messageFor('actorEmail', { ...minimal, actorEmail: 'not-an-email' })).toBe(
        'actorEmail must be an email',
      );
    });

    it.each(['127.0.0.1', '::1', '2001:db8::1'])('accepts IP address %s', async (ipAddress) => {
      await expect(validate({ ...minimal, ipAddress })).resolves.toMatchObject({ ipAddress });
    });

    it.each(['256.0.0.1', 'localhost', ''])('rejects IP address %p', async (ipAddress) => {
      expect(await messageFor('ipAddress', { ...minimal, ipAddress })).toBe(
        'ipAddress must be an ip address',
      );
    });
  });

  describe('JSON fields', () => {
    it.each([
      ['an array', [1, 2]],
      ['a string', '{"a":1}'],
      ['a number', 42],
    ])('rejects metadata that is %s', async (_label, value) => {
      expect(await messageFor('metadata', { ...minimal, metadata: value })).toBe(
        'metadata must be a JSON object',
      );
    });

    it('limits metadata to 16 KB when serialized', async () => {
      const metadata = { blob: 'x'.repeat(16 * 1024) };

      expect(await messageFor('metadata', { ...minimal, metadata })).toBe(
        'metadata must not exceed 16384 bytes when serialized as JSON',
      );
    });

    it('counts UTF-8 bytes, not characters', async () => {
      // 6000 three-byte characters = 18000 bytes, under 16384 characters but over 16384 bytes.
      const metadata = { text: '€'.repeat(6000) };

      expect(await messageFor('metadata', { ...minimal, metadata })).toMatch(/must not exceed/);
    });

    it('limits before/after snapshots to 32 KB', async () => {
      const after = { blob: 'x'.repeat(32 * 1024) };

      expect(await messageFor('after', { ...minimal, after })).toBe(
        'after must not exceed 32768 bytes when serialized as JSON',
      );
    });
  });

  describe('server-owned and unknown fields', () => {
    it.each(['id', 'createdAt', 'updatedAt', 'tenantId'])('rejects %s', async (field) => {
      expect(await messageFor(field, { ...minimal, [field]: 'x' })).toBe(
        `property ${field} should not exist`,
      );
    });
  });
});
