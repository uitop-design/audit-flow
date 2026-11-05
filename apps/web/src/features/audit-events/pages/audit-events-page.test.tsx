import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import type { AuditEventList } from '@/lib/api/types';
import { buildAuditEvent, buildAuditEventList } from '@/test/fixtures';
import { renderRoute } from '@/test/render';
import { server } from '@/test/server';

const EVENTS = [
  buildAuditEvent({
    id: 'evt-1',
    action: 'USER_SIGNED_IN',
    eventType: 'AUTH',
    actorName: 'Amara Okafor',
    actorEmail: 'amara@northwind.example',
    description: 'Signed in with SSO',
    resourceType: 'SESSION',
    resourceId: 'ses_123',
    source: 'auth-service',
  }),
  buildAuditEvent({
    id: 'evt-2',
    action: 'SESSION_CLEANUP_COMPLETED',
    eventType: 'SYSTEM',
    actorId: null,
    actorEmail: null,
    actorName: null,
    description: 'Removed expired sessions',
    source: 'scheduler',
  }),
];

/** Serves the list endpoint and records the query string of every request. */
function serveList(
  respond: (params: URLSearchParams) => AuditEventList | Response = () =>
    buildAuditEventList(EVENTS),
) {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get('*/api/v1/audit-events', ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      const result = respond(params);
      return result instanceof Response ? result : HttpResponse.json(result);
    }),
  );
  return { requests, last: () => Object.fromEntries(requests.at(-1) ?? []) };
}

describe('AuditEventsPage', () => {
  it('shows skeleton rows, then events from the API', async () => {
    const api = serveList();
    renderRoute('/events');

    expect(await screen.findAllByTestId('skeleton-row')).not.toHaveLength(0);
    const table = await screen.findByRole('table');
    expect(await within(table).findByText('Amara Okafor')).toBeInTheDocument();
    expect(within(table).getByText('User signed in')).toBeInTheDocument();
    expect(within(table).getByText('ses_123')).toBeInTheDocument();
    expect(within(table).getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–2 of 2 events')).toBeInTheDocument();
    expect(api.last()).toEqual({ page: '1', limit: '20', sortBy: 'createdAt', sortOrder: 'desc' });
  });

  it('turns URL filters into API parameters', async () => {
    const api = serveList((params) =>
      buildAuditEventList(EVENTS, { page: Number(params.get('page')), total: 60 }),
    );
    renderRoute(
      '/events?eventType=AUTH&actorId=usr_1&from=2026-11-01&to=2026-11-05&page=2&sortBy=action&sortOrder=asc',
    );

    await screen.findByText('Amara Okafor');
    expect(api.last()).toEqual({
      page: '2',
      limit: '20',
      eventType: 'AUTH',
      actorId: 'usr_1',
      dateFrom: '2026-11-01T00:00:00.000Z',
      dateTo: '2026-11-06T00:00:00.000Z',
      sortBy: 'action',
      sortOrder: 'asc',
    });
    const chips = screen.getByRole('list', { name: 'Active filters' });
    expect(within(chips).getByText('AUTH')).toBeInTheDocument();
    expect(within(chips).getByText('Nov 1 – Nov 5, 2026')).toBeInTheDocument();
  });

  it('searches after the user stops typing and resets to the first page', async () => {
    const api = serveList();
    const { user, router } = renderRoute('/events?page=3');
    await screen.findByText('Amara Okafor');

    await user.type(screen.getByRole('searchbox', { name: 'Search events' }), 'amara');

    await waitFor(() => expect(api.last().search).toBe('amara'));
    expect(api.requests.filter((params) => params.get('search')?.startsWith('a'))).toHaveLength(1);
    expect(router.state.location.search).toBe('?search=amara');
  });

  it('filters by event type from the facets and removes the filter from its chip', async () => {
    const api = serveList();
    const { user, router } = renderRoute('/events');
    await screen.findByText('Amara Okafor');

    await user.click(screen.getByRole('combobox', { name: 'Event type' }));
    await user.click(await screen.findByRole('option', { name: 'PROJECT' }));

    await waitFor(() => expect(api.last().eventType).toBe('PROJECT'));
    expect(router.state.location.search).toBe('?eventType=PROJECT');

    await user.click(screen.getByRole('button', { name: 'Remove event type filter' }));
    await waitFor(() => expect(api.last().eventType).toBeUndefined());
    expect(router.state.location.search).toBe('');
  });

  it('sorts on the server when a column header is clicked', async () => {
    // A system event (no actor email) first, as in real data: the first click must still sort ascending.
    const api = serveList(() =>
      buildAuditEventList([EVENTS[1], EVENTS[0]].filter((event) => event !== undefined)),
    );
    const { user } = renderRoute('/events');
    await screen.findByText('Amara Okafor');

    const actorHeader = screen.getByRole('columnheader', { name: /Actor/ });
    expect(actorHeader).toHaveAttribute('aria-sort', 'none');
    expect(screen.getByRole('columnheader', { name: /Timestamp/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    await user.click(within(actorHeader).getByRole('button'));
    await waitFor(() =>
      expect(api.last()).toMatchObject({ sortBy: 'actorEmail', sortOrder: 'asc' }),
    );
    expect(screen.getByRole('columnheader', { name: /Actor/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );

    await user.click(
      within(screen.getByRole('columnheader', { name: /Actor/ })).getByRole('button'),
    );
    await waitFor(() =>
      expect(api.last()).toMatchObject({ sortBy: 'actorEmail', sortOrder: 'desc' }),
    );
  });

  it('pages through results and changes the page size', async () => {
    const api = serveList((params) =>
      buildAuditEventList(EVENTS, {
        page: Number(params.get('page')),
        limit: Number(params.get('limit')),
        total: 45,
      }),
    );
    const { user } = renderRoute('/events');
    await screen.findByText('Showing 1–20 of 45 events');

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(api.last().page).toBe('2'));
    expect(await screen.findByText('Showing 21–40 of 45 events')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Rows per page' }));
    await user.click(await screen.findByRole('option', { name: '50' }));
    await waitFor(() => expect(api.last()).toMatchObject({ page: '1', limit: '50' }));
  });

  it('applies "More filters" through a validated form', async () => {
    const api = serveList();
    const { user } = renderRoute('/events');
    await screen.findByText('Amara Okafor');

    await user.click(screen.getByRole('button', { name: /More filters/ }));
    const correlation = await screen.findByLabelText('Correlation ID');
    await user.type(correlation, 'x'.repeat(129));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(
      await screen.findByText('Correlation ID must be at most 128 characters'),
    ).toBeInTheDocument();
    expect(correlation).toHaveAttribute('aria-invalid', 'true');

    await user.clear(correlation);
    await user.type(correlation, 'req_abc123');
    await user.type(screen.getByLabelText('Actor ID'), '  usr_456 ');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() =>
      expect(api.last()).toMatchObject({ correlationId: 'req_abc123', actorId: 'usr_456' }),
    );
    expect(screen.getByRole('button', { name: /More filters/ })).toHaveTextContent('2');
  });

  it('applies a date preset', async () => {
    const api = serveList();
    const { user } = renderRoute('/events');
    await screen.findByText('Amara Okafor');

    await user.click(screen.getByRole('button', { name: 'Any time' }));
    await user.click(await screen.findByRole('button', { name: 'Today' }));

    await waitFor(() => expect(api.last().dateFrom).toBeDefined());
    const from = new Date(api.last().dateFrom as string);
    const to = new Date(api.last().dateTo as string);
    expect(to.getTime() - from.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  describe('empty and error states', () => {
    it('explains that no events exist yet', async () => {
      serveList(() => buildAuditEventList([]));
      renderRoute('/events');

      expect(
        await screen.findByRole('heading', { name: 'No audit events yet' }),
      ).toBeInTheDocument();
      expect(screen.getByText('pnpm db:seed')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('offers to clear filters when nothing matches', async () => {
      const api = serveList((params) => buildAuditEventList(params.get('search') ? [] : EVENTS));
      const { user, router } = renderRoute('/events?search=nothing&limit=50');

      expect(
        await screen.findByRole('heading', { name: 'No events match these filters' }),
      ).toBeInTheDocument();
      // Both the chip row and the empty state offer "Clear filters"; use the empty state's call to action.
      const [, emptyStateButton] = screen.getAllByRole('button', { name: 'Clear filters' });
      await user.click(emptyStateButton as HTMLElement);

      expect(router.state.location.search).toBe('?limit=50');
      expect(await screen.findByText('Amara Okafor')).toBeInTheDocument();
      expect(api.last().search).toBeUndefined();
    });

    it('recovers from a page number past the end', async () => {
      const api = serveList((params) =>
        params.get('page') === '9'
          ? buildAuditEventList([], { page: 9, total: 45 })
          : buildAuditEventList(EVENTS, { page: Number(params.get('page')), total: 45 }),
      );
      const { user } = renderRoute('/events?page=9');

      expect(
        await screen.findByRole('heading', { name: 'This page is past the end of the results' }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Go to last page' }));
      await waitFor(() => expect(api.last().page).toBe('3'));
    });

    it('shows an error with the request id and retries', async () => {
      let fail = true;
      serveList(() =>
        fail
          ? HttpResponse.json(
              {
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'Internal server error',
                path: '/api/v1/audit-events',
                requestId: 'req-500',
                timestamp: '2026-11-05T12:00:00.000Z',
              },
              { status: 500 },
            )
          : buildAuditEventList(EVENTS),
      );
      const { user } = renderRoute('/events');

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Could not load audit events');
      expect(alert).toHaveTextContent('req-500');

      fail = false;
      await user.click(within(alert).getByRole('button', { name: 'Try again' }));
      expect(await screen.findByText('Amara Okafor')).toBeInTheDocument();
    });
  });
});
