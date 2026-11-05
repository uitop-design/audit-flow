import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { ApiError, apiGet } from './client';

describe('apiGet', () => {
  it('returns the parsed JSON body', async () => {
    server.use(http.get('*/api/v1/things', () => HttpResponse.json({ ok: true })));

    await expect(apiGet('/api/v1/things')).resolves.toEqual({ ok: true });
  });

  it('serialises query parameters and skips empty values', async () => {
    let received: URLSearchParams | null = null;
    server.use(
      http.get('*/api/v1/things', ({ request }) => {
        received = new URL(request.url).searchParams;
        return HttpResponse.json({});
      }),
    );

    await apiGet('/api/v1/things', {
      query: { page: 2, search: 'a&b=c', empty: '', missing: undefined, none: null, flag: false },
    });

    expect(received && Object.fromEntries(received)).toEqual({
      page: '2',
      search: 'a&b=c',
      flag: 'false',
    });
  });

  it('turns the uniform error body into an ApiError', async () => {
    server.use(
      http.get('*/api/v1/things', () =>
        HttpResponse.json(
          {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Request validation failed',
            details: [{ field: 'limit', message: 'limit must not be greater than 100' }],
            path: '/api/v1/things',
            requestId: 'req-42',
            timestamp: '2026-11-05T12:00:00.000Z',
          },
          { status: 400 },
        ),
      ),
    );

    const error = await apiGet('/api/v1/things').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      message: 'Request validation failed',
      isClientError: true,
    });
    expect((error as ApiError).requestId).toBe('req-42');
    expect((error as ApiError).errorResponse?.details).toHaveLength(1);
  });

  it('handles error responses that are not JSON', async () => {
    server.use(http.get('*/api/v1/things', () => new HttpResponse('Bad gateway', { status: 502 })));

    const error = (await apiGet('/api/v1/things').catch((caught: unknown) => caught)) as ApiError;

    expect(error.status).toBe(502);
    expect(error.message).toBe('Request failed with status 502');
    expect(error.errorResponse).toBeNull();
  });

  it('reports an unreachable API with status 0', async () => {
    server.use(http.get('*/api/v1/things', () => HttpResponse.error()));

    const error = (await apiGet('/api/v1/things').catch((caught: unknown) => caught)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });
});
